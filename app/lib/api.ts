import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/backend",
  headers: {
    "Content-Type": "application/json",
  },
});

// Group type from backend
export type GroupType =
  | "소모임"
  | "스터디(팀/파트/스쿼드 대상)"
  | "스터디(전사 구성원 대상)";

export interface Group {
  _id: string;
  leader: string;
  team?: string;
  type: GroupType;
  name: string;
  description?: string;
  schedule?: string;
  hasLeaderExperience?: boolean;
  location?: string;
  createdAt: string;
  updatedAt: string;
  status?: "pending" | "approved" | "rejected";
  recruitmentCompleted?: boolean;
  memberCount?: number;
  maxMembers?: number;
}

// API functions
export async function getGroups(): Promise<Group[]> {
  const { data } = await apiClient.get<Group[]>("/study-somoim/groups");
  return data;
}

export async function getGroupById(id: string): Promise<Group | null> {
  const { data } = await apiClient.get<Group | null>(`/groups/${id}`);
  return data;
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

// Chapter types and API
export type ChapterPhase =
  | "upcoming"
  | "application"
  | "recruitment"
  | "active"
  | "completed";

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

export interface CreateChapterDto {
  name: string;
  sequence?: number;
  periods: {
    applicationStart: string; // ISO date string
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

export async function getCurrentChapter(): Promise<Chapter | null> {
  const { data } = await apiClient.get<Chapter | null>(
    "/study-somoim/chapters/current"
  );
  return data;
}

export async function createChapter(
  chapterData: CreateChapterDto
): Promise<Chapter> {
  // 디버깅: 요청 데이터 확인
  console.log("API Request URL:", "/study-somoim/chapters");
  console.log("API Request Data:", JSON.stringify(chapterData, null, 2));
  
  try {
    const { data } = await apiClient.post<Chapter>(
      "/study-somoim/chapters",
      chapterData
    );
    return data;
  } catch (error: any) {
    // 에러 상세 정보 로깅
    console.error("Chapter creation error details:", {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      message: error?.message,
    });
    throw error;
  }
}

// ChapterGroup types
export type ReviewStatus = "pending" | "approved" | "rejected" | "auto_extended";

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
  status: "rejected" | "pending" | "approved" | "registered";
  isRegistered: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  groupName?: string;
  leaderName?: string;
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

// Chapter-specific API functions
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

export async function getChapterRegistrations(
  chapterId: string
): Promise<ChapterGroup[]> {
  const { data } = await apiClient.get<ChapterGroup[]>(
    `/study-somoim/chapters/${chapterId}/registrations`
  );
  return data;
}
