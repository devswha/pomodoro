class MainDashboard {
    constructor() {
        console.log('🚀 MainDashboard 초기화 시작...');
        
        try {
            this.currentUser = null;
            this.pomodoroTimer = null;
            this.isTimerRunning = false;
            this.timeRemaining = 25 * 60; // 25 minutes in seconds
            this.retryCount = 0; // 재시도 카운터
            this.maxRetries = 3; // 최대 재시도 횟수
            
            this.initializeElements();
            this.loadUserData();
            this.attachEventListeners();
            this.updateProgressCharts();
            this.startTimeDisplay();
            
            console.log('🎉 MainDashboard 초기화 완료!');
        } catch (error) {
            console.error('💥 MainDashboard 초기화 중 오류 발생:', error);
            alert('페이지 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        }
    }
    
    initializeElements() {
        console.log('🔍 초기화 시작 - DOM 요소들을 찾는 중...');
        
        // 안전한 요소 찾기 함수
        const safeGetElement = (id, description) => {
            const element = document.getElementById(id);
            if (element) {
                console.log(`✅ ${description} 요소 찾음`);
                return element;
            } else {
                console.error(`❌ ${id} 요소를 찾을 수 없습니다!`);
                return null;
            }
        };
        
        // 모든 요소를 안전하게 찾기
        this.userInitial = safeGetElement('userInitial', '사용자 이니셜');
        this.userName = safeGetElement('userName', '사용자 이름');
        this.logoutBtn = safeGetElement('logoutBtn', '로그아웃 버튼');
        this.studyStatsBtn = safeGetElement('studyStatsBtn', '학습 통계 버튼');
        this.monthlyStatsBtn = safeGetElement('monthlyStatsBtn', '월별 기록 버튼');
        this.studyChart = safeGetElement('studyChart', '학습 차트');
        this.pomodoroStartCard = safeGetElement('pomodoroStartCard', '뽀모도로 시작 카드');
        this.pomodoroRankingCard = safeGetElement('pomodoroRankingCard', '뽀모도로 랭킹 카드');
        this.eventCard = safeGetElement('eventCard', '이벤트 카드');
        this.pomodoroTime = safeGetElement('pomodoroTime', '뽀모도로 시간');
        this.breakBtn = safeGetElement('breakBtn', '중단 버튼');
        this.focusBtn = safeGetElement('focusBtn', '종료 버튼');
        
        // 찾은 요소 수 계산
        const allElements = [
            this.userInitial, this.userName, this.logoutBtn, this.studyStatsBtn,
            this.monthlyStatsBtn, this.studyChart, this.pomodoroStartCard,
            this.pomodoroRankingCard, this.eventCard, this.pomodoroTime,
            this.breakBtn, this.focusBtn
        ];
        
        const foundCount = allElements.filter(element => element !== null).length;
        console.log(`📊 총 ${foundCount}/12개의 DOM 요소를 찾았습니다.`);
        
        if (foundCount === 0) {
            console.error('💥 모든 DOM 요소를 찾지 못했습니다!');
            throw new Error('DOM 요소를 찾을 수 없습니다.');
        } else if (foundCount < 12) {
            console.warn(`⚠️ 일부 요소(${12 - foundCount}개)를 찾지 못했습니다.`);
        } else {
            console.log('✅ 모든 DOM 요소를 성공적으로 찾았습니다!');
        }
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
        
        // Update user display
        this.updateUserDisplay();
    }
    
    updateUserDisplay() {
        if (this.currentUser && this.currentUser.id) {
            // Update user name
            this.userName.textContent = this.currentUser.id;
            
            // Update user initial (first letter of username, uppercase)
            const initial = this.currentUser.id.charAt(0).toUpperCase();
            this.userInitial.textContent = initial;
            
            // Generate consistent color based on username
            const colors = [
                'linear-gradient(135deg, #007AFF, #5856D6)',
                'linear-gradient(135deg, #34C759, #32D74B)', 
                'linear-gradient(135deg, #FF9500, #FF6B00)',
                'linear-gradient(135deg, #FF3B30, #D70015)',
                'linear-gradient(135deg, #5856D6, #AF52DE)',
                'linear-gradient(135deg, #00C7BE, #5856D6)'
            ];
            
            const colorIndex = this.currentUser.id.length % colors.length;
            if (this.userInitial.parentElement) {
                this.userInitial.parentElement.style.background = colors[colorIndex];
            }
        }
    }
    
    attachEventListeners() {
        console.log('🔗 이벤트 리스너 연결 시작...');
        
        // 안전한 이벤트 리스너 추가 함수
        const safeAddEventListener = (elementId, eventType, handler, description) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener(eventType, handler);
                console.log(`✅ ${description} 이벤트 연결됨`);
                return true;
            } else {
                console.error(`❌ ${elementId} 요소를 찾을 수 없습니다!`);
                return false;
            }
        };
        
        let successCount = 0;
        
        // 모든 이벤트 리스너를 안전하게 연결
        successCount += safeAddEventListener('logoutBtn', 'click', () => this.handleLogout(), '로그아웃 버튼') ? 1 : 0;
        successCount += safeAddEventListener('studyStatsBtn', 'click', () => this.handleStudyStats(), '학습 통계 버튼') ? 1 : 0;
        successCount += safeAddEventListener('monthlyStatsBtn', 'click', () => this.handleMonthlyStats(), '월별 기록 버튼') ? 1 : 0;
        successCount += safeAddEventListener('pomodoroStartCard', 'click', () => this.handlePomodoroStart(), '뽀모도로 시작 카드') ? 1 : 0;
        successCount += safeAddEventListener('pomodoroRankingCard', 'click', () => this.handlePomodoroRanking(), '뽀모도로 랭킹 카드') ? 1 : 0;
        successCount += safeAddEventListener('eventCard', 'click', () => this.handleEvent(), '이벤트 카드') ? 1 : 0;
        successCount += safeAddEventListener('breakBtn', 'click', () => this.handleBreak(), '중단 버튼') ? 1 : 0;
        successCount += safeAddEventListener('focusBtn', 'click', () => this.handleFocus(), '종료 버튼') ? 1 : 0;
        
        console.log(`📊 총 ${successCount}/8개의 이벤트 리스너가 성공적으로 연결되었습니다.`);
        
        if (successCount === 0) {
            console.error('💥 모든 이벤트 리스너 연결에 실패했습니다!');
            alert('페이지의 모든 버튼이 작동하지 않을 수 있습니다. 페이지를 새로고침해주세요.');
        } else if (successCount < 8) {
            console.warn(`⚠️ 일부 버튼(${8 - successCount}개)이 작동하지 않을 수 있습니다.`);
        }
        
        // Touch feedback for mobile - 성공적으로 연결된 요소들만
        this.addTouchFeedback();
        
        console.log('🎉 이벤트 리스너 연결 완료!');
    }
    
    addTouchFeedback() {
        console.log('📱 터치 피드백 설정 중...');
        
        const interactiveElements = [
            this.logoutBtn, this.studyStatsBtn, this.monthlyStatsBtn,
            this.pomodoroStartCard, this.pomodoroRankingCard, this.eventCard,
            this.breakBtn, this.focusBtn
        ];
        
        let addedCount = 0;
        interactiveElements.forEach((element, index) => {
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
                
                addedCount++;
            } else {
                console.warn(`⚠️ 터치 피드백 요소 ${index}가 null입니다.`);
            }
        });
        
        console.log(`✅ ${addedCount}개 요소에 터치 피드백 추가됨`);
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
    handleLogout() {
        this.addButtonFeedback(this.logoutBtn);
        
        // Show confirmation
        const confirmed = confirm('로그아웃하시겠습니까?');
        if (confirmed) {
            // Clear user data
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userStats');
            
            // Show logout message
            this.showToast('로그아웃되었습니다', 'info');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
    
    handleStudyStats() {
        this.showToast('학습 통계 상세 페이지로 이동합니다');
        this.addButtonFeedback(this.studyStatsBtn);
        console.log('학습 통계 상세보기');
    }
    
    handleMonthlyStats() {
        this.showToast('월별 기록 페이지로 이동합니다');
        this.addButtonFeedback(this.monthlyStatsBtn);
        
        // Navigate to monthly records page
        setTimeout(() => {
            window.location.href = `monthly.html?user=${encodeURIComponent(this.currentUser.id)}`;
        }, 500);
    }
    
    handlePomodoroStart() {
        this.showToast('뽀모도로 시작 페이지로 이동합니다');
        this.addCardFeedback(this.pomodoroStartCard);
        
        // Navigate to pomodoro start page
        setTimeout(() => {
            window.location.href = `pomodoro-start.html?user=${encodeURIComponent(this.currentUser.id)}`;
        }, 500);
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

// Initialize dashboard immediately since DOM is already loaded
console.log('📄 MainDashboard 스크립트 로드됨! 초기화를 시작합니다...');

try {
    const dashboard = new MainDashboard();
    
    // Global access for debugging
    window.dashboard = dashboard;
    
    console.log('🌍 Global dashboard 변수 설정 완료 (디버깅용)');
} catch (error) {
    console.error('💥 MainDashboard 생성 중 오류:', error);
    alert('메인 페이지 로드 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
}
    
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

// Service worker registration disabled (no sw.js file)
console.log('ℹ️ Service Worker 등록을 건너뜁니다 (sw.js 파일 없음)');