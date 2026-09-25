import { getTranslations } from "next-intl/server";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";

/** UI-only: no Supabase updateUser call is wired yet — same mock-first treatment as this session's App Engine pages. */
export default async function ResetPasswordPage() {
  const t = await getTranslations("auth.resetPassword");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card variant="section" className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reset-new-password">{t("newPasswordLabel")}</Label>
            <Input id="reset-new-password" type="password" autoComplete="new-password" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reset-confirm-password">{t("confirmPasswordLabel")}</Label>
            <Input id="reset-confirm-password" type="password" autoComplete="new-password" />
          </div>
          <Button type="button" className="w-full">
            {t("updateButton")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
