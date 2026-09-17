import { FolderOpen, Github, Globe } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireMembership } from "@/lib/auth";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

/**
 * "Dosyalar/Teslimatlar" (brief §6): a deliverables list, not a file-upload
 * system — there's no document-storage table in this schema yet, so this
 * surfaces what's actually there: each project's repo/live links as
 * deliverable rows, dated by when the project record last changed.
 */
export default async function ClientFilesPage() {
  const { supabase, membership } = await requireMembership();
  const t = await getTranslations("client.nav");

  const { data: projects } = await supabase
    .from("client_projects")
    .select("id, name, repo_url, live_url, updated_at")
    .eq("organization_id", membership.organizationId)
    .order("updated_at", { ascending: false });

  const deliverables = (projects ?? []).flatMap((project) => {
    const rows: { key: string; label: string; href: string; icon: typeof Github; date: string }[] = [];
    if (project.repo_url) {
      rows.push({
        key: `${project.id}-repo`,
        label: `${project.name} — Repository`,
        href: project.repo_url,
        icon: Github,
        date: project.updated_at,
      });
    }
    if (project.live_url) {
      rows.push({
        key: `${project.id}-live`,
        label: `${project.name} — Live`,
        href: project.live_url,
        icon: Globe,
        date: project.updated_at,
      });
    }
    return rows;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-ink-primary">{t("files")}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Delivery links for your project — repository access and live environments.
      </p>

      {deliverables.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={FolderOpen}
            title="No deliverables yet"
            description="Repository and live links will appear here once your project has them."
          />
        </div>
      ) : (
        <div className="animate-reveal-up mt-8 overflow-hidden rounded-interactive border border-subtle bg-surface">
          {deliverables.map((row) => (
            <a
              key={row.key}
              href={row.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 border-b border-subtle px-4 py-3 transition-colors last:border-0 hover:border-gold/50 hover:bg-surface-raised"
            >
              <div className="flex min-w-0 items-center gap-3">
                <row.icon size={16} className="shrink-0 text-ink-muted" />
                <span className="truncate text-sm font-medium text-ink-primary">
                  {row.label}
                </span>
              </div>
              <span className="shrink-0 font-mono text-xs text-ink-muted">
                {new Date(row.date).toLocaleDateString()}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
