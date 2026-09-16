"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";

export interface FormActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Wraps a Server Action shaped `(formData) => Promise<{ error?, success? }>`
 * with the loading/result state and `<form onSubmit>` handler that most
 * dashboard forms in this app otherwise repeat by hand. Refreshes the router
 * on success, matching the existing forms' behavior.
 */
export function useFormAction<T extends FormActionResult>(
  action: (formData: FormData) => Promise<T>,
) {
  const router = useRouter();
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const res = await action(formData);

    setResult(res);
    setLoading(false);

    if (res.success) router.refresh();
  }

  return { result, loading, handleSubmit };
}
