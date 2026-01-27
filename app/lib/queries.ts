import { queryOptions } from "@tanstack/react-query";
import {
  getGroups,
  getGroupById,
  getAdminGroups,
  getGroupsByRecruitmentStatus,
  getChapters,
  getCurrentChapter,
  createChapter,
  type CreateChapterDto,
} from "./api";

export const groupsQueryOptions = queryOptions({
  queryKey: ["groups"],
  queryFn: getGroups,
});

export const groupQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["groups", id],
    queryFn: () => getGroupById(id),
    enabled: !!id,
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

export const currentChapterQueryOptions = queryOptions({
  queryKey: ["chapters", "current"],
  queryFn: getCurrentChapter,
});
