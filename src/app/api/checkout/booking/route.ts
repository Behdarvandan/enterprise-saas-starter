import { NextResponse } from "next/server";
import { z } from "zod";
import { getBaseUrl } from "@/lib/url";
import { createAnonClient } from "@/lib/supabase/anon";
import { isOrganizationServiceable } from "@/lib/billing";
import { createPendingAppointment, confirmPendingAppointment } from "@/lib/booking";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { firstIssueMessage } from "@/lib/validation";
import { withApiErrorHandling } from "@/lib/api-error";
import {
  encodeAppointmentOrderId,
  getPaymentAdapter,
  resolvePaymentProvider,
} from "@/lib/payment/adapter";

const STRIPE_CURRENCY = process.env.STRIPE_CURRENCY ?? "usd";
const PAYTR_MAX_INSTALLMENT = Number(process.env.PAYTR_MAX_INSTALLMENT ?? 12);
const PAYTR_NO_INSTALLMENT = process.env.PAYTR_NO_INSTALLMENT === "1";

const bookingCheckoutSchema = z.object({
  organizationId: z.string().uuid("A valid organizationId is required."),
  serviceId: z.string().uuid("A valid serviceId is required."),
  customerName: z.string().trim().min(1, "Customer name is required."),
  customerEmail: z.string().trim().email("A valid customer email is required."),
  customerPhone: z.string().optional(),
  deviceInfo: z.string().optional(),
  issueDescription: z.string().optional(),
  startTime: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "A valid start time is required.",
  }),
});

/**
 * POST /api/checkout/booking
 * Creates a `pending` appointment and a Stripe Checkout Session for the
 * deposit. The appointment, organization, and service ids are attached to the
 * session metadata so the webhook can confirm the booking on payment.
 */
export const POST = withApiErrorHandling(
  "Booking checkout error",
  "Failed to start the booking.",
  async (request: Request) => {
    const parsedBody = bookingCheckoutSchema.safeParse(
      await request.json().catch(() => null),
    );

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: firstIssueMessage(parsedBody.error) },
        { status: 400 },
      );
    }

    const { organizationId, serviceId, customerName, customerEmail, startTime } =
      parsedBody.data;
    const customerPhone = parsedBody.data.customerPhone?.trim() || null;
    const deviceInfo = parsedBody.data.deviceInfo?.trim() || null;
    const issueDescription = parsedBody.data.issueDescription?.trim() || null;

    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
    const allowed = await checkRateLimit(`booking-checkout:${organizationId}:${ip}`);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 },
      );
    }

    const anon = createAnonClient();

    // Validate the service belongs to the tenant and is bookable.
    const { data: service } = await anon.rpc("get_bookable_service", {
      p_organization_id: organizationId,
      p_service_id: serviceId,
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or unavailable." },
        { status: 404 },
      );
    }

    const { data: organization } = await anon
      .rpc("get_organization_booking_info", { p_organization_id: organizationId })
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
    const successUrl = `${baseUrl}/book/success?appointment_id=${appointmentId}&organization_id=${organizationId}`;
    const cancelUrl = `${baseUrl}/book/${organization.slug}`;

    // Free services skip Stripe and are confirmed immediately.
    if (service.price <= 0) {
      await confirmPendingAppointment(appointmentId, organizationId);

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
        provider === "paytr"
          ? encodeAppointmentOrderId(organizationId, appointmentId)
          : appointmentId,
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
  },
);
