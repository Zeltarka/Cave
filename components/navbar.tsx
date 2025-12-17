"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Navbar() {
    const [underline, setUnderline] = useState(false);
    const [underline1, setUnderline1] = useState(false);
    const [underline2, setUnderline2] = useState(false);
    const [underline4, setUnderline4] = useState(false);

    return (
        <nav
            style={{
                position: "relative",
                backgroundColor: "rgba(250,245,241,0.4)",
                color: "#24586f",
                padding: "30px 10px",
                fontSize: 19,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 0,
            }}
        >
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <Link href="/">
                    <Image
                        src="/boutique.png"
                        alt="Logo"
                        width={250}
                        height={250}
                        style={{ maxWidth: "100%", height: "auto" }}
                    />
                </Link>
            </div>

            <div
                className="menu-links"
                style={{
                    position: "absolute",
                    display: "flex",
                    gap: "50px",
                    alignItems: "center",
                    left: "6vh",
                    top: "50%",
                    transform: "translateY(-50%)",
                }}
            >
                <Link
                    href="/histoire"
                    style={{ textDecoration: underline ? "underline" : "none", cursor: "pointer" }}
                    onMouseEnter={() => setUnderline(true)}
                    onMouseLeave={() => setUnderline(false)}
                >
                    Histoire
                </Link>
                <Link
                    href="/la-cave"
                    style={{ textDecoration: underline1 ? "underline" : "none", cursor: "pointer" }}
                    onMouseEnter={() => setUnderline1(true)}
                    onMouseLeave={() => setUnderline1(false)}
                >
                    La Cave
                </Link>
                <Link
                    href="/rencontres-vignerons"
                    style={{ textDecoration: underline2 ? "underline" : "none", cursor: "pointer" }}
                    onMouseEnter={() => setUnderline2(true)}
                    onMouseLeave={() => setUnderline2(false)}
                >
                    Rencontres Vignerons
                </Link>
            </div>

            <div
                className="contact-link"
                style={{
                    position: "absolute",
                    display: "flex",
                    gap: "60px",
                    alignItems: "center",
                    right: "30vh",
                    top: "50%",
                    transform: "translateY(-50%)",
                }}
            >
                <Link
                    href="/contact"
                    style={{ textDecoration: underline4 ? "underline" : "none", cursor: "pointer" }}
                    onMouseEnter={() => setUnderline4(true)}
                    onMouseLeave={() => setUnderline4(false)}
                >
                    Contact
                </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
                <Link href="/panier">
                    <button
                        style={{
                            position: "relative",
                            zIndex: 10,
                            backgroundImage: "url('/market-icon.png')",
                            height: "7vh",
                            width: "7vh",
                            cursor: "pointer",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            border: "none",
                            marginRight: "20px",
                        }}
                    />
                </Link>

            </div>

            <style jsx>{`
                @media (max-width: 1024px) {
                    .menu-links,
                    .contact-link {
                        position: static !important;
                        transform: none !important;
                        justify-content: center;
                        margin-top: 10px;
                    }
                }
                @media (max-width: 768px) {
                    nav {
                        font-size: 16px;
                    }
                    .menu-links,
                    .contact-link {
                        flex-direction: column;
                        gap: 15px !important;
                    }
                }
            `}</style>
        </nav>
    );
}
