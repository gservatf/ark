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
  onRefetch: () => Promise<void> | void;
  topicScope?: ActivityTopicScope;
};

export type ActivityConnectionStatus = "idle" | "connecting" | "connected" | "error";

export function useActivitySubscription({
  currentActorId,
  debounceMs = 600,
  enabled = true,
  filter,
  onRefetch,
  topicScope
}: UseActivitySubscriptionOptions) {
  const [toasts, setToasts] = useState<Array<ActivityToastMessage & { id: string }>>([]);
  const [status, setStatus] = useState<ActivityConnectionStatus>("idle");
  const dedupe = useMemo(() => createActivityEventDedupe(), []);
  const onRefetchRef = useRef(onRefetch);
  const filterRef = useRef(filter);

  useEffect(() => {
    onRefetchRef.current = onRefetch;
    filterRef.current = filter;
  }, [filter, onRefetch]);

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
          setToasts((current) => [
            ...current.slice(-2),
            {
              ...toast,
              id: payload.activityEventId
            }
          ]);

          if (refetchTimer) {
            clearTimeout(refetchTimer);
          }

          refetchTimer = setTimeout(() => {
            void onRefetchRef.current();
          }, debounceMs);
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

  return {
    dismissToast: (id: string) => setToasts((current) => current.filter((toast) => toast.id !== id)),
    status,
    toasts
  };
}
