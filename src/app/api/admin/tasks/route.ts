import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOperatorAdminOrResponse } from "@/lib/operator";
import { withApiErrorHandling } from "@/lib/api-error";
import { firstIssueMessage } from "@/lib/validation";

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().optional(),
});

/**
 * POST /api/admin/tasks
 *
 * Uses the caller's RLS-scoped client, not the admin client:
 * `internal_tasks_all_operator_admin` already permits this insert for an
 * operator admin, and there's no cross-cutting side effect (audit log,
 * email) to bundle atomically here — unlike the lead routes.
 */
export const POST = withApiErrorHandling(
  "Task creation error",
  "Failed to create the task.",
  async (request: Request) => {
    const result = await requireOperatorAdminOrResponse();
    if ("response" in result) return result.response;
    const { supabase } = result;

    const parsedBody = createTaskSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: firstIssueMessage(parsedBody.error) },
        { status: 400 },
      );
    }

    const { data: task, error } = await supabase
      .from("internal_tasks")
      .insert({
        title: parsedBody.data.title,
        description: parsedBody.data.description?.trim() || null,
      })
      .select()
      .single();

    if (error || !task) {
      return NextResponse.json(
        { error: "Failed to create the task." },
        { status: 400 },
      );
    }

    return NextResponse.json({ task });
  },
);
