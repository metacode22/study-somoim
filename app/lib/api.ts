import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/backend",
  headers: {
    "Content-Type": "application/json",
  },
});

// 에러 인터셉터: 공통 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    // 401, 403 등 인증 에러 처리
    if (error.response?.status === 401 || error.response?.status === 403) {
      // 필요시 로그인 페이지로 리다이렉트
      console.error("인증 오류:", error.response?.data);
    }
    return Promise.reject(error);
  }
);

// API Base Path
const API_BASE = "/study-somoim";

// Enums (api-docs 기반)
export type GroupType = "study_company" | "study_team" | "somoim";
/** Application/CreateApplicationDto에서 사용하는 그룹 유형 (GroupType과 동일) */
export type ApplicationGroupType = GroupType;
export type ReviewStatus = "pending" | "approved" | "rejected" | "auto_extended";
export type MemberRole = "leader" | "sub_leader" | "regular" | "observer";
export type ParticipationType = "regular" | "observer";
export type ChapterPhase = "upcoming" | "application" | "recruitment" | "active" | "completed";

/**
 * recruitment 확장 필드 (PRD, 목업용)
 * - category, scheduleDays, selectionPeriod, activityPeriod: 필터·상세·모달
 * - applyStatus: 신청가능/불가 필터
 * - isSelectionComplete: 취소 가능 여부
 */
export type ApplyStatus = "regular" | "guest" | "newcomer" | "auto" | "closed";

// GroupType을 한글 표시로 변환
export function getGroupTypeLabel(type: GroupType): string {
  switch (type) {
    case "somoim":
      return "소모임";
    case "study_team":
      return "스터디(팀/파트/스쿼드 대상)";
    case "study_company":
      return "스터디(전사 구성원 대상)";
    default:
      return type;
  }
}

// Chapter
export interface ChapterPeriods {
  applicationStart: string;
  applicationEnd: string;
  recruitmentStart: string;
  recruitmentEnd: string;
  activityStart: string;
  activityEnd: string;
}

export interface Chapter {
  _id: string;
  name: string;
  sequence: number;
  periods: ChapterPeriods;
  currentPhase: ChapterPhase;
  createdAt: string;
  updatedAt: string;
}

// Group (마스터)
export interface Group {
  _id: string;
  name: string;
  leader: string; // 레거시: 이름
  team?: string; // 레거시: 팀 이름
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
  // recruitment PRD (optional, mock/backend)
  scheduleDays?: string[];
  selectionPeriod?: string;
  activityPeriod?: string;
  applyStatus?: ApplyStatus;
  isSelectionComplete?: boolean;
}

// ChapterGroup (챕터별 그룹)
export interface ChapterGroup {
  _id: string;
  chapter: string;
  group: string | Group; // populate 가능
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
  status: "rejected" | "pending" | "approved" | "registered";
  isRegistered: boolean;
  createdAt: string;
  updatedAt: string;
  recruitmentCompleted?: boolean;
  memberCount?: number;
  maxMembers?: number;
}

export interface TeamLookup {
  _id: string;
  name: string;
}

export interface CreateApplicationDto {
  leaderId: string;
  teamId: string;
  type: ApplicationGroupType;
  name: string;
  operationPlan: string;
  meetingSchedule: string;
  meetingLocation: string;
  description?: string;
  category?: string;
}

// API functions
export async function getCurrentChapter(): Promise<Chapter | null> {
  const url = `${API_BASE}/chapters/current`;
  if (process.env.NODE_ENV === "development") {
    console.log("🌐 Calling API:", url);
  }
  try {
    const { data } = await apiClient.get<Chapter>(url);
    // 빈 객체나 null인 경우 null 반환
    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      if (process.env.NODE_ENV === "development") {
        console.log("⚠️ getCurrentChapter: 빈 응답, null 반환");
      }
      return null;
    }
    if (process.env.NODE_ENV === "development") {
      console.log("✅ getCurrentChapter success:", data._id);
    }
    return data;
  } catch (error: any) {
    // 404는 챕터가 없는 것으로 간주 (에러 아님)
    if (error.response?.status === 404) {
      if (process.env.NODE_ENV === "development") {
        console.log("⚠️ getCurrentChapter: 404 - 챕터 없음");
      }
      return null;
    }
    console.error("❌ getCurrentChapter failed:", {
      url,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    // 챕터가 없어도 에러가 아닐 수 있으므로 null 반환
    return null;
  }
}

// 레거시 API의 한글 type을 enum으로 변환
function normalizeLegacyGroupType(type: string): GroupType {
  if (type.includes("전사 구성원")) return "study_company";
  if (type.includes("팀/파트/스쿼드")) return "study_team";
  if (type === "소모임") return "somoim";
  // 기본값
  return "somoim";
}

export async function getGroups(chapterId?: string): Promise<Group[]> {
  // 레거시 API 사용 (챕터 없이)
  const url = `${API_BASE}/groups`;
  if (process.env.NODE_ENV === "development") {
    console.log("🌐 Calling API:", url);
  }
  try {
    const { data } = await apiClient.get<any[]>(url);
    if (process.env.NODE_ENV === "development") {
      console.log("✅ getGroups (legacy) success:", Array.isArray(data) ? `${data.length} groups` : "invalid format");
    }
    
    if (!Array.isArray(data)) return [];
    
    // 레거시 API의 한글 type을 enum으로 변환
    const normalized = data.map((group) => ({
      ...group,
      type: normalizeLegacyGroupType(group.type || ""),
    })) as Group[];
    
    if (process.env.NODE_ENV === "development") {
      const typeCounts = normalized.reduce((acc, g) => {
        acc[g.type] = (acc[g.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log("📊 Type distribution:", typeCounts);
    }
    
    return normalized;
  } catch (error: any) {
    console.error("❌ getGroups (legacy) failed:", {
      url,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    throw error; // 에러를 다시 throw하여 react-query가 에러 상태를 인식하도록
  }
}

export async function getRecruitingGroups(chapterId: string): Promise<ChapterGroup[]> {
  const url = `${API_BASE}/chapters/${chapterId}/groups/recruiting`;
  console.log("🌐 Calling API:", url);
  try {
    const response = await apiClient.get<{ data: ChapterGroup[] } | ChapterGroup[]>(url);
    console.log("✅ getRecruitingGroups success:", Array.isArray(response.data) ? `${response.data.length} groups` : "wrapped format");
    // 응답이 { data: [...] } 형식인지 배열인지 확인
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      return (response.data as { data: ChapterGroup[] }).data || [];
    }
    return [];
  } catch (error: any) {
    console.error("❌ getRecruitingGroups failed:", {
      url,
      chapterId,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    throw error; // 에러를 다시 throw하여 react-query가 에러 상태를 인식하도록
  }
}

export async function getGroupById(id: string, chapterId?: string): Promise<ChapterGroup | null> {
  try {
    if (chapterId) {
      const { data } = await apiClient.get<ChapterGroup>(
        `${API_BASE}/chapters/${chapterId}/groups/${id}`
      );
      return data;
    } else {
      // 레거시: 직접 조회 (실제로는 chapterId 필요)
      const { data } = await apiClient.get<ChapterGroup>(`${API_BASE}/groups/${id}`);
      return data;
    }
  } catch (error) {
    console.error("Failed to get group:", error);
    return null;
  }
}

// Membership (멤버십)
export interface Membership {
  _id: string;
  chapterGroup: string | ChapterGroup; // populate 가능
  user: string | { _id: string; name: string; teamName?: string }; // populate 가능
  role: MemberRole;
  participationType: ParticipationType;
  cancelledAt?: string;
  status: "active" | "cancelled";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// 챕터 기간 포맷팅
export function formatChapterPeriods(chapter: Chapter): {
  selectionPeriod: string;
  activityPeriod: string;
} {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };

  return {
    selectionPeriod: `${formatDate(chapter.periods.recruitmentStart)} ~ ${formatDate(chapter.periods.recruitmentEnd)}`,
    activityPeriod: `${formatDate(chapter.periods.activityStart)} ~ ${formatDate(chapter.periods.activityEnd)}`,
  };
}

// 참여 신청 (applyGroup)
export interface ApplyGroupRequest {
  userId: string;
  participationType: ParticipationType;
}

export interface ApplyGroupResult {
  success: boolean;
  membership?: Membership;
  reason?: string;
}

// 신청 실패 조건 검증 (클라이언트 측)
export interface ValidateApplicationResult {
  canApply: boolean;
  reason?: string;
}

export async function validateApplication(
  chapterId: string,
  groupId: string,
  userId: string,
  participationType: ParticipationType
): Promise<ValidateApplicationResult> {
  try {
    // 현재 신청하려는 그룹 정보 조회
    const targetGroup = await getGroupById(groupId, chapterId);
    if (!targetGroup) {
      return { canApply: false, reason: "그룹을 찾을 수 없습니다." };
    }

    // 사용자의 기존 신청 목록 조회
    const myMemberships = await getMyMemberships(chapterId, userId);
    const activeMemberships = myMemberships.filter((m) => !m.cancelledAt);

    // 정규 멤버 신청인 경우에만 검증
    if (participationType === "regular") {
      const targetType = targetGroup.type;
      const targetScheduleDays = targetGroup.meetingSchedule
        ? parseScheduleFromString(targetGroup.meetingSchedule)
        : [];

      // 스터디: 동일 요일 스터디가 이미 등록되어 있는지 확인
      if (targetType === "study_team" || targetType === "study_company") {
        for (const membership of activeMemberships) {
          const chapterGroup =
            typeof membership.chapterGroup === "object"
              ? membership.chapterGroup
              : null;
          if (!chapterGroup) continue;

          const existingType = chapterGroup.type;
          const existingGroup =
            typeof chapterGroup.group === "object" ? chapterGroup.group : null;

          // 스터디인 경우만 체크
          if (
            (existingType === "study_team" ||
              existingType === "study_company") &&
            membership.participationType === "regular"
          ) {
            const existingScheduleDays = existingGroup?.scheduleDays
              ? (existingGroup.scheduleDays as string[])
              : chapterGroup.meetingSchedule
              ? parseScheduleFromString(chapterGroup.meetingSchedule)
              : [];

            // 동일 요일이 있는지 확인
            const hasSameDay = targetScheduleDays.some((day) =>
              existingScheduleDays.includes(day)
            );
            if (hasSameDay) {
              return {
                canApply: false,
                reason: "동일 요일의 스터디가 이미 신청되어 있습니다.",
              };
            }
          }
        }
      }

      // 소모임: 이미 등록된 소모임이 2개 이상인지 확인
      if (targetType === "somoim") {
        const somoimCount = activeMemberships.filter((m) => {
          const chapterGroup =
            typeof m.chapterGroup === "object" ? m.chapterGroup : null;
          return (
            chapterGroup?.type === "somoim" &&
            m.participationType === "regular"
          );
        }).length;

        if (somoimCount >= 2) {
          return {
            canApply: false,
            reason: "소모임은 최대 2개까지만 신청할 수 있습니다.",
          };
        }
      }
    }

    return { canApply: true };
  } catch (error) {
    console.error("Failed to validate application:", error);
    // 검증 실패 시 서버에 맡김
    return { canApply: true };
  }
}

// schedule 문자열에서 요일 추출 (간단한 버전)
function parseScheduleFromString(schedule: string): string[] {
  const days: string[] = [];
  if (schedule.includes("월")) days.push("월");
  if (schedule.includes("화")) days.push("화");
  if (schedule.includes("수")) days.push("수");
  if (schedule.includes("목")) days.push("목");
  if (schedule.includes("금")) days.push("금");
  if (schedule.includes("주말") || schedule.includes("토") || schedule.includes("일")) {
    days.push("주말");
  }
  return days.length > 0 ? days : ["비정기"];
}

export async function applyGroup(
  chapterId: string,
  groupId: string,
  userId: string,
  participationType: ParticipationType
): Promise<ApplyGroupResult> {
  try {
    // 클라이언트 측 검증
    const validation = await validateApplication(
      chapterId,
      groupId,
      userId,
      participationType
    );
    if (!validation.canApply) {
      return {
        success: false,
        reason: validation.reason || "신청할 수 없습니다.",
      };
    }

    const { data } = await apiClient.post<Membership>(
      `${API_BASE}/chapters/${chapterId}/groups/${groupId}/members`,
      {
        userId,
        participationType,
      } as ApplyGroupRequest,
      {
        headers: {
          "x-user-id": userId,
        },
      }
    );
    return { success: true, membership: data };
  } catch (error: any) {
    console.error("Failed to apply group:", error);
    const errorMessage = error.response?.data?.message;
    const errorMessages: string[] = Array.isArray(errorMessage) 
      ? errorMessage 
      : errorMessage 
        ? [errorMessage] 
        : [];
    return {
      success: false,
      reason: errorMessages[0] || error.response?.data?.error || "신청에 실패했습니다.",
    };
  }
}

// 참여 취소 (cancelApplication)
export async function cancelApplication(
  chapterId: string,
  groupId: string,
  membershipId: string,
  userId: string
): Promise<{ success: boolean }> {
  try {
    await apiClient.delete(
      `${API_BASE}/chapters/${chapterId}/groups/${groupId}/members/${membershipId}`,
      {
        headers: {
          "x-user-id": userId,
        },
      }
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel application:", error);
    return { success: false };
  }
}

// 참여자 목록 조회 (getApplicants - 리더용)
export interface GetMembershipsParams {
  page?: number;
  limit?: number;
  participationType?: ParticipationType;
  role?: MemberRole;
  activeOnly?: boolean;
}

export async function getMemberships(
  chapterId: string,
  groupId: string,
  params?: GetMembershipsParams
): Promise<PaginatedResponse<Membership>> {
  try {
    const response = await apiClient.get<PaginatedResponse<Membership> | Membership[]>(
      `${API_BASE}/chapters/${chapterId}/groups/${groupId}/members`,
      { params }
    );
    // 응답이 { data: [...], meta: {...} } 형식인지 확인
    if (response.data && typeof response.data === "object" && "data" in response.data && "meta" in response.data) {
      return response.data as PaginatedResponse<Membership>;
    }
    // 배열로 직접 반환되는 경우
    if (Array.isArray(response.data)) {
      const memberships = response.data as Membership[];
      return {
        data: memberships,
        meta: {
          total: memberships.length,
          page: params?.page || 1,
          limit: params?.limit || 20,
          totalPages: 1,
          hasNextPage: false,
        },
      };
    }
    // 기본값 반환
    return {
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
      },
    };
  } catch (error) {
    console.error("Failed to get memberships:", error);
    return {
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
      },
    };
  }
}

// 내 신청 목록 조회 (getMyApplications)
// api-docs: GET /chapters/:chapterId/applications/me는 Application 조회용
// Membership은 GET /chapters/:chapterId/groups/:groupId/members에서 필터링
// 더 효율적인 방법: 모든 recruiting groups의 memberships를 한 번에 조회하거나
// 백엔드에 "내 멤버십 목록" API가 있다면 사용
export async function getMyMemberships(
  chapterId: string,
  userId: string
): Promise<Membership[]> {
  try {
    // 모든 recruiting groups 조회
    const allGroups = await getRecruitingGroups(chapterId);
    const allMemberships: Membership[] = [];

    // 각 그룹의 멤버십 조회 (병렬 처리)
    const membershipPromises = allGroups.map((group) =>
      getMemberships(chapterId, group._id, {
        activeOnly: true,
      })
    );
    const membershipResults = await Promise.all(membershipPromises);

    // 현재 사용자의 멤버십만 필터링
    membershipResults.forEach((result) => {
      const userMemberships = result.data.filter(
        (m) =>
          (typeof m.user === "object" ? m.user._id : m.user) === userId &&
          !m.cancelledAt
      );
      allMemberships.push(...userMemberships);
    });

    return allMemberships;
  } catch (error) {
    console.error("Failed to get my memberships:", error);
    return [];
  }
}

// 리더 권한 확인
// NOTE: leader 필드는 현재 이름(string)으로 저장되어 있을 수 있음
// 실제 사용 시 백엔드에서 사용자 ID를 반환하도록 수정 필요
export function isGroupLeader(
  chapterGroup: ChapterGroup,
  userId: string
): boolean {
  // leader는 string (이름 또는 ID)일 수 있음
  // TODO: 백엔드에서 사용자 ID를 반환하도록 수정 필요
  // 현재는 이름으로 비교하거나, 백엔드 API에서 사용자 정보를 가져와서 비교해야 함
  const leaderValue = chapterGroup.leader;
  const subLeaderValue = chapterGroup.subLeader;
  
  // 간단한 비교 (이름 또는 ID)
  // 실제로는 백엔드에서 사용자 정보를 가져와서 비교해야 함
  return leaderValue === userId || subLeaderValue === userId;
}

// 선발 처리 (role 변경)
export interface SelectMemberRequest {
  membershipId: string;
  role: MemberRole; // "regular"로 선발, "observer"로 선발 취소
}

export async function selectMember(
  chapterId: string,
  groupId: string,
  membershipId: string,
  role: MemberRole,
  userId: string
): Promise<{ success: boolean; reason?: string }> {
  try {
    // TODO: API에 role 변경 엔드포인트가 필요함
    // 현재는 PATCH /chapters/:chapterId/groups/:groupId/members/:membershipId/role 같은 API가 필요
    // 임시로 성공 반환
    console.log("Select member:", { chapterId, groupId, membershipId, role });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to select member:", error);
    return {
      success: false,
      reason: error.response?.data?.message || "선발 처리에 실패했습니다.",
    };
  }
}

// 최종 등록 (finalizeRegistration)
export interface RegistrationDto {
  leaderOrientationAttended: boolean;
  subLeaderId?: string;
  allowNewHires: boolean;
}

export async function finalizeRegistration(
  chapterId: string,
  groupId: string,
  data: RegistrationDto,
  userId: string
): Promise<{ success: boolean; reason?: string }> {
  try {
    await apiClient.post(
      `${API_BASE}/chapters/${chapterId}/groups/${groupId}/registration`,
      data,
      {
        headers: {
          "x-user-id": userId,
        },
      }
    );
    return { success: true };
  } catch (error: any) {
    console.error("Failed to finalize registration:", error);
    return {
      success: false,
      reason: error.response?.data?.message || "최종 등록에 실패했습니다.",
    };
  }
}

// Admin API functions
export async function getAdminGroups(): Promise<Group[]> {
  const { data } = await apiClient.get<Group[]>("/study-somoim/admin/groups");
  return data;
}

export async function getGroupsByRecruitmentStatus(
  completed: boolean
): Promise<Group[]> {
  const { data } = await apiClient.get<Group[]>(
    `/study-somoim/admin/groups?recruitmentCompleted=${completed}`
  );
  return data;
}

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

export async function getChapters(): Promise<Chapter[]> {
  const { data } = await apiClient.get<Chapter[]>("/study-somoim/chapters");
  return data;
}

export async function getTeams(): Promise<TeamLookup[]> {
  const { data } = await apiClient.get<TeamLookup[]>(
    "/study-somoim/lookup/teams"
  );
  return data;
}

export async function createChapter(
  chapterData: CreateChapterDto
): Promise<Chapter> {
  const { data } = await apiClient.post<Chapter>(
    "/study-somoim/chapters",
    chapterData
  );
  return data;
}

export async function getChapterApplications(
  chapterId: string,
  params?: {
    page?: number;
    limit?: number;
    type?: GroupType;
    reviewStatus?: ReviewStatus;
    search?: string;
  }
): Promise<PaginatedResponse<ChapterGroup>> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.type) queryParams.append("type", params.type);
  if (params?.reviewStatus)
    queryParams.append("reviewStatus", params.reviewStatus);
  if (params?.search) queryParams.append("search", params.search);

  const { data } = await apiClient.get<PaginatedResponse<ChapterGroup>>(
    `/study-somoim/chapters/${chapterId}/applications?${queryParams.toString()}`
  );
  return data;
}

export async function createApplication(
  chapterId: string,
  body: CreateApplicationDto,
  userId: string
): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(
    `/study-somoim/chapters/${chapterId}/applications`,
    body,
    { headers: { "x-user-id": userId } }
  );
  return data;
}

export async function getChapterRegistrations(
  chapterId: string
): Promise<ChapterGroup[]> {
  const { data } = await apiClient.get<ChapterGroup[]>(
    `/study-somoim/chapters/${chapterId}/registrations`
  );
  return data;
}
