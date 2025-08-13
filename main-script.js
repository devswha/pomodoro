class MainDashboard {
    constructor() {
        this.currentUser = null;
        this.pomodoroTimer = null;
        this.isTimerRunning = false;
        this.timeRemaining = 25 * 60; // 25 minutes in seconds
        
        this.initializeElements();
        this.loadUserData();
        this.attachEventListeners();
        this.updateProgressCharts();
        this.startTimeDisplay();
    }
    
    initializeElements() {
        // Header elements
        this.settingsBtn = document.getElementById('settingsBtn');
        this.menuBtn = document.getElementById('menuBtn');
        
        // Statistics elements
        this.studyStatsBtn = document.getElementById('studyStatsBtn');
        this.monthlyStatsBtn = document.getElementById('monthlyStatsBtn');
        this.studyChart = document.getElementById('studyChart');
        
        // Action cards
        this.pomodoroStartCard = document.getElementById('pomodoroStartCard');
        this.pomodoroRankingCard = document.getElementById('pomodoroRankingCard');
        this.eventCard = document.getElementById('eventCard');
        
        // Pomodoro elements
        this.pomodoroTime = document.getElementById('pomodoroTime');
        this.breakBtn = document.getElementById('breakBtn');
        this.focusBtn = document.getElementById('focusBtn');
    }
    
    loadUserData() {
        // Get user data from localStorage or URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user') || localStorage.getItem('currentUser') || '사용자';
        
        this.currentUser = {
            id: userId,
            studyStats: {
                completed: 75,
                totalSessions: 120,
                monthlyHours: 45
            }
        };
        
        // Store current user
        localStorage.setItem('currentUser', userId);
    }
    
    attachEventListeners() {
        // Header buttons
        this.settingsBtn.addEventListener('click', () => this.handleSettings());
        this.menuBtn.addEventListener('click', () => this.handleMenu());
        
        // Statistics buttons
        this.studyStatsBtn.addEventListener('click', () => this.handleStudyStats());
        this.monthlyStatsBtn.addEventListener('click', () => this.handleMonthlyStats());
        
        // Action cards
        this.pomodoroStartCard.addEventListener('click', () => this.handlePomodoroStart());
        this.pomodoroRankingCard.addEventListener('click', () => this.handlePomodoroRanking());
        this.eventCard.addEventListener('click', () => this.handleEvent());
        
        // Pomodoro controls
        this.breakBtn.addEventListener('click', () => this.handleBreak());
        this.focusBtn.addEventListener('click', () => this.handleFocus());
        
        // Touch feedback for mobile
        this.addTouchFeedback();
    }
    
    addTouchFeedback() {
        const interactiveElements = [
            this.settingsBtn, this.menuBtn, this.studyStatsBtn, this.monthlyStatsBtn,
            this.pomodoroStartCard, this.pomodoroRankingCard, this.eventCard,
            this.breakBtn, this.focusBtn
        ];
        
        interactiveElements.forEach(element => {
            if (element) {
                element.addEventListener('touchstart', (e) => {
                    element.style.transform = 'scale(0.98)';
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
    
    updateProgressCharts() {
        // Animate the study progress chart
        const progressPurple = document.querySelector('.progress-purple');
        const progressOrange = document.querySelector('.progress-orange');
        
        if (progressPurple && progressOrange) {
            // Calculate stroke dash offset for 75% completion
            const radius = 45;
            const circumference = 2 * Math.PI * radius;
            const completionPercent = this.currentUser.studyStats.completed / 100;
            
            // Purple segment (50% of circle)
            const purpleOffset = circumference * (1 - 0.5);
            progressPurple.style.strokeDashoffset = purpleOffset;
            
            // Orange segment (25% of circle)  
            const orangeOffset = circumference * (1 - 0.25);
            progressOrange.style.strokeDashoffset = orangeOffset;
            
            // Animate the progress
            setTimeout(() => {
                progressPurple.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)';
                progressOrange.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)';
            }, 500);
        }
    }
    
    startTimeDisplay() {
        // Update current time display
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            this.pomodoroTime.textContent = timeString;
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    }
    
    // Event handlers
    handleSettings() {
        this.showToast('설정 페이지로 이동합니다');
        this.addButtonFeedback(this.settingsBtn);
        console.log('Settings 버튼 클릭');
    }
    
    handleMenu() {
        this.showToast('메뉴를 표시합니다');
        this.addButtonFeedback(this.menuBtn);
        console.log('Menu 버튼 클릭');
    }
    
    handleStudyStats() {
        this.showToast('학습 통계 상세 페이지로 이동합니다');
        this.addButtonFeedback(this.studyStatsBtn);
        console.log('학습 통계 상세보기');
    }
    
    handleMonthlyStats() {
        this.showToast('월별 기록 페이지로 이동합니다');
        this.addButtonFeedback(this.monthlyStatsBtn);
        console.log('월별 기록 보기');
    }
    
    handlePomodoroStart() {
        this.showToast('뽀모도로 타이머를 시작합니다');
        this.addCardFeedback(this.pomodoroStartCard);
        
        // Start pomodoro timer
        this.startPomodoroTimer();
        console.log('뽀모도로 시작');
    }
    
    handlePomodoroRanking() {
        this.showToast('뽀모도로 랭킹 페이지로 이동합니다');
        this.addCardFeedback(this.pomodoroRankingCard);
        console.log('뽀모도로 랭킹 보기');
    }
    
    handleEvent() {
        this.showToast('진행중인 이벤트 페이지로 이동합니다');
        this.addCardFeedback(this.eventCard);
        console.log('이벤트 페이지로 이동');
    }
    
    handleBreak() {
        if (this.isTimerRunning) {
            this.pausePomodoroTimer();
            this.showToast('뽀모도로 타이머를 일시정지했습니다');
        } else {
            this.showToast('진행 중인 타이머가 없습니다');
        }
        this.addButtonFeedback(this.breakBtn);
    }
    
    handleFocus() {
        if (this.isTimerRunning) {
            this.stopPomodoroTimer();
            this.showToast('뽀모도로 타이머를 종료했습니다');
        } else {
            this.showToast('진행 중인 타이머가 없습니다');
        }
        this.addButtonFeedback(this.focusBtn);
    }
    
    // Pomodoro timer functions
    startPomodoroTimer() {
        if (this.isTimerRunning) return;
        
        this.isTimerRunning = true;
        this.timeRemaining = 25 * 60; // 25 minutes
        
        this.pomodoroTimer = setInterval(() => {
            this.timeRemaining--;
            
            if (this.timeRemaining <= 0) {
                this.completePomodoroSession();
            } else {
                this.updateTimerDisplay();
            }
        }, 1000);
        
        // Update button states
        this.breakBtn.textContent = '일시정지';
        this.focusBtn.textContent = '종료';
        this.breakBtn.classList.add('active');
        this.focusBtn.classList.add('active');
    }
    
    pausePomodoroTimer() {
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
            this.pomodoroTimer = null;
        }
        
        this.isTimerRunning = false;
        this.breakBtn.textContent = '재시작';
        this.focusBtn.textContent = '종료';
    }
    
    stopPomodoroTimer() {
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
            this.pomodoroTimer = null;
        }
        
        this.isTimerRunning = false;
        this.timeRemaining = 25 * 60;
        
        // Reset button states
        this.breakBtn.textContent = '중단';
        this.focusBtn.textContent = '종료';
        this.breakBtn.classList.remove('active');
        this.focusBtn.classList.remove('active');
        
        this.startTimeDisplay(); // Resume normal time display
    }
    
    completePomodoroSession() {
        this.stopPomodoroTimer();
        this.showSuccessToast('뽀모도로 세션이 완료되었습니다! 🍅');
        
        // Update statistics
        this.currentUser.studyStats.totalSessions++;
        localStorage.setItem('userStats', JSON.stringify(this.currentUser.studyStats));
        
        // Show completion animation
        this.animateCompletion();
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.pomodoroTime.textContent = timeString;
    }
    
    animateCompletion() {
        // Add completion animation to the entire container
        const container = document.querySelector('.today-pomodoro');
        container.style.background = 'linear-gradient(135deg, #34C759, #30D158)';
        container.style.transform = 'scale(1.02)';
        container.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            container.style.background = '';
            container.style.transform = '';
        }, 2000);
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
    
    addCardFeedback(card) {
        card.style.transform = 'scale(0.98)';
        card.style.boxShadow = '0 1px 5px rgba(0, 0, 0, 0.15)';
        
        setTimeout(() => {
            card.style.transform = '';
            card.style.boxShadow = '';
        }, 200);
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
    
    showSuccessToast(message) {
        this.showToast(message, 'success', 3000);
    }
    
    // Navigation functions
    navigateToLogin() {
        window.location.href = 'index.html';
    }
    
    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userStats');
        this.showToast('로그아웃되었습니다');
        
        setTimeout(() => {
            this.navigateToLogin();
        }, 1000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new MainDashboard();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('페이지가 숨겨짐 - 타이머 일시정지');
        } else {
            console.log('페이지가 다시 표시됨');
        }
    });
    
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
    });
    
    // Prevent accidental navigation
    window.addEventListener('beforeunload', (e) => {
        if (dashboard.isTimerRunning) {
            e.preventDefault();
            e.returnValue = '진행 중인 뽀모도로 타이머가 있습니다. 정말 페이지를 떠나시겠습니까?';
            return e.returnValue;
        }
    });
});

// Handle back button navigation
window.addEventListener('popstate', (e) => {
    console.log('뒤로가기 감지');
    // Handle navigation state
});

// Service worker registration for PWA features
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