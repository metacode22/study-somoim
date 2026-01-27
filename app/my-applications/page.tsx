"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Button } from "@teamsparta/stack-button";
import * as CustomModal from "@teamsparta/stack-custom-modal";
import * as AlertModal from "@teamsparta/stack-alert-modal";
import { vars } from "@teamsparta/stack-tokens";
import { toast } from "@teamsparta/stack-toast";
import { InfoCalendar } from "@teamsparta/stack-icons";
import {
  cancelApplication as cancelApplicationAPI,
} from "../lib/api";
import {
  currentChapterQueryOptions,
  myMembershipsQueryOptions,
} from "../lib/queries";
import { membershipToApplication } from "../lib/mock";
import type { Application } from "../lib/recruitment";
import { SCHEDULE_DAYS, type ScheduleDay } from "../lib/recruitment";

export default function MyApplicationsPage() {
  const { data: session } = useSession();
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  // 현재 챕터 조회
  const { data: currentChapter } = useQuery(currentChapterQueryOptions);

  // 내 신청 목록 조회
  const myMembershipsQuery = myMembershipsQueryOptions(
    currentChapter?._id || "",
    session?.user?.id as string || ""
  );
  const { data: memberships = [], isLoading } = useQuery({
    ...myMembershipsQuery,
    enabled: !!currentChapter?._id && !!session?.user?.id,
  });

  // Membership을 Application으로 변환
  const applications: Application[] = useMemo(() => {
    return memberships.map((m) => membershipToApplication(m, currentChapter || undefined));
  }, [memberships, currentChapter]);

  // 요일별로 그룹화
  const applicationsByDay = useMemo(() => {
    const grouped: Record<ScheduleDay, Application[]> = {
      월: [],
      화: [],
      수: [],
      목: [],
      금: [],
      주말: [],
      비정기: [],
    };

    applications.forEach((app) => {
      if (app.scheduleDays && app.scheduleDays.length > 0) {
        app.scheduleDays.forEach((day) => {
          if (day in grouped) {
            grouped[day as ScheduleDay].push(app);
          }
        });
      } else {
        grouped.비정기.push(app);
      }
    });

    return grouped;
  }, [applications]);

  // 취소 mutation
  const cancelMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      if (!currentChapter?._id || !session?.user?.id) {
        throw new Error("챕터 또는 사용자 정보가 없습니다.");
      }
      // membership에서 chapterGroup ID 추출
      const membership = memberships.find((m) => m._id === membershipId);
      if (!membership) throw new Error("멤버십을 찾을 수 없습니다.");
      
      // chapterGroup이 string이면 그대로, object면 _id 사용
      const chapterGroupId =
        typeof membership.chapterGroup === "string"
          ? membership.chapterGroup
          : (membership.chapterGroup as any)?._id || membership.chapterGroup;
      
      if (!chapterGroupId) {
        throw new Error("그룹 정보를 찾을 수 없습니다.");
      }
      
      return cancelApplicationAPI(
        currentChapter._id,
        chapterGroupId,
        membershipId,
        session.user.id as string
      );
    },
    onSuccess: () => {
      toast.success("신청이 취소되었습니다.");
      setIsCancelConfirmOpen(false);
      setIsInfoModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "취소에 실패했습니다.");
    },
  });

  const handleCancelClick = (app: Application) => {
    if (app.isSelectionComplete) {
      toast.error("선발이 완료되어 취소가 불가합니다.");
      return;
    }
    setSelectedApplication(app);
    setIsCancelConfirmOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedApplication) {
      cancelMutation.mutate(selectedApplication.id);
    }
  };

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

  const hasApplications = applications.length > 0;

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
        {/* 헤더 */}
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
            내 신청
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: vars.text.tertiary,
            }}
          >
            신청한 소모임/스터디를 요일별로 확인할 수 있습니다.
          </p>
        </div>

        {/* 요일별 신청 목록 */}
        {!hasApplications ? (
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
            <InfoCalendar
              variant="line"
              size={48}
              color={vars.icon.tertiary}
            />
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                color: vars.text.tertiary,
              }}
            >
              아직 신청한 소모임/스터디가 없습니다.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {SCHEDULE_DAYS.map((day) => {
              const dayApplications = applicationsByDay[day];
              if (dayApplications.length === 0) return null;

              return (
                <div key={day}>
                  {/* 요일 헤더 */}
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: 700,
                      color: vars.text.primary,
                      marginBottom: "12px",
                    }}
                  >
                    {day}
                  </h2>

                  {/* 신청 카드 리스트 */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {dayApplications.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        onClick={() => {
                          setSelectedApplication(app);
                          setIsInfoModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 신청 정보 모달 */}
      <CustomModal.Root
        open={isInfoModalOpen}
        onOpenChange={setIsInfoModalOpen}
      >
        <CustomModal.Content size="md">
          <CustomModal.Header>
            <CustomModal.Title>신청 정보</CustomModal.Title>
            <CustomModal.CloseButton />
          </CustomModal.Header>
          <CustomModal.Body>
            {selectedApplication && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <InfoRow
                  label="소모임/스터디명"
                  value={selectedApplication.groupName}
                />
                <InfoRow
                  label="활동 요일"
                  value={
                    selectedApplication.scheduleDays.length > 0
                      ? selectedApplication.scheduleDays.join(", ")
                      : "비정기"
                  }
                />
                <InfoRow
                  label="선발 기간"
                  value={selectedApplication.selectionPeriod}
                />
                <InfoRow
                  label="활동 기간"
                  value={selectedApplication.activityPeriod}
                />
              </div>
            )}
          </CustomModal.Body>
          <CustomModal.Footer>
            <CustomModal.ButtonGroup>
              <Button
                variant="outline"
                colorScheme="secondary"
                onClick={() => {
                  if (selectedApplication) {
                    handleCancelClick(selectedApplication);
                  }
                }}
                disabled={
                  selectedApplication?.isSelectionComplete ||
                  cancelMutation.isPending
                }
              >
                신청 취소
              </Button>
              <Button
                variant="fill"
                colorScheme="primary"
                onClick={() => setIsInfoModalOpen(false)}
              >
                확인
              </Button>
            </CustomModal.ButtonGroup>
          </CustomModal.Footer>
        </CustomModal.Content>
      </CustomModal.Root>

      {/* 취소 확인 모달 */}
      <AlertModal.Root
        open={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
      >
        <AlertModal.Content size="sm">
          <AlertModal.Header>
            <AlertModal.Title>정말 취소하시겠습니까?</AlertModal.Title>
          </AlertModal.Header>
          <AlertModal.Footer>
            <AlertModal.ButtonGroup>
              <Button
                variant="outline"
                colorScheme="secondary"
                onClick={() => setIsCancelConfirmOpen(false)}
              >
                취소
              </Button>
              <Button
                variant="fill"
                colorScheme="primary"
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
              >
                신청 취소하기
              </Button>
            </AlertModal.ButtonGroup>
          </AlertModal.Footer>
        </AlertModal.Content>
      </AlertModal.Root>
    </div>
  );
}

function ApplicationCard({
  application,
  onClick,
}: {
  application: Application;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: vars.background.subtle,
        border: `1px solid ${vars.line.clickable}`,
        borderRadius: "12px",
        padding: "20px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = vars.line.clickable;
        e.currentTarget.style.backgroundColor = vars.background.default;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = vars.line.clickable;
        e.currentTarget.style.backgroundColor = vars.background.subtle;
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: vars.text.primary,
              marginBottom: "4px",
            }}
          >
            {application.groupName}
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <InfoCalendar
              variant="line"
              size={14}
              color={vars.icon.tertiary}
            />
            <span
              style={{
                fontSize: "13px",
                color: vars.text.tertiary,
              }}
            >
              {application.scheduleDays.length > 0
                ? application.scheduleDays.join(", ")
                : "비정기"}
            </span>
          </div>
        </div>
        {application.isSelectionComplete && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: vars.status.success.default,
              backgroundColor: `${vars.status.success.default}15`,
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            선발 완료
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          gap: "16px",
          fontSize: "12px",
          color: vars.text.quaternary,
        }}
      >
        <span>선발 기간: {application.selectionPeriod}</span>
        <span>활동 기간: {application.activityPeriod}</span>
      </div>
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
