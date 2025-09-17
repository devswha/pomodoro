'use client';

/**
 * useNotifications - Real-time notification system
 * Handles push notifications, meeting reminders, and system alerts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';
import { useUser } from '../contexts/UserContext';

export const useNotifications = () => {
  const { currentUser } = useUser();
  const {
    notifications,
    addNotification,
    markNotificationAsRead,
    clearNotifications,
    isConnected,
  } = useRealtime();

  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    soundEnabled: true,
    sessionReminders: true,
    meetingReminders: true,
    achievementAlerts: true,
    socialNotifications: true,
    breakReminders: true,
    streakReminders: true,
    weeklyGoalReminders: true,
  });

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [soundSettings, setSoundSettings] = useState({
    volume: 0.7,
    sessionComplete: '/sounds/session-complete.mp3',
    breakTime: '/sounds/break-time.mp3',
    reminder: '/sounds/reminder.mp3',
    achievement: '/sounds/achievement.mp3',
    notification: '/sounds/notification.mp3',
  });

  const [permissionStatus, setPermissionStatus] = useState('default');
  const audioContextRef = useRef();
  const scheduledNotificationsRef = useRef(new Map());
  const notificationQueueRef = useRef([]);

  // Initialize notification system
  const initializeNotifications = useCallback(async () => {
    // Check for notification API support
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    // Check current permission
    setPermissionStatus(Notification.permission);

    // Initialize audio context for sounds
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }

    // Load user notification preferences
    const savedSettings = localStorage.getItem(`notifications_${currentUser?.id}`);
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }

    // Resume any scheduled notifications from previous session
    await resumeScheduledNotifications();

  }, [currentUser]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    
    return permission === 'granted';
  }, []);

  // Create and show notification
  const showNotification = useCallback(async (title, options = {}) => {
    if (!notificationSettings.pushEnabled || permissionStatus !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        body: options.body || '',
        icon: options.icon || '/icons/pomodoro-icon-192.png',
        badge: '/icons/badge-72.png',
        tag: options.tag || 'pomodoro',
        silent: !notificationSettings.soundEnabled,
        timestamp: Date.now(),
        requireInteraction: options.requireInteraction || false,
        actions: options.actions || [],
        data: options.data || {},
        ...options,
      });

      // Handle notification clicks
      notification.onclick = () => {
        window.focus();
        if (options.onClick) {
          options.onClick();
        }
        notification.close();
      };

      // Auto-close after delay
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, options.duration || 5000);
      }

      return notification;

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }, [notificationSettings, permissionStatus]);

  // Play notification sounds
  const playNotificationSound = useCallback(async (soundType = 'notification') => {
    if (!notificationSettings.soundEnabled || !audioContextRef.current) {
      return;
    }

    try {
      const soundUrl = soundSettings[soundType];
      if (!soundUrl) return;

      // Simple audio playback
      const audio = new Audio(soundUrl);
      audio.volume = soundSettings.volume;
      await audio.play();

    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, [notificationSettings.soundEnabled, soundSettings]);

  // Schedule future notifications
  const scheduleNotification = useCallback((scheduledTime, title, options = {}) => {
    const now = Date.now();
    const delay = scheduledTime - now;

    if (delay <= 0) {
      // Show immediately
      showNotification(title, options);
      return null;
    }

    const timeoutId = setTimeout(() => {
      showNotification(title, options);
      playNotificationSound(options.soundType);
      scheduledNotificationsRef.current.delete(timeoutId);
    }, delay);

    // Store for persistence
    const scheduleData = {
      id: timeoutId,
      scheduledTime,
      title,
      options,
    };

    scheduledNotificationsRef.current.set(timeoutId, scheduleData);
    
    // Save to localStorage for persistence
    const allScheduled = Array.from(scheduledNotificationsRef.current.values());
    localStorage.setItem(`scheduled_notifications_${currentUser?.id}`, JSON.stringify(allScheduled));

    return timeoutId;
  }, [showNotification, playNotificationSound, currentUser]);

  const cancelScheduledNotification = useCallback((timeoutId) => {
    clearTimeout(timeoutId);
    scheduledNotificationsRef.current.delete(timeoutId);
    
    // Update localStorage
    const allScheduled = Array.from(scheduledNotificationsRef.current.values());
    localStorage.setItem(`scheduled_notifications_${currentUser?.id}`, JSON.stringify(allScheduled));
  }, [currentUser]);

  const resumeScheduledNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      const savedScheduled = localStorage.getItem(`scheduled_notifications_${currentUser.id}`);
      if (!savedScheduled) return;

      const scheduled = JSON.parse(savedScheduled);
      const now = Date.now();

      scheduled.forEach(item => {
        if (item.scheduledTime > now) {
          // Reschedule future notifications
          scheduleNotification(item.scheduledTime, item.title, item.options);
        }
      });

    } catch (error) {
      console.error('Failed to resume scheduled notifications:', error);
    }
  }, [currentUser, scheduleNotification]);

  // Specialized notification types
  const sessionCompleteNotification = useCallback(async (session) => {
    if (!notificationSettings.sessionReminders) return;

    await showNotification('Pomodoro Complete! 🍅', {
      body: `Great job! You completed "${session.title}". Time for a break!`,
      tag: 'session-complete',
      requireInteraction: true,
      actions: [
        { action: 'break', title: 'Take Break' },
        { action: 'continue', title: 'Continue Working' },
      ],
      data: { sessionId: session.id, type: 'session_complete' },
      soundType: 'sessionComplete',
    });

    await playNotificationSound('sessionComplete');

    // Add to internal notification system
    addNotification({
      type: 'session_complete',
      title: 'Session Complete!',
      message: `You completed "${session.title}"`,
      session,
      timestamp: new Date().toISOString(),
      actions: ['break', 'continue'],
    });
  }, [notificationSettings.sessionReminders, showNotification, playNotificationSound, addNotification]);

  const breakTimeNotification = useCallback(async (breakDuration = 5) => {
    if (!notificationSettings.breakReminders) return;

    await showNotification('Break Time! ☕', {
      body: `Take a ${breakDuration}-minute break. You've earned it!`,
      tag: 'break-time',
      data: { type: 'break_time', duration: breakDuration },
      soundType: 'breakTime',
    });

    await playNotificationSound('breakTime');
  }, [notificationSettings.breakReminders, showNotification, playNotificationSound]);

  const meetingReminderNotification = useCallback(async (meeting, minutesUntil) => {
    if (!notificationSettings.meetingReminders) return;

    const title = minutesUntil <= 0 ? 'Meeting Starting Now!' : `Meeting in ${minutesUntil} minutes`;
    const urgencyLevel = minutesUntil <= 5 ? 'urgent' : 'normal';

    await showNotification(title, {
      body: `"${meeting.title}" ${minutesUntil <= 0 ? 'is starting now' : `starts in ${minutesUntil} minutes`}`,
      tag: `meeting-${meeting.id}`,
      requireInteraction: minutesUntil <= 0,
      data: { 
        type: 'meeting_reminder', 
        meetingId: meeting.id,
        urgency: urgencyLevel,
      },
      soundType: 'reminder',
    });

    await playNotificationSound('reminder');

    addNotification({
      type: 'meeting_reminder',
      title,
      message: `"${meeting.title}" meeting reminder`,
      meeting,
      minutesUntil,
      timestamp: new Date().toISOString(),
    });
  }, [notificationSettings.meetingReminders, showNotification, playNotificationSound, addNotification]);

  const achievementNotification = useCallback(async (achievement) => {
    if (!notificationSettings.achievementAlerts) return;

    await showNotification(`Achievement Unlocked! ${achievement.icon}`, {
      body: `${achievement.title}: ${achievement.description}`,
      tag: 'achievement',
      data: { type: 'achievement', achievementId: achievement.id },
      soundType: 'achievement',
    });

    await playNotificationSound('achievement');

    addNotification({
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: `${achievement.title}: ${achievement.description}`,
      achievement,
      timestamp: new Date().toISOString(),
    });
  }, [notificationSettings.achievementAlerts, showNotification, playNotificationSound, addNotification]);

  const streakReminderNotification = useCallback(async (streakDays) => {
    if (!notificationSettings.streakReminders) return;

    await showNotification(`${streakDays}-Day Streak! 🔥`, {
      body: 'Keep your focus streak alive! Start a session today.',
      tag: 'streak-reminder',
      data: { type: 'streak_reminder', streakDays },
    });

    addNotification({
      type: 'streak_reminder',
      title: 'Maintain Your Streak',
      message: `You have a ${streakDays}-day streak. Don't break it!`,
      streakDays,
      timestamp: new Date().toISOString(),
    });
  }, [notificationSettings.streakReminders, showNotification, addNotification]);

  const weeklyGoalReminderNotification = useCallback(async (progress, goal) => {
    if (!notificationSettings.weeklyGoalReminders) return;

    const remaining = goal - progress;
    const percentage = Math.round((progress / goal) * 100);

    await showNotification('Weekly Goal Progress 📊', {
      body: `${percentage}% complete. ${remaining} minutes to go!`,
      tag: 'weekly-goal',
      data: { type: 'weekly_goal', progress, goal, percentage },
    });

    addNotification({
      type: 'weekly_goal',
      title: 'Weekly Goal Progress',
      message: `${percentage}% complete. ${remaining} minutes remaining.`,
      progress,
      goal,
      percentage,
      timestamp: new Date().toISOString(),
    });
  }, [notificationSettings.weeklyGoalReminders, showNotification, addNotification]);

  const socialNotification = useCallback(async (type, data) => {
    if (!notificationSettings.socialNotifications) return;

    const messages = {
      study_invitation: `${data.username} invited you to study together`,
      buddy_online: `Your study buddy ${data.username} is online`,
      room_joined: `${data.username} joined your study room`,
      challenge_invitation: `${data.username} challenged you to a focus challenge`,
    };

    await showNotification('Social Update 👥', {
      body: messages[type] || 'Social notification',
      tag: 'social',
      data: { type: 'social', socialType: type, ...data },
    });

    addNotification({
      type: 'social',
      socialType: type,
      title: 'Social Update',
      message: messages[type] || 'Social notification',
      data,
      timestamp: new Date().toISOString(),
    });
  }, [notificationSettings.socialNotifications, showNotification, addNotification]);

  // Batch notification processing to prevent spam
  const processBatchNotifications = useCallback(async () => {
    const queue = [...notificationQueueRef.current];
    notificationQueueRef.current = [];

    if (queue.length === 0) return;

    // Group similar notifications
    const grouped = queue.reduce((acc, notification) => {
      const key = `${notification.type}_${notification.tag || 'default'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(notification);
      return acc;
    }, {});

    // Process each group
    for (const [key, notifications] of Object.entries(grouped)) {
      if (notifications.length === 1) {
        // Single notification
        const notif = notifications[0];
        await showNotification(notif.title, notif.options);
      } else {
        // Multiple notifications - create summary
        const type = notifications[0].type;
        await showNotification(`${notifications.length} ${type} notifications`, {
          body: 'Tap to view all notifications',
          tag: 'batch',
          data: { type: 'batch', notifications },
        });
      }
    }
  }, [showNotification]);

  const queueNotification = useCallback((title, options = {}) => {
    notificationQueueRef.current.push({ title, options, type: options.type || 'general' });
  }, []);

  // Settings management
  const updateNotificationSettings = useCallback((updates) => {
    setNotificationSettings(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem(`notifications_${currentUser?.id}`, JSON.stringify(newSettings));
      return newSettings;
    });
  }, [currentUser]);

  const updateSoundSettings = useCallback((updates) => {
    setSoundSettings(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem(`sound_settings_${currentUser?.id}`, JSON.stringify(newSettings));
      return newSettings;
    });
  }, [currentUser]);

  // Test notifications
  const testNotification = useCallback(async () => {
    await showNotification('Test Notification 🧪', {
      body: 'This is a test notification to check if everything works correctly.',
      tag: 'test',
      soundType: 'notification',
    });
    
    await playNotificationSound('notification');
  }, [showNotification, playNotificationSound]);

  // Initialize when user is available
  useEffect(() => {
    if (currentUser) {
      initializeNotifications();
    }
  }, [currentUser, initializeNotifications]);

  // Process notification queue periodically
  useEffect(() => {
    const interval = setInterval(processBatchNotifications, 2000);
    return () => clearInterval(interval);
  }, [processBatchNotifications]);

  // Cleanup scheduled notifications on unmount
  useEffect(() => {
    return () => {
      scheduledNotificationsRef.current.forEach((_, timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  return {
    // Notification state
    notifications,
    activeAlerts,
    permissionStatus,
    
    // Settings
    notificationSettings,
    soundSettings,
    updateNotificationSettings,
    updateSoundSettings,
    
    // Permission management
    requestPermission,
    
    // Basic notifications
    showNotification,
    playNotificationSound,
    queueNotification,
    
    // Scheduling
    scheduleNotification,
    cancelScheduledNotification,
    
    // Specialized notifications
    sessionCompleteNotification,
    breakTimeNotification,
    meetingReminderNotification,
    achievementNotification,
    streakReminderNotification,
    weeklyGoalReminderNotification,
    socialNotification,
    
    // Management
    markNotificationAsRead,
    clearNotifications,
    testNotification,
    
    // Connection state
    isConnected,
  };
};

export default useNotifications;