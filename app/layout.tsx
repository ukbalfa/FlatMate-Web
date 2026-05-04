import { Sora, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["500"],
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "FlatMate",
  description: "FlatMate Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${dmSans.variable} ${dmMono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}