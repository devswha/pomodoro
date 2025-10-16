# 🍅 Pomodoro Timer (STEP Timer)

Next.js 기반의 포모도로 타이머 애플리케이션입니다. Supabase를 사용한 실시간 협업 기능과 통계 시스템을 제공합니다.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://pomodoro-beryl-ten.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.32-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)

## 🚀 라이브 데모

- **프로덕션**: https://pomodoro-beryl-ten.vercel.app
- **Admin 대시보드**: https://pomodoro-beryl-ten.vercel.app/admin (Password: `admin123`)

## ✨ 주요 기능

### 🕐 STEP Timer (Pomodoro)
- 25분 포모도로 타이머
- 세션 기록 및 통계
- 실시간 동기화 (Supabase Realtime)
- 자동 완료 및 휴식 알림

### 👥 미팅 협업
- 실시간 미팅 생성 및 참가
- 참가자 상태 동기화
- 미팅 히스토리 관리
- 팀 세션 공유

### 📊 통계 및 랭킹
- 개인 통계 대시보드
- 월간 달성률
- 전체 사용자 랭킹
- 성취도 배지 시스템

### 🔐 인증 시스템
- 간편한 회원가입/로그인
- 세션 기반 인증
- 자동 로그인 유지

### 👨‍💼 Admin 대시보드
- 사용자 관리
- 실시간 활동 모니터링
- 통계 분석
- 데이터 내보내기

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 14.2.32 (App Router)
- **React**: 18.3.1
- **Styling**: Styled Components 5.3.9
- **Charts**: Chart.js + react-chartjs-2
- **State Management**: React Context API

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **Authentication**: Custom token-based auth

### Deployment
- **Platform**: Vercel ✅
- **CI/CD**: Git push → Auto deploy
- **Serverless**: Vercel Functions

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd pomodoro
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=https://lasoynzegoiktncjzqad.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_VERSION=1.0.3
```

### 4. 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000

### 5. 프로덕션 빌드
```bash
npm run build
npm run start
```

## 📁 프로젝트 구조

```
pomodoro/
├── app/
│   ├── api/                    # Next.js API Routes
│   │   ├── lib/               # 공통 라이브러리
│   │   ├── health/            # 헬스 체크
│   │   ├── admin/             # Admin API
│   │   ├── auth/              # 인증 API
│   │   └── users/             # 사용자 API
│   ├── (auth)/                # 인증 페이지
│   ├── (dashboard)/           # 대시보드 페이지
│   └── (admin)/               # Admin 페이지
├── lib/
│   ├── contexts/              # React Contexts
│   ├── components/            # 공통 컴포넌트
│   ├── hooks/                 # Custom Hooks
│   └── services/              # 서비스 레이어
├── database/
│   └── complete-schema.sql   # Supabase 스키마
├── next.config.js            # Next.js 설정
└── vercel.json               # Vercel 설정
```

## 🌐 API 엔드포인트

### Public Endpoints
- `GET /api/health` - 헬스 체크
- `POST /api/auth/login` - 로그인
- `POST /api/auth/signup` - 회원가입

### Authenticated Endpoints
- `GET /api/users` - 사용자 목록 (인증 필요)

### Admin Endpoints (인증 불필요)
- `GET /api/admin/dashboard` - 대시보드 통계
- `GET /api/admin/export-users` - 사용자 데이터 내보내기

## 🔧 개발 스크립트

```bash
npm run dev          # 개발 서버 (포트 3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # ESLint 실행
```

## 🚀 배포

### Vercel 배포 (자동)
```bash
# Git push로 자동 배포
git add .
git commit -m "Update feature"
git push origin main
```

### Vercel CLI 수동 배포
```bash
# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

## 📊 데이터베이스 스키마

### 주요 테이블
- **users**: 사용자 정보
- **auth_sessions**: 인증 세션
- **step_sessions**: 포모도로 세션
- **meetings**: 미팅 정보
- **meeting_participants**: 미팅 참가자

상세 스키마: `database/complete-schema.sql`

## 🔐 인증

### 인증 방식
- Custom token-based authentication
- 24시간 세션 유지
- `x-user-token` 헤더 또는 `Authorization: Bearer {token}`

### Admin 페이지
- Password: `admin123`
- 프론트엔드 레벨 보호 (API는 인증 불필요)

## 🎯 주요 페이지

- `/` - 홈페이지
- `/login` - 로그인
- `/signup` - 회원가입
- `/main` - 메인 대시보드
- `/step-start` - 타이머 시작
- `/step-ranking` - 랭킹
- `/meetings` - 미팅 관리
- `/monthly` - 월간 통계
- `/mypage` - 마이 페이지
- `/admin` - Admin 대시보드

## 💡 특징

### 실시간 동기화
- Supabase Realtime을 활용한 실시간 데이터 동기화
- 다중 사용자 동시 세션 지원
- 실시간 랭킹 업데이트

### 반응형 디자인
- 모바일/태블릿/데스크톱 최적화
- iOS 스타일 UI 컴포넌트
- 부드러운 애니메이션

### 성능 최적화
- Next.js App Router 활용
- Server-side rendering
- Optimistic UI updates
- Image optimization

## 🐛 문제 해결

### 로컬 개발 시 API 오류
```bash
# 환경 변수 확인
cat .env.local

# 서버 재시작
npm run dev
```

### Vercel 배포 실패
1. Environment Variables 확인
2. Build Logs 확인: https://vercel.com/dashboard
3. `vercel logs [URL]`로 로그 확인

## 📚 문서

- [Vercel 배포 가이드](./VERCEL_DEPLOYMENT.md)
- [개발 가이드](./DEVELOPMENT.md)
- [Admin 자격 증명](./ADMIN_CREDENTIALS.md)
- [미팅 협업 가이드](./MEETING_COLLABORATION_GUIDE.md)
- [Claude 작업 기록](./CLAUDE.md)

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License

## 👨‍💻 개발자

**devswha**

## 🔗 링크

- **Production**: https://pomodoro-beryl-ten.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/lasoynzegoiktncjzqad

---

**마지막 업데이트**: 2025-10-07
**버전**: 1.0.3
**배포 플랫폼**: Vercel ✅

> Next.js와 Supabase를 활용한 실시간 협업 포모도로 타이머 애플리케이션 🍅
