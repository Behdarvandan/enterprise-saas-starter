"use client";

import { useState } from "react";
import { Gauge, SlidersHorizontal, Trash2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
              <TableHead>Tenant</TableHead>
              <TableHead className="min-w-56">Token usage</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                    <p className="text-sm font-medium text-ink-primary">{tenant.name}</p>
                    <p className="font-mono text-xs text-ink-muted">{tenant.slug}</p>
                  </TableCell>
                  <TableCell>
                    {noAllocation ? (
                      <Badge tone="warn">No tokens allocated</Badge>
                    ) : (
                      <div className="space-y-1.5">
                        <QuotaMeter percent={percent} label={`${tenant.name} token consumption`} />
                        <p className="font-mono text-xs text-ink-muted">
                          {formatTokens(tenant.remaining)} left of {formatTokens(tenant.granted)} (
                          {formatPercent(percent)} used)
                          {outOfTokens ? (
                            <span className="ml-2 font-sans font-semibold text-status-error">
                              Out of tokens
                            </span>
                          ) : null}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.enabledSkills.length === 0 ? (
                      <span className="text-xs text-ink-muted">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {tenant.enabledSkills.map((skill) => (
                          <Badge key={skill} className="normal-case">
                            {skill.replace(/_/g, " ")}
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
                        aria-label={`Allocate tokens to ${tenant.name}`}
                      >
                        <Gauge /> Tokens
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialog({ kind: "skills", tenantId: tenant.tenantId })}
                        aria-label={`Manage skills for ${tenant.name}`}
                      >
                        <SlidersHorizontal /> Skills
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:text-status-error"
                        onClick={() => setDialog({ kind: "remove", tenantId: tenant.tenantId })}
                        aria-label={`Remove ${tenant.name}`}
                      >
                        <Trash2 /> Remove
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
      {selected && dialog?.kind === "remove" ? (
        <RemoveTenantDialog tenant={selected} onClose={close} />
      ) : null}
    </>
  );
}
