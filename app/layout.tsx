import { EvervaultCard } from "@/components/ui/evervault-card";
import Link from "next/link";
import "@coinbase/onchainkit/styles.css";
import '@rainbow-me/rainbowkit/styles.css';
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";


import { Providers } from "./providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileFooter } from "@/components/layout/MobileFooter";

const poppinsRounded = localFont({
  src: "../public/fonts/PoppinsRounded-Rounded.ttf",
  variable: "--font-poppins-rounded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unipump",
  description: "Unipump",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`${poppinsRounded.variable} antialiased`}
      >
        <Providers >
          {/* <div
            className="absolute inset-0 h-full w-full bg-black bg-[radial-gradient(#ccc_0.5px,transparent_0.5px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_60%,transparent_100%)]"
          ></div> */}
          {/* Site-wide static background */}
          <div className="fixed inset-0 -z-10 bg-zinc-950" />
          
          {/* Header */}
          <Header />
          
          {/* Sidebar and Main Content Layout */}
          <div className="flex min-h-screen pt-14">
            <Sidebar />
            <main className={`flex-1 lg:ml-64 p-6 max-w-[1720px] mx-auto`}>
              {children}
            </main>
            <MobileFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
