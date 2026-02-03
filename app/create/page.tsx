"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@teamsparta/stack-button";
import { vars } from "@teamsparta/stack-tokens";
import {
  useCurrentChapter,
  useTeams,
  useCreateApplication,
} from "../lib/queries";
import type { ApplicationGroupType } from "../lib/api";

const GROUP_TYPE_OPTIONS: { value: ApplicationGroupType; label: string }[] = [
  { value: "study_company", label: "스터디(전사 구성원 대상)" },
  { value: "study_team", label: "스터디(팀/파트/스쿼드 대상)" },
  { value: "somoim", label: "소모임" },
];

const CATEGORY_OPTIONS = [
  "개발",
  "디자인",
  "스포츠",
  "문화",
  "취미",
  "언어",
  "기타",
];

const DAY_OPTIONS = [
  { value: "월", label: "월" },
  { value: "화", label: "화" },
  { value: "수", label: "수" },
  { value: "목", label: "목" },
  { value: "금", label: "금" },
  { value: "토", label: "토" },
  { value: "일", label: "일" },
  { value: "일정변동", label: "일정 변동" },
];

interface FormState {
  teamId: string;
  type: ApplicationGroupType;
  category: string;
  name: string;
  description: string;
  capacity: string;
  hashtags: string;
  day: string;
  time: string;
  meetingLocation: string;
  operationPlan: string;
  thumbnailFile: File | null;
  extraPhotosFiles: FileList | null;
}

const initialForm: FormState = {
  teamId: "",
  type: "somoim",
  category: "",
  name: "",
  description: "",
  capacity: "",
  hashtags: "",
  day: "",
  time: "",
  meetingLocation: "",
  operationPlan: "",
  thumbnailFile: null,
  extraPhotosFiles: null,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  border: `1px solid ${vars.line.clickable}`,
  borderRadius: "8px",
  backgroundColor: vars.background.default,
  color: vars.text.primary,
  outline: "none",
} as const;

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: vars.text.primary,
  marginBottom: "6px",
} as const;

export default function CreatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: chapter, isLoading: chapterLoading } = useCurrentChapter();
  const { data: teams = [] } = useTeams();
  const createMutation = useCreateApplication(chapter?._id ?? "");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(initialForm);

  const isApplicationPhase = chapter?.currentPhase === "application";
  const canSubmit = Boolean(
    session?.user?.id &&
      chapter?._id &&
      isApplicationPhase &&
      form.teamId &&
      form.type &&
      form.name &&
      form.operationPlan &&
      form.day &&
      form.time &&
      form.meetingLocation
  );

  const update = (partial: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = async () => {
    if (!session?.user?.id || !chapter?._id || !canSubmit) return;
    const meetingSchedule = form.day
      ? `매주 ${form.day} ${form.time || ""}`.trim()
      : form.time;
    const operationPlanWithCapacity = form.capacity
      ? `[모집 정원: ${form.capacity}명]\n\n${form.operationPlan}`
      : form.operationPlan;
    const descriptionWithHashtags = form.hashtags
      ? [form.description, form.hashtags].filter(Boolean).join(" ")
      : form.description;

    createMutation.mutate(
      {
        body: {
          leaderId: session.user.id,
          teamId: form.teamId,
          type: form.type,
          name: form.name,
          operationPlan: operationPlanWithCapacity,
          meetingSchedule,
          meetingLocation: form.meetingLocation,
          description: descriptionWithHashtags || undefined,
          category: form.category || undefined,
        },
        userId: session.user.id,
      },
      {
        onSuccess: () => router.push("/"),
        onError: (err) => {
          console.error(err);
          alert("신청에 실패했습니다. 다시 시도해주세요.");
        },
      }
    );
  };

  if (status === "loading" || chapterLoading) {
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
        <span style={{ color: vars.text.tertiary }}>로딩 중...</span>
      </div>
    );
  }

  if (!session) {
    router.replace("/login");
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: vars.background.default,
      }}
    >
      <main
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "40px 24px 60px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                color: vars.text.primary,
              }}
            >
              새 스터디/소모임 개설 신청
            </h1>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "14px",
                color: vars.text.tertiary,
              }}
            >
              관리자 승인 후 스터디/소모임이 개설됩니다.
            </p>
          </div>
          <Button
            variant="solid"
            colorScheme="primary"
            size="md"
            disabled={!canSubmit || createMutation.isPending}
            onClick={handleSubmit}
          >
            {createMutation.isPending ? "제출 중..." : "신청하기"}
          </Button>
        </div>

        {!chapter && !chapterLoading && (
          <div
            style={{
              padding: "16px",
              backgroundColor: vars.background.subtle,
              border: `1px solid ${vars.line.nonClickable}`,
              borderRadius: "8px",
              fontSize: "14px",
              color: vars.text.secondary,
            }}
          >
            현재 챕터 정보를 불러올 수 없습니다.
          </div>
        )}
        {chapter && !isApplicationPhase && (
          <div
            style={{
              padding: "16px",
              backgroundColor: `${vars.status.error.default}15`,
              border: `1px solid ${vars.status.error.default}`,
              borderRadius: "8px",
              fontSize: "14px",
              color: vars.status.error.default,
            }}
          >
            개설 신청 기간이 아닙니다. 현재 챕터: {chapter.name}
          </div>
        )}

        {/* Step indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
          }}
        >
          {[
            { num: 1, label: "기본 정보" },
            { num: 2, label: "일정 정보" },
            { num: 3, label: "소개 정보" },
          ].map((s, i) => (
            <div
              key={s.num}
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor:
                      step === s.num
                        ? vars.status.error.default
                        : vars.background.subtle,
                    border: `2px solid ${
                      step === s.num
                        ? vars.status.error.default
                        : vars.line.nonClickable
                    }`,
                    color: step === s.num ? "#fff" : vars.text.tertiary,
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {s.num}
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: step === s.num ? 700 : 500,
                    color:
                      step === s.num
                        ? vars.text.primary
                        : vars.text.tertiary,
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div
                  style={{
                    flex: 1,
                    height: "2px",
                    backgroundColor: vars.line.nonClickable,
                    margin: "0 12px",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
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
              기본 정보
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div>
                <label style={labelStyle}>
                  유형 <span style={{ color: vars.status.error.default }}>*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    update({ type: e.target.value as ApplicationGroupType })
                  }
                  style={inputStyle}
                >
                  <option value="">개설 유형을 선택해주세요.</option>
                  {GROUP_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  카테고리{" "}
                  <span style={{ color: vars.status.error.default }}>*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => update({ category: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">카테고리를 선택해주세요.</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>
                소속 팀{" "}
                <span style={{ color: vars.status.error.default }}>*</span>
              </label>
              <select
                value={form.teamId}
                onChange={(e) => update({ teamId: e.target.value })}
                style={inputStyle}
              >
                <option value="">팀을 선택해주세요.</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                스터디/소모임명{" "}
                <span style={{ color: vars.status.error.default }}>*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="소모임/스터디 명을 입력해주세요."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>소모임/스터디 설명</label>
              <textarea
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="소모임/스터디 간략히 설명을 작성해주세요."
                rows={4}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "80px",
                }}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div>
                <label style={labelStyle}>
                  모집 정원{" "}
                  <span style={{ color: vars.status.error.default }}>*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => update({ capacity: e.target.value })}
                  placeholder="모집 정원을 입력해주세요."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>해시태그</label>
                <input
                  type="text"
                  value={form.hashtags}
                  onChange={(e) => update({ hashtags: e.target.value })}
                  placeholder="소모임/스터디의 키워드를 해시태그로 입력해주세요. (최대 3개)"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="solid"
                colorScheme="primary"
                size="md"
                onClick={() => setStep(2)}
              >
                다음
              </Button>
            </div>
          </section>
        )}

        {/* Step 2: 일정 정보 */}
        {step === 2 && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
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
              일정 정보
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div>
                <label style={labelStyle}>
                  진행 요일{" "}
                  <span style={{ color: vars.status.error.default }}>*</span>
                </label>
                <select
                  value={form.day}
                  onChange={(e) => update({ day: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">요일 선택</option>
                  {DAY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  시간{" "}
                  <span style={{ color: vars.status.error.default }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => update({ time: e.target.value })}
                  placeholder="예) 09:00 - 21:00"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>
                장소{" "}
                <span style={{ color: vars.status.error.default }}>*</span>
              </label>
              <input
                type="text"
                value={form.meetingLocation}
                onChange={(e) => update({ meetingLocation: e.target.value })}
                placeholder="소모임/스터디 장소를 입력해주세요."
                style={inputStyle}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Button
                variant="outline"
                colorScheme="secondary"
                size="md"
                onClick={() => setStep(1)}
              >
                이전
              </Button>
              <Button
                variant="solid"
                colorScheme="primary"
                size="md"
                onClick={() => setStep(3)}
              >
                다음
              </Button>
            </div>
          </section>
        )}

        {/* Step 3: 소개 정보 */}
        {step === 3 && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
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
              소개 정보
            </h2>
            <div>
              <label style={labelStyle}>
                소개글{" "}
                <span style={{ color: vars.status.error.default }}>*</span>
              </label>
              <textarea
                value={form.operationPlan}
                onChange={(e) => update({ operationPlan: e.target.value })}
                placeholder="소모임/스터디 모집시 사용자들이 이해하기 쉽도록 소개글을 작성해주세요."
                rows={6}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "120px",
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>
                썸네일 첨부{" "}
                <span style={{ color: vars.status.error.default }}>*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  update({
                    thumbnailFile: e.target.files?.[0] ?? null,
                  })
                }
                style={inputStyle}
              />
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  color: vars.text.tertiary,
                }}
              >
                썸네일 이미지를 첨부해주세요. (API 업로드 미지원으로 현재 저장되지 않습니다)
              </p>
            </div>
            <div>
              <label style={labelStyle}>기타 사진 첨부</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  update({ extraPhotosFiles: e.target.files ?? null })
                }
                style={inputStyle}
              />
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  color: vars.text.tertiary,
                }}
              >
                사진을 첨부해주세요. (API 업로드 미지원으로 현재 저장되지 않습니다)
              </p>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Button
                variant="outline"
                colorScheme="secondary"
                size="md"
                onClick={() => setStep(2)}
              >
                이전
              </Button>
              <Button
                variant="solid"
                colorScheme="primary"
                size="md"
                disabled={!canSubmit || createMutation.isPending}
                onClick={handleSubmit}
              >
                {createMutation.isPending ? "제출 중..." : "신청하기"}
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
