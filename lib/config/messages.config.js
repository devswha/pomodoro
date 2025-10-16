/**
 * Messages and Labels Configuration
 * Error messages, UI labels, and text content
 * (Korean language - future: i18n support)
 */

// Authentication Messages
export const AUTH_MESSAGES = {
  // Login
  usernameRequired: '아이디를 입력해주세요.',
  passwordRequired: '비밀번호를 입력해주세요.',
  loginFailed: '아이디 또는 비밀번호가 올바르지 않습니다.',
  loginSuccess: '로그인 성공!',

  // Signup
  signupSuccess: '회원가입이 완료되었습니다.',
  signupFailed: '회원가입에 실패했습니다.',
  usernameExists: '이미 사용 중인 아이디입니다.',

  // Password validation
  passwordMinLength: '비밀번호는 최소 6자 이상이어야 합니다.',
  passwordMismatch: '비밀번호가 일치하지 않습니다.',
  passwordTooShort: '비밀번호는 4자 이상이어야 합니다.',

  // Username validation
  displayNameMin: '사용자명은 최소 2자 이상이어야 합니다.',
  displayNameMax: '사용자명은 최대 30자까지 입력 가능합니다.',
  usernameTooLong: '아이디는 50자를 초과할 수 없습니다.',
};

// UI Labels
export const LABELS = {
  // Branding
  brandTitle: 'STEP',
  brandSubtitle: '집중력 향상을 위한 시간 관리',

  // Forms
  usernameLabel: '로그인 ID',
  passwordLabel: '비밀번호',
  displayNameLabel: '사용자명',
  goalPlaceholder: '목표 입력 (선택사항)',

  // Session
  defaultSessionTitle: 'STEP 세션',

  // Buttons
  loginButton: '로그인',
  signupButton: '회원가입',
  startButton: '시작',
  pauseButton: '일시정지',
  stopButton: '종료',
  resumeButton: '재개',

  // Status
  loading: '로딩 중...',
  saving: '저장 중...',
  deleting: '삭제 중...',
};

// Error Messages
export const ERROR_MESSAGES = {
  // General
  unknownError: '알 수 없는 오류가 발생했습니다.',
  networkError: '네트워크 오류가 발생했습니다.',
  serverError: '서버 오류가 발생했습니다.',

  // Session
  sessionExpired: '세션이 만료되었습니다. 다시 로그인해주세요.',
  sessionInvalid: '유효하지 않은 세션입니다.',

  // Validation
  requiredField: '필수 입력 항목입니다.',
  invalidFormat: '올바른 형식이 아닙니다.',
  invalidEmail: '올바른 이메일 주소를 입력해주세요.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  // Session
  sessionStarted: '세션이 시작되었습니다.',
  sessionPaused: '세션이 일시정지되었습니다.',
  sessionCompleted: '세션이 완료되었습니다!',

  // Data
  dataSaved: '저장되었습니다.',
  dataDeleted: '삭제되었습니다.',
  dataUpdated: '업데이트되었습니다.',
};

// Notification Messages
export const NOTIFICATION_MESSAGES = {
  // Timer warnings
  lowTimeWarning: '5분 남았습니다!',
  criticalTimeWarning: '1분 남았습니다!',
  sessionComplete: '포모도로 세션이 완료되었습니다!',

  // Achievements
  streakAchieved: '연속 달성!',
  goalReached: '목표 달성!',
};

export default {
  AUTH_MESSAGES,
  LABELS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  NOTIFICATION_MESSAGES,
};
