# MCP 서버 설정 가이드

다른 로컬 환경에서 동일한 MCP 서버들을 설정하는 방법입니다.

## 현재 사용중인 MCP 서버들

### 1. Figma MCP
```bash
claude mcp add figma --name figma-mcp
```

### 2. Context7 MCP (문서 검색)
```bash
claude mcp add context7 "npx -y @upstash/context7-mcp --api-key ctx7sk-976001ee-0bf5-49d8-9439-7113b7759bc2"
```

### 3. Supabase MCP (데이터베이스 관리)
```bash
claude mcp add supabase "npx @supabase/mcp-server-supabase --read-only --project-ref=lasoynzegoiktncjzqad"
```

### 4. Sequential Thinking MCP (사고 과정 분석)
```bash
claude mcp add sequential-thinking "npx -y @modelcontextprotocol/server-sequential-thinking"
```

### 5. Netlify MCP (배포 관리)
```bash
claude mcp add netlify "https://netlify-mcp.netlify.app/mcp"
```

## 전체 설정 한번에 실행

```bash
# 모든 MCP 서버 추가
claude mcp add figma --name figma-mcp
claude mcp add context7 "npx -y @upstash/context7-mcp --api-key ctx7sk-976001ee-0bf5-49d8-9439-7113b7759bc2"
claude mcp add supabase "npx @supabase/mcp-server-supabase --read-only --project-ref=lasoynzegoiktncjzqad"
claude mcp add sequential-thinking "npx -y @modelcontextprotocol/server-sequential-thinking"
claude mcp add netlify "https://netlify-mcp.netlify.app/mcp"

# 설정 확인
claude mcp list
```

## 주의사항

1. **Context7 API Key**: 개인 API 키가 포함되어 있으므로 보안에 주의하세요.
2. **Supabase Project**: 특정 프로젝트 ref가 설정되어 있습니다.
3. **Node.js**: npx 명령어들이 포함되어 있으므로 Node.js가 설치되어 있어야 합니다.

## 개별 MCP 서버 기능

- **Figma**: 디자인 파일 접근, 댓글 관리
- **Context7**: 라이브러리 문서 검색 및 코드 예제
- **Supabase**: 데이터베이스 스키마 관리, 쿼리 실행
- **Sequential Thinking**: 복잡한 문제 해결 과정 분석
- **Netlify**: 배포 관리, 사이트 설정

## 검증 방법

```bash
# 모든 MCP 서버 상태 확인
claude mcp list

# 각 서버별 기능 테스트
claude "Test all MCP connections"
```