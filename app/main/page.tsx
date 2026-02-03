"use client";

import { useQuery } from "@tanstack/react-query";
import { vars } from "@teamsparta/stack-tokens";
import { currentChapterQueryOptions, chapterActivitiesQueryOptions } from "../lib/queries";
import type { ChapterPeriods, ChapterPhase } from "../lib/api";

// 날짜 포맷팅 유틸리티 함수
function formatDateRange(startDate: string, endDate: string): string {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };
  return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
}

// 현재 단계 계산 함수
function getCurrentPhase(periods: ChapterPeriods): ChapterPhase {
  const now = new Date();
  const applicationStart = new Date(periods.applicationStart);
  const applicationEnd = new Date(periods.applicationEnd);
  const recruitmentEnd = new Date(periods.recruitmentEnd);
  const activityEnd = new Date(periods.activityEnd);

  if (now < applicationStart) return "upcoming";
  if (now <= applicationEnd) return "application";
  if (now <= recruitmentEnd) return "recruitment";
  if (now <= activityEnd) return "active";
  return "completed";
}

// 단계 상태 계산 함수
function getStageStatus(
  startDate: string,
  endDate: string
): "completed" | "active" | "pending" {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return "pending";
  if (now > end) return "completed";
  return "active";
}

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

export default function MainPage() {
  const { data: currentChapter } = useQuery(currentChapterQueryOptions);
  const { data: activities } = useQuery(
    currentChapter?._id
      ? chapterActivitiesQueryOptions(currentChapter._id)
      : { queryKey: ["activities", "disabled"], queryFn: async () => [] }
  );

  // MVP 소스 리스트 계산: 그룹별 활동 기록 수 집계
  const mvpGroups = activities
    ? (() => {
        const groupCounts = new Map<string, number>();
        activities.forEach((activity) => {
          const groupName = activity.groupName;
          groupCounts.set(groupName, (groupCounts.get(groupName) || 0) + 1);
        });

        return Array.from(groupCounts.entries())
          .map(([groupName, count]) => ({ groupName, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
      })()
    : [];

  // 공지사항 데이터 생성
  const statusData = currentChapter
    ? (() => {
        const { periods } = currentChapter;
        const stages = [
          {
            name: "스터디/소모임 신규 개설 신청기간",
            status: getStageStatus(
              periods.applicationStart,
              periods.applicationEnd
            ),
            dateRange: formatDateRange(
              periods.applicationStart,
              periods.applicationEnd
            ),
          },
          {
            name: "부원 모집 기간",
            status: getStageStatus(
              periods.recruitmentStart,
              periods.recruitmentEnd
            ),
            dateRange: formatDateRange(
              periods.recruitmentStart,
              periods.recruitmentEnd
            ),
          },
          {
            name: "최종 등록 기간",
            status: (() => {
              // recruitmentEnd + 1일 ~ activityStart - 1일
              const registrationStart = new Date(periods.recruitmentEnd);
              registrationStart.setDate(registrationStart.getDate() + 1);
              const registrationEnd = new Date(periods.activityStart);
              registrationEnd.setDate(registrationEnd.getDate() - 1);
              return getStageStatus(
                registrationStart.toISOString(),
                registrationEnd.toISOString()
              );
            })(),
            dateRange: (() => {
              const registrationStart = new Date(periods.recruitmentEnd);
              registrationStart.setDate(registrationStart.getDate() + 1);
              const registrationEnd = new Date(periods.activityStart);
              registrationEnd.setDate(registrationEnd.getDate() - 1);
              return formatDateRange(
                registrationStart.toISOString(),
                registrationEnd.toISOString()
              );
            })(),
          },
          {
            name: "활동 기간",
            status: getStageStatus(
              periods.activityStart,
              periods.activityEnd
            ),
            dateRange: formatDateRange(
              periods.activityStart,
              periods.activityEnd
            ),
          },
        ];

        const currentPhase = getCurrentPhase(periods);
        const currentStageNames: Record<ChapterPhase, string> = {
          upcoming: "예정",
          application: "스터디/소모임 신규 개설 신청기간",
          recruitment: "부원 모집 기간",
          active: "활동 기간",
          completed: "종료",
        };

        return {
          currentStage: currentStageNames[currentPhase],
          stages,
        };
      })()
    : null;

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
        {statusData ? (
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
                justifyContent: "flex-end",
              }}
            >
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
                현재: {statusData.currentStage}
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
              {statusData.stages.map((stage, index) => (
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
                  {index < statusData.stages.length - 1 && (
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
        ) : (
          <div
            style={{
              backgroundColor: vars.background.subtle,
              borderRadius: "8px",
              padding: "60px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                textAlign: "center",
                color: vars.text.secondary,
                fontSize: "16px",
                fontWeight: 500,
                lineHeight: "24px",
              }}
            >
              다음 챕터 준비중... 곧 새로운 챕터가 시작됩니다!
            </div>
          </div>
        )}

        {/* MVP 소스 리스트 */}
        {mvpGroups.length > 0 && (
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
                  MVP 소스 리스트
                </h2>
                <span
                  style={{
                    fontSize: "14px",
                    color: vars.text.tertiary,
                    fontWeight: 500,
                  }}
                >
                  활동 기록을 가장 잘 작성한 소/스
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
              }}
            >
              {mvpGroups.map((group, index) => {
                const rank = index + 1;
                const rankColors = [
                  { bg: "#FFF8E1", border: "#FFC107", text: "#F57C00" }, // 1위: 골드
                  { bg: "#E3F2FD", border: "#2196F3", text: "#1565C0" }, // 2위: 실버
                  { bg: "#F3E5F5", border: "#9C27B0", text: "#6A1B9A" }, // 3위: 브론즈
                ];
                const rankColor = rankColors[index];

                return (
                  <div
                    key={group.groupName}
                    style={{
                      backgroundColor: vars.background.subtle,
                      borderRadius: "12px",
                      border: `2px solid ${rankColor.border}`,
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      position: "relative",
                    }}
                  >
                    {/* 순위 배지 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: rankColor.border,
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                    >
                      {rank}
                    </div>

                    {/* 그룹 이름 */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        paddingRight: "40px",
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
                        {group.groupName}
                      </h3>
                    </div>

                    {/* 활동 기록 수 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "32px",
                          fontWeight: 700,
                          color: rankColor.text,
                        }}
                      >
                        {group.count}
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: vars.text.secondary,
                          fontWeight: 500,
                        }}
                      >
                        개의 활동 기록
                      </span>
                    </div>

                    {/* 칭찬 메시지 */}
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: `${rankColor.border}15`,
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: rankColor.text,
                        fontWeight: 500,
                        lineHeight: "20px",
                      }}
                    >
                      {rank === 1 && "🏆 활동 기록이 가장 활발한 소/스입니다!"}
                      {rank === 2 && "🥈 두 번째로 많은 활동 기록을 작성했습니다!"}
                      {rank === 3 && "🥉 세 번째로 많은 활동 기록을 작성했습니다!"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 주간 소/스 캘린더 */}
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
                {currentChapter ? `${currentChapter.name} 소/스 캘린더` : "소/스 캘린더"}
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
      </main>
    </div>
  );
}
