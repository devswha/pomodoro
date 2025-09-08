import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const OnboardingContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background-primary);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-5);
  background: var(--background-primary);
  
  @media (min-width: 769px) {
    padding: 1.5rem 2rem;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  
  @media (min-width: 769px) {
    font-size: 1.75rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--border-radius-small);
  transition: var(--transition-fast);

  &:hover {
    background: var(--gray-6);
    color: var(--text-primary);
  }
`;

const OnboardingContent = styled.div`
  flex: 1;
  padding: 2rem 1.5rem;
  overflow-y: auto;
  
  @media (min-width: 769px) {
    padding: 3rem 2rem;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }
`;

const StepContainer = styled.div`
  margin-bottom: 3rem;
`;

const StepNumber = styled.div`
  background: var(--primary-blue);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 1rem;
`;

const StepTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  
  @media (min-width: 769px) {
    font-size: 1.5rem;
  }
`;

const StepDescription = styled.p`
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  
  @media (min-width: 769px) {
    font-size: 1.125rem;
  }
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: var(--border-radius-medium);
`;

const FeatureIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
`;

const FeatureText = styled.div`
  flex: 1;
`;

const FeatureTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
`;

const FeatureDesc = styled.p`
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
`;

const StartButton = styled.button`
  width: 100%;
  background: var(--primary-blue);
  color: white;
  border: none;
  border-radius: var(--border-radius-medium);
  padding: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  margin-top: 2rem;

  &:hover {
    background: var(--primary-blue-dark, #0056CC);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

function OnboardingPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/main');
  };

  const handleStart = () => {
    navigate('/pomodoro-start');
  };

  const onboardingSteps = [
    {
      number: 1,
      title: "뽀모도로 타이머란?",
      description: "25분 집중 + 5분 휴식을 반복하는 시간 관리 기법입니다. 집중력을 높이고 효율적으로 일할 수 있도록 도와줍니다.",
      features: [
        {
          icon: "⏰",
          title: "25분 집중 시간",
          desc: "방해받지 않고 한 가지 일에만 집중하세요"
        },
        {
          icon: "☕",
          title: "5분 휴식 시간", 
          desc: "짧은 휴식으로 집중력을 재충전하세요"
        },
        {
          icon: "🔄",
          title: "4회 반복 후 긴 휴식",
          desc: "4번의 뽀모도로 후 15-30분의 긴 휴식을 가지세요"
        }
      ]
    },
    {
      number: 2,
      title: "타이머 사용하기",
      description: "간단한 단계로 뽀모도로 타이머를 시작할 수 있습니다.",
      features: [
        {
          icon: "📝",
          title: "목표 설정",
          desc: "오늘 집중하고 싶은 목표를 간단히 적어보세요"
        },
        {
          icon: "⏱️",
          title: "시간 선택",
          desc: "25분부터 60분까지 원하는 시간을 선택하세요"
        },
        {
          icon: "🎯",
          title: "집중 시작",
          desc: "타이머가 시작되면 목표한 일에만 집중하세요"
        }
      ]
    },
    {
      number: 3,
      title: "통계 확인하기",
      description: "완료한 뽀모도로 세션을 통해 나의 집중 패턴을 분석해보세요.",
      features: [
        {
          icon: "📊",
          title: "일일 통계",
          desc: "오늘 완료한 세션 수와 집중 시간을 확인하세요"
        },
        {
          icon: "📅",
          title: "월별 통계",
          desc: "한 달간의 집중 패턴과 성취도를 분석하세요"
        },
        {
          icon: "🏆",
          title: "연속 기록",
          desc: "꾸준히 이어가는 집중 습관을 추적하세요"
        }
      ]
    }
  ];

  return (
    <OnboardingContainer>
      <Header>
        <HeaderTitle>뽀모도로 사용법</HeaderTitle>
        <CloseButton onClick={handleClose}>✕</CloseButton>
      </Header>
      
      <OnboardingContent>
        {onboardingSteps.map((step, index) => (
          <StepContainer key={index}>
            <StepNumber>{step.number}</StepNumber>
            <StepTitle>{step.title}</StepTitle>
            <StepDescription>{step.description}</StepDescription>
            
            <FeatureList>
              {step.features.map((feature, featureIndex) => (
                <FeatureItem key={featureIndex}>
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                  <FeatureText>
                    <FeatureTitle>{feature.title}</FeatureTitle>
                    <FeatureDesc>{feature.desc}</FeatureDesc>
                  </FeatureText>
                </FeatureItem>
              ))}
            </FeatureList>
          </StepContainer>
        ))}
        
        <StartButton onClick={handleStart}>
          바로 시작하기
        </StartButton>
      </OnboardingContent>
    </OnboardingContainer>
  );
}

export default OnboardingPage;