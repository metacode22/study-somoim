import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Group type for list display (Korean)
export type GroupType =
  | "소모임"
  | "스터디(팀/파트/스쿼드 대상)"
  | "스터디(전사 구성원 대상)";

// Application API GroupType (backend enum)
export type ApplicationGroupType =
  | "study_company"
  | "study_team"
  | "somoim";

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
}

// Chapter (current phase for application)
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
  createdAt?: string;
  updatedAt?: string;
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
export async function getGroups(): Promise<Group[]> {
  const { data } = await apiClient.get<Group[]>("/study-somoim/groups");
  return data;
}

export async function getGroupById(id: string): Promise<Group | null> {
  const { data } = await apiClient.get<Group | null>(`/groups/${id}`);
  return data;
}

export async function getCurrentChapter(): Promise<Chapter | null> {
  const { data } = await apiClient.get<Chapter | null>(
    "/study-somoim/chapters/current"
  );
  return data;
}

export async function getTeams(): Promise<TeamLookup[]> {
  const { data } = await apiClient.get<TeamLookup[]>(
    "/study-somoim/lookup/teams"
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
