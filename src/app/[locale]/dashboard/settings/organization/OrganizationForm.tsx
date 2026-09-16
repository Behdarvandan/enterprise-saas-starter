"use client";

import { Button } from "@/components/ui/button";
import FormStatus from "@/components/ui/FormStatus";
import { useFormAction } from "@/hooks/useFormAction";
import { updateOrganization } from "./actions";

export default function OrganizationForm({ name }: { name: string }) {
  const { result, loading, handleSubmit } = useFormAction(updateOrganization);

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

      <FormStatus
        error={result?.error}
        success={result?.success}
        successMessage="Organization updated."
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
