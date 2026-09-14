const FEATURES = [
  {
    title: "Tenant isolation via Row Level Security",
    outcome:
      "Each organization's bookings, documents, and members are invisible to every other organization — enforced by Postgres, not application code.",
    detail:
      "Every tenant-scoped table (appointments, services, documents, chat_messages) enables RLS with policies that call a shared is_org_member(organization_id) function. Organizations themselves have no direct insert policy — they're created atomically with an owner membership through the create_organization RPC, so there's no window where a row exists without an owner.",
  },
  {
    title: "Double-booking prevention at the database level",
    outcome:
      "Two customers can never be confirmed into the same slot, even under concurrent requests.",
    detail:
      "A BEFORE INSERT/UPDATE trigger (prevent_appointment_overlap) takes a row lock on the organization, then scans for any non-cancelled appointment whose time range overlaps the new one, raising an exception if it finds one. The lock serializes concurrent booking attempts for the same tenant, closing the race condition a plain application-level check can't.",
  },
  {
    title: "Semantic search over your knowledge base",
    outcome:
      "The AI assistant finds the right answer even when a visitor's wording doesn't match your documents' wording.",
    detail:
      "Uploaded documents are chunked and embedded (1536-dimension vectors), then indexed with pgvector's HNSW algorithm for fast approximate nearest-neighbor search. The match_document_chunks RPC runs cosine similarity filtered by organization_id first, so retrieval never crosses a tenant boundary.",
  },
  {
    title: "Groq-powered AI assist",
    outcome:
      "Visitor questions get grounded, streamed answers in real time instead of a canned FAQ.",
    detail:
      "Chat completions stream from Groq's llama-3.3-70b-versatile for low-latency responses, with an automatic fallback to OpenAI's gpt-4o-mini if no Groq key is configured. Retrieved knowledge-base chunks are injected as context so answers stay grounded in your organization's actual documents.",
  },
];

export default function FeatureDepth() {
  return (
    <section id="platform" className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold text-ink-primary sm:text-3xl">
        Built on infrastructure, not conventions.
      </h2>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Each of these is enforced where it can&apos;t be bypassed — the database —
        with the architecture detail available for evaluators who want it.
      </p>

      <div className="mt-10 divide-y divide-subtle border-t border-subtle">
        {FEATURES.map((feature) => (
          <details key={feature.title} className="group py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-ink-primary">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">{feature.outcome}</p>
              </div>
              <span
                className="mt-1 shrink-0 rounded-control border border-subtle px-2 py-1 text-xs font-medium text-ink-muted transition-transform group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="mt-4 rounded-control border border-subtle bg-surface p-4 font-mono text-xs leading-relaxed text-ink-muted">
              {feature.detail}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
