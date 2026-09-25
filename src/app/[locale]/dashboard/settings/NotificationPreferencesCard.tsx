"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Switch } from "@/core/ui/primitives/switch";

interface NotificationPreferencesCardCopy {
  title: string;
  emailLabel: string;
  productUpdatesLabel: string;
}

/** UI-only mock: no notification-preferences table exists yet, matching /app/settings' precedent. */
export default function NotificationPreferencesCard({ copy }: { copy: NotificationPreferencesCardCopy }) {
  const [emailOn, setEmailOn] = useState(true);
  const [productOn, setProductOn] = useState(false);

  return (
    <Card variant="section">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-foreground">{copy.emailLabel}</span>
          <Switch checked={emailOn} onCheckedChange={setEmailOn} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-foreground">{copy.productUpdatesLabel}</span>
          <Switch checked={productOn} onCheckedChange={setProductOn} />
        </div>
      </CardContent>
    </Card>
  );
}
