class MyPage {
    constructor() {
        console.log('📊 MyPage 초기화 시작...');
        
        this.currentUser = null;
        this.currentPeriod = 'month';
        this.startDate = new Date();
        this.endDate = new Date();
        this.charts = {};
        this.studyData = {};
        
        this.init();
    }
    
    async init() {
        try {
            console.log('1️⃣ 사용자 데이터 로드 중...');
            this.loadUserData();
            
            console.log('2️⃣ 이벤트 리스너 설정 중...');
            this.setupEventListeners();
            
            console.log('3️⃣ 학습 데이터 로드 중...');
            this.loadStudyData();
            
            console.log('4️⃣ UI 업데이트 중...');
            this.updateUI();
            
            console.log('5️⃣ 차트 초기화 중...');
            this.initializeCharts();
            
            console.log('🎉 MyPage 초기화 완료!');
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
            name: userId,
            location: '이매/95',
            stats: {
                mostFocusedSessions: 15,
                totalPomodoroSessions: 100,
                stickerCount: 50,
                stickerPercentage: 50,
                verticalCount: 40,
                verticalPercentage: 40,
                crossCount: 10,
                crossPercentage: 10,
                monthlyPoints: 253,
                monthlyPointsPercentage: 10,
                mostPenaltySessions: 7,
                challengeCount: 24
            }
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
        connected += addSafeListener('#searchBtn', 'click', () => this.handleSearch(), '검색 버튼') ? 1 : 0;
        
        // Filter controls
        connected += addSafeListener('#periodSelect', 'change', (e) => this.handlePeriodChange(e), '기간 선택') ? 1 : 0;
        connected += addSafeListener('#dateRangeBtn', 'click', () => this.showDateRangePicker(), '날짜 범위 버튼') ? 1 : 0;
        
        // Modal controls
        connected += addSafeListener('#dateRangeCancelBtn', 'click', () => this.hideDateRangePicker(), '날짜 선택 취소') ? 1 : 0;
        connected += addSafeListener('#dateRangeConfirmBtn', 'click', () => this.confirmDateRange(), '날짜 선택 확인') ? 1 : 0;
        
        // Modal overlay
        const dateRangeModal = document.querySelector('#dateRangeModal');
        if (dateRangeModal) {
            dateRangeModal.addEventListener('click', (e) => {
                if (e.target === dateRangeModal) {
                    this.hideDateRangePicker();
                }
            });
            connected++;
        }
        
        // Stat cards click events
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.addEventListener('click', () => this.handleStatCardClick(card, index));
            connected++;
        });
        
        console.log(`📊 총 ${connected}개의 이벤트 리스너가 연결되었습니다.`);
    }
    
    loadStudyData() {
        // Generate mock study data for charts
        this.studyData = {
            pomodoroTop5: {
                pv: 64.4,
                grid: 69.88,
                battery: 182.28,
                total: 317
            },
            stickerTop5: {
                pv: 64.4,
                grid: 69.88,
                battery: 182.28,
                total: 317
            },
            challengeTop5: {
                pv: 64.4,
                grid: 69.88,
                battery: 182.28,
                total: 317
            },
            hourlyStudy: this.generateHourlyData(),
            cumulativeStudy: this.generateCumulativeData()
        };
        
        console.log('✅ 학습 데이터 로드 완료');
    }
    
    generateHourlyData() {
        const hours = [];
        for (let i = 0; i < 24; i++) {
            const positiveValue = Math.random() * 100 + 20;
            const negativeValue = -(Math.random() * 50 + 10);
            hours.push({
                hour: i,
                positive: positiveValue,
                negative: negativeValue,
                net: positiveValue + negativeValue
            });
        }
        return hours;
    }
    
    generateCumulativeData() {
        const days = [];
        let cumulative = 0;
        for (let i = 0; i < 30; i++) {
            const dailyStudy = Math.random() * 4 + 1; // 1-5 hours per day
            cumulative += dailyStudy;
            days.push({
                day: i + 1,
                daily: dailyStudy,
                cumulative: cumulative
            });
        }
        return days;
    }
    
    updateUI() {
        console.log('🎨 UI 업데이트 중...');
        
        // Update page title with user info
        const pageTitle = document.querySelector('#pageTitle');
        if (pageTitle && this.currentUser) {
            pageTitle.textContent = `${this.currentUser.name}/${this.currentUser.location}의 My Page`;
        }
        
        // Update date range display
        this.updateDateRangeDisplay();
        
        // Update statistics with real data
        this.updateStatistics();
        
        console.log('✅ UI 업데이트 완료');
    }
    
    updateDateRangeDisplay() {
        const dateRangeText = document.querySelector('#dateRangeText');
        if (dateRangeText) {
            const startStr = this.formatDate(this.startDate);
            const endStr = this.formatDate(this.endDate);
            dateRangeText.textContent = `${startStr} → ${endStr}`;
        }
        
        // Update date inputs
        const startDateInput = document.querySelector('#startDate');
        const endDateInput = document.querySelector('#endDate');
        
        if (startDateInput) {
            startDateInput.value = this.startDate.toISOString().split('T')[0];
        }
        if (endDateInput) {
            endDateInput.value = this.endDate.toISOString().split('T')[0];
        }
    }
    
    updateStatistics() {
        const stats = this.currentUser.stats;
        
        // Update stat values (could be dynamic based on selected period)
        console.log('📈 통계 데이터 업데이트:', stats);
    }
    
    initializeCharts() {
        console.log('📊 차트 초기화 시작...');
        
        try {
            // Initialize Study Hours Chart
            this.initializeStudyHoursChart();
            
            // Initialize Cumulative Chart
            this.initializeCumulativeChart();
            
            console.log('✅ 모든 차트 초기화 완료');
        } catch (error) {
            console.error('❌ 차트 초기화 실패:', error);
            // Continue without charts if Chart.js is not available
            console.log('ℹ️ Chart.js를 사용할 수 없어 차트를 건너뜁니다.');
        }
    }
    
    initializeStudyHoursChart() {
        const ctx = document.getElementById('studyHoursChart');
        if (!ctx || typeof Chart === 'undefined') {
            console.warn('⚠️ studyHoursChart 또는 Chart.js를 찾을 수 없습니다.');
            return;
        }
        
        const data = this.studyData.hourlyStudy;
        
        this.charts.studyHours = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => `${d.hour}:00`),
                datasets: [{
                    label: '집중 시간',
                    data: data.map(d => d.positive),
                    backgroundColor: '#34C759',
                    borderRadius: 4,
                    borderSkipped: false,
                }, {
                    label: '휴식 시간',
                    data: data.map(d => d.negative),
                    backgroundColor: '#FF3B30',
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: '#F0F0F0'
                        }
                    }
                }
            }
        });
        
        console.log('✅ 시간별 학습 차트 초기화 완료');
    }
    
    initializeCumulativeChart() {
        const ctx = document.getElementById('cumulativeChart');
        if (!ctx || typeof Chart === 'undefined') {
            console.warn('⚠️ cumulativeChart 또는 Chart.js를 찾을 수 없습니다.');
            return;
        }
        
        const data = this.studyData.cumulativeStudy;
        
        this.charts.cumulative = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.day),
                datasets: [{
                    label: '누적 학습시간',
                    data: data.map(d => d.cumulative),
                    borderColor: '#007AFF',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                }
            }
        });
        
        console.log('✅ 누적 학습 차트 초기화 완료');
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
    
    handleSearch() {
        console.log('🔍 검색 버튼 클릭됨');
        this.showToast('검색 기능은 준비 중입니다', 'info');
    }
    
    handlePeriodChange(e) {
        this.currentPeriod = e.target.value;
        console.log(`📅 기간 변경: ${this.currentPeriod}`);
        
        // Update date range based on period
        this.updateDateRangeForPeriod(this.currentPeriod);
        this.refreshData();
        this.showToast(`${this.getPeriodName(this.currentPeriod)} 기간으로 변경`);
    }
    
    updateDateRangeForPeriod(period) {
        const now = new Date();
        
        switch (period) {
            case 'day':
                this.startDate = new Date(now);
                this.endDate = new Date(now);
                break;
            case 'week':
                this.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                this.endDate = new Date(now);
                break;
            case 'month':
                this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                this.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
        }
        
        this.updateDateRangeDisplay();
    }
    
    getPeriodName(period) {
        const names = {
            'day': '일간',
            'week': '주간',
            'month': '월간'
        };
        return names[period] || period;
    }
    
    showDateRangePicker() {
        console.log('📅 날짜 범위 선택기 표시');
        
        const modal = document.querySelector('#dateRangeModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    hideDateRangePicker() {
        console.log('📅 날짜 범위 선택기 숨김');
        
        const modal = document.querySelector('#dateRangeModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    confirmDateRange() {
        console.log('✅ 날짜 범위 선택 확인');
        
        const startDateInput = document.querySelector('#startDate');
        const endDateInput = document.querySelector('#endDate');
        
        if (startDateInput && endDateInput) {
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            
            if (startDate <= endDate) {
                this.startDate = startDate;
                this.endDate = endDate;
                this.updateDateRangeDisplay();
                this.refreshData();
                this.showToast('날짜 범위가 변경되었습니다');
            } else {
                this.showToast('시작일이 종료일보다 늦을 수 없습니다', 'error');
                return;
            }
        }
        
        this.hideDateRangePicker();
    }
    
    handleStatCardClick(card, index) {
        console.log(`📊 통계 카드 클릭됨: ${index}`);
        
        const labels = [
            '가장 잠심 횟수', '총 뽀모도로 횟수', '스티커 (+3)', '세로 (+2)',
            '엑스 (+1)', '이번달 상점', '가장 벌주 횟수', '챌린지 횟수'
        ];
        
        const label = labels[index] || '통계';
        this.showToast(`${label} 상세 정보`, 'info');
    }
    
    refreshData() {
        console.log('🔄 데이터 새로고침 중...');
        
        // Reload study data for new date range
        this.loadStudyData();
        this.updateUI();
        
        // Update charts if they exist
        if (this.charts.studyHours) {
            this.charts.studyHours.destroy();
            this.initializeStudyHoursChart();
        }
        
        if (this.charts.cumulative) {
            this.charts.cumulative.destroy();
            this.initializeCumulativeChart();
        }
        
        console.log('✅ 데이터 새로고침 완료');
    }
    
    // Utility functions
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    showToast(message, type = 'info', duration = 2000) {
        console.log(`💬 토스트: ${message}`);
        
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 140px;
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
    
    // Export functionality
    exportData() {
        const data = {
            user: this.currentUser,
            period: this.currentPeriod,
            dateRange: {
                start: this.startDate,
                end: this.endDate
            },
            studyData: this.studyData,
            exportedAt: new Date().toISOString()
        };
        
        console.log('📤 데이터 내보내기:', data);
        this.showToast('학습 데이터가 내보내졌습니다', 'success');
        
        return data;
    }
}

// Initialize MyPage when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM 로드 완료! MyPage 초기화 시작...');
    
    try {
        const myPage = new MyPage();
        
        // Global access for debugging
        window.myPage = myPage;
        
        console.log('🌍 Global myPage 변수 설정 완료');
    } catch (error) {
        console.error('💥 MyPage 생성 실패:', error);
        alert('마이페이지 로드에 실패했습니다. 새로고침해주세요.');
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('마이페이지가 숨겨짐');
    } else {
        console.log('마이페이지가 다시 표시됨');
        // Refresh data when page becomes visible
        if (window.myPage) {
            window.myPage.refreshData();
        }
    }
});

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
        // Resize charts if they exist
        if (window.myPage && window.myPage.charts) {
            Object.values(window.myPage.charts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
        }
    }, 100);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close modals or go back
        const dateRangeModal = document.querySelector('#dateRangeModal');
        if (dateRangeModal && !dateRangeModal.classList.contains('hidden')) {
            window.myPage?.hideDateRangePicker();
        } else {
            window.myPage?.handleBack();
        }
    } else if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        // Refresh data with Ctrl/Cmd + R
        e.preventDefault();
        window.myPage?.refreshData();
    }
});

// Handle back button navigation
window.addEventListener('popstate', (e) => {
    console.log('뒤로가기 감지 - 메인 페이지로 이동');
    // Handle navigation state
});