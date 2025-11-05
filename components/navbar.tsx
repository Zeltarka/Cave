"use client";
import Link from "next/link";
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
    const [underline1, setUnderline1] = useState(false);
    const [underline2, setUnderline2] = useState(false);
    const [underline3, setUnderline3] = useState(false);
    const [underline4, setUnderline4] = useState(false);
    const pathname = usePathname();

    return (

        <div

            style={{


                position:'relative',
                backgroundColor: "rgba(250,245,241,0.4)",
                color: "#24586f",
                padding: "30px",
                paddingTop: "0px",
                paddingBottom: "0px",
                paddingLeft: "10px",
                fontSize: 19,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",


                zIndex:'0'

            }}>
            <div style={{flex:1, display: "flex", height: "10%", justifyContent: "center", alignItems: "center" }}>
                <Link href='/'>
                    <Image
                        src="/Boutique.png"
                        alt="Logo"
                        width={250}
                        height={250}

                    />
                </Link>
            </div>



            <div style={{position:'absolute',display: "flex", gap: "50px", alignItems: "center", justifyContent: "left",left:'8vh'}}>
                <div style={{display: "flex", }}>
                    <Link href="/notre-histoire"
                          style={{ textDecoration: underline ? "underline" : "none",cursor: "pointer",  }}
                          onMouseEnter={() => setUnderline(true)}
                          onMouseLeave={() => setUnderline(false)}>
                        Histoire
                    </Link>
                </div>

                <div >

                    <Link href="/la-cave"
                          style={{ textDecoration: underline1 ? "underline" : "none", cursor: "pointer" }}
                          onMouseEnter={() => setUnderline1(true)}
                          onMouseLeave={() => setUnderline1(false)}>
                        La Cave - Boutique
                    </Link>
                </div>
                <div >

                    <Link href="/rencontres-vignerons"
                          style={{ textDecoration: underline2 ? "underline" : "none", cursor: "pointer" }}
                          onMouseEnter={() => setUnderline2(true)}
                          onMouseLeave={() => setUnderline2(false)}>
                        Rencontres Vignerons
                    </Link>
                </div>



            </div>

            <div style={{position:'absolute',display: "flex", gap: "60px", alignItems: "center", justifyContent: "right",right:'30vh'}}>
                <Link href="/photos"
                style={{ textDecoration: underline3 ? "underline" : "none", cursor : 'pointer'}}
                onMouseEnter={() => setUnderline3(true)} onMouseLeave={() => setUnderline3(false)}>
                Galerie Photo</Link>
                <Link href="/contact"
                      style={{textDecoration: underline4 ? "underline" : "none", cursor: 'pointer'}} onMouseEnter={()=>setUnderline4(true)} onMouseLeave={() => setUnderline4(false)}>
                    Contact</Link>
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



                <Link href="/account">
                    <button style={{
                        position: "fixed",


                        zIndex:20,
                        backgroundImage: "url('/profil.png')",
                        height: "45px",
                        width: "45px",
                        borderRadius: "100px",

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


                        cursor: "pointer",
                        fontSize: "20px",
                        backgroundSize: '60px',
                        backgroundPositionX: '0px',
                        color: "black",
                        top: '20px',
                        right: '75px',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',


                    }}>


                    </button>
                </Link>
            </div>
        </div>


    );
}
