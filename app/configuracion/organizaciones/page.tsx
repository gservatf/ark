import { Suspense } from "react";

import { LoadingState } from "@/components/shared/LoadingState";

import { OrganizationsClient } from "./OrganizationsClient";

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando organizaciones" rows={6} />}>
      <OrganizationsClient />
    </Suspense>
  );
}
