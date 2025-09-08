import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MainPage from './pages/MainPage';
import PomodoroStartPage from './pages/PomodoroStartPage';
import PomodoroRankingPage from './pages/PomodoroRankingPage';
import MyPage from './pages/MyPage';
import MonthlyPage from './pages/MonthlyPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardOnboardingPage from './pages/DashboardOnboardingPage';
import FullSchedulePage from './pages/FullSchedulePage';
import { useUser } from './contexts/UserContext';

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

function App() {
  const { currentUser } = useUser();

  return (
    <AppContainer>
      <AppContent>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route 
            path="/main" 
            element={currentUser ? <MainPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/pomodoro-start" 
            element={currentUser ? <PomodoroStartPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/pomodoro-ranking" 
            element={currentUser ? <PomodoroRankingPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/mypage" 
            element={currentUser ? <MyPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/monthly" 
            element={currentUser ? <MonthlyPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/onboarding" 
            element={currentUser ? <OnboardingPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/dashboard-onboarding" 
            element={currentUser ? <DashboardOnboardingPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/full-schedule" 
            element={currentUser ? <FullSchedulePage /> : <Navigate to="/login" />} 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AppContent>
    </AppContainer>
  );
}

export default App;