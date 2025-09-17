/**
 * MCP Real-time Context Provider
 * 
 * Provides real-time data synchronization and presence features
 * using the SupabaseMCPManager for enhanced performance and monitoring.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase/client.js';

const MCPRealtimeContext = createContext({});

export const useMCPRealtime = () => {
  const context = useContext(MCPRealtimeContext);
  if (!context) {
    throw new Error('useMCPRealtime must be used within MCPRealtimeProvider');
  }
  return context;
};

export const MCPRealtimeProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [subscriptions, setSubscriptions] = useState(new Map());
  const [realtimeData, setRealtimeData] = useState({
    users: new Map(),
    sessions: new Map(),
    stats: new Map(),
    meetings: new Map(),
    presence: new Map()
  });
  const [presenceUsers, setPresenceUsers] = useState(new Map());
  const [updateQueue, setUpdateQueue] = useState([]);

  /**
   * Initialize MCP Real-time Connections
   */
  useEffect(() => {
    console.log('🔄 Initializing MCP Real-time connections...');
    initializeRealtimeConnections();

    return () => {
      console.log('🧹 Cleaning up real-time connections...');
      cleanupSubscriptions();
    };
  }, []);

  const initializeRealtimeConnections = async () => {
    try {
      setConnectionStatus('connecting');

      // Set up table subscriptions with MCP enhancements
      await setupTableSubscriptions();
      
      // Set up presence tracking
      await setupPresenceTracking();
      
      // Set up connection monitoring
      setupConnectionMonitoring();

      setConnectionStatus('connected');
      console.log('✅ MCP Real-time connections established');
    } catch (error) {
      console.error('❌ Real-time initialization failed:', error);
      setConnectionStatus('error');
    }
  };

  const setupTableSubscriptions = async () => {
    const tableConfigs = [
      {
        table: 'users',
        events: ['INSERT', 'UPDATE', 'DELETE'],
        filter: null
      },
      {
        table: 'user_stats',
        events: ['UPDATE'],
        filter: null
      },
      {
        table: 'pomodoro_sessions',
        events: ['INSERT', 'UPDATE', 'DELETE'],
        filter: null
      },
      {
        table: 'meetings',
        events: ['INSERT', 'UPDATE', 'DELETE'],
        filter: null
      },
      {
        table: 'user_preferences',
        events: ['UPDATE'],
        filter: null
      }
    ];

    for (const config of tableConfigs) {
      await createTableSubscription(config);
    }
  };

  const createTableSubscription = async (config) => {
    const { table, events, filter } = config;
    
    try {
      const channel = supabase.channel(`mcp_${table}_changes`);
      
      // Subscribe to specified events
      for (const event of events) {
        channel.on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            filter
          },
          (payload) => handleRealtimeUpdate(table, event, payload)
        );
      }

      const subscription = await channel.subscribe((status, err) => {
        console.log(`🔗 MCP subscription for ${table}: ${status}`);
        if (err) {
          console.error(`❌ Subscription error for ${table}:`, err);
        }
      });

      setSubscriptions(prev => new Map(prev.set(`${table}_changes`, subscription)));
      console.log(`📡 MCP subscription active for ${table}`);
    } catch (error) {
      console.error(`❌ Failed to create subscription for ${table}:`, error);
    }
  };

  const handleRealtimeUpdate = useCallback((table, event, payload) => {
    console.log(`📡 MCP Real-time update: ${table}.${event}`, payload);

    const updateEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      table,
      event,
      payload,
      processed: false
    };

    // Add to update queue for batch processing
    setUpdateQueue(prev => [...prev.slice(-99), updateEvent]); // Keep last 100 updates

    // Process update immediately
    processRealtimeUpdate(table, event, payload);
  }, []);

  const processRealtimeUpdate = (table, event, payload) => {
    const { new: newRecord, old: oldRecord } = payload;

    setRealtimeData(prev => {
      const updated = { ...prev };

      switch (table) {
        case 'users':
          if (event === 'DELETE') {
            updated.users.delete(oldRecord.id);
          } else {
            updated.users.set(newRecord.id, newRecord);
          }
          break;

        case 'user_stats':
          if (event === 'DELETE') {
            updated.stats.delete(oldRecord.user_id);
          } else {
            updated.stats.set(newRecord.user_id, newRecord);
          }
          break;

        case 'pomodoro_sessions':
          if (event === 'DELETE') {
            updated.sessions.delete(oldRecord.id);
          } else {
            updated.sessions.set(newRecord.id, newRecord);
          }
          break;

        case 'meetings':
          if (event === 'DELETE') {
            updated.meetings.delete(oldRecord.id);
          } else {
            updated.meetings.set(newRecord.id, newRecord);
          }
          break;
      }

      return updated;
    });

    // Emit custom events for specific update types
    emitCustomEvents(table, event, payload);
  };

  const emitCustomEvents = (table, event, payload) => {
    const customEvent = new CustomEvent('mcpRealtimeUpdate', {
      detail: { table, event, payload, timestamp: new Date().toISOString() }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(customEvent);
    }

    // Table-specific events
    if (table === 'pomodoro_sessions' && event === 'UPDATE') {
      const { new: session } = payload;
      if (session.status === 'completed') {
        const completionEvent = new CustomEvent('pomodoroCompleted', {
          detail: { session, timestamp: new Date().toISOString() }
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(completionEvent);
        }
      }
    }
  };

  /**
   * Presence Tracking with MCP Enhancement
   */
  const setupPresenceTracking = async () => {
    try {
      const presenceChannel = supabase.channel('mcp_presence', {
        config: {
          presence: {
            key: 'user_presence'
          }
        }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const newState = presenceChannel.presenceState();
          console.log('👥 Presence sync:', newState);
          updatePresenceState(newState);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('👋 User joined:', key, newPresences);
          updatePresenceState(presenceChannel.presenceState());
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('👋 User left:', key, leftPresences);
          updatePresenceState(presenceChannel.presenceState());
        });

      await presenceChannel.subscribe();
      setSubscriptions(prev => new Map(prev.set('presence', presenceChannel)));
      
      console.log('👥 MCP Presence tracking initialized');
    } catch (error) {
      console.error('❌ Presence setup failed:', error);
    }
  };

  const updatePresenceState = (state) => {
    const users = new Map();
    
    Object.entries(state).forEach(([key, presences]) => {
      presences.forEach(presence => {
        users.set(presence.user_id, {
          ...presence,
          lastSeen: new Date().toISOString()
        });
      });
    });

    setPresenceUsers(users);
  };

  const trackPresence = async (userId, metadata = {}) => {
    const presenceChannel = subscriptions.get('presence');
    if (presenceChannel) {
      await presenceChannel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
        ...metadata
      });
    }
  };

  const untrackPresence = async () => {
    const presenceChannel = subscriptions.get('presence');
    if (presenceChannel) {
      await presenceChannel.untrack();
    }
  };

  /**
   * Connection Monitoring
   */
  const setupConnectionMonitoring = () => {
    // Monitor connection status changes
    supabase.realtime.onOpen(() => {
      console.log('🔗 MCP Real-time connection opened');
      setConnectionStatus('connected');
    });

    supabase.realtime.onClose(() => {
      console.log('🔗 MCP Real-time connection closed');
      setConnectionStatus('disconnected');
    });

    supabase.realtime.onError((error) => {
      console.error('❌ MCP Real-time connection error:', error);
      setConnectionStatus('error');
    });

    // Periodic health checks
    const healthCheck = setInterval(() => {
      checkConnectionHealth();
    }, 30000);

    return () => clearInterval(healthCheck);
  };

  const checkConnectionHealth = () => {
    const activeSubscriptions = Array.from(subscriptions.values());
    const healthyConnections = activeSubscriptions.filter(
      sub => sub.state === 'SUBSCRIBED'
    ).length;

    console.log(`💚 MCP Health: ${healthyConnections}/${activeSubscriptions.length} subscriptions active`);
    
    if (healthyConnections === 0 && activeSubscriptions.length > 0) {
      setConnectionStatus('degraded');
    }
  };

  /**
   * Advanced Query Methods with Real-time Integration
   */
  const subscribeToUserData = useCallback((userId, callback) => {
    const unsubscribers = [];

    // Subscribe to user stats changes
    const handleStatsUpdate = (event) => {
      if (event.detail.table === 'user_stats' && 
          event.detail.payload.new?.user_id === userId) {
        callback('stats', event.detail.payload.new);
      }
    };

    // Subscribe to user sessions changes
    const handleSessionUpdate = (event) => {
      if (event.detail.table === 'pomodoro_sessions' && 
          event.detail.payload.new?.user_id === userId) {
        callback('sessions', event.detail.payload.new);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mcpRealtimeUpdate', handleStatsUpdate);
      window.addEventListener('mcpRealtimeUpdate', handleSessionUpdate);

      unsubscribers.push(() => {
        window.removeEventListener('mcpRealtimeUpdate', handleStatsUpdate);
        window.removeEventListener('mcpRealtimeUpdate', handleSessionUpdate);
      });
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const getRealtimeData = useCallback((table, id = null) => {
    const tableData = realtimeData[table];
    if (!tableData) return null;

    if (id) {
      return tableData.get(id);
    }

    return Array.from(tableData.values());
  }, [realtimeData]);

  /**
   * Cleanup
   */
  const cleanupSubscriptions = async () => {
    for (const [name, subscription] of subscriptions) {
      try {
        await subscription.unsubscribe();
        console.log(`🧹 Unsubscribed from ${name}`);
      } catch (error) {
        console.error(`❌ Error unsubscribing from ${name}:`, error);
      }
    }
    setSubscriptions(new Map());
  };

  const contextValue = {
    // Connection state
    connectionStatus,
    subscriptions: subscriptions.size,
    
    // Real-time data
    realtimeData,
    getRealtimeData,
    updateQueue,
    
    // Presence
    presenceUsers,
    trackPresence,
    untrackPresence,
    
    // Subscriptions
    subscribeToUserData,
    
    // Utilities
    reconnect: initializeRealtimeConnections,
    cleanup: cleanupSubscriptions
  };

  return (
    <MCPRealtimeContext.Provider value={contextValue}>
      {children}
    </MCPRealtimeContext.Provider>
  );
};

export default MCPRealtimeProvider;