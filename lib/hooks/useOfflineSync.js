'use client';

/**
 * useOfflineSync - Offline-first functionality with intelligent sync queue
 * Handles offline operations, data persistence, and smart synchronization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';
import { useUser } from '../contexts/UserContext';
import { supabase, TABLES } from '../supabase/client';

export const useOfflineSync = () => {
  const { currentUser } = useUser();
  const { isOnline, isConnected, addToSyncQueue } = useRealtime();

  const [offlineQueue, setOfflineQueue] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'error', 'success'
  const [offlineData, setOfflineData] = useState({
    sessions: [],
    stats: null,
    meetings: [],
    preferences: null,
  });

  const [conflictQueue, setConflictQueue] = useState([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);
  const [syncMetrics, setSyncMetrics] = useState({
    totalOperations: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    conflictsResolved: 0,
  });

  const syncIntervalRef = useRef();
  const persistenceTimerRef = useRef();
  const maxRetries = 3;
  const syncInterval = 30000; // 30 seconds
  const persistenceInterval = 5000; // 5 seconds

  // Local storage helpers with compression
  const saveToLocalStorage = useCallback((key, data) => {
    try {
      const compressed = JSON.stringify(data);
      localStorage.setItem(`offline_${key}`, compressed);
      return true;
    } catch (error) {
      console.error('Failed to save offline data:', error);
      return false;
    }
  }, []);

  const loadFromLocalStorage = useCallback((key) => {
    try {
      const data = localStorage.getItem(`offline_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load offline data:', error);
      return null;
    }
  }, []);

  const removeFromLocalStorage = useCallback((key) => {
    try {
      localStorage.removeItem(`offline_${key}`);
      return true;
    } catch (error) {
      console.error('Failed to remove offline data:', error);
      return false;
    }
  }, []);

  // Queue management
  const addToOfflineQueue = useCallback((operation) => {
    const queueItem = {
      id: `offline_${Date.now()}_${Math.random()}`,
      ...operation,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
      priority: operation.priority || 1, // 1=low, 2=medium, 3=high
    };

    setOfflineQueue(prev => {
      const updated = [...prev, queueItem];
      // Sort by priority (high to low) then by timestamp (old to new)
      return updated.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });
    });

    // Persist queue to local storage
    saveToLocalStorage('queue', offlineQueue);

    return queueItem.id;
  }, [offlineQueue, saveToLocalStorage]);

  const removeFromQueue = useCallback((operationId) => {
    setOfflineQueue(prev => {
      const updated = prev.filter(op => op.id !== operationId);
      saveToLocalStorage('queue', updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  const updateQueueItem = useCallback((operationId, updates) => {
    setOfflineQueue(prev => {
      const updated = prev.map(op => 
        op.id === operationId ? { ...op, ...updates } : op
      );
      saveToLocalStorage('queue', updated);
      return updated;
    });
  }, [saveToLocalStorage]);

  // Offline operations
  const createOfflineSession = useCallback(async (sessionData) => {
    const session = {
      id: `offline_session_${Date.now()}`,
      user_id: currentUser.id,
      ...sessionData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      offline: true,
    };

    // Store locally immediately
    setOfflineData(prev => ({
      ...prev,
      sessions: [...prev.sessions, session],
    }));

    // Add to sync queue
    const queueId = addToOfflineQueue({
      type: 'INSERT',
      table: TABLES.POMODORO_SESSIONS,
      data: { ...session, offline: undefined }, // Remove offline flag for server
      localId: session.id,
      priority: 3, // High priority for active sessions
    });

    return { session, queueId };
  }, [currentUser, addToOfflineQueue]);

  const updateOfflineSession = useCallback(async (sessionId, updates) => {
    setOfflineData(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.id === sessionId
          ? { ...session, ...updates, updated_at: new Date().toISOString() }
          : session
      ),
    }));

    // Add to sync queue
    const queueId = addToOfflineQueue({
      type: 'UPDATE',
      table: TABLES.POMODORO_SESSIONS,
      id: sessionId,
      data: updates,
      priority: 2, // Medium priority for updates
    });

    return queueId;
  }, [addToOfflineQueue]);

  const updateOfflineStats = useCallback(async (statsUpdates) => {
    const updatedStats = {
      ...offlineData.stats,
      ...statsUpdates,
      updated_at: new Date().toISOString(),
    };

    setOfflineData(prev => ({
      ...prev,
      stats: updatedStats,
    }));

    // Add to sync queue with lower priority
    const queueId = addToOfflineQueue({
      type: 'UPDATE',
      table: TABLES.USER_STATS,
      id: currentUser.id,
      data: statsUpdates,
      priority: 1, // Low priority for stats
    });

    return queueId;
  }, [offlineData.stats, currentUser, addToOfflineQueue]);

  const createOfflineMeeting = useCallback(async (meetingData) => {
    const meeting = {
      id: `offline_meeting_${Date.now()}`,
      user_id: currentUser.id,
      ...meetingData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      offline: true,
    };

    setOfflineData(prev => ({
      ...prev,
      meetings: [...prev.meetings, meeting],
    }));

    const queueId = addToOfflineQueue({
      type: 'INSERT',
      table: TABLES.MEETINGS,
      data: { ...meeting, offline: undefined },
      localId: meeting.id,
      priority: 2,
    });

    return { meeting, queueId };
  }, [currentUser, addToOfflineQueue]);

  // Sync operations
  const executeQueueOperation = useCallback(async (operation) => {
    const { type, table, data, id, localId } = operation;

    try {
      let result;

      switch (type) {
        case 'INSERT':
          const { data: insertData, error: insertError } = await supabase
            .from(table)
            .insert(data)
            .select()
            .single();
          
          if (insertError) throw insertError;
          
          // Update local data with server ID
          if (localId && insertData) {
            updateLocalDataWithServerId(table, localId, insertData.id);
          }
          
          result = insertData;
          break;

        case 'UPDATE':
          const { data: updateData, error: updateError } = await supabase
            .from(table)
            .update(data)
            .eq('id', id)
            .select()
            .single();
          
          if (updateError) throw updateError;
          result = updateData;
          break;

        case 'DELETE':
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
          
          if (deleteError) throw deleteError;
          result = { deleted: true };
          break;

        default:
          throw new Error(`Unknown operation type: ${type}`);
      }

      return { success: true, data: result };

    } catch (error) {
      console.error('Sync operation failed:', error);
      
      // Check if it's a conflict error
      if (error.code === '23505' || error.message.includes('conflict')) {
        return { success: false, conflict: true, error };
      }
      
      return { success: false, error };
    }
  }, []);

  const updateLocalDataWithServerId = useCallback((table, localId, serverId) => {
    setOfflineData(prev => {
      const updated = { ...prev };
      
      switch (table) {
        case TABLES.POMODORO_SESSIONS:
          updated.sessions = updated.sessions.map(session =>
            session.id === localId 
              ? { ...session, id: serverId, offline: false }
              : session
          );
          break;
          
        case TABLES.MEETINGS:
          updated.meetings = updated.meetings.map(meeting =>
            meeting.id === localId
              ? { ...meeting, id: serverId, offline: false }
              : meeting
          );
          break;
      }
      
      return updated;
    });
  }, []);

  // Main sync process
  const processOfflineQueue = useCallback(async () => {
    if (!isOnline || !isConnected || offlineQueue.length === 0) {
      return;
    }

    setSyncStatus('syncing');

    const pendingOperations = offlineQueue.filter(op => op.status === 'pending');
    const results = {
      successful: 0,
      failed: 0,
      conflicts: 0,
    };

    for (const operation of pendingOperations) {
      try {
        updateQueueItem(operation.id, { status: 'syncing' });

        const result = await executeQueueOperation(operation);

        if (result.success) {
          removeFromQueue(operation.id);
          results.successful++;
        } else if (result.conflict) {
          // Handle conflict
          const conflictItem = {
            id: `conflict_${Date.now()}`,
            operation,
            error: result.error,
            timestamp: Date.now(),
          };
          
          setConflictQueue(prev => [...prev, conflictItem]);
          updateQueueItem(operation.id, { status: 'conflict' });
          results.conflicts++;
        } else {
          // Increment retry count
          const newRetries = operation.retries + 1;
          
          if (newRetries >= maxRetries) {
            updateQueueItem(operation.id, { 
              status: 'failed',
              error: result.error.message,
            });
            results.failed++;
          } else {
            updateQueueItem(operation.id, {
              status: 'pending',
              retries: newRetries,
              lastError: result.error.message,
            });
          }
        }
      } catch (error) {
        console.error('Queue processing error:', error);
        updateQueueItem(operation.id, { 
          status: 'error',
          error: error.message,
        });
        results.failed++;
      }

      // Small delay between operations to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setSyncStatus(results.failed > 0 ? 'error' : 'success');
    setLastSyncTimestamp(Date.now());
    
    // Update metrics
    setSyncMetrics(prev => ({
      totalOperations: prev.totalOperations + pendingOperations.length,
      successfulSyncs: prev.successfulSyncs + results.successful,
      failedSyncs: prev.failedSyncs + results.failed,
      conflictsResolved: prev.conflictsResolved + results.conflicts,
    }));

  }, [isOnline, isConnected, offlineQueue, updateQueueItem, executeQueueOperation, removeFromQueue]);

  // Conflict resolution
  const resolveConflict = useCallback(async (conflictId, resolution) => {
    const conflict = conflictQueue.find(c => c.id === conflictId);
    if (!conflict) return;

    try {
      switch (resolution) {
        case 'retry':
          // Retry the original operation
          updateQueueItem(conflict.operation.id, { 
            status: 'pending',
            retries: 0,
          });
          break;

        case 'skip':
          // Skip this operation
          removeFromQueue(conflict.operation.id);
          break;

        case 'force':
          // Force the operation (use different endpoint or merge strategy)
          // Implementation depends on specific conflict type
          break;
      }

      setConflictQueue(prev => prev.filter(c => c.id !== conflictId));

    } catch (error) {
      console.error('Conflict resolution failed:', error);
    }
  }, [conflictQueue, updateQueueItem, removeFromQueue]);

  // Data fetching for offline use
  const fetchAndCacheData = useCallback(async () => {
    if (!currentUser || !isOnline || !isConnected) return;

    try {
      // Fetch recent sessions
      const { data: sessions } = await supabase
        .from(TABLES.POMODORO_SESSIONS)
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch user stats
      const { data: stats } = await supabase
        .from(TABLES.USER_STATS)
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      // Fetch upcoming meetings
      const { data: meetings } = await supabase
        .from(TABLES.MEETINGS)
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('date', new Date().toISOString().split('T')[0]);

      const cachedData = {
        sessions: sessions || [],
        stats,
        meetings: meetings || [],
        lastCached: Date.now(),
      };

      setOfflineData(cachedData);
      saveToLocalStorage('data', cachedData);

    } catch (error) {
      console.error('Failed to fetch and cache data:', error);
    }
  }, [currentUser, isOnline, isConnected, saveToLocalStorage]);

  // Initialize offline data
  const initializeOfflineData = useCallback(() => {
    if (!currentUser) return;

    // Load cached data
    const cachedData = loadFromLocalStorage('data');
    if (cachedData) {
      setOfflineData(cachedData);
    }

    // Load cached queue
    const cachedQueue = loadFromLocalStorage('queue');
    if (cachedQueue && Array.isArray(cachedQueue)) {
      setOfflineQueue(cachedQueue);
    }

    // Load sync metrics
    const cachedMetrics = loadFromLocalStorage('metrics');
    if (cachedMetrics) {
      setSyncMetrics(cachedMetrics);
    }

  }, [currentUser, loadFromLocalStorage]);

  // Periodic data persistence
  const persistDataPeriodically = useCallback(() => {
    if (persistenceTimerRef.current) {
      clearInterval(persistenceTimerRef.current);
    }

    persistenceTimerRef.current = setInterval(() => {
      saveToLocalStorage('data', offlineData);
      saveToLocalStorage('queue', offlineQueue);
      saveToLocalStorage('metrics', syncMetrics);
    }, persistenceInterval);
  }, [offlineData, offlineQueue, syncMetrics, saveToLocalStorage]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && isConnected) {
      // Initial sync
      processOfflineQueue();
      
      // Set up periodic sync
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      syncIntervalRef.current = setInterval(processOfflineQueue, syncInterval);
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline, isConnected, processOfflineQueue]);

  // Initialize and fetch data when user is available
  useEffect(() => {
    if (currentUser) {
      initializeOfflineData();
      persistDataPeriodically();
      
      if (isOnline && isConnected) {
        fetchAndCacheData();
      }
    }
  }, [currentUser, initializeOfflineData, persistDataPeriodically, fetchAndCacheData, isOnline, isConnected]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (persistenceTimerRef.current) {
        clearInterval(persistenceTimerRef.current);
      }
    };
  }, []);

  return {
    // Offline data
    offlineData,
    
    // Queue management
    offlineQueue,
    addToOfflineQueue,
    removeFromQueue,
    updateQueueItem,
    
    // Sync operations
    syncStatus,
    processOfflineQueue,
    lastSyncTimestamp,
    syncMetrics,
    
    // Offline operations
    createOfflineSession,
    updateOfflineSession,
    updateOfflineStats,
    createOfflineMeeting,
    
    // Conflict resolution
    conflictQueue,
    resolveConflict,
    
    // Utilities
    isOnline,
    isConnected,
    fetchAndCacheData,
  };
};

export default useOfflineSync;