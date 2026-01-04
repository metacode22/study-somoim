"use client";

import { vars } from "@teamsparta/stack-tokens";
import {
  InfoCalendar,
  ActionUser,
  ActionLocationPin,
} from "@teamsparta/stack-icons";

interface ActivityLog {
  id: string;
  type: "join" | "leave" | "attendance" | "create";
  groupName: string;
  groupType: "소모임" | "스터디";
  date: string;
  description: string;
}

// 임시 더미 데이터
const mockActivityLogs: ActivityLog[] = [
  {
    id: "1",
    type: "join",
    groupName: "독서 모임",
    groupType: "소모임",
    date: "2024-12-30",
    description: "독서 모임에 가입했습니다.",
  },
  {
    id: "2",
    type: "attendance",
    groupName: "독서 모임",
    groupType: "소모임",
    date: "2024-12-28",
    description: "정기 모임에 참석했습니다.",
  },
  {
    id: "3",
    type: "join",
    groupName: "프론트엔드 스터디",
    groupType: "스터디",
    date: "2024-12-25",
    description: "프론트엔드 스터디에 가입했습니다.",
  },
  {
    id: "4",
    type: "attendance",
    groupName: "프론트엔드 스터디",
    groupType: "스터디",
    date: "2024-12-22",
    description: "React 심화 세션에 참석했습니다.",
  },
  {
    id: "5",
    type: "leave",
    groupName: "영어 회화 모임",
    groupType: "소모임",
    date: "2024-12-20",
    description: "영어 회화 모임을 탈퇴했습니다.",
  },
];

export default function ActivityLogPage() {
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
          gap: "32px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 700,
              color: vars.text.primary,
              lineHeight: "32px",
            }}
          >
            활동 로그
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: vars.text.tertiary,
              lineHeight: "22px",
            }}
          >
            소모임 및 스터디 활동 내역을 확인하세요.
          </p>
        </div>

        {/* Activity List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {mockActivityLogs.length === 0 ? (
            <EmptyState />
          ) : (
            mockActivityLogs.map((log) => (
              <ActivityLogCard key={log.id} log={log} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function ActivityLogCard({ log }: { log: ActivityLog }) {
  const getTypeLabel = (type: ActivityLog["type"]) => {
    switch (type) {
      case "join":
        return { text: "가입", color: vars.status.success.default };
      case "leave":
        return { text: "탈퇴", color: vars.status.error.default };
      case "attendance":
        return { text: "참석", color: vars.status.processing.default };
      case "create":
        return { text: "생성", color: vars.status.success.default };
      default:
        return { text: "활동", color: vars.status.processing.default };
    }
  };

  const typeInfo = getTypeLabel(log.type);

  return (
    <div
      style={{
        backgroundColor: vars.background.subtle,
        border: `1px solid ${vars.line.clickable}`,
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      {/* Type Badge */}
      <div
        style={{
          minWidth: "48px",
          height: "48px",
          borderRadius: "12px",
          backgroundColor: vars.background.default,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActionUser variant="line" size={24} color={typeInfo.color} />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: typeInfo.color,
              backgroundColor: `${typeInfo.color}15`,
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            {typeInfo.text}
          </span>
          <span
            style={{
              fontSize: "12px",
              color: vars.text.quaternary,
              backgroundColor: vars.fill.subtle,
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            {log.groupType}
          </span>
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 600,
            color: vars.text.primary,
            lineHeight: "22px",
          }}
        >
          {log.groupName}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: vars.text.tertiary,
            lineHeight: "20px",
          }}
        >
          {log.description}
        </p>
      </div>

      {/* Date */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: vars.text.quaternary,
          fontSize: "13px",
        }}
      >
        <InfoCalendar variant="line" size={16} color={vars.icon.tertiary} />
        <span>{log.date}</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        backgroundColor: vars.background.subtle,
        borderRadius: "12px",
        gap: "12px",
      }}
    >
      <ActionLocationPin variant="line" size={24} color={vars.icon.tertiary} />
      <p
        style={{
          margin: 0,
          fontSize: "15px",
          color: vars.text.tertiary,
        }}
      >
        아직 활동 기록이 없습니다.
      </p>
    </div>
  );
}
