"use client";

import { useState, type ReactNode } from "react";
import { Github } from "lucide-react";
import { Button } from "@/core/ui/primitives/button";
import { signInWithProvider, type OAuthProvider } from "@/modules/auth/service";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A11.998 11.998 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A11.998 11.998 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden fill="currentColor">
      <path d="M16.36 1.43c0 1.14-.42 2.2-1.24 3.06-.85.9-2.05 1.6-3.24 1.5a3.53 3.53 0 0 1 .9-2.9c.85-1 2.36-1.72 3.58-1.66Zm3.45 16.53c-.5 1.16-.74 1.68-1.38 2.71-.9 1.44-2.16 3.24-3.74 3.26-1.4.02-1.76-.9-3.66-.9-1.9 0-2.3.88-3.7.92-1.58.05-2.78-1.55-3.68-2.98C1.5 17.7.75 13.15 2.4 10.06c.82-1.53 2.3-2.5 3.9-2.53 1.44-.02 2.8.97 3.68.97.88 0 2.53-1.2 4.27-1.02.73.03 2.77.29 4.08 2.2-.1.07-2.44 1.42-2.41 4.24.03 3.37 2.96 4.5 2.99 4.51Z" />
    </svg>
  );
}

const PROVIDERS: { id: OAuthProvider; label: string; icon: ReactNode }[] = [
  { id: "google", label: "Google", icon: <GoogleIcon /> },
  { id: "github", label: "GitHub", icon: <Github size={18} aria-hidden /> },
  { id: "apple", label: "Apple", icon: <AppleIcon /> },
];

export default function OAuthButtons() {
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(provider: OAuthProvider) {
    setPending(provider);
    setError(null);

    const { error } = await signInWithProvider(provider);
    if (error) {
      setError(error);
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-subtle" />
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">or continue with</span>
        <div className="h-px flex-1 bg-subtle" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PROVIDERS.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="secondary"
            disabled={pending !== null}
            loading={pending === provider.id}
            onClick={() => handleClick(provider.id)}
            aria-label={`Continue with ${provider.label}`}
            className="justify-center"
          >
            {provider.icon}
          </Button>
        ))}
      </div>

      {error && (
        <p className="rounded-control bg-status-error/10 px-3 py-2 text-xs font-medium text-status-error">{error}</p>
      )}
    </div>
  );
}
