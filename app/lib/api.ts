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

/**
 * recruitment 확장 필드 (PRD, 목업용)
 * - category, scheduleDays, selectionPeriod, activityPeriod: 필터·상세·모달
 * - applyStatus: 신청가능/불가 필터
 * - isSelectionComplete: 취소 가능 여부
 */
export type ApplyStatus = "regular" | "guest" | "newcomer" | "auto" | "closed";

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
  // recruitment PRD (optional, mock/backend)
  category?: string;
  scheduleDays?: string[];
  selectionPeriod?: string;
  activityPeriod?: string;
  applyStatus?: ApplyStatus;
  isSelectionComplete?: boolean;
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
