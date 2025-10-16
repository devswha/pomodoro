# Pomodoro Timer - Claude 작업 기록

## 프로젝트 개요

Next.js 기반의 STEP Timer (Pomodoro) 애플리케이션
- **Frontend**: Next.js 14.2.32 (App Router)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Styling**: Styled Components
- **Deployment**: Vercel ✅

---

## 🚀 배포 정보 (Vercel)

### 프로덕션 URL
- **메인**: https://pomodoro-beryl-ten.vercel.app
- **대체**: https://pomodoro-devshwas-projects.vercel.app

### Admin 페이지
- **URL**: https://pomodoro-beryl-ten.vercel.app/admin
- **Password**: `admin123`

### API 엔드포인트
- `GET /api/health` - 헬스 체크
- `GET /api/admin/dashboard` - Admin 대시보드 통계
- `GET /api/admin/export-users` - 사용자 데이터 내보내기
- `POST /api/auth/login` - 로그인
- `POST /api/auth/signup` - 회원가입
- `GET /api/users` - 사용자 목록 (인증 필요)

---

## 💻 로컬 개발

### 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000

### 환경 변수
`.env.local` 파일 필요:
```env
NEXT_PUBLIC_SUPABASE_URL=https://lasoynzegoiktncjzqad.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 주요 스크립트
```bash
npm run dev        # 개발 서버 (포트 3000)
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버
npm run lint       # ESLint 실행
```

### 🧪 테스트 규칙 (Chrome DevTools MCP)

**중요**: 기능 수정이나 업데이트를 할 때는 **반드시 Chrome DevTools MCP**를 사용하여 테스트합니다.

#### 테스트 가능한 경우
- 브라우저 UI 변경 (회원가입, 로그인, 폼 등)
- API 엔드포인트 테스트
- 실시간 기능 검증
- 데이터 흐름 확인

#### 테스트 불가능한 경우 (대안 사용)
- X 서버가 없는 환경 → `curl` 명령어로 API 직접 테스트
- 헤드리스 환경 → Supabase SQL 쿼리로 데이터 확인

#### Chrome MCP 테스트 예시
```bash
# 1. 페이지 열기
mcp__chrome-devtools__new_page { url: "http://localhost:3000/signup" }

# 2. 스냅샷 확인
mcp__chrome-devtools__take_snapshot

# 3. 폼 입력
mcp__chrome-devtools__fill { uid: "...", value: "테스트값" }

# 4. 버튼 클릭
mcp__chrome-devtools__click { uid: "..." }

# 5. 콘솔 로그 확인
mcp__chrome-devtools__list_console_messages
```

#### curl 테스트 예시 (대안)
```bash
# API 직접 테스트
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "displayName": "테스트유저",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

---

## 📁 프로젝트 구조

```
pomodoro/
├── app/
│   ├── api/                           ← Next.js API Routes
│   │   ├── lib/
│   │   │   ├── supabase.js           # Supabase 클라이언트
│   │   │   └── auth.js               # 인증 헬퍼
│   │   ├── health/route.js           # 헬스 체크
│   │   ├── admin/
│   │   │   ├── dashboard/route.js    # Admin 대시보드 API
│   │   │   └── export-users/route.js # 사용자 내보내기 API
│   │   ├── auth/
│   │   │   ├── login/route.js        # 로그인 API
│   │   │   └── signup/route.js       # 회원가입 API
│   │   └── users/route.js            # 사용자 목록 API
│   ├── (auth)/                        ← 인증 페이지
│   │   ├── login/page.js
│   │   └── signup/page.js
│   ├── (dashboard)/                   ← 대시보드 페이지
│   │   ├── main/page.js
│   │   ├── meetings/page.js
│   │   ├── monthly/page.js
│   │   ├── mypage/page.js
│   │   ├── step-start/page.js
│   │   └── step-ranking/page.js
│   ├── (admin)/                       ← Admin 페이지
│   │   └── admin/
│   │       ├── page.js               # Admin 대시보드
│   │       ├── users/page.js         # 사용자 관리
│   │       └── analytics/page.js     # 분석
│   ├── layout.js                      # 루트 레이아웃
│   └── page.js                        # 홈페이지
├── lib/
│   ├── contexts/                      # React Context
│   │   ├── UserContext.js
│   │   └── RealtimeContext.js
│   ├── components/                    # 공통 컴포넌트
│   ├── hooks/                         # Custom Hooks
│   ├── services/                      # 서비스 레이어
│   └── supabase/
│       └── client.js                  # Supabase 클라이언트 (브라우저)
├── database/
│   └── complete-schema.sql           # Supabase 스키마
├── next.config.js                     # Next.js 설정
├── package.json
├── vercel.json                        # Vercel 설정
└── .npmrc                             # NPM 설정
```

---

## 🔧 기술 스택

### Frontend
- **Framework**: Next.js 14.2.32 (App Router)
- **React**: 18.3.1
- **Styling**: Styled Components 5.3.9
- **State Management**: React Context API
- **Charts**: Chart.js + react-chartjs-2

### Backend
- **API**: Next.js API Routes (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom token-based auth with Supabase
- **Realtime**: Supabase Realtime

### Development
- **Package Manager**: npm
- **Node.js**: v22.17.1 (권장)
- **Linting**: ESLint
- **TypeScript**: 5.9.2 (devDependency)

### Deployment
- **Platform**: Vercel ✅
- **CI/CD**: Git push → 자동 배포
- **Environment**: Serverless Functions

---

## 📊 데이터베이스 (Supabase)

### 주요 테이블
- `users` - 사용자 정보
- `auth_sessions` - 인증 세션
- `step_sessions` - 포모도로 세션
- `meetings` - 미팅 정보
- `meeting_participants` - 미팅 참가자

### 연결 정보
- **URL**: https://lasoynzegoiktncjzqad.supabase.co
- **Project ID**: lasoynzegoiktncjzqad

---

## 🔐 인증 시스템

### 인증 방식
- Custom token-based authentication
- Session tokens stored in `auth_sessions` table
- 24시간 만료

### 토큰 사용
- `x-user-token` 헤더 또는 `Authorization: Bearer {token}`
- Admin 엔드포인트는 인증 불필요 (프론트엔드 password 보호)

---

## 🎯 주요 기능

### 1. STEP Timer (Pomodoro)
- 25분 타이머
- 세션 추적 및 통계
- 실시간 동기화 (Supabase Realtime)

### 2. 미팅 협업
- 미팅 생성 및 참가
- 실시간 참가자 상태
- 미팅 히스토리

### 3. 통계 및 랭킹
- 개인 통계
- 월간 통계
- 전체 랭킹

### 4. Admin 대시보드
- 사용자 관리
- 세션 통계
- 실시간 활동 모니터링

---

## 🚀 배포 히스토리

### 2025-10-07: Vercel 마이그레이션
- **이전**: Netlify (Static Export + Functions)
- **이후**: Vercel (Next.js API Routes)
- **변경사항**:
  - `output: 'export'` 제거
  - Netlify Functions → Next.js API Routes 전환
  - 개발 환경 단순화: `netlify dev` → `next dev`
  - 백업: `netlify.backup/`, `netlify.toml.backup`

### 주요 개선사항
1. 개발 환경 단순화
2. API Routes 네이티브 지원
3. 서버 사이드 기능 활성화
4. 자동 배포 (Git push)

---

## 📝 환경 변수 설정

### Vercel 환경 변수
```bash
# Vercel CLI로 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

### 로컬 개발 환경
`.env.local` 파일:
```env
NEXT_PUBLIC_SUPABASE_URL=https://lasoynzegoiktncjzqad.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_APP_VERSION=1.0.2
```

---

## 🔄 Git 워크플로우

### 자동 배포
```bash
git add .
git commit -m "Update feature"
git push origin main
```
→ Vercel에서 자동으로 빌드 & 배포

### 배포 확인
```bash
vercel ls                    # 배포 목록
vercel inspect [URL]         # 배포 상세 정보
vercel logs [URL]            # 로그 확인
```

---

## 🐛 문제 해결

### 로컬 개발 시 API 오류
```bash
# 환경 변수 확인
cat .env.local

# 서버 재시작
pkill -f "next dev"
npm run dev
```

### Vercel 배포 오류
1. Environment Variables 확인
2. Build Logs 확인: https://vercel.com/dashboard
3. 로그 확인: `vercel logs [URL]`

### Supabase 연결 오류
- Supabase 프로젝트 상태 확인
- API Keys 유효성 확인
- 네트워크 연결 확인

---

## 📚 참고 문서

- **배포 가이드**: `VERCEL_DEPLOYMENT.md`
- **개발 가이드**: `DEVELOPMENT.md`
- **Admin 자격 증명**: `ADMIN_CREDENTIALS.md`
- **미팅 협업**: `MEETING_COLLABORATION_GUIDE.md`

---

## 🔗 유용한 링크

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/lasoynzegoiktncjzqad
- **GitHub Repository**: (프로젝트 저장소 URL)
- **Production URL**: https://pomodoro-beryl-ten.vercel.app

---

## ⚡ 빠른 명령어 참조

```bash
# 개발
npm run dev                   # 로컬 서버 시작
npm run build                 # 프로덕션 빌드
npm run start                 # 프로덕션 서버

# Vercel
vercel                        # 배포 (프리뷰)
vercel --prod                 # 프로덕션 배포
vercel ls                     # 배포 목록
vercel env ls                 # 환경 변수 목록

# 테스트
curl http://localhost:3000/api/health                        # 로컬 헬스 체크
curl https://pomodoro-beryl-ten.vercel.app/api/health       # 프로덕션 헬스 체크
```

---

## 📌 중요 정보

### Admin 접속
- URL: https://pomodoro-beryl-ten.vercel.app/admin
- Password: `admin123`

### API 인증
- Header: `x-user-token: {token}`
- Admin 엔드포인트는 인증 불필요

### 포트
- 로컬 개발: 3000
- 프로덕션: Vercel에서 자동 관리

---

---

## 🔍 개발 규칙

### 1. 테스트 우선 (Test-First)
- **모든 기능 수정/업데이트는 테스트 후 진행**
- Chrome DevTools MCP 사용 (가능한 경우)
- curl + Supabase SQL 사용 (대안)

### 2. 로깅 활성화
- 클라이언트: `console.log()` 추가
- 서버: `console.log()` 추가
- 데이터 흐름 추적

### 3. 데이터 검증
- API 요청/응답 확인
- 데이터베이스 저장 확인
- UI 표시 확인

---

**마지막 업데이트**: 2025-10-16
**배포 플랫폼**: Vercel ✅
**버전**: 1.0.2
