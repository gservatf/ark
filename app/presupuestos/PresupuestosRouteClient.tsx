"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { PresupuestosLoading, PresupuestosWorkspace } from "./PresupuestosWorkspace";

export default function PresupuestosPage() {
  return (
    <Suspense fallback={<PresupuestosLoading />}>
      <PresupuestosRouteGate />
    </Suspense>
  );
}

function PresupuestosRouteGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryProjectId = searchParams.get("proyecto");

  useEffect(() => {
    if (queryProjectId) {
      router.replace(`/presupuestos/${encodeURIComponent(queryProjectId)}`);
    }
  }, [queryProjectId, router]);

  if (queryProjectId) {
    return <PresupuestosLoading />;
  }

  return <PresupuestosWorkspace />;
}
