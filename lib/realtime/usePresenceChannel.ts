"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { createBrowserClient } from "@/lib/supabase/browser";

import type { ActivityTopicScope } from "./activity";
import { bindRealtimeAuth } from "./auth";
import {
  buildPresenceTopic,
  getPresenceActorIds,
  parsePresenceState,
  type CollaborationPresenceState,
  type PresenceProfile,
  type PresenceTarget,
  type PresenceUser
} from "./presence";

type UsePresenceChannelOptions = {
  editing?: PresenceTarget | null;
  enabled?: boolean;
  page: string;
  topicScope?: ActivityTopicScope;
  viewing?: PresenceTarget | null;
};

export type PresenceConnectionStatus = "idle" | "connecting" | "connected" | "error";

export function usePresenceChannel({
  editing,
  enabled = true,
  page,
  topicScope,
  viewing
}: UsePresenceChannelOptions) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [status, setStatus] = useState<PresenceConnectionStatus>("idle");
  const localStateRef = useRef<CollaborationPresenceState | null>(null);
  const channelRef = useRef<unknown>(null);
  const currentActorIdRef = useRef<string | undefined>();
  const targetRef = useRef({ editing, page, viewing });

  const targetKey = useMemo(
    () => JSON.stringify({ editing: editing || null, page, viewing: viewing || null }),
    [editing, page, viewing]
  );

  useEffect(() => {
    targetRef.current = { editing, page, viewing };
  }, [editing, page, targetKey, viewing]);

  useEffect(() => {
    if (!enabled || !topicScope) {
      setStatus("idle");
      setUsers([]);
      localStateRef.current = null;
      return undefined;
    }

    const supabase = createBrowserClient();
    const topic = buildPresenceTopic(topicScope);
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let isCancelled = false;
    const unbindRealtimeAuth = bindRealtimeAuth(supabase);

    const loadPresenceUsers = async (presenceState: Record<string, unknown[]>) => {
      const actorIds = getPresenceActorIds(presenceState, currentActorIdRef.current);
      let profiles: Record<string, PresenceProfile> = {};

      if (actorIds.length > 0) {
        const { data } = await supabase
          .from("user_profiles")
          .select("user_id,email,email_verified,display_name")
          .in("user_id", actorIds);

        profiles = Object.fromEntries((data || []).map((profile) => [profile.user_id, profile]));
      }

      if (!isCancelled) {
        setUsers(parsePresenceState(presenceState, currentActorIdRef.current, profiles));
      }
    };

    const setupChannel = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!session?.access_token || !user) {
        if (!isCancelled) {
          setStatus("idle");
        }
        return;
      }

      if (isCancelled) {
        return;
      }

      currentActorIdRef.current = user.id;
      localStateRef.current = {
        actorId: user.id,
        editing: targetRef.current.editing || null,
        lastSeenAt: new Date().toISOString(),
        page: targetRef.current.page,
        viewing: targetRef.current.viewing || null
      };

      channel = supabase.channel(topic, {
        config: {
          presence: { key: user.id },
          private: true
        }
      });
      channelRef.current = channel;

      channel.on("presence", { event: "sync" }, () => {
        const presenceState = (channel as unknown as { presenceState: () => Record<string, unknown[]> }).presenceState();
        void loadPresenceUsers(presenceState);
      });

      setStatus("connecting");
      channel.subscribe(async (nextStatus) => {
        if (isCancelled) {
          return;
        }

        if (nextStatus === "SUBSCRIBED") {
          setStatus("connected");
          if (localStateRef.current) {
            await channel?.track(localStateRef.current);
          }
          return;
        }

        setStatus(nextStatus === "CHANNEL_ERROR" ? "error" : "connecting");
      });
    };

    void setupChannel();

    return () => {
      isCancelled = true;
      unbindRealtimeAuth();
      setUsers([]);
      channelRef.current = null;
      localStateRef.current = null;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [enabled, topicScope]);

  useEffect(() => {
    const channel = channelRef.current as { track?: (payload: CollaborationPresenceState) => Promise<unknown> } | null;
    const current = localStateRef.current;

    if (!channel?.track || !current || status !== "connected") {
      return;
    }

    localStateRef.current = {
      ...current,
      editing: editing || null,
      lastSeenAt: new Date().toISOString(),
      page,
      viewing: viewing || null
    };
    void channel.track(localStateRef.current);
  }, [editing, page, status, targetKey, viewing]);

  return {
    status,
    users
  };
}
