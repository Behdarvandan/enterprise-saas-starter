import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ClientInvoice } from "@/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { color: "#666666" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: { color: "#666666" },
  value: { fontWeight: 700 },
  table: { marginTop: 24, borderTopWidth: 1, borderTopColor: "#dddddd" },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
  },
  total: { marginTop: 16, alignItems: "flex-end" },
  totalText: { fontSize: 14, fontWeight: 700 },
});

interface InvoicePdfDocumentProps {
  invoice: ClientInvoice;
  organizationName: string;
}

/**
 * Server-rendered invoice PDF, generated on request (not cached in storage
 * — see Faz 3's PDF-generation decision) from `client_invoices` row data.
 */
export default function InvoicePdfDocument({
  invoice,
  organizationName,
}: InvoicePdfDocumentProps) {
  const amountFormatted = (invoice.amount / 100).toLocaleString(undefined, {
    style: "currency",
    currency: invoice.currency.toUpperCase(),
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Invoice {invoice.invoice_number}</Text>
          <Text style={styles.subtitle}>Billed to {organizationName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{invoice.status.toUpperCase()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Due date</Text>
          <Text style={styles.value}>{invoice.due_date ?? "N/A"}</Text>
        </View>
        {invoice.paid_at && (
          <View style={styles.row}>
            <Text style={styles.label}>Paid at</Text>
            <Text style={styles.value}>
              {new Date(invoice.paid_at).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text>Invoice total</Text>
            <Text>{amountFormatted}</Text>
          </View>
        </View>

        <View style={styles.total}>
          <Text style={styles.totalText}>Total due: {amountFormatted}</Text>
        </View>
      </Page>
    </Document>
  );
}
