import { FolderOpen, Github, Globe } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card } from "@/core/ui/primitives/card";
import EmptyState from "@/components/ui/EmptyState";
import { requireMembership } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * "Files / deliverables": a deliverables list, not a file-upload system —
 * there's no document-storage table in this schema yet, so this surfaces
 * what's actually there: each project's repo/live links as deliverable rows,
 * dated by when the project record last changed.
 */
export default async function ClientFilesPage() {
  const { supabase, membership } = await requireMembership();
  const [t, tNav, format] = await Promise.all([
    getTranslations("client.files"),
    getTranslations("client.nav"),
    getFormatter(),
  ]);

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
        label: t("repository", { name: project.name }),
        href: project.repo_url,
        icon: Github,
        date: project.updated_at,
      });
    }
    if (project.live_url) {
      rows.push({
        key: `${project.id}-live`,
        label: t("live", { name: project.name }),
        href: project.live_url,
        icon: Globe,
        date: project.updated_at,
      });
    }
    return rows;
  });

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title={tNav("files")} description={t("description")} />

      {deliverables.length === 0 ? (
        <EmptyState icon={FolderOpen} title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <Card className="overflow-hidden">
          {deliverables.map((row) => (
            <a
              key={row.key}
              href={row.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 border-b border-slate-800 px-4 py-3 transition-colors last:border-0 hover:bg-slate-800/40 focus-visible:bg-slate-800/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <row.icon aria-hidden size={16} className="shrink-0 text-slate-500" />
                <span className="truncate text-sm font-medium text-slate-100">{row.label}</span>
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {format.dateTime(new Date(row.date), { dateStyle: "medium" })}
              </span>
            </a>
          ))}
        </Card>
      )}
    </PageContainer>
  );
}
