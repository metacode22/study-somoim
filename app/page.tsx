"use client";

import { vars } from "@teamsparta/stack-tokens";

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
              진행상황
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
                          activity.type === "소모임" || activity.type === "somoim"
                            ? "#FFEBEE"
                            : "#E3F2FD",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
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
                            activity.type === "소모임" || activity.type === "somoim"
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
