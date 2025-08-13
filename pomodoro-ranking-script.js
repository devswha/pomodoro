class PomodoroRanking {
    constructor() {
        console.log('🏆 PomodoroRanking 초기화 시작...');
        
        this.currentUser = null;
        this.currentMonth = 12; // December
        this.currentYear = 2024;
        this.rankingData = [];
        
        this.init();
    }
    
    async init() {
        try {
            console.log('1️⃣ 사용자 데이터 로드 중...');
            this.loadUserData();
            
            console.log('2️⃣ 이벤트 리스너 설정 중...');
            this.setupEventListeners();
            
            console.log('3️⃣ 랭킹 데이터 로드 중...');
            this.loadRankingData();
            
            console.log('4️⃣ UI 업데이트 중...');
            this.updateUI();
            
            console.log('🎉 PomodoroRanking 초기화 완료!');
        } catch (error) {
            console.error('💥 초기화 중 오류:', error);
            alert('페이지 초기화에 실패했습니다. 새로고침해주세요.');
        }
    }
    
    loadUserData() {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user') || localStorage.getItem('currentUser') || '사용자';
        
        this.currentUser = {
            id: userId
        };
        
        console.log('✅ 사용자 데이터 로드 완료:', this.currentUser.id);
    }
    
    setupEventListeners() {
        console.log('🔗 이벤트 리스너 설정 시작...');
        
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
        
        let connected = 0;
        
        // Navigation
        connected += addSafeListener('#backBtn', 'click', () => this.handleBack(), '뒤로가기 버튼') ? 1 : 0;
        connected += addSafeListener('#prevMonthBtn', 'click', () => this.handlePrevMonth(), '이전 달 버튼') ? 1 : 0;
        connected += addSafeListener('#nextMonthBtn', 'click', () => this.handleNextMonth(), '다음 달 버튼') ? 1 : 0;
        connected += addSafeListener('#monthBtn', 'click', () => this.showMonthPicker(), '월 선택 버튼') ? 1 : 0;
        
        // Modal controls
        connected += addSafeListener('#monthCancelBtn', 'click', () => this.hideMonthPicker(), '월 선택 취소 버튼') ? 1 : 0;
        connected += addSafeListener('#monthConfirmBtn', 'click', () => this.confirmMonthSelection(), '월 선택 확인 버튼') ? 1 : 0;
        
        // Month options
        const monthOptions = document.querySelectorAll('.month-option');
        monthOptions.forEach(option => {
            option.addEventListener('click', (e) => this.selectMonth(e));
            connected++;
        });
        
        // Modal overlay click to close
        const monthModal = document.querySelector('#monthModal');
        if (monthModal) {
            monthModal.addEventListener('click', (e) => {
                if (e.target === monthModal) {
                    this.hideMonthPicker();
                }
            });
            connected++;
        }
        
        console.log(`📊 총 ${connected}개의 이벤트 리스너가 연결되었습니다.`);
    }
    
    loadRankingData() {
        // Generate mock ranking data for the current month
        this.rankingData = [
            {
                rank: 1,
                name: '홍길동',
                medal: '🥈',
                score: 2400,
                achievement: '2000점 이상',
                isCurrentUser: false
            },
            {
                rank: 2,
                name: '김정지',
                medal: '🏅',
                score: 1700,
                achievement: '500점 이상',
                isCurrentUser: false
            },
            {
                rank: 3,
                name: '잠순이',
                medal: '❤️',
                score: 900,
                achievement: '',
                isCurrentUser: false
            },
            {
                rank: 4,
                name: '홍 도',
                medal: '🥉',
                score: 300,
                achievement: '',
                isCurrentUser: false
            },
            {
                rank: 5,
                name: '이광수',
                medal: '🌈',
                score: 0,
                achievement: '',
                isCurrentUser: false
            }
        ];
        
        // Check if current user is in ranking
        const userRank = this.rankingData.find(user => user.name === this.currentUser.id);
        if (!userRank && this.currentUser.id !== '사용자') {
            // Add current user to ranking if not present
            this.rankingData.push({
                rank: this.rankingData.length + 1,
                name: this.currentUser.id,
                medal: '🆕',
                score: Math.floor(Math.random() * 500),
                achievement: '새로운 사용자',
                isCurrentUser: true
            });
        }
        
        console.log('✅ 랭킹 데이터 로드 완료:', this.rankingData.length, '명');
    }
    
    updateUI() {
        console.log('🎨 UI 업데이트 중...');
        
        // Update month display
        const monthText = document.querySelector('#monthText');
        if (monthText) {
            monthText.textContent = `${this.currentMonth}월`;
        }
        
        // Update ranking list (already in HTML, but could be dynamic)
        this.updateRankingList();
        
        // Update month picker selection
        this.updateMonthPickerSelection();
        
        console.log('✅ UI 업데이트 완료');
    }
    
    updateRankingList() {
        const rankingSection = document.querySelector('.ranking-section');
        if (!rankingSection) return;
        
        // Clear existing items
        rankingSection.innerHTML = '';
        
        // Generate ranking items
        this.rankingData.forEach((user, index) => {
            const rankItem = document.createElement('div');
            rankItem.className = `ranking-item rank-${index + 1}`;
            
            if (user.isCurrentUser) {
                rankItem.classList.add('current-user');
                rankItem.style.background = 'linear-gradient(135deg, #E6F3FF, #FFFFFF)';
                rankItem.style.borderLeft = '4px solid #007AFF';
            }
            
            rankItem.innerHTML = `
                <div class="rank-info">
                    <div class="user-details">
                        <span class="user-name">${user.name}</span>
                        <span class="user-medal">${user.medal}</span>
                    </div>
                    <div class="user-meta">
                        <span class="user-achievement">${user.achievement}</span>
                    </div>
                </div>
                <div class="user-score">${user.score}</div>
            `;
            
            // Add click event
            rankItem.addEventListener('click', () => this.handleUserClick(user));
            
            rankingSection.appendChild(rankItem);
        });
        
        console.log('✅ 랭킹 리스트 업데이트 완료');
    }
    
    updateMonthPickerSelection() {
        const monthOptions = document.querySelectorAll('.month-option');
        monthOptions.forEach(option => {
            const month = parseInt(option.dataset.month);
            if (month === this.currentMonth) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
    
    // Event handlers
    handleBack() {
        console.log('🔙 뒤로가기 클릭됨');
        
        if (this.currentUser && this.currentUser.id) {
            window.location.href = `main.html?user=${encodeURIComponent(this.currentUser.id)}`;
        } else {
            window.location.href = 'main.html';
        }
    }
    
    handlePrevMonth() {
        console.log('⬅️ 이전 달 클릭됨');
        
        this.currentMonth--;
        if (this.currentMonth < 1) {
            this.currentMonth = 12;
            this.currentYear--;
        }
        
        this.showToast(`${this.currentMonth}월로 이동`);
        this.loadRankingData();
        this.updateUI();
    }
    
    handleNextMonth() {
        console.log('➡️ 다음 달 클릭됨');
        
        this.currentMonth++;
        if (this.currentMonth > 12) {
            this.currentMonth = 1;
            this.currentYear++;
        }
        
        this.showToast(`${this.currentMonth}월로 이동`);
        this.loadRankingData();
        this.updateUI();
    }
    
    showMonthPicker() {
        console.log('📅 월 선택기 표시');
        
        const monthModal = document.querySelector('#monthModal');
        if (monthModal) {
            monthModal.classList.remove('hidden');
        }
    }
    
    hideMonthPicker() {
        console.log('📅 월 선택기 숨김');
        
        const monthModal = document.querySelector('#monthModal');
        if (monthModal) {
            monthModal.classList.add('hidden');
        }
    }
    
    selectMonth(e) {
        const month = parseInt(e.target.dataset.month);
        console.log(`📅 ${month}월 선택됨`);
        
        // Update selection visually
        document.querySelectorAll('.month-option').forEach(option => {
            option.classList.remove('selected');
        });
        e.target.classList.add('selected');
        
        // Store temporarily (will be applied on confirm)
        this.tempSelectedMonth = month;
    }
    
    confirmMonthSelection() {
        console.log('✅ 월 선택 확인됨');
        
        if (this.tempSelectedMonth) {
            this.currentMonth = this.tempSelectedMonth;
            this.showToast(`${this.currentMonth}월 랭킹으로 변경`);
            this.loadRankingData();
            this.updateUI();
        }
        
        this.hideMonthPicker();
    }
    
    handleUserClick(user) {
        console.log('👤 사용자 클릭됨:', user.name);
        
        if (user.isCurrentUser) {
            this.showToast('내 랭킹 정보입니다', 'info');
        } else {
            this.showToast(`${user.name}님의 상세 정보`, 'info');
        }
    }
    
    // Utility functions
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
    
    // Data generation methods
    generateRandomScore() {
        return Math.floor(Math.random() * 3000);
    }
    
    getMedalForRank(rank) {
        const medals = ['🥇', '🥈', '🥉', '🏅', '⭐', '💎', '🔥', '❤️', '🌈', '🆕'];
        return medals[rank - 1] || '🏃‍♂️';
    }
    
    getAchievementForScore(score) {
        if (score >= 2000) return '2000점 이상';
        if (score >= 1000) return '1000점 이상';
        if (score >= 500) return '500점 이상';
        return '';
    }
    
    // Export/Share functionality
    exportRanking() {
        const data = {
            month: `${this.currentYear}년 ${this.currentMonth}월`,
            ranking: this.rankingData,
            exportedAt: new Date().toISOString()
        };
        
        console.log('📤 랭킹 데이터 내보내기:', data);
        this.showToast('랭킹 데이터가 내보내졌습니다', 'success');
        
        return data;
    }
}

// Initialize ranking page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM 로드 완료! PomodoroRanking 초기화 시작...');
    
    try {
        const ranking = new PomodoroRanking();
        
        // Global access for debugging
        window.pomodoroRanking = ranking;
        
        console.log('🌍 Global pomodoroRanking 변수 설정 완료');
    } catch (error) {
        console.error('💥 PomodoroRanking 생성 실패:', error);
        alert('랭킹 페이지 로드에 실패했습니다. 새로고침해주세요.');
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('랭킹 페이지가 숨겨짐');
    } else {
        console.log('랭킹 페이지가 다시 표시됨');
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
    if (e.key === 'Escape') {
        // Close modals or go back
        const monthModal = document.querySelector('#monthModal');
        if (monthModal && !monthModal.classList.contains('hidden')) {
            window.pomodoroRanking?.hideMonthPicker();
        } else {
            window.pomodoroRanking?.handleBack();
        }
    } else if (e.key === 'ArrowLeft') {
        // Previous month
        window.pomodoroRanking?.handlePrevMonth();
    } else if (e.key === 'ArrowRight') {
        // Next month
        window.pomodoroRanking?.handleNextMonth();
    }
});

// Handle back button navigation
window.addEventListener('popstate', (e) => {
    console.log('뒤로가기 감지 - 메인 페이지로 이동');
    // Handle navigation state
});