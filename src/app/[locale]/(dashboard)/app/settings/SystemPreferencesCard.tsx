"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/primitives/select";
import { Switch } from "@/core/ui/primitives/switch";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  fa: "فارسی",
};

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "Europe/Istanbul",
  "Asia/Tehran",
  "Europe/Berlin",
];

interface SystemPreferencesCardCopy {
  title: string;
  defaultLocaleLabel: string;
  timezoneLabel: string;
  emailNotificationsLabel: string;
  productUpdatesLabel: string;
}

/** UI-only mock: no persistence, all state is local. */
export default function SystemPreferencesCard({
  defaultLocale,
  timezone,
  emailNotifications,
  productUpdates,
  copy,
}: {
  defaultLocale: string;
  timezone: string;
  emailNotifications: boolean;
  productUpdates: boolean;
  copy: SystemPreferencesCardCopy;
}) {
  const [locale, setLocale] = useState(defaultLocale);
  const [tz, setTz] = useState(timezone);
  const [emailOn, setEmailOn] = useState(emailNotifications);
  const [productOn, setProductOn] = useState(productUpdates);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="preferences-locale" className="text-sm font-medium text-foreground">
              {copy.defaultLocaleLabel}
            </label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger id="preferences-locale" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routing.locales.map((code) => (
                  <SelectItem key={code} value={code}>
                    {LOCALE_LABELS[code] ?? code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="preferences-timezone" className="text-sm font-medium text-foreground">
              {copy.timezoneLabel}
            </label>
            <Select value={tz} onValueChange={setTz}>
              <SelectTrigger id="preferences-timezone" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-foreground">{copy.emailNotificationsLabel}</span>
            <Switch checked={emailOn} onCheckedChange={setEmailOn} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-foreground">{copy.productUpdatesLabel}</span>
            <Switch checked={productOn} onCheckedChange={setProductOn} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
