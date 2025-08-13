class PomodoroStart {
    constructor() {
        this.currentUser = null;
        this.selectedDate = new Date();
        this.selectedTime = { hour: 9, minute: 30, period: 'AM' };
        this.is50MinuteMode = false;
        
        this.pomodoroData = {
            goal: '',
            tags: '',
            location: '',
            photo: '',
            title: '',
            date: null,
            time: null,
            duration: 25 // Default 25 minutes
        };
        
        this.initializeElements();
        this.loadUserData();
        this.attachEventListeners();
        this.updateDateTime();
        this.initializeTimePicker();
    }
    
    initializeElements() {
        // Header elements
        this.cancelBtn = document.getElementById('cancelBtn');
        this.startHeaderBtn = document.getElementById('startHeaderBtn');
        
        // Date and time elements
        this.dateBtn = document.getElementById('dateBtn');
        this.timeBtn = document.getElementById('timeBtn');
        this.dateText = document.getElementById('dateText');
        this.timeText = document.getElementById('timeText');
        
        // Input elements
        this.goalInput = document.getElementById('goalInput');
        this.tagInput = document.getElementById('tagInput');
        this.locationInput = document.getElementById('locationInput');
        this.photoInput = document.getElementById('photoInput');
        this.titleInput = document.getElementById('titleInput');
        
        // Toggle switch
        this.pomodoroToggle = document.getElementById('pomodoroToggle');
        
        // Bottom start button
        this.startBtn = document.getElementById('startBtn');
        
        // Modal elements
        this.dateModal = document.getElementById('dateModal');
        this.timeModal = document.getElementById('timeModal');
        this.datePicker = document.getElementById('datePicker');
        
        // Modal controls
        this.dateCancelBtn = document.getElementById('dateCancelBtn');
        this.dateConfirmBtn = document.getElementById('dateConfirmBtn');
        this.timeCancelBtn = document.getElementById('timeCancelBtn');
        this.timeConfirmBtn = document.getElementById('timeConfirmBtn');
        
        // Time picker wheels
        this.hourWheel = document.getElementById('hourWheel');
        this.minuteWheel = document.getElementById('minuteWheel');
        this.periodWheel = document.getElementById('periodWheel');
    }
    
    loadUserData() {
        // Get user data from URL parameters or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('user') || localStorage.getItem('currentUser') || '사용자';
        
        this.currentUser = {
            id: userId
        };
    }
    
    attachEventListeners() {
        // Header buttons
        this.cancelBtn.addEventListener('click', () => this.handleCancel());
        this.startHeaderBtn.addEventListener('click', () => this.handleStart());
        
        // Date and time selection
        this.dateBtn.addEventListener('click', () => this.showDatePicker());
        this.timeBtn.addEventListener('click', () => this.showTimePicker());
        
        // Input fields
        this.goalInput.addEventListener('input', (e) => this.updatePomodoroData('goal', e.target.value));
        this.tagInput.addEventListener('input', (e) => this.updatePomodoroData('tags', e.target.value));
        this.locationInput.addEventListener('input', (e) => this.updatePomodoroData('location', e.target.value));
        this.photoInput.addEventListener('input', (e) => this.updatePomodoroData('photo', e.target.value));
        this.titleInput.addEventListener('input', (e) => this.updatePomodoroData('title', e.target.value));
        
        // Toggle switch
        this.pomodoroToggle.addEventListener('click', () => this.togglePomodoroMode());
        
        // Start button
        this.startBtn.addEventListener('click', () => this.handleStart());
        
        // Modal controls
        this.dateCancelBtn.addEventListener('click', () => this.hideDatePicker());
        this.dateConfirmBtn.addEventListener('click', () => this.confirmDateSelection());
        this.timeCancelBtn.addEventListener('click', () => this.hideTimePicker());
        this.timeConfirmBtn.addEventListener('click', () => this.confirmTimeSelection());
        
        // Modal overlay click to close
        this.dateModal.addEventListener('click', (e) => {
            if (e.target === this.dateModal) {
                this.hideDatePicker();
            }
        });
        
        this.timeModal.addEventListener('click', (e) => {
            if (e.target === this.timeModal) {
                this.hideTimePicker();
            }
        });
        
        // Touch feedback
        this.addTouchFeedback();
    }
    
    addTouchFeedback() {
        const interactiveElements = [
            this.cancelBtn, this.startHeaderBtn, this.dateBtn, this.timeBtn,
            this.pomodoroToggle, this.startBtn, this.dateCancelBtn, this.dateConfirmBtn,
            this.timeCancelBtn, this.timeConfirmBtn
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
    
    initializeTimePicker() {
        // Generate hours (1-12)
        this.hourWheel.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('div');
            option.classList.add('time-option');
            option.dataset.value = i;
            option.textContent = i.toString();
            
            if (i === this.selectedTime.hour) {
                option.classList.add('selected');
            }
            
            option.addEventListener('click', () => this.selectTimeOption('hour', i, option));
            this.hourWheel.appendChild(option);
        }
        
        // Generate minutes (00, 15, 30, 45)
        this.minuteWheel.innerHTML = '';
        const minutes = ['00', '15', '30', '45'];
        minutes.forEach(minute => {
            const option = document.createElement('div');
            option.classList.add('time-option');
            option.dataset.value = minute;
            option.textContent = minute;
            
            if (parseInt(minute) === this.selectedTime.minute) {
                option.classList.add('selected');
            }
            
            option.addEventListener('click', () => this.selectTimeOption('minute', parseInt(minute), option));
            this.minuteWheel.appendChild(option);
        });
        
        // Period (AM/PM) already exists in HTML
        const periodOptions = this.periodWheel.querySelectorAll('.time-option');
        periodOptions.forEach(option => {
            const period = option.dataset.value;
            
            if (period === this.selectedTime.period) {
                option.classList.add('selected');
            }
            
            option.addEventListener('click', () => this.selectTimeOption('period', period, option));
        });

        // Add smooth scrolling to time wheels
        this.setupSmoothScrolling(this.hourWheel, 'hour');
        this.setupSmoothScrolling(this.minuteWheel, 'minute');
        this.setupSmoothScrolling(this.periodWheel, 'period');
    }
    
    selectTimeOption(type, value, element) {
        // Remove previous selection
        const wheel = type === 'hour' ? this.hourWheel : 
                     type === 'minute' ? this.minuteWheel : this.periodWheel;
        wheel.querySelectorAll('.time-option').forEach(opt => opt.classList.remove('selected'));
        
        // Add selection to clicked option
        element.classList.add('selected');
        
        // Update selected time
        this.selectedTime[type] = value;
        
        // Haptic feedback
        this.simulateHapticFeedback();
    }
    
    updateDateTime() {
        // Update date display
        this.dateText.textContent = this.selectedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Update time display
        const hour = this.selectedTime.hour;
        const minute = this.selectedTime.minute.toString().padStart(2, '0');
        const period = this.selectedTime.period;
        this.timeText.textContent = `${hour}:${minute} ${period}`;
        
        // Update date picker
        this.datePicker.value = this.selectedDate.toISOString().split('T')[0];
    }
    
    updatePomodoroData(field, value) {
        this.pomodoroData[field] = value;
        console.log('Updated pomodoro data:', this.pomodoroData);
    }
    
    togglePomodoroMode() {
        this.is50MinuteMode = !this.is50MinuteMode;
        this.pomodoroToggle.classList.toggle('active', this.is50MinuteMode);
        
        // Update duration
        this.pomodoroData.duration = this.is50MinuteMode ? 50 : 25;
        
        this.simulateHapticFeedback();
        this.showToast(this.is50MinuteMode ? '50분 모드 활성화' : '25분 모드로 전환', 'info');
    }

    setupSmoothScrolling(wheel, type) {
        let isScrolling = false;
        let scrollTimeout;
        let startY = 0;
        let currentY = 0;
        
        // Add momentum scrolling
        wheel.addEventListener('scroll', () => {
            if (!isScrolling) {
                wheel.style.scrollBehavior = 'auto';
                isScrolling = true;
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.snapToNearestOption(wheel, type);
                isScrolling = false;
                wheel.style.scrollBehavior = 'smooth';
            }, 150);
        }, { passive: true });

        // Add wheel event for better desktop experience
        wheel.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scrollDirection = e.deltaY > 0 ? 1 : -1;
            const options = wheel.querySelectorAll('.time-option');
            const currentIndex = this.getCurrentSelectedIndex(wheel, type);
            let newIndex = currentIndex + scrollDirection;
            
            // Wrap around
            if (newIndex < 0) newIndex = options.length - 1;
            if (newIndex >= options.length) newIndex = 0;
            
            const newOption = options[newIndex];
            if (newOption) {
                const value = type === 'hour' ? parseInt(newOption.textContent) :
                             type === 'minute' ? parseInt(newOption.textContent) :
                             newOption.dataset.value;
                this.selectTimeOption(type, value, newOption);
                
                // Smooth scroll to center the option
                newOption.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'center'
                });
            }
        }, { passive: false });

        // Add touch/swipe support for mobile
        wheel.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            wheel.style.scrollBehavior = 'auto';
        }, { passive: true });
        
        wheel.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const deltaY = startY - currentY;
            wheel.scrollTop += deltaY * 0.6; // Smooth factor
            startY = currentY;
        }, { passive: true });
        
        wheel.addEventListener('touchend', () => {
            setTimeout(() => {
                this.snapToNearestOption(wheel, type);
                wheel.style.scrollBehavior = 'smooth';
            }, 100);
        }, { passive: true });
    }

    getCurrentSelectedIndex(wheel, type) {
        const options = wheel.querySelectorAll('.time-option');
        const currentValue = type === 'hour' ? this.selectedTime.hour :
                           type === 'minute' ? this.selectedTime.minute :
                           this.selectedTime.period;
        
        for (let i = 0; i < options.length; i++) {
            const optionValue = type === 'hour' ? parseInt(options[i].textContent) :
                               type === 'minute' ? parseInt(options[i].textContent) :
                               options[i].dataset.value;
            if (optionValue === currentValue) return i;
        }
        return 0;
    }

    snapToNearestOption(wheel, type) {
        const options = wheel.querySelectorAll('.time-option');
        const wheelRect = wheel.getBoundingClientRect();
        const wheelCenter = wheelRect.top + wheelRect.height / 2;
        
        let closestOption = null;
        let closestDistance = Infinity;
        
        options.forEach(option => {
            const optionRect = option.getBoundingClientRect();
            const optionCenter = optionRect.top + optionRect.height / 2;
            const distance = Math.abs(wheelCenter - optionCenter);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestOption = option;
            }
        });
        
        if (closestOption) {
            const value = type === 'hour' ? parseInt(closestOption.textContent) :
                         type === 'minute' ? parseInt(closestOption.textContent) :
                         closestOption.dataset.value;
            this.selectTimeOption(type, value, closestOption);
            
            // Smooth scroll to center
            closestOption.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
            });
        }
    }
    
    // Date picker functions
    showDatePicker() {
        this.dateModal.classList.remove('hidden');
        this.addButtonFeedback(this.dateBtn);
    }
    
    hideDatePicker() {
        this.dateModal.classList.add('hidden');
    }
    
    confirmDateSelection() {
        const selectedDateValue = this.datePicker.value;
        if (selectedDateValue) {
            this.selectedDate = new Date(selectedDateValue);
            this.updateDateTime();
            this.showToast('날짜가 선택되었습니다');
        }
        this.hideDatePicker();
    }
    
    // Time picker functions
    showTimePicker() {
        this.timeModal.classList.remove('hidden');
        this.addButtonFeedback(this.timeBtn);
    }
    
    hideTimePicker() {
        this.timeModal.classList.add('hidden');
    }
    
    confirmTimeSelection() {
        this.updateDateTime();
        this.showToast('시간이 선택되었습니다');
        this.hideTimePicker();
    }
    
    // Event handlers
    handleCancel() {
        this.addButtonFeedback(this.cancelBtn);
        
        // Show confirmation if there's unsaved data
        const hasData = this.pomodoroData.goal || this.pomodoroData.title || 
                       this.pomodoroData.tags || this.pomodoroData.location;
        
        if (hasData) {
            const confirmed = confirm('작성 중인 내용이 있습니다. 정말로 취소하시겠습니까?');
            if (!confirmed) return;
        }
        
        // Navigate back to main page
        if (this.currentUser) {
            window.location.href = `main.html?user=${encodeURIComponent(this.currentUser.id)}`;
        } else {
            window.location.href = 'main.html';
        }
    }
    
    async handleStart() {
        // Validate required fields
        if (!this.validateInputs()) {
            return;
        }
        
        this.startBtn.classList.add('loading');
        this.startHeaderBtn.classList.add('loading');
        
        try {
            // Prepare pomodoro session data
            const sessionData = {
                ...this.pomodoroData,
                date: this.selectedDate,
                time: this.selectedTime,
                duration: this.is50MinuteMode ? 50 : 25,
                user: this.currentUser.id,
                createdAt: new Date().toISOString()
            };
            
            // Simulate API call
            await this.createPomodoroSession(sessionData);
            
            // Show success message
            this.showSuccessMessage();
            
            // Navigate to timer page
            setTimeout(() => {
                this.navigateToTimer(sessionData);
            }, 2000);
            
        } catch (error) {
            this.showErrorMessage(error.message);
        } finally {
            this.startBtn.classList.remove('loading');
            this.startHeaderBtn.classList.remove('loading');
        }
    }
    
    validateInputs() {
        // Check if at least title or goal is provided
        if (!this.pomodoroData.title && !this.pomodoroData.goal) {
            this.showToast('제목 또는 목표를 입력해주세요', 'error');
            return false;
        }
        
        // Check if date is not in the past (optional validation)
        const now = new Date();
        const selectedDateTime = new Date(this.selectedDate);
        
        // Set time on selected date
        let hour = this.selectedTime.hour;
        if (this.selectedTime.period === 'PM' && hour !== 12) {
            hour += 12;
        } else if (this.selectedTime.period === 'AM' && hour === 12) {
            hour = 0;
        }
        
        selectedDateTime.setHours(hour, this.selectedTime.minute, 0, 0);
        
        if (selectedDateTime < now) {
            this.showToast('과거 시간은 선택할 수 없습니다', 'error');
            return false;
        }
        
        return true;
    }
    
    async createPomodoroSession(sessionData) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Store session data in localStorage
        const sessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '[]');
        sessions.push({
            ...sessionData,
            id: `session_${Date.now()}`,
            status: 'scheduled'
        });
        localStorage.setItem('pomodoroSessions', JSON.stringify(sessions));
        
        return { success: true, sessionId: `session_${Date.now()}` };
    }
    
    navigateToTimer(sessionData) {
        // Navigate to pomodoro timer page with session data
        const params = new URLSearchParams({
            user: this.currentUser.id,
            duration: sessionData.duration.toString(),
            title: sessionData.title || sessionData.goal || '뽀모도로 세션',
            sessionId: `session_${Date.now()}`
        });
        
        window.location.href = `pomodoro-timer.html?${params.toString()}`;
    }
    
    showSuccessMessage() {
        this.startBtn.textContent = '세션 생성 완료!';
        this.startBtn.style.background = '#34C759';
        this.startHeaderBtn.textContent = '완료';
        
        // Haptic feedback
        this.simulateHapticFeedback();
    }
    
    showErrorMessage(message) {
        this.startBtn.textContent = '다시 시도';
        this.startBtn.style.background = '#FF3B30';
        
        setTimeout(() => {
            this.startBtn.textContent = '시작';
            this.startBtn.style.background = '#007AFF';
        }, 2000);
        
        // Show toast
        this.showToast(message, 'error');
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
        document.body.style.transform = 'translateY(-2px)';
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
    
    formatTime(time) {
        const { hour, minute, period } = time;
        return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
    }
}

// Initialize pomodoro start when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const pomodoroStart = new PomodoroStart();
    
    // Global access for debugging
    window.pomodoroStart = pomodoroStart;
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('뽀모도로 시작 페이지가 숨겨짐');
        } else {
            console.log('뽀모도로 시작 페이지가 다시 표시됨');
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
            if (!pomodoroStart.dateModal.classList.contains('hidden')) {
                pomodoroStart.hideDatePicker();
            } else if (!pomodoroStart.timeModal.classList.contains('hidden')) {
                pomodoroStart.hideTimePicker();
            } else {
                pomodoroStart.handleCancel();
            }
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            // Cmd/Ctrl + Enter to start
            pomodoroStart.handleStart();
        }
    });
});

// Handle back button navigation
window.addEventListener('popstate', (e) => {
    console.log('뒤로가기 감지 - 메인 페이지로 이동');
    // Handle navigation state
});

// Prevent accidental navigation
window.addEventListener('beforeunload', (e) => {
    const hasData = window.pomodoroStart && (
        window.pomodoroStart.pomodoroData.goal || 
        window.pomodoroStart.pomodoroData.title ||
        window.pomodoroStart.pomodoroData.tags ||
        window.pomodoroStart.pomodoroData.location
    );
    
    if (hasData) {
        e.preventDefault();
        e.returnValue = '작성 중인 내용이 있습니다. 정말 페이지를 떠나시겠습니까?';
        return e.returnValue;
    }
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