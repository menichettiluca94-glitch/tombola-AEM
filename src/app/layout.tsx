import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tombola Colorata",
  description:
    "La tombola del futuro: colori nascosti, animazioni arcade e voce sintetica. Scegli un banditore, distribuisci le carte e fate ambo, terna, quaterna, cinquina o TOMBOLA!",
  keywords: [
    "tombola",
    "gioco",
    "arcade",
    "colori",
    "tombola colorata",
    "party game",
  ],
  authors: [{ name: "Tombola Colorata" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning className="dark">
      <body
        className={`${pressStart.variable} ${vt323.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
