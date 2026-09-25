import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";

interface SecurityCardCopy {
  title: string;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  updateButton: string;
}

/** UI-only: no Supabase updateUser call is wired yet, matching this session's /reset-password precedent. */
export default function SecurityCard({ copy }: { copy: SecurityCardCopy }) {
  return (
    <Card variant="section">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="security-current-password">{copy.currentPasswordLabel}</Label>
          <Input id="security-current-password" type="password" autoComplete="current-password" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="security-new-password">{copy.newPasswordLabel}</Label>
          <Input id="security-new-password" type="password" autoComplete="new-password" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="security-confirm-password">{copy.confirmPasswordLabel}</Label>
          <Input id="security-confirm-password" type="password" autoComplete="new-password" />
        </div>
        <Button type="button" className="self-start">
          {copy.updateButton}
        </Button>
      </CardContent>
    </Card>
  );
}
