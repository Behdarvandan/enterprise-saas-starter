"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LegacyCard from "@/components/ui/LegacyCard";
import LegacyButton from "@/components/ui/LegacyButton";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") ?? "/dashboard";

    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-20 sm:px-6">
      <LegacyCard className="p-8">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-control bg-violet text-white">
          <LogIn size={22} />
        </div>
        <h1 className="text-xl font-bold text-ink-primary">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Use your Supabase credentials to continue.
        </p>

        <form onSubmit={handleSignIn} className="mt-6 space-y-4">
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
            />
          </div>

          {error && (
            <p className="rounded-control bg-status-error/10 px-3 py-2 text-xs font-medium text-status-error">
              {error}
            </p>
          )}

          <LegacyButton type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign in"}
          </LegacyButton>

          <p className="text-center text-sm text-ink-muted">
            <Link
              href="/forgot-password"
              className="font-semibold text-violet-dim hover:text-violet"
            >
              Forgot password?
            </Link>
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-violet-dim hover:text-violet"
          >
            Sign up
          </Link>
        </p>
      </LegacyCard>
    </div>
  );
}
