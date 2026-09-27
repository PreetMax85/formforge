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