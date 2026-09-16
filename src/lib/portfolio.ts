export interface PortfolioItem {
  slug: string;
  title: string;
  summary: string;
  stack: string[];
  outcome: string;
}

/**
 * Static case-study content for the freelance portfolio pages. MVP: a
 * hardcoded array, not a database table — matching the pattern used for
 * `/repair-shops`' static feature/step content elsewhere in the marketing
 * site. Promote this to a real table only if editing it outside a deploy
 * becomes a real need.
 */
const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    slug: "multi-tenant-booking-platform",
    title: "Multi-tenant booking platform for a repair-shop chain",
    summary:
      "Rebuilt a spreadsheet-driven booking process into a self-serve scheduling app with per-location row-level security and a Stripe-backed deposit flow.",
    stack: ["Next.js", "Supabase", "Postgres RLS", "Stripe"],
    outcome:
      "Cut phone-based scheduling to zero and eliminated double-bookings across every location on day one.",
  },
  {
    slug: "ai-knowledge-base-chatbot",
    title: "AI knowledge-base assistant for a SaaS support team",
    summary:
      "Shipped a retrieval-augmented chatbot grounded in the client's own documentation, with streaming responses and per-tenant document isolation.",
    stack: ["pgvector", "OpenAI embeddings", "Groq", "Next.js"],
    outcome:
      "Deflected the majority of first-line support tickets within the first month of launch.",
  },
  {
    slug: "dual-provider-payment-migration",
    title: "Dual-provider payment migration for a regional SaaS product",
    summary:
      "Introduced a provider-agnostic payment adapter so the product could support both Stripe and a local Turkish processor without branching checkout logic.",
    stack: ["Stripe", "PayTR", "Webhooks", "Next.js"],
    outcome:
      "Unlocked billing for customers who couldn't use Stripe, with zero changes to the checkout UI.",
  },
];

export function getPortfolioItems(): PortfolioItem[] {
  return PORTFOLIO_ITEMS;
}

export function getPortfolioItem(slug: string): PortfolioItem | undefined {
  return PORTFOLIO_ITEMS.find((item) => item.slug === slug);
}
