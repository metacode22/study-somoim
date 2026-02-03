import { queryOptions } from "@tanstack/react-query";
import { getGroups, getGroupById, getCurrentChapter, getChapterActivities } from "./api";

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

export const currentChapterQueryOptions = queryOptions({
  queryKey: ["chapters", "current"],
  queryFn: getCurrentChapter,
});

export const chapterActivitiesQueryOptions = (chapterId: string) =>
  queryOptions({
    queryKey: ["chapters", chapterId, "activities"],
    queryFn: () => getChapterActivities(chapterId),
    enabled: !!chapterId,
  });
