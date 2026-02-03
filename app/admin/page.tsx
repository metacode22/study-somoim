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
import { createChapter, type CreateChapterDto, type Chapter, type ChapterGroup } from "../lib/api";
import { useState } from "react";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  // 챕터 목록 조회
  const { data: chapters = [] } = useQuery(chaptersQueryOptions);

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
  const allApplications = chapterApplications;
  const registeredGroups = registrations;
  const pendingGroups = chapterApplications.filter(
    (app) => !app.isRegistered && app.reviewStatus !== "rejected"
  );

  const createChapterMutation = useMutation({
    mutationFn: createChapter,
    onSuccess: (newChapter) => {
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      // 새로 생성된 챕터를 자동 선택
      setSelectedChapterId(newChapter._id);
      alert("챕터가 성공적으로 생성되었습니다.");
    },
    onError: (error: any) => {
      console.error("Chapter creation error:", error);
      let message = "챕터 생성에 실패했습니다.";
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (Array.isArray(errorData.message)) {
          message = errorData.message.join(", ");
        } else if (typeof errorData.message === "string") {
          message = errorData.message;
        } else if (errorData.error) {
          message = `${errorData.error}: ${JSON.stringify(errorData)}`;
        }
      } else if (error?.message) {
        message = error.message;
      }
      
      alert(message);
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
              챕터 선택
            </label>
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
                title="전체 신청"
                value={allApplications.length}
                color={vars.text.primary}
              />
              <StatCard
                title="부원모집 완료"
                value={registeredGroups.length}
                color={vars.status.success.default}
              />
              <StatCard
                title="부원모집 진행 중"
                value={pendingGroups.length}
                color={vars.status.processing.default}
              />
            </div>

            {/* Tabs Section - 챕터별 데이터 */}
            <Tabs.Root defaultValue="all" colorScheme="secondary">
              <Tabs.List>
                <Tabs.Trigger value="all">
                  전체 신청 ({allApplications.length})
                </Tabs.Trigger>
                <Tabs.Trigger value="completed">
                  부원모집 완료 ({registeredGroups.length})
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
                  {!isLoading && !error && allApplications.length === 0 && (
                    <EmptyState message="신청된 스터디 소모임이 없습니다" />
                  )}
                  {!isLoading &&
                    !error &&
                    allApplications.map((application) => (
                      <AdminChapterGroupCard
                        key={application._id}
                        chapterGroup={application}
                      />
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
                  {!isLoading && !error && registeredGroups.length === 0 && (
                    <EmptyState message="부원모집을 완료한 스터디 소모임이 없습니다" />
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
    groupName,
    type,
    leaderName,
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
  } = chapterGroup;

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
        <InfoRow label="리더" value={leaderName || leader || "-"} />
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
      // 날짜를 ISO 8601 형식으로 변환 (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ssZ)
      // API 문서 예시: "2026-03-01T00:00:00Z"
      const convertToISO = (dateStr: string, isEndDate: boolean = false) => {
        if (!dateStr) return "";
        
        // 날짜 유효성 검사
        const date = new Date(dateStr + "T00:00:00Z");
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date: ${dateStr}`);
        }
        
        // YYYY-MM-DD 형식을 ISO 8601 형식으로 변환
        // 시작일은 00:00:00Z, 종료일은 23:59:59Z
        const time = isEndDate ? "T23:59:59Z" : "T00:00:00Z";
        const isoString = dateStr + time;
        
        // 최종 검증: ISO 형식이 올바른지 확인
        const testDate = new Date(isoString);
        if (isNaN(testDate.getTime())) {
          throw new Error(`Invalid ISO date format: ${isoString}`);
        }
        
        return isoString;
      };

      const submitData: CreateChapterDto = {
        name: formData.name.trim(),
        periods: {
          applicationStart: convertToISO(formData.periods.applicationStart, false),
          applicationEnd: convertToISO(formData.periods.applicationEnd, true),
          recruitmentStart: convertToISO(formData.periods.recruitmentStart, false),
          recruitmentEnd: convertToISO(formData.periods.recruitmentEnd, true),
          activityStart: convertToISO(formData.periods.activityStart, false),
          activityEnd: convertToISO(formData.periods.activityEnd, true),
        },
      };
      
      // 디버깅: 요청 데이터 확인
      console.log("Chapter creation request:", JSON.stringify(submitData, null, 2));
      
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
