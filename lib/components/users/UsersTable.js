'use client';

import React from 'react';
import styled from 'styled-components';

const TableContainer = styled.div`
  background: #ffffff;
  border: 2px solid #e9ecef;
  overflow-x: auto;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 40px 2fr 1.5fr 1fr 1fr 1fr 1fr 100px;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 2px solid #e9ecef;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #000000;
  align-items: center;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 40px 2fr 1.5fr 1fr 1fr 1fr 1fr 100px;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  align-items: center;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const UserInfo = styled.button`
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
  text-align: left;
`;

const Username = styled.span`
  font-weight: 600;
  color: #000000;
`;

const Email = styled.span`
  font-size: 0.875rem;
  color: #6c757d;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: ${props => props.$active ? '#d4edda' : '#f8d7da'};
  color: ${props => props.$active ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.$active ? '#c3e6cb' : '#f5c6cb'};
`;

const ActionMenu = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  background: none;
  border: 1px solid #e9ecef;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:hover {
    background: #000000;
    color: #ffffff;
    border-color: #000000;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-top: 2px solid #e9ecef;
`;

const PaginationInfo = styled.span`
  font-size: 0.875rem;
  color: #6c757d;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  background: #ffffff;
  border: 1px solid #e9ecef;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #000000;
    color: #ffffff;
    border-color: #000000;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.active {
    background: #000000;
    color: #ffffff;
    border-color: #000000;
  }
`;

const EmptyState = styled.div`
  padding: 4rem 2rem;
  text-align: center;
  color: #6c757d;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 1rem;
  color: #6c757d;
`;

function formatDate(dateString) {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString();
}

export function UsersTable({
  loading,
  users,
  totalUsers,
  pagination,
  onPageChange,
  onSelectAll,
  onSelectUser,
  onViewUser,
  selectedIds = [],
  allSelected = false
}) {
  if (loading) {
    return (
      <TableContainer>
        <LoadingState>Loading users...</LoadingState>
      </TableContainer>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalUsers / pagination.perPage));
  const startIndex = (pagination.currentPage - 1) * pagination.perPage + 1;
  const endIndex = Math.min(startIndex + pagination.perPage - 1, totalUsers);

  return (
    <TableContainer>
      <TableHeader>
        <Checkbox
          type="checkbox"
          onChange={(event) => onSelectAll(event.target.checked)}
          checked={allSelected && totalUsers > 0}
        />
        <div>User</div>
        <div>Email</div>
        <div>Joined</div>
        <div>Last Login</div>
        <div>Sessions</div>
        <div>Status</div>
        <div>Actions</div>
      </TableHeader>

      {users.length > 0 ? (
        users.map(user => (
          <TableRow key={user.id}>
            <Checkbox
              type="checkbox"
              checked={selectedIds.includes(user.id)}
              onChange={(event) => onSelectUser(user.id, event.target.checked)}
            />
            <UserInfo type="button" onClick={() => onViewUser(user)}>
              <Username>{user.display_name || user.username}</Username>
              <Email>@{user.username}</Email>
            </UserInfo>
            <div>{user.email}</div>
            <div>{formatDate(user.created_at)}</div>
            <div>{formatDate(user.last_login)}</div>
            <div>{user.user_stats?.[0]?.total_sessions || 0}</div>
            <div>
              <StatusBadge $active={user.is_active}>
                {user.is_active ? 'Active' : 'Inactive'}
              </StatusBadge>
            </div>
            <ActionMenu>
              <IconButton type="button" onClick={() => onViewUser(user)}>
                👁️
              </IconButton>
              <IconButton type="button" onClick={() => console.log('Edit user', user.id)}>
                ✏️
              </IconButton>
            </ActionMenu>
          </TableRow>
        ))
      ) : (
        <EmptyState>
          사용자가 없습니다.
        </EmptyState>
      )}

      {totalUsers > pagination.perPage && (
        <Pagination>
          <PaginationInfo>
            Showing {startIndex}-{endIndex} of {totalUsers} users
          </PaginationInfo>
          <PaginationButtons>
            <PaginationButton
              type="button"
              disabled={pagination.currentPage === 1}
              onClick={() => onPageChange(pagination.currentPage - 1)}
            >
              Previous
            </PaginationButton>
            {[...Array(totalPages)].map((_, index) => (
              <PaginationButton
                type="button"
                key={index + 1}
                className={pagination.currentPage === index + 1 ? 'active' : ''}
                onClick={() => onPageChange(index + 1)}
              >
                {index + 1}
              </PaginationButton>
            ))}
            <PaginationButton
              type="button"
              disabled={pagination.currentPage === totalPages}
              onClick={() => onPageChange(pagination.currentPage + 1)}
            >
              Next
            </PaginationButton>
          </PaginationButtons>
        </Pagination>
      )}
    </TableContainer>
  );
}

