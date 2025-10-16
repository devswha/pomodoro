# Cursor MCP 설정 완료

Claude에서 사용하는 MCP(Model Context Protocol) 서버들이 Cursor에 성공적으로 추가되었습니다.

## 추가된 MCP 서버들

### 1. Figma MCP
- **기능**: Figma 디자인 파일 접근, 댓글 관리
- **설정**: `@modelcontextprotocol/server-figma`

### 2. Context7 MCP  
- **기능**: 라이브러리 문서 검색 및 코드 예제
- **설정**: `@upstash/context7-mcp`
- **API Key**: ctx7sk-976001ee-0bf5-49d8-9439-7113b7759bc2

### 3. Supabase MCP
- **기능**: 데이터베이스 스키마 관리, 쿼리 실행
- **설정**: `@supabase/mcp-server-supabase`
- **프로젝트**: lasoynzegoiktncjzqad (읽기 전용)

### 4. Sequential Thinking MCP
- **기능**: 복잡한 문제 해결 과정 분석
- **설정**: `@modelcontextprotocol/server-sequential-thinking`

### 5. Filesystem MCP
- **기능**: 파일 시스템 접근 및 관리
- **설정**: `@modelcontextprotocol/server-filesystem`
- **경로**: `/home/devswha/workspace/pomodoro`

### 6. Memory MCP
- **기능**: 지식 그래프 및 메모리 관리
- **설정**: `@modelcontextprotocol/server-memory`

## 설정 파일 위치

MCP 설정은 다음 위치에 저장되었습니다:
```
~/.cursor/mcp.json
```

## 사용 방법

1. **Cursor 재시작**: MCP 설정을 적용하기 위해 Cursor를 재시작하세요.

2. **MCP 기능 사용**: 
   - 채팅에서 MCP 서버의 기능을 직접 요청할 수 있습니다
   - 예: "Figma 파일을 확인해줘", "Supabase 데이터베이스 스키마를 보여줘"

3. **MCP 상태 확인**:
   - Cursor의 설정에서 MCP 서버 상태를 확인할 수 있습니다

## 주의사항

1. **API 키 보안**: Context7 API 키가 설정에 포함되어 있습니다. 보안에 주의하세요.

2. **네트워크 접근**: 일부 MCP 서버는 인터넷 연결이 필요합니다.

3. **권한**: Filesystem MCP는 지정된 디렉토리(`/home/devswha/workspace/pomodoro`)에만 접근할 수 있습니다.

## 문제 해결

MCP 서버가 작동하지 않는 경우:

1. Node.js와 npm이 최신 버전인지 확인
2. Cursor를 재시작
3. MCP 설정 파일의 JSON 형식 확인
4. 네트워크 연결 상태 확인

## 추가 MCP 서버

필요에 따라 다른 MCP 서버를 추가할 수 있습니다:
- GitHub MCP
- Slack MCP  
- Notion MCP
- 기타 커뮤니티 MCP 서버들
