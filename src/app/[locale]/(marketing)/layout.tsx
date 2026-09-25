import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="marketing-surface flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      {/* Header is `fixed` (floating capsule), so it reserves no flow space —
          this padding keeps page content clear of it. */}
      <main className="flex-1 pt-28">{children}</main>
      <Footer />
    </div>
  );
}
