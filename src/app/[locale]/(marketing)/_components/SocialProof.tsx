export default function SocialProof() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <p className="text-center text-xs font-medium text-ink-muted">
        Customer stories — placeholder, pending real logos and quotes
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((slot) => (
          <div
            key={slot}
            className="flex h-40 flex-col justify-between border border-dashed border-subtle p-6 text-ink-muted"
          >
            <div className="h-6 w-24 rounded-control bg-surface-raised" />
            <p className="text-xs">Testimonial slot — not yet populated</p>
          </div>
        ))}
      </div>
    </section>
  );
}
