import { Resend } from "resend";
import { formatAppointmentDate, formatAppointmentTime } from "@/lib/utils";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Defaults to Resend's test sender. In production, set this to a verified
// domain (e.g. "Pasargad <hello@yourdomain.com>").
const FROM_EMAIL = process.env.EMAIL_FROM ?? "Pasargad <onboarding@resend.dev>";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error);
    throw new Error(error.message);
  }
}

export async function sendInvitationEmail({
  to,
  organizationName,
  role,
  inviteUrl,
}: {
  to: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
}): Promise<void> {
  const safeOrg = escapeHtml(organizationName);
  const safeRole = escapeHtml(role);
  const safeUrl = escapeHtml(inviteUrl);

  await sendEmail({
    to,
    subject: `You've been invited to join ${organizationName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h1 style="font-size: 20px; margin: 0 0 12px;">You've been invited</h1>
        <p style="font-size: 14px; line-height: 1.6;">
          You've been invited to join <strong>${safeOrg}</strong> as a
          <strong>${safeRole}</strong>.
        </p>
        <a href="${safeUrl}"
           style="display: inline-block; margin-top: 16px; padding: 10px 16px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Accept invitation
        </a>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
          This invitation link expires in 7 days.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const safeUrl = escapeHtml(resetUrl);

  await sendEmail({
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h1 style="font-size: 20px; margin: 0 0 12px;">Reset your password</h1>
        <p style="font-size: 14px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to
          choose a new one.
        </p>
        <a href="${safeUrl}"
           style="display: inline-block; margin-top: 16px; padding: 10px 16px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Reset password
        </a>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendBookingConfirmationEmail({
  to,
  organizationName,
  serviceName,
  appointmentStart,
  appointmentEnd,
  customerName,
  customerEmail,
  customerPhone,
}: {
  to: string;
  organizationName: string;
  serviceName: string;
  appointmentStart: string;
  appointmentEnd: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
}): Promise<void> {
  const safeOrg = escapeHtml(organizationName);
  const safeService = escapeHtml(serviceName);
  const safeName = escapeHtml(customerName);
  const safeEmail = escapeHtml(customerEmail);
  const safePhone = escapeHtml(customerPhone ?? "Not provided");

  const date = formatAppointmentDate(appointmentStart);
  const startTime = formatAppointmentTime(appointmentStart);
  const endTime = formatAppointmentTime(appointmentEnd);

  await sendEmail({
    to,
    subject: `Booking confirmed: ${serviceName} on ${date}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h1 style="font-size: 20px; margin: 0 0 12px;">Booking confirmed</h1>
        <p style="font-size: 14px; line-height: 1.6;">
          Your appointment with <strong>${safeOrg}</strong> has been confirmed.
        </p>
        <table style="width: 100%; margin-top: 16px; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Service</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${safeService}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Date</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(date)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Time</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${escapeHtml(startTime)} &ndash; ${escapeHtml(endTime)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Name</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Email</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${safeEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Phone</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${safePhone}</td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
          If you need to change or cancel this appointment, please contact ${safeOrg}.
        </p>
      </div>
    `,
  });
}
