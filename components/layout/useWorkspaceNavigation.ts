"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  clearStoredActiveProjectId,
  clearWorkspaceCache,
  resolveProjectWorkspace,
  setStoredActiveOrganizationId,
  type ProjectWorkspace
} from "@/lib/data/workspace";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { Proyecto } from "@/types/domain";

export function useWorkspaceNavigation() {
  const pathname = usePathname();
  const requestedProjectId = useMemo(() => getProjectIdFromPath(pathname), [pathname]);
  const [workspace, setWorkspace] = useState<ProjectWorkspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const result = await resolveProjectWorkspace(supabase, requestedProjectId);

    if (!result.ok) {
      setWorkspace(null);
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    setWorkspace(result.data);
    setIsLoading(false);
  }, [requestedProjectId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const activeProject = useMemo(() => {
    const projects = workspace?.projects || [];
    return getActiveProject(projects, workspace?.scope.proyectoId);
  }, [workspace]);

  const selectOrganization = useCallback(
    async (organizationId: string) => {
      const supabase = createBrowserClient();
      setStoredActiveOrganizationId(organizationId);
      clearStoredActiveProjectId();
      clearWorkspaceCache(supabase);
      await loadWorkspace();
    },
    [loadWorkspace]
  );

  return {
    activeOrganization: workspace?.activeOrganization || null,
    activeProject,
    error,
    isLoading,
    organizations: workspace?.organizations || [],
    projects: workspace?.projects || [],
    reload: loadWorkspace,
    scope: workspace?.scope || null,
    selectOrganization,
    workspace
  };
}

function getProjectIdFromPath(pathname: string | null) {
  const match = pathname?.match(/^\/presupuestos\/([^/?#]+)/);
  return match?.[1];
}

function getActiveProject(projects: Proyecto[], projectId?: string) {
  return projects.find((project) => project.id === projectId) || projects[0] || null;
}
