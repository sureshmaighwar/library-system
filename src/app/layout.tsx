import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { ToastProvider } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Library",
    template: "%s · Library",
  },
  description: "Borrow and return books from the library catalogue.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full", inter.variable, jetbrainsMono.variable)}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        <ToastProvider>
          <div className="flex min-h-full flex-1 animate-in flex-col duration-200 fade-in">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
