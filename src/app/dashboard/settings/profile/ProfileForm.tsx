"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { updateProfile } from "./actions";

export default function ProfileForm({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}) {
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
    const res = await updateProfile(formData);

    setResult(res);
    setLoading(false);

    if (res.success) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          disabled
          className="w-full rounded-lg border border-subtle bg-canvas px-3 py-2 text-sm text-ink-muted"
        />
        <p className="text-xs text-ink-muted">
          Email is managed by your authentication provider and cannot be changed
          here.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="full_name"
          className="block text-xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={fullName}
          placeholder="Your name"
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
          Profile updated.
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
