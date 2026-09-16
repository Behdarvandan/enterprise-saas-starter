import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { requireMembershipOrResponse } from "@/lib/auth";
import { withApiErrorHandling } from "@/lib/api-error";
import InvoicePdfDocument from "@/components/pdf/InvoicePdfDocument";

// @react-pdf/renderer's renderToStream is Node-only (no edge runtime support).
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/client/invoices/[id]/pdf
 *
 * Streams a generated PDF for one of the caller's own invoices. RLS already
 * scopes `client_invoices` reads to the caller's organization, but the
 * explicit `organization_id` check below is defense in depth, matching the
 * pattern used for cross-tenant checks elsewhere (e.g. booking checkout).
 */
export const GET = withApiErrorHandling(
  "Invoice PDF error",
  "Failed to generate the invoice PDF.",
  async (_request: Request, { params }: RouteParams) => {
    const { id } = await params;

    const result = await requireMembershipOrResponse();
    if ("response" in result) return result.response;

    const { supabase, membership } = result;

    const { data: invoice } = await supabase
      .from("client_invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!invoice || invoice.organization_id !== membership.organizationId) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const { data: organization } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", membership.organizationId)
      .single();

    const nodeStream = await renderToStream(
      <InvoicePdfDocument
        invoice={invoice}
        organizationName={organization?.name ?? "Customer"}
      />,
    );

    // `renderToStream`'s type is the narrower `NodeJS.ReadableStream`
    // interface, but the object it returns is an actual `Readable`
    // instance — `Readable.toWeb` needs the concrete class.
    return new NextResponse(Readable.toWeb(nodeStream as Readable) as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  },
);
