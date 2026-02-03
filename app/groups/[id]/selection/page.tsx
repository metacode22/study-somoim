"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@teamsparta/stack-button";
import * as CustomModal from "@teamsparta/stack-custom-modal";
import * as AlertModal from "@teamsparta/stack-alert-modal";
import { vars } from "@teamsparta/stack-tokens";
import { toast } from "@teamsparta/stack-toast";
import { ActionUser } from "@teamsparta/stack-icons";
import {
  groupQueryOptions,
  currentChapterQueryOptions,
  membershipsQueryOptions,
} from "../../../lib/queries";
import {
  isGroupLeader,
  selectMember,
  finalizeRegistration,
  formatChapterPeriods,
  type ChapterGroup,
  type Membership,
  type RegistrationDto,
} from "../../../lib/api";
import { getGroupsWithMockFields } from "../../../lib/mock";

export default function SelectionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const groupId = params.id as string;
  const [isFinalRegistrationModalOpen, setIsFinalRegistrationModalOpen] =
    useState(false);
  const queryClient = useQueryClient();

  // 현재 챕터 조회
  const { data: currentChapter } = useQuery(currentChapterQueryOptions);

  // 그룹 조회
  const { data: chapterGroup, isLoading: isGroupLoading } = useQuery(
    groupQueryOptions(groupId, currentChapter?._id)
  );

  // 신청자 목록 조회 (리더용)
  const { data: membershipsData, isLoading: isMembershipsLoading } = useQuery({
    ...membershipsQueryOptions(
      currentChapter?._id || "",
      groupId,
      { activeOnly: true }
    ),
    enabled: !!currentChapter?._id && !!groupId,
  });

  const memberships = membershipsData?.data || [];

  // 리더 권한 확인
  const isLeader =
    chapterGroup &&
    session?.user?.id &&
    isGroupLeader(chapterGroup, session.user.id as string);

  // 선발 mutation
  const selectMutation = useMutation({
    mutationFn: async ({
      membershipId,
      role,
    }: {
      membershipId: string;
      role: "regular" | "observer";
    }) => {
      if (!currentChapter?._id || !session?.user?.id) {
        throw new Error("챕터 또는 사용자 정보가 없습니다.");
      }
      return selectMember(
        currentChapter._id,
        groupId,
        membershipId,
        role,
        session.user.id as string
      );
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success(
          variables.role === "regular"
            ? "선발이 완료되었습니다."
            : "선발 취소가 완료되었습니다."
        );
        queryClient.invalidateQueries({
          queryKey: ["memberships", currentChapter?._id, groupId],
        });
      } else {
        toast.error(result.reason || "처리에 실패했습니다.");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "처리에 실패했습니다.");
    },
  });

  // 최종 등록 mutation
  const finalizeMutation = useMutation({
    mutationFn: async (data: RegistrationDto) => {
      if (!currentChapter?._id || !session?.user?.id) {
        throw new Error("챕터 또는 사용자 정보가 없습니다.");
      }
      return finalizeRegistration(
        currentChapter._id,
        groupId,
        data,
        session.user.id as string
      );
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("최종 등록이 완료되었습니다.");
        setIsFinalRegistrationModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ["groups"] });
        router.push(`/groups/${groupId}`);
      } else {
        toast.error(result.reason || "최종 등록에 실패했습니다.");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "최종 등록에 실패했습니다.");
    },
  });

  if (isGroupLoading || isMembershipsLoading) {
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

  if (!chapterGroup) {
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

  if (!isLeader) {
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
          리더만 접근할 수 있습니다.
        </div>
      </div>
    );
  }

  const group =
    typeof chapterGroup.group === "object" ? chapterGroup.group : null;
  const groupName = group?.name || chapterGroup._id;
  const scheduleDays = chapterGroup.meetingSchedule
    ? parseScheduleFromString(chapterGroup.meetingSchedule)
    : ["비정기"];

  // 선발된 인원 (role이 regular인 경우)
  const selectedMembers = memberships.filter(
    (m) => m.role === "regular" && !m.cancelledAt
  );
  const selectedCount = selectedMembers.length;

  // 신청자 목록 (role이 observer이고 취소되지 않은 경우)
  const applicants = memberships.filter(
    (m) => m.role === "observer" && !m.cancelledAt
  );

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
        {/* 헤더 */}
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
            선발 관리
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              color: vars.text.tertiary,
            }}
          >
            {groupName}
          </p>
        </div>

        {/* 신청자 목록 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
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
            신청자 목록 ({applicants.length}명)
          </h2>

          {applicants.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: vars.text.tertiary,
                backgroundColor: vars.background.subtle,
                borderRadius: "16px",
              }}
            >
              신청자가 없습니다.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {applicants.map((membership) => {
                const user =
                  typeof membership.user === "object"
                    ? membership.user
                    : null;
                const userName = user?.name || "알 수 없음";
                const userTeam = user?.teamName || "팀 정보 없음";

                return (
                  <div
                    key={membership._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      backgroundColor: vars.background.subtle,
                      border: `1px solid ${vars.line.clickable}`,
                      borderRadius: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <ActionUser
                        variant="line"
                        size={24}
                        color={vars.icon.secondary}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: vars.text.primary,
                            marginBottom: "4px",
                          }}
                        >
                          {userName}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: vars.text.tertiary,
                          }}
                        >
                          {userTeam}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                      }}
                    >
                      <Button
                        variant="fill"
                        colorScheme="primary"
                        size="sm"
                        onClick={() =>
                          selectMutation.mutate({
                            membershipId: membership._id,
                            role: "regular",
                          })
                        }
                        disabled={selectMutation.isPending}
                      >
                        선발
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 선발된 인원 목록 */}
        {selectedMembers.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
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
              선발된 인원 ({selectedCount}명)
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {selectedMembers.map((membership) => {
                const user =
                  typeof membership.user === "object"
                    ? membership.user
                    : null;
                const userName = user?.name || "알 수 없음";
                const userTeam = user?.teamName || "팀 정보 없음";

                return (
                  <div
                    key={membership._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      backgroundColor: vars.background.subtle,
                      border: `1px solid ${vars.line.clickable}`,
                      borderRadius: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <ActionUser
                        variant="line"
                        size={24}
                        color={vars.icon.secondary}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: vars.text.primary,
                            marginBottom: "4px",
                          }}
                        >
                          {userName}
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            color: vars.text.tertiary,
                          }}
                        >
                          {userTeam}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      colorScheme="secondary"
                      size="sm"
                      onClick={() =>
                        selectMutation.mutate({
                          membershipId: membership._id,
                          role: "observer",
                        })
                      }
                      disabled={selectMutation.isPending}
                    >
                      선발 취소
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 선발 마감 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: "24px",
            borderTop: `1px solid ${vars.line.nonClickable}`,
          }}
        >
          <Button
            variant="fill"
            colorScheme="primary"
            onClick={() => setIsFinalRegistrationModalOpen(true)}
            disabled={selectedCount === 0}
          >
            선발 마감
          </Button>
        </div>
      </main>

      {/* 최종 등록 모달 */}
      <CustomModal.Root
        open={isFinalRegistrationModalOpen}
        onOpenChange={setIsFinalRegistrationModalOpen}
        closeOnInteractOutside={false}
      >
        <CustomModal.Content size="md">
          <CustomModal.Header>
            <CustomModal.Title>
              아래 정보로 최종 등록 하시겠습니까?
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
              <div
                style={{
                  padding: "12px",
                  backgroundColor: vars.status.warning.subtle,
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: vars.status.warning.default,
                }}
              >
                최종 등록 후에는 정보를 수정할 수 없습니다.
              </div>
              <InfoRow label="소모임/스터디명" value={groupName} />
              <InfoRow
                label="활동 요일"
                value={scheduleDays.join(", ")}
              />
              <InfoRow
                label="활동 인원"
                value={`${selectedCount}명`}
              />
            </div>
          </CustomModal.Body>
          <CustomModal.Footer>
            <CustomModal.ButtonGroup>
              <Button
                variant="outline"
                colorScheme="secondary"
                onClick={() => setIsFinalRegistrationModalOpen(false)}
              >
                취소
              </Button>
              <Button
                variant="fill"
                colorScheme="primary"
                onClick={() => {
                  finalizeMutation.mutate({
                    leaderOrientationAttended:
                      chapterGroup.leaderOrientationAttended,
                    allowNewHires: chapterGroup.allowNewHires,
                  });
                }}
                disabled={finalizeMutation.isPending}
              >
                최종 등록
              </Button>
            </CustomModal.ButtonGroup>
          </CustomModal.Footer>
        </CustomModal.Content>
      </CustomModal.Root>
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
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function parseScheduleFromString(schedule: string): string[] {
  const days: string[] = [];
  if (schedule.includes("월")) days.push("월");
  if (schedule.includes("화")) days.push("화");
  if (schedule.includes("수")) days.push("수");
  if (schedule.includes("목")) days.push("목");
  if (schedule.includes("금")) days.push("금");
  if (
    schedule.includes("주말") ||
    schedule.includes("토") ||
    schedule.includes("일")
  ) {
    days.push("주말");
  }
  return days.length > 0 ? days : ["비정기"];
}
