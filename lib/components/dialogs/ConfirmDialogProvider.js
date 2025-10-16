'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Dialog = styled.div`
  background: #ffffff;
  border: 2px solid #000000;
  padding: 2rem;
  max-width: 360px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Description = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: #333333;
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const Button = styled.button`
  min-width: 100px;
  padding: 0.75rem 1.5rem;
  border: 2px solid #000000;
  background: ${props => props.$variant === 'primary' ? '#000000' : '#ffffff'};
  color: ${props => props.$variant === 'primary' ? '#ffffff' : '#000000'};
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${props => props.$variant === 'primary' ? '#333333' : '#f8f9fa'};
  }
`;

const ConfirmDialogContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '확인',
    cancelText: '취소',
    resolve: null,
    mode: 'confirm'
  });

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, []);

  const confirm = useCallback(({ title, description, confirmText, cancelText }) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        description,
        confirmText: confirmText || '확인',
        cancelText: cancelText || '취소',
        resolve,
        mode: 'confirm'
      });
    });
  }, []);

  const alert = useCallback((message) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: message,
        description: '',
        confirmText: '확인',
        cancelText: null,
        resolve,
        mode: 'alert'
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    closeDialog();
  }, [dialogState.resolve, closeDialog]);

  const handleCancel = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    closeDialog();
  }, [dialogState.resolve, closeDialog]);

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      {dialogState.isOpen && (
        <Overlay>
          <Dialog>
            <Title>{dialogState.title}</Title>
            {dialogState.description && <Description>{dialogState.description}</Description>}
            <Actions>
              {dialogState.mode === 'confirm' && (
                <Button type="button" onClick={handleCancel}>
                  {dialogState.cancelText}
                </Button>
              )}
              <Button type="button" $variant="primary" onClick={handleConfirm}>
                {dialogState.confirmText}
              </Button>
            </Actions>
          </Dialog>
        </Overlay>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog는 ConfirmDialogProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}

