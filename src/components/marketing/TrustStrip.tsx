import { Container, Database, Lock, ShieldCheck, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Reveal from "@/components/marketing/Reveal";

// Reuses the reviewer-facing control copy of `marketing.security`, which is
// kept accurate to the schema/deployment (the four most buyer-relevant ones).
const CONTROLS: { key: "isolation" | "paymentVerification" | "serviceRole" | "deployment"; icon: LucideIcon }[] = [
  { key: "isolation", icon: Lock },
  { key: "paymentVerification", icon: ShieldCheck },
  { key: "serviceRole", icon: Database },
  { key: "deployment", icon: Container },
];

export default async function TrustStrip() {
  const t = await getTranslations("marketing.security");

  return (
    <section aria-labelledby="trust-heading" className="border-y border-border bg-secondary/20">
      <Reveal className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 id="trust-heading" className="max-w-2xl text-lg font-semibold tracking-tight text-foreground">
          {t("title")}
        </h2>
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {CONTROLS.map(({ key, icon: Icon }) => (
            <li key={key}>
              <div className="flex items-center gap-2.5">
                <Icon aria-hidden className="size-4 shrink-0 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t(`controls.${key}.label`)}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t(`controls.${key}.detail`)}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
