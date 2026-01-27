import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
  const { data } = await apiClient.post<Chapter>(
    "/study-somoim/chapters",
    chapterData
  );
  return data;
}
