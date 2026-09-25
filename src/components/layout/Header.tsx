import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import { Link } from "@/i18n/navigation";

export default function Header() {
  return (
    <header className="w-full border-b border-border bg-background px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-semibold text-foreground">
        Pasargad
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Giriş
        </Link>
        <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground">
          Kayıt
        </Link>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
