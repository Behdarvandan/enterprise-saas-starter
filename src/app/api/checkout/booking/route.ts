import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPendingAppointment } from "@/lib/booking";
import { sendBookingConfirmationEmail } from "@/lib/email";

const STRIPE_CURRENCY = process.env.STRIPE_CURRENCY ?? "usd";

interface BookingCheckoutBody {
  organizationId?: string;
  serviceId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
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
    const startTime = typeof body?.startTime === "string" ? body.startTime : "";

    if (!organizationId || !serviceId || !customerName || !customerEmail || !startTime) {
      return NextResponse.json(
        { error: "Missing required booking fields." },
        { status: 400 },
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

    // Create the pending appointment (the DB trigger prevents double-booking).
    let appointmentId: string;
    try {
      const appointment = await createPendingAppointment({
        organizationId,
        serviceId,
        customerName,
        customerEmail,
        customerPhone,
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

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      client_reference_id: appointmentId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: STRIPE_CURRENCY,
            unit_amount: service.price,
            product_data: { name: service.name },
          },
        },
      ],
      metadata: {
        appointment_id: appointmentId,
        organization_id: organizationId,
        service_id: serviceId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url, requiresPayment: true });
  } catch (error) {
    console.error("Booking checkout error:", error);
    return NextResponse.json(
      { error: "Failed to start the booking." },
      { status: 500 },
    );
  }
}
