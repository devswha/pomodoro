class MonthlyRecords {
    constructor() {
        this.currentDate = new Date();
        this.currentUser = null;
        this.selectedDate = null;
        this.monthSessions = [];
        
        this.initializeElements();
        this.loadUserData();
        this.attachEventListeners();
        this.generateCalendar();
        this.loadMonthlySessions();
    }
    
    initializeElements() {
        // Header elements
        this.backBtn = document.getElementById('backBtn');
        this.monthTitle = document.getElementById('monthTitle');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        
        // Calendar elements
        this.calendarGrid = document.getElementById('calendarGrid');
        
        // Session elements
        this.sessionsSection = document.querySelector('.sessions-section');
        
        // Period selector buttons
        this.periodBtns = document.querySelectorAll('.period-btn');
    }
    
    loadUserData() {
        // Get user data from URL parameters or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user') || localStorage.getItem('currentUser') || '사용자';
        
        this.currentUser = {
            id: userId,
            monthlyRecords: this.generateMockData()
        };
    }
    
    generateMockData() {
        // Generate mock session data for the current month
        const sessions = [];
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Add some random sessions throughout the month
        const sessionDays = [10, 15, 20, 26];
        sessionDays.forEach(day => {
            const date = new Date(year, month, day);
            sessions.push({
                date: date,
                startTime: '9:00 AM',
                endTime: '9:25 AM',
                type: 'work',
                completed: true,
                duration: 25
            });
            
            sessions.push({
                date: date,
                startTime: '2:30 PM',
                endTime: '2:55 PM',
                type: 'work',
                completed: true,
                duration: 25
            });
        });
        
        return sessions;
    }
    
    attachEventListeners() {
        // Navigation
        this.backBtn.addEventListener('click', () => this.handleBack());
        this.prevMonthBtn.addEventListener('click', () => this.handlePrevMonth());
        this.nextMonthBtn.addEventListener('click', () => this.handleNextMonth());
        
        // Period selector buttons
        this.periodBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePeriodSelect(e));
        });
        
        // Touch feedback
        this.addTouchFeedback();
    }
    
    addTouchFeedback() {
        const interactiveElements = [
            this.backBtn, this.prevMonthBtn, this.nextMonthBtn,
            ...this.periodBtns
        ];
        
        interactiveElements.forEach(element => {
            if (element) {
                element.addEventListener('touchstart', (e) => {
                    element.style.transform = 'scale(0.95)';
                    element.style.transition = 'all 0.1s ease';
                }, { passive: true });
                
                element.addEventListener('touchend', (e) => {
                    setTimeout(() => {
                        element.style.transform = '';
                    }, 100);
                }, { passive: true });
            }
        });
    }
    
    generateCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month title
        this.monthTitle.textContent = this.currentDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
        
        // Clear previous calendar
        this.calendarGrid.innerHTML = '';
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'other-month');
            
            // Add previous month's last days
            const prevMonthDay = new Date(year, month, 0 - (startingDayOfWeek - 1 - i));
            emptyDay.textContent = prevMonthDay.getDate();
            this.calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = day;
            
            const currentDate = new Date(year, month, day);
            
            // Check if this day has sessions
            if (this.hasSessionOnDate(currentDate)) {
                dayElement.classList.add('has-session');
            }
            
            // Highlight specific days (10 and 26 based on Figma design)
            if (day === 10 || day === 26) {
                dayElement.classList.add('highlighted');
            }
            
            // Today highlight
            const today = new Date();
            if (currentDate.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            // Click handler for day selection
            dayElement.addEventListener('click', () => {
                this.selectDate(currentDate, dayElement);
            });
            
            this.calendarGrid.appendChild(dayElement);
        }
        
        // Fill remaining cells with next month's days
        const totalCells = this.calendarGrid.children.length;
        const remainingCells = 42 - totalCells; // 6 weeks * 7 days = 42
        
        for (let i = 1; i <= remainingCells && totalCells + i <= 42; i++) {
            const nextMonthDay = document.createElement('div');
            nextMonthDay.classList.add('calendar-day', 'other-month');
            nextMonthDay.textContent = i;
            this.calendarGrid.appendChild(nextMonthDay);
        }
    }
    
    hasSessionOnDate(date) {
        return this.currentUser.monthlyRecords.some(session => 
            session.date.toDateString() === date.toDateString()
        );
    }
    
    selectDate(date, element) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day.active').forEach(day => {
            day.classList.remove('active');
        });
        
        // Add selection to clicked day
        element.classList.add('active');
        this.selectedDate = date;
        
        // Load sessions for selected date
        this.loadSessionsForDate(date);
        
        // Haptic feedback
        this.simulateHapticFeedback();
    }
    
    loadSessionsForDate(date) {
        const sessions = this.currentUser.monthlyRecords.filter(session =>
            session.date.toDateString() === date.toDateString()
        );
        
        if (sessions.length > 0) {
            console.log(`Found ${sessions.length} sessions for ${date.toDateString()}`);
            // Here you could update the sessions list UI
            this.showToast(`${sessions.length}개의 세션을 찾았습니다`);
        } else {
            console.log(`No sessions found for ${date.toDateString()}`);
            this.showToast('선택한 날짜에 세션이 없습니다');
        }
    }
    
    loadMonthlySessions() {
        // This would typically load from an API
        // For now, we'll use the mock data
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        this.monthSessions = this.currentUser.monthlyRecords.filter(session => {
            return session.date.getFullYear() === year && 
                   session.date.getMonth() === month;
        });
        
        console.log(`Loaded ${this.monthSessions.length} sessions for ${this.monthTitle.textContent}`);
    }
    
    // Event handlers
    handleBack() {
        this.addButtonFeedback(this.backBtn);
        // Navigate back to main dashboard
        if (this.currentUser) {
            window.location.href = `main.html?user=${encodeURIComponent(this.currentUser.id)}`;
        } else {
            window.location.href = 'main.html';
        }
    }
    
    handlePrevMonth() {
        this.addButtonFeedback(this.prevMonthBtn);
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.generateCalendar();
        this.loadMonthlySessions();
        this.showToast('이전 달로 이동');
    }
    
    handleNextMonth() {
        this.addButtonFeedback(this.nextMonthBtn);
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.generateCalendar();
        this.loadMonthlySessions();
        this.showToast('다음 달로 이동');
    }
    
    handlePeriodSelect(e) {
        const clickedBtn = e.target;
        const period = clickedBtn.dataset.period;
        
        // Remove active class from all buttons
        this.periodBtns.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        clickedBtn.classList.add('active');
        
        this.addButtonFeedback(clickedBtn);
        this.showToast(`${period} 선택됨`);
    }
    
    // UI feedback functions
    addButtonFeedback(button) {
        button.style.opacity = '0.7';
        button.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            button.style.opacity = '';
            button.style.transform = '';
        }, 150);
    }
    
    simulateHapticFeedback() {
        // Simulate iOS haptic feedback with visual feedback
        document.body.style.transform = 'translateY(-1px)';
        setTimeout(() => {
            document.body.style.transform = '';
        }, 100);
    }
    
    showToast(message, type = 'info', duration = 2000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#34C759' : type === 'error' ? '#FF3B30' : '#007AFF'};
            color: white;
            padding: 12px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transition: all 0.3s ease;
            max-width: 280px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
        }, 100);
        
        // Hide toast
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
    
    // Utility functions
    formatDate(date) {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    // Export functionality
    exportMonthlyData() {
        const data = {
            month: this.monthTitle.textContent,
            sessions: this.monthSessions,
            totalSessions: this.monthSessions.length,
            totalMinutes: this.monthSessions.reduce((total, session) => total + session.duration, 0)
        };
        
        console.log('Monthly Data:', data);
        this.showToast('데이터 내보내기 완료', 'success');
        
        return data;
    }
}

// Initialize monthly records when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const monthlyRecords = new MonthlyRecords();
    
    // Global access for debugging
    window.monthlyRecords = monthlyRecords;
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('월별 기록 페이지가 숨겨짐');
        } else {
            console.log('월별 기록 페이지가 다시 표시됨');
        }
    });
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            monthlyRecords.handlePrevMonth();
        } else if (e.key === 'ArrowRight') {
            monthlyRecords.handleNextMonth();
        } else if (e.key === 'Escape') {
            monthlyRecords.handleBack();
        }
    });
});

// Handle back button navigation
window.addEventListener('popstate', (e) => {
    console.log('뒤로가기 감지 - 메인 페이지로 이동');
    // Handle navigation state
});

// Service worker registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}