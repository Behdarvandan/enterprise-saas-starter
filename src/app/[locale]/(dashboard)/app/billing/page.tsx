import { getTranslations } from "next-intl/server";
import CurrentPlanCard from "./CurrentPlanCard";
import PaymentHistoryTable, { type MockInvoice } from "./PaymentHistoryTable";
import PlanComparisonGrid from "./PlanComparisonGrid";
import UsageMetersCard from "./UsageMetersCard";

const USAGE = { vectorStoragePct: 62, tokenUsagePct: 45, apiCallsPct: 78 };

const INVOICES: MockInvoice[] = [
  { id: "1", date: "2026-09-01", amount: "$149.00", status: "paid", receiptUrl: "#" },
  { id: "2", date: "2026-08-01", amount: "$149.00", status: "paid", receiptUrl: "#" },
  { id: "3", date: "2026-07-01", amount: "$149.00", status: "paid", receiptUrl: "#" },
  { id: "4", date: "2026-06-01", amount: "$149.00", status: "paid", receiptUrl: "#" },
  { id: "5", date: "2026-05-01", amount: "$149.00", status: "paid", receiptUrl: "#" },
];

export default async function BillingPage() {
  const t = await getTranslations("dashboard.appBilling");

  const tiers = [
    {
      id: "starter" as const,
      name: t("plans.starter.name"),
      price: t("plans.starter.price"),
      features: t.raw("plans.starter.features") as string[],
    },
    {
      id: "pro" as const,
      name: t("plans.pro.name"),
      price: t("plans.pro.price"),
      features: t.raw("plans.pro.features") as string[],
    },
    {
      id: "enterprise" as const,
      name: t("plans.enterprise.name"),
      price: t("plans.enterprise.price"),
      features: t.raw("plans.enterprise.features") as string[],
    },
  ];

  return (
    <div className="flex flex-col gap-1 p-6">
      <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{t("description")}</p>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CurrentPlanCard
            price={t("plans.pro.price")}
            renewsOn="2026-10-25"
            copy={{
              title: t("currentPlan.title"),
              planName: t("currentPlan.planName"),
              renewsLabel: t("currentPlan.renewsLabel"),
              statusActive: t("currentPlan.statusActive"),
              manageButton: t("currentPlan.manageButton"),
            }}
          />
          <UsageMetersCard
            vectorStoragePct={USAGE.vectorStoragePct}
            tokenUsagePct={USAGE.tokenUsagePct}
            apiCallsPct={USAGE.apiCallsPct}
            copy={{
              title: t("usage.title"),
              vectorStorageLabel: t("usage.vectorStorageLabel"),
              tokenUsageLabel: t("usage.tokenUsageLabel"),
              apiCallsLabel: t("usage.apiCallsLabel"),
            }}
          />
        </div>

        <PlanComparisonGrid
          tiers={tiers}
          currentTierId="pro"
          copy={{
            title: t("plans.title"),
            currentBadge: t("plans.currentBadge"),
            upgradeButton: t("plans.upgradeButton"),
          }}
        />

        <PaymentHistoryTable
          invoices={INVOICES}
          copy={{
            title: t("invoices.title"),
            columns: {
              date: t("invoices.columns.date"),
              amount: t("invoices.columns.amount"),
              status: t("invoices.columns.status"),
              receipt: t("invoices.columns.receipt"),
            },
            statusPaid: t("invoices.statusPaid"),
            viewReceipt: t("invoices.viewReceipt"),
          }}
        />
      </div>
    </div>
  );
}
