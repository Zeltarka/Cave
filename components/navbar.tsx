"use client";
import Link from "next/link";
import {family} from "detect-libc";
import Image from "next/image";
import { usePathname } from "next/navigation";


import { Montserrat } from "next/font/google"; // 🔹 IMPORT

// Création de la police
const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["400", "600"],
});

import logo from "boutique.png"
export function Navbar() {
    const pathname = usePathname();
    const showNavbar = pathname !== "/";
    if (!showNavbar) return null;
    return (
        <div
            className={montserrat.className}
            style={{
                backgroundColor: "#8ba9b7",
                color: "#24586f",
                padding: "30px",
                paddingTop: "0px",
                paddingBottom: "0px",
                paddingLeft: "10px",
                fontSize: 22,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "left",
                textAnchor: "middle",
            }}>
            <Link href="/">← Accueil</Link>

            <Image
                src="/Boutique.png"
                alt="Logo"
                width={250}
                height={250}
                style={{marginLeft:'auto', marginRight: "300px"}}
            />


            <div style={{
                display: "flex",
                width: "10px",
                justifyContent: "right",
                height: "10px",
                position: "relative",
                top: '20px',
            }}
            >

                <Link href="/account">
                    <button style={{
                        position: "fixed",


                        zIndex:10,
                        backgroundImage: "url('/profil.png')",
                        height: "45px",
                        width: "45px",
                        borderRadius: "100px",
                        backgroundColor: '#8ba9b7',
                        cursor: "pointer",
                        fontSize: "20px",
                        backgroundSize: "cover",
                        color: "black",
                        top: '20px',
                        right: '20px',


                    }}>


                    </button>
                </Link>
                <Link href="/market">
                    <button style={{
                        position: "fixed",


                        zIndex:10,
                        backgroundImage: "url('/market-icon.png')",
                        height: "45px",
                        width: "45px",
                        borderRadius: "100px",
                        backgroundColor: '#8ba9b7',
                        cursor: "pointer",
                        fontSize: "20px",
                        backgroundSize: '35px',
                        backgroundPositionX: '5px',
                        color: "black",
                        top: '20px',
                        right: '75px',


                    }}>

                    </button>
                </Link>
            </div>

        </div>
    );
}
