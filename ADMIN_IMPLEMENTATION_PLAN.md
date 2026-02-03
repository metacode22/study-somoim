# 관리자 백오피스 구현 계획

## 1. 조사 결과 요약

### 1.1 프론트엔드 기술 스택

- **프레임워크**: Next.js 16.1.0 (App Router)
- **언어**: TypeScript
- **React 버전**: 19.2.3
- **UI 프레임워크**: @teamsparta/stack-* 컴포넌트 라이브러리
- **상태 관리**: @tanstack/react-query (서버 상태)
- **HTTP 클라이언트**: axios
- **라우팅**: App Router (`app/` 디렉토리 구조)

### 1.2 인증/인가 방식

- **인증 라이브러리**: NextAuth v5 (beta.30)
- **인증 방식**: Google OAuth (세션 기반)
- **세션 저장소**: NextAuth 기본 세션 (쿠키 기반)
- **도메인 제한**: `teamsparta.co` 이메일만 허용
- **인증 체크**: `middleware.ts`에서 전역 인증 미들웨어 처리
- **사용자 정보 위치**:
  - 세션: `session.user` (name, email, id)
  - 클라이언트: `useSession()` 훅으로 접근
  - 서버: `auth()` 함수로 접근

**현재 세션 구조:**
```typescript
session.user = {
  name: string;
  email: string;
  id: string; // token.sub (Google ID)
}
```

### 1.3 API 구조

**Base URL**: `http://localhost:3000/study-somoim` (프록시: `/api/backend` → `localhost:3003`)

**인증 헤더**: 
- 백엔드 API는 `x-user-id` 헤더로 사용자 인증 (MongoDB ObjectId)
- 현재 프론트엔드에서는 헤더를 설정하지 않음

**주요 엔드포인트**:
- `/chapters` - 챕터 관리
- `/chapters/:chapterId/applications` - 개설 신청 (관리자용 조회 가능)
- `/chapters/:chapterId/groups` - 그룹 조회
- `/chapters/:chapterId/registrations` - 등록 완료 그룹 (관리자용)
- `/chapters/:chapterId/applications/:applicationId/review` - 심사 처리 (관리자용)

**관리자 전용 API**:
- `GET /chapters/:chapterId/applications` - 신청 목록 조회
- `GET /chapters/:chapterId/registrations` - 등록 완료 목록
- `PATCH /chapters/:chapterId/applications/:applicationId/review` - 심사 처리

### 1.4 Role 개념

**현재 상태**:
- ❌ **User 모델에 admin role 없음**
- ✅ `MemberRole`은 존재 (leader, sub_leader, regular, observer) - Membership 엔티티용
- ❌ 프론트엔드/백엔드에서 관리자 권한 체크 로직 없음

**필요한 작업**:
- User 모델에 `role: 'admin' | 'user'` 필드 추가
- NextAuth 세션에 role 정보 포함
- 관리자 권한 체크 미들웨어/유틸 함수 추가

---

## 2. 변경 지점 목록

### 2.1 백엔드 (추정 - API 문서 기반)

```
backend/
├── src/
│   ├── users/
│   │   ├── user.schema.ts          # role 필드 추가
│   │   └── user.service.ts         # role 조회 로직
│   ├── auth/
│   │   └── guards/
│   │       └── admin.guard.ts      # 관리자 권한 가드 (신규)
│   └── chapters/
│       └── applications/
│           └── applications.controller.ts  # 관리자 권한 데코레이터 추가
```

### 2.2 프론트엔드

```
app/
├── admin/
│   ├── page.tsx                    # ✅ 이미 생성됨 (권한 체크 필요)
│   ├── applications/
│   │   └── page.tsx                # 신청 목록 페이지 (신규)
│   ├── registrations/
│   │   └── page.tsx                 # 등록 완료 목록 페이지 (신규)
│   └── layout.tsx                   # 관리자 레이아웃 (권한 체크) (신규)
├── lib/
│   ├── api.ts                       # ✅ 관리자 API 함수 추가됨 (x-user-id 헤더 추가 필요)
│   ├── queries.ts                  # ✅ 관리자 쿼리 추가됨
│   └── auth.ts                      # 관리자 권한 체크 유틸 (신규)
├── components/
│   └── GNB.tsx                      # ✅ 관리자 링크 추가됨 (권한별 표시 필요)
├── middleware.ts                    # 관리자 페이지 접근 제어 추가
└── auth.ts                          # 세션에 role 추가

types/
└── next-auth.d.ts                   # NextAuth 타입 확장 (신규)
```

---

## 3. 필요한 새 모델/필드/마이그레이션

### 3.1 User 모델 확장

**백엔드 스키마 (추정)**:
```typescript
// user.schema.ts
{
  // ... 기존 필드
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: true
  }
}
```

**마이그레이션 스크립트 (백엔드)**:
```typescript
// migrations/add-user-role.ts
// 1. 모든 기존 사용자에 role: 'user' 기본값 설정
// 2. 특정 이메일/사용자에 role: 'admin' 설정 (초기 관리자 지정)
```

### 3.2 NextAuth 타입 확장

**프론트엔드 타입 정의**:
```typescript
// types/next-auth.d.ts
declare module "next-auth" {
  interface User {
    role?: 'admin' | 'user';
  }
  
  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      role?: 'admin' | 'user';
    };
  }
}
```

### 3.3 API 클라이언트 확장

**인증 헤더 추가**:
```typescript
// app/lib/api.ts
// 세션에서 user.id를 가져와 x-user-id 헤더에 추가
// 또는 Next.js API Route를 통해 프록시하여 헤더 주입
```

---

## 4. 구현 계획 (3~5개 PR)

### PR 1: 사용자 Role 시스템 구축
**목표**: User 모델에 role 필드 추가 및 인증 시스템 연동

**작업 내용**:
- [ ] 백엔드: User 스키마에 `role` 필드 추가
- [ ] 백엔드: 마이그레이션 스크립트 작성 (기존 사용자 role 설정)
- [ ] 백엔드: 관리자 권한 가드 생성 (`@Admin()` 데코레이터)
- [ ] 프론트엔드: NextAuth 타입 확장 (`types/next-auth.d.ts`)
- [ ] 프론트엔드: `auth.ts`에서 세션에 role 포함하도록 수정
- [ ] 프론트엔드: 관리자 권한 체크 유틸 함수 생성 (`app/lib/auth.ts`)

**파일 변경**:
- `types/next-auth.d.ts` (신규)
- `auth.ts` (수정)
- `app/lib/auth.ts` (신규)

**테스트**:
- 관리자/일반 사용자 세션에서 role 확인
- 권한 체크 함수 동작 확인

---

### PR 2: 관리자 페이지 접근 제어 및 API 연동
**목표**: 관리자 페이지 접근 제어 및 백엔드 API 연동

**작업 내용**:
- [ ] 프론트엔드: `middleware.ts`에 관리자 페이지 접근 제어 추가
- [ ] 프론트엔드: `app/admin/layout.tsx` 생성 (권한 체크)
- [ ] 프론트엔드: `app/lib/api.ts`에 `x-user-id` 헤더 추가 로직
- [ ] 프론트엔드: API 클라이언트에 세션 기반 인증 헤더 주입
- [ ] 프론트엔드: `app/components/GNB.tsx`에서 관리자 링크 권한별 표시
- [ ] 프론트엔드: `app/admin/page.tsx` 권한 체크 추가

**파일 변경**:
- `middleware.ts` (수정)
- `app/admin/layout.tsx` (신규)
- `app/lib/api.ts` (수정)
- `app/components/GNB.tsx` (수정)
- `app/admin/page.tsx` (수정)

**테스트**:
- 관리자가 아닌 사용자가 `/admin` 접근 시 차단
- 관리자만 관리자 링크 표시
- API 호출 시 헤더 정상 전달

---

### PR 3: 관리자 신청 목록 페이지 구현
**목표**: 챕터별 개설 신청 목록 조회 및 심사 기능

**작업 내용**:
- [ ] 프론트엔드: `app/admin/applications/page.tsx` 생성
- [ ] 프론트엔드: 챕터 선택 드롭다운 추가
- [ ] 프론트엔드: 신청 목록 조회 API 연동
- [ ] 프론트엔드: 심사 상태 필터링 (pending, approved, rejected)
- [ ] 프론트엔드: 신청 상세 모달/페이지
- [ ] 프론트엔드: 심사 처리 기능 (승인/반려)
- [ ] 프론트엔드: 통계 카드 (대기/승인/반려 수)

**파일 변경**:
- `app/admin/applications/page.tsx` (신규)
- `app/lib/api.ts` (신규 API 함수 추가)
- `app/lib/queries.ts` (신규 쿼리 추가)

**API 엔드포인트 사용**:
- `GET /chapters/:chapterId/applications`
- `GET /chapters/:chapterId/applications/stats`
- `GET /chapters/:chapterId/applications/:applicationId`
- `PATCH /chapters/:chapterId/applications/:applicationId/review`

**테스트**:
- 신청 목록 조회
- 심사 상태별 필터링
- 심사 처리 (승인/반려)

---

### PR 4: 관리자 등록 완료 목록 페이지 구현
**목표**: 부원모집 완료(등록 완료) 그룹 목록 조회

**작업 내용**:
- [ ] 프론트엔드: `app/admin/registrations/page.tsx` 생성
- [ ] 프론트엔드: 챕터별 등록 완료 그룹 목록 조회
- [ ] 프론트엔드: 그룹 상세 정보 표시 (리더, 부리더, 멤버 수 등)
- [ ] 프론트엔드: 리더 OT 참여 통계 표시
- [ ] 프론트엔드: 검색 및 필터링 기능

**파일 변경**:
- `app/admin/registrations/page.tsx` (신규)
- `app/lib/api.ts` (신규 API 함수 추가)
- `app/lib/queries.ts` (신규 쿼리 추가)

**API 엔드포인트 사용**:
- `GET /chapters/:chapterId/registrations`
- `GET /chapters/:chapterId/registrations/ot-stats`
- `GET /chapters/:chapterId/groups/:groupId/members`

**테스트**:
- 등록 완료 그룹 목록 조회
- 통계 정보 표시
- 그룹 상세 정보 확인

---

### PR 5: 관리자 대시보드 개선 및 통합
**목표**: 관리자 메인 페이지를 대시보드로 개선

**작업 내용**:
- [ ] 프론트엔드: `app/admin/page.tsx` 대시보드로 리팩토링
- [ ] 프론트엔드: 전체 통계 카드 (신청 수, 승인 수, 등록 완료 수 등)
- [ ] 프론트엔드: 최근 신청 목록 미리보기
- [ ] 프론트엔드: 최근 등록 완료 목록 미리보기
- [ ] 프론트엔드: 챕터별 현황 요약
- [ ] 프론트엔드: 네비게이션 개선 (사이드바 또는 탭)

**파일 변경**:
- `app/admin/page.tsx` (대폭 수정)
- `app/admin/layout.tsx` (사이드바 추가 가능)

**테스트**:
- 대시보드 통계 정확성
- 최근 목록 표시
- 네비게이션 동작

---

## 5. 추가 고려사항

### 5.1 초기 관리자 설정
- 백엔드에서 특정 이메일/사용자 ID를 관리자로 설정하는 방법 필요
- 환경변수 또는 데이터베이스 직접 설정

### 5.2 API 인증 헤더 처리
- 현재 프론트엔드에서 `x-user-id` 헤더를 보내지 않음
- Next.js API Route를 통한 프록시로 헤더 주입 필요
- 또는 axios interceptor로 세션에서 user.id 추출하여 헤더 추가

### 5.3 에러 처리
- 권한 없음 (403) 에러 처리
- 관리자 페이지 접근 시 적절한 에러 메시지 표시

### 5.4 보안
- 클라이언트 사이드 권한 체크만으로는 부족
- 모든 관리자 API는 백엔드에서 권한 재검증 필요
- 민감한 정보는 서버 사이드에서만 처리

---

## 6. 참고 파일

- `api-docs.md` - 백엔드 API 명세
- `auth.ts` - NextAuth 설정
- `middleware.ts` - 인증 미들웨어
- `app/lib/api.ts` - API 클라이언트
- `app/admin/page.tsx` - 현재 관리자 페이지 (기본 구조만 있음)
