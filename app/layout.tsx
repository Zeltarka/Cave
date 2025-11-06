import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Montserrat } from "next/font/google"; // 🔹 IMPORT
import "./globals.css";
import { Navbar } from "@/components/navbar";

// Geist Sans
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

// Geist Mono
const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// Montserrat (la police principale)
const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin"],
    weight: ["400", "600"],
});

export const metadata: Metadata = {
    title: "La Cave - La Garenne",
    description: "",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
        <body
            className={`${montserrat.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <Navbar />
        {children}
        </body>
        </html>
    );
}
