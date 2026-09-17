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
// domain (e.g. "Pasargad <hello@yourdomain.com>") — see .env.example.
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

// ----------------------------------------------------------------------------
// Pasargad email shell — hardcoded hex, not CSS custom properties: email
// clients don't reliably support `:root`/`var()`, so these mirror
// globals.css's dark-ink/gold tokens (§1.1) as literal values instead of
// referencing them. No inline SVG motif for the same reason (inconsistent
// email-client support) — the wordmark is styled text.
// ----------------------------------------------------------------------------
const EMAIL_COLORS = {
  canvas: "#14121b",
  card: "#1d1a28",
  foreground: "#ede9e1",
  muted: "#94899e",
  primary: "#b08d57",
  primaryForeground: "#1a1520",
  border: "#332f40",
};

function emailButton(label: string, url: string): string {
  return `
    <a href="${url}"
       style="display: inline-block; margin-top: 20px; padding: 12px 22px; background-color: ${EMAIL_COLORS.primary}; color: ${EMAIL_COLORS.primaryForeground}; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
      ${label}
    </a>
  `;
}

function emailShell(title: string, bodyHtml: string): string {
  const year = new Date().getFullYear();
  return `
    <div style="background-color: ${EMAIL_COLORS.canvas}; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
      <div style="max-width: 480px; margin: 0 auto; background-color: ${EMAIL_COLORS.card}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; padding: 32px;">
        <p style="margin: 0 0 24px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${EMAIL_COLORS.primary};">
          Pasargad
        </p>
        <h1 style="font-size: 20px; margin: 0 0 12px; color: ${EMAIL_COLORS.foreground};">${title}</h1>
        ${bodyHtml}
      </div>
      <p style="max-width: 480px; margin: 24px auto 0; padding: 0 8px; text-align: center; font-size: 12px; color: ${EMAIL_COLORS.muted};">
        © ${year} Pasargad. This is an automated notification.
      </p>
    </div>
  `;
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
    html: emailShell(
      "You've been invited",
      `
        <p style="font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.foreground};">
          You've been invited to join <strong>${safeOrg}</strong> as a
          <strong>${safeRole}</strong>.
        </p>
        ${emailButton("Accept invitation", safeUrl)}
        <p style="font-size: 12px; color: ${EMAIL_COLORS.muted}; margin-top: 24px;">
          This invitation link expires in 7 days.
        </p>
      `,
    ),
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
    html: emailShell(
      "Reset your password",
      `
        <p style="font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.foreground};">
          We received a request to reset your password. Click the button below to
          choose a new one.
        </p>
        ${emailButton("Reset password", safeUrl)}
        <p style="font-size: 12px; color: ${EMAIL_COLORS.muted}; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      `,
    ),
  });
}

export async function sendLeadNotificationEmail({
  fullName,
  email,
  kind,
  projectCategory,
  message,
}: {
  fullName: string;
  email: string;
  kind: string;
  projectCategory: string;
  message: string;
}): Promise<void> {
  const to = process.env.LEADS_NOTIFICATION_EMAIL;
  if (!to) return;

  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safeKind = escapeHtml(kind);
  const safeCategory = escapeHtml(projectCategory);
  const safeMessage = escapeHtml(message);

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.muted};">${label}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right; font-weight: 600; color: ${EMAIL_COLORS.foreground};">${value}</td>
    </tr>
  `;

  await sendEmail({
    to,
    subject: `New lead: ${fullName}`,
    html: emailShell(
      "New lead submitted",
      `
        <table style="width: 100%; margin-top: 4px; border-collapse: collapse; font-size: 14px;">
          ${row("Name", safeName)}
          ${row("Email", safeEmail)}
          ${row("Kind", safeKind)}
          ${row("Category", safeCategory)}
        </table>
        <p style="font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.foreground}; margin-top: 16px; white-space: pre-wrap;">${safeMessage}</p>
      `,
    ),
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

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; color: ${EMAIL_COLORS.muted};">${label}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right; font-weight: 600; color: ${EMAIL_COLORS.foreground};">${value}</td>
    </tr>
  `;

  await sendEmail({
    to,
    subject: `Booking confirmed: ${serviceName} on ${date}`,
    html: emailShell(
      "Booking confirmed",
      `
        <p style="font-size: 14px; line-height: 1.6; color: ${EMAIL_COLORS.foreground};">
          Your appointment with <strong>${safeOrg}</strong> has been confirmed.
        </p>
        <table style="width: 100%; margin-top: 16px; border-collapse: collapse; font-size: 14px;">
          ${row("Service", safeService)}
          ${row("Date", escapeHtml(date))}
          ${row("Time", `${escapeHtml(startTime)} &ndash; ${escapeHtml(endTime)}`)}
          ${row("Name", safeName)}
          ${row("Email", safeEmail)}
          ${row("Phone", safePhone)}
        </table>
        <p style="font-size: 12px; color: ${EMAIL_COLORS.muted}; margin-top: 24px;">
          If you need to change or cancel this appointment, please contact ${safeOrg}.
        </p>
      `,
    ),
  });
}
