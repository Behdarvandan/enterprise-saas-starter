import { useTranslations } from "next-intl";
import { Banknote, ShieldCheck, Wrench } from "lucide-react";

const PERSONAS = [
  { key: "operations", icon: Wrench },
  { key: "security", icon: ShieldCheck },
  { key: "finance", icon: Banknote },
] as const;

export default function PersonaSection() {
  const t = useTranslations("marketing.persona");

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-px overflow-hidden border border-subtle bg-subtle sm:grid-cols-3">
        {PERSONAS.map((persona) => (
          <div key={persona.key} className="bg-canvas p-8">
            <persona.icon size={20} className="text-violet-dim" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {t(`${persona.key}.role`)}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-ink-primary">
              {t(`${persona.key}.headline`)}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {t(`${persona.key}.body`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
