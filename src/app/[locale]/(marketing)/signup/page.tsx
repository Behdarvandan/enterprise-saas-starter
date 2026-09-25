import { getTranslations } from "next-intl/server";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";
import { Link } from "@/i18n/navigation";

/** UI-only: no Supabase sign-up call is wired yet — same mock-first treatment as this session's App Engine pages. */
export default async function SignupPage() {
  const t = await getTranslations("auth.signup");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card variant="section" className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="signup-email">{t("emailLabel")}</Label>
            <Input id="signup-email" type="email" autoComplete="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="signup-password">{t("passwordLabel")}</Label>
            <Input id="signup-password" type="password" autoComplete="new-password" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="signup-confirm-password">{t("confirmPasswordLabel")}</Label>
            <Input id="signup-confirm-password" type="password" autoComplete="new-password" />
          </div>
          <Button type="button" className="w-full">
            {t("createAccountButton")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("signIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
