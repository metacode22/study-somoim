import type { Group } from "./api";
import {
  CATEGORIES,
  SCHEDULE_DAYS,
  type Application,
  type ScheduleDay,
} from "./recruitment";

/** getGroups() 결과에 recruitment 확장 필드를 채움 (없을 때만) */
export function getGroupsWithMockFields(groups: Group[]): Group[] {
  return groups.map((g, i) => {
    const scheduleDays: string[] =
      g.scheduleDays?.length ? g.scheduleDays : [SCHEDULE_DAYS[i % SCHEDULE_DAYS.length]];
    const category = g.category ?? CATEGORIES[i % CATEGORIES.length];
    const applyStatus = g.applyStatus ?? (i % 4 === 0 ? "closed" : i % 4 === 1 ? "auto" : "regular");
    return {
      ...g,
      category,
      scheduleDays,
      selectionPeriod: g.selectionPeriod ?? "2025.01.06 ~ 2025.01.10",
      activityPeriod: g.activityPeriod ?? "2025.01.13 ~ 2025.03.07",
      applyStatus,
      isSelectionComplete: g.isSelectionComplete ?? applyStatus === "closed",
    };
  });
}

export const mockMyApplications: Application[] = [
  {
    id: "app-1",
    groupId: "g1",
    groupName: "독서 모임",
    scheduleDays: ["월"] as ScheduleDay[],
    selectionPeriod: "2025.01.06 ~ 2025.01.10",
    activityPeriod: "2025.01.13 ~ 2025.03.07",
    appliedAs: "regular",
    isSelectionComplete: false,
  },
  {
    id: "app-2",
    groupId: "g2",
    groupName: "프론트엔드 스터디",
    scheduleDays: ["수", "금"] as ScheduleDay[],
    selectionPeriod: "2025.01.06 ~ 2025.01.10",
    activityPeriod: "2025.01.13 ~ 2025.03.07",
    appliedAs: "guest",
    isSelectionComplete: true,
  },
  {
    id: "app-3",
    groupId: "g3",
    groupName: "요가 소모임",
    scheduleDays: ["주말"] as ScheduleDay[],
    selectionPeriod: "2025.01.06 ~ 2025.01.10",
    activityPeriod: "2025.01.13 ~ 2025.03.07",
    appliedAs: "regular",
    isSelectionComplete: false,
  },
];

export function getMyApplications(): Promise<Application[]> {
  return Promise.resolve([...mockMyApplications]);
}

/** 목업: 정규/순참 신청. 3번째 호출부터 실패 시뮬레이션 가능 (고정: 성공) */
export function applyGroup(
  _groupId: string,
  _type: "regular" | "guest"
): Promise<{ success: boolean }> {
  return Promise.resolve({ success: true });
}

/** 목업: 신청 취소 */
export function cancelApplication(_applicationId: string): Promise<void> {
  return Promise.resolve();
}
