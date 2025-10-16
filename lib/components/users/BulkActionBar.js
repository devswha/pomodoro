'use client';

import React from 'react';
import styled from 'styled-components';

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #ffffff;
  color: #000000;
  border: 2px solid #000000;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SelectedCount = styled.span`
  font-size: 0.875rem;
  color: #6c757d;
  margin-right: 0.5rem;
`;

export function BulkActionBar({ selectedCount, onActivate, onDeactivate, onDelete }) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <ActionBar>
      <SelectedCount>{selectedCount}명 선택됨</SelectedCount>
      <ActionButton type="button" onClick={onActivate}>
        Activate
      </ActionButton>
      <ActionButton type="button" onClick={onDeactivate}>
        Deactivate
      </ActionButton>
      <ActionButton type="button" onClick={onDelete}>
        Delete
      </ActionButton>
    </ActionBar>
  );
}

