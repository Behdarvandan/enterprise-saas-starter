import { getTranslations } from "next-intl/server";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";
import { Link } from "@/i18n/navigation";

/** UI-only: no Supabase sign-in call is wired yet — same mock-first treatment as this session's App Engine pages. */
export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card variant="section" className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="login-email">{t("emailLabel")}</Label>
            <Input id="login-email" type="email" autoComplete="email" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">{t("passwordLabel")}</Label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>
            <Input id="login-password" type="password" autoComplete="current-password" />
          </div>
          <Button type="button" className="w-full">
            {t("signInButton")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link href="/signup" className="text-primary hover:underline">
              {t("signUp")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
