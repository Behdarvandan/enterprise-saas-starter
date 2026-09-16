import { NextResponse } from "next/server";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/anon";
import { checkRateLimit, leadRatelimit } from "@/lib/rate-limit";
import { firstIssueMessage } from "@/lib/validation";
import { withApiErrorHandling } from "@/lib/api-error";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const leadSchema = z.object({
  kind: z.enum(["saas", "freelance"]),
  fullName: z.string().trim().min(1, "Full name is required."),
  email: z.string().trim().email("A valid email is required."),
  phone: z.string().optional(),
  company: z.string().optional(),
  budgetRange: z.string().optional(),
  projectScope: z.string().optional(),
  deadline: z
    .string()
    .regex(DATE_PATTERN, "A valid deadline (YYYY-MM-DD) is required.")
    .optional()
    .or(z.literal("")),
  message: z.string().optional(),
  source: z.string().optional(),
});

/**
 * POST /api/leads
 *
 * Public, anonymous lead-intake endpoint backing the marketing site's
 * contact form (`/saas`, `/freelance`, `/contact`). Writes go through the
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

    const { kind, fullName, email } = parsedBody.data;
    const phone = parsedBody.data.phone?.trim() || null;
    const company = parsedBody.data.company?.trim() || null;
    const budgetRange = parsedBody.data.budgetRange?.trim() || null;
    const projectScope = parsedBody.data.projectScope?.trim() || null;
    const deadline = parsedBody.data.deadline?.trim() || null;
    const message = parsedBody.data.message?.trim() || null;
    const source = parsedBody.data.source?.trim() || null;

    const anon = createAnonClient();
    const { error } = await anon.rpc("submit_lead", {
      p_kind: kind,
      p_full_name: fullName,
      p_email: email,
      p_phone: phone,
      p_company: company,
      p_budget_range: budgetRange,
      p_project_scope: projectScope,
      p_deadline: deadline,
      p_message: message,
      p_source: source,
    });

    if (error) {
      console.error("submit_lead RPC error:", error);
      return NextResponse.json(
        { error: "Failed to submit your request." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  },
);
