"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { createBrowserClient } from "@/lib/supabase/browser";

import { bindRealtimeAuth } from "./auth";
import {
  buildActivityTopic,
  createActivityEventDedupe,
  getActivityToastMessage,
  parseActivityRealtimePayload,
  shouldRefetchForActivity,
  type ActivityRealtimePayload,
  type ActivityTopicScope,
  type ActivityToastMessage
} from "./activity";

type UseActivitySubscriptionOptions = {
  currentActorId?: string;
  debounceMs?: number;
  enabled?: boolean;
  filter?: (payload: ActivityRealtimePayload) => boolean;
  onActivity?: (payload: ActivityRealtimePayload) => Promise<boolean> | boolean;
  onRefetch: () => Promise<void> | void;
  topicScope?: ActivityTopicScope;
};

export type ActivityConnectionStatus = "idle" | "connecting" | "connected" | "error";

export function useActivitySubscription({
  currentActorId,
  debounceMs = 600,
  enabled = true,
  filter,
  onActivity,
  onRefetch,
  topicScope
}: UseActivitySubscriptionOptions) {
  const [toasts, setToasts] = useState<Array<ActivityToastMessage & { id: string }>>([]);
  const [status, setStatus] = useState<ActivityConnectionStatus>("idle");
  const dedupe = useMemo(() => createActivityEventDedupe(), []);
  const onActivityRef = useRef(onActivity);
  const onRefetchRef = useRef(onRefetch);
  const filterRef = useRef(filter);
  const toastTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    onActivityRef.current = onActivity;
    onRefetchRef.current = onRefetch;
    filterRef.current = filter;
  }, [filter, onActivity, onRefetch]);

  useEffect(() => {
    if (!enabled || !topicScope) {
      setStatus("idle");
      return undefined;
    }

    const supabase = createBrowserClient();
    const topic = buildActivityTopic(topicScope);
    let refetchTimer: ReturnType<typeof setTimeout> | undefined;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let isCancelled = false;
    const unbindRealtimeAuth = bindRealtimeAuth(supabase);
    const scheduleRefetch = () => {
      if (isCancelled) {
        return;
      }

      if (refetchTimer) {
        clearTimeout(refetchTimer);
      }

      refetchTimer = setTimeout(() => {
        if (!isCancelled) {
          void onRefetchRef.current();
        }
      }, debounceMs);
    };

    const setupChannel = async () => {
      if (isCancelled) {
        return;
      }

      channel = supabase
        .channel(topic, {
          config: {
            broadcast: { self: false },
            private: true
          }
        })
        .on("broadcast", { event: "activity_event" }, (message) => {
          const payload = parseActivityRealtimePayload(message.payload);

          if (!payload || !dedupe(payload.activityEventId)) {
            return;
          }

          if (filterRef.current && !filterRef.current(payload)) {
            return;
          }

          const shouldRefetchExternalActivity = shouldRefetchForActivity(payload, currentActorId);

          if (!shouldRefetchExternalActivity) {
            return;
          }

          const toast = getActivityToastMessage(payload);
          const toastId = payload.activityEventId;
          setToasts((current) => [
            ...current.slice(-2),
            {
              ...toast,
              id: toastId
            }
          ]);
          const existingToastTimer = toastTimersRef.current.get(toastId);

          if (existingToastTimer) {
            clearTimeout(existingToastTimer);
          }

          const toastTimer = setTimeout(() => {
            toastTimersRef.current.delete(toastId);
            setToasts((current) => current.filter((item) => item.id !== toastId));
          }, 5000);
          toastTimersRef.current.set(toastId, toastTimer);

          const handleActivity = async () => {
            try {
              const handled = await onActivityRef.current?.(payload);

              if (handled) {
                return;
              }
            } catch {
              // If the local patch fails, fall back to the conservative refetch path.
            }

            scheduleRefetch();
          };

          void handleActivity();
        });

      setStatus("connecting");
      channel.subscribe((nextStatus) => {
        if (isCancelled) {
          return;
        }

        setStatus(nextStatus === "SUBSCRIBED" ? "connected" : nextStatus === "CHANNEL_ERROR" ? "error" : "connecting");
      });
    };

    void setupChannel();

    return () => {
      isCancelled = true;
      unbindRealtimeAuth();

      if (refetchTimer) {
        clearTimeout(refetchTimer);
      }

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [currentActorId, debounceMs, dedupe, enabled, topicScope]);

  useEffect(() => {
    const toastTimers = toastTimersRef.current;

    return () => {
      toastTimers.forEach((timer) => clearTimeout(timer));
      toastTimers.clear();
    };
  }, []);

  return {
    dismissToast: (id: string) => {
      const timer = toastTimersRef.current.get(id);

      if (timer) {
        clearTimeout(timer);
        toastTimersRef.current.delete(id);
      }

      setToasts((current) => current.filter((toast) => toast.id !== id));
    },
    status,
    toasts
  };
}
