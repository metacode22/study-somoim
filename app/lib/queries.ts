import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getGroups,
  getGroupById,
  getCurrentChapter,
  getTeams,
  createApplication,
  type CreateApplicationDto,
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

export const currentChapterQueryOptions = queryOptions({
  queryKey: ["chapters", "current"],
  queryFn: getCurrentChapter,
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
