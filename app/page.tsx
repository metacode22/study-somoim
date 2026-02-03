"use client";

import { useQuery } from "@tanstack/react-query";
import * as Tabs from "@teamsparta/stack-tabs";
import { vars } from "@teamsparta/stack-tokens";
import { GroupCard } from "./components/GroupCard";
import { groupsQueryOptions } from "./lib/queries";

export default function Home() {
  const { data: groups, isLoading, error } = useQuery(groupsQueryOptions);

  const somoim = groups?.filter((group) => group.type === "소모임") ?? [];
  const study = groups?.filter((group) =>
    group.type === "스터디(팀/파트/스쿼드 대상)" ||
    group.type === "스터디(전사 구성원 대상)"
  ) ?? [];

  // 신생 소/스: 최근 7일 이내에 생성된 그룹들 (실제 데이터 기반)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newGroups = groups?.filter((group) => {
    const createdAt = new Date(group.createdAt);
    return createdAt >= sevenDaysAgo;
  }).sort((a, b) => {
    // 최신순으로 정렬
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, 5) ?? []; // 최대 5개만 표시

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
        {/* 신생 소/스 Section */}
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

        {/* Tabs Section */}
        <Tabs.Root defaultValue="somoim" colorScheme="secondary">
          <Tabs.List>
            <Tabs.Trigger value="somoim">소모임</Tabs.Trigger>
            <Tabs.Trigger value="study">스터디</Tabs.Trigger>
          </Tabs.List>

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
