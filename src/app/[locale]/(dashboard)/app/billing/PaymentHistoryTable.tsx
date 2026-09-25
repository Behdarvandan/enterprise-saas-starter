import { ExternalLink } from "lucide-react";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";

export interface MockInvoice {
  id: string;
  date: string;
  amount: string;
  status: "paid";
  receiptUrl: string;
}

interface PaymentHistoryTableCopy {
  title: string;
  columns: { date: string; amount: string; status: string; receipt: string };
  statusPaid: string;
  viewReceipt: string;
}

/** Rows shaped to mirror the real getLemonSqueezyInvoices() return type (id/status/total/currency/createdAt/invoiceUrl) for a future drop-in swap. */
export default function PaymentHistoryTable({
  invoices,
  copy,
}: {
  invoices: MockInvoice[];
  copy: PaymentHistoryTableCopy;
}) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.columns.date}</TableHead>
                <TableHead>{copy.columns.amount}</TableHead>
                <TableHead>{copy.columns.status}</TableHead>
                <TableHead>{copy.columns.receipt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                  <TableCell className="font-medium text-foreground">{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge>{copy.statusPaid}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="size-7" asChild>
                      <a
                        href={invoice.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={copy.viewReceipt}
                      >
                        <ExternalLink />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
