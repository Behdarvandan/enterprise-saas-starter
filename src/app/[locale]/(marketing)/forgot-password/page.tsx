"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import LegacyCard from "@/components/ui/LegacyCard";
import LegacyButton from "@/components/ui/LegacyButton";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResetRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await requestPasswordReset(email);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setMessage(
      "If an account exists for this email, a password reset link has been sent.",
    );
    setLoading(false);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
      <LegacyCard className="p-8">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-control bg-violet text-white">
          <KeyRound size={22} />
        </div>
        <h1 className="text-xl font-bold text-ink-primary">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enter the email associated with your account and we&apos;ll send you a
          reset link.
        </p>

        <form onSubmit={handleResetRequest} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
            />
          </div>

          {error && (
            <p className="rounded-control bg-status-error/10 px-3 py-2 text-xs font-medium text-status-error">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-control bg-status-success/10 px-3 py-2 text-xs font-medium text-status-success">
              {message}
            </p>
          )}

          <LegacyButton type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send reset link"}
          </LegacyButton>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Remembered your password?{" "}
          <Link href="/login" className="font-semibold text-violet-dim hover:text-violet">
            Sign in
          </Link>
        </p>
      </LegacyCard>
    </div>
  );
}
