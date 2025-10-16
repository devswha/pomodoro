'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { supabase } from '../supabase/client.js';

const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  sortBy: 'created_at'
};

const DEFAULT_PAGINATION = {
  currentPage: 1,
  perPage: 10
};

export function useUsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [selection, setSelection] = useState({ selectedIds: [] });
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(
          `*,
          user_stats (
            total_sessions,
            completed_sessions,
            total_minutes,
            completion_rate
          )`
        )
        .order(filters.sortBy, { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateFilters = useCallback((updates) => {
    setFilters(prev => ({ ...prev, ...updates }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const updatePagination = useCallback((updates) => {
    setPagination(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSelection = useCallback((updates) => {
    setSelection(prev => ({ ...prev, ...updates }));
  }, []);

  const bulkUpdateUserStatus = useCallback(async (isActive) => {
    if (selection.selectedIds.length === 0) return;

    await supabase
      .from('users')
      .update({ is_active: isActive })
      .in('id', selection.selectedIds);

    setSelection({ selectedIds: [] });
  }, [selection.selectedIds]);

  const bulkDeleteUsers = useCallback(async () => {
    if (selection.selectedIds.length === 0) return;

    await supabase
      .from('users')
      .delete()
      .in('id', selection.selectedIds);

    setSelection({ selectedIds: [] });
  }, [selection.selectedIds]);

  const contextValue = useMemo(() => ({
    filters,
    pagination,
    selection,
    users,
    loading,
    selectedUser,
    setSelectedUser,
    fetchUsers,
    updateFilters,
    updatePagination,
    updateSelection,
    bulkUpdateUserStatus,
    bulkDeleteUsers
  }), [
    filters,
    pagination,
    selection,
    users,
    loading,
    selectedUser,
    fetchUsers,
    updateFilters,
    updatePagination,
    updateSelection,
    bulkUpdateUserStatus,
    bulkDeleteUsers
  ]);

  return contextValue;
}

