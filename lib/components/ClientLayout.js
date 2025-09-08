'use client';

import styled from 'styled-components';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0;
`;

const AppContent = styled.div`
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
  background: #ffffff;
  position: relative;
  overflow: hidden;

  @media (min-width: 769px) {
    max-width: 1200px;
  }

  @media (min-width: 1200px) {
    max-width: 1400px;
  }
`;

export default function ClientLayout({ children }) {
  return (
    <AppContainer>
      <AppContent>
        {children}
      </AppContent>
    </AppContainer>
  );
}