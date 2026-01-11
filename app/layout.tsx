import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin"],
    weight: ["400", "600"],
});

export const metadata: Metadata = {
    title: "La Cave - La Garenne",
    description: "Caviste indépendant à La Garenne-Colombes - Vins, Champagnes et Spiritueux",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="fr">
        <body className={`${montserrat.variable} antialiased flex flex-col min-h-screen m-0`}>
        <Navbar />
        <main className="flex-1 flex flex-col w-full relative">
            {children}
        </main>
        </body>
        </html>
    );
}