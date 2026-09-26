import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import Nav from "@/components/Nav";
import { TwinProvider } from "@/components/TwinProvider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LearnTwin: an AI that learns how you learn",
  description:
    "LearnTwin builds a Learning Twin of each student: it analyses mistakes, finds hidden misconceptions and adapts every activity. Built for SDG 4: Quality Education.",
};

export const viewport: Viewport = { themeColor: "#06070b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col pb-16 md:pb-0">
        <AuthProvider>
          <TwinProvider>
            <Nav />
            <main className="flex-1">{children}</main>
          </TwinProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
