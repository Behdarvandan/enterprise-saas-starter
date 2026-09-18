"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { createTenant, linkTenant, type AgencyActionResult } from "@/app/[locale]/agency/tenants/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FormStatus from "@/components/ui/FormStatus";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SLUG_PATTERN = "[a-z0-9]+(-[a-z0-9]+)*";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

/** "Add tenant" button + dialog: link an organization you own, or create a new one. */
export default function AddTenantDialog({ triggerLabel = "Add tenant" }: { triggerLabel?: string }) {
  const router = useRouter();
  const idPrefix = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  function reset() {
    setError(undefined);
    setName("");
    setSlug("");
    setSlugEdited(false);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function submit(event: FormEvent<HTMLFormElement>, action: (data: FormData) => Promise<AgencyActionResult>) {
    event.preventDefault();
    setError(undefined);
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const outcome = await action(data);
      if (outcome.success) {
        router.refresh();
        handleOpenChange(false);
      } else {
        setError(outcome.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a tenant</DialogTitle>
          <DialogDescription>
            Tenants are the client organizations you manage. Each one draws from your token pool.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" onValueChange={() => setError(undefined)}>
          <TabsList className="w-full">
            <TabsTrigger value="create">Create new</TabsTrigger>
            <TabsTrigger value="link">Link existing</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="pt-3">
            <form onSubmit={(event) => submit(event, createTenant)} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor={`${idPrefix}-name`}>Tenant name</Label>
                <Input
                  id={`${idPrefix}-name`}
                  name="name"
                  required
                  maxLength={80}
                  autoComplete="off"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (!slugEdited) setSlug(slugify(event.target.value));
                  }}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${idPrefix}-slug`}>Slug</Label>
                <Input
                  id={`${idPrefix}-slug`}
                  name="slug"
                  required
                  minLength={3}
                  maxLength={48}
                  pattern={SLUG_PATTERN}
                  autoComplete="off"
                  className="font-mono"
                  value={slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setSlug(event.target.value.toLowerCase());
                  }}
                  aria-describedby={`${idPrefix}-slug-hint`}
                />
                <p id={`${idPrefix}-slug-hint`} className="text-xs text-ink-muted">
                  Lowercase letters, numbers and hyphens. You become the owner of the new
                  organization.
                </p>
              </div>
              <FormStatus error={error} successMessage="" />
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Creating…" : "Create tenant"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="link" className="pt-3">
            <form onSubmit={(event) => submit(event, linkTenant)} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor={`${idPrefix}-link-slug`}>Organization slug</Label>
                <Input
                  id={`${idPrefix}-link-slug`}
                  name="slug"
                  required
                  pattern={SLUG_PATTERN}
                  autoComplete="off"
                  className="font-mono"
                  aria-describedby={`${idPrefix}-link-hint`}
                />
                <p id={`${idPrefix}-link-hint`} className="text-xs text-ink-muted">
                  Only organizations you own can be linked. Linking lets you see its usage, chats
                  and insights.
                </p>
              </div>
              <FormStatus error={error} successMessage="" />
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Linking…" : "Link tenant"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
