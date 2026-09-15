"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LegacyButton from "@/components/ui/LegacyButton";
import { updateOrganization } from "./actions";

export default function OrganizationForm({ name }: { name: string }) {
  const router = useRouter();
  const [result, setResult] = useState<{
    error?: string;
    success?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const res = await updateOrganization(formData);

    setResult(res);
    setLoading(false);

    if (res.success) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="block text-xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Organization name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={name}
          className="w-full rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
        />
      </div>

      {result?.error && (
        <p className="rounded-lg bg-status-error/10 px-3 py-2 text-xs font-medium text-status-error">
          {result.error}
        </p>
      )}
      {result?.success && (
        <p className="rounded-lg bg-status-success/10 px-3 py-2 text-xs font-medium text-status-success">
          Organization updated.
        </p>
      )}

      <LegacyButton type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save changes"}
      </LegacyButton>
    </form>
  );
}
