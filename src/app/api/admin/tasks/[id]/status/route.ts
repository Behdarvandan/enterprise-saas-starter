import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOperatorAdminOrResponse } from "@/lib/operator";
import { withApiErrorHandling } from "@/lib/api-error";
import { firstIssueMessage } from "@/lib/validation";

const statusSchema = z.object({
  columnStatus: z.enum(["todo", "in_progress", "review", "done"]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PATCH = withApiErrorHandling(
  "Task status update error",
  "Failed to update the task's status.",
  async (request: Request, { params }: RouteParams) => {
    const { id } = await params;

    const result = await requireOperatorAdminOrResponse();
    if ("response" in result) return result.response;
    const { supabase } = result;

    const parsedBody = statusSchema.safeParse(
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
      .update({ column_status: parsedBody.data.columnStatus })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ task });
  },
);
