import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

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
        <html lang="fr" className="h-full">
        <body className={`${montserrat.variable} antialiased flex flex-col min-h-full m-0`}>
        <Navbar />
        <main className="flex-1 w-full relative">
            {children}
        </main>
        </body>
        </html>
    );
}