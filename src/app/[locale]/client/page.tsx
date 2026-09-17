import { LayoutDashboard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireMembership } from "@/lib/auth";
import EmptyState from "@/components/ui/EmptyState";
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-ink-primary">
        {t("nav.projectStatus")}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Track where your project stands, end to end.
      </p>

      {!projects || projects.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={LayoutDashboard}
            title="No projects yet"
            description="Your project will appear here once it's kicked off."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {projects.map((project, index) => (
            <ProjectStageCard
              key={project.id}
              project={project}
              stages={stages}
              delayMs={index * 80}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectStageCard({
  project,
  stages,
  delayMs,
}: {
  project: ClientProject;
  stages: { key: ProjectStage; label: string }[];
  delayMs: number;
}) {
  const currentIndex = stages.findIndex((stage) => stage.key === project.stage);

  return (
    <div
      className="animate-reveal-up rounded-interactive border border-subtle bg-surface p-6 transition-[box-shadow,border-color] duration-200 hover:border-gold/50 hover:shadow-md hover:shadow-gold/10"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <h2 className="text-lg font-semibold text-ink-primary">{project.name}</h2>
      {project.notes && <p className="mt-2 text-sm text-ink-muted">{project.notes}</p>}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {stages.map((stage, index) => {
          const done = index <= currentIndex;
          const isLast = index === stages.length - 1;
          return (
            <div key={stage.key} className="flex flex-1 items-center">
              <div className="flex items-center gap-2 sm:flex-col sm:items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-subtle bg-surface-raised text-ink-muted"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    done ? "text-ink-primary" : "text-ink-muted"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`mx-2 hidden h-0.5 flex-1 sm:block ${
                    index < currentIndex ? "bg-primary" : "bg-subtle"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {(project.repo_url || project.live_url) && (
        <div className="mt-6 flex flex-wrap gap-4 border-t border-subtle pt-4">
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-ink-primary hover:text-primary"
            >
              View repository →
            </a>
          )}
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-ink-primary hover:text-primary"
            >
              View live →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
