"use client";

import { Eye, PencilLine, Users } from "lucide-react";

import { buildPresenceNotice, summarizePresence, type PresenceTarget, type PresenceUser } from "@/lib/realtime/presence";

type PresenceBarProps = {
  target?: PresenceTarget | null;
  users: PresenceUser[];
};

export function PresenceBar({ target, users }: PresenceBarProps) {
  if (users.length === 0) {
    return null;
  }

  const summary = summarizePresence(users, target);
  const notice = buildPresenceNotice(summary);
  const editors = summary.editing.length;
  const viewers = Math.max(0, summary.viewing.length - editors);
  const visibleEmails = Array.from(
    new Set([...summary.editing, ...summary.viewing].map((user) => user.actorEmail).filter(Boolean))
  );

  if (!notice) {
    return null;
  }

  return (
    <aside className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-950 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700">
          {editors > 0 ? <PencilLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="font-bold">{notice}</p>
          <p className="mt-0.5 text-xs font-medium text-blue-700">
            {visibleEmails.length > 0
              ? `Identidad verificada: ${visibleEmails.slice(0, 2).join(", ")}${visibleEmails.length > 2 ? " y más" : ""}.`
              : "Puedes continuar editando; si hay cambios guardados se revisaran antes de sobrescribir."}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-blue-700">
        <Users className="h-4 w-4" />
        {editors} editando - {viewers} viendo
      </div>
    </aside>
  );
}
