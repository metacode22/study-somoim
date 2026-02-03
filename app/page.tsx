"use client";

import { useQuery } from "@tanstack/react-query";
import * as Tabs from "@teamsparta/stack-tabs";
import { Button } from "@teamsparta/stack-button";
import { vars } from "@teamsparta/stack-tokens";
import Link from "next/link";
import { GroupCard } from "./components/GroupCard";
import { groupsQueryOptions } from "./lib/queries";

// 가짜 데이터: 스터디/소모임 현재 상태
const mockStatusData = {
  currentStage: "부원 모집",
  stages: [
    {
      name: "스터디/소모임 신청기간",
      status: "completed",
      dateRange: "2024.01.01 ~ 2024.01.15",
    },
    {
      name: "컬처팀 심사중",
      status: "completed",
      dateRange: "2024.01.16 ~ 2024.01.20",
    },
    {
      name: "부원 모집",
      status: "active",
      dateRange: "2024.01.21 ~ 2024.01.31",
    },
    {
      name: "부원 등록",
      status: "pending",
      dateRange: "2024.02.01 ~ 2024.02.05",
    },
    {
      name: "활동 시작",
      status: "pending",
      dateRange: "2024.02.06 ~",
    },
    {
      name: "chapter00 활동",
      status: "pending",
      dateRange: "예정",
    },
  ],
};

// 가짜 데이터: 월~금 한 주의 소모임/스터디 일정
const mockWeeklySchedule = [
  {
    dayLabel: "월",
    dayKey: "mon",
    activities: [
      { time: "19:00", name: "프론트엔드 소모임", type: "소모임", frequency: "격주", isNewcomerWelcome: true },
      { time: "20:30", name: "알고리즘 스터디", type: "스터디", frequency: "주1회" },
    ],
  },
  {
    dayLabel: "화",
    dayKey: "tue",
    activities: [
      { time: "20:00", name: "CS 스터디", type: "스터디", frequency: "주1회", isNewcomerWelcome: true },
    ],
  },
  {
    dayLabel: "수",
    dayKey: "wed",
    activities: [
      { time: "19:00", name: "백엔드 소모임", type: "소모임", frequency: "격주" },
      { time: "21:00", name: "리더십 스터디", type: "스터디", frequency: "주1회" },
    ],
  },
  {
    dayLabel: "목",
    dayKey: "thu",
    activities: [
      { time: "20:00", name: "영어 스터디", type: "스터디", frequency: "주1회" },
    ],
  },
  {
    dayLabel: "금",
    dayKey: "fri",
    activities: [
      { time: "17:30", name: "주간 회고 소모임", type: "소모임", frequency: "격주" },
      { time: "19:00", name: "사이드 프로젝트 스터디", type: "스터디", frequency: "주1회" },
    ],
  },
  {
    dayLabel: "일정 변동",
    dayKey: "flexible",
    activities: [
      { time: "18:30", name: "디자인 시스템 소모임", type: "소모임", frequency: "일정변동" },
      { time: "18:00", name: "데이터 소모임", type: "소모임", frequency: "일정변동" },
      { time: "19:30", name: "게임 소모임", type: "소모임", frequency: "일정변동" },
    ],
  },
];

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
        {/* Notice Banner */}
        <div
          style={{
            backgroundColor: vars.background.subtle,
            borderRadius: "8px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                color: vars.text.primary,
              }}
            >
              공지사항 - 한다원
            </h2>
            <div
              style={{
                padding: "6px 12px",
                backgroundColor: `${vars.status.processing.default}15`,
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 600,
                color: vars.status.processing.default,
              }}
            >
              현재: {mockStatusData.currentStage}
            </div>
          </div>

          {/* 상태 타임라인 */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "8px",
            }}
          >
            {mockStatusData.stages.map((stage, index) => (
              <div
                key={index}
                style={{
                  width: "160px",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  position: "relative",
                }}
              >
                {/* 연결선 */}
                {index < mockStatusData.stages.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "100%",
                      width: "12px",
                      height: "2px",
                      backgroundColor:
                        stage.status === "completed"
                          ? vars.status.success.default
                          : vars.line.nonClickable,
                      zIndex: 0,
                    }}
                  />
                )}
                {/* 단계 카드 */}
                <div
                  style={{
                    width: "100%",
                    height: "100px",
                    backgroundColor:
                      stage.status === "active"
                        ? `${vars.status.processing.default}15`
                        : stage.status === "completed"
                        ? `${vars.status.success.default}15`
                        : vars.background.default,
                    border: `2px solid ${
                      stage.status === "active"
                        ? vars.status.processing.default
                        : stage.status === "completed"
                        ? vars.status.success.default
                        : vars.line.nonClickable
                    }`,
                    borderRadius: "8px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    position: "relative",
                    zIndex: 1,
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      minHeight: "20px",
                      flex: 1,
                    }}
                  >
                    {stage.status === "completed" && (
                      <span style={{ fontSize: "16px" }}>✓</span>
                    )}
                    {stage.status === "active" && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: vars.status.processing.default,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color:
                          stage.status === "active"
                            ? vars.status.processing.default
                            : stage.status === "completed"
                            ? vars.status.success.default
                            : vars.text.secondary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {stage.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: vars.text.tertiary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      minHeight: "16px",
                      display: "block",
                    }}
                  >
                    {stage.dateRange}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 주간 소/스 캘린더 (가짜 데이터 기반) */}
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
              alignItems: "baseline",
              justifyContent: "space-between",
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
                이번 주 소/스 캘린더
              </h2>
              <span
                style={{
                  fontSize: "14px",
                  color: vars.text.tertiary,
                  fontWeight: 500,
                }}
              >
                요일·시간별 활동 한눈에 보기
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(160px, 1fr))",
              gap: "16px",
              overflowX: "auto",
              paddingBottom: "8px",
            }}
          >
            {mockWeeklySchedule.map((day) => (
              <div
                key={day.dayKey}
                style={{
                  backgroundColor: vars.background.subtle,
                  borderRadius: "12px",
                  border: `1px solid ${
                    day.dayKey === "flexible"
                      ? vars.line.clickable
                      : vars.line.nonClickable
                  }`,
                  padding: "16px",
                  minWidth: "160px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  ...(day.dayKey === "flexible" && {
                    borderStyle: "dashed",
                  }),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: vars.text.primary,
                    }}
                  >
                    {day.dayLabel}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: vars.text.quaternary,
                    }}
                  >
                    {day.activities.length}개 활동
                  </span>
                </div>

                <div
                  style={{
                    height: "1px",
                    backgroundColor: vars.line.nonClickable,
                    width: "100%",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {day.activities.map((activity, index) => (
                    <div
                      key={`${day.dayKey}-${index}`}
                      style={{
                        position: "relative",
                        padding: "12px 10px 8px 10px",
                        paddingTop: activity.isNewcomerWelcome ? "42px" : "20px",
                        borderRadius: "8px",
                        backgroundColor:
                          activity.type === "소모임"
                            ? "#FFEBEE" // 연한 빨간색
                            : "#E3F2FD", // 하늘색
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {/* 신규입사자 환영 라벨 */}
                      {activity.isNewcomerWelcome && (
                        <div
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "8px",
                            backgroundColor: "#FFF3E0",
                            border: `1px solid #FFB74D`,
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "#E65100",
                            whiteSpace: "nowrap",
                            zIndex: 2,
                          }}
                        >
                          신규입사자 환영
                        </div>
                      )}
                      {/* 주기 라벨 */}
                      <div
                        style={{
                          position: "absolute",
                          top: activity.isNewcomerWelcome ? "30px" : "6px",
                          right: "8px",
                          backgroundColor: vars.background.default,
                          border: `1px solid ${vars.line.clickable}`,
                          borderRadius: "4px",
                          padding: "2px 6px",
                          fontSize: "10px",
                          fontWeight: 600,
                          color: vars.text.secondary,
                          whiteSpace: "nowrap",
                          zIndex: 1,
                        }}
                      >
                        {activity.frequency}
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: vars.text.secondary,
                        }}
                      >
                        {activity.time}
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: vars.text.primary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {activity.name}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color:
                            activity.type === "소모임"
                              ? vars.text.secondary
                              : vars.text.tertiary,
                        }}
                      >
                        {activity.type}
                      </span>
                    </div>
                  ))}

                  {day.activities.length === 0 && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: vars.text.tertiary,
                      }}
                    >
                      등록된 활동이 없습니다
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <Tabs.List>
              <Tabs.Trigger value="somoim">소모임</Tabs.Trigger>
              <Tabs.Trigger value="study">스터디</Tabs.Trigger>
            </Tabs.List>
            <Link href="/create">
              <Button variant="solid" colorScheme="primary" size="md">
                새 소모임/스터디 개설하기
              </Button>
            </Link>
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
