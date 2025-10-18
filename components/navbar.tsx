"use client";
import Link from "next/link";
import {family} from "detect-libc";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, {useState} from "react";


import { Montserrat } from "next/font/google"; // 🔹 IMPORT

// Création de la police
const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["400", "600"],
});


import logo from "boutique.png"

export function Navbar() {
    const [underline, setUnderline] = useState(false);
    const pathname = usePathname();
    const showNavbar = pathname !== "/";
    if (!showNavbar) return null;
    return (
        <div
            className={montserrat.className}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateZ(50px) ";
                e.currentTarget.style.boxShadow = "0 20px 20px rgba(36, 88, 111, 0.3)"  }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) translateZ(0)";
                e.currentTarget.style.boxShadow = "none";}}
            style={{

                transition: "box-shadow 0.3s ease",
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
                justifyContent: "center",
                textAnchor: "middle",
                zIndex:'0'
            }}>


            <div style={{display: "flex", position:'absolute', alignItems:"center", left:'50px'}}>
                <Link href="/"
                      style={{ textDecoration: underline ? "underline" : "none",cursor: "pointer",  }}
                      onMouseEnter={() => setUnderline(true)}
                      onMouseLeave={() => setUnderline(false)}>
                    ← Accueil
                </Link>
            </div>

            <div style={{ display: "flex",  height: "10%",  }}>
                  <Image
                    src="/Boutique.png"
                    alt="Logo"
                    width={250}
                    height={250}

                />
            </div>




            <div style={{
                display: "flex",
                width: "10px",
                justifyContent: "right",
                height: "10px",
                position: "relative",
                top: '20px',
            }}
            >

            <div
                style={{
                    display: "flex",
                    flexDirection: "row",

                    left: '750px',

                }}>
                <Link href="https://www.instagram.com/la_cave_la_garenne/">
                      <button
                      style={{
                          backgroundImage: "url('/insta.png')",
                          width: "20px",
                          height: "20px",
                          position: "fixed",
                          zIndex:'10',
                          backgroundColor:'transparent',
                          top:'40px',
                          backgroundSize:'cover',
                          left:'1425px',
                          cursor:'pointer',

                      }}/>
                </Link>
                <Link href="https://fr.linkedin.com/company/lacavelagarenne">
                    <button
                        style={{
                            backgroundImage: "url('/linkedin.png')",
                            width: "25px",
                            height: "25px",
                            position: "fixed",
                            zIndex:'10',
                            backgroundColor:'transparent',
                            top:'70px',
                            backgroundSize:'cover',
                            left:'1423px',
                            cursor:'pointer',

                        }}/>
                </Link>
            </div>

                <Link href="/account">
                    <button style={{
                        position: "fixed",


                        zIndex:20,
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
