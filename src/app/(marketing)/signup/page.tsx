"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LegacyCard from "@/components/ui/LegacyCard";
import LegacyButton from "@/components/ui/LegacyButton";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // When email confirmation is enabled, no session is returned and the
    // user must verify their address before signing in.
    if (!data.session) {
      setMessage(
        "Account created. Check your email to confirm your account before signing in.",
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
      <LegacyCard className="p-8">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-control bg-violet text-white">
          <UserPlus size={22} />
        </div>
        <h1 className="text-xl font-bold text-ink-primary">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Set up your organization&apos;s booking workspace on Nimbus.
        </p>

        <form onSubmit={handleSignUp} className="mt-6 space-y-4">
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

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="block text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Creating account..." : "Create account"}
          </LegacyButton>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-violet-dim hover:text-violet">
            Sign in
          </Link>
        </p>
      </LegacyCard>
    </div>
  );
}
