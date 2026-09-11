import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getAppointmentDetails } from "@/lib/booking";
import { formatAppointmentDate, formatAppointmentTime } from "@/lib/utils";
import Card from "@/components/ui/Card";

interface SuccessPageProps {
  searchParams: Promise<{ appointment_id?: string }>;
}

/**
 * Booking confirmation page. Shown after returning from Stripe Checkout (or
 * immediately after a free booking) with the appointment id in the query string.
 */
export default async function BookingSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { appointment_id } = await searchParams;

  const details = appointment_id
    ? await getAppointmentDetails(appointment_id)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <Card className="p-8 text-center">
          {details ? (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <h1 className="mt-4 text-xl font-bold text-slate-900">
                Booking confirmed
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {details.organizationName}
              </p>

              <dl className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-left">
                <div className="flex justify-between gap-4">
                  <dt className="text-sm text-slate-500">Service</dt>
                  <dd className="text-right text-sm font-semibold text-slate-900">
                    {details.serviceName}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-sm text-slate-500">Date</dt>
                  <dd className="text-right text-sm font-semibold text-slate-900">
                    {formatAppointmentDate(details.appointment.start_time)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-sm text-slate-500">Time</dt>
                  <dd className="text-right text-sm font-semibold text-slate-900">
                    {formatAppointmentTime(details.appointment.start_time)} –{" "}
                    {formatAppointmentTime(details.appointment.end_time)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-sm text-slate-500">Name</dt>
                  <dd className="text-right text-sm font-semibold text-slate-900">
                    {details.appointment.customer_name}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="text-right text-sm font-semibold capitalize text-slate-900">
                    {details.appointment.status}
                  </dd>
                </div>
              </dl>

              <Link
                href="/"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Back to home
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900">
                Booking not found
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                We could not find the appointment you requested.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Back to home
              </Link>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
