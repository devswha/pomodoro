# Netlify 환경변수 설정 가이드

## 🔧 필수 환경변수

Admin 페이지가 작동하려면 Netlify에 다음 환경변수를 설정해야 합니다.

### 1. Netlify 대시보드 접속

https://app.netlify.com/sites/pomodoro-timer-nextjs/settings/env

### 2. 환경변수 추가

다음 변수들을 추가하세요:

#### Supabase 연결 (필수)
```
NEXT_PUBLIC_SUPABASE_URL=https://lasoynzegoiktncjzqad.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhc295bnplZ29pa3RuY2p6cWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzkwMTEsImV4cCI6MjA3Mzc1NTAxMX0.zHQX-LwBBqE3S2xpQW38ZqNbHlqKHnxCKuFX8IEhM2k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhc295bnplZ29pa3RuY2p6cWFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTAxMSwiZXhwIjoyMDczNzU1MDExfQ.YCA9Mm2EKVOQP0XFTjbm89pDQUgMzsmnb2YMp63l6K0
```

#### 애플리케이션 설정 (선택)
```
NEXT_PUBLIC_APP_VERSION=1.0.2
```

### 3. 설정 방법

**옵션 A: 웹 UI 사용**
1. 위 링크로 이동
2. "Add a variable" 클릭
3. Key와 Value 입력
4. "Add variable" 클릭
5. 모든 변수에 대해 반복

**옵션 B: Netlify CLI 사용**
```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://lasoynzegoiktncjzqad.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your_anon_key_here"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_service_role_key_here"
```

### 4. 재배포

환경변수 설정 후 재배포 필요:
```bash
npx netlify deploy --prod
```

또는 Netlify 대시보드에서 "Trigger deploy" 버튼 클릭

### 5. 확인

배포 완료 후 확인:
```bash
# 헬스 체크
curl https://pomodoro-timer-nextjs.netlify.app/api/health

# Admin 대시보드
curl https://pomodoro-timer-nextjs.netlify.app/api/admin/dashboard
```

## 🐛 문제 해결

### "Failed to load dashboard data" 에러
- **원인**: Netlify 환경변수 미설정
- **해결**: 위 환경변수 설정 후 재배포

### 502 Bad Gateway
- **원인**: Supabase 연결 실패
- **해결**: 
  1. 환경변수 확인
  2. Supabase URL과 키 유효성 확인
  3. Netlify Functions 로그 확인

### 환경변수 확인
```bash
# Netlify에 설정된 환경변수 확인
netlify env:list
```

## 📝 로그 확인

```bash
# 실시간 로그
netlify logs -f

# Function 로그
netlify functions:log api
```

## 🔐 보안 주의사항

⚠️ **절대 커밋하지 마세요:**
- `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY`

✅ **안전한 공유 방법:**
- Netlify 대시보드에서만 설정
- 팀원과는 암호화된 채널로 공유
