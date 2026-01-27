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
    // 신청 가능 필터: applyAvailable이 설정되어 있고 "all"이 아니면 필터링
    if (f.applyAvailable && f.applyAvailable !== "all" && f.applyAvailable !== "") {
      if (g.applyStatus !== f.applyAvailable) return false;
    }
    
    // 신청 불가 필터: applyUnavailable이 설정되어 있고 "all"이 아니면 필터링
    if (f.applyUnavailable && f.applyUnavailable !== "all" && f.applyUnavailable !== "") {
      if (g.applyStatus !== f.applyUnavailable) return false;
    }
    
    // 요일 필터: 선택된 요일이 있으면 해당 요일이 포함된 그룹만 표시
    if (f.days.length > 0) {
      const days = (g.scheduleDays ?? []) as ScheduleDay[];
      // 그룹의 scheduleDays 중 하나라도 선택된 필터 요일과 일치하면 통과
      if (days.length === 0 || !days.some((d) => f.days.includes(d))) {
        return false;
      }
    }
    
    // 카테고리 필터: 선택된 카테고리가 있으면 해당 카테고리 그룹만 표시
    if (f.categories.length > 0) {
      if (!g.category || !f.categories.includes(g.category as Category))
        return false;
    }
    
    return true;
  });
}
