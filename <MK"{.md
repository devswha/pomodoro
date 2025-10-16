# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**POMODORO TIMER v4.1.0** - 미니멀한 흑백 디자인의 현대적인 Next.js 기반 뽀모도로 타이머 애플리케이션. Supabase 통합과 관리자 대시보드를 포함한 풀스택 웹 애플리케이션으로 완성되었습니다.

## 라이브 개발 환경

**로컬 개발**: http://localhost:3001 (기본) 또는 http://localhost:3000
- Next.js 개발 서버와 핫 리로딩
- 모바일, 태블릿, 데스크톱 반응형 디자인
- 미니멀한 흑백 UI 디자인
- API Routes 및 서버 사이드 렌더링 지원
- Supabase 실시간 동기화 및 PostgreSQL 데이터베이스

## 개발 환경 설정

현대적인 도구와 핫 리로딩을 사용하는 Next.js 14 애플리케이션입니다.

## Essential Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Start development server (port 3001 default)
npm run dev
npm run dev:3000          # Alternative port 3000

# Production builds
npm run build             # Static export build
npm run build:api         # API-enabled build
npm start                 # Start production server
```

### Environment & Database
```bash
# Validate environment setup
npm run validate:environment

# Test Supabase connection
npm run test:api

# Database operations
npm run setup:database
npm run migrate:data
```

### Deployment & Testing
```bash
# Deploy to production
npm run deploy
npm run mcp:deploy:production

# MCP deployment with monitoring
npm run mcp:test
npm run mcp:deploy:force
npm run mcp:monitor

# Health checks
npm run health:check
```

### Legacy Support (React version in /src)
```bash
npm run legacy:start     # Legacy React dev server
npm run legacy:build     # Legacy React build
```

## 아키텍처 및 현재 구현

### 1. Next.js 14 애플리케이션 구조 (App Router)
```
app/
├── (auth)/             # 인증 라우트 그룹
│   ├── login/          # 로그인 페이지
│   │   └── page.js
│   └── signup/         # 회원가입 페이지
│       └── page.js
├── (admin)/            # 관리자 전용 라우트 그룹
│   └── admin/          # 관리자 대시보드
│       └── page.js
├── (dashboard)/        # 대시보드 라우트 그룹
│   ├── layout.js       # 대시보드 공통 레이아웃
│   ├── admin/          # 관리자 페이지 (사용자용 접근)
│   │   └── page.js
│   ├── main/           # 메인 대시보드
│   │   └── page.js
│   ├── meetings/       # 미팅 스케줄링
│   │   └── page.js
│   ├── mypage/         # 사용자 프로필 및 통계
│   │   └── page.js
│   ├── pomodoro-ranking/ # 랭킹 페이지
│   │   └── page.js
│   ├── pomodoro-start/ # 뽀모도로 시작
│   │   └── page.js
│   └── monthly/        # 월별 캘린더
│       └── page.js
├── api/                # Next.js API Routes
│   ├── auth/           # 인증 API
│   ├── sessions/       # 세션 관리 API
│   ├── meetings/       # 미팅 API
│   └── users/          # 사용자 관리 API
├── clear-data/         # 데이터 초기화 페이지
│   └── page.js
├── layout.js           # 루트 레이아웃
├── page.js             # 홈 페이지
└── globals.css         # 글로벌 스타일

lib/
├── components/         # 재사용 가능한 UI 컴포넌트
├── contexts/           # React Context
│   └── UserContext.js  # 사용자 상태 관리
├── services/           # 비즈니스 로직
│   └── UserManager.js  # 데이터 관리
├── supabase/           # Supabase 설정
└── utils/              # 유틸리티 함수
```

### 2. 데이터 관리 시스템 (Supabase PostgreSQL)

**중요: Supabase 클라우드 데이터베이스**
이 애플리케이션은 **Supabase PostgreSQL 데이터베이스**를 사용하여 일관성 있는 사용자 데이터 관리를 제공합니다. localStorage는 Supabase 연결 실패 시에만 fallback으로 사용됩니다.

#### 핵심 데이터베이스 테이블:
```sql
-- 1. 사용자 테이블 (인증 및 프로필)
public.users {
  id: UUID (Primary Key)
  username: VARCHAR(50) UNIQUE
  display_name: VARCHAR(100)
  email: VARCHAR(255) UNIQUE
  password_hash: TEXT
  created_at: TIMESTAMPTZ
  last_login: TIMESTAMPTZ
}

-- 2. 사용자 설정 테이블
public.user_preferences {
  id: UUID (Primary Key)
  user_id: UUID (Foreign Key)
  default_pomodoro_length: INTEGER (25분)
  break_length: INTEGER (5분)
  weekly_goal: INTEGER (140분)
  theme: VARCHAR(20)
  sound_enabled: BOOLEAN
}

-- 3. 사용자 통계 테이블
public.user_stats {
  id: UUID (Primary Key)
  user_id: UUID (Foreign Key)
  total_sessions: INTEGER
  completed_sessions: INTEGER
  total_minutes: INTEGER
  streak_days: INTEGER
  completion_rate: DECIMAL(5,2)
  monthly_stats: JSONB
  daily_stats: JSONB
}

-- 4. 뽀모도로 세션 테이블
public.pomodoro_sessions {
  id: UUID (Primary Key)
  user_id: UUID (Foreign Key)
  title: VARCHAR(255)
  duration: INTEGER
  start_time: TIMESTAMPTZ
  end_time: TIMESTAMPTZ
  status: VARCHAR(20) -- 'active', 'completed', 'stopped'
  is_active: BOOLEAN
}

-- 5. 미팅 테이블
public.meetings {
  id: UUID (Primary Key)
  user_id: UUID (Foreign Key)
  title: VARCHAR(255)
  meeting_date: DATE
  meeting_time: TIME
  duration: INTEGER
  status: VARCHAR(20)
}

-- 6. 인증 세션 테이블
public.auth_sessions {
  id: UUID (Primary Key)
  user_id: UUID (Foreign Key)
  session_token: VARCHAR(128)
  expires_at: TIMESTAMPTZ
  is_active: BOOLEAN
}
```

#### 데이터 보안 및 격리:
- **Row Level Security (RLS)**: 각 사용자는 자신의 데이터만 접근 가능
- **실시간 동기화**: Supabase Realtime을 통한 실시간 데이터 업데이트
- **자동 백업**: Supabase 클라우드 자동 백업 및 복구
- **API 보안**: JWT 토큰 기반 인증 및 권한 관리
- **Fallback 지원**: Supabase 연결 실패 시 localStorage 자동 전환

### 3. 핵심 파일 구조

#### Next.js 페이지 및 컴포넌트
- **`app/layout.js`** - 루트 레이아웃 및 메타데이터
- **`app/(auth)/login/page.js`** - 흑백 디자인의 미니멀한 로그인
- **`app/(auth)/signup/page.js`** - 단일 단계 회원가입 (아이디, 비밀번호, 확인)
- **`app/(dashboard)/main/page.js`** - 통계와 활성 타이머가 있는 대시보드
- **`app/(dashboard)/meetings/page.js`** - 미팅 스케줄링 시스템
- **`lib/contexts/UserContext.js`** - 사용자 상태 관리를 위한 React Context
- **`lib/services/UserManager.js`** - 핵심 데이터 관리 클래스

#### API Routes
- **`app/api/auth/`** - 인증 관련 API (로그인, 회원가입, 로그아웃)
- **`app/api/sessions/`** - 뽀모도로 세션 관리 API
- **`app/api/meetings/`** - 미팅 스케줄링 API
- **`app/api/users/`** - 사용자 프로필 및 통계 API

#### 데이터베이스 및 백엔드
- **`lib/supabase/client.js`** - Supabase 클라이언트 설정 및 인증
- **`database/schema.sql`** - PostgreSQL 데이터베이스 스키마
- **`database/rls-policies.sql`** - Row Level Security 정책
- **`lib/services/SupabaseUserManager.js`** - Supabase 기반 사용자 관리

#### 스타일링
- **`app/globals.css`** - 미니멀한 흑백 테마
- **Styled Components** - CSS-in-JS를 사용한 컴포넌트 레벨 스타일링

## 구현된 주요 기능

### 🔐 인증 시스템 (Supabase Auth)
- **단일 단계 회원가입**: 한 페이지에서 아이디, 비밀번호, 비밀번호 확인
- **JWT 토큰 인증**: Supabase Auth를 통한 안전한 세션 관리
- **실시간 검증**: 시각적 피드백과 함께 라이브 폼 검증
- **자동 세션 관리**: 토큰 자동 갱신 및 만료 처리
- **간단한 로그인**: 미니멀한 로그인 폼
- **자동 네비게이션**: 인증에서 대시보드까지 원활한 흐름
- **관리자 권한 시스템**: 특별 관리자 계정으로 전체 사용자 관리
- **보안 강화**: bcrypt 해싱, JWT 검증, CORS 설정

### 🎨 미니멀 디자인
- **흑백 테마**: 완전한 흑백 색상 팔레트
- **직사각형 디자인**: 둥근 모서리 없는 깔끔한 기하학적 형태
- **타이포그래피**: 대문자 라벨, 넓은 글자 간격
- **포커스 상태**: 포커스 시 검은 테두리, 호버 시 투명도 변화

### 📊 뽀모도로 기능 (실시간 동기화)
- **타이머 관리**: 뽀모도로 세션 시작, 일시정지, 중지
- **실시간 동기화**: Supabase Realtime을 통한 멀티 디바이스 동기화
- **통계 추적**: 실시간 통계 및 완료율 자동 계산
- **세션 기록**: PostgreSQL 기반 영구 세션 히스토리
- **클라우드 백업**: 자동 클라우드 백업 및 복구
- **사용자 격리**: RLS 정책을 통한 완전한 데이터 격리

### 📱 반응형 디자인
- **모바일 우선**: 터치 최적화 인터페이스
- **데스크톱 확장**: "창 안의 창" 효과 없이 큰 화면에 적응
- **깔끔한 레이아웃**: 방해 요소 없이 콘텐츠에 집중

### 👨‍💼 관리자 기능
- **사용자 관리**: 전체 사용자 목록 조회 및 검색
- **상세 정보 모달**: 사용자별 통계, 세션, 미팅 정보 확인
- **실시간 모니터링**: 활성 사용자 및 세션 실시간 추적
- **통계 대시보드**: 전체 플랫폼 사용 통계 및 분석
- **데이터 내보내기**: CSV/JSON 형식으로 데이터 추출

## 개발 가이드라인

### Next.js 14 & 모던 JavaScript
1. **App Router 사용**: Next.js 14의 최신 App Router 패턴
2. **Server Components**: 서버 사이드 렌더링 및 정적 생성
3. **API Routes**: 내장 API 엔드포인트 시스템
4. **React Hooks 사용**: useState, useEffect가 있는 함수형 컴포넌트
5. **상태를 위한 Context**: React Context API를 통한 글로벌 상태
6. **Styled Components**: 컴포넌트 스타일링을 위한 CSS-in-JS
7. **ES6+ 기능**: 모던 JavaScript 문법 및 패턴

### 데이터 관리 규칙
1. **Supabase 클라이언트 사용**: `lib/supabase/client.js`의 인증된 클라이언트 사용
2. **RLS 정책 준수**: Row Level Security 정책에 따른 데이터 접근
3. **API Routes 활용**: Next.js API Routes를 통한 서버 사이드 데이터 처리
4. **실시간 동기화**: Supabase Realtime을 통한 데이터 실시간 업데이트
5. **에러 처리**: 네트워크 오류 시 localStorage fallback 자동 전환
6. **데이터 마이그레이션**: localStorage → Supabase 마이그레이션 지원

### 코드 표준
- **TypeScript 준비**: TypeScript 마이그레이션이 쉬운 코드 구조
- **컴포넌트 클래스**: 정리된 서비스 클래스 (UserManager)
- **에러 처리**: 적절한 try/catch 및 에러 상태
- **성능**: 적절한 React 패턴으로 최적화된 리렌더링

### 테스트 접근법
- **사용자 플로우 테스트**: 회원가입 → 로그인 → 타이머 전체 플로우
- **데이터베이스 연결 테스트**: Supabase 연결 상태 및 API 응답 확인
- **실시간 동기화 테스트**: 멀티 디바이스 간 데이터 동기화 검증
- **RLS 정책 테스트**: 사용자 권한 및 데이터 격리 확인
- **Fallback 시나리오**: 오프라인 시 localStorage fallback 동작 테스트
- **반응형 테스트**: 모바일, 태블릿, 데스크톱 테스트
- **API 보안 테스트**: JWT 토큰 검증 및 권한 확인
- **관리자 권한 테스트**: 관리자 전용 기능 접근 제어 확인
- **MCP 통합 테스트**: 실시간 업데이트 및 동기화 검증

## 디자인 시스템

### 색상 팔레트
```css
/* 흑백 테마 */
--primary: #000000     /* 검정 - 주요 액션, 텍스트 */
--secondary: #6c757d   /* 회색 - 보조 텍스트 */
--background: #ffffff  /* 흰색 - 메인 배경 */
--surface: #f8f9fa     /* 연한 회색 - 카드 배경 */
--border: #e9ecef      /* 연한 회색 - 테두리 */
--error: #dc3545       /* 빨강 - 에러 상태 */
```

### 타이포그래피 스케일
```css
/* 헤더 */
h1: 2.5rem (모바일) → 3.5rem (데스크톱)
h2: 2rem → 2.25rem  
h3: 1.5rem → 1.75rem

/* 본문 */
body: 1rem → 1.125rem
small: 0.875rem
```

### 컴포넌트 패턴
- **버튼**: 검은 배경, 흰 텍스트, border-radius 없음
- **입력**: 2px 테두리, border-radius 없음, 포커스 시 검은 테두리
- **카드**: 흰 배경, 미묘한 회색 테두리
- **레이아웃**: 여유로운 패딩, 깔끔한 간격

## 성공 지표

Next.js v4.0.0 구현으로 달성한 것:
- ✅ **완전한 Next.js 14 마이그레이션** vanilla HTML/CSS/JS에서
- ✅ **App Router 아키텍처** (최신 Next.js 패턴)
- ✅ **API Routes 시스템** (풀스택 애플리케이션)
- ✅ **미팅 스케줄링 기능** (실시간 협업)
- ✅ **미니멀한 흑백 디자인**
- ✅ **단일 단계 회원가입 플로우** (간소화된 UX)
- ✅ **반응형 웹 디자인** (모바일에서 데스크톱까지)
- ✅ **사용자 데이터 보존** (기존 모든 사용자 데이터 유지)
- ✅ **모던 개발 스택** (Next.js 14 + React 18 + ES6 + CSS-in-JS)
- ✅ **Supabase 통합 완료** (PostgreSQL 데이터베이스 + 실시간 동기화)
- ✅ **관리자 페이지 구현** (사용자 관리, 통계 모니터링)
- ✅ **인증 시스템 강화** (Supabase Auth 기반 JWT 토큰)

## 버전 히스토리

- **v4.1.0** (현재): 관리자 대시보드 및 Supabase 완전 통합
- **v4.0.0**: Next.js 14 기반 미니멀한 흑백 디자인 + 미팅 스케줄링
- **v3.x** (레거시): iOS 스타일 디자인의 Vanilla HTML/CSS/JS (/legacy로 이동)

## 중요 사항

⚠️ **중요한 데이터베이스 경고**: Supabase PostgreSQL 데이터베이스가 기본 데이터 저장소입니다. 데이터베이스 스키마 변경 시 마이그레이션 스크립트를 작성하고 RLS 정책을 업데이트하세요. localStorage는 오프라인 fallback 전용입니다.

🎨 **디자인 철학**: 이 버전은 미니멀리즘을 추구합니다 - 검정, 흰색, 회색만 사용. 에러를 위한 빨강을 제외하고는 색상 없음. 깔끔하고 기하학적이며 방해 요소 없는 디자인.

🚀 **성능**: Next.js 14 앱은 서버 사이드 렌더링, 정적 생성, API Routes를 활용한 풀스택 아키텍처로 프로덕션 준비 코드 구조를 유지하면서 핫 리로딩으로 개발 속도를 최적화했습니다.

👨‍💼 **관리자 계정**: 특별 관리자 계정(username: 'admin')은 모든 사용자 데이터에 접근 가능합니다. 일반 사용자는 자신의 데이터에만 접근 가능하며, RLS 정책이 이를 보장합니다.

## Critical Architecture Patterns

### Hybrid Deployment Strategy
This application supports two deployment modes via `BUILD_TYPE` environment variable:
- **Static Export** (`BUILD_TYPE=static`): Pure static site generation, excludes API routes
- **Full-Stack** (default): Includes API routes as Netlify Functions

### Database Layer Architecture
- **Primary**: Supabase PostgreSQL with RLS (Row Level Security)
- **Fallback**: localStorage when Supabase unavailable
- **Migration Path**: Automatic localStorage → Supabase data migration
- **Connection Management**: Smart fallback with connection testing (`lib/supabase/client.js`)

### Authentication Flow
1. **JWT-based**: Supabase Auth with automatic token refresh
2. **Session Management**: Persistent sessions across browser restarts
3. **API Protection**: All API routes validate JWT tokens
4. **Fallback Auth**: localStorage-based auth when offline

### Real-time Features
- **Live Sessions**: Multi-device pomodoro session synchronization
- **Meeting Updates**: Real-time meeting status changes
- **Statistics**: Live statistics updates across devices
- **Presence**: User presence tracking in meetings

### Environment Configuration Requirements
Create `.env.local` with:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### Legacy Code Coexistence
- **Active**: `/app` directory (Next.js 14 App Router)
- **Legacy**: `/src` directory (React SPA, preserved for reference)
- **Build Exclusion**: Webpack configured to exclude `/src` from Next.js builds

## MCP Agents and Tools Integration

This project extensively uses MCP (Model Context Protocol) with specialized agents for different aspects of development and operations.

### Active MCP Agents

#### 1. Figma MCP Agent (`mcp__figma__*`)
**Role**: Design-to-code integration and visual design sync
**Capabilities**:
- **View Figma Nodes**: `mcp__figma__view_node(file_key, node_id)` - Direct access to design components
- **Read Comments**: `mcp__figma__read_comments(file_key)` - Design feedback integration
- **Post Comments**: `mcp__figma__post_comment(file_key, message, x, y)` - Development feedback to designers
- **Reply to Comments**: `mcp__figma__reply_to_comment(file_key, comment_id, message)` - Design collaboration

**Usage Examples**:
```javascript
// Access login page design
mcp__figma__view_node({
  file_key: "XcJJgcquIhThEvaNw9QOXC", 
  node_id: "35:701"
});

// Get all design feedback
const comments = await mcp__figma__read_comments({
  file_key: "XcJJgcquIhThEvaNw9QOXC"
});
```

#### 2. Supabase MCP Manager (`SupabaseMCPManager`)
**Role**: Advanced database management with real-time monitoring
**Location**: `lib/mcp/SupabaseMCPManager.js`
**Capabilities**:
- **Schema Deployment**: Automated database schema deployment with validation
- **Real-time Subscriptions**: Multi-table real-time synchronization setup
- **Health Monitoring**: Continuous database health and performance tracking
- **Backup Management**: Automated backup creation and restoration
- **Production Optimization**: Performance tuning and scaling preparation

**Key Methods**:
```javascript
const mcpManager = new SupabaseMCPManager();

// Initialize with full monitoring
await mcpManager.initialize();

// Deploy schema with force option
await mcpManager.deploySchema({ force: true });

// Set up real-time for all tables
await mcpManager.initializeRealtimeSubscriptions();

// Monitor health continuously
await mcpManager.performHealthCheck();

// Create production backup
await mcpManager.createBackup({ includeData: true });
```

#### 3. MCP Realtime Context (`MCPRealtimeProvider`)
**Role**: Client-side real-time data synchronization and presence
**Location**: `lib/contexts/MCPRealtimeContext.js`
**Capabilities**:
- **Multi-Device Sync**: Real-time data synchronization across devices
- **Presence Tracking**: User presence and activity monitoring
- **Connection Management**: Automatic reconnection and health monitoring
- **Event Broadcasting**: Custom real-time event handling
- **Update Queuing**: Efficient batch processing of real-time updates

**Usage in Components**:
```javascript
import { useMCPRealtime } from '../lib/contexts/MCPRealtimeContext';

function PomodoroTimer() {
  const { 
    connectionStatus, 
    trackPresence, 
    subscribeToUserData,
    getRealtimeData 
  } = useMCPRealtime();

  // Track user presence
  useEffect(() => {
    trackPresence(userId, { 
      activity: 'pomodoro_timer',
      status: 'active' 
    });
  }, [userId]);

  // Subscribe to real-time session updates
  useEffect(() => {
    return subscribeToUserData(userId, (type, data) => {
      if (type === 'sessions') {
        updateLocalSessionData(data);
      }
    });
  }, [userId]);
}
```

### MCP Deployment Scripts

#### 1. Deploy with MCP (`scripts/deploy-with-mcp.js`)
**Role**: Automated deployment orchestration with monitoring
**Commands**:
```bash
npm run mcp:deploy              # Standard deployment
npm run mcp:deploy:force        # Force deployment (override existing)
npm run mcp:deploy:production   # Production deployment with optimizations
npm run mcp:monitor             # Continuous monitoring mode
```

**Features**:
- **Step-by-step Deployment**: Automated schema, real-time, and health setup
- **Backup Creation**: Automatic backup before deployment
- **Production Optimization**: Performance tuning for production environments
- **Monitoring Mode**: Continuous health monitoring and alerting

#### 2. MCP Testing (`scripts/test-mcp-deployment.js`)
**Role**: Comprehensive deployment testing and validation
**Command**: `npm run mcp:test`
**Features**:
- **Connection Testing**: Validate Supabase connections
- **Schema Validation**: Verify table creation and constraints
- **Real-time Testing**: Test real-time subscription functionality
- **Performance Testing**: Basic performance and latency checks

### MCP Best Practices

#### Environment Setup
```bash
# Required environment variables for MCP
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
MCP_MONITORING_ENABLED=true
```

#### Real-time Development Workflow
1. **Design Phase**: Use Figma MCP agent to access designs and post development questions
2. **Development Phase**: Use MCP Realtime Context for live data during development
3. **Testing Phase**: Use MCP deployment scripts for automated testing
4. **Deployment Phase**: Use MCP deployment orchestrator for production deployment
5. **Monitoring Phase**: Use MCP health monitoring for ongoing operations

#### Performance Optimization
- **Query Caching**: MCP manager includes intelligent query caching
- **Connection Pooling**: Automatic connection optimization
- **Real-time Throttling**: Efficient real-time update batching
- **Health Monitoring**: Proactive performance issue detection

### Advanced MCP Features

#### Custom Event Handling
The MCP system emits custom events for application-specific handling:
```javascript
// Listen for pomodoro completion events
window.addEventListener('pomodoroCompleted', (event) => {
  const { session } = event.detail;
  triggerCelebrationAnimation(session);
});

// Listen for real-time updates
window.addEventListener('mcpRealtimeUpdate', (event) => {
  const { table, event: updateType, payload } = event.detail;
  handleCustomUpdate(table, updateType, payload);
});
```

#### Monitoring and Alerting
```javascript
// Set up custom monitoring
const healthInterval = setInterval(async () => {
  const health = await mcpManager.performHealthCheck();
  if (health.connectionStatus !== 'healthy') {
    sendAlert('Database health degraded', health);
  }
}, 300000); // Check every 5 minutes
```