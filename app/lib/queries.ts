import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getGroups,
  getGroupById,
  getAdminGroups,
  getGroupsByRecruitmentStatus,
  getChapters,
  getCurrentChapter,
  getRecruitingGroups,
  getMyMemberships,
  getMemberships,
  getTeams,
  createApplication,
  getChapterApplications,
  getChapterRegistrations,
  type CreateApplicationDto,
  type GroupType,
  type ReviewStatus,
} from "./api";

// 현재 챕터 조회
export const currentChapterQueryOptions = queryOptions({
  queryKey: ["chapters", "current"],
  queryFn: getCurrentChapter,
});

// 그룹 목록 조회 (레거시 API)
export const groupsQueryOptions = queryOptions({
  queryKey: ["groups"],
  queryFn: () => getGroups(),
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
export const myMembershipsQueryOptions = (chapterId: string, userId: string) =>
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

export const adminGroupsQueryOptions = queryOptions({
  queryKey: ["admin", "groups"],
  queryFn: getAdminGroups,
});

export const groupsByRecruitmentStatusQueryOptions = (completed: boolean) =>
  queryOptions({
    queryKey: ["admin", "groups", "recruitment", completed],
    queryFn: () => getGroupsByRecruitmentStatus(completed),
  });

export const chaptersQueryOptions = queryOptions({
  queryKey: ["chapters"],
  queryFn: getChapters,
});

export const teamsQueryOptions = queryOptions({
  queryKey: ["teams"],
  queryFn: getTeams,
});

export function useCurrentChapter() {
  return useQuery(currentChapterQueryOptions);
}

export function useTeams() {
  return useQuery(teamsQueryOptions);
}

export function useCreateApplication(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      userId,
    }: {
      body: CreateApplicationDto;
      userId: string;
    }) => createApplication(chapterId, body, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapters", chapterId] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export const chapterApplicationsQueryOptions = (
  chapterId: string,
  params?: {
    page?: number;
    limit?: number;
    type?: GroupType;
    reviewStatus?: ReviewStatus;
    search?: string;
  }
) =>
  queryOptions({
    queryKey: ["chapters", chapterId, "applications", params],
    queryFn: () => getChapterApplications(chapterId, params),
    enabled: !!chapterId,
  });

export const chapterRegistrationsQueryOptions = (chapterId: string) =>
  queryOptions({
    queryKey: ["chapters", chapterId, "registrations"],
    queryFn: () => getChapterRegistrations(chapterId),
    enabled: !!chapterId,
  });
