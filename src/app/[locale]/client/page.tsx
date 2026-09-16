import { LayoutDashboard } from "lucide-react";
import { requireMembership } from "@/lib/auth";
import EmptyState from "@/components/ui/EmptyState";
import type { ClientProject, ProjectStage } from "@/types";

export const dynamic = "force-dynamic";

const STAGES: { key: ProjectStage; label: string }[] = [
  { key: "design", label: "Design" },
  { key: "backend", label: "Backend" },
  { key: "test", label: "Test" },
  { key: "live", label: "Live" },
];

export default async function ClientPortalPage() {
  const { supabase, membership } = await requireMembership();

  const { data: projects } = await supabase
    .from("client_projects")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Project status</h1>
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
          {projects.map((project) => (
            <ProjectStageCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectStageCard({ project }: { project: ClientProject }) {
  const currentIndex = STAGES.findIndex((stage) => stage.key === project.stage);

  return (
    <div className="rounded-interactive border border-subtle bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink-primary">{project.name}</h2>
      {project.notes && <p className="mt-2 text-sm text-ink-muted">{project.notes}</p>}

      <div className="mt-6 flex items-center">
        {STAGES.map((stage, index) => {
          const done = index <= currentIndex;
          const isLast = index === STAGES.length - 1;
          return (
            <div key={stage.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                    done
                      ? "border-violet bg-violet text-white"
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
                  className={`mx-2 h-0.5 flex-1 ${
                    index < currentIndex ? "bg-violet" : "bg-subtle"
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
              className="text-sm font-semibold text-violet-dim hover:text-violet"
            >
              View repository →
            </a>
          )}
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-violet-dim hover:text-violet"
            >
              View live →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
