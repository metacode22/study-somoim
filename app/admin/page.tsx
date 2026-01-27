"use client";

import { useQuery } from "@tanstack/react-query";
import * as Tabs from "@teamsparta/stack-tabs";
import { vars } from "@teamsparta/stack-tokens";
import { adminGroupsQueryOptions } from "../lib/queries";
import type { Group } from "../lib/api";

export default function AdminPage() {
  const { data: groups, isLoading, error } = useQuery(adminGroupsQueryOptions);

  // 신청한 그룹들 (모든 그룹)
  const allGroups = groups ?? [];

  // 부원모집 완료한 그룹들
  const recruitmentCompletedGroups =
    groups?.filter((group) => group.recruitmentCompleted === true) ?? [];

  // 부원모집 진행 중인 그룹들
  const recruitmentPendingGroups =
    groups?.filter(
      (group) => group.recruitmentCompleted === false || group.recruitmentCompleted === undefined
    ) ?? [];

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
        {/* Header */}
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
              color: vars.text.primary,
              marginBottom: "8px",
            }}
          >
            관리자 페이지
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "15px",
              color: vars.text.tertiary,
            }}
          >
            스터디 소모임 신청 현황과 부원모집 완료 현황을 확인할 수 있습니다.
          </p>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
          }}
        >
          <StatCard
            title="전체 신청"
            value={allGroups.length}
            color={vars.text.primary}
          />
          <StatCard
            title="부원모집 완료"
            value={recruitmentCompletedGroups.length}
            color={vars.status.success.default}
          />
          <StatCard
            title="부원모집 진행 중"
            value={recruitmentPendingGroups.length}
            color={vars.status.processing.default}
          />
        </div>

        {/* Tabs Section */}
        <Tabs.Root defaultValue="all" colorScheme="secondary">
          <Tabs.List>
            <Tabs.Trigger value="all">
              전체 신청 ({allGroups.length})
            </Tabs.Trigger>
            <Tabs.Trigger value="completed">
              부원모집 완료 ({recruitmentCompletedGroups.length})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="all">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                paddingTop: "24px",
              }}
            >
              {isLoading && <LoadingState />}
              {error && (
                <ErrorState message="데이터를 불러오는데 실패했습니다" />
              )}
              {!isLoading && !error && allGroups.length === 0 && (
                <EmptyState message="신청된 스터디 소모임이 없습니다" />
              )}
              {!isLoading &&
                !error &&
                allGroups.map((group) => (
                  <AdminGroupCard key={group._id} group={group} />
                ))}
            </div>
          </Tabs.Content>

          <Tabs.Content value="completed">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                paddingTop: "24px",
              }}
            >
              {isLoading && <LoadingState />}
              {error && (
                <ErrorState message="데이터를 불러오는데 실패했습니다" />
              )}
              {!isLoading &&
                !error &&
                recruitmentCompletedGroups.length === 0 && (
                  <EmptyState message="부원모집을 완료한 스터디 소모임이 없습니다" />
                )}
              {!isLoading &&
                !error &&
                recruitmentCompletedGroups.map((group) => (
                  <AdminGroupCard key={group._id} group={group} />
                ))}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        backgroundColor: vars.background.subtle,
        border: `1px solid ${vars.line.clickable}`,
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <span
        style={{
          fontSize: "14px",
          color: vars.text.tertiary,
          fontWeight: 500,
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: "32px",
          fontWeight: 700,
          color: color,
          lineHeight: "40px",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function AdminGroupCard({ group }: { group: Group }) {
  const {
    name,
    type,
    leader,
    team,
    description,
    schedule,
    location,
    createdAt,
    recruitmentCompleted,
    memberCount,
    maxMembers,
  } = group;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div
      style={{
        backgroundColor: vars.background.subtle,
        border: `1px solid ${vars.line.clickable}`,
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                color: vars.text.primary,
              }}
            >
              {name}
            </h3>
            <span
              style={{
                fontSize: "12px",
                padding: "4px 8px",
                backgroundColor: vars.background.default,
                borderRadius: "4px",
                color: vars.text.secondary,
                fontWeight: 500,
              }}
            >
              {type}
            </span>
            {recruitmentCompleted && (
              <span
                style={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  backgroundColor: vars.status.success.subtle,
                  borderRadius: "4px",
                  color: vars.status.success.default,
                  fontWeight: 500,
                }}
              >
                모집 완료
              </span>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: vars.text.tertiary,
              lineHeight: "20px",
            }}
          >
            {description || "설명이 없습니다"}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          backgroundColor: vars.line.nonClickable,
          width: "100%",
        }}
      />

      {/* Info Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        <InfoRow label="리더" value={leader} />
        {team && <InfoRow label="팀" value={team} />}
        {schedule && <InfoRow label="일정" value={schedule} />}
        {location && <InfoRow label="장소" value={location} />}
        <InfoRow label="신청일" value={formatDate(createdAt)} />
        {memberCount !== undefined && maxMembers !== undefined && (
          <InfoRow
            label="인원"
            value={`${memberCount} / ${maxMembers}명`}
          />
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <span
        style={{
          fontSize: "12px",
          color: vars.text.tertiary,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "14px",
          color: vars.text.secondary,
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
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
