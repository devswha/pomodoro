'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';

const MeetingsContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e9ecef;
  
  @media (min-width: 769px) {
    padding: 2rem;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 1rem;
  color: #000000;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    opacity: 0.7;
  }
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #000000;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  @media (min-width: 769px) {
    font-size: 1.75rem;
  }
`;

const AddButton = styled.button`
  background: #000000;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #333333;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  
  @media (min-width: 769px) {
    padding: 2rem;
  }
`;

const WeekNavigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  border: 2px solid #e9ecef;
`;

const WeekButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #000000;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    opacity: 0.7;
  }
`;

const WeekTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 500;
  color: #000000;
  margin: 0;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  border: 2px solid #e9ecef;
  margin-bottom: 2rem;
`;

const DayHeader = styled.div`
  background: #f8f9fa;
  padding: 1rem 0.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e9ecef;
`;

const DayCell = styled.div`
  background: #ffffff;
  min-height: 120px;
  padding: 0.5rem;
  border-bottom: 1px solid #e9ecef;
  position: relative;
  cursor: pointer;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &.other-month {
    background: #f8f9fa;
    color: #6c757d;
  }
  
  &.today {
    background: #000000;
    color: #ffffff;
  }
`;

const DayNumber = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const MeetingItem = styled.div`
  background: ${props => props.color || '#000000'};
  color: #ffffff;
  padding: 0.25rem 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  &:hover {
    opacity: 0.8;
  }
`;

const MeetingsList = styled.div`
  margin-top: 2rem;
`;

const MeetingsListTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #000000;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MeetingCard = styled.div`
  border: 2px solid #e9ecef;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #000000;
  }
`;

const MeetingTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #000000;
  margin: 0 0 0.5rem 0;
`;

const MeetingDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const MeetingDetail = styled.span`
  font-size: 0.875rem;
  color: #6c757d;
  
  strong {
    color: #000000;
  }
`;

const MeetingDescription = styled.p`
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0;
  line-height: 1.4;
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #ffffff;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #000000;
  margin: 0 0 1.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #000000;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e9ecef;
  font-size: 1rem;
  color: #000000;
  background: #ffffff;
  
  &:focus {
    outline: none;
    border-color: #000000;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e9ecef;
  font-size: 1rem;
  color: #000000;
  background: #ffffff;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #000000;
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const ModalButton = styled.button`
  padding: 1rem 1.5rem;
  border: 2px solid #000000;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.primary ? `
    background: #000000;
    color: #ffffff;
    
    &:hover {
      background: #333333;
    }
  ` : `
    background: #ffffff;
    color: #000000;
    
    &:hover {
      background: #f8f9fa;
    }
  `}
`;

const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

const meetingColors = ['#000000', '#6c757d', '#dc3545', '#007bff', '#28a745', '#ffc107', '#17a2b8'];

export default function MeetingsPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    attendees: '',
    description: ''
  });

  // Load meetings from localStorage
  useEffect(() => {
    if (currentUser) {
      const savedMeetings = localStorage.getItem(`meetings_${currentUser.id}`);
      if (savedMeetings) {
        setMeetings(JSON.parse(savedMeetings));
      }
    }
  }, [currentUser]);

  // Save meetings to localStorage
  const saveMeetings = (updatedMeetings) => {
    if (currentUser) {
      localStorage.setItem(`meetings_${currentUser.id}`, JSON.stringify(updatedMeetings));
      setMeetings(updatedMeetings);
    }
  };

  const handleBack = () => {
    router.push('/main');
  };

  const handleAddMeeting = (date = null) => {
    const targetDate = date || new Date();
    setSelectedDate(targetDate);
    setFormData({
      title: '',
      date: targetDate.toISOString().split('T')[0],
      time: '10:00',
      location: '',
      attendees: '',
      description: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDate(null);
    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
      attendees: '',
      description: ''
    });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveMeeting = () => {
    if (!formData.title || !formData.date || !formData.time) {
      alert('제목, 날짜, 시간은 필수 항목입니다.');
      return;
    }

    const newMeeting = {
      id: Date.now().toString(),
      ...formData,
      color: meetingColors[Math.floor(Math.random() * meetingColors.length)],
      createdAt: new Date().toISOString()
    };

    const updatedMeetings = [...meetings, newMeeting];
    saveMeetings(updatedMeetings);
    handleCloseModal();
  };

  const getWeekStart = (date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return start;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const formatWeekRange = () => {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`;
  };

  const renderCalendar = () => {
    const weekStart = getWeekStart(currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      
      const dayMeetings = meetings.filter(meeting => 
        meeting.date === day.toISOString().split('T')[0]
      );

      const isToday = day.toDateString() === new Date().toDateString();
      
      days.push(
        <DayCell 
          key={day.toISOString()}
          className={isToday ? 'today' : ''}
          onClick={() => handleAddMeeting(day)}
        >
          <DayNumber>{day.getDate()}</DayNumber>
          {dayMeetings.map(meeting => (
            <MeetingItem key={meeting.id} color={meeting.color}>
              {meeting.time} {meeting.title}
            </MeetingItem>
          ))}
        </DayCell>
      );
    }
    
    return days;
  };

  const upcomingMeetings = meetings
    .filter(meeting => new Date(meeting.date + 'T' + meeting.time) >= new Date())
    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
    .slice(0, 5);

  return (
    <MeetingsContainer>
      <Header>
        <BackButton onClick={handleBack}>뒤로</BackButton>
        <PageTitle>모임 일정</PageTitle>
        <AddButton onClick={() => handleAddMeeting()}>추가</AddButton>
      </Header>

      <ContentArea>
        <WeekNavigation>
          <WeekButton onClick={() => navigateWeek(-1)}>‹</WeekButton>
          <WeekTitle>{formatWeekRange()}</WeekTitle>
          <WeekButton onClick={() => navigateWeek(1)}>›</WeekButton>
        </WeekNavigation>

        <CalendarGrid>
          {daysOfWeek.map(day => (
            <DayHeader key={day}>{day}</DayHeader>
          ))}
          {renderCalendar()}
        </CalendarGrid>

        <MeetingsList>
          <MeetingsListTitle>다가오는 모임</MeetingsListTitle>
          {upcomingMeetings.length === 0 ? (
            <MeetingCard>
              <MeetingTitle>예정된 모임이 없습니다</MeetingTitle>
              <MeetingDescription>새로운 모임을 추가해보세요!</MeetingDescription>
            </MeetingCard>
          ) : (
            upcomingMeetings.map(meeting => (
              <MeetingCard key={meeting.id}>
                <MeetingTitle>{meeting.title}</MeetingTitle>
                <MeetingDetails>
                  <MeetingDetail>
                    <strong>날짜:</strong> {new Date(meeting.date).toLocaleDateString('ko-KR')}
                  </MeetingDetail>
                  <MeetingDetail>
                    <strong>시간:</strong> {meeting.time}
                  </MeetingDetail>
                  {meeting.location && (
                    <MeetingDetail>
                      <strong>장소:</strong> {meeting.location}
                    </MeetingDetail>
                  )}
                  {meeting.attendees && (
                    <MeetingDetail>
                      <strong>참석자:</strong> {meeting.attendees}
                    </MeetingDetail>
                  )}
                </MeetingDetails>
                {meeting.description && (
                  <MeetingDescription>{meeting.description}</MeetingDescription>
                )}
              </MeetingCard>
            ))
          )}
        </MeetingsList>
      </ContentArea>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>모임 일정 추가</ModalTitle>
            
            <FormGroup>
              <FormLabel htmlFor="title">제목</FormLabel>
              <FormInput
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="모임 제목을 입력하세요"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="date">날짜</FormLabel>
              <FormInput
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="time">시간</FormLabel>
              <FormInput
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleFormChange('time', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="location">장소</FormLabel>
              <FormInput
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
                placeholder="모임 장소를 입력하세요"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="attendees">참석자</FormLabel>
              <FormInput
                id="attendees"
                type="text"
                value={formData.attendees}
                onChange={(e) => handleFormChange('attendees', e.target.value)}
                placeholder="참석자 명단을 입력하세요"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="description">설명</FormLabel>
              <FormTextarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="모임에 대한 설명을 입력하세요"
              />
            </FormGroup>

            <ModalButtons>
              <ModalButton onClick={handleCloseModal}>취소</ModalButton>
              <ModalButton primary onClick={handleSaveMeeting}>저장</ModalButton>
            </ModalButtons>
          </Modal>
        </ModalOverlay>
      )}
    </MeetingsContainer>
  );
}