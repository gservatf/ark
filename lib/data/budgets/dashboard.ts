import { dataFailure, dataSuccess, normalizeSupabaseError } from "../errors";
import { validateDataScope } from "../scope";
import type { DataClient, DataResult, DataScope } from "../types";

import type { BudgetDashboardProject } from "./types";

export async function listBudgetDashboardProjects(
  client: DataClient,
  scope: DataScope
): Promise<DataResult<BudgetDashboardProject[]>> {
  const scopeResult = validateDataScope(scope);

  if (!scopeResult.ok) {
    return scopeResult;
  }

  const { data: projects, error: projectsError } = await client
    .rpc("list_budget_dashboard_projects");

  if (projectsError) {
    return dataFailure(normalizeSupabaseError(projectsError, "proyectos.dashboardRpc"));
  }

  return dataSuccess((projects || []) as unknown as BudgetDashboardProject[]);
}
