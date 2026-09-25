"use client";

import { Gauge, SlidersHorizontal, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useSkillLabel } from "@/components/dashboard/skills/useSkillLabel";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";
import { formatPercent, formatTokens } from "@/lib/agency/format";
import { consumptionPercent } from "@/lib/agency/usage";
import QuotaDialog from "./QuotaDialog";
import QuotaMeter from "./QuotaMeter";
import RemoveTenantDialog from "./RemoveTenantDialog";
import TenantSkillsDialog from "./TenantSkillsDialog";

export interface TenantRowData {
  tenantId: string;
  name: string;
  slug: string;
  /** Tokens allocated for the current period. */
  granted: number;
  /** Tokens left of the allocation. */
  remaining: number;
  enabledSkills: string[];
}

interface TenantTableProps {
  tenants: TenantRowData[];
  /** Skills the agency's plan lets it hand out. */
  allowedSkills: string[];
  /** Pool tokens not yet allocated to any tenant. */
  poolUnallocated: number;
}

type OpenDialog = { kind: "quota" | "skills" | "remove"; tenantId: string } | null;

export default function TenantTable({ tenants, allowedSkills, poolUnallocated }: TenantTableProps) {
  const t = useTranslations("agency.tenants.table");
  const locale = useLocale();
  const skillLabel = useSkillLabel();
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const selected = dialog ? tenants.find((tenant) => tenant.tenantId === dialog.tenantId) : undefined;

  function close() {
    setDialog(null);
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tenant")}</TableHead>
              <TableHead className="min-w-56">{t("usage")}</TableHead>
              <TableHead>{t("skills")}</TableHead>
              <TableHead className="text-end">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => {
              const percent = consumptionPercent({
                quota_granted: tenant.granted,
                quota_allocation: tenant.remaining,
              });
              const noAllocation = tenant.granted <= 0;
              const outOfTokens = !noAllocation && tenant.remaining <= 0;

              return (
                <TableRow key={tenant.tenantId}>
                  <TableCell>
                    <p className="text-sm font-medium text-slate-100">{tenant.name}</p>
                    <p dir="ltr" className="text-start font-mono text-xs text-slate-400">
                      {tenant.slug}
                    </p>
                  </TableCell>
                  <TableCell>
                    {noAllocation ? (
                      <Badge variant="secondary">{t("noAllocation")}</Badge>
                    ) : (
                      <div className="space-y-1.5">
                        <QuotaMeter percent={percent} label={t("consumption", { name: tenant.name })} />
                        <p className="text-xs text-slate-400">
                          <span dir="ltr" className="font-mono tabular-nums">
                            {t("remaining", {
                              remaining: formatTokens(locale, tenant.remaining),
                              granted: formatTokens(locale, tenant.granted),
                              percent: formatPercent(locale, percent),
                            })}
                          </span>
                          {outOfTokens ? (
                            <span className="ms-2 font-semibold text-status-error">{t("outOfTokens")}</span>
                          ) : null}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.enabledSkills.length === 0 ? (
                      <span className="text-xs text-slate-400">{t("noSkills")}</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {tenant.enabledSkills.map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skillLabel(skill).title}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialog({ kind: "quota", tenantId: tenant.tenantId })}
                        aria-label={t("allocateAria", { name: tenant.name })}
                      >
                        <Gauge aria-hidden /> {t("tokens")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialog({ kind: "skills", tenantId: tenant.tenantId })}
                        aria-label={t("skillsAria", { name: tenant.name })}
                      >
                        <SlidersHorizontal aria-hidden /> {t("skills")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:text-status-error"
                        onClick={() => setDialog({ kind: "remove", tenantId: tenant.tenantId })}
                        aria-label={t("removeAria", { name: tenant.name })}
                      >
                        <Trash2 aria-hidden /> {t("remove")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selected && dialog?.kind === "quota" ? (
        <QuotaDialog tenant={selected} poolUnallocated={poolUnallocated} onClose={close} />
      ) : null}
      {selected && dialog?.kind === "skills" ? (
        <TenantSkillsDialog tenant={selected} allowedSkills={allowedSkills} onClose={close} />
      ) : null}
      {selected && dialog?.kind === "remove" ? <RemoveTenantDialog tenant={selected} onClose={close} /> : null}
    </>
  );
}
