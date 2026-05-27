import BootScreen        from './_components/BootScreen';
import HeroSection       from './_components/HeroSection';
import FeaturesSection   from './_components/FeaturesSection';
import ThemesSection     from './_components/ThemesSection';
import HowItWorksSection from './_components/HowItWorksSection';
import CtaSection        from './_components/CtaSection';

export const metadata = {
  title:       'FormForge — The Game Engine for Forms',
  description: 'Build forms like a game developer. Drag, configure, publish — all in a Unity-style inspector.',
};

export default function LandingPage() {
  return (
    <>
      {/*
        BootScreen is a 'use client' component rendered as a fixed overlay
        (z-index 200, above Navbar's z-50). It reads sessionStorage on mount
        and only shows on the first visit per browser session. The <main>
        below is unaffected — it renders normally underneath the overlay and
        becomes fully interactive the moment the boot animation exits.
      */}
      <BootScreen />

      <main
        style={{
          background: '#0e0e0e',
          color:      '#d4d4d4',
          paddingTop: '56px', // navbar offset
          overflowX:  'hidden',
        }}
      >
        <HeroSection />
        <FeaturesSection />
        <ThemesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
    </>
  );
}