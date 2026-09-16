import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import BookingForm, { type BookableService } from "./BookingForm";

interface BookingPageProps {
  params: Promise<{ org_slug: string }>;
}

/**
 * Customer-facing booking page. Resolves the tenant by slug, then renders the
 * booking wizard for its active services. Anonymous by design: all reads use
 * the service-role client scoped to the resolved organization id.
 */
export default async function BookingPage({ params }: BookingPageProps) {
  const { org_slug } = await params;

  const admin = createAdminClient();

  const { data: organization } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", org_slug)
    .maybeSingle();

  if (!organization) notFound();

  const { data: services } = await admin
    .from("services")
    .select("id, name, description, duration_minutes, price, is_active")
    .eq("organization_id", organization.id)
    .eq("is_active", true)
    .order("name");

  const bookableServices = (services ?? []) as BookableService[];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Book with {organization.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose a service, pick a time, and enter your details.
          </p>
        </div>

        {bookableServices.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              No services are currently available for booking.
            </p>
          </div>
        ) : (
          <BookingForm
            organizationId={organization.id}
            services={bookableServices}
          />
        )}
      </div>
    </div>
  );
}
