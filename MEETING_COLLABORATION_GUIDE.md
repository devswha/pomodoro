# 모임 협업 기능 가이드

## 🚀 새로운 기능: 모임 초대 시스템

이제 **test** 사용자가 만든 모임에 **test2** 사용자를 초대할 수 있습니다!

## 📋 구현된 기능

### 1. 데이터베이스 스키마
- **`meeting_participants`** 테이블 추가
- **모임 가시성 설정** (private/public/team)
- **참가자 역할** (owner/moderator/participant)
- **초대 상태** (pending/accepted/declined)

### 2. API 엔드포인트
- **`POST /api/meetings/participants`** - 사용자 초대
- **`PUT /api/meetings/participants`** - 초대 수락/거절

### 3. 프론트엔드 기능
- **팀원 초대 버튼** - 각 모임 카드에 추가
- **초대 모달** - 사용자명으로 초대
- **실시간 알림** - 초대 성공/실패 피드백

## 🔧 사용 방법

### 모임 초대하기
1. **test** 계정으로 로그인
2. 모임 생성 후 **"팀원 초대"** 버튼 클릭
3. **test2** 사용자명 입력 후 초대

### 초대 받기
1. **test2** 계정으로 로그인
2. 모임 목록에서 초대받은 모임 확인
3. 모임 참여 또는 거절

## 🛠️ 기술적 구현

### RLS 정책 업데이트
```sql
-- 기존: 자신이 만든 모임만 보기
CREATE POLICY "Users can view own meetings" ON public.meetings
    FOR SELECT USING (auth.uid() = user_id);

-- 새로운: 초대받은 모임도 보기
CREATE POLICY "Users can view accessible meetings" ON public.meetings
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT mp.user_id FROM public.meeting_participants mp
            WHERE mp.meeting_id = meetings.id
        ) OR
        visibility = 'public'
    );
```

### 초대 기능
```javascript
// 사용자 초대
const handleInviteUser = async () => {
  const response = await fetch('/api/meetings/participants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      meeting_id: selectedMeetingId,
      username: inviteUsername
    })
  });
};
```

## 🚧 다음 단계

1. **데이터베이스 마이그레이션 실행**
2. **localStorage → Supabase 전환**
3. **실시간 알림 시스템 구현**
4. **초대 수락/거절 UI 추가**

## 💡 해결된 문제

**문제**: test 사용자가 만든 모임이 test2 사용자에게 보이지 않음
**원인**: RLS 정책이 자신이 만든 모임만 보도록 제한
**해결**: 모임 참가자 시스템 구현으로 협업 가능

이제 팀원들과 함께 뽀모도로 모임을 진행할 수 있습니다! 🎉