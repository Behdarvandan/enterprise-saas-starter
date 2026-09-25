import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import { Link } from "@/i18n/navigation";

export default function Header() {
  return (
    <header className="w-full border-b border-slate-100 bg-white px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-semibold text-black">
        Pasargad
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm text-slate-500 hover:text-black">
          Giriş
        </Link>
        <Link href="/signup" className="text-sm text-slate-500 hover:text-black">
          Kayıt
        </Link>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
