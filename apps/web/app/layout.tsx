import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "FormForge — The Game Engine for Forms",
  description: "Build forms like a game developer. Drag, configure, publish — all in a Unity-style inspector.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: browser extensions (Brave's built-in
    // dark-mode handler, Dark Reader, etc.) inject style="color-scheme:dark"
    // onto <html> before React hydrates. The mismatch is cosmetic and React
    // can't patch it, so we explicitly opt out of warning on this one node.
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
