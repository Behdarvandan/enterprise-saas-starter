import { ArchitecturePipeline } from "./_components/ArchitecturePipeline";
import { BentoFeatureGrid } from "./_components/BentoFeatureGrid";
import { ConversionBanner } from "./_components/ConversionBanner";
import { HeroSection } from "./_components/HeroSection";
import { PlatformPreview } from "./_components/PlatformPreview";
import { SecurityTelemetryStrip } from "./_components/SecurityTelemetryStrip";

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <PlatformPreview />
      <BentoFeatureGrid />
      <ArchitecturePipeline />
      <SecurityTelemetryStrip />
      <ConversionBanner />
    </div>
  );
}
