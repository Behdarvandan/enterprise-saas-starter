import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/anon";
import { checkRateLimit, leadRatelimit } from "@/lib/rate-limit";
import { firstIssueMessage } from "@/lib/validation";
import { withApiErrorHandling } from "@/lib/api-error";
import { sendLeadNotificationEmail } from "@/lib/email";

const leadSchema = z.object({
  kind: z.enum(["saas", "freelance"]),
  fullName: z.string().trim().min(1, "Full name is required."),
  email: z.string().trim().email("A valid email is required."),
  phone: z.string().optional(),
  company: z.string().optional(),
  projectCategory: z.enum([
    "fullstack_saas",
    "ai_automation",
    "architecture_security",
    "payment_subscription",
  ]),
  workingMode: z.enum(["hourly", "project", "either"]).optional(),
  projectScope: z.string().optional(),
  message: z.string().trim().min(1, "A short description is required."),
  source: z.string().optional(),
});

/**
 * POST /api/leads
 *
 * Public, anonymous lead-intake endpoint backing the "Teklif Al" quote form
 * on `/solutions` (the marketing site's only lead-capture form — `/product`
 * links to `/solutions` instead of embedding a form). Writes go through the
 * `submit_lead` SECURITY DEFINER RPC via the anon-scoped client — the RPC
 * hardcodes `organization_id` to the operator organization server-side, so
 * this route never touches the `leads` table directly and can't be tricked
 * into writing to (or reading from) any tenant's data.
 */
export const POST = withApiErrorHandling(
  "Lead intake error",
  "Failed to submit your request.",
  async (request: Request) => {
    const parsedBody = leadSchema.safeParse(
      await request.json().catch(() => null),
    );

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: firstIssueMessage(parsedBody.error) },
        { status: 400 },
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
    const allowed = await checkRateLimit(`lead:${ip}`, leadRatelimit);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 },
      );
    }

    const { kind, fullName, email, projectCategory, message } = parsedBody.data;
    const phone = parsedBody.data.phone?.trim() || null;
    const company = parsedBody.data.company?.trim() || null;
    const workingMode = parsedBody.data.workingMode?.trim() || null;
    const projectScope = parsedBody.data.projectScope?.trim() || null;
    const source = parsedBody.data.source?.trim() || null;

    const anon = createAnonClient();
    const { error } = await anon.rpc("submit_lead", {
      p_kind: kind,
      p_full_name: fullName,
      p_email: email,
      p_phone: phone,
      p_company: company,
      p_project_category: projectCategory,
      p_working_mode: workingMode,
      p_project_scope: projectScope,
      p_message: message.trim(),
      p_source: source,
    });

    if (error) {
      console.error("submit_lead RPC error:", error);
      return NextResponse.json(
        { error: "Failed to submit your request." },
        { status: 400 },
      );
    }

    try {
      await sendLeadNotificationEmail({
        fullName,
        email,
        kind,
        projectCategory,
        message: message.trim(),
      });
    } catch (emailError) {
      console.error("Failed to send lead notification email:", emailError);
      Sentry.captureException(emailError, { extra: { email } });
    }

    return NextResponse.json({ success: true });
  },
);
