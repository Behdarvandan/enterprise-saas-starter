"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/core/ui/primitives/button";
import FormStatus from "@/components/ui/FormStatus";
import { Input } from "@/core/ui/primitives/input";
import { NativeSelect } from "@/core/ui/primitives/native-select";
import { useRouter } from "@/i18n/navigation";
import { inviteMember } from "./actions";

export default function InviteMemberForm() {
  const t = useTranslations("dashboard.team.invite");
  const tRoles = useTranslations("shell.roles");
  const router = useRouter();
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setLoading(true);
    setResult(null);

    const res = await inviteMember(new FormData(form));

    setResult(res);
    setLoading(false);

    if (res.success) {
      form.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          name="email"
          type="email"
          dir="ltr"
          required
          aria-label={t("emailLabel")}
          placeholder={t("emailPlaceholder")}
          className="text-start"
        />
        <NativeSelect name="role" aria-label={t("roleLabel")} defaultValue="member">
          <option value="member">{tRoles("member")}</option>
          <option value="admin">{tRoles("admin")}</option>
        </NativeSelect>
        <Button type="submit" loading={loading}>
          {loading ? t("sending") : t("send")}
        </Button>
      </div>

      <FormStatus error={result?.error} success={result?.success} successMessage={t("sent")} />
    </form>
  );
}
