"use client";

import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  FilePlus2,
  Folder,
  LogOut,
  Mail,
  Menu,
  Search,
  Settings,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ActivityPanel } from "@/components/layout/ActivityPanel";
import { InvitationNotificationsPanel } from "@/components/layout/InvitationNotificationsPanel";
import { menuItems } from "@/components/layout/Sidebar";
import { useWorkspaceNavigation } from "@/components/layout/useWorkspaceNavigation";
import { ProjectCreateDialog } from "@/components/projects/ProjectCreateDialog";
import { getCurrentUser, signOut } from "@/lib/auth/client";
import { createDataBrowserClient } from "@/lib/data/browser-client";
import { listPartidas } from "@/lib/data/items";
import { createProject } from "@/lib/data/projects";
import { listProviders } from "@/lib/data/providers";
import { listResources } from "@/lib/data/resources";
import { useActivitySubscription } from "@/lib/realtime/useActivitySubscription";
import { buildGlobalSearchResults, type GlobalSearchResult } from "@/lib/search/global";
import { cn } from "@/lib/utils";
import {
  clearStoredActiveProjectId,
  clearWorkspaceCache,
  setStoredActiveOrganizationId,
  setStoredActiveProjectId
} from "@/lib/data/workspace";
import type { ProjectInput } from "@/lib/validations/projects";
import type { Partida, Proveedor, Recurso } from "@/types/domain";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createDataBrowserClient(), []);
  const {
    activeOrganization,
    activeProject,
    organizations,
    projects,
    reload: reloadWorkspace,
    scope
  } = useWorkspaceNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pendingInvitationCount, setPendingInvitationCount] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchData, setSearchData] = useState<{
    partidas: Partida[];
    proveedores: Proveedor[];
    recursos: Recurso[];
  }>({ partidas: [], proveedores: [], recursos: [] });

  const activityTopic = useMemo(
    () => (scope ? { organizacionId: scope.organizacionId, type: "org" as const } : undefined),
    [scope]
  );
  const activity = useActivitySubscription({
    currentActorId: scope?.actorId,
    enabled: Boolean(scope),
    onRefetch: reloadWorkspace,
    topicScope: activityTopic
  });

  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      setUserEmail(user?.email ?? null);
    }

    void loadUser();
  }, []);

  useEffect(() => {
    async function loadSearchData() {
      if (!scope || searchQuery.trim().length < 2) {
        return;
      }

      const [partidasResult, resourcesResult, providersResult] = await Promise.all([
        listPartidas(supabase, scope),
        listResources(supabase, scope),
        listProviders(supabase, scope)
      ]);

      setSearchData({
        partidas: partidasResult.ok ? partidasResult.data : [],
        proveedores: providersResult.ok ? providersResult.data : [],
        recursos: resourcesResult.ok ? resourcesResult.data : []
      });
    }

    void loadSearchData();
  }, [scope, searchQuery, supabase]);

  const searchResults = useMemo(
    () =>
      buildGlobalSearchResults(searchQuery, {
        ...searchData,
        proyectos: projects
      }),
    [projects, searchData, searchQuery]
  );

  const userInitials = useMemo(() => {
    const source = userEmail ?? "C y P";

    return source
      .split(/[@\s.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [userEmail]);

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      setIsSigningOut(false);
    }
  }, [isSigningOut, router]);

  const handleCreateProject = useCallback(
    async (input: ProjectInput) => {
      if (!scope) {
        setProjectError("No se encontro una organizacion activa.");
        return;
      }

      setIsCreatingProject(true);
      setProjectError(null);
      const result = await createProject(supabase, scope, input);
      setIsCreatingProject(false);

      if (!result.ok) {
        setProjectError(result.error.message);
        return;
      }

      setIsCreateProjectOpen(false);
      setIsProjectMenuOpen(false);
      setStoredActiveProjectId(result.data.id);
      await reloadWorkspace();
      router.push(`/presupuestos/${result.data.id}`);
      router.refresh();
    },
    [reloadWorkspace, router, scope, supabase]
  );

  const handleSelectOrganization = useCallback(
    async (organizationId: string) => {
      setStoredActiveOrganizationId(organizationId);
      clearStoredActiveProjectId();
      clearWorkspaceCache(supabase);
      await reloadWorkspace();
      if (pathname.startsWith("/presupuestos/")) {
        router.replace("/presupuestos");
      }
      router.refresh();
    },
    [pathname, reloadWorkspace, router, supabase]
  );

  const handleSelectProject = useCallback(
    async (projectId: string) => {
      setStoredActiveProjectId(projectId);
      clearWorkspaceCache(supabase);
      setIsProjectMenuOpen(false);
      await reloadWorkspace();

      if (pathname.startsWith("/presupuestos")) {
        router.replace(`/presupuestos/${projectId}`);
      }

      router.refresh();
    },
    [pathname, reloadWorkspace, router, supabase]
  );

  const handleSelectSearchResult = useCallback(
    (result: GlobalSearchResult) => {
      setSearchQuery("");
      setIsSearchOpen(false);
      router.push(result.href);
    },
    [router]
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-4 px-5 lg:px-8">
        <button
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? "Cerrar navegacion" : "Abrir navegacion"}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden lg:block">
          <button
            aria-expanded={isProjectMenuOpen}
            className="flex min-w-[340px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            onClick={() => setIsProjectMenuOpen((current) => !current)}
            type="button"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-brand-600">
              {activeOrganization?.tipoOrganizacion === "personal" ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <BriefcaseBusiness className="h-5 w-5" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-800">
                {activeOrganization?.nombre || "Seleccionar organizacion"}
              </span>
              <span className="block truncate text-xs text-slate-500">
                {activeProject?.nombre || "Sin proyecto seleccionado"}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>

          {isProjectMenuOpen ? (
            <section className="absolute left-0 top-14 z-40 w-[460px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <span className="text-xs font-bold uppercase text-slate-400">Organizacion y proyectos</span>
                <Link
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-700 transition hover:bg-blue-50"
                  href="/configuracion/organizaciones"
                  onClick={() => setIsProjectMenuOpen(false)}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Gestionar
                </Link>
              </div>
              <div className="max-h-[520px] overflow-y-auto p-2">
                {organizations.map((organization) => {
                  const isActiveOrganization = activeOrganization?.id === organization.id;

                  return (
                    <div
                      className={cn(
                        "rounded-xl border p-2",
                        isActiveOrganization ? "border-blue-200 bg-blue-50/70" : "border-transparent"
                      )}
                      key={organization.id}
                    >
                      <button
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white"
                        onClick={() => void handleSelectOrganization(organization.id)}
                        type="button"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
                          {organization.tipoOrganizacion === "personal" ? (
                            <Building2 className="h-4 w-4" />
                          ) : (
                            <BriefcaseBusiness className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-slate-900">{organization.nombre}</span>
                          <span className="block text-xs text-slate-500">
                            {organization.tipoOrganizacion === "personal" ? "Personal" : "Empresa"} - {organization.rol}
                          </span>
                        </span>
                        <ChevronDown
                          className={cn("h-4 w-4 text-slate-400 transition", isActiveOrganization && "rotate-180")}
                        />
                      </button>

                      {isActiveOrganization ? (
                        <div className="ml-4 mt-1 border-l border-blue-100 pl-4">
                          {organization.projects.length > 0 ? (
                            organization.projects.map((project) => (
                              <button
                                className={cn(
                                  "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-white",
                                  activeProject?.id === project.id && "bg-white shadow-sm"
                                )}
                                key={project.id}
                                onClick={() => void handleSelectProject(project.id)}
                                type="button"
                              >
                                <Folder className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-bold text-slate-900">{project.nombre}</span>
                                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                                    {[project.cliente, project.ubicacion].filter(Boolean).join(" - ") || "Sin cliente"}
                                  </span>
                                </span>
                              </button>
                            ))
                          ) : (
                            <p className="px-2 py-3 text-sm text-slate-500">
                              Esta organizacion todavia no tiene proyectos disponibles.
                            </p>
                          )}
                          <button
                            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-brand-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
                            disabled={!organization.canMutate}
                            onClick={() => {
                              setProjectError(null);
                              setIsCreateProjectOpen(true);
                            }}
                            title={organization.canMutate ? "Nuevo proyecto" : "Solo owners o admins pueden crear proyectos"}
                            type="button"
                          >
                            <FilePlus2 className="h-4 w-4" />
                            Nuevo proyecto
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <div className="relative mx-auto hidden w-full max-w-[520px] xl:block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Buscar proyectos, partidas, recursos, proveedores..."
            value={searchQuery}
          />

          {isSearchOpen && searchQuery.trim().length >= 2 ? (
            <section className="absolute left-0 right-0 top-14 z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
              {searchResults.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No se encontraron resultados.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto p-2">
                  {searchResults.map((result) => (
                    <button
                      className="flex w-full flex-col rounded-xl px-3 py-2 text-left transition hover:bg-blue-50"
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectSearchResult(result)}
                      type="button"
                    >
                      <span className="text-sm font-bold text-slate-900">{result.title}</span>
                      <span className="mt-0.5 text-xs text-slate-500">
                        {getSearchTypeLabel(result.type)} - {result.subtitle}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <button
              aria-expanded={isNotificationsOpen}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => {
                setIsNotificationsOpen((current) => !current);
                setIsActivityOpen(false);
                setIsProfileMenuOpen(false);
              }}
              title="Notificaciones"
              type="button"
            >
              <Mail className="h-5 w-5" />
              {pendingInvitationCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {pendingInvitationCount > 9 ? "9+" : pendingInvitationCount}
                </span>
              ) : null}
            </button>
            <InvitationNotificationsPanel
              activeOrganization={activeOrganization}
              onAccepted={() => {
                void reloadWorkspace();
                router.refresh();
              }}
              onPendingCountChange={setPendingInvitationCount}
              open={isNotificationsOpen}
            />
          </div>
          <div className="relative">
            <button
              aria-expanded={isActivityOpen}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => {
                setIsActivityOpen((current) => !current);
                setIsNotificationsOpen(false);
                setIsProfileMenuOpen(false);
              }}
              title="Actividad reciente"
              type="button"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
            </button>
            <ActivityPanel open={isActivityOpen} scope={scope} status={activity.status} />
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div className="relative">
            <button
              aria-expanded={isProfileMenuOpen}
              className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition hover:bg-slate-100"
              onClick={() => {
                setIsProfileMenuOpen((current) => !current);
                setIsActivityOpen(false);
                setIsNotificationsOpen(false);
              }}
              type="button"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-200 to-amber-100 text-sm font-bold text-slate-800">
                {userInitials || "CY"}
              </span>
              <span className="hidden text-left md:block">
                <span className="block max-w-[190px] truncate text-sm font-bold text-slate-900">
                  {userEmail ?? "Sesion activa"}
                </span>
                <span className="block text-xs text-slate-500">Sesion activa</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
            </button>

            {isProfileMenuOpen ? (
              <section className="absolute right-0 top-14 z-40 w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
                <div className="border-b border-slate-200 p-4">
                  <p className="truncate text-sm font-bold text-slate-950">{userEmail ?? "Sesion activa"}</p>
                  <p className="mt-1 text-xs text-slate-500">Cuenta y organizaciones</p>
                </div>
                <div className="p-2">
                  <Link
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-brand-700"
                    href="/configuracion/organizaciones"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    Mis organizaciones
                  </Link>
                  <button
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSigningOut}
                    onClick={handleSignOut}
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    {isSigningOut ? "Cerrando sesion..." : "Cerrar sesion"}
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
      {isMobileMenuOpen ? (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
          <div className="grid gap-1 sm:grid-cols-2">
            {menuItems.map((item) => {
              const isActive =
                item.href === "/" ? pathname === "/" : Boolean(item.href && pathname.startsWith(item.href));

              return item.disabled ? (
                <span
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400"
                  key={item.label}
                  title="Disponible en un goal pendiente"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </span>
              ) : (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-brand-700",
                    isActive && "bg-blue-50 text-brand-700"
                  )}
                  href={item.href ?? "/"}
                  key={item.label}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      <ProjectCreateDialog
        error={projectError}
        isSubmitting={isCreatingProject}
        onClose={() => setIsCreateProjectOpen(false)}
        onSubmit={handleCreateProject}
        open={isCreateProjectOpen}
      />
    </header>
  );
}

function getSearchTypeLabel(type: GlobalSearchResult["type"]) {
  if (type === "proyecto") {
    return "Proyecto";
  }

  if (type === "partida") {
    return "Partida";
  }

  if (type === "recurso") {
    return "Recurso";
  }

  return "Proveedor";
}
