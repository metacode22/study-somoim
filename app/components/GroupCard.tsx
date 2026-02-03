"use client";

import Link from "next/link";
import { vars } from "@teamsparta/stack-tokens";
import {
  InfoCalendar,
  ActionLocationPin,
  ActionUser,
} from "@teamsparta/stack-icons";
import type { Group } from "../lib/api";

export interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const { name, description, schedule, location, leader } = group;

  return (
    <Link
      href={`/groups/${group._id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        height: "100%",
      }}
    >
      <div
        style={{
          backgroundColor: vars.background.subtle,
          border: `1px solid ${vars.line.clickable}`,
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          height: "100%",
          cursor: "pointer",
        }}
      >
      {/* Image Area */}
      <div
        style={{
          height: "167px",
          borderRadius: "8px",
          backgroundColor: vars.background.default,
          padding: "10px",
          backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundSize: "cover",
        }}
      />

      {/* Content Area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          flex: 1,
        }}
      >
        {/* Title & Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: vars.text.primary,
              lineHeight: "24px",
            }}
          >
            {name}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: vars.text.tertiary,
              lineHeight: "20px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {description || "설명이 없습니다"}
          </p>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <InfoItem
              icon={
                <InfoCalendar
                  variant="line"
                  size={16}
                  color={vars.icon.secondary}
                />
              }
              text={schedule || "일정 미정"}
            />
            <InfoItem
              icon={
                <ActionLocationPin
                  variant="line"
                  size={16}
                  color={vars.icon.secondary}
                />
              }
              text={location || "장소 미정"}
            />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <InfoItem
              icon={
                <ActionUser
                  variant="line"
                  size={16}
                  color={vars.icon.secondary}
                />
              }
              text={`리더: ${leader}`}
            />
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

        {/* Contact */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "13px",
          }}
        >
          <span style={{ color: vars.text.tertiary }}>
            {group.team ? `#${group.team}` : ""}
          </span>
          <span style={{ color: vars.text.quaternary }}>문의: {leader}</span>
        </div>
      </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 12px",
            fontSize: "14px",
            fontWeight: 500,
            borderRadius: "8px",
            border: `1px solid ${vars.line.clickable}`,
            color: vars.text.secondary,
            backgroundColor: "transparent",
          }}
        >
          상세보기
        </span>
      </div>
    </Link>
  );
}

function InfoItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        width: "158px",
      }}
    >
      {icon}
      <span
        style={{
          fontSize: "14px",
          color: vars.text.secondary,
          lineHeight: "22px",
        }}
      >
        {text}
      </span>
    </div>
  );
}
