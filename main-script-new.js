// 완전히 새로운 MainDashboard 클래스 - 안전한 DOM 접근
class MainDashboard {
    constructor() {
        console.log('🚀 새로운 MainDashboard 초기화 시작...');
        
        this.currentUser = null;
        this.pomodoroTimer = null;
        this.isTimerRunning = false;
        this.timeRemaining = 25 * 60;
        
        // 초기화 단계별 실행
        this.init();
    }
    
    async init() {
        try {
            console.log('1️⃣ 사용자 데이터 로드 중...');
            this.loadUserData();
            
            console.log('2️⃣ 이벤트 리스너 설정 중...');
            this.setupEventListeners();
            
            console.log('3️⃣ UI 업데이트 중...');
            this.updateUI();
            
            console.log('4️⃣ 타이머 시작 중...');
            this.startTimeDisplay();
            
            console.log('🎉 MainDashboard 초기화 완료!');
        } catch (error) {
            console.error('💥 초기화 중 오류:', error);
            alert('페이지 초기화에 실패했습니다. 새로고침해주세요.');
        }
    }
    
    loadUserData() {
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
        
        localStorage.setItem('currentUser', userId);
        console.log('✅ 사용자 데이터 로드 완료:', this.currentUser.id);
    }
    
    setupEventListeners() {
        console.log('🔗 이벤트 리스너 설정 시작...');
        
        // 안전한 이벤트 연결 함수
        const addSafeListener = (selector, event, handler, description) => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener(event, handler);
                console.log(`✅ ${description} 연결됨`);
                return true;
            } else {
                console.warn(`⚠️ ${description} 요소를 찾을 수 없음: ${selector}`);
                return false;
            }
        };
        
        // 모든 이벤트 리스너 연결
        let connected = 0;
        
        // ID 기반 요소들
        connected += addSafeListener('#logoutBtn', 'click', () => this.handleLogout(), '로그아웃 버튼') ? 1 : 0;
        connected += addSafeListener('#studyStatsBtn', 'click', () => this.handleStudyStats(), '학습 통계 버튼') ? 1 : 0;
        connected += addSafeListener('#monthlyStatsBtn', 'click', () => this.handleMonthlyStats(), '월별 기록 버튼') ? 1 : 0;
        connected += addSafeListener('#pomodoroStartCard', 'click', () => this.handlePomodoroStart(), '뽀모도로 시작 카드') ? 1 : 0;
        connected += addSafeListener('#pomodoroRankingCard', 'click', () => this.handlePomodoroRanking(), '뽀모도로 랭킹 카드') ? 1 : 0;
        connected += addSafeListener('#eventCard', 'click', () => this.handleEvent(), '이벤트 카드') ? 1 : 0;
        connected += addSafeListener('#breakBtn', 'click', () => this.handleBreak(), '중단 버튼') ? 1 : 0;
        connected += addSafeListener('#focusBtn', 'click', () => this.handleFocus(), '종료 버튼') ? 1 : 0;
        
        console.log(`📊 총 ${connected}/8개 버튼 연결 완료`);
        
        if (connected === 0) {
            throw new Error('모든 버튼 연결에 실패했습니다.');
        }
    }
    
    updateUI() {
        console.log('🎨 UI 업데이트 중...');
        
        // 사용자 정보 업데이트
        const userName = document.querySelector('#userName');
        const userInitial = document.querySelector('#userInitial');
        
        if (userName && userInitial && this.currentUser) {
            userName.textContent = this.currentUser.id;
            userInitial.textContent = this.currentUser.id.charAt(0).toUpperCase();
            
            // 아바타 색상 설정
            const colors = [
                'linear-gradient(135deg, #007AFF, #5856D6)',
                'linear-gradient(135deg, #34C759, #32D74B)', 
                'linear-gradient(135deg, #FF9500, #FF6B00)',
                'linear-gradient(135deg, #FF3B30, #D70015)',
                'linear-gradient(135deg, #5856D6, #AF52DE)',
                'linear-gradient(135deg, #00C7BE, #5856D6)'
            ];
            
            const colorIndex = this.currentUser.id.length % colors.length;
            const avatar = userInitial.parentElement;
            if (avatar) {
                avatar.style.background = colors[colorIndex];
            }
            
            console.log('✅ 사용자 UI 업데이트 완료');
        }
        
        // 차트 업데이트
        this.updateProgressCharts();
    }
    
    updateProgressCharts() {
        const progressPurple = document.querySelector('.progress-purple');
        const progressOrange = document.querySelector('.progress-orange');
        
        if (progressPurple && progressOrange) {
            const radius = 45;
            const circumference = 2 * Math.PI * radius;
            
            const purpleOffset = circumference * (1 - 0.5);
            progressPurple.style.strokeDashoffset = purpleOffset;
            
            const orangeOffset = circumference * (1 - 0.25);
            progressOrange.style.strokeDashoffset = orangeOffset;
            
            setTimeout(() => {
                progressPurple.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)';
                progressOrange.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)';
            }, 500);
            
            console.log('✅ 차트 업데이트 완료');
        }
    }
    
    startTimeDisplay() {
        const pomodoroTime = document.querySelector('#pomodoroTime');
        if (!pomodoroTime) return;
        
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            pomodoroTime.textContent = timeString;
        };
        
        updateTime();
        setInterval(updateTime, 1000);
        console.log('⏰ 시계 표시 시작');
    }
    
    // 이벤트 핸들러들
    handleLogout() {
        console.log('🚪 로그아웃 클릭됨');
        const confirmed = confirm('로그아웃하시겠습니까?');
        if (confirmed) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userStats');
            this.showToast('로그아웃되었습니다', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
    
    handleStudyStats() {
        console.log('📊 학습 통계 클릭됨');
        this.showToast('학습 통계 상세 페이지로 이동합니다');
    }
    
    handleMonthlyStats() {
        console.log('📅 월별 기록 클릭됨');
        this.showToast('월별 기록 페이지로 이동합니다');
        setTimeout(() => {
            window.location.href = `monthly.html?user=${encodeURIComponent(this.currentUser.id)}`;
        }, 500);
    }
    
    handlePomodoroStart() {
        console.log('🍅 뽀모도로 시작 클릭됨');
        this.showToast('뽀모도로 시작 페이지로 이동합니다');
        setTimeout(() => {
            window.location.href = `pomodoro-start.html?user=${encodeURIComponent(this.currentUser.id)}`;
        }, 500);
    }
    
    handlePomodoroRanking() {
        console.log('🏆 뽀모도로 랭킹 클릭됨');
        this.showToast('뽀모도로 랭킹 페이지로 이동합니다');
    }
    
    handleEvent() {
        console.log('🎉 이벤트 클릭됨');
        this.showToast('진행중인 이벤트 페이지로 이동합니다');
    }
    
    handleBreak() {
        console.log('⏸️ 중단 버튼 클릭됨');
        if (this.isTimerRunning) {
            this.pausePomodoroTimer();
            this.showToast('뽀모도로 타이머를 일시정지했습니다');
        } else {
            this.showToast('진행 중인 타이머가 없습니다');
        }
    }
    
    handleFocus() {
        console.log('⏹️ 종료 버튼 클릭됨');
        if (this.isTimerRunning) {
            this.stopPomodoroTimer();
            this.showToast('뽀모도로 타이머를 종료했습니다');
        } else {
            this.showToast('진행 중인 타이머가 없습니다');
        }
    }
    
    // 타이머 관련 함수들
    pausePomodoroTimer() {
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
            this.pomodoroTimer = null;
        }
        this.isTimerRunning = false;
    }
    
    stopPomodoroTimer() {
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
            this.pomodoroTimer = null;
        }
        this.isTimerRunning = false;
        this.timeRemaining = 25 * 60;
        this.startTimeDisplay();
    }
    
    // UI 피드백 함수
    showToast(message, type = 'info', duration = 2000) {
        console.log(`💬 토스트: ${message}`);
        
        const toast = document.createElement('div');
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
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
        }, 100);
        
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
}

// DOM이 로드되면 즉시 초기화
console.log('📄 새로운 main-script-new.js 로드됨!');

try {
    const dashboard = new MainDashboard();
    window.dashboard = dashboard;
    console.log('🌍 Global dashboard 변수 설정 완료');
} catch (error) {
    console.error('💥 MainDashboard 생성 실패:', error);
    alert('페이지 로드에 실패했습니다. 새로고침해주세요.');
}