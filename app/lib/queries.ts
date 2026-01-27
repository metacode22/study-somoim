import { queryOptions } from "@tanstack/react-query";
import {
  getGroups,
  getGroupById,
  getCurrentChapter,
  getRecruitingGroups,
  getMyMemberships,
  getMemberships,
} from "./api";

// 현재 챕터 조회
export const currentChapterQueryOptions = queryOptions({
  queryKey: ["chapters", "current"],
  queryFn: getCurrentChapter,
});

// 그룹 목록 조회 (레거시 API)
export const groupsQueryOptions = queryOptions({
  queryKey: ["groups"],
  queryFn: getGroups,
});

// 모집 중인 그룹 목록 조회 (챕터 기반)
export const recruitingGroupsQueryOptions = (chapterId: string) =>
  queryOptions({
    queryKey: ["groups", "recruiting", chapterId],
    queryFn: () => getRecruitingGroups(chapterId),
    enabled: !!chapterId,
  });

// 그룹 상세 조회
export const groupQueryOptions = (id: string, chapterId?: string) =>
  queryOptions({
    queryKey: ["groups", id, chapterId],
    queryFn: () => getGroupById(id, chapterId),
    enabled: !!id,
  });

// 내 멤버십 목록 조회
export const myMembershipsQueryOptions = (
  chapterId: string,
  userId: string
) =>
  queryOptions({
    queryKey: ["my-applications", chapterId, userId],
    queryFn: () => getMyMemberships(chapterId, userId),
    enabled: !!chapterId && !!userId,
  });

// 그룹의 멤버십 목록 조회 (리더용)
export const membershipsQueryOptions = (
  chapterId: string,
  groupId: string,
  params?: Parameters<typeof getMemberships>[2]
) =>
  queryOptions({
    queryKey: ["memberships", chapterId, groupId, params],
    queryFn: () => getMemberships(chapterId, groupId, params),
    enabled: !!chapterId && !!groupId,
  });
