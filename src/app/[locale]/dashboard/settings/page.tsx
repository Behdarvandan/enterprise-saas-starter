import { Link } from "@/i18n/navigation";
import { Building2, ChevronRight, User } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";

const SETTINGS = [
  {
    label: "Profile",
    description: "Update your name and view your email.",
    href: "/dashboard/settings/profile",
    icon: User,
  },
  {
    label: "Organization",
    description: "Manage your organization settings.",
    href: "/dashboard/settings/organization",
    icon: Building2,
  },
];

export default async function SettingsPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Settings</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Manage your account and organization.
      </p>

      <div className="animate-reveal-up mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {SETTINGS.map((setting) => (
          <Link key={setting.href} href={setting.href}>
            <Card
              variant="item"
              className="p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet/10 text-violet-dim">
                  <setting.icon size={20} />
                </div>
                <ChevronRight size={18} className="text-ink-muted" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-ink-primary">
                {setting.label}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {setting.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
