import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, ChevronRight, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage your account and organization.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {SETTINGS.map((setting) => (
          <Link key={setting.href} href={setting.href}>
            <Card className="p-6 transition hover:border-brand-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <setting.icon size={20} />
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900">
                {setting.label}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {setting.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
