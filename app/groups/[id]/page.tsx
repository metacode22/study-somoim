"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@teamsparta/stack-button";
import * as CustomModal from "@teamsparta/stack-custom-modal";
import { vars } from "@teamsparta/stack-tokens";
import { toast } from "@teamsparta/stack-toast";
import {
  InfoCalendar,
  ActionLocationPin,
  ActionUser,
} from "@teamsparta/stack-icons";
import { groupQueryOptions, currentChapterQueryOptions } from "../../lib/queries";
import {
  getGroupTypeLabel,
  type Group,
  type ChapterGroup,
  applyGroup as applyGroupAPI,
  formatChapterPeriods,
  isGroupLeader,
} from "../../lib/api";
import { getGroupsWithMockFields } from "../../lib/mock";
import Link from "next/link";

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const groupId = params.id as string;
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // 현재 챕터 조회
  const { data: currentChapter } = useQuery(currentChapterQueryOptions);
  
  // 그룹 조회
  const { data: chapterGroup, isLoading } = useQuery(
    groupQueryOptions(groupId, currentChapter?._id)
  );

  // ChapterGroup을 Group 형태로 변환
  const group: Group | null = chapterGroup
    ? (() => {
        const g = typeof chapterGroup.group === "object" ? chapterGroup.group : null;
        return {
          _id: chapterGroup._id,
          name: g?.name || chapterGroup._id,
          leader: chapterGroup.leader,
          team: chapterGroup.team,
          type: chapterGroup.type,
          description: g?.description,
          schedule: chapterGroup.meetingSchedule,
          location: chapterGroup.meetingLocation,
          hasLeaderExperience: chapterGroup.leaderOrientationAttended,
          category: g?.category,
          isActive: g?.isActive ?? true,
          createdAt: chapterGroup.createdAt,
          updatedAt: chapterGroup.updatedAt,
        } as Group;
      })()
    : null;

  const groupWithMock = group && currentChapter
    ? getGroupsWithMockFields([group], currentChapter)[0]
    : group;

  // 챕터 기간 정보
  const periods = currentChapter ? formatChapterPeriods(currentChapter) : null;

  // 신청 mutation
  const applyMutation = useMutation({
    mutationFn: async (type: "regular" | "guest") => {
      if (!currentChapter?._id || !session?.user?.id) {
        throw new Error("챕터 또는 사용자 정보가 없습니다.");
      }
      return applyGroupAPI(
        currentChapter._id,
        groupId,
        session.user.id as string,
        type === "regular" ? "regular" : "observer"
      );
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("신청이 완료되었습니다.");
        setIsApplicationModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ["groups"] });
        queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      } else {
        toast.error(result.reason || "신청을 완료할 수 없어요.");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "신청을 완료할 수 없어요.");
    },
  });

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: vars.background.default,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: vars.text.tertiary }}>로딩 중...</div>
      </div>
    );
  }

  if (!groupWithMock) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: vars.background.default,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: vars.status.error.default }}>
          그룹을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const {
    name,
    description,
    schedule,
    scheduleDays,
    location,
    leader,
  } = groupWithMock;

  // 리더 권한 확인
  const isLeader =
    chapterGroup &&
    session?.user?.id &&
    isGroupLeader(chapterGroup, session.user.id as string);

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
        {/* 뒤로가기 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          style={{ alignSelf: "flex-start" }}
        >
          ← 목록으로
        </Button>

        {/* 그룹 상세 정보 */}
        <div
          style={{
            backgroundColor: vars.background.subtle,
            border: `1px solid ${vars.line.clickable}`,
            borderRadius: "16px",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* 제목 */}
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                color: vars.text.primary,
                marginBottom: "8px",
              }}
            >
              {name}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: vars.text.tertiary,
              }}
            >
              {getGroupTypeLabel(groupWithMock.type)}
            </p>
          </div>

          {/* 설명 */}
          {description && (
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  color: vars.text.secondary,
                  lineHeight: "24px",
                }}
              >
                {description}
              </p>
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: vars.line.nonClickable,
              width: "100%",
            }}
          />

          {/* 정보 그리드 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            <InfoItem
              icon={
                <InfoCalendar
                  variant="line"
                  size={20}
                  color={vars.icon.secondary}
                />
              }
              label="활동 요일"
              value={
                scheduleDays && scheduleDays.length > 0
                  ? scheduleDays.join(", ")
                  : schedule || "일정 미정"
              }
            />
            <InfoItem
              icon={
                <ActionLocationPin
                  variant="line"
                  size={20}
                  color={vars.icon.secondary}
                />
              }
              label="모임 장소"
              value={location || "장소 미정"}
            />
            <InfoItem
              icon={
                <ActionUser
                  variant="line"
                  size={20}
                  color={vars.icon.secondary}
                />
              }
              label="리더"
              value={leader}
            />
            {periods && (
              <InfoItem
                icon={
                  <InfoCalendar
                    variant="line"
                    size={20}
                    color={vars.icon.secondary}
                  />
                }
                label="선발 기간"
                value={periods.selectionPeriod}
              />
            )}
            {periods && (
              <InfoItem
                icon={
                  <InfoCalendar
                    variant="line"
                    size={20}
                    color={vars.icon.secondary}
                  />
                }
                label="활동 기간"
                value={periods.activityPeriod}
              />
            )}
          </div>

          {/* 신청 버튼 / 선발 관리 버튼 */}
          <div
            style={{
              marginTop: "8px",
              display: "flex",
              gap: "12px",
            }}
          >
            {isLeader ? (
              <Link href={`/groups/${groupId}/selection`} style={{ textDecoration: "none" }}>
                <Button
                  variant="fill"
                  colorScheme="secondary"
                  size="md"
                >
                  선발 관리
                </Button>
              </Link>
            ) : (
              <Button
                variant="fill"
                colorScheme="primary"
                size="md"
                onClick={() => setIsApplicationModalOpen(true)}
              >
                신청하기
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* 신청 확인 모달 */}
      <CustomModal.Root
        open={isApplicationModalOpen}
        onOpenChange={setIsApplicationModalOpen}
        closeOnInteractOutside={false}
      >
        <CustomModal.Content size="md">
          <CustomModal.Header>
            <CustomModal.Title>
              신청하려는 소모임/스터디의 정보를 확인해주세요.
            </CustomModal.Title>
            <CustomModal.CloseButton />
          </CustomModal.Header>
          <CustomModal.Body>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <InfoRow label="소모임/스터디명" value={name} />
              <InfoRow
                label="활동 요일"
                value={
                  scheduleDays && scheduleDays.length > 0
                    ? scheduleDays.join(", ")
                    : schedule || "일정 미정"
                }
              />
              {periods && (
                <InfoRow label="선발 기간" value={periods.selectionPeriod} />
              )}
              {periods && (
                <InfoRow label="활동 기간" value={periods.activityPeriod} />
              )}
            </div>
          </CustomModal.Body>
          <CustomModal.Footer>
            <CustomModal.ButtonGroup>
              <Button
                variant="outline"
                colorScheme="secondary"
                onClick={() => applyMutation.mutate("guest")}
                disabled={applyMutation.isPending || !session?.user?.id}
              >
                순참 멤버 신청
              </Button>
              <Button
                variant="fill"
                colorScheme="primary"
                onClick={() => applyMutation.mutate("regular")}
                disabled={applyMutation.isPending || !session?.user?.id}
              >
                정규 멤버 신청
              </Button>
            </CustomModal.ButtonGroup>
          </CustomModal.Footer>
        </CustomModal.Content>
      </CustomModal.Root>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {icon}
        <span
          style={{
            fontSize: "13px",
            color: vars.text.tertiary,
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "15px",
          color: vars.text.primary,
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: `1px solid ${vars.line.nonClickable}`,
      }}
    >
      <span
        style={{
          fontSize: "14px",
          color: vars.text.tertiary,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "14px",
          color: vars.text.primary,
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}
