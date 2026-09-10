"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
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
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <select
          name="role"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send invite"}
        </Button>
      </div>

      {result?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {result.error}
        </p>
      )}
      {result?.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">
          Invitation sent.
        </p>
      )}
    </form>
  );
}
