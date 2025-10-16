'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../contexts/UserContext';

const NavigationContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top: 2px solid #e9ecef;
  padding: 0.75rem 1rem;
  z-index: 100;
  backdrop-filter: blur(10px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #000000, #6c757d, #000000);
    opacity: 0.1;
  }
  
  @media (min-width: 769px) {
    position: static;
    border-top: none;
    border-bottom: 2px solid #e9ecef;
    padding: 1rem 2rem;
    backdrop-filter: none;
    box-shadow: none;
    
    &::before {
      display: none;
    }
  }
`;

const NavGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => props.hasAdmin ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)'};
  gap: 0.5rem;
  max-width: ${props => props.hasAdmin ? '720px' : '600px'};
  margin: 0 auto;

  @media (min-width: 769px) {
    display: flex;
    justify-content: center;
    gap: 2rem;
    max-width: none;
  }
`;

const NavItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: ${props => props.active ? '#000000' : '#6c757d'};
  font-weight: ${props => props.active ? '600' : '400'};
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: #000000;
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }
  
  ${props => props.active && `
    &::before {
      width: 20px;
    }
  `}
  
  &:hover {
    color: #000000;
    background: rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
    
    &::before {
      width: 20px;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (min-width: 769px) {
    flex-direction: row;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    
    &::before {
      display: none;
    }
    
    &:hover {
      background: #f8f9fa;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    ${props => props.active && `
      background: #000000;
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      
      &:hover {
        background: #333333;
        color: #ffffff;
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
      }
    `}
  }
`;

const NavIcon = styled.span`
  font-size: 1.25rem;
  line-height: 1;
  
  @media (min-width: 769px) {
    font-size: 1rem;
  }
`;

const NavLabel = styled.span`
  font-size: 0.625rem;
  font-weight: inherit;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  @media (min-width: 769px) {
    font-size: 0.875rem;
  }
`;

const Breadcrumb = styled.div`
  display: none;
  
  @media (min-width: 769px) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    font-size: 0.875rem;
    color: #6c757d;
  }
`;

const BreadcrumbLink = styled.button`
  background: none;
  border: none;
  color: #000000;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  
  &:hover {
    opacity: 0.7;
  }
`;

const BreadcrumbSeparator = styled.span`
  color: #adb5bd;
  font-weight: 400;
`;

const BreadcrumbCurrent = styled.span`
  color: #000000;
  font-weight: 600;
`;

// Spacer to prevent content from being hidden behind fixed nav on mobile
export const NavSpacer = styled.div`
  height: 80px;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const navigationItems = [
  {
    path: '/main',
    icon: '🏠',
    label: '홈',
    breadcrumb: '대시보드'
  },
  {
    path: '/step-start',
    icon: '⏰',
    label: '시작',
    breadcrumb: 'STEP 시작'
  },
  {
    path: '/meetings',
    icon: '📅',
    label: '모임',
    breadcrumb: '모임 일정'
  },
  {
    path: '/step-ranking',
    icon: '🏆',
    label: '랭킹',
    breadcrumb: 'STEP 랭킹'
  },
  {
    path: '/mypage',
    icon: '👤',
    label: '마이',
    breadcrumb: '내 정보'
  }
];

const getBreadcrumbPath = (pathname) => {
  const paths = [
    { path: '/main', label: '대시보드' },
    { path: '/step-start', label: 'STEP 시작' },
    { path: '/meetings', label: '모임 일정' },
    { path: '/step-ranking', label: 'STEP 랭킹' },
    { path: '/mypage', label: '내 정보' },
    { path: '/admin', label: '회원 관리' },
    { path: '/monthly', label: '월별 통계' },
    { path: '/full-schedule', label: '전체 일정' },
    { path: '/onboarding', label: '사용법' },
    { path: '/dashboard-onboarding', label: '온보딩' }
  ];
  
  const currentPath = paths.find(p => p.path === pathname);
  return currentPath ? currentPath.label : '페이지';
};

export default function Navigation({ showBreadcrumb = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useUser();

  if (!currentUser) {
    return null;
  }

  // 관리자 권한 체크
  const isAdmin = () => {
    const adminUsernames = ['admin', 'test']; // 임시로 test 사용자도 관리자로 설정
    return adminUsernames.includes(currentUser?.username);
  };
  
  const handleNavigation = (path) => {
    if (pathname !== path) {
      router.push(path);
    }
  };
  
  const handleBreadcrumbHome = () => {
    if (pathname !== '/main') {
      router.push('/main');
    }
  };
  
  return (
    <>
      {showBreadcrumb && pathname !== '/main' && (
        <Breadcrumb>
          <BreadcrumbLink onClick={handleBreadcrumbHome}>
            홈
          </BreadcrumbLink>
          <BreadcrumbSeparator>›</BreadcrumbSeparator>
          <BreadcrumbCurrent>{getBreadcrumbPath(pathname)}</BreadcrumbCurrent>
        </Breadcrumb>
      )}
      
      <NavigationContainer>
        <NavGrid hasAdmin={isAdmin()}>
          {navigationItems.map((item) => (
            <NavItem
              key={item.path}
              active={pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <NavIcon>{item.icon}</NavIcon>
              <NavLabel>{item.label}</NavLabel>
            </NavItem>
          ))}
          {isAdmin() && (
            <NavItem
              key="/admin"
              active={pathname.startsWith('/admin')}
              onClick={() => handleNavigation('/admin')}
            >
              <NavIcon>⚙️</NavIcon>
              <NavLabel>관리</NavLabel>
            </NavItem>
          )}
        </NavGrid>
      </NavigationContainer>
    </>
  );
}