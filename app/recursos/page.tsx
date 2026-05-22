import { Suspense } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/shared/LoadingState";

import RecursosClient from "./RecursosClient";

export default function RecursosPage() {
  return (
    <Suspense fallback={<RecursosFallback />}>
      <RecursosClient />
    </Suspense>
  );
}

function RecursosFallback() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1680px] px-5 py-6 lg:px-8">
        <LoadingState label="Cargando recursos" rows={5} />
      </div>
    </AppLayout>
  );
}
