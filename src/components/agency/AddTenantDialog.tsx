"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent } from "react";
import { createTenant, linkTenant, type AgencyActionResult } from "@/app/[locale]/agency/tenants/actions";
import OwnedOrganizationPicker from "@/components/agency/OwnedOrganizationPicker";
import { Button } from "@/core/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/ui/primitives/dialog";
import FormStatus from "@/components/ui/FormStatus";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/ui/primitives/tabs";
import { useRouter } from "@/i18n/navigation";
import type { LinkableOrganization } from "@/lib/agency/linkable";
import { toast } from "@/lib/toast";

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

interface AddTenantDialogProps {
  /** Organizations the caller owns that can be attached. */
  linkable: LinkableOrganization[];
  /** `first` labels the trigger for the empty state. */
  variant?: "default" | "first";
}

/** "Add tenant" button + dialog: create a new organization, or pick one you own to link. */
export default function AddTenantDialog({ linkable, variant = "default" }: AddTenantDialogProps) {
  const t = useTranslations("agency.tenants.add");
  const router = useRouter();
  const idPrefix = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  function reset() {
    setError(undefined);
    setName("");
    setSlug("");
    setSlugEdited(false);
    setSelectedOrg(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function run(action: (data: FormData) => Promise<AgencyActionResult>, data: FormData, successTitle: string) {
    setError(undefined);
    startTransition(async () => {
      const outcome = await action(data);
      if (outcome.success) {
        toast({ tone: "success", title: successTitle });
        router.refresh();
        handleOpenChange(false);
      } else {
        setError(outcome.error);
      }
    });
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(createTenant, new FormData(event.currentTarget), t("created"));
  }

  function handleLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrg) return;
    const data = new FormData();
    data.set("organizationId", selectedOrg);
    run(linkTenant, data, t("linked"));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden /> {variant === "first" ? t("triggerFirst") : t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" onValueChange={() => setError(undefined)}>
          <TabsList className="w-full">
            <TabsTrigger value="create">{t("tabCreate")}</TabsTrigger>
            <TabsTrigger value="link">{t("tabLink")}</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="pt-3">
            <form onSubmit={handleCreate} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor={`${idPrefix}-name`}>{t("nameLabel")}</Label>
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
                <Label htmlFor={`${idPrefix}-slug`}>{t("slugLabel")}</Label>
                <Input
                  id={`${idPrefix}-slug`}
                  name="slug"
                  required
                  minLength={3}
                  maxLength={48}
                  pattern={SLUG_PATTERN}
                  autoComplete="off"
                  dir="ltr"
                  className="text-start font-mono"
                  value={slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setSlug(event.target.value.toLowerCase());
                  }}
                  aria-describedby={`${idPrefix}-slug-hint`}
                />
                <p id={`${idPrefix}-slug-hint`} className="text-xs text-slate-400">
                  {t("slugHint")}
                </p>
              </div>
              <FormStatus error={error} successMessage="" />
              <DialogFooter>
                <Button type="submit" loading={pending}>
                  {pending ? t("creating") : t("create")}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="link" className="pt-3">
            <form onSubmit={handleLink} className="grid gap-4">
              <OwnedOrganizationPicker
                organizations={linkable}
                value={selectedOrg}
                onChange={setSelectedOrg}
                disabled={pending}
              />
              <p className="text-xs text-slate-400">{t("linkHint")}</p>
              <FormStatus error={error} successMessage="" />
              <DialogFooter>
                <Button type="submit" loading={pending} disabled={!selectedOrg}>
                  {pending ? t("linking") : t("link")}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
