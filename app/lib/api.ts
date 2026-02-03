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

// Chapter types
export type ChapterPhase =
  | "upcoming"
  | "application"
  | "recruitment"
  | "active"
  | "completed";

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

// Chapter API functions
export async function getCurrentChapter(): Promise<Chapter | null> {
  const { data } = await apiClient.get<Chapter>("/study-somoim/chapters/current");
  return data;
}

// Activity types
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

// Activity API functions
export async function getChapterActivities(chapterId: string): Promise<Activity[]> {
  const { data } = await apiClient.get<Activity[]>(`/study-somoim/chapters/${chapterId}/activities`);
  return data;
}
