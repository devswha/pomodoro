# Vercel 배포 가이드

## 🚀 Vercel로 마이그레이션 완료

Netlify Functions에서 Next.js API Routes로 전환되었습니다.

## 로컬 개발

```bash
npm run dev
```

서버: http://localhost:3000

## Vercel 배포 방법

### 1. Vercel CLI 설치 (선택사항)

```bash
npm i -g vercel
```

### 2. Vercel 프로젝트 생성

1. https://vercel.com 접속
2. GitHub 저장소 연결
3. Import Project 클릭
4. `pomodoro` 저장소 선택

### 3. 환경 변수 설정

Vercel Dashboard → Settings → Environment Variables에서 설정:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lasoynzegoiktncjzqad.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**또는 CLI로 설정:**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### 4. 배포

**자동 배포:**
- `main` 브랜치에 push하면 자동 배포

**수동 배포 (CLI):**
```bash
vercel --prod
```

## API 엔드포인트

배포 후 사용 가능한 엔드포인트:

- `GET /api/health` - 헬스 체크
- `GET /api/admin/dashboard` - Admin 대시보드 (인증 불필요)
- `GET /api/admin/export-users` - 사용자 내보내기
- `POST /api/auth/login` - 로그인
- `POST /api/auth/signup` - 회원가입
- `GET /api/users` - 사용자 목록 (인증 필요)

## 주요 변경사항

### Before (Netlify)
- `output: 'export'` + Netlify Functions
- 개발: `netlify dev` (포트 8888)
- 배포: Netlify

### After (Vercel)
- Next.js API Routes
- 개발: `next dev` (포트 3000)
- 배포: Vercel

## 백업 파일

Netlify 관련 파일들은 백업되었습니다:
- `netlify.toml.backup`
- `netlify.backup/` 디렉토리

## 롤백 방법

Netlify로 돌아가려면:

```bash
# 백업 복원
mv netlify.backup netlify
mv netlify.toml.backup netlify.toml

# next.config.js 수정
# output: 'export' 추가

# package.json 수정
# "dev": "netlify dev" 복원
```

## 문제 해결

### 로컬에서 API 오류
```bash
# .env.local 파일 확인
cat .env.local

# 서버 재시작
pkill -f "next dev"
npm run dev
```

### Vercel 배포 오류
- Environment Variables 확인
- Build Logs 확인
- `vercel logs` 명령어로 로그 확인
