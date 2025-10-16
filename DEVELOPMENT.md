# 개발 환경 설정 가이드

## 🚀 Netlify Dev 사용

이 프로젝트는 **Netlify Dev**를 사용하여 로컬과 프로덕션 환경을 통일했습니다.

### 왜 Netlify Dev인가?

**문제점:**
- 로컬: Next.js API Routes (`app/api/**`)
- 프로덕션: Netlify Functions (`netlify/functions/**`)
- 결과: 로컬에서 작동해도 배포 시 실패

**해결책:**
- 로컬도 Netlify Functions 사용
- 로컬 = 프로덕션 환경
- 일관성 보장

### 설치

```bash
# Netlify CLI 설치 (전역)
npm install -g netlify-cli

# 프로젝트 의존성 설치
npm install
```

### 개발 서버 실행

```bash
# Netlify Dev로 실행 (권장)
npm run dev

# 포트: http://localhost:8888
# Functions: http://localhost:8888/.netlify/functions/
```

**기존 Next.js Dev 서버 (비권장):**
```bash
npm run dev:next
```

### 환경변수 설정

`.env.local` 파일에 다음 환경변수 필요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_APP_VERSION=1.0.3
```

### API 엔드포인트

모든 API는 Netlify Functions로 처리:

```
로컬:   http://localhost:8888/api/*
배포:   https://your-site.netlify.app/api/*
```

**사용 가능한 엔드포인트:**
- `/api/health` - 헬스 체크
- `/api/auth/login` - 로그인
- `/api/auth/signup` - 회원가입
- `/api/users` - 사용자 관리
- `/api/sessions` - 세션 관리
- `/api/meetings` - 미팅 관리
- `/api/admin/dashboard` - 관리자 대시보드
- `/api/admin/export-users` - 사용자 내보내기

### 빌드 및 배포

```bash
# 로컬 빌드
npm run build

# Netlify 배포
npx netlify deploy --prod
```

### 디버깅

**Netlify Functions 로그 확인:**
```bash
# 실시간 로그
netlify logs -f

# 최근 로그
netlify logs
```

**브라우저에서:**
- F12 → Network 탭
- `/api/` 요청 확인
- Response 확인

### 트러블슈팅

**문제: Netlify Dev가 시작되지 않음**
```bash
# 캐시 삭제
rm -rf .netlify
netlify dev
```

**문제: Functions가 작동하지 않음**
```bash
# 환경변수 확인
netlify env:list

# Functions 재배포
netlify functions:list
```

**문제: CORS 에러**
- `netlify/functions/api.js`의 corsHeaders 확인
- 모든 origin 허용 설정 확인

### 파일 구조

```
pomodoro/
├── app/                    # Next.js 앱 (정적 사이트)
│   ├── (admin)/           # 관리자 페이지
│   ├── (auth)/            # 인증 페이지
│   └── (dashboard)/       # 대시보드
├── netlify/
│   └── functions/
│       └── api.js         # 🔥 모든 API 처리 (중요!)
├── public/                # 정적 파일
├── lib/                   # 유틸리티
└── netlify.toml          # Netlify 설정
```

### 주의사항

⚠️ **app/api/** 디렉토리는 삭제되었습니다!**
- 모든 API는 `netlify/functions/api.js`에서 처리
- Next.js API Routes 사용하지 않음

⚠️ **정적 사이트 export**
- `output: 'export'` 설정
- 서버 사이드 렌더링 불가
- API는 Netlify Functions로만

### 참고 링크

- [Netlify Dev 문서](https://docs.netlify.com/cli/get-started/)
- [Netlify Functions 문서](https://docs.netlify.com/functions/overview/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
