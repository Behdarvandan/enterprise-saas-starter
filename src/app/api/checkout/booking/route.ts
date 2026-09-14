import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/url";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOrganizationServiceable } from "@/lib/billing";
import { createPendingAppointment } from "@/lib/booking";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  encodeAppointmentOrderId,
  getPaymentAdapter,
  resolvePaymentProvider,
} from "@/lib/payment/adapter";

const STRIPE_CURRENCY = process.env.STRIPE_CURRENCY ?? "usd";
const PAYTR_MAX_INSTALLMENT = Number(process.env.PAYTR_MAX_INSTALLMENT ?? 12);
const PAYTR_NO_INSTALLMENT = process.env.PAYTR_NO_INSTALLMENT === "1";

interface BookingCheckoutBody {
  organizationId?: string;
  serviceId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deviceInfo?: string;
  issueDescription?: string;
  startTime?: string;
}

/**
 * POST /api/checkout/booking
 * Creates a `pending` appointment and a Stripe Checkout Session for the
 * deposit. The appointment, organization, and service ids are attached to the
 * session metadata so the webhook can confirm the booking on payment.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as BookingCheckoutBody | null;

    const organizationId = typeof body?.organizationId === "string" ? body.organizationId : "";
    const serviceId = typeof body?.serviceId === "string" ? body.serviceId : "";
    const customerName = typeof body?.customerName === "string" ? body.customerName.trim() : "";
    const customerEmail = typeof body?.customerEmail === "string" ? body.customerEmail.trim() : "";
    const customerPhone = typeof body?.customerPhone === "string" ? body.customerPhone.trim() : null;
    const deviceInfo = typeof body?.deviceInfo === "string" ? body.deviceInfo.trim() || null : null;
    const issueDescription =
      typeof body?.issueDescription === "string" ? body.issueDescription.trim() || null : null;
    const startTime = typeof body?.startTime === "string" ? body.startTime : "";

    if (!organizationId || !serviceId || !customerName || !customerEmail || !startTime) {
      return NextResponse.json(
        { error: "Missing required booking fields." },
        { status: 400 },
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
    const allowed = await checkRateLimit(`booking-checkout:${organizationId}:${ip}`);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 },
      );
    }

    const admin = createAdminClient();

    // Validate the service belongs to the tenant and is bookable.
    const { data: service } = await admin
      .from("services")
      .select("id, name, price, duration_minutes")
      .eq("id", serviceId)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .maybeSingle();

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or unavailable." },
        { status: 404 },
      );
    }

    const { data: organization } = await admin
      .from("organizations")
      .select("slug, name")
      .eq("id", organizationId)
      .maybeSingle();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    // Only serve organizations with an active or trialing subscription.
    if (!(await isOrganizationServiceable(organizationId))) {
      return NextResponse.json(
        { error: "This service is not currently available." },
        { status: 403 },
      );
    }

    // Create the pending appointment (the DB trigger prevents double-booking).
    let appointmentId: string;
    try {
      const appointment = await createPendingAppointment({
        organizationId,
        serviceId,
        customerName,
        customerEmail,
        customerPhone,
        deviceInfo,
        issueDescription,
        startTime,
      });
      appointmentId = appointment.id;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The selected time is no longer available.";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    const baseUrl = await getBaseUrl();
    const successUrl = `${baseUrl}/book/success?appointment_id=${appointmentId}`;
    const cancelUrl = `${baseUrl}/book/${organization.slug}`;

    // Free services skip Stripe and are confirmed immediately.
    if (service.price <= 0) {
      await admin
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", appointmentId);

      // Best-effort: notify the customer about the confirmed booking.
      try {
        const appointmentEnd = new Date(
          new Date(startTime).getTime() + service.duration_minutes * 60_000,
        ).toISOString();

        await sendBookingConfirmationEmail({
          to: customerEmail,
          organizationName: organization.name,
          serviceName: service.name,
          appointmentStart: startTime,
          appointmentEnd,
          customerName,
          customerEmail,
          customerPhone,
        });
      } catch (emailError) {
        console.error("Failed to send booking confirmation email:", emailError);
      }

      return NextResponse.json({ url: successUrl, requiresPayment: false });
    }

    const provider = resolvePaymentProvider();

    const result = await getPaymentAdapter(provider).createCheckoutSession({
      mode: "payment",
      customerEmail,
      customerName,
      customerPhone,
      customerIp: ip,
      merchantOrderId:
        provider === "paytr" ? encodeAppointmentOrderId(appointmentId) : appointmentId,
      lineItems: [{ name: service.name, unitAmount: service.price, quantity: 1 }],
      currency: provider === "paytr" ? undefined : STRIPE_CURRENCY,
      installments:
        provider === "paytr"
          ? {
              disabled: PAYTR_NO_INSTALLMENT,
              maxCount: PAYTR_MAX_INSTALLMENT,
            }
          : undefined,
      metadata: {
        appointment_id: appointmentId,
        organization_id: organizationId,
        service_id: serviceId,
      },
      successUrl,
      cancelUrl,
      expiresAt: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    });

    return NextResponse.json({ url: result.url, requiresPayment: true });
  } catch (error) {
    console.error("Booking checkout error:", error);
    return NextResponse.json(
      { error: "Failed to start the booking." },
      { status: 500 },
    );
  }
}
