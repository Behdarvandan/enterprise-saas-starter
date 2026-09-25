"use client";

import { useState } from "react";
import { Button } from "@/core/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/ui/primitives/dialog";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/primitives/select";
import FormStatus from "@/components/ui/FormStatus";
import { useFormAction } from "@/hooks/useFormAction";
import { inviteMember } from "./actions";

interface InviteMemberDialogCopy {
  trigger: string;
  title: string;
  emailLabel: string;
  emailPlaceholder: string;
  roleLabel: string;
  send: string;
  sending: string;
  sent: string;
  roles: { admin: string; member: string };
}

export default function InviteMemberDialog({ copy }: { copy: InviteMemberDialogCopy }) {
  const [open, setOpen] = useState(false);
  const { result, loading, handleSubmit } = useFormAction(inviteMember);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">{copy.trigger}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">{copy.emailLabel}</Label>
            <Input id="invite-email" name="email" type="email" placeholder={copy.emailPlaceholder} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-role">{copy.roleLabel}</Label>
            <Select name="role" defaultValue="member">
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{copy.roles.admin}</SelectItem>
                <SelectItem value="member">{copy.roles.member}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FormStatus error={result?.error} success={result?.success} successMessage={copy.sent} />
          <Button type="submit" loading={loading} className="w-full">
            {loading ? copy.sending : copy.send}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
