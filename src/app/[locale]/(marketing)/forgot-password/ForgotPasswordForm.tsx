"use client";

import { useState } from "react";
import { Button } from "@/core/ui/primitives/button";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";
import { requestPasswordReset } from "./actions";

interface ForgotPasswordFormCopy {
  emailLabel: string;
  sendButton: string;
  sending: string;
  successMessage: string;
}

/** Wired to the real requestPasswordReset server action — the only auth page with a working backend already in place. */
export default function ForgotPasswordForm({ copy }: { copy: ForgotPasswordFormCopy }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("pending");
    setError(null);

    const result = await requestPasswordReset(email);
    if (result.error) {
      setError(result.error);
      setStatus("error");
      return;
    }
    setStatus("success");
  }

  if (status === "success") {
    return <p className="text-sm text-foreground">{copy.successMessage}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="forgot-password-email">{copy.emailLabel}</Label>
        <Input
          id="forgot-password-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" loading={status === "pending"}>
        {status === "pending" ? copy.sending : copy.sendButton}
      </Button>
    </form>
  );
}
