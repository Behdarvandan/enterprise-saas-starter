// @vitest-environment node
//
// Render smoke tests: each agency page (an async Server Component) is called
// with a fake session/data and server-rendered to HTML. Unit tests cover the
// logic; this catches what they can't — a page or component that throws while
// rendering real-shaped data, or drops content the UI is supposed to show.
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// React's SSR separates adjacent text nodes with `<!-- -->`; strip them so
// assertions read like the text a user sees.
function render(element: ReactElement): string {
  return renderToString(element).replace(/<!-- -->/g, "");
}

const AGENCY = {
  id: "99999999-0000-0000-0000-000000000009",
  name: "Acme Agency",
  cname_domain: "ai.acme.com",
  cname_status: "active",
  cname_verified_at: "2026-09-10T08:00:00Z",
  branding: { title: "Acme AI", logo_url: "https://cdn.acme.com/logo.svg", primary_color: "#7c3aed", api_key: "sk-must-not-render" },
  master_tenant_id: "11111111-0000-0000-0000-000000000001",
  quota_pool: 10_000,
};

const requireAgencyAdminMock = vi.fn();
const adminFromMock = vi.fn();

vi.mock("@/lib/agency/admin", () => ({ requireAgencyAdmin: requireAgencyAdminMock }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: adminFromMock }) }));
vi.mock("@/lib/payment/handlers", () => ({
  DEFAULT_ENABLED_SKILLS: ["rag_search"],
  PLAN_ENABLED_SKILLS: { pro: ["rag_search", "calendar_booking"] },
  applyTenantEnabledSkills: vi.fn(),
}));
vi.mock("@/i18n/navigation", async () => {
  const React = await import("react");
  return {
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
      React.createElement("a", { href, ...rest }, children),
    usePathname: () => "/agency/tenants",
    useRouter: () => ({ refresh: () => {}, push: () => {} }),
  };
});
// Server Actions are only referenced by client components here; never invoked.
vi.mock("./tenants/actions", () => ({
  linkTenant: vi.fn(),
  createTenant: vi.fn(),
  unlinkTenant: vi.fn(),
  allocateQuota: vi.fn(),
  updateTenantSkills: vi.fn(),
}));
vi.mock("./branding/actions", () => ({ updateAgencyBranding: vi.fn() }));

interface Result {
  data: unknown;
  error?: unknown;
}

/** A PostgREST-style builder: any chain of filters, awaited to `result`. */
function builder(result: Result) {
  const settled = { error: null, ...result };
  const self: Record<string, unknown> = {
    then: (resolve: (value: Result) => unknown) => Promise.resolve(settled).then(resolve),
  };
  for (const method of ["select", "eq", "in", "order", "limit"]) self[method] = () => self;
  self.maybeSingle = async () => settled;
  return self;
}

function useSession(options: { tables?: Record<string, Result>; rpc?: Result }) {
  requireAgencyAdminMock.mockResolvedValue({
    supabase: {
      from: (table: string) => builder(options.tables?.[table] ?? { data: [] }),
      rpc: async () => ({ error: null, ...(options.rpc ?? { data: [] }) }),
    },
    user: { id: "user-1" },
    agency: AGENCY,
  });
}

const USAGE_ROWS = [
  {
    tenant_id: "22222222-0000-0000-0000-000000000002",
    tenant_name: "Fix-It Repairs",
    tenant_slug: "fix-it",
    quota_granted: 5000,
    quota_allocation: 500,
    rag_requests: 42,
    completions: 40,
    low_confidence: 6,
    quota_exhausted: 2,
    last_activity_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
  },
  {
    tenant_id: "33333333-0000-0000-0000-000000000003",
    tenant_name: "Bright Dental",
    tenant_slug: "bright-dental",
    quota_granted: 0,
    quota_allocation: 0,
    rag_requests: 0,
    completions: 0,
    low_confidence: 0,
    quota_exhausted: 0,
    last_activity_at: null,
  },
];

describe("agency pages (server-rendered)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminFromMock.mockImplementation(() =>
      builder({
        data: [
          {
            tenant_id: "22222222-0000-0000-0000-000000000002",
            version: 3,
            config: { crew_config: { enabled_skills: ["rag_search", "calendar_booking"] } },
          },
        ],
      }),
    );
  });

  describe("tenants", () => {
    it("lists tenants with pool, usage and skills", async () => {
      useSession({
        tables: {
          agency_tenants: {
            data: [
              { tenant_id: "22222222-0000-0000-0000-000000000002", quota_allocation: 500, quota_granted: 5000, organizations: { name: "Fix-It Repairs", slug: "fix-it" } },
              { tenant_id: "33333333-0000-0000-0000-000000000003", quota_allocation: 0, quota_granted: 0, organizations: { name: "Bright Dental", slug: "bright-dental" } },
            ],
          },
          organizations: { data: { plan_id: "pro" } },
        },
      });
      const { default: Page } = await import("./tenants/page");

      const html = render(await Page());

      expect(html).toContain("Fix-It Repairs");
      expect(html).toContain("fix-it");
      expect(html).toContain("Bright Dental");
      expect(html).toContain("No tokens allocated"); // unallocated tenant
      expect(html).toContain("500 left of 5,000"); // remaining / granted, formatted
      expect(html).toContain("90% used");
      expect(html).toContain("calendar booking"); // enabled skill badge
      expect(html).toContain("10,000"); // pool
      expect(html).toContain("Add tenant");
      expect(html).toContain('role="progressbar"');
    });

    it("shows the empty state with a call to action when there are no tenants", async () => {
      useSession({ tables: { agency_tenants: { data: [] }, organizations: { data: { plan_id: "pro" } } } });
      const { default: Page } = await import("./tenants/page");

      const html = render(await Page());

      expect(html).toContain("No tenants yet");
      expect(html).toContain("Add your first tenant");
      expect(adminFromMock).not.toHaveBeenCalled(); // no tenant ids -> no tenant_configs read
    });

    it("explains an empty token pool", async () => {
      requireAgencyAdminMock.mockResolvedValue({
        supabase: { from: () => builder({ data: [] }), rpc: async () => ({ data: [], error: null }) },
        user: { id: "u" },
        agency: { ...AGENCY, quota_pool: 0 },
      });
      const { default: Page } = await import("./tenants/page");

      expect(render(await Page())).toContain("pool is empty");
    });

    it("surfaces a failed query to the error boundary instead of rendering partial data", async () => {
      useSession({ tables: { agency_tenants: { data: null, error: new Error("db down") } } });
      const { default: Page } = await import("./tenants/page");

      await expect(Page()).rejects.toThrow("db down");
    });
  });

  describe("branding", () => {
    it("prefills the form, shows the verified domain, and never renders unknown branding keys", async () => {
      useSession({});
      const { default: Page } = await import("./branding/page");

      const html = render(await Page());

      expect(html).toContain('value="Acme AI"');
      expect(html).toContain('value="https://cdn.acme.com/logo.svg"');
      expect(html).toContain('value="#7c3aed"');
      expect(html).toContain('value="ai.acme.com"');
      expect(html).toContain("cname.pasargad.app"); // DNS record target
      expect(html).toContain("Verified. Visitors on ai.acme.com see your branding.");
      expect(html).not.toContain("sk-must-not-render");
    });

    it("asks for a domain first when none is saved", async () => {
      requireAgencyAdminMock.mockResolvedValue({
        supabase: {},
        user: { id: "u" },
        agency: { ...AGENCY, cname_domain: null, cname_status: "pending", cname_verified_at: null, branding: {} },
      });
      const { default: Page } = await import("./branding/page");

      const html = render(await Page());

      expect(html).toContain("Save a custom domain above first");
      expect(html).not.toContain("Verify DNS");
    });

    it("shows the failed state with the expected target", async () => {
      requireAgencyAdminMock.mockResolvedValue({
        supabase: {},
        user: { id: "u" },
        agency: { ...AGENCY, cname_status: "failed", cname_verified_at: null },
      });
      const { default: Page } = await import("./branding/page");

      const html = render(await Page());

      expect(html).toContain("doesn&#x27;t point to cname.pasargad.app");
      expect(html).toContain("Verify DNS");
    });
  });

  describe("analytics", () => {
    it("shows KPIs, the per-tenant table and Dev Crew recommendations", async () => {
      useSession({
        rpc: { data: USAGE_ROWS },
        tables: {
          audit_logs: {
            data: [
              {
                id: "log-1",
                created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
                organization_id: "22222222-0000-0000-0000-000000000002",
                metadata: { recommendation: "Add refund policy to the knowledge base.", negative_count: 3 },
              },
            ],
          },
        },
      });
      const { default: Page } = await import("./analytics/page");

      const html = render(await Page({ searchParams: Promise.resolve({ days: "7" }) }));

      expect(html).toContain("AI requests");
      expect(html).toContain("last 7 days"); // the window is reflected in the KPI hints
      expect(html).toContain("Fix-It Repairs");
      expect(html).toContain("Bright Dental");
      expect(html).toContain("Add refund policy to the knowledge base.");
      expect(html).toContain("3 signals");
      expect(html).toContain("Need attention");
      expect(html).toContain('aria-current="true"'); // active window link
    });

    it("falls back to 30 days for an unsupported window", async () => {
      useSession({ rpc: { data: USAGE_ROWS } });
      const { default: Page } = await import("./analytics/page");

      const html = render(await Page({ searchParams: Promise.resolve({ days: "9999" }) }));

      expect(html).toContain("last 30 days");
    });

    it("shows an empty state when the agency has no tenants", async () => {
      useSession({ rpc: { data: [] } });
      const { default: Page } = await import("./analytics/page");

      const html = render(await Page({ searchParams: Promise.resolve({}) }));

      expect(html).toContain("Nothing to analyze yet");
    });

    it("surfaces an RPC failure to the error boundary", async () => {
      useSession({ rpc: { data: null, error: new Error("rpc failed") } });
      const { default: Page } = await import("./analytics/page");

      await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow("rpc failed");
    });
  });
});
