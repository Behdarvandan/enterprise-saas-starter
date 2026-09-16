"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { inviteMember } from "./actions";

export default function InviteMemberForm() {
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
    const res = await inviteMember(formData);

    setResult(res);
    setLoading(false);

    if (res.success) {
      event.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
        <input
          name="email"
          type="email"
          required
          placeholder="colleague@example.com"
          className="w-full rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
        />
        <select
          name="role"
          className="rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send invite"}
        </Button>
      </div>

      {result?.error && (
        <p className="rounded-lg bg-status-error/10 px-3 py-2 text-xs font-medium text-status-error">
          {result.error}
        </p>
      )}
      {result?.success && (
        <p className="rounded-lg bg-status-success/10 px-3 py-2 text-xs font-medium text-status-success">
          Invitation sent.
        </p>
      )}
    </form>
  );
}
