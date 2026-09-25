import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/ui/primitives/card";
import { Link } from "@/i18n/navigation";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card variant="section" className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ForgotPasswordForm
            copy={{
              emailLabel: t("emailLabel"),
              sendButton: t("sendButton"),
              sending: t("sending"),
              successMessage: t("successMessage"),
            }}
          />
          <p className="text-center text-sm text-muted-foreground">
            {t("rememberedPassword")}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("signIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
