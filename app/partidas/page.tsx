import { Suspense } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/shared/LoadingState";

import PartidasClient from "./PartidasClient";

export default function PartidasPage() {
  return (
    <Suspense fallback={<PartidasFallback />}>
      <PartidasClient />
    </Suspense>
  );
}

function PartidasFallback() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1680px] px-5 py-6 lg:px-8">
        <LoadingState label="Cargando partidas" rows={5} />
      </div>
    </AppLayout>
  );
}
