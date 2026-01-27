# Study-Somoim API Reference

스터디/소모임 플랫폼 API 완전 레퍼런스 문서입니다.

---

## 목차

1. [개요](#1-개요)
2. [Enum/Type 정의](#2-enumtype-정의)
3. [데이터 모델](#3-데이터-모델)
4. [API 엔드포인트](#4-api-엔드포인트)
5. [비즈니스 로직](#5-비즈니스-로직)
6. [상태 플로우](#6-상태-플로우)
7. [프론트엔드 통합 가이드](#7-프론트엔드-통합-가이드)

---

## 1. 개요

### 1.1 Base URL

```
https://api.samsam.spartacodingclub.kr/study-somoim
```

### 1.2 공통 헤더

| 헤더 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `Content-Type` | string | O | `application/json` |
| `x-user-id` | string | 조건부 | 사용자 인증이 필요한 API에서 사용 (MongoDB ObjectId) |

### 1.3 공통 응답 형식

#### 성공 응답

```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true
  }
}
```

#### 단일 객체 응답

```json
{
  "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
  "name": "...",
  ...
}
```

#### 에러 응답

```json
{
  "statusCode": 400,
  "message": ["name must be a string"],
  "error": "Bad Request"
}
```

### 1.4 공통 에러 코드

| 상태 코드 | 설명 |
|----------|------|
| 400 | Bad Request - 유효성 검사 실패 |
| 404 | Not Found - 리소스를 찾을 수 없음 |
| 403 | Forbidden - 권한 없음 |
| 500 | Internal Server Error |

---

## 2. Enum/Type 정의

### 2.1 GroupType (그룹 유형)

```typescript
enum GroupType {
  STUDY_COMPANY = 'study_company',  // 전사 구성원 대상 스터디
  STUDY_TEAM = 'study_team',        // 팀/파트/스쿼드 대상 스터디
  SOMOIM = 'somoim'                 // 소모임
}
```

**사용 예시:**
```json
{
  "type": "study_company"
}
```

### 2.2 ReviewStatus (심사 상태)

```typescript
enum ReviewStatus {
  PENDING = 'pending',              // 심사 대기 중
  APPROVED = 'approved',            // 승인됨
  REJECTED = 'rejected',            // 반려됨
  AUTO_EXTENDED = 'auto_extended'   // 자동 연장됨 (기존 그룹)
}
```

### 2.3 MemberRole (멤버 역할)

```typescript
enum MemberRole {
  LEADER = 'leader',              // 리더
  SUB_LEADER = 'sub_leader',      // 부리더
  REGULAR = 'regular',            // 정규 부원
  OBSERVER = 'observer'           // 순수 참여 부원
}
```

### 2.4 ParticipationType (참여 유형)

```typescript
enum ParticipationType {
  REGULAR = 'regular',    // 정규 참여 (지원금 3만원)
  OBSERVER = 'observer'   // 순수 참여 (지원금 없음)
}
```

### 2.5 ChapterPhase (챕터 단계)

```typescript
enum ChapterPhase {
  UPCOMING = 'upcoming',          // 시작 전
  APPLICATION = 'application',    // 개설 신청 기간
  RECRUITMENT = 'recruitment',    // 부원 모집 기간
  ACTIVE = 'active',              // 활동 기간
  COMPLETED = 'completed'         // 종료됨
}
```

**계산 로직:** `periods` 필드와 현재 날짜를 비교하여 자동 계산됩니다.

---

## 3. 데이터 모델

### 3.1 Chapter (챕터)

운영 기간을 나타내는 최상위 엔티티입니다.

```typescript
interface ChapterPeriods {
  applicationStart: Date;   // 개설 신청 시작일
  applicationEnd: Date;     // 개설 신청 종료일
  recruitmentStart: Date;   // 부원 모집 시작일
  recruitmentEnd: Date;     // 부원 모집 종료일
  activityStart: Date;      // 활동 시작일
  activityEnd: Date;        // 활동 종료일
}

interface Chapter {
  _id: string;              // MongoDB ObjectId
  name: string;             // 챕터 이름 (예: "2026년 1-2월 챕터")
  sequence: number;         // 챕터 순번 (정렬용)
  periods: ChapterPeriods;  // 기간 정보
  currentPhase: ChapterPhase; // [Virtual] 현재 단계
  createdAt: Date;
  updatedAt: Date;
}
```

**응답 예시:**
```json
{
  "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
  "name": "2026년 1-2월 챕터",
  "sequence": 1,
  "periods": {
    "applicationStart": "2026-01-01T00:00:00.000Z",
    "applicationEnd": "2026-01-15T23:59:59.000Z",
    "recruitmentStart": "2026-01-16T00:00:00.000Z",
    "recruitmentEnd": "2026-01-31T23:59:59.000Z",
    "activityStart": "2026-02-01T00:00:00.000Z",
    "activityEnd": "2026-02-28T23:59:59.000Z"
  },
  "currentPhase": "active",
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-01-01T10:00:00.000Z"
}
```

### 3.2 Group (그룹 마스터)

여러 챕터에 걸쳐 유지되는 그룹의 기본 정보입니다.

```typescript
interface Group {
  _id: string;
  name: string;              // 그룹 이름
  leader: string;            // 리더 이름 (레거시)
  team: string;              // 팀 이름 (레거시)
  type: GroupType;           // 그룹 유형
  description?: string;      // 그룹 설명
  schedule?: string;         // 활동 일정
  location?: string;         // 활동 장소
  hasLeaderExperience: boolean; // 리더 OT 경험 여부
  originChapter?: string;    // 최초 개설 챕터 ID
  isActive: boolean;         // 운영 중 여부 (기본값: true)
  category?: string;         // 세부 카테고리
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.3 ChapterGroup (챕터별 그룹)

특정 챕터에 등록된 그룹 인스턴스입니다.

```typescript
interface ChapterGroup {
  _id: string;
  chapter: string;           // 챕터 ID (ref: Chapter)
  group: string;             // 그룹 마스터 ID (ref: Group)
  leader: string;            // 리더 ID (ref: User)
  team?: string;             // 팀 ID (ref: Team)
  type: GroupType;           // 그룹 유형
  operationPlan?: string;    // 운영 내용
  meetingSchedule?: string;  // 모임 일정
  meetingLocation?: string;  // 모임 장소

  // 심사 정보
  reviewStatus: ReviewStatus; // 심사 상태 (기본값: 'pending')
  reviewedAt?: Date;         // 심사 일시
  reviewedBy?: string;       // 심사자 ID (ref: User)
  reviewComment?: string;    // 심사 코멘트
  isExtension: boolean;      // 자동 연장 여부 (기본값: false)

  // 최종 등록 정보
  leaderOrientationAttended: boolean; // 리더 OT 참여 여부
  subLeader?: string;        // 부리더 ID (ref: User) - 1명만
  allowNewHires: boolean;    // 신규입사자 합류 가능
  registeredAt?: Date;       // 최종 등록 완료 시점 (null = 미등록)

  // Virtual 필드
  status: 'rejected' | 'pending' | 'approved' | 'registered';
  isRegistered: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

**status Virtual 필드 계산 로직:**
```typescript
get status(): string {
  if (this.reviewStatus === 'rejected') return 'rejected';
  if (this.registeredAt) return 'registered';
  if (this.reviewStatus === 'approved' || this.reviewStatus === 'auto_extended') return 'approved';
  return 'pending';
}
```

### 3.4 Membership (멤버십)

사용자의 그룹 참여 정보입니다.

```typescript
interface Membership {
  _id: string;
  chapterGroup: string;      // ChapterGroup ID
  user: string;              // 사용자 ID (ref: User)
  role: MemberRole;          // 역할
  participationType: ParticipationType; // 참여 유형
  cancelledAt?: Date;        // 취소 일시 (null = 활성)

  // Virtual 필드
  status: 'active' | 'cancelled';
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

### 3.5 Activity (활동 기록)

그룹의 활동 기록입니다.

```typescript
interface Activity {
  _id: string;
  groupName: string;         // 그룹 이름 (레거시 호환)
  activityDate: Date;        // 활동 일자
  content?: string;          // 활동 내용
  link?: string;             // 관련 링크
  mediaUrl?: string;         // 미디어 URL

  // 관계 필드
  chapterGroup?: string;     // ChapterGroup ID
  chapter?: string;          // 챕터 ID
  group?: string;            // 그룹 마스터 ID
  createdBy?: string;        // 작성자 ID

  createdAt: Date;
  updatedAt: Date;
}
```

### 3.6 페이지네이션 응답

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;      // 전체 개수
    page: number;       // 현재 페이지
    limit: number;      // 페이지 크기
    totalPages: number; // 전체 페이지 수
    hasNextPage: boolean; // 다음 페이지 존재 여부
  };
}
```

---

## 4. API 엔드포인트

### 4.1 Lookup API

사용자/팀 목록 조회 (드롭다운용)

#### GET /lookup/users

사용자 목록을 조회합니다.

**요청:**
```bash
curl -X GET "https://api.samsam.spartacodingclub.kr/study-somoim/lookup/users"
```

**응답:**
```json
[
  {
    "_id": "65f1a2b3c4d5e6f7g8h9i0k1",
    "name": "홍길동",
    "teamName": "개발팀"
  }
]
```

#### GET /lookup/teams

팀 목록을 조회합니다.

**요청:**
```bash
curl -X GET "https://api.samsam.spartacodingclub.kr/study-somoim/lookup/teams"
```

**응답:**
```json
[
  {
    "_id": "65f1a2b3c4d5e6f7g8h9i0k2",
    "name": "개발팀"
  }
]
```

---

### 4.2 Chapter API

#### GET /chapters

모든 챕터 목록을 조회합니다.

**요청:**
```bash
curl -X GET "https://api.samsam.spartacodingclub.kr/study-somoim/chapters"
```

**응답:**
```json
[
  {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "name": "2026년 1-2월 챕터",
    "sequence": 1,
    "periods": { ... },
    "currentPhase": "active"
  }
]
```

#### GET /chapters/current

현재 활성 챕터를 조회합니다.

**요청:**
```bash
curl -X GET "https://api.samsam.spartacodingclub.kr/study-somoim/chapters/current"
```

#### GET /chapters/:chapterId

특정 챕터 상세 정보를 조회합니다.

**요청:**
```bash
curl -X GET "https://api.samsam.spartacodingclub.kr/study-somoim/chapters/65f1a2b3c4d5e6f7g8h9i0j1"
```

#### POST /chapters

새 챕터를 생성합니다. **기존 활성 그룹들이 자동으로 연장됩니다.**

**요청 바디 (CreateChapterDto):**

| 필드 | 타입 | 필수 | 유효성 검사 | 설명 |
|------|------|------|------------|------|
| `name` | string | O | `@IsString()` | 챕터 이름 |
| `sequence` | number | X | `@IsInt()` `@Min(1)` | 챕터 순번 (생략 시 자동 채번) |
| `periods` | object | O | `@ValidateNested()` | 기간 정보 |
| `periods.applicationStart` | string | O | `@IsDateString()` | 개설 신청 시작일 |
| `periods.applicationEnd` | string | O | `@IsDateString()` | 개설 신청 종료일 |
| `periods.recruitmentStart` | string | O | `@IsDateString()` | 부원 모집 시작일 |
| `periods.recruitmentEnd` | string | O | `@IsDateString()` | 부원 모집 종료일 |
| `periods.activityStart` | string | O | `@IsDateString()` | 활동 시작일 |
| `periods.activityEnd` | string | O | `@IsDateString()` | 활동 종료일 |

**요청 예시:**
```bash
curl -X POST "https://api.samsam.spartacodingclub.kr/study-somoim/chapters" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2026년 3-4월 챕터",
    "periods": {
      "applicationStart": "2026-03-01T00:00:00Z",
      "applicationEnd": "2026-03-15T23:59:59Z",
      "recruitmentStart": "2026-03-16T00:00:00Z",
      "recruitmentEnd": "2026-03-31T23:59:59Z",
      "activityStart": "2026-04-01T00:00:00Z",
      "activityEnd": "2026-04-30T23:59:59Z"
    }
  }'
```

#### PATCH /chapters/:chapterId

챕터 정보를 수정합니다.

**요청 바디 (UpdateChapterDto):** 모든 필드 선택사항

```bash
curl -X PATCH "https://api.samsam.spartacodingclub.kr/study-somoim/chapters/65f1a2b3c4d5e6f7g8h9i0j1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2026년 1-2월 챕터 (수정)"
  }'
```

#### DELETE /chapters/:chapterId

챕터를 삭제합니다.

**응답:**
```json
{
  "success": true
}
```

---

### 4.3 Application API (개설 신청)

#### POST /chapters/:chapterId/applications

개설 신청을 제출합니다.

**요청 바디 (CreateApplicationDto):**

| 필드 | 타입 | 필수 | 유효성 검사 | 설명 |
|------|------|------|------------|------|
| `leaderId` | string | O | `@IsMongoId()` | 리더 사용자 ID |
| `teamId` | string | O | `@IsMongoId()` | 팀 ID |
| `type` | GroupType | O | `@IsEnum(GroupType)` | 그룹 유형 |
| `name` | string | O | `@IsString()` | 스터디/소모임 이름 |
| `operationPlan` | string | O | `@IsString()` | 운영 내용 |
| `meetingSchedule` | string | O | `@IsString()` | 모임 일정 |
| `meetingLocation` | string | O | `@IsString()` | 모임 장소 |
| `description` | string | X | `@IsString()` | 그룹 설명 |
| `category` | string | X | `@IsString()` | 세부 카테고리 |

**요청 예시:**
```bash
curl -X POST "https://api.samsam.spartacodingclub.kr/study-somoim/chapters/65f1a2b3c4d5e6f7g8h9i0j1/applications" \
  -H "Content-Type: application/json" \
  -d '{
    "leaderId": "65f1a2b3c4d5e6f7g8h9i0k1",
    "teamId": "65f1a2b3c4d5e6f7g8h9i0k2",
    "type": "study_company",
    "name": "프론트엔드 스터디",
    "operationPlan": "매주 2시간씩 React 심화 학습",
    "meetingSchedule": "매주 화요일 12:00-14:00",
    "meetingLocation": "회의실 A",
    "description": "React와 TypeScript를 함께 배우는 스터디",
    "category": "개발"
  }'
```

#### GET /chapters/:chapterId/applications

신청 목록을 조회합니다 (관리자용).

**쿼리 파라미터 (ApplicationQueryDto):**

| 파라미터 | 타입 | 필수 | 유효성 검사 | 기본값 | 설명 |
|----------|------|------|------------|--------|------|
| `page` | number | X | `@IsInt()` `@Min(1)` | 1 | 페이지 번호 |
| `limit` | number | X | `@IsInt()` `@Min(1)` `@Max(100)` | 20 | 페이지 크기 |
| `type` | GroupType | X | `@IsEnum(GroupType)` | - | 그룹 유형 필터 |
| `reviewStatus` | ReviewStatus | X | `@IsEnum(ReviewStatus)` | - | 심사 상태 필터 |
| `search` | string | X | `@IsString()` | - | 검색어 (이름) |

**요청 예시:**
```bash
curl -X GET "https://api.samsam.spartacodingclub.kr/study-somoim/chapters/65f1a2b3c4d5e6f7g8h9i0j1/applications?page=1&limit=10&reviewStatus=pending"
```

#### GET /chapters/:chapterId/applications/me

내 신청 목록을 조회합니다.

**헤더:**
- `x-user-id`: 사용자 ID (필수)

```bash
curl -X GET "https://api.samsam.spartacodingclub.kr/study-somoim/chapters/65f1a2b3c4d5e6f7g8h9i0j1/applications/me" \
  -H "x-user-id: 65f1a2b3c4d5e6f7g8h9i0k1"
```

#### GET /chapters/:chapterId/applications/stats

심사 통계를 조회합니다.

**응답:**
```json
{
  "pending": 5,
  "approved": 10,
  "rejected": 2
}
```

#### GET /chapters/:chapterId/applications/:applicationId

신청 상세 정보를 조회합니다.

#### DELETE /chapters/:chapterId/applications/:applicationId

신청을 취소합니다. (대기 중인 신청만 가능)

**응답:**
```json
{
  "success": true
}
```

#### PATCH /chapters/:chapterId/applications/:applicationId/review

심사를 처리합니다 (관리자용).

**헤더:**
- `x-user-id`: 심사자 ID (필수)

**요청 바디 (ReviewApplicationDto):**

| 필드 | 타입 | 필수 | 유효성 검사 | 설명 |
|------|------|------|------------|------|
| `decision` | 'approved' \| 'rejected' | O | `@IsEnum(ReviewDecision)` | 심사 결정 |
| `reviewComment` | string | X | `@IsString()` | 심사 코멘트 |

**요청 예시:**
```bash
curl -X PATCH "https://api.samsam.spartacodingclub.kr/study-somoim/chapters/65f1a2b3c4d5e6f7g8h9i0j1/applications/65f1a2b3c4d5e6f7g8h9i0j3/review" \
  -H "Content-Type: application/json" \
  -H "x-user-id: 65f1a2b3c4d5e6f7g8h9i0k3" \
  -d '{
    "decision": "approved",
    "reviewComment": "좋은 운영 계획입니다."
  }'
```

---

### 4.4 Group API (그룹 조회)

#### GET /chapters/:chapterId/groups

승인된 그룹 목록을 조회합니다.

**쿼리 파라미터 (GroupQueryDto):**

| 파라미터 | 타입 | 필수 | 유효성 검사 | 기본값 | 설명 |
|----------|------|------|------------|--------|------|
| `page` | number | X | `@IsInt()` `@Min(1)` | 1 | 페이지 번호 |
| `limit` | number | X | `@IsInt()` `@Min(1)` `@Max(100)` | 20 | 페이지 크기 |
| `type` | GroupType | X | `@IsEnum(GroupType)` | - | 그룹 유형 필터 |
| `search` | string | X | `@IsString()` | - | 검색어 |

#### GET /chapters/:chapterId/groups/recruiting

모집 중인 그룹 목록을 조회합니다.

#### GET /chapters/:chapterId/groups/:groupId

그룹 상세 정보를 조회합니다.

#### PATCH /chapters/:chapterId/groups/:groupId/terminate

그룹을 종료합니다 (리더만 가능). 다음 챕터에 자동 연장되지 않습니다.

**헤더:**
- `x-user-id`: 사용자 ID (필수, 리더만)

**응답:**
```json
{
  "success": true
}
```

#### POST /chapters/:chapterId/groups/:groupId/registration

최종 등록을 완료합니다. **리더/부리더 멤버십이 자동 생성됩니다.**

**요청 바디 (RegistrationDto):**

| 필드 | 타입 | 필수 | 유효성 검사 | 설명 |
|------|------|------|------------|------|
| `leaderOrientationAttended` | boolean | O | `@IsBoolean()` | 리더 OT 참여 여부 |
| `subLeaderId` | string | X | `@IsMongoId()` | 부리더 ID (1명) |
| `allowNewHires` | boolean | O | `@IsBoolean()` | 신규입사자 합류 가능 |

**요청 예시:**
```bash
curl -X POST "https://api.samsam.spartacodingclub.kr/study-somoim/chapters/65f1a2b3c4d5e6f7g8h9i0j1/groups/65f1a2b3c4d5e6f7g8h9i0j3/registration" \
  -H "Content-Type: application/json" \
  -d '{
    "leaderOrientationAttended": true,
    "subLeaderId": "65f1a2b3c4d5e6f7g8h9i0k4",
    "allowNewHires": true
  }'
```

#### GET /chapters/:chapterId/registrations

등록 완료된 그룹 목록을 조회합니다 (관리자용).

#### GET /chapters/:chapterId/registrations/ot-stats

리더 OT 참여 통계를 조회합니다.

**응답:**
```json
{
  "attended": 15,
  "notAttended": 3,
  "total": 18
}
```

---

### 4.5 Membership API (부원 관리)

#### POST /chapters/:chapterId/groups/:groupId/members

그룹에 참여를 신청합니다. **자동으로 등록됩니다.**

**요청 바디 (CreateMembershipDto):**

| 필드 | 타입 | 필수 | 유효성 검사 | 설명 |
|------|------|------|------------|------|
| `userId` | string | O | `@IsMongoId()` | 사용자 ID |
| `participationType` | ParticipationType | O | `@IsEnum(ParticipationType)` | 참여 유형 |

**요청 예시:**
```bash
curl -X POST "https://api.samsam.spartacodingclub.kr/study-somoim/chapters/65f1a2b3c4d5e6f7g8h9i0j1/groups/65f1a2b3c4d5e6f7g8h9i0j3/members" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "65f1a2b3c4d5e6f7g8h9i0k5",
    "participationType": "regular"
  }'
```

#### GET /chapters/:chapterId/groups/:groupId/members

참여자 목록을 조회합니다.

**쿼리 파라미터 (MembershipQueryDto):**

| 파라미터 | 타입 | 필수 | 유효성 검사 | 기본값 | 설명 |
|----------|------|------|------------|--------|------|
| `page` | number | X | `@IsInt()` `@Min(1)` | 1 | 페이지 번호 |
| `limit` | number | X | `@IsInt()` `@Min(1)` `@Max(100)` | 20 | 페이지 크기 |
| `participationType` | ParticipationType | X | `@IsEnum()` | - | 참여 유형 필터 |
| `role` | MemberRole | X | `@IsEnum()` | - | 역할 필터 |
| `activeOnly` | boolean | X | `@IsBoolean()` | true | 활성 멤버만 조회 |

#### DELETE /chapters/:chapterId/groups/:groupId/members/:membershipId

참여를 취소합니다. **본인만 취소할 수 있습니다.**

**헤더:**
- `x-user-id`: 사용자 ID (필수)

**응답:**
```json
{
  "success": true
}
```

---

### 4.6 Activity API (활동 기록)

#### POST /chapters/:chapterId/groups/:groupId/activities

활동을 기록합니다.

**헤더:**
- `x-user-id`: 작성자 ID (필수)

**요청 바디 (CreateActivityDto):**

| 필드 | 타입 | 필수 | 유효성 검사 | 설명 |
|------|------|------|------------|------|
| `groupName` | string | O | `@IsString()` | 그룹 이름 |
| `activityDate` | string | O | `@IsDateString()` | 활동 날짜 |
| `content` | string | X | `@IsString()` | 활동 내용 |
| `link` | string | X | `@IsString()` | 관련 링크 |
| `mediaUrl` | string | X | `@IsString()` | 미디어 URL |

**요청 예시:**
```bash
curl -X POST "https://api.samsam.spartacodingclub.kr/study-somoim/chapters/65f1a2b3c4d5e6f7g8h9i0j1/groups/65f1a2b3c4d5e6f7g8h9i0j3/activities" \
  -H "Content-Type: application/json" \
  -H "x-user-id: 65f1a2b3c4d5e6f7g8h9i0k1" \
  -d '{
    "groupName": "프론트엔드 스터디",
    "activityDate": "2026-02-10T12:00:00Z",
    "content": "React Hooks 심화 학습 - 성능 최적화",
    "link": "https://example.com/learning-resource",
    "mediaUrl": "https://example.com/images/activity-photo.jpg"
  }'
```

#### GET /chapters/:chapterId/groups/:groupId/activities

그룹별 활동 목록을 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `page` | string | X | '1' | 페이지 번호 |
| `limit` | string | X | '20' | 페이지 크기 |

#### GET /chapters/:chapterId/activities

챕터별 전체 활동 목록을 조회합니다.

#### GET /activities/:activityId

활동 상세 정보를 조회합니다.

#### PATCH /activities/:activityId

활동을 수정합니다.

**요청 바디:** `CreateActivityDto`의 모든 필드 선택사항

#### DELETE /activities/:activityId

활동을 삭제합니다.

**응답:**
```json
{
  "success": true
}
```

---

### 4.7 레거시 API (하위 호환)

기존 시스템과의 호환성을 위해 유지됩니다.

#### POST /activity

기존 방식으로 활동을 기록합니다.

#### GET /activities

모든 활동 목록을 조회합니다.

#### GET /groups

모든 그룹 목록을 조회합니다.

---

## 5. 비즈니스 로직

### 5.1 챕터 생성 시 자동 연장

새 챕터 생성 시 기존 활성 그룹(`isActive: true`)들이 자동으로 연장됩니다.

```
1. 새 챕터 생성
2. groups 컬렉션에서 isActive: true인 그룹 조회
3. 각 그룹에 대해 ChapterGroup 생성:
   - reviewStatus: 'auto_extended'
   - isExtension: true
```

### 5.2 최종 등록 시 멤버십 자동 생성

최종 등록 완료 시 리더와 부리더의 멤버십이 자동 생성됩니다.

```
1. RegistrationDto로 최종 등록 요청
2. ChapterGroup.registeredAt 설정
3. 리더 Membership 생성 (role: 'leader')
4. 부리더 Membership 생성 (role: 'sub_leader') - subLeaderId가 있는 경우만
```

### 5.3 그룹 종료 로직

리더가 그룹을 종료하면 다음 챕터에 자동 연장되지 않습니다.

```
1. 리더가 terminate API 호출
2. Group.isActive = false 설정
3. 다음 챕터 생성 시 해당 그룹은 연장되지 않음
```

### 5.4 Virtual 필드 계산

#### Chapter.currentPhase

```typescript
function getCurrentPhase(periods: ChapterPeriods): ChapterPhase {
  const now = new Date();

  if (now < periods.applicationStart) return 'upcoming';
  if (now <= periods.applicationEnd) return 'application';
  if (now <= periods.recruitmentEnd) return 'recruitment';
  if (now <= periods.activityEnd) return 'active';
  return 'completed';
}
```

#### ChapterGroup.status

```typescript
function getStatus(chapterGroup: ChapterGroup): string {
  if (chapterGroup.reviewStatus === 'rejected') return 'rejected';
  if (chapterGroup.registeredAt) return 'registered';
  if (['approved', 'auto_extended'].includes(chapterGroup.reviewStatus)) return 'approved';
  return 'pending';
}
```

#### Membership.status

```typescript
function getStatus(membership: Membership): string {
  return membership.cancelledAt ? 'cancelled' : 'active';
}
```

---

## 6. 상태 플로우

### 6.1 ChapterPhase 전이

```
UPCOMING → APPLICATION → RECRUITMENT → ACTIVE → COMPLETED
    ↓           ↓            ↓           ↓
 (기간 전)  (신청 기간)  (모집 기간)  (활동 기간)
```

### 6.2 ChapterGroup 상태 전이

```
                    ┌─────────────────┐
                    │     PENDING     │
                    │   (심사 대기)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌───────────┐  ┌───────────┐  ┌───────────────┐
      │ APPROVED  │  │ REJECTED  │  │ AUTO_EXTENDED │
      │  (승인)   │  │  (반려)   │  │  (자동 연장)   │
      └─────┬─────┘  └───────────┘  └───────┬───────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
                    ┌───────────────┐
                    │  REGISTERED   │
                    │  (최종 등록)   │
                    └───────────────┘
```

### 6.3 Membership 상태 전이

```
┌─────────────┐         ┌─────────────┐
│   ACTIVE    │ ──────▶ │  CANCELLED  │
│   (활성)    │  취소    │   (취소)    │
└─────────────┘         └─────────────┘
```

---

## 7. 프론트엔드 통합 가이드

### 7.1 상태별 UI 표시

#### ChapterPhase별 UI

| Phase | 표시 텍스트 | 색상 제안 | 허용 액션 |
|-------|-----------|----------|----------|
| `upcoming` | 예정 | Gray | 없음 |
| `application` | 신청 기간 | Blue | 개설 신청 |
| `recruitment` | 모집 기간 | Green | 참여 신청 |
| `active` | 활동 중 | Orange | 활동 기록 |
| `completed` | 종료 | Gray | 조회만 |

#### ChapterGroup.status별 UI

| Status | 표시 텍스트 | 색상 제안 | 뱃지 |
|--------|-----------|----------|------|
| `pending` | 심사 대기 | Yellow | 🟡 |
| `approved` | 승인됨 | Blue | 🔵 |
| `rejected` | 반려됨 | Red | 🔴 |
| `registered` | 등록 완료 | Green | 🟢 |

### 7.2 페이지네이션 처리

```typescript
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 다음 페이지 로드
async function loadNextPage(current: PaginationState) {
  if (current.page >= current.totalPages) return;

  const response = await fetch(
    `/study-somoim/chapters/${chapterId}/groups?page=${current.page + 1}&limit=${current.limit}`
  );
  const data = await response.json();

  return {
    items: data.data,
    pagination: data.meta
  };
}
```

### 7.3 에러 핸들링

```typescript
interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

function handleApiError(error: ApiError) {
  switch (error.statusCode) {
    case 400:
      // 유효성 검사 실패 - 필드별 에러 표시
      const messages = Array.isArray(error.message) ? error.message : [error.message];
      showFieldErrors(messages);
      break;
    case 404:
      // 리소스 없음 - 목록으로 리다이렉트
      showToast('요청한 리소스를 찾을 수 없습니다.');
      navigateToList();
      break;
    case 403:
      // 권한 없음
      showToast('권한이 없습니다.');
      break;
    default:
      showToast('오류가 발생했습니다.');
  }
}
```

### 7.4 API 호출 예시 (React)

```typescript
// hooks/useChapters.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/study-somoim';

// 챕터 목록 조회
export function useChapters() {
  return useQuery({
    queryKey: ['chapters'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/chapters`);
      return res.json();
    }
  });
}

// 현재 활성 챕터 조회
export function useCurrentChapter() {
  return useQuery({
    queryKey: ['chapters', 'current'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/chapters/current`);
      return res.json();
    }
  });
}

// 개설 신청
export function useCreateApplication(chapterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApplicationDto) => {
      const res = await fetch(`${API_BASE}/chapters/${chapterId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', chapterId] });
    }
  });
}

// 참여 신청
export function useJoinGroup(chapterId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMembershipDto) => {
      const res = await fetch(
        `${API_BASE}/chapters/${chapterId}/groups/${groupId}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      );
      if (!res.ok) throw await res.json();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', groupId] });
    }
  });
}
```

### 7.5 TypeScript 타입 정의 파일

프론트엔드에서 사용할 타입 정의:

```typescript
// types/study-somoim.ts

// Enums
export type GroupType = 'study_company' | 'study_team' | 'somoim';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'auto_extended';
export type MemberRole = 'leader' | 'sub_leader' | 'regular' | 'observer';
export type ParticipationType = 'regular' | 'observer';
export type ChapterPhase = 'upcoming' | 'application' | 'recruitment' | 'active' | 'completed';

// DTOs
export interface CreateChapterDto {
  name: string;
  sequence?: number;
  periods: {
    applicationStart: string;
    applicationEnd: string;
    recruitmentStart: string;
    recruitmentEnd: string;
    activityStart: string;
    activityEnd: string;
  };
}

export interface CreateApplicationDto {
  leaderId: string;
  teamId: string;
  type: GroupType;
  name: string;
  operationPlan: string;
  meetingSchedule: string;
  meetingLocation: string;
  description?: string;
  category?: string;
}

export interface ReviewApplicationDto {
  decision: 'approved' | 'rejected';
  reviewComment?: string;
}

export interface RegistrationDto {
  leaderOrientationAttended: boolean;
  subLeaderId?: string;
  allowNewHires: boolean;
}

export interface CreateMembershipDto {
  userId: string;
  participationType: ParticipationType;
}

export interface CreateActivityDto {
  groupName: string;
  activityDate: string;
  content?: string;
  link?: string;
  mediaUrl?: string;
}

// Query DTOs
export interface ApplicationQueryDto {
  page?: number;
  limit?: number;
  type?: GroupType;
  reviewStatus?: ReviewStatus;
  search?: string;
}

export interface GroupQueryDto {
  page?: number;
  limit?: number;
  type?: GroupType;
  search?: string;
}

export interface MembershipQueryDto {
  page?: number;
  limit?: number;
  participationType?: ParticipationType;
  role?: MemberRole;
  activeOnly?: boolean;
}

// Response Models
export interface Chapter {
  _id: string;
  name: string;
  sequence: number;
  periods: {
    applicationStart: string;
    applicationEnd: string;
    recruitmentStart: string;
    recruitmentEnd: string;
    activityStart: string;
    activityEnd: string;
  };
  currentPhase: ChapterPhase;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  leader: string;
  team: string;
  type: GroupType;
  description?: string;
  schedule?: string;
  location?: string;
  hasLeaderExperience: boolean;
  originChapter?: string;
  isActive: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterGroup {
  _id: string;
  chapter: string;
  group: string;
  leader: string;
  team?: string;
  type: GroupType;
  operationPlan?: string;
  meetingSchedule?: string;
  meetingLocation?: string;
  reviewStatus: ReviewStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
  isExtension: boolean;
  leaderOrientationAttended: boolean;
  subLeader?: string;
  allowNewHires: boolean;
  registeredAt?: string;
  status: 'rejected' | 'pending' | 'approved' | 'registered';
  isRegistered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  _id: string;
  chapterGroup: string;
  user: string;
  role: MemberRole;
  participationType: ParticipationType;
  cancelledAt?: string;
  status: 'active' | 'cancelled';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  groupName: string;
  activityDate: string;
  content?: string;
  link?: string;
  mediaUrl?: string;
  chapterGroup?: string;
  chapter?: string;
  group?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// User/Team Lookup
export interface UserLookup {
  _id: string;
  name: string;
  teamName: string;
}

export interface TeamLookup {
  _id: string;
  name: string;
}
```

---

## 부록: Swagger 문서

서버 실행 후 다음 URL에서 Swagger UI를 확인할 수 있습니다:

```
https://api.samsam.spartacodingclub.kr/api-docs
```
