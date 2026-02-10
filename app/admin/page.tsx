"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Tabs from "@teamsparta/stack-tabs";
import { vars } from "@teamsparta/stack-tokens";
import { Button } from "@teamsparta/stack-button";
import {
  chaptersQueryOptions,
  chapterApplicationsQueryOptions,
  chapterRegistrationsQueryOptions,
} from "../lib/queries";
import { createChapter, updateChapter, deleteChapter, type CreateChapterDto, type UpdateChapterDto, type Chapter, type ChapterGroup, type Group } from "../lib/api";
import { useState } from "react";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);

  // 챕터 목록 조회
  const { data: chapters = [], refetch: refetchChapters } = useQuery(chaptersQueryOptions);

  // 선택된 챕터의 신청 목록 조회
  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    error: applicationsError,
  } = useQuery(
    chapterApplicationsQueryOptions(selectedChapterId, { limit: 100 })
  );

  // 선택된 챕터의 등록 완료 목록 조회
  const {
    data: registrations = [],
    isLoading: isLoadingRegistrations,
    error: registrationsError,
  } = useQuery(chapterRegistrationsQueryOptions(selectedChapterId));

  // 첫 번째 챕터를 기본 선택
  const defaultChapter = chapters.length > 0 ? chapters[0] : null;
  const currentChapterId = selectedChapterId || defaultChapter?._id || "";

   // 선택된 챕터의 데이터
   const chapterApplications = applicationsData?.data || [];

   // 1. 신규 신청: 심사 대기 중인 신규 신청
   const newApplications = chapterApplications.filter(
     (app) => app.reviewStatus === "pending"
   );
 
   // 2. 모집 진행: 심사를 통과했지만 아직 등록되지 않은 것
   const recruitingGroups = chapterApplications.filter(
     (app) =>
       (app.reviewStatus === "approved" || app.reviewStatus === "auto_extended") &&
       !app.isRegistered
   );
 
   // 3. 최종 등록: 부원 모집을 마무리하고 등록을 완료한 것
   const registeredGroups = registrations;

  const createChapterMutation = useMutation({
    mutationFn: createChapter,
    onSuccess: (newChapter) => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      // 새로 생성된 챕터를 자동 선택
      setSelectedChapterId(newChapter._id);
      alert("챕터가 성공적으로 생성되었습니다.");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "챕터 생성에 실패했습니다.";
      alert(Array.isArray(message) ? message.join(", ") : message);
    },
  });

  const updateChapterMutation = useMutation({
    mutationFn: ({ chapterId, data }: { chapterId: string; data: UpdateChapterDto }) => {
      console.log("수정 API 호출:", { chapterId, data });
      return updateChapter(chapterId, data);
    },
    onSuccess: async (updatedChapter) => {
      console.log("수정 성공:", updatedChapter);
      
      // 챕터 목록 쿼리 캐시를 직접 업데이트
      queryClient.setQueryData<Chapter[]>(["chapters"], (oldChapters) => {
        if (!oldChapters) return oldChapters;
        return oldChapters.map((chapter) =>
          chapter._id === updatedChapter._id ? updatedChapter : chapter
        );
      });
      
      // 현재 챕터 쿼리도 업데이트 (현재 챕터가 수정된 경우)
      queryClient.setQueryData<Chapter | null>(["chapters", "current"], (oldCurrent) => {
        if (!oldCurrent) return oldCurrent;
        if (oldCurrent._id === updatedChapter._id) {
          return updatedChapter;
        }
        return oldCurrent;
      });
      
      // 모든 챕터 관련 쿼리 무효화 및 재조회
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      queryClient.invalidateQueries({ queryKey: ["chapters", "current"] });
      
      // 수정된 챕터가 현재 선택된 챕터라면 해당 챕터의 애플리케이션도 새로고침
      if (selectedChapterId === updatedChapter._id) {
        queryClient.invalidateQueries({ 
          queryKey: ["chapters", selectedChapterId, "applications"] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ["chapters", selectedChapterId, "registrations"] 
        });
      }
      
      // 챕터 목록을 강제로 다시 가져오기
      await queryClient.refetchQueries({ queryKey: ["chapters"] });
      // 추가로 refetch 함수 직접 호출
      await refetchChapters();
      
      setEditingChapterId(null);
      
      // 약간의 지연 후 알림 (UI 업데이트를 기다림)
      setTimeout(() => {
        alert("챕터가 성공적으로 수정되었습니다.");
      }, 100);
    },
    onError: (error: any) => {
      console.error("수정 실패:", error);
      console.error("에러 상세:", error?.response?.data);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "챕터 수정에 실패했습니다.";
      alert(Array.isArray(message) ? message.join(", ") : message);
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: deleteChapter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      setDeletingChapterId(null);
      // 삭제된 챕터가 선택되어 있었다면 선택 해제
      if (selectedChapterId === deletingChapterId) {
        setSelectedChapterId("");
      }
      alert("챕터가 성공적으로 삭제되었습니다.");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "챕터 삭제에 실패했습니다.";
      alert(Array.isArray(message) ? message.join(", ") : message);
    },
  });

  const isLoading = isLoadingApplications || isLoadingRegistrations;
  const error = applicationsError || registrationsError;

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

        {/* Chapter Creation Section */}
        <ChapterCreationForm
          onSubmit={(data) => createChapterMutation.mutate(data)}
          isLoading={createChapterMutation.isPending}
        />

        {/* Chapter Selection */}
        {chapters.length > 0 && (
          <div
            style={{
              backgroundColor: vars.background.subtle,
              border: `1px solid ${vars.line.clickable}`,
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: vars.text.secondary,
                }}
              >
                챕터 선택
              </label>
              {currentChapterId && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    variant="outline"
                    colorScheme="secondary"
                    size="sm"
                    onClick={() => setEditingChapterId(currentChapterId)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    colorScheme="error"
                    size="sm"
                    onClick={() => setDeletingChapterId(currentChapterId)}
                  >
                    삭제
                  </Button>
                </div>
              )}
            </div>
            <select
              value={currentChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: `1px solid ${vars.line.clickable}`,
                borderRadius: "6px",
                backgroundColor: vars.background.default,
                color: vars.text.primary,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {chapters.map((chapter) => (
                <option key={chapter._id} value={chapter._id}>
                  {chapter.name} ({chapter.currentPhase})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Chapter Edit Modal */}
        {editingChapterId && (
          <ChapterEditForm
            chapter={chapters.find((c) => c._id === editingChapterId)!}
            onSubmit={(data) =>
              updateChapterMutation.mutate({ chapterId: editingChapterId, data })
            }
            onCancel={() => setEditingChapterId(null)}
            isLoading={updateChapterMutation.isPending}
          />
        )}

        {/* Chapter Delete Confirmation */}
        {deletingChapterId && (
          <ChapterDeleteConfirmation
            chapter={chapters.find((c) => c._id === deletingChapterId)!}
            onConfirm={() => {
              deleteChapterMutation.mutate(deletingChapterId);
            }}
            onCancel={() => setDeletingChapterId(null)}
            isLoading={deleteChapterMutation.isPending}
          />
        )}

        {/* Stats Cards - 챕터별 데이터 */}
        {currentChapterId && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              <StatCard
                title="신규 신청"
                value={newApplications.length}
                color={vars.text.primary}
              />
              <StatCard
                title="모집 진행"
                value={recruitingGroups.length}
                color={vars.status.processing.default}
              />
              <StatCard
                title="최종 등록"
                value={registeredGroups.length}
                color={vars.status.success.default}
              />
            </div>

            {/* Tabs Section - 챕터별 데이터 */}
            <Tabs.Root defaultValue="new" colorScheme="secondary">
              <Tabs.List>
                <Tabs.Trigger value="new">
                  신규 신청 ({newApplications.length})
                </Tabs.Trigger>
                <Tabs.Trigger value="recruiting">
                  모집 진행 ({recruitingGroups.length})
                </Tabs.Trigger>
                <Tabs.Trigger value="registered">
                  최종 등록 ({registeredGroups.length})
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="new">
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
                  {!isLoading && !error && newApplications.length === 0 && (
                    <EmptyState message="신규 신청이 없습니다" />
                  )}
                  {!isLoading &&
                    !error &&
                    newApplications.map((application) => (
                      <AdminChapterGroupCard
                        key={application._id}
                        chapterGroup={application}
                      />
                    ))}
                </div>
              </Tabs.Content>

              <Tabs.Content value="recruiting">
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
                  {!isLoading && !error && recruitingGroups.length === 0 && (
                    <EmptyState message="모집 진행 중인 스터디 소모임이 없습니다" />
                  )}
                  {!isLoading &&
                    !error &&
                    recruitingGroups.map((group) => (
                      <AdminChapterGroupCard
                        key={group._id}
                        chapterGroup={group}
                      />
                    ))}
                </div>
              </Tabs.Content>

              <Tabs.Content value="registered">
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
                  {!isLoading && !error && registeredGroups.length === 0 && (
                    <EmptyState message="최종 등록된 스터디 소모임이 없습니다" />
                  )}
                  {!isLoading &&
                    !error &&
                    registeredGroups.map((registration) => (
                      <AdminChapterGroupCard
                        key={registration._id}
                        chapterGroup={registration}
                      />
                    ))}
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </>
        )}

        {!currentChapterId && chapters.length === 0 && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: vars.text.tertiary,
            }}
          >
            챕터를 먼저 생성해주세요.
          </div>
        )}
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

function AdminChapterGroupCard({
  chapterGroup,
}: {
  chapterGroup: ChapterGroup;
}) {
  const {
    type,
    leader,
    team,
    operationPlan,
    meetingSchedule,
    meetingLocation,
    reviewStatus,
    status,
    isRegistered,
    registeredAt,
    createdAt,
    group,
  } = chapterGroup;

  // group이 populate된 경우 group.name 사용, 아니면 operationPlan이나 다른 필드 사용
  const groupName =
    typeof group === "object" && group !== null && "name" in group
      ? (group as Group).name
      : operationPlan || "그룹 이름 없음";

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = () => {
    if (isRegistered) {
      return {
        text: "등록 완료",
        color: vars.status.success.default,
        bgColor: vars.status.success.subtle,
      };
    }
    if (reviewStatus === "approved" || reviewStatus === "auto_extended") {
      return {
        text: "승인됨",
        color: vars.status.processing.default,
        bgColor: vars.status.processing.subtle,
      };
    }
    if (reviewStatus === "rejected") {
      return {
        text: "반려됨",
        color: vars.status.error.default,
        bgColor: vars.status.error.subtle,
      };
    }
    return {
      text: "심사 대기",
      color: vars.status.warning?.default || vars.text.tertiary,
      bgColor: vars.background.default,
    };
  };

  const statusBadge = getStatusBadge();

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
              flexWrap: "wrap",
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
              {groupName || "그룹 이름 없음"}
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
            <span
              style={{
                fontSize: "12px",
                padding: "4px 8px",
                backgroundColor: statusBadge.bgColor,
                borderRadius: "4px",
                color: statusBadge.color,
                fontWeight: 500,
              }}
            >
              {statusBadge.text}
            </span>
          </div>
          {operationPlan && (
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: vars.text.tertiary,
                lineHeight: "20px",
              }}
            >
              {operationPlan}
            </p>
          )}
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
        <InfoRow label="리더" value={leader || "-"} />
        {team && <InfoRow label="팀" value={team} />}
        {meetingSchedule && (
          <InfoRow label="일정" value={meetingSchedule} />
        )}
        {meetingLocation && (
          <InfoRow label="장소" value={meetingLocation} />
        )}
        <InfoRow label="신청일" value={formatDate(createdAt)} />
        {registeredAt && (
          <InfoRow label="등록일" value={formatDate(registeredAt)} />
        )}
        {reviewStatus && (
          <InfoRow
            label="심사 상태"
            value={
              reviewStatus === "pending"
                ? "대기 중"
                : reviewStatus === "approved"
                ? "승인됨"
                : reviewStatus === "rejected"
                ? "반려됨"
                : "자동 연장"
            }
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

function ChapterCreationForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: CreateChapterDto) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateChapterDto>({
    name: "",
    periods: {
      applicationStart: "",
      applicationEnd: "",
      recruitmentStart: "",
      recruitmentEnd: "",
      activityStart: "",
      activityEnd: "",
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "챕터 이름을 입력해주세요.";
    }

    const periods = formData.periods;
    const requiredFields = [
      "applicationStart",
      "applicationEnd",
      "recruitmentStart",
      "recruitmentEnd",
      "activityStart",
      "activityEnd",
    ] as const;

    for (const field of requiredFields) {
      if (!periods[field]) {
        newErrors[field] = "날짜를 선택해주세요.";
      }
    }

    // 날짜 순서 검증
    if (periods.applicationStart && periods.applicationEnd) {
      if (new Date(periods.applicationEnd) < new Date(periods.applicationStart)) {
        newErrors.applicationEnd = "종료일은 시작일 이후여야 합니다.";
      }
    }

    if (periods.applicationEnd && periods.recruitmentStart) {
      if (new Date(periods.recruitmentStart) <= new Date(periods.applicationEnd)) {
        newErrors.recruitmentStart = "부원 모집 시작일은 신청 종료일 이후여야 합니다.";
      }
    }

    if (periods.recruitmentStart && periods.recruitmentEnd) {
      if (new Date(periods.recruitmentEnd) < new Date(periods.recruitmentStart)) {
        newErrors.recruitmentEnd = "종료일은 시작일 이후여야 합니다.";
      }
    }

    if (periods.recruitmentEnd && periods.activityStart) {
      if (new Date(periods.activityStart) <= new Date(periods.recruitmentEnd)) {
        newErrors.activityStart = "활동 시작일은 부원 모집 종료일 이후여야 합니다.";
      }
    }

    if (periods.activityStart && periods.activityEnd) {
      if (new Date(periods.activityEnd) < new Date(periods.activityStart)) {
        newErrors.activityEnd = "종료일은 시작일 이후여야 합니다.";
      }
      // 활동 기간이 약 60일인지 확인 (50-70일 범위 허용)
      const activityDays =
        (new Date(periods.activityEnd).getTime() -
          new Date(periods.activityStart).getTime()) /
        (1000 * 60 * 60 * 24);
      if (activityDays < 50 || activityDays > 70) {
        newErrors.activityEnd = "활동 기간은 약 2개월(50-70일)이어야 합니다.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // 날짜를 ISO string으로 변환 (YYYY-MM-DD -> ISO)
      const convertToISO = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toISOString();
      };

      // 종료일을 23:59:59.999로 설정
      const convertToEndOfDay = (dateStr: string) => {
        if (!dateStr) return "";
        // YYYY-MM-DD 형식에서 날짜 부분만 추출
        const dateOnly = dateStr.split('T')[0];
        return `${dateOnly}T23:59:59.999Z`;
      };

      const submitData: CreateChapterDto = {
        name: formData.name.trim(),
        periods: {
          applicationStart: convertToISO(formData.periods.applicationStart),
          applicationEnd: convertToEndOfDay(formData.periods.applicationEnd),
          recruitmentStart: convertToISO(formData.periods.recruitmentStart),
          recruitmentEnd: convertToEndOfDay(formData.periods.recruitmentEnd),
          activityStart: convertToISO(formData.periods.activityStart),
          activityEnd: convertToEndOfDay(formData.periods.activityEnd),
        },
      };
      onSubmit(submitData);
      // 성공 시 폼 초기화
      setFormData({
        name: "",
        periods: {
          applicationStart: "",
          applicationEnd: "",
          recruitmentStart: "",
          recruitmentEnd: "",
          activityStart: "",
          activityEnd: "",
        },
      });
      setErrors({});
    }
  };

  const updatePeriod = (
    field: keyof CreateChapterDto["periods"],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      periods: {
        ...prev.periods,
        [field]: value,
      },
    }));
    // 해당 필드의 에러 제거
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div
      style={{
        backgroundColor: vars.background.subtle,
        border: `1px solid ${vars.line.clickable}`,
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "20px",
          fontWeight: 700,
          color: vars.text.primary,
          marginBottom: "20px",
        }}
      >
        챕터 생성
      </h2>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Chapter Name */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: vars.text.secondary,
                marginBottom: "8px",
              }}
            >
              챕터 이름 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.name;
                    return newErrors;
                  });
                }
              }}
              placeholder="예: 2026년 1-2월 챕터"
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: `1px solid ${errors.name ? vars.status.error.default : vars.line.clickable}`,
                borderRadius: "6px",
                backgroundColor: vars.background.default,
                color: vars.text.primary,
                fontFamily: "inherit",
              }}
            />
            {errors.name && (
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: vars.status.error.default,
                  marginTop: "4px",
                }}
              >
                {errors.name}
              </span>
            )}
          </div>

          {/* Date Ranges */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <DateRangeInput
              label="신규 개설 신청 기간 *"
              startValue={formData.periods.applicationStart}
              endValue={formData.periods.applicationEnd}
              onStartChange={(value) => updatePeriod("applicationStart", value)}
              onEndChange={(value) => updatePeriod("applicationEnd", value)}
              startError={errors.applicationStart}
              endError={errors.applicationEnd}
            />

            <DateRangeInput
              label="부원 모집 기간 *"
              startValue={formData.periods.recruitmentStart}
              endValue={formData.periods.recruitmentEnd}
              onStartChange={(value) => updatePeriod("recruitmentStart", value)}
              onEndChange={(value) => updatePeriod("recruitmentEnd", value)}
              startError={errors.recruitmentStart}
              endError={errors.recruitmentEnd}
            />

            <DateRangeInput
              label="활동 기간 *"
              startValue={formData.periods.activityStart}
              endValue={formData.periods.activityEnd}
              onStartChange={(value) => updatePeriod("activityStart", value)}
              onEndChange={(value) => updatePeriod("activityEnd", value)}
              startError={errors.activityStart}
              endError={errors.activityEnd}
            />
          </div>

          {/* Submit Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "8px",
            }}
          >
            <Button
              type="submit"
              variant="solid"
              colorScheme="primary"
              disabled={isLoading}
            >
              {isLoading ? "생성 중..." : "챕터 생성"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function DateRangeInput({
  label,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startError,
  endError,
}: {
  label: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startError?: string;
  endError?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "14px",
          fontWeight: 500,
          color: vars.text.secondary,
          marginBottom: "8px",
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div>
          <input
            type="date"
            value={startValue}
            onChange={(e) => onStartChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: `1px solid ${startError ? vars.status.error.default : vars.line.clickable}`,
              borderRadius: "6px",
              backgroundColor: vars.background.default,
              color: vars.text.primary,
              fontFamily: "inherit",
            }}
          />
          {startError && (
            <span
              style={{
                display: "block",
                fontSize: "12px",
                color: vars.status.error.default,
                marginTop: "4px",
              }}
            >
              {startError}
            </span>
          )}
        </div>
        <div>
          <input
            type="date"
            value={endValue}
            onChange={(e) => onEndChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: `1px solid ${endError ? vars.status.error.default : vars.line.clickable}`,
              borderRadius: "6px",
              backgroundColor: vars.background.default,
              color: vars.text.primary,
              fontFamily: "inherit",
            }}
          />
          {endError && (
            <span
              style={{
                display: "block",
                fontSize: "12px",
                color: vars.status.error.default,
                marginTop: "4px",
              }}
            >
              {endError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ChapterEditForm({
  chapter,
  onSubmit,
  onCancel,
  isLoading,
}: {
  chapter: Chapter;
  onSubmit: (data: UpdateChapterDto) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  // ISO 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDateForInput = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<UpdateChapterDto>({
    name: chapter.name,
    periods: {
      applicationStart: formatDateForInput(chapter.periods.applicationStart),
      applicationEnd: formatDateForInput(chapter.periods.applicationEnd),
      recruitmentStart: formatDateForInput(chapter.periods.recruitmentStart),
      recruitmentEnd: formatDateForInput(chapter.periods.recruitmentEnd),
      activityStart: formatDateForInput(chapter.periods.activityStart),
      activityEnd: formatDateForInput(chapter.periods.activityEnd),
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.name && !formData.name.trim()) {
      newErrors.name = "챕터 이름을 입력해주세요.";
    }

    if (formData.periods) {
      const periods = formData.periods;

      // 날짜 순서 검증
      if (periods.applicationStart && periods.applicationEnd) {
        if (new Date(periods.applicationEnd) < new Date(periods.applicationStart)) {
          newErrors.applicationEnd = "종료일은 시작일 이후여야 합니다.";
        }
      }

      if (periods.applicationEnd && periods.recruitmentStart) {
        if (new Date(periods.recruitmentStart) <= new Date(periods.applicationEnd)) {
          newErrors.recruitmentStart = "부원 모집 시작일은 신청 종료일 이후여야 합니다.";
        }
      }

      if (periods.recruitmentStart && periods.recruitmentEnd) {
        if (new Date(periods.recruitmentEnd) < new Date(periods.recruitmentStart)) {
          newErrors.recruitmentEnd = "종료일은 시작일 이후여야 합니다.";
        }
      }

      if (periods.recruitmentEnd && periods.activityStart) {
        if (new Date(periods.activityStart) <= new Date(periods.recruitmentEnd)) {
          newErrors.activityStart = "활동 시작일은 부원 모집 종료일 이후여야 합니다.";
        }
      }

      if (periods.activityStart && periods.activityEnd) {
        if (new Date(periods.activityEnd) < new Date(periods.activityStart)) {
          newErrors.activityEnd = "종료일은 시작일 이후여야 합니다.";
        }
        // 활동 기간이 약 60일인지 확인 (50-70일 범위 허용)
        const activityDays =
          (new Date(periods.activityEnd).getTime() -
            new Date(periods.activityStart).getTime()) /
          (1000 * 60 * 60 * 24);
        if (activityDays < 50 || activityDays > 70) {
          newErrors.activityEnd = "활동 기간은 약 2개월(50-70일)이어야 합니다.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // 날짜를 ISO string으로 변환
      const convertToISO = (dateStr: string | undefined) => {
        if (!dateStr) return undefined;
        const date = new Date(dateStr);
        return date.toISOString();
      };

      // 종료일을 23:59:59.999로 설정
      const convertToEndOfDay = (dateStr: string | undefined) => {
        if (!dateStr) return undefined;
        // YYYY-MM-DD 형식에서 날짜 부분만 추출
        const dateOnly = dateStr.split('T')[0];
        return `${dateOnly}T23:59:59.999Z`;
      };

      // 모든 필드를 전송 (빈 값 제외)
      const submitData: UpdateChapterDto = {};
      
      // 이름 전송
      if (formData.name) {
        submitData.name = formData.name.trim();
      }
      
      // periods 전송
      if (formData.periods) {
        const periods: UpdateChapterDto["periods"] = {};
        
        if (formData.periods.applicationStart) {
          periods.applicationStart = convertToISO(formData.periods.applicationStart);
        }
        if (formData.periods.applicationEnd) {
          periods.applicationEnd = convertToEndOfDay(formData.periods.applicationEnd);
        }
        if (formData.periods.recruitmentStart) {
          periods.recruitmentStart = convertToISO(formData.periods.recruitmentStart);
        }
        if (formData.periods.recruitmentEnd) {
          periods.recruitmentEnd = convertToEndOfDay(formData.periods.recruitmentEnd);
        }
        if (formData.periods.activityStart) {
          periods.activityStart = convertToISO(formData.periods.activityStart);
        }
        if (formData.periods.activityEnd) {
          periods.activityEnd = convertToEndOfDay(formData.periods.activityEnd);
        }
        
        // periods에 값이 하나라도 있으면 포함
        if (Object.keys(periods).length > 0) {
          submitData.periods = periods;
        }
      }
      
      console.log("📤 수정 요청 데이터:", JSON.stringify(submitData, null, 2));
      console.log("📤 수정 요청 데이터 (원본):", submitData);
      
      // 빈 객체 체크
      if (Object.keys(submitData).length === 0) {
        alert("수정할 내용이 없습니다.");
        return;
      }
      
      // periods가 빈 객체인지 체크
      if (submitData.periods && Object.keys(submitData.periods).length === 0) {
        delete submitData.periods;
      }
      
      // 최종 체크
      if (Object.keys(submitData).length === 0) {
        alert("수정할 내용이 없습니다.");
        return;
      }
      
      onSubmit(submitData);
    }
  };

  const updatePeriod = (
    field: keyof NonNullable<UpdateChapterDto["periods"]>,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      periods: {
        ...prev.periods,
        [field]: value,
      },
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "24px",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: vars.background.default,
          border: `1px solid ${vars.line.clickable}`,
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 700,
            color: vars.text.primary,
            marginBottom: "20px",
          }}
        >
          챕터 수정
        </h2>
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Chapter Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: vars.text.secondary,
                  marginBottom: "8px",
                }}
              >
                챕터 이름
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  if (errors.name) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.name;
                      return newErrors;
                    });
                  }
                }}
                placeholder="예: 2026년 1-2월 챕터"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "14px",
                  border: `1px solid ${errors.name ? vars.status.error.default : vars.line.clickable}`,
                  borderRadius: "6px",
                  backgroundColor: vars.background.default,
                  color: vars.text.primary,
                  fontFamily: "inherit",
                }}
              />
              {errors.name && (
                <span
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: vars.status.error.default,
                    marginTop: "4px",
                  }}
                >
                  {errors.name}
                </span>
              )}
            </div>

            {/* Date Ranges */}
            {formData.periods && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <DateRangeInput
                  label="신규 개설 신청 기간"
                  startValue={formData.periods.applicationStart || ""}
                  endValue={formData.periods.applicationEnd || ""}
                  onStartChange={(value) => updatePeriod("applicationStart", value)}
                  onEndChange={(value) => updatePeriod("applicationEnd", value)}
                  startError={errors.applicationStart}
                  endError={errors.applicationEnd}
                />

                <DateRangeInput
                  label="부원 모집 기간"
                  startValue={formData.periods.recruitmentStart || ""}
                  endValue={formData.periods.recruitmentEnd || ""}
                  onStartChange={(value) => updatePeriod("recruitmentStart", value)}
                  onEndChange={(value) => updatePeriod("recruitmentEnd", value)}
                  startError={errors.recruitmentStart}
                  endError={errors.recruitmentEnd}
                />

                <DateRangeInput
                  label="활동 기간"
                  startValue={formData.periods.activityStart || ""}
                  endValue={formData.periods.activityEnd || ""}
                  onStartChange={(value) => updatePeriod("activityStart", value)}
                  onEndChange={(value) => updatePeriod("activityEnd", value)}
                  startError={errors.activityStart}
                  endError={errors.activityEnd}
                />
              </div>
            )}

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <Button
                type="button"
                variant="outline"
                colorScheme="secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="solid"
                colorScheme="primary"
                disabled={isLoading}
              >
                {isLoading ? "수정 중..." : "수정"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChapterDeleteConfirmation({
  chapter,
  onConfirm,
  onCancel,
  isLoading,
}: {
  chapter: Chapter;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "24px",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: vars.background.default,
          border: `1px solid ${vars.line.clickable}`,
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "400px",
          width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 700,
            color: vars.text.primary,
            marginBottom: "12px",
          }}
        >
          챕터 삭제 확인
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: vars.text.secondary,
            marginBottom: "24px",
            lineHeight: "20px",
          }}
        >
          정말로 <strong>{chapter.name}</strong> 챕터를 삭제하시겠습니까?
          <br />
          이 작업은 되돌릴 수 없습니다.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <Button
            type="button"
            variant="outline"
            colorScheme="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="solid"
            colorScheme="error"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "삭제 중..." : "삭제"}
          </Button>
        </div>
      </div>
    </div>
  );
}
