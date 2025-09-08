'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';

const StartContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--background-secondary);
`;

const AppHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--background-primary);
  border-bottom: 1px solid var(--gray-5);
`;

const HeaderButton = styled.button`
  background: none;
  border: none;
  color: var(--primary-blue);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
  min-width: 60px;

  &:hover {
    opacity: 0.7;
  }

  &:disabled {
    color: var(--text-secondary);
    cursor: not-allowed;
  }
`;

const AppTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (min-width: 769px) {
    padding: 30px;
    gap: 32px;
  }
`;

const PomodoroInputSection = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 20px;
  box-shadow: var(--shadow-small);
`;

const SectionLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--gray-6);
  
  &:last-child {
    border-bottom: none;
  }
`;

const InputLabel = styled.label`
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  width: 80px;
  min-width: 80px;
  margin-right: 16px;
`;

const TimeSelection = styled.div`
  display: flex;
  gap: 8px;
  flex: 1;
`;

const DateTimeButton = styled.button`
  background: var(--gray-6);
  border: none;
  border-radius: var(--border-radius-medium);
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-fast);
  flex: 1;

  &:hover {
    background: var(--gray-5);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const InputFieldWrapper = styled.div`
  flex: 1;
`;

const InputField = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  font-size: 16px;
  color: var(--text-primary);
  padding: 8px 0;

  &::placeholder {
    color: var(--text-tertiary);
  }

  &:focus {
    outline: none;
  }
`;

const SettingsSection = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 20px;
  box-shadow: var(--shadow-small);
  display: flex;
  flex-direction: column;
  gap: 16px;
`;


const ToggleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
`;

const ToggleLabel = styled.label`
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
`;

const ToggleSwitch = styled.button`
  width: 52px;
  height: 32px;
  background: ${props => props.active ? 'var(--primary-blue)' : 'var(--gray-4)'};
  border: none;
  border-radius: 16px;
  position: relative;
  cursor: pointer;
  transition: var(--transition-medium);
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
  }
`;

const ToggleSlider = styled.div`
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: ${props => props.active ? '22px' : '2px'};
  transition: var(--transition-medium);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const DurationPicker = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const DurationButton = styled.button`
  background: ${props => props.active ? 'var(--primary-blue)' : 'var(--gray-6)'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  border: none;
  border-radius: var(--border-radius-medium);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    background: ${props => props.active ? '#0056CC' : 'var(--gray-5)'};
  }
`;

const BottomSection = styled.div`
  padding: 20px;
  background: var(--background-primary);
  border-top: 1px solid var(--gray-5);
  margin-top: auto;
`;

const StartButton = styled.button`
  width: 100%;
  height: 56px;
  background: var(--primary-blue);
  border: none;
  border-radius: var(--border-radius-2xl);
  font-size: 18px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: var(--transition-medium);
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);

  &:hover:not(:disabled) {
    background: #0056CC;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 122, 255, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 15px rgba(0, 122, 255, 0.3);
  }

  &:disabled {
    background: var(--gray-3);
    color: var(--text-secondary);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;

const DURATION_OPTIONS = [
  { label: '25분', value: 25 },
  { label: '30분', value: 30 },
  { label: '45분', value: 45 },
  { label: '50분', value: 50 },
  { label: '60분', value: 60 },
];

export default function PomodoroStartPage() {
  const router = useRouter();
  const { createPomodoroSession } = useUser();
  const [formData, setFormData] = useState({
    goal: '',
    duration: 25,
    scheduledTime: null
  });
  const [is50MinEnabled, setIs50MinEnabled] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);

  useEffect(() => {
    // Set current date and time
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(now);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDurationChange = (duration) => {
    setFormData(prev => ({
      ...prev,
      duration
    }));
  };

  const handleCancel = () => {
    router.push('/main');
  };

  const handleStart = async () => {
    try {
      // Combine selected date and time
      const combinedDateTime = new Date(selectedDate);
      combinedDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      
      // Create pomodoro session
      const sessionData = {
        title: '뽀모도로 세션',
        goal: formData.goal || '',
        duration: formData.duration,
        scheduledTime: combinedDateTime.toISOString()
      };

      createPomodoroSession(sessionData);
      
      // Navigate back to main page
      router.push('/main');
      
    } catch (error) {
      console.error('Failed to start pomodoro session:', error);
    }
  };


  return (
    <StartContainer>
      <AppHeader>
        <HeaderButton onClick={handleCancel}>취소</HeaderButton>
        <AppTitle>뽀모도로 시작하기</AppTitle>
        <HeaderButton onClick={handleStart}>시작</HeaderButton>
      </AppHeader>

      <MainContent>
        <PomodoroInputSection>
          <SectionLabel>뽀모도로 설정</SectionLabel>
          
          {!isEditingDateTime ? (
            <InputRow>
              <InputLabel>시간</InputLabel>
              <TimeSelection>
                <DateTimeButton onClick={() => setIsEditingDateTime(true)}>
                  {selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                </DateTimeButton>
                <DateTimeButton onClick={() => setIsEditingDateTime(true)}>
                  {selectedTime.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </DateTimeButton>
              </TimeSelection>
            </InputRow>
          ) : (
            <>
              <InputRow>
                <InputLabel>날짜</InputLabel>
                <InputFieldWrapper>
                  <InputField
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  />
                </InputFieldWrapper>
              </InputRow>
              <InputRow>
                <InputLabel>시간</InputLabel>
                <InputFieldWrapper>
                  <InputField
                    type="time"
                    value={selectedTime.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newTime = new Date(selectedTime);
                      newTime.setHours(parseInt(hours), parseInt(minutes));
                      setSelectedTime(newTime);
                    }}
                  />
                </InputFieldWrapper>
              </InputRow>
              <InputRow>
                <div style={{ width: '100%', textAlign: 'right' }}>
                  <HeaderButton onClick={() => setIsEditingDateTime(false)}>완료</HeaderButton>
                </div>
              </InputRow>
            </>
          )}

          <InputRow>
            <InputLabel>길이</InputLabel>
            <DurationPicker>
              {DURATION_OPTIONS.map(option => (
                <DurationButton
                  key={option.value}
                  active={formData.duration === option.value}
                  onClick={() => handleDurationChange(option.value)}
                >
                  {option.label}
                </DurationButton>
              ))}
            </DurationPicker>
          </InputRow>

          <InputRow>
            <InputLabel>목표</InputLabel>
            <InputFieldWrapper>
              <InputField
                type="text"
                placeholder="목표 입력 (선택사항)"
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
              />
            </InputFieldWrapper>
          </InputRow>
        </PomodoroInputSection>

        <SettingsSection>
          <ToggleRow>
            <ToggleLabel>50분 뽀모도로 활성화</ToggleLabel>
            <ToggleSwitch 
              active={is50MinEnabled}
              onClick={() => {
                setIs50MinEnabled(!is50MinEnabled);
                if (!is50MinEnabled) {
                  handleDurationChange(50);
                } else {
                  handleDurationChange(25);
                }
              }}
            >
              <ToggleSlider active={is50MinEnabled} />
            </ToggleSwitch>
          </ToggleRow>
        </SettingsSection>
      </MainContent>

      <BottomSection>
        <StartButton onClick={handleStart}>
          시작
        </StartButton>
      </BottomSection>
    </StartContainer>
  );
}

