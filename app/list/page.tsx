"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Tabs from "@teamsparta/stack-tabs";
import { Button } from "@teamsparta/stack-button";
import { vars } from "@teamsparta/stack-tokens";
import Link from "next/link";
import { GroupCard } from "../components/GroupCard";
import { RecruitmentFilters } from "../components/RecruitmentFilters";
import {
  groupsQueryOptions,
  currentChapterQueryOptions,
  recruitingGroupsQueryOptions,
} from "../lib/queries";
import { getGroupsWithMockFields } from "../lib/mock";
import {
  applyRecruitmentFilters,
  type RecruitmentFiltersState,
} from "../lib/recruitment";
import type { Group, ChapterGroup } from "../lib/api";

const defaultFilters: RecruitmentFiltersState = {
  applyAvailable: "all",
  applyUnavailable: "all",
  days: [],
  categories: [],
};

export default function ListPage() {
  // 현재 챕터 조회
  const {
    data: currentChapter,
    isLoading: isChapterLoading,
    error: chapterError,
  } = useQuery(currentChapterQueryOptions);

  // 챕터가 있으면 recruiting groups 사용, 없으면 레거시 groups 사용
  const recruitingGroupsQuery = recruitingGroupsQueryOptions(
    currentChapter?._id || ""
  );
  const {
    data: recruitingGroups,
    isLoading: isRecruitingLoading,
    error: recruitingError,
  } = useQuery({
    ...recruitingGroupsQuery,
    enabled: !!currentChapter?._id,
  });
  const {
    data: legacyGroups,
    isLoading: isLegacyLoading,
    error: legacyError,
  } = useQuery({
    ...groupsQueryOptions,
    enabled: !currentChapter?._id,
  });

  const [filters, setFilters] = useState<RecruitmentFiltersState>(defaultFilters);

  const isLoading = isChapterLoading || isRecruitingLoading || isLegacyLoading;
  const error = chapterError || recruitingError || legacyError;

  const groups = useMemo((): Group[] => {
    if (
      recruitingGroups &&
      Array.isArray(recruitingGroups) &&
      recruitingGroups.length > 0
    ) {
      return recruitingGroups.map((cg: ChapterGroup) => {
        const group = typeof cg.group === "object" ? cg.group : null;
        return {
          _id: cg._id,
          name: group?.name || cg._id,
          leader: cg.leader,
          team: cg.team,
          type: cg.type,
          description: group?.description,
          schedule: cg.meetingSchedule,
          location: cg.meetingLocation,
          hasLeaderExperience: cg.leaderOrientationAttended,
          category: group?.category,
          isActive: group?.isActive ?? true,
          createdAt: cg.createdAt,
          updatedAt: cg.updatedAt,
        } as Group;
      });
    }
    if (
      legacyGroups &&
      Array.isArray(legacyGroups) &&
      legacyGroups.length > 0
    ) {
      return legacyGroups;
    }
    return [];
  }, [recruitingGroups, legacyGroups]);

  const withMock = useMemo(
    () =>
      groups
        ? getGroupsWithMockFields(groups, currentChapter || undefined)
        : [],
    [groups, currentChapter]
  );
  const somoimRaw = useMemo(
    () => withMock.filter((g) => g.type === "somoim"),
    [withMock]
  );
  const studyRaw = useMemo(
    () =>
      withMock.filter(
        (g) => g.type === "study_team" || g.type === "study_company"
      ),
    [withMock]
  );
  const somoim = useMemo(
    () => applyRecruitmentFilters(somoimRaw, filters),
    [somoimRaw, filters]
  );
  const study = useMemo(
    () => applyRecruitmentFilters(studyRaw, filters),
    [studyRaw, filters]
  );

  const now = new Date();
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  );
  const newGroups =
    groups?.filter((group) => {
      const createdAt = new Date(group.createdAt);
      return createdAt >= sevenDaysAgo;
    }).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).slice(0, 5) ?? [];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: vars.background.default,
      }}
    >
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "60px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}
      >
        <RecruitmentFilters filters={filters} onFiltersChange={setFilters} />

        {newGroups.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: vars.text.primary,
                }}
              >
                신생 소/스
              </h2>
              <span
                style={{
                  fontSize: "14px",
                  color: vars.text.tertiary,
                  fontWeight: 500,
                }}
              >
                최근 7일 이내 신규 개설
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                overflowX: "auto",
                paddingBottom: "8px",
                scrollbarWidth: "thin",
              }}
            >
              {newGroups.map((group) => (
                <div
                  key={group._id}
                  style={{
                    minWidth: "320px",
                    flexShrink: 0,
                  }}
                >
                  <GroupCard group={group} />
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs.Root defaultValue="somoim" colorScheme="secondary">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <Tabs.List>
              <Tabs.Trigger value="somoim">소모임</Tabs.Trigger>
              <Tabs.Trigger value="study">스터디</Tabs.Trigger>
            </Tabs.List>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link href="/create">
                <Button variant="solid" colorScheme="primary" size="md">
                  새 소모임/스터디 개설하기
                </Button>
              </Link>
            </div>
          </div>

          <Tabs.Content value="somoim">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "24px",
                paddingTop: "24px",
              }}
            >
              {isLoading && <LoadingState />}
              {error && (
                <ErrorState message="소모임을 불러오는데 실패했습니다" />
              )}
              {!isLoading && !error && somoim.length === 0 && (
                <EmptyState message="등록된 소모임이 없습니다" />
              )}
              {somoim.map((group) => (
                <GroupCard key={group._id} group={group} />
              ))}
            </div>
          </Tabs.Content>

          <Tabs.Content value="study">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "24px",
                paddingTop: "24px",
              }}
            >
              {isLoading && <LoadingState />}
              {error && (
                <ErrorState message="스터디를 불러오는데 실패했습니다" />
              )}
              {!isLoading && !error && study.length === 0 && (
                <EmptyState message="등록된 스터디가 없습니다" />
              )}
              {study.map((group) => (
                <GroupCard key={group._id} group={group} />
              ))}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
        color: vars.text.tertiary,
      }}
    >
      로딩 중...
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
        color: vars.status.error.default,
      }}
    >
      {message}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
        color: vars.text.tertiary,
      }}
    >
      {message}
    </div>
  );
}
