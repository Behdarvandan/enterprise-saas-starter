import { LayoutDashboard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { requireMembership } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { ClientProject, ProjectStage } from "@/types";

export const dynamic = "force-dynamic";

const STAGE_KEYS = ["design", "backend", "test", "live"] as const;

export default async function ClientPortalPage() {
  const { supabase, membership } = await requireMembership();
  const t = await getTranslations("client");

  const { data: projects } = await supabase
    .from("client_projects")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  const stages = STAGE_KEYS.map((key) => ({ key, label: t(`stages.${key}`) }));

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title={t("nav.projectStatus")} description={t("projects.description")} />

      {!projects || projects.length === 0 ? (
        <EmptyState icon={LayoutDashboard} title={t("projects.emptyTitle")} description={t("projects.emptyDescription")} />
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <ProjectStageCard
              key={project.id}
              project={project}
              stages={stages}
              viewRepo={t("projects.viewRepo")}
              viewLive={t("projects.viewLive")}
              stageLabel={(index, name) => t("projects.stage", { index: index + 1, total: stages.length, name })}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function ProjectStageCard({
  project,
  stages,
  viewRepo,
  viewLive,
  stageLabel,
}: {
  project: ClientProject;
  stages: { key: ProjectStage; label: string }[];
  viewRepo: string;
  viewLive: string;
  stageLabel: (index: number, name: string) => string;
}) {
  const currentIndex = stages.findIndex((stage) => stage.key === project.stage);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
      <h2 className="text-lg font-semibold tracking-tight text-slate-100">{project.name}</h2>
      {project.notes ? <p className="mt-2 text-sm text-slate-400">{project.notes}</p> : null}

      <ol className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {stages.map((stage, index) => {
          const done = index <= currentIndex;
          const isLast = index === stages.length - 1;
          return (
            <li
              key={stage.key}
              aria-current={index === currentIndex ? "step" : undefined}
              aria-label={stageLabel(index, stage.label)}
              className="flex flex-1 items-center"
            >
              <div className="flex items-center gap-2 sm:flex-col sm:items-center">
                <div
                  aria-hidden
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-slate-700 bg-slate-800 text-slate-400",
                  )}
                >
                  {index + 1}
                </div>
                <span className={cn("text-xs font-medium", done ? "text-slate-100" : "text-slate-400")}>
                  {stage.label}
                </span>
              </div>
              {isLast ? null : (
                <div
                  aria-hidden
                  className={cn("mx-2 hidden h-0.5 flex-1 sm:block", index < currentIndex ? "bg-primary" : "bg-slate-800")}
                />
              )}
            </li>
          );
        })}
      </ol>

      {project.repo_url || project.live_url ? (
        <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-800 pt-4">
          {project.repo_url ? (
            <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:text-primary-hover">
              {viewRepo} <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
            </a>
          ) : null}
          {project.live_url ? (
            <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:text-primary-hover">
              {viewLive} <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
