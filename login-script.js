class LoginForm {
    constructor() {
        this.loginId = '';
        this.loginPassword = '';
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateLoginButtonState();
    }
    
    initializeElements() {
        this.loginIdInput = document.getElementById('loginId');
        this.loginPasswordInput = document.getElementById('loginPassword');
        this.loginButton = document.getElementById('loginButton');
        this.signupLink = document.querySelector('.signup-link');
        this.forgotIdLink = document.getElementById('forgotId');
        this.forgotPasswordLink = document.getElementById('forgotPassword');
    }
    
    attachEventListeners() {
        // Input field events
        this.loginIdInput.addEventListener('input', (e) => this.handleIdInput(e));
        this.loginPasswordInput.addEventListener('input', (e) => this.handlePasswordInput(e));
        
        // Focus/blur events for better UX
        this.loginIdInput.addEventListener('focus', (e) => this.handleInputFocus(e));
        this.loginIdInput.addEventListener('blur', (e) => this.handleInputBlur(e));
        this.loginPasswordInput.addEventListener('focus', (e) => this.handleInputFocus(e));
        this.loginPasswordInput.addEventListener('blur', (e) => this.handleInputBlur(e));
        
        // Button events
        this.loginButton.addEventListener('click', () => this.handleLogin());
        this.signupLink.addEventListener('click', () => this.handleSignup());
        this.forgotIdLink.addEventListener('click', () => this.handleForgotId());
        this.forgotPasswordLink.addEventListener('click', () => this.handleForgotPassword());
        
        // Form submission via Enter key
        this.loginIdInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.loginPasswordInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Prevent form auto-submission
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.target === this.loginIdInput || e.target === this.loginPasswordInput)) {
                e.preventDefault();
                if (this.isFormValid()) {
                    this.handleLogin();
                } else {
                    // Focus next field if current is filled
                    if (e.target === this.loginIdInput && this.loginId.trim()) {
                        this.loginPasswordInput.focus();
                    }
                }
            }
        });
    }
    
    handleIdInput(e) {
        this.loginId = e.target.value;
        this.removeInputError(e.target);
        this.updateLoginButtonState();
    }
    
    handlePasswordInput(e) {
        this.loginPassword = e.target.value;
        this.removeInputError(e.target);
        this.updateLoginButtonState();
    }
    
    handleInputFocus(e) {
        const inputGroup = e.target.closest('.input-group');
        inputGroup.style.transform = 'translateY(-2px)';
        inputGroup.style.transition = 'all 0.3s ease';
        
        // Add subtle glow effect
        e.target.style.boxShadow = '0 0 0 3px rgba(0, 122, 255, 0.1)';
    }
    
    handleInputBlur(e) {
        const inputGroup = e.target.closest('.input-group');
        inputGroup.style.transform = '';
        
        if (!e.target.matches(':focus')) {
            e.target.style.boxShadow = '';
        }
    }
    
    handleKeydown(e) {
        // Handle Tab navigation
        if (e.key === 'Tab') {
            if (e.target === this.loginIdInput && !e.shiftKey) {
                e.preventDefault();
                this.loginPasswordInput.focus();
            } else if (e.target === this.loginPasswordInput && e.shiftKey) {
                e.preventDefault();
                this.loginIdInput.focus();
            }
        }
    }
    
    updateLoginButtonState() {
        const isValid = this.isFormValid();
        this.loginButton.disabled = !isValid;
        
        if (isValid) {
            this.loginButton.style.background = '#007AFF';
            this.loginButton.style.color = '#FFFFFF';
            this.loginButton.style.cursor = 'pointer';
        } else {
            this.loginButton.style.background = '#C7C7CC';
            this.loginButton.style.color = '#8E8E93';
            this.loginButton.style.cursor = 'not-allowed';
        }
    }
    
    isFormValid() {
        return this.loginId.trim().length > 0 && this.loginPassword.trim().length > 0;
    }
    
    async handleLogin() {
        if (!this.isFormValid()) return;
        
        // Add loading state
        this.setLoadingState(true);
        
        try {
            // Simulate API call
            await this.simulateLogin();
            
            // Success feedback
            this.showSuccessFeedback();
            
            // Navigate to dashboard (simulate)
            setTimeout(() => {
                console.log('로그인 성공 - 대시보드로 이동');
                // window.location.href = '/dashboard';
            }, 1000);
            
        } catch (error) {
            this.showErrorFeedback(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    async simulateLogin() {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate login validation
        if (this.loginId.includes('test') && this.loginPassword.includes('test')) {
            return { success: true, user: { id: this.loginId } };
        } else {
            throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
        }
    }
    
    setLoadingState(loading) {
        if (loading) {
            this.loginButton.classList.add('loading');
            this.loginButton.disabled = true;
            this.loginButton.textContent = '';
        } else {
            this.loginButton.classList.remove('loading');
            this.loginButton.disabled = !this.isFormValid();
            this.loginButton.textContent = '로그인';
        }
    }
    
    showSuccessFeedback() {
        // Green success state
        this.loginButton.style.background = '#34C759';
        this.loginButton.textContent = '로그인 완료';
        
        // Haptic feedback simulation
        this.simulateHapticFeedback();
        
        // Add success animation
        this.loginButton.style.transform = 'scale(1.05)';
        setTimeout(() => {
            this.loginButton.style.transform = '';
        }, 200);
    }
    
    showErrorFeedback(message) {
        // Show error animation
        this.loginIdInput.classList.add('error');
        this.loginPasswordInput.classList.add('error');
        
        // Remove error class after animation
        setTimeout(() => {
            this.loginIdInput.classList.remove('error');
            this.loginPasswordInput.classList.remove('error');
        }, 500);
        
        // Reset button state
        this.loginButton.style.background = '#FF3B30';
        this.loginButton.textContent = '다시 시도';
        
        // Show error message (could be a toast or alert)
        this.showToast(message, 'error');
        
        setTimeout(() => {
            this.loginButton.style.background = '#007AFF';
            this.loginButton.textContent = '로그인';
        }, 2000);
    }
    
    removeInputError(input) {
        input.classList.remove('error');
    }
    
    handleSignup() {
        // Add tap feedback
        this.signupLink.style.opacity = '0.5';
        setTimeout(() => {
            this.signupLink.style.opacity = '';
            // Navigate to signup page
            window.location.href = 'index.html';
        }, 150);
    }
    
    handleForgotId() {
        this.addLinkFeedback(this.forgotIdLink);
        console.log('아이디 찾기 페이지로 이동');
        // Navigate to forgot ID page
    }
    
    handleForgotPassword() {
        this.addLinkFeedback(this.forgotPasswordLink);
        console.log('비밀번호 찾기 페이지로 이동');
        // Navigate to forgot password page
    }
    
    addLinkFeedback(link) {
        link.style.opacity = '0.5';
        setTimeout(() => {
            link.style.opacity = '';
        }, 150);
    }
    
    simulateHapticFeedback() {
        // Simulate iOS haptic feedback with visual feedback
        document.body.style.transform = 'translateY(-1px)';
        setTimeout(() => {
            document.body.style.transform = '';
        }, 100);
    }
    
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#FF3B30' : '#34C759'};
            color: white;
            padding: 12px 20px;
            border-radius: 20px;
            font-size: 16px;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transition: all 0.3s ease;
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
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Auto-fill detection and animation
    detectAutoFill() {
        // Check for browser auto-fill
        const checkAutoFill = () => {
            if (this.loginIdInput.value && !this.loginId) {
                this.loginId = this.loginIdInput.value;
                this.updateLoginButtonState();
            }
            if (this.loginPasswordInput.value && !this.loginPassword) {
                this.loginPassword = this.loginPasswordInput.value;
                this.updateLoginButtonState();
            }
        };
        
        // Check periodically for auto-fill
        setTimeout(checkAutoFill, 100);
        setTimeout(checkAutoFill, 500);
        setTimeout(checkAutoFill, 1000);
    }
}

// Initialize login form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = new LoginForm();
    
    // Check for auto-fill
    loginForm.detectAutoFill();
    
    // Add iOS-like touch feedback
    document.addEventListener('touchstart', (e) => {
        if (e.target.matches('button') || e.target.matches('.signup-link') || e.target.matches('.forgot-link')) {
            e.target.style.transform = 'scale(0.95)';
        }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (e.target.matches('button') || e.target.matches('.signup-link') || e.target.matches('.forgot-link')) {
            setTimeout(() => {
                e.target.style.transform = '';
            }, 100);
        }
    }, { passive: true });
});

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});

// Prevent zoom on input focus (iOS)
document.addEventListener('touchstart', (e) => {
    if (e.target.matches('input[type="text"], input[type="password"]')) {
        e.target.style.fontSize = '16px'; // Prevent zoom
    }
});

// Handle back button (if in PWA or SPA context)
window.addEventListener('popstate', (e) => {
    console.log('뒤로가기 버튼 감지');
    // Handle navigation
});