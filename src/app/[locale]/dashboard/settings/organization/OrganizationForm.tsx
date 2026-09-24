"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/core/ui/primitives/button";
import FormStatus from "@/components/ui/FormStatus";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";
import { useFormAction } from "@/hooks/useFormAction";
import { updateOrganization } from "./actions";

export default function OrganizationForm({ name }: { name: string }) {
  const t = useTranslations("dashboard.settings");
  const { result, loading, handleSubmit } = useFormAction(updateOrganization);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">{t("organization.name")}</Label>
        <Input id="name" name="name" type="text" required defaultValue={name} />
      </div>

      <FormStatus error={result?.error} success={result?.success} successMessage={t("organization.updated")} />

      <Button type="submit" loading={loading}>
        {loading ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
