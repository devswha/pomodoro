class SignupKeyboard {
    constructor() {
        this.currentInput = '';
        this.suggestions = ['The', 'the', 'to', 'and', 'of', 'a', 'in', 'is', 'it', 'you'];
        this.isShiftActive = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateSuggestions();
    }
    
    initializeElements() {
        this.keys = document.querySelectorAll('.key');
        this.suggestionItems = document.querySelectorAll('.suggestion-item');
        this.navBack = document.querySelector('.nav-back');
        this.navNext = document.querySelector('.nav-next');
        this.inputGroups = document.querySelectorAll('.input-group');
        this.currentInputGroup = document.querySelector('.input-group:last-child');
    }
    
    attachEventListeners() {
        // Keyboard key events
        this.keys.forEach(key => {
            key.addEventListener('click', (e) => this.handleKeyPress(e));
            key.addEventListener('touchstart', (e) => this.handleKeyPress(e), { passive: false });
        });
        
        // Suggestion events
        this.suggestionItems.forEach(item => {
            item.addEventListener('click', (e) => this.selectSuggestion(e));
        });
        
        // Navigation events
        this.navBack.addEventListener('click', () => this.goBack());
        this.navNext.addEventListener('click', () => this.goNext());
        
        // Physical keyboard support
        document.addEventListener('keydown', (e) => this.handlePhysicalKey(e));
    }
    
    handleKeyPress(e) {
        e.preventDefault();
        const key = e.target;
        const keyText = key.textContent;
        
        // Add visual feedback
        key.style.transform = 'scale(0.95)';
        setTimeout(() => {
            key.style.transform = '';
        }, 100);
        
        if (key.classList.contains('shift')) {
            this.toggleShift();
        } else if (key.classList.contains('backspace')) {
            this.backspace();
        } else if (key.classList.contains('space')) {
            this.addCharacter(' ');
        } else if (keyText === 'return') {
            this.handleReturn();
        } else if (key.classList.contains('function')) {
            // Handle other function keys if needed
            console.log('Function key pressed:', keyText);
        } else {
            this.addCharacter(this.isShiftActive ? keyText.toUpperCase() : keyText);
            if (this.isShiftActive) {
                this.toggleShift(); // Auto-disable shift after character
            }
        }
        
        this.updateSuggestions();
    }
    
    handlePhysicalKey(e) {
        if (e.key === 'Backspace') {
            e.preventDefault();
            this.backspace();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.handleReturn();
        } else if (e.key === ' ') {
            e.preventDefault();
            this.addCharacter(' ');
        } else if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9]/)) {
            e.preventDefault();
            this.addCharacter(e.shiftKey ? e.key.toUpperCase() : e.key.toLowerCase());
        }
        
        this.updateSuggestions();
    }
    
    addCharacter(char) {
        this.currentInput += char;
        this.updateCurrentInputDisplay();
    }
    
    backspace() {
        if (this.currentInput.length > 0) {
            this.currentInput = this.currentInput.slice(0, -1);
            this.updateCurrentInputDisplay();
        }
    }
    
    toggleShift() {
        this.isShiftActive = !this.isShiftActive;
        const shiftKey = document.querySelector('.key.shift');
        
        if (this.isShiftActive) {
            shiftKey.style.background = '#007AFF';
            shiftKey.style.color = '#FFFFFF';
            
            // Update all letter keys to uppercase
            this.keys.forEach(key => {
                if (!key.classList.contains('function') && 
                    !key.classList.contains('shift') && 
                    !key.classList.contains('backspace') && 
                    !key.classList.contains('space') &&
                    key.textContent.length === 1 &&
                    key.textContent.match(/[a-z]/)) {
                    key.textContent = key.textContent.toUpperCase();
                }
            });
        } else {
            shiftKey.style.background = '';
            shiftKey.style.color = '';
            
            // Update all letter keys to lowercase
            this.keys.forEach(key => {
                if (!key.classList.contains('function') && 
                    !key.classList.contains('shift') && 
                    !key.classList.contains('backspace') && 
                    !key.classList.contains('space') &&
                    key.textContent.length === 1 &&
                    key.textContent.match(/[A-Z]/)) {
                    key.textContent = key.textContent.toLowerCase();
                }
            });
        }
    }
    
    updateCurrentInputDisplay() {
        // Update the current input group's description with typed text
        const currentDescription = this.currentInputGroup.querySelector('.input-description');
        if (this.currentInput.trim()) {
            currentDescription.textContent = this.currentInput;
            currentDescription.classList.remove('gray');
        } else {
            currentDescription.textContent = '가입할 아이디를 입력해주세요';
            currentDescription.classList.add('gray');
        }
        
        // Update input group state
        if (this.currentInput.length > 0) {
            this.currentInputGroup.classList.add('active');
        } else {
            this.currentInputGroup.classList.remove('active');
        }
    }
    
    updateSuggestions() {
        const words = this.currentInput.toLowerCase().split(' ');
        const currentWord = words[words.length - 1];
        
        if (currentWord.length > 0) {
            const filteredSuggestions = this.suggestions
                .filter(suggestion => 
                    suggestion.toLowerCase().startsWith(currentWord.toLowerCase())
                )
                .slice(0, 3);
            
            this.suggestionItems.forEach((item, index) => {
                if (filteredSuggestions[index]) {
                    item.textContent = filteredSuggestions[index];
                    item.style.display = 'block';
                    item.classList.toggle('active', index === 0);
                } else {
                    item.style.display = 'none';
                }
            });
        } else {
            // Default suggestions
            const defaultSuggestions = ['"The"', 'the', 'to'];
            this.suggestionItems.forEach((item, index) => {
                item.textContent = defaultSuggestions[index] || '';
                item.style.display = defaultSuggestions[index] ? 'block' : 'none';
                item.classList.toggle('active', index === 0);
            });
        }
    }
    
    selectSuggestion(e) {
        const suggestion = e.target.textContent.replace(/"/g, ''); // Remove quotes
        const words = this.currentInput.split(' ');
        
        if (words.length > 0) {
            words[words.length - 1] = suggestion;
            this.currentInput = words.join(' ');
        } else {
            this.currentInput = suggestion;
        }
        
        this.updateCurrentInputDisplay();
        this.updateSuggestions();
        
        // Visual feedback
        e.target.style.transform = 'scale(0.95)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 100);
    }
    
    handleReturn() {
        if (this.currentInput.trim()) {
            // Complete current input and move to next field or submit
            this.currentInputGroup.classList.add('completed');
            this.currentInputGroup.classList.remove('active');
            
            const checkIcon = this.currentInputGroup.querySelector('.check-icon');
            checkIcon.classList.add('green');
            
            // Move to next step or submit form
            setTimeout(() => {
                this.goNext();
            }, 300);
        }
    }
    
    goBack() {
        // Navigate back animation
        this.navBack.style.opacity = '0.5';
        setTimeout(() => {
            this.navBack.style.opacity = '';
            console.log('Going back to previous screen');
        }, 150);
    }
    
    goNext() {
        if (this.currentInput.trim()) {
            // Navigate to next screen animation
            this.navNext.style.opacity = '0.5';
            setTimeout(() => {
                this.navNext.style.opacity = '';
                console.log('Proceeding to next screen');
            }, 150);
        }
    }
    
    // Haptic feedback simulation (visual feedback for web)
    simulateHapticFeedback() {
        document.body.style.transform = 'translateY(-1px)';
        setTimeout(() => {
            document.body.style.transform = '';
        }, 50);
    }
}

// Initialize the signup keyboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignupKeyboard();
});

// Handle iOS-like interactions
document.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('key')) {
        e.target.style.transform = 'scale(0.95)';
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (e.target.classList.contains('key')) {
        setTimeout(() => {
            e.target.style.transform = '';
        }, 100);
    }
});

// Prevent zoom on double tap for iOS-like experience
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Handle orientation change
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});