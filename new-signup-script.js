class NewSignupFlow {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.isKeyboardVisible = false;
        this.isShiftActive = false;
        this.currentInput = null;
        
        this.formData = {
            id: '',
            password: '',
            confirmPassword: ''
        };
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateProgress();
    }
    
    initializeElements() {
        // Navigation elements
        this.backBtn = document.getElementById('backBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.completeBtn = document.getElementById('completeBtn');
        
        // Progress elements
        this.progressFill = document.getElementById('progressFill');
        this.currentStepIndicator = document.getElementById('currentStep');
        
        // Step elements
        this.step1 = document.getElementById('step1');
        this.step2 = document.getElementById('step2');
        this.step3 = document.getElementById('step3');
        
        // Input elements - 새로운 순서: ID → Password → Confirm Password
        this.idInput = document.getElementById('idInput');
        this.passwordInput = document.getElementById('passwordInput');
        this.confirmPasswordInput = document.getElementById('confirmPasswordInput');
        
        // Validation elements
        this.idIcon = document.getElementById('idIcon');
        this.passwordIcon = document.getElementById('passwordIcon');
        this.confirmPasswordIcon = document.getElementById('confirmPasswordIcon');
        
        // Description elements
        this.idDescription = document.getElementById('idDescription');
        this.passwordDescription = document.getElementById('passwordDescription');
        this.confirmPasswordDescription = document.getElementById('confirmPasswordDescription');
        
        // Input groups
        this.idGroup = document.getElementById('idGroup');
        this.passwordGroup = document.getElementById('passwordGroup');
        this.confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        
        // Keyboard elements
        this.virtualKeyboard = document.getElementById('virtualKeyboard');
        this.keyboardSuggestions = document.getElementById('keyboardSuggestions');
        this.bottomIcons = document.getElementById('bottomIcons');
        this.keys = document.querySelectorAll('.key');
        
        // Main content
        this.mainContent = document.getElementById('mainContent');
        this.iphoneContainer = document.querySelector('.iphone-container');
    }
    
    attachEventListeners() {
        // Navigation events
        this.backBtn.addEventListener('click', () => this.goBack());
        this.nextBtn.addEventListener('click', () => this.goNext());
        this.completeBtn.addEventListener('click', () => this.completeSignup());
        
        // Input events - 새로운 순서
        this.idInput.addEventListener('input', (e) => this.handleIdInput(e));
        this.passwordInput.addEventListener('input', (e) => this.handlePasswordInput(e));
        this.confirmPasswordInput.addEventListener('input', (e) => this.handleConfirmPasswordInput(e));
        
        // Focus events
        [this.idInput, this.passwordInput, this.confirmPasswordInput].forEach(input => {
            input.addEventListener('focus', (e) => this.handleInputFocus(e));
            input.addEventListener('blur', (e) => this.handleInputBlur(e));
        });
        
        // Keyboard events
        this.keys.forEach(key => {
            key.addEventListener('click', (e) => this.handleVirtualKeyPress(e));
            key.addEventListener('touchstart', (e) => this.handleVirtualKeyPress(e), { passive: false });
        });
        
        // Physical keyboard support
        document.addEventListener('keydown', (e) => this.handlePhysicalKey(e));
        
        // Prevent default form submission
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.currentStep < this.totalSteps) {
                    this.goNext();
                } else {
                    this.completeSignup();
                }
            }
        });
    }
    
    updateProgress() {
        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        this.progressFill.style.width = `${progressPercentage}%`;
        this.currentStepIndicator.textContent = this.currentStep;
        
        // Update navigation buttons
        this.backBtn.disabled = this.currentStep === 1;
        this.nextBtn.disabled = !this.isCurrentStepValid();
        
        // Show complete button on last step
        if (this.currentStep === this.totalSteps) {
            this.nextBtn.classList.add('hidden');
            this.completeBtn.classList.remove('hidden');
        } else {
            this.nextBtn.classList.remove('hidden');
            this.completeBtn.classList.add('hidden');
        }
    }
    
    isCurrentStepValid() {
        switch (this.currentStep) {
            case 1: // ID 단계
                return this.validateId(this.formData.id);
            case 2: // Password 단계
                return this.validatePassword(this.formData.password);
            case 3: // Confirm Password 단계
                return this.validateConfirmPassword(this.formData.confirmPassword, this.formData.password);
            default:
                return false;
        }
    }
    
    validateId(id) {
        const lengthValid = id.length >= 4 && id.length <= 20;
        const charactersValid = /^[a-zA-Z0-9]+$/.test(id);
        return lengthValid && charactersValid;
    }
    
    validatePassword(password) {
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
        
        return minLength && hasUpperCase && hasLowerCase && (hasNumbers || hasSpecialChar);
    }
    
    validateConfirmPassword(confirmPassword, originalPassword) {
        return confirmPassword === originalPassword && confirmPassword.length > 0;
    }
    
    updateValidationState(inputGroup, icon, description, isValid, validMessage, invalidMessage) {
        if (isValid) {
            inputGroup.classList.remove('invalid');
            inputGroup.classList.add('valid');
            icon.classList.remove('invalid');
            icon.classList.add('valid');
            description.textContent = validMessage;
            description.style.color = '#34C759';
        } else {
            inputGroup.classList.remove('valid');
            inputGroup.classList.add('invalid');
            icon.classList.remove('valid');
            icon.classList.add('invalid');
            description.textContent = invalidMessage;
            description.style.color = '#FF3B30';
        }
    }
    
    // Step 1: ID 입력 처리
    handleIdInput(e) {
        this.formData.id = e.target.value;
        const isValid = this.validateId(this.formData.id);
        
        if (this.formData.id.length > 0) {
            this.updateValidationState(
                this.idGroup,
                this.idIcon,
                this.idDescription,
                isValid,
                '사용 가능한 아이디입니다',
                '4-20자, 영문/숫자만 사용 가능'
            );
        } else {
            this.resetValidationState(this.idGroup, this.idIcon, this.idDescription, '4-20자, 영문/숫자만 사용 가능');
        }
        
        this.updateProgress();
    }
    
    // Step 2: Password 입력 처리
    handlePasswordInput(e) {
        this.formData.password = e.target.value;
        const isValid = this.validatePassword(this.formData.password);
        
        if (this.formData.password.length > 0) {
            this.updateValidationState(
                this.passwordGroup,
                this.passwordIcon,
                this.passwordDescription,
                isValid,
                '안전한 비밀번호입니다',
                '8자 이상, 영문 대소문자, 숫자/특수문자 포함 필요'
            );
        } else {
            this.resetValidationState(this.passwordGroup, this.passwordIcon, this.passwordDescription, '8자 이상, 영문/숫자/특수문자 포함');
        }
        
        this.updateProgress();
    }
    
    // Step 3: Confirm Password 입력 처리
    handleConfirmPasswordInput(e) {
        this.formData.confirmPassword = e.target.value;
        const isValid = this.validateConfirmPassword(this.formData.confirmPassword, this.formData.password);
        
        if (this.formData.confirmPassword.length > 0) {
            this.updateValidationState(
                this.confirmPasswordGroup,
                this.confirmPasswordIcon,
                this.confirmPasswordDescription,
                isValid,
                '비밀번호가 일치합니다',
                '비밀번호가 일치하지 않습니다'
            );
        } else {
            this.resetValidationState(this.confirmPasswordGroup, this.confirmPasswordIcon, this.confirmPasswordDescription, '동일한 비밀번호를 입력해주세요');
        }
        
        this.updateProgress();
    }
    
    resetValidationState(inputGroup, icon, description, defaultMessage) {
        inputGroup.classList.remove('valid', 'invalid');
        icon.classList.remove('valid', 'invalid');
        description.textContent = defaultMessage;
        description.style.color = '#8E8E93';
    }
    
    handleInputFocus(e) {
        this.currentInput = e.target;
        this.showKeyboard();
        
        // Update active input group
        const inputGroup = e.target.closest('.input-group');
        document.querySelectorAll('.input-group').forEach(group => group.classList.remove('active'));
        inputGroup.classList.add('active');
    }
    
    handleInputBlur(e) {
        // Don't hide keyboard immediately to allow virtual keyboard interaction
        setTimeout(() => {
            if (!document.querySelector('input:focus') && !this.virtualKeyboard.matches(':hover')) {
                this.hideKeyboard();
            }
        }, 150);
    }
    
    showKeyboard() {
        if (!this.isKeyboardVisible) {
            this.isKeyboardVisible = true;
            this.virtualKeyboard.classList.remove('hidden');
            this.keyboardSuggestions.classList.remove('hidden');
            this.virtualKeyboard.classList.add('slide-up');
            this.bottomIcons.classList.add('hidden');
            this.iphoneContainer.classList.add('keyboard-active');
        }
    }
    
    hideKeyboard() {
        if (this.isKeyboardVisible) {
            this.isKeyboardVisible = false;
            this.virtualKeyboard.classList.add('slide-down');
            
            setTimeout(() => {
                this.virtualKeyboard.classList.add('hidden');
                this.keyboardSuggestions.classList.add('hidden');
                this.virtualKeyboard.classList.remove('slide-up', 'slide-down');
                this.bottomIcons.classList.remove('hidden');
                this.iphoneContainer.classList.remove('keyboard-active');
                
                // Remove active state from input groups
                document.querySelectorAll('.input-group').forEach(group => group.classList.remove('active'));
            }, 300);
        }
    }
    
    handleVirtualKeyPress(e) {
        e.preventDefault();
        if (!this.currentInput) return;
        
        const key = e.target;
        const keyValue = key.dataset.key;
        
        // Visual feedback
        key.style.transform = 'scale(0.95)';
        setTimeout(() => {
            key.style.transform = '';
        }, 100);
        
        if (keyValue === 'shift') {
            this.toggleShift();
        } else if (keyValue === 'backspace') {
            this.handleBackspace();
        } else if (keyValue === ' ') {
            this.addCharacter(' ');
        } else if (keyValue === 'return') {
            this.handleReturn();
        } else if (keyValue && keyValue !== 'shift') {
            const char = this.isShiftActive ? keyValue.toUpperCase() : keyValue;
            this.addCharacter(char);
            if (this.isShiftActive) {
                this.toggleShift();
            }
        }
    }
    
    handlePhysicalKey(e) {
        if (!this.currentInput) return;
        
        if (e.key === 'Backspace') {
            e.preventDefault();
            this.handleBackspace();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.handleReturn();
        } else if (e.key === ' ') {
            e.preventDefault();
            this.addCharacter(' ');
        } else if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9!@#$%^&*(),.?\":{}|<>]/)) {
            e.preventDefault();
            this.addCharacter(e.key);
        }
    }
    
    addCharacter(char) {
        if (this.currentInput) {
            const start = this.currentInput.selectionStart;
            const end = this.currentInput.selectionEnd;
            const value = this.currentInput.value;
            
            const newValue = value.substring(0, start) + char + value.substring(end);
            this.currentInput.value = newValue;
            this.currentInput.setSelectionRange(start + 1, start + 1);
            
            // Trigger input event
            this.currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    handleBackspace() {
        if (this.currentInput) {
            const start = this.currentInput.selectionStart;
            const end = this.currentInput.selectionEnd;
            const value = this.currentInput.value;
            
            if (start !== end) {
                // Delete selection
                const newValue = value.substring(0, start) + value.substring(end);
                this.currentInput.value = newValue;
                this.currentInput.setSelectionRange(start, start);
            } else if (start > 0) {
                // Delete single character
                const newValue = value.substring(0, start - 1) + value.substring(start);
                this.currentInput.value = newValue;
                this.currentInput.setSelectionRange(start - 1, start - 1);
            }
            
            // Trigger input event
            this.currentInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    handleReturn() {
        if (this.currentStep < this.totalSteps) {
            this.goNext();
        } else {
            this.completeSignup();
        }
    }
    
    toggleShift() {
        this.isShiftActive = !this.isShiftActive;
        const shiftKey = document.querySelector('.key.shift');
        
        if (this.isShiftActive) {
            shiftKey.style.background = '#007AFF';
            shiftKey.style.color = '#FFFFFF';
            
            // Update letter keys to uppercase
            this.keys.forEach(key => {
                const keyValue = key.dataset.key;
                if (keyValue && keyValue.length === 1 && keyValue.match(/[a-z]/)) {
                    key.textContent = keyValue.toUpperCase();
                }
            });
        } else {
            shiftKey.style.background = '';
            shiftKey.style.color = '';
            
            // Update letter keys to lowercase
            this.keys.forEach(key => {
                const keyValue = key.dataset.key;
                if (keyValue && keyValue.length === 1 && keyValue.match(/[A-Z]/)) {
                    key.textContent = keyValue.toLowerCase();
                }
            });
        }
    }
    
    goBack() {
        if (this.currentStep > 1) {
            this.hideCurrentStep();
            this.currentStep--;
            this.showCurrentStep();
            this.updateProgress();
        } else {
            // Go back to login page
            window.location.href = 'index.html';
        }
    }
    
    goNext() {
        if (this.isCurrentStepValid() && this.currentStep < this.totalSteps) {
            this.hideCurrentStep();
            this.currentStep++;
            this.showCurrentStep();
            this.updateProgress();
            
            // Focus next input
            setTimeout(() => {
                this.getCurrentStepInput().focus();
            }, 300);
        }
    }
    
    hideCurrentStep() {
        const currentStepElement = this.getCurrentStepElement();
        currentStepElement.classList.add('slide-out');
        
        setTimeout(() => {
            currentStepElement.classList.add('hidden');
            currentStepElement.classList.remove('slide-out');
        }, 300);
    }
    
    showCurrentStep() {
        const currentStepElement = this.getCurrentStepElement();
        currentStepElement.classList.remove('hidden');
        currentStepElement.classList.add('slide-in');
        
        setTimeout(() => {
            currentStepElement.classList.remove('slide-in');
        }, 300);
    }
    
    getCurrentStepElement() {
        switch (this.currentStep) {
            case 1: return this.step1; // ID
            case 2: return this.step2; // Password
            case 3: return this.step3; // Confirm Password
            default: return this.step1;
        }
    }
    
    getCurrentStepInput() {
        switch (this.currentStep) {
            case 1: return this.idInput;
            case 2: return this.passwordInput;
            case 3: return this.confirmPasswordInput;
            default: return this.idInput;
        }
    }
    
    async completeSignup() {
        if (!this.isCurrentStepValid()) return;
        
        this.completeBtn.classList.add('loading');
        
        try {
            // Simulate API call
            await this.simulateSignup();
            
            // Show success feedback
            this.showSuccessMessage();
            
            // Navigate to login page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } catch (error) {
            this.showErrorMessage(error.message);
        } finally {
            this.completeBtn.classList.remove('loading');
        }
    }
    
    async simulateSignup() {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate random success/failure
        if (Math.random() > 0.1) { // 90% success rate
            return { success: true, userId: this.formData.id };
        } else {
            throw new Error('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    }
    
    showSuccessMessage() {
        this.completeBtn.textContent = '회원가입 완료!';
        this.completeBtn.style.background = '#34C759';
        
        // Haptic feedback
        this.simulateHapticFeedback();
    }
    
    showErrorMessage(message) {
        this.completeBtn.textContent = '다시 시도';
        this.completeBtn.style.background = '#FF3B30';
        
        setTimeout(() => {
            this.completeBtn.textContent = '회원가입 완료';
            this.completeBtn.style.background = '#007AFF';
        }, 2000);
        
        // Show toast
        this.showToast(message, 'error');
    }
    
    simulateHapticFeedback() {
        document.body.style.transform = 'translateY(-2px)';
        setTimeout(() => {
            document.body.style.transform = '';
        }, 100);
    }
    
    showToast(message, type = 'info') {
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
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
        }, 100);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-10px)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize signup flow when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewSignupFlow();
});

// Handle iOS-like touch interactions
document.addEventListener('touchstart', (e) => {
    if (e.target.matches('button') || e.target.matches('.key')) {
        e.target.style.transform = 'scale(0.95)';
    }
}, { passive: true });

document.addEventListener('touchend', (e) => {
    if (e.target.matches('button') || e.target.matches('.key')) {
        setTimeout(() => {
            e.target.style.transform = '';
        }, 100);
    }
}, { passive: true });

// Prevent zoom on input focus
document.addEventListener('touchstart', (e) => {
    if (e.target.matches('input')) {
        e.target.style.fontSize = '16px';
    }
});

// Handle orientation changes
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});