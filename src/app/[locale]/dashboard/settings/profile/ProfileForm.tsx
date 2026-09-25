"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/core/ui/primitives/button";
import FormStatus from "@/components/ui/FormStatus";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";
import { useFormAction } from "@/hooks/useFormAction";
import { updateProfile } from "./actions";

export default function ProfileForm({ email, fullName }: { email: string; fullName: string }) {
  const t = useTranslations("dashboard.settings");
  const { result, loading, handleSubmit } = useFormAction(updateProfile);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="email">{t("profile.email")}</Label>
        <Input id="email" type="email" dir="ltr" value={email} disabled readOnly className="text-start" />
        <p className="text-xs text-muted-foreground">{t("profile.emailHint")}</p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="full_name">{t("profile.fullName")}</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={fullName}
          placeholder={t("profile.fullNamePlaceholder")}
        />
      </div>

      <FormStatus error={result?.error} success={result?.success} successMessage={t("profile.updated")} />

      <Button type="submit" loading={loading}>
        {loading ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
