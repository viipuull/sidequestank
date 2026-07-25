import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listEvents,
  getEventBySlug,
  getMyEventProgress,
  joinEvent,
  listActiveChallenges,
  getMyChallenges,
  listMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  listActiveAnnouncements,
  listFeaturedQuests,
} from "@/lib/liveops.functions";

export function useLiveEvents(status: "live" | "scheduled" | "ended" | "all" = "all") {
  const fn = useServerFn(listEvents);
  return useQuery({ queryKey: ["events", status], queryFn: () => fn({ data: { status } }) });
}

export function useEventDetail(slug: string) {
  const fn = useServerFn(getEventBySlug);
  return useQuery({ queryKey: ["event", slug], enabled: !!slug, queryFn: () => fn({ data: { slug } }) });
}

export function useMyEventProgress(eventId: string | undefined, enabled = true) {
  const fn = useServerFn(getMyEventProgress);
  return useQuery({
    queryKey: ["my-event-progress", eventId],
    enabled: enabled && !!eventId,
    queryFn: () => fn({ data: { event_id: eventId! } }),
  });
}

export function useJoinEvent() {
  const fn = useServerFn(joinEvent);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (event_id: string) => fn({ data: { event_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["event"] });
      qc.invalidateQueries({ queryKey: ["my-event-progress"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useActiveChallenges() {
  const fn = useServerFn(listActiveChallenges);
  return useQuery({ queryKey: ["challenges-active"], queryFn: () => fn() });
}

export function useMyChallenges(enabled = true) {
  const fn = useServerFn(getMyChallenges);
  return useQuery({ queryKey: ["my-challenges"], enabled, queryFn: () => fn() });
}

export function useMyNotifications(enabled = true) {
  const fn = useServerFn(listMyNotifications);
  return useQuery({
    queryKey: ["notifications"], enabled, queryFn: () => fn({ data: { limit: 50 } }),
  });
}

export function useUnreadNotifCount(enabled = true) {
  const fn = useServerFn(getUnreadCount);
  return useQuery({
    queryKey: ["notifications-unread"], enabled, queryFn: () => fn(),
    refetchInterval: 60_000,
  });
}

export function useMarkNotifRead() {
  const fn = useServerFn(markNotificationRead);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useMarkAllNotifRead() {
  const fn = useServerFn(markAllNotificationsRead);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useDeleteNotif() {
  const fn = useServerFn(deleteNotification);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useAnnouncements() {
  const fn = useServerFn(listActiveAnnouncements);
  return useQuery({ queryKey: ["announcements"], queryFn: () => fn() });
}

export function useFeaturedQuests() {
  const fn = useServerFn(listFeaturedQuests);
  return useQuery({ queryKey: ["featured-quests"], queryFn: () => fn() });
}