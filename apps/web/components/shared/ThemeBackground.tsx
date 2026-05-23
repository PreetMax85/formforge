export default function ThemeBackground({ theme }: { theme: string }) {
  return <div className="fixed inset-0 pointer-events-none opacity-10" data-theme={theme} />;
}
