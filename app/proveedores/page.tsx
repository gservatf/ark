import { Suspense } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/shared/LoadingState";

import ProveedoresClient from "./ProveedoresClient";

export default function ProveedoresPage() {
  return (
    <Suspense fallback={<ProveedoresFallback />}>
      <ProveedoresClient />
    </Suspense>
  );
}

function ProveedoresFallback() {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1680px] px-5 py-6 lg:px-8">
        <LoadingState label="Cargando proveedores" rows={5} />
      </div>
    </AppLayout>
  );
}
