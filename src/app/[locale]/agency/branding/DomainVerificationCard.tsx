"use client";

import { useState } from "react";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/ui/primitives/card";

type CnameStatus = "pending" | "active" | "failed";

interface DomainVerificationCardCopy {
  title: string;
  description: string;
  noDomain: string;
  addRecord: string;
  recordType: string;
  recordName: string;
  recordValue: string;
  verify: string;
  checking: string;
  status: Record<CnameStatus, string>;
  message: Record<CnameStatus, string>;
  lastChecked: string;
  neverChecked: string;
  genericError: string;
}

interface VerifyResponse {
  status: CnameStatus;
  domain: string;
  target: string;
  checkedAt: string;
}

export default function DomainVerificationCard({
  agencyId,
  domain,
  target,
  initialStatus,
  copy,
}: {
  agencyId: string;
  domain: string | null;
  target: string;
  initialStatus: CnameStatus;
  copy: DomainVerificationCardCopy;
}) {
  const [status, setStatus] = useState<CnameStatus>(initialStatus);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setChecking(true);
    setError(null);
    try {
      const response = await fetch("/api/agency/cname/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });
      const data = (await response.json()) as VerifyResponse & { error?: string };
      if (!response.ok) {
        setError(data.error ?? copy.genericError);
        return;
      }
      setStatus(data.status);
      setCheckedAt(data.checkedAt);
    } catch {
      setError(copy.genericError);
    } finally {
      setChecking(false);
    }
  }

  const statusVariant = status === "active" ? "default" : status === "failed" ? "destructive" : "secondary";

  return (
    <Card variant="section">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>{copy.title}</CardTitle>
        {domain ? <Badge variant={statusVariant}>{copy.status[status]}</Badge> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CardDescription>{copy.description}</CardDescription>

        {!domain ? (
          <p className="text-sm text-muted-foreground">{copy.noDomain}</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">{copy.addRecord}</span>
              <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-muted p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{copy.recordType}</p>
                  <p className="text-foreground">CNAME</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{copy.recordName}</p>
                  <p className="truncate text-foreground">{domain}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{copy.recordValue}</p>
                  <p className="truncate text-foreground">{target}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{copy.message[status]}</p>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={handleVerify} loading={checking}>
                {checking ? copy.checking : copy.verify}
              </Button>
              <span className="text-xs text-muted-foreground">
                {checkedAt ? `${copy.lastChecked}: ${new Date(checkedAt).toLocaleString()}` : copy.neverChecked}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
