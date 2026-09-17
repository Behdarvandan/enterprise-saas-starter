import { CalendarX2, Radio } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { getUserMembership } from "@/lib/team";
import { getAllPlans } from "@/lib/plans";
import { checkQuota } from "@/lib/rag/quota";
import {
  appointmentStatusTone,
  formatAppointmentDate,
  formatAppointmentTime,
} from "@/lib/utils";
import type { AppointmentStatus } from "@/types";
import { Card } from "@/components/ui/card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import CountUp from "@/components/ui/CountUp";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";

export const dynamic = "force-dynamic";

const SUBSCRIPTION_TONE: Record<string, "success" | "warn" | "error" | "neutral"> = {
  active: "success",
  trialing: "success",
  past_due: "warn",
  canceled: "error",
};

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const membership = await getUserMembership(user.id);

  let organization: {
    name: string;
    slug: string;
    subscription_status: string;
    plan_id: string | null;
    current_period_end: string | null;
  } | null = null;
  let memberCount = 0;
  let serviceCount = 0;
  let documentCount = 0;
  let tokensUsed = 0;
  let tokensLimit = 0;
  let answeredEnquiries = 0;
  let recentAppointments: {
    id: string;
    customer_name: string;
    service_id: string;
    start_time: string;
    status: AppointmentStatus;
  }[] = [];
  let serviceNameById = new Map<string, string>();

  if (membership) {
    const organizationId = membership.organizationId;

    const [
      { data: org },
      { count: members },
      { data: services },
      { count: documents },
      quota,
      { count: answered },
      { data: recent },
    ] = await Promise.all([
      supabase
        .from("organizations")
        .select("name, slug, subscription_status, plan_id, current_period_end")
        .eq("id", organizationId)
        .single(),
      supabase
        .from("memberships")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("services")
        .select("id, name")
        .eq("organization_id", organizationId),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      checkQuota(organizationId),
      // "Automated Enquiries" — every assistant reply the RAG chatbot has
      // sent this org's visitors, i.e. an enquiry it answered without a
      // human. Distinct from `upcomingCount`/appointments, which is a
      // separate signal shown on the Bookings page.
      supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("role", "assistant"),
      supabase
        .from("appointments")
        .select("id, customer_name, service_id, start_time, status")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    organization = org;
    memberCount = members ?? 0;
    serviceCount = services?.length ?? 0;
    documentCount = documents ?? 0;
    tokensUsed = quota.tokensUsed;
    tokensLimit = quota.tokensLimit;
    answeredEnquiries = answered ?? 0;
    recentAppointments = recent ?? [];
    serviceNameById = new Map((services ?? []).map((service) => [service.id, service.name]));
  }

  const checklistItems = [
    {
      id: "org",
      label: "Create your organization",
      href: "/dashboard/settings/organization",
      done: Boolean(organization),
    },
    {
      id: "team",
      label: "Invite a teammate",
      href: "/dashboard/team",
      done: memberCount > 1,
    },
    {
      id: "service",
      label: "Add a bookable service",
      href: "/dashboard/bookings",
      done: serviceCount > 0,
    },
    {
      id: "kb",
      label: "Ingest a knowledge base document",
      href: "/dashboard/chatbot",
      done: documentCount > 0,
    },
  ];

  const planName =
    getAllPlans().find(
      (plan) => plan.checkout.kind === "stripe" && plan.checkout.priceId === organization?.plan_id,
    )?.name ?? "Starter";
  const subscriptionTone = organization
    ? (SUBSCRIPTION_TONE[organization.subscription_status] ?? "neutral")
    : "neutral";

  const usagePercent =
    tokensLimit > 0 ? Math.min(100, Math.round((tokensUsed / tokensLimit) * 100)) : 0;
  const usageTone = usagePercent >= 90 ? "bg-status-error" : "bg-gold";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-ink-primary">Overview</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Welcome back{user.email ? `, ${user.email}` : ""}.
      </p>

      {organization && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            className="animate-reveal-up rounded-interactive border border-subtle bg-surface p-5 transition-[transform,box-shadow,border-color] duration-200 hover:scale-[1.01] hover:border-gold/50 hover:shadow-md hover:shadow-gold/10"
            style={{ animationDelay: "0ms" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Business Status
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  subscriptionTone === "success" ? "animate-pulse bg-status-success" : "bg-subtle"
                }`}
              />
              <span className="font-mono text-xl font-semibold text-ink-primary">
                {subscriptionTone === "success" ? "Live & Ready" : "Setup Needed"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-ink-muted">{planName} plan</span>
              <Badge tone={subscriptionTone}>{organization.subscription_status}</Badge>
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              {organization.current_period_end
                ? `Renews ${new Date(organization.current_period_end).toLocaleDateString()}`
                : "No active billing period"}
            </p>
            <Link
              href="/dashboard/billing"
              className="mt-3 inline-block text-xs font-semibold text-ink-primary hover:text-primary"
            >
              Manage billing →
            </Link>
          </div>

          <div
            className="animate-reveal-up rounded-interactive border border-subtle bg-surface p-5 transition-[transform,box-shadow,border-color] duration-200 hover:scale-[1.01] hover:border-gold/50 hover:shadow-md hover:shadow-gold/10"
            style={{ animationDelay: "60ms" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Automated Enquiries
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Radio
                size={14}
                className={answeredEnquiries > 0 ? "text-status-success" : "text-ink-muted"}
              />
              <span
                className={`h-2 w-2 rounded-full ${
                  answeredEnquiries > 0 ? "animate-pulse bg-status-success" : "bg-subtle"
                }`}
              />
              <span className="font-mono text-xl font-semibold text-ink-primary">
                <CountUp value={answeredEnquiries} />
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-muted">Yanıtlandı — handled by the AI assistant</p>
          </div>

          <div
            className="animate-reveal-up rounded-interactive border border-subtle bg-surface p-5 transition-[transform,box-shadow,border-color] duration-200 hover:scale-[1.01] hover:border-gold/50 hover:shadow-md hover:shadow-gold/10"
            style={{ animationDelay: "120ms" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              AI Assistant Capacity
            </p>
            <p className="mt-2 font-mono text-xl font-semibold text-ink-primary">
              <CountUp value={tokensUsed} /> / {tokensLimit.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Aylık Görüşme (%{usagePercent} Kullanıldı)
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
              <div
                className={`h-full rounded-full ${usageTone} transition-[width] duration-500`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6">
        <OnboardingChecklist userId={user.id} items={checklistItems} />

        {organization && (
          <Card className="animate-reveal-up p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Recent appointments
              </h2>
              <Link
                href="/dashboard/bookings"
                className="text-xs font-semibold text-ink-primary hover:text-primary"
              >
                View all →
              </Link>
            </div>

            {recentAppointments.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={CalendarX2}
                  title="İlk Otomasyonunuzu Test Edin"
                  description="Bookings will show up here as soon as customers start scheduling — or try it yourself right now."
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link
                        href={`/book/${organization.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-interactive bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Simulate Live Booking
                      </Link>
                      <Link
                        href="/dashboard/chatbot"
                        className="rounded-interactive border border-subtle px-4 py-2 text-sm font-semibold text-ink-primary transition-colors hover:border-gold/50"
                      >
                        Test AI Agent
                      </Link>
                    </div>
                  }
                />
              </div>
            ) : (
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium text-ink-primary">
                        {appointment.customer_name}
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        {serviceNameById.get(appointment.service_id) ?? "Service"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-ink-muted">
                        {formatAppointmentDate(appointment.start_time)}{" "}
                        {formatAppointmentTime(appointment.start_time)}
                      </TableCell>
                      <TableCell>
                        <Badge tone={appointmentStatusTone[appointment.status]}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        <Card className="animate-reveal-up p-6" style={{ animationDelay: "60ms" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Authenticated user
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div className="border-b border-subtle pb-2">
              <dt className="text-xs font-medium text-ink-muted">Email</dt>
              <dd className="text-sm font-medium text-ink-primary">{user.email}</dd>
            </div>
            <div className="border-b border-subtle pb-2">
              <dt className="text-xs font-medium text-ink-muted">User ID</dt>
              <dd className="font-mono text-sm text-ink-primary">{user.id}</dd>
            </div>
            <div className="border-b border-subtle pb-2">
              <dt className="text-xs font-medium text-ink-muted">Last sign in</dt>
              <dd className="text-sm font-medium text-ink-primary">
                {user.last_sign_in_at ?? "N/A"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="animate-reveal-up p-6" style={{ animationDelay: "120ms" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Organization
          </h2>
          {organization && membership ? (
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="border-b border-subtle pb-2">
                <dt className="text-xs font-medium text-ink-muted">Name</dt>
                <dd className="text-sm font-medium text-ink-primary">{organization.name}</dd>
              </div>
              <div className="border-b border-subtle pb-2">
                <dt className="text-xs font-medium text-ink-muted">Your role</dt>
                <dd className="text-sm font-medium capitalize text-ink-primary">
                  {membership.role}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              You don&apos;t belong to an organization yet.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
