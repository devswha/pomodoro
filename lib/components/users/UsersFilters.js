'use client';

import React from 'react';
import styled from 'styled-components';

const ControlsSection = styled.div`
  background: #ffffff;
  border: 2px solid #e9ecef;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 300px;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  background: #ffffff;
  font-size: 1rem;
  color: #000000;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #000000;
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6c757d;
`;

const FilterSelect = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  background: #ffffff;
  font-size: 1rem;
  color: #000000;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #000000;
  }
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${props => props.$variant === 'primary' ? '#000000' : '#ffffff'};
  color: ${props => props.$variant === 'primary' ? '#ffffff' : '#000000'};
  border: 2px solid #000000;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$variant === 'primary' ? '#333333' : '#f8f9fa'};
  }
`;

export function UsersFilters({
  filters,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onNavigateToPassword
}) {
  return (
    <ControlsSection>
      <SearchInput
        type="text"
        placeholder="Search by username, email, or name..."
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <FilterGroup>
        <FilterLabel>Status:</FilterLabel>
        <FilterSelect
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterSelect>
      </FilterGroup>

      <FilterGroup>
        <FilterLabel>Sort by:</FilterLabel>
        <FilterSelect
          value={filters.sortBy}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="created_at">Join Date</option>
          <option value="last_login">Last Login</option>
          <option value="username">Username</option>
        </FilterSelect>
      </FilterGroup>

      <ActionButton $variant="primary" type="button" onClick={onNavigateToPassword}>
        비밀번호 보기
      </ActionButton>
    </ControlsSection>
  );
}

