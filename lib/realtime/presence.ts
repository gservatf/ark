import type { ActivityTopicScope } from "./activity";
import { buildActivityTopic } from "./activity";

export type PresenceTarget = {
  id: string;
  label: string;
  type: string;
};

export type CollaborationPresenceState = {
  actorId: string;
  editing?: PresenceTarget | null;
  lastSeenAt: string;
  page: string;
  viewing?: PresenceTarget | null;
};

export type PresenceUser = CollaborationPresenceState & {
  actorEmail?: string | null;
  actorName: string;
  emailVerified?: boolean;
  presenceId: string;
};

export type PresenceSummary = {
  editing: PresenceUser[];
  viewing: PresenceUser[];
};

type RawPresenceState = Record<string, unknown[]>;

export type PresenceProfile = {
  display_name?: string | null;
  email?: string | null;
  email_verified?: boolean | null;
  user_id: string;
};

export function buildPresenceTopic(scope: ActivityTopicScope) {
  return `presence:${buildActivityTopic(scope)}`;
}

export function resolvePresenceIdentity(actorId: string, profiles: Record<string, PresenceProfile> = {}) {
  const profile = profiles[actorId];
  const emailVerified = Boolean(profile?.email_verified);
  const actorName = emailVerified ? profile?.display_name?.trim() || "Usuario colaborador" : "Usuario colaborador";
  const actorEmail = emailVerified && profile?.email?.trim() ? profile.email.trim() : null;

  return {
    actorEmail,
    actorName,
    emailVerified: Boolean(emailVerified && actorEmail)
  };
}

export function parsePresenceState(
  state: RawPresenceState,
  currentActorId?: string,
  profiles: Record<string, PresenceProfile> = {}
): PresenceUser[] {
  return Object.entries(state).flatMap(([presenceId, values]) =>
    values.flatMap((value) => {
      if (!isPresenceState(value)) {
        return [];
      }

      if (value.actorId === currentActorId) {
        return [];
      }

      return [
        {
          ...value,
          ...resolvePresenceIdentity(value.actorId, profiles),
          presenceId
        }
      ];
    })
  );
}

export function getPresenceActorIds(state: RawPresenceState, currentActorId?: string) {
  return Array.from(
    new Set(
      Object.values(state)
        .flatMap((values) => values)
        .filter(isPresenceState)
        .map((value) => value.actorId)
        .filter((actorId) => actorId !== currentActorId)
    )
  );
}

export function summarizePresence(users: PresenceUser[], target?: PresenceTarget | null): PresenceSummary {
  if (!target) {
    return {
      editing: users.filter((user) => Boolean(user.editing)),
      viewing: users.filter((user) => Boolean(user.viewing))
    };
  }

  return {
    editing: users.filter((user) => sameTarget(user.editing, target)),
    viewing: users.filter((user) => sameTarget(user.viewing, target))
  };
}

export function buildPresenceNotice(summary: PresenceSummary) {
  if (summary.editing.length > 0) {
    const names = formatNames(summary.editing.map((user) => user.actorName));
    const target = summary.editing[0]?.editing?.label || "este registro";

    return `${names} ${summary.editing.length === 1 ? "está" : "están"} editando ${target}.`;
  }

  if (summary.viewing.length > 0) {
    const names = formatNames(summary.viewing.map((user) => user.actorName));

    return `${names} ${summary.viewing.length === 1 ? "está" : "están"} viendo esta vista.`;
  }

  return null;
}

function formatNames(names: string[]) {
  const unique = Array.from(new Set(names));

  if (unique.length <= 2) {
    return unique.join(" y ");
  }

  return `${unique.slice(0, 2).join(", ")} y ${unique.length - 2} más`;
}

function sameTarget(left?: PresenceTarget | null, right?: PresenceTarget | null) {
  return Boolean(left && right && left.id === right.id && left.type === right.type);
}

function isPresenceState(value: unknown): value is CollaborationPresenceState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.actorId === "string" &&
    typeof record.lastSeenAt === "string" &&
    typeof record.page === "string"
  );
}
