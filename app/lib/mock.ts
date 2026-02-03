import type { Group, Chapter, Membership } from "./api";
import {
  CATEGORIES,
  SCHEDULE_DAYS,
  type Application,
  type ScheduleDay,
} from "./recruitment";
import { formatChapterPeriods } from "./api";

/** schedule 문자열에서 요일을 추출 */
function parseScheduleDays(schedule?: string): ScheduleDay[] {
  if (!schedule) return ["비정기"];
  
  const scheduleLower = schedule.toLowerCase();
  const days: ScheduleDay[] = [];
  
  // 요일 매핑
  if (schedule.includes("월") || scheduleLower.includes("monday") || scheduleLower.includes("월요일")) {
    days.push("월");
  }
  if (schedule.includes("화") || scheduleLower.includes("tuesday") || scheduleLower.includes("화요일")) {
    days.push("화");
  }
  if (schedule.includes("수") || scheduleLower.includes("wednesday") || scheduleLower.includes("수요일")) {
    days.push("수");
  }
  if (schedule.includes("목") || scheduleLower.includes("thursday") || scheduleLower.includes("목요일")) {
    days.push("목");
  }
  if (schedule.includes("금") || scheduleLower.includes("friday") || scheduleLower.includes("금요일")) {
    days.push("금");
  }
  if (schedule.includes("주말") || scheduleLower.includes("weekend") || schedule.includes("토") || schedule.includes("일")) {
    days.push("주말");
  }
  
  // 요일이 없으면 비정기
  return days.length > 0 ? days : ["비정기"];
}

/** getGroups() 결과에 recruitment 확장 필드를 채움 (없을 때만) */
export function getGroupsWithMockFields(
  groups: Group[],
  chapter?: Chapter
): Group[] {
  const periods = chapter ? formatChapterPeriods(chapter) : null;

  return groups.map((g, i) => {
    // scheduleDays가 이미 있으면 사용, 없으면 schedule 문자열에서 파싱
    const scheduleDays: ScheduleDay[] = g.scheduleDays?.length 
      ? (g.scheduleDays as ScheduleDay[])
      : parseScheduleDays(g.schedule);
    
    const category = g.category ?? CATEGORIES[i % CATEGORIES.length];
    const applyStatus = g.applyStatus ?? (i % 4 === 0 ? "closed" : i % 4 === 1 ? "auto" : "regular");
    return {
      ...g,
      category,
      scheduleDays,
      selectionPeriod: g.selectionPeriod ?? periods?.selectionPeriod ?? "2025.01.06 ~ 2025.01.10",
      activityPeriod: g.activityPeriod ?? periods?.activityPeriod ?? "2025.01.13 ~ 2025.03.07",
      applyStatus,
      isSelectionComplete: g.isSelectionComplete ?? applyStatus === "closed",
    };
  });
}

/** Membership을 Application 형태로 변환 */
export function membershipToApplication(
  membership: Membership,
  chapter?: Chapter
): Application {
  const group = typeof membership.chapterGroup === "object" 
    ? (membership.chapterGroup as any)?.group 
    : null;
  const periods = chapter ? formatChapterPeriods(chapter) : null;
  
  // scheduleDays는 meetingSchedule에서 파싱하거나 기본값
  const scheduleDays: ScheduleDay[] = group?.scheduleDays || ["비정기"];

  return {
    id: membership._id,
    groupId: typeof membership.chapterGroup === "object" 
      ? (membership.chapterGroup as any)?._id 
      : membership.chapterGroup,
    groupName: group?.name || "알 수 없음",
    scheduleDays,
    selectionPeriod: periods?.selectionPeriod || "2025.01.06 ~ 2025.01.10",
    activityPeriod: periods?.activityPeriod || "2025.01.13 ~ 2025.03.07",
    appliedAs: membership.participationType === "regular" ? "regular" : "guest",
    isSelectionComplete: membership.role !== "regular" && membership.role !== "observer", // 리더/부리더가 아니면 선발 완료로 간주
  };
}
