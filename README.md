# 🍅 Pomodoro Signup & Login System

iOS 스타일의 완벽한 회원가입 및 로그인 시스템입니다. Figma 디자인을 기반으로 MCP를 활용하여 픽셀 퍼펙트하게 구현했습니다.

## ✨ 주요 특징

### 🎨 디자인
- **iOS 네이티브 스타일**: 완벽한 iPhone 디자인 재현
- **Figma 기반**: MCP를 활용한 정확한 디자인 구현
- **반응형 디자인**: 데스크톱과 모바일 모두 지원
- **부드러운 애니메이션**: 60fps 부드러운 전환 효과

### 🔐 로그인 시스템
- **완전한 폼 검증**: 실시간 입력 유효성 검사
- **로딩 상태**: 로그인 진행 상황 시각적 피드백
- **에러 처리**: 사용자 친화적 오류 메시지
- **자동완성 지원**: 브라우저 자동완성 감지

### 📝 회원가입 플로우
- **3단계 진행**: 비밀번호 → 비밀번호 확인 → 아이디
- **프로그레스 바**: 진행 상황 시각적 표시
- **실시간 검증**: 각 단계별 즉시 유효성 확인
- **스마트 네비게이션**: 자동 다음 단계 이동

### ⌨️ 가상 키보드
- **iOS 스타일 키보드**: 완벽한 QWERTY 레이아웃
- **동적 표시/숨김**: 입력시에만 키보드 표시
- **물리 키보드 지원**: 데스크톱 키보드 동시 지원
- **터치 피드백**: 네이티브 앱 수준의 상호작용

## 🚀 데모

### 페이지별 접근
- **로그인 페이지**: [http://localhost:8000/login.html](http://localhost:8000/login.html)
- **회원가입 페이지**: [http://localhost:8000/index.html](http://localhost:8000/index.html)

### 테스트 계정
- **아이디**: test 포함된 아무 문자열 (예: test123)
- **비밀번호**: test 포함된 아무 문자열 (예: test1234)

## 🛠️ 기술 스택

### Frontend
- **Vanilla HTML/CSS/JavaScript**: 프레임워크 없는 순수 웹 기술
- **SF Pro Display**: Apple 시스템 폰트
- **CSS Grid & Flexbox**: 모던 레이아웃
- **CSS Animations**: 부드러운 전환 효과

### 개발 도구
- **MCP (Model Context Protocol)**: Figma 디자인 정확한 구현
- **Figma API**: 실시간 디자인 동기화
- **Git**: 버전 관리

## 📱 화면 구성

### 로그인 페이지
- Stepper 앱 헤더
- "처음 방문하셨나요?" 회원가입 유도
- 아이디/비밀번호 입력 필드
- 아이디 찾기/비밀번호 찾기 링크
- 로그인 버튼

### 회원가입 페이지
- 3단계 프로그레스 표시
- 단계별 입력 폼
- 실시간 유효성 검증
- 가상 키보드 지원

## 🎯 구현 특징

### UX/UI 최적화
```css
/* iOS 스타일 블러 효과 */
.iphone-container {
    backdrop-filter: blur(20px);
    border-radius: 40px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}

/* 부드러운 애니메이션 */
.step-content {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 실시간 검증 시스템
```javascript
validatePassword(password) {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
    
    return minLength && hasUpperCase && hasLowerCase && (hasNumbers || hasSpecialChar);
}
```

### 가상 키보드 인터랙션
```javascript
showKeyboard() {
    this.virtualKeyboard.classList.add('slide-up');
    this.iphoneContainer.classList.add('keyboard-active');
}
```

## 📦 파일 구조

```
pomodoro/
├── 📱 login.html              # 로그인 페이지
├── 🎨 login-style.css         # 로그인 스타일시트
├── ⚡ login-script.js         # 로그인 기능
├── 📝 index.html              # 회원가입 페이지
├── 🎨 signup-style.css        # 회원가입 스타일시트
├── ⚡ signup-script.js        # 회원가입 기능
├── 🗃️ style.css               # 레거시 스타일 (구버전)
├── 🗃️ script.js               # 레거시 스크립트 (구버전)
├── 📚 CLAUDE.md               # 개발 가이드라인
├── 📄 README.md               # 프로젝트 문서
└── 🗂️ Figma-Context-MCP/     # MCP 도구
```

## 🚀 실행 방법

### 1. 로컬 서버 실행
```bash
# Python 사용
python -m http.server 8000

# Node.js 사용
npx serve .

# PHP 사용
php -S localhost:8000
```

### 2. 브라우저 접속
- 로그인: http://localhost:8000/login.html
- 회원가입: http://localhost:8000/index.html

### 3. 테스트 시나리오
1. 로그인 페이지에서 "회원가입 하러가기" 클릭
2. 3단계 회원가입 진행
3. 완료 후 자동 로그인 페이지 이동

## 💡 개발 하이라이트

### MCP를 활용한 Figma 구현
```javascript
// Figma 노드 직접 접근
mcp__figma__view_node({
    file_key: "XcJJgcquIhThEvaNw9QOXC", 
    node_id: "35:701"  // 로그인 페이지
});

mcp__figma__view_node({
    file_key: "XcJJgcquIhThEvaNw9QOXC",
    node_id: "35:1371" // 회원가입 페이지
});
```

### iOS 네이티브 수준 인터랙션
- 터치 피드백 시뮬레이션
- 햅틱 피드백 효과
- 키보드 동적 표시/숨김
- 부드러운 페이지 전환

### 접근성 고려사항
- 키보드 네비게이션 완전 지원
- 스크린 리더 호환성
- 감소된 모션 설정 지원
- 색상 대비 최적화

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary Blue**: #007AFF (iOS 시스템 블루)
- **Success Green**: #34C759 (검증 완료)
- **Error Red**: #FF3B30 (오류 표시)
- **Gray Scale**: #F2F2F7, #8E8E93, #C7C7CC

### 타이포그래피
- **헤드라인**: SF Pro Display 700 (34px)
- **본문**: SF Pro Display 400 (17px)
- **캡션**: SF Pro Display 500 (14px)

### 간격 시스템
- **컴포넌트 간격**: 16px, 20px, 24px
- **내부 패딩**: 12px, 16px, 20px
- **외부 마진**: 20px, 32px, 40px

## 🔧 고급 기능

### 폼 검증 엔진
```javascript
class ValidationEngine {
    static rules = {
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        id: /^[a-zA-Z0-9]{4,20}$/
    };
}
```

### 애니메이션 시스템
```css
@keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
```

### 상태 관리
```javascript
class SignupFlow {
    constructor() {
        this.currentStep = 1;
        this.formData = { password: '', confirmPassword: '', id: '' };
        this.isKeyboardVisible = false;
    }
}
```

## 📈 성능 최적화

- **CSS 최적화**: Critical CSS 인라인화
- **JavaScript**: 이벤트 위임 패턴 활용
- **애니메이션**: GPU 가속 transform 사용
- **이미지**: 최적화된 아이콘 폰트

## 🌟 향후 개발 계획

- [ ] PWA 지원 (Service Worker)
- [ ] 다크 모드 지원
- [ ] 다국어 지원 (i18n)
- [ ] 소셜 로그인 연동
- [ ] 실제 백엔드 API 연동
- [ ] 사용자 세션 관리
- [ ] 비밀번호 찾기 기능
- [ ] 이메일 인증 시스템

---

**개발자**: devswha  
**라이선스**: MIT  
**마지막 업데이트**: 2025-08-13

> 이 프로젝트는 MCP(Model Context Protocol)를 활용하여 Figma 디자인을 완벽하게 구현한 iOS 스타일 웹 애플리케이션입니다. 🚀