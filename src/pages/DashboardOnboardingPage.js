import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background-secondary);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--background-primary);
  border-bottom: 1px solid var(--gray-5);
  position: relative;
`;

const TimerSection = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const TimerDisplay = styled.div`
  background: var(--background-secondary);
  border: 1px solid var(--gray-5);
  border-radius: var(--border-radius-medium);
  padding: 0.5rem 1rem;
  font-weight: 600;
  color: var(--text-primary);
`;

const WaveIcon = styled.div`
  font-size: 1.5rem;
  color: var(--text-secondary);
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: var(--border-radius-small);
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--text-secondary);
  transition: var(--transition-fast);

  &:hover {
    background: var(--gray-6);
    color: var(--text-primary);
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    overflow-y: auto;
  }
`;

const SidePanel = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 1.5rem;
  box-shadow: var(--shadow-small);
  overflow-y: auto;

  @media (max-width: 1200px) {
    margin-bottom: 1rem;
  }
`;

const CenterPanel = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 1.5rem;
  box-shadow: var(--shadow-small);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ScheduleItem = styled.div`
  background: ${props => props.bgColor || 'var(--background-secondary)'};
  color: ${props => props.textColor || 'var(--text-primary)'};
  padding: 1rem;
  border-radius: var(--border-radius-medium);
  margin-bottom: 0.75rem;
  font-weight: 500;
  text-align: center;
`;

const ActionButton = styled.button`
  background: var(--primary-blue);
  color: white;
  border: none;
  border-radius: var(--border-radius-medium);
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  margin-top: auto;

  &:hover {
    background: var(--primary-blue-dark, #0056CC);
  }
`;

const TimeTable = styled.div`
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  gap: 1px;
  background: var(--gray-5);
  border-radius: var(--border-radius-medium);
  overflow: hidden;
  flex: 1;
`;

const TimeSlot = styled.div`
  background: var(--background-primary);
  padding: 0.5rem;
  font-size: 0.75rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
`;

const HeaderCell = styled(TimeSlot)`
  background: var(--gray-6);
  font-weight: 600;
  color: var(--text-primary);
`;

const TaskCell = styled(TimeSlot)`
  background: ${props => props.bgColor || 'var(--background-primary)'};
  color: ${props => props.textColor || 'var(--text-primary)'};
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    opacity: 0.8;
  }
`;

const RankingItem = styled.div`
  background: ${props => props.bgColor || 'var(--background-secondary)'};
  padding: 1rem;
  border-radius: var(--border-radius-medium);
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
`;

const RankingName = styled.span`
  color: var(--text-primary);
`;

const RankingScore = styled.span`
  color: var(--text-secondary);
  font-weight: 600;
`;

const BottomSection = styled.div`
  text-align: center;
  padding: 1rem;
  background: var(--background-primary);
  border-top: 1px solid var(--gray-5);
`;

const GuideTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const CloseButton = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--border-radius-small);
  transition: var(--transition-fast);

  &:hover {
    background: var(--gray-6);
    color: var(--text-primary);
  }
`;

function DashboardOnboardingPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/main');
  };

  const scheduleItems = [
    { text: "이메일 아침 키공\n09:00 ~ 13:00", bgColor: "#ff6b6b", textColor: "white" },
    { text: "서현 오후 키공\n09:00 ~ 16:00", bgColor: "#ff6b6b", textColor: "white" },
    { text: "크로스핏 방문\n14:00 ~ 16:00", bgColor: "#ffd93d", textColor: "black" },
    { text: "미팅 공부\n14:00 ~ 18:00", bgColor: "#ff6b6b", textColor: "white" },
    { text: "아팀 스터디스…\n14:00 ~ 20:00", bgColor: "#ff6b6b", textColor: "white" },
    { text: "시험 투썰률레…\n19:00 ~ 23:00", bgColor: "#ff6b6b", textColor: "white" }
  ];

  const timeSlots = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];

  const tasks = [
    { name: '김김자⭐', bgColor: '#9c88ff', textColor: 'white' },
    { name: '홍길동⬆', bgColor: '#ff6b6b', textColor: 'white' },
    { name: '박서울🏃', bgColor: '#4ecdc4', textColor: 'white' },
    { name: '정지순👤', bgColor: '#ffa726', textColor: 'white' },
    { name: '최고집🔥', bgColor: '#42a5f5', textColor: 'white' },
    { name: '양데레사🌐', bgColor: '#ffeb3b', textColor: 'black' },
    { name: '참갓생🥕', bgColor: '#ff7043', textColor: 'white' }
  ];

  const rankings = [
    { name: '김김자', score: '1,700점', bgColor: '#1a1a2e' },
    { name: '홍길동', score: '1,500점', bgColor: '#16213e' },
    { name: '박서울', score: '1,200점', bgColor: '#0f3460' },
    { name: '정지순', score: '1,000점', bgColor: '#533483' },
    { name: '최고집', score: '700점', bgColor: '#ee4540' },
    { name: '아철수', score: '500점', bgColor: '#c72e29' },
    { name: '이완', score: '400점', bgColor: '#801336' }
  ];

  return (
    <DashboardContainer>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>진행중인 뽀모도로</span>
        </div>
        
        <TimerSection>
          <TimerDisplay>오후 4시 30분</TimerDisplay>
          <WaveIcon>〜</WaveIcon>
          <TimerDisplay>오후 4시 30분</TimerDisplay>
        </TimerSection>

        <HeaderButtons>
          <IconButton>▶️</IconButton>
          <IconButton>🔔</IconButton>
          <div style={{ padding: '0.5rem 1rem', background: 'var(--gray-6)', borderRadius: 'var(--border-radius-small)', fontSize: '0.875rem', fontWeight: '500' }}>
            마이페이지 비트
          </div>
        </HeaderButtons>

        <CloseButton onClick={handleClose}>✕</CloseButton>
      </Header>

      <MainContent>
        {/* 왼쪽 패널 - 오늘의 일정 */}
        <SidePanel>
          <SectionTitle>
            &lt;오늘의 일정&gt;
          </SectionTitle>
          
          {scheduleItems.map((item, index) => (
            <ScheduleItem 
              key={index}
              bgColor={item.bgColor}
              textColor={item.textColor}
            >
              {item.text.split('\n').map((line, lineIndex) => (
                <div key={lineIndex}>{line}</div>
              ))}
            </ScheduleItem>
          ))}
          
          <ActionButton onClick={() => navigate('/full-schedule')}>
            전체 일정 확인
          </ActionButton>
        </SidePanel>

        {/* 가운데 패널 - 시간표 */}
        <CenterPanel>
          <TimeTable>
            <HeaderCell></HeaderCell>
            {timeSlots.map(time => (
              <HeaderCell key={time}>{time}</HeaderCell>
            ))}
            
            {tasks.map((task, taskIndex) => (
              <React.Fragment key={taskIndex}>
                <HeaderCell>{task.name}</HeaderCell>
                {timeSlots.map((time, timeIndex) => (
                  <TaskCell 
                    key={`${taskIndex}-${timeIndex}`}
                    bgColor={Math.random() > 0.7 ? task.bgColor : 'var(--background-primary)'}
                    textColor={Math.random() > 0.7 ? task.textColor : 'var(--text-primary)'}
                  >
                    {Math.random() > 0.8 ? (
                      <span style={{ fontSize: '0.625rem' }}>
                        {Math.random() > 0.5 ? '인정성 준비 ⭐' : '모리 🏠'}
                      </span>
                    ) : Math.random() > 0.6 ? (
                      <span style={{ fontSize: '0.625rem' }}>
                        LN 연구 💎
                      </span>
                    ) : ''}
                  </TaskCell>
                ))}
              </React.Fragment>
            ))}
          </TimeTable>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
            {['1/30(목)', '1/29(수)', '1/28(화)', '1/27(월)', '1/26(일)', '1/25(토)', '1/24(금)'].map(date => (
              <div key={date} style={{ 
                background: date === '1/30(목)' ? 'var(--primary-blue)' : 'var(--gray-6)', 
                color: date === '1/30(목)' ? 'white' : 'var(--text-primary)',
                padding: '0.5rem',
                borderRadius: 'var(--border-radius-small)',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {date}
              </div>
            ))}
          </div>
        </CenterPanel>

        {/* 오른쪽 패널 - 뽀모도로 랭킹 */}
        <SidePanel>
          <SectionTitle>
            &lt;뽀모도로 TOP 랭킹&gt;
          </SectionTitle>
          
          {rankings.map((ranking, index) => (
            <RankingItem 
              key={index}
              bgColor={ranking.bgColor}
            >
              <RankingName style={{ color: 'white' }}>
                {ranking.name}
              </RankingName>
              <RankingScore style={{ color: 'white' }}>
                {ranking.score}
              </RankingScore>
            </RankingItem>
          ))}
          
          <div style={{ 
            textAlign: 'center', 
            margin: '1rem 0',
            color: 'var(--text-secondary)',
            fontSize: '1.5rem'
          }}>
            ⋮
          </div>
          
          <RankingItem bgColor="#8e7cc3">
            <RankingName style={{ color: 'white' }}>양데레사</RankingName>
            <RankingScore style={{ color: 'white' }}>250점</RankingScore>
          </RankingItem>
          
          <div style={{
            background: '#654321',
            padding: '0.75rem',
            borderRadius: 'var(--border-radius-medium)',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>Me</span>
            <span style={{ 
              background: 'red', 
              color: 'white', 
              padding: '0.125rem 0.5rem', 
              borderRadius: '12px',
              fontSize: '0.75rem'
            }}>
              150
            </span>
            <span>Stella정 200점</span>
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            margin: '1rem 0',
            color: 'var(--text-secondary)',
            fontSize: '1.5rem'
          }}>
            ⋮
          </div>
          
          <RankingItem bgColor="#8e7cc3">
            <RankingName style={{ color: 'white' }}>철갓생</RankingName>
            <RankingScore style={{ color: 'white' }}>150점</RankingScore>
          </RankingItem>
        </SidePanel>
      </MainContent>

      <BottomSection>
        <GuideTitle>뽀모도로 사용법</GuideTitle>
        <ActionButton onClick={() => navigate('/onboarding')}>
          사용법 보기
        </ActionButton>
      </BottomSection>
    </DashboardContainer>
  );
}

export default DashboardOnboardingPage;