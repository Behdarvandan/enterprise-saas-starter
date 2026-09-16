"use client";

import { Button } from "@/components/ui/button";
import FormStatus from "@/components/ui/FormStatus";
import { useFormAction } from "@/hooks/useFormAction";
import { updateProfile } from "./actions";

export default function ProfileForm({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}) {
  const { result, loading, handleSubmit } = useFormAction(updateProfile);

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

      <FormStatus
        error={result?.error}
        success={result?.success}
        successMessage="Profile updated."
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
