"use client";

import * as Select from "@teamsparta/stack-select";
import { ChipButton, ChipGroup } from "@teamsparta/stack-chip";
import {
  CATEGORIES,
  SCHEDULE_DAYS,
  type RecruitmentFiltersState,
  type ScheduleDay,
  type Category,
} from "../lib/recruitment";
import { vars } from "@teamsparta/stack-tokens";

const APPLY_AVAILABLE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "전체" },
  { value: "regular", label: "정규 인원" },
  { value: "guest", label: "순참 인원" },
  { value: "newcomer", label: "신규 입사자 중간 합류" },
];

const APPLY_UNAVAILABLE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "전체" },
  { value: "auto", label: "자동 선발" },
  { value: "closed", label: "선발 완료" },
];

export interface RecruitmentFiltersProps {
  filters: RecruitmentFiltersState;
  onFiltersChange: (f: RecruitmentFiltersState) => void;
}

export function RecruitmentFilters({
  filters,
  onFiltersChange,
}: RecruitmentFiltersProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* 신청 가능 / 신청 불가 Select */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        <Select.Root
          value={filters.applyAvailable || ""}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, applyAvailable: v || "all" })
          }
        >
          <Select.Trigger style={{ minWidth: "180px" }}>
            <Select.Value placeholder="신청 가능" />
          </Select.Trigger>
          <Select.Content>
            {APPLY_AVAILABLE_OPTIONS.map((o) => (
              <Select.Item key={o.value || "all"} value={o.value || "all"}>
                <Select.ItemText>{o.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Select.Root
          value={filters.applyUnavailable || ""}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, applyUnavailable: v || "all" })
          }
        >
          <Select.Trigger style={{ minWidth: "180px" }}>
            <Select.Value placeholder="신청 불가" />
          </Select.Trigger>
          <Select.Content>
            {APPLY_UNAVAILABLE_OPTIONS.map((o) => (
              <Select.Item key={o.value || "all"} value={o.value || "all"}>
                <Select.ItemText>{o.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </div>

      {/* 요일 Chip (중복 선택) */}
      <div>
        <span
          style={{
            display: "block",
            fontSize: "13px",
            color: vars.text.tertiary,
            marginBottom: "6px",
          }}
        >
          요일
        </span>
        <ChipGroup
          multiple
          value={filters.days}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, days: v as ScheduleDay[] })
          }
        >
          {SCHEDULE_DAYS.map((d) => (
            <ChipButton key={d} value={d} variant="line">
              {d}
            </ChipButton>
          ))}
        </ChipGroup>
      </div>

      {/* 카테고리 Chip (중복 선택) */}
      <div>
        <span
          style={{
            display: "block",
            fontSize: "13px",
            color: vars.text.tertiary,
            marginBottom: "6px",
          }}
        >
          카테고리
        </span>
        <ChipGroup
          multiple
          value={filters.categories}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, categories: v as Category[] })
          }
        >
          {CATEGORIES.map((c) => (
            <ChipButton key={c} value={c} variant="line">
              {c}
            </ChipButton>
          ))}
        </ChipGroup>
      </div>
    </div>
  );
}
