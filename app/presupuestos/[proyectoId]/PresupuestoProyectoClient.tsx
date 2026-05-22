"use client";

import { Suspense } from "react";

import { PresupuestosLoading, PresupuestosWorkspace } from "../PresupuestosWorkspace";

export default function PresupuestoProyectoPage({
  params
}: {
  params: { proyectoId: string };
}) {
  return (
    <Suspense fallback={<PresupuestosLoading />}>
      <PresupuestosWorkspace requestedProjectId={params.proyectoId} />
    </Suspense>
  );
}
