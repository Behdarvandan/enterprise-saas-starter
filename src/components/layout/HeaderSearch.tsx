"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";

/** Header search: hands the question to the agent playground, which answers from the knowledge base. */
export default function HeaderSearch() {
  const t = useTranslations("shell.search");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/dashboard/chatbot?q=${encodeURIComponent(trimmed)}`);
    setQuery("");
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative hidden w-full max-w-sm sm:block">
      <Search
        aria-hidden
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("label")}
        className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/50 ps-9 pe-3 text-sm text-slate-100 transition-colors outline-none placeholder:text-slate-500 focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/30"
      />
    </form>
  );
}
