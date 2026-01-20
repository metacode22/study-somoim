/**
 * recruitment PRD 기반 상수 및 타입
 * @see docs/prd/recruitment.md
 */

// --- 상수 (PRD 기준) ---

export const CATEGORIES = [
  "팀 / 파트 / 스쿼드",
  "운동",
  "AI",
  "자기계발",
  "취미",
  "문화",
  "기타",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const SCHEDULE_DAYS = [
  "월",
  "화",
  "수",
  "목",
  "금",
  "주말",
  "비정기",
] as const;
export type ScheduleDay = (typeof SCHEDULE_DAYS)[number];

export const APPLY_STATUS_AVAILABLE = [
  "정규 인원",
  "순참 인원",
  "신규 입사자 중간 합류",
] as const;
export const APPLY_STATUS_AVAILABLE_VALUES = ["regular", "guest", "newcomer"] as const;

export const APPLY_STATUS_UNAVAILABLE = ["자동 선발", "선발 완료"] as const;
export const APPLY_STATUS_UNAVAILABLE_VALUES = ["auto", "closed"] as const;

export type ApplyStatusFilter =
  | "regular"
  | "guest"
  | "newcomer"
  | "auto"
  | "closed";

// --- Application (내 신청용) ---

export interface Application {
  id: string;
  groupId: string;
  groupName: string;
  scheduleDays: ScheduleDay[];
  selectionPeriod: string;
  activityPeriod: string;
  appliedAs: "regular" | "guest";
  isSelectionComplete: boolean;
}

// --- 필터 상태 ---

export interface RecruitmentFiltersState {
  applyAvailable?: string; // 'all' | 'regular' | 'guest' | 'newcomer'
  applyUnavailable?: string; // 'all' | 'auto' | 'closed'
  days: ScheduleDay[];
  categories: Category[];
}

// --- 필터링 로직 (홈에서 사용) ---

export function applyRecruitmentFilters<T extends {
  applyStatus?: string;
  scheduleDays?: string[];
  category?: string;
}>(
  groups: T[],
  f: RecruitmentFiltersState
): T[] {
  return groups.filter((g) => {
    if (f.applyAvailable && f.applyAvailable !== "all") {
      if (g.applyStatus !== f.applyAvailable) return false;
    }
    if (f.applyUnavailable && f.applyUnavailable !== "all") {
      if (g.applyStatus !== f.applyUnavailable) return false;
    }
    if (f.days.length > 0) {
      const days = g.scheduleDays ?? [];
      if (!days.some((d) => f.days.includes(d))) return false;
    }
    if (f.categories.length > 0) {
      if (!g.category || !f.categories.includes(g.category as Category))
        return false;
    }
    return true;
  });
}
