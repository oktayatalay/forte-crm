import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalProviders } from '@/components/providers/conditional-providers';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forte Panel",
  description: "Forte Tourism Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900 antialiased`}>
        <ConditionalProviders>
          {children}
          <Toaster />
        </ConditionalProviders>
      </body>
    </html>
  );
}
