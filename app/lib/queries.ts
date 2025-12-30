import { queryOptions } from "@tanstack/react-query";
import { getGroups, getGroupById } from "./api";

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
