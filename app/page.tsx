"use client";

import Image from "next/image";
import Link from "next/link";
import React, {useState} from "react";

export default function Home() {
    const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ width: "100%", height: "250px", position: "relative", opacity: 0.9 }}>
                <Image src="/devanture.jpg" alt="" fill style={{ objectFit: "cover" }} />
            </div>

            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "300px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "50px",
                }}
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseLeave={() => setMousePos({ x: -200, y: -200 })}
            >
                <div
                    style={{
                        
                        position: "absolute",
                        width: 100, // largeur du trait
                        height: "100%", // hauteur du trait
                        background: "linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0))",
                        top: 0,
                        left: "50%", // départ au milieu de la page
                        transform: `translateX(-50%) translateY(0px) rotate(${Math.atan2(
                            mousePos.y - 150,
                            mousePos.x - window.innerWidth / 2
                        )}rad)`,
                        transformOrigin: "top center",
                        pointerEvents: "none",
                    }}
                />

            <div style={{ position: "relative", top: 20, display: "flex", justifyContent: "flex-end", gap: 15 }}>
                <Link href="/account">
                    <button
                        style={{
                            position: "fixed",
                            zIndex: 10,
                            backgroundImage: "url('/profil.png')",
                            height: 45,
                            width: 45,
                            borderRadius: 100,
                            backgroundColor: '#8ba9b7',
                            cursor: "pointer",
                            backgroundSize: "cover",
                            top: 20,
                            right: 20,
                            border: "none"
                        }}
                    />
                </Link>

                <Link href="/market">
                    <button
                        style={{
                            position: "fixed",
                            zIndex: 10,
                            backgroundImage: "url('/market-icon.png')",
                            height: 45,
                            width: 45,
                            borderRadius: 100,
                            backgroundColor: '#8ba9b7',
                            cursor: "pointer",
                            backgroundSize: '35px',
                            backgroundPositionX: 5,
                            top: 20,
                            right: 75,
                            border: "none"
                        }}
                    />
                </Link>
            </div>

            <div style={{ width: "100%", height: 450, position: "absolute", top: 300 }}>
                <Image
                    src="/bouteille.jpg"
                    height={3000}
                    width={3000}
                    style={{ justifyContent: 'center', alignItems: 'center', position: "static", opacity: 0.75 }}
                />

                <div style={{ position: "relative", top: -200, display: "flex", justifyContent: "center", gap: 300, zIndex: 10 }}>
                    <Link href="/boutique">
                        <button
                            style={{
                                width: 200,
                                height: 120,
                                borderRadius: 25,
                                border: "1px solid #8ba9b7",
                                cursor: "pointer",
                                fontSize: 20,
                                color: "#24586f",
                                backgroundColor: 'white',
                                transition: "transform 0.4s ease, box-shadow 0.4s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateZ(-20px) translateY(-20px)";
                                e.currentTarget.style.boxShadow = "0 10px 20px rgba(36, 88, 111, 0.3)";
                                const text = e.currentTarget.querySelector(".overlay-text");
                                if (text) text.style.opacity = "0.8";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0) translateZ(0)";
                                e.currentTarget.style.boxShadow = "none";
                                const text = e.currentTarget.querySelector(".overlay-text");
                                if (text) text.style.opacity = "0";
                            }}
                        >
                            <span
                                className="overlay-text"
                                style={{
                                    position: "absolute",
                                    top:'0',
                                    bottom: "0",
                                    left: "0",
                                    right: "0",
                                    background: "linear-gradient(180deg, rgba(36, 88, 111, 0.2),  rgba(168, 208, 240, 0.5), rgba(36, 88, 111, 0.2))",
                                    backgroundSize: "230px 360px",
                                    animation: "gradientShift 5s ease-in-out infinite",
                                    display:'flex',
                                    justifyContent: 'center',
                                    alignItems: 'flex-end ',
                                    paddingBottom:'15px',
                                    textAlign: "center",
                                    borderTopRightRadius: '19px',
                                    borderTopLeftRadius: '19px',
                                    borderBottomLeftRadius: "19px",
                                    borderBottomRightRadius: "19px",
                                    opacity: "0",

                                    transition: "opacity 0.8s ease",}}
                            ></span>
                            Boutique
                        </button>
                    </Link>

                    <Link href="/degustations">
                        <button
                            style={{
                                width: 200,
                                height: 120,
                                borderRadius: 25,
                                border: "1px solid #8ba9b7",
                                cursor: "pointer",
                                fontSize: 20,
                                color: "#24586f",
                                backgroundColor: 'white',
                                transition: "transform 0.4s ease, box-shadow 0.4s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateZ(-20px) translateY(-20px)";
                                e.currentTarget.style.boxShadow = "0 10px 20px rgba(36, 88, 111, 0.3)";
                                const text = e.currentTarget.querySelector(".overlay-text");
                                if (text) text.style.opacity = "0.8";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0) translateZ(0)";
                                e.currentTarget.style.boxShadow = "none";
                                const text = e.currentTarget.querySelector(".overlay-text");
                                if (text) text.style.opacity = "0";
                            }}
                        >
                            <span
                                className="overlay-text"
                                style={{
                                    position: "absolute",
                                    top:'0',
                                    bottom: "0",
                                    left: "0",
                                    right: "0",
                                    background: "linear-gradient(180deg, rgba(36, 88, 111, 0.2),  rgba(168, 208, 240, 0.5), rgba(36, 88, 111, 0.2))",
                                    backgroundSize: "230px 360px",
                                    animation: "gradientShift 5s ease-in-out infinite",
                                    display:'flex',
                                    justifyContent: 'center',
                                    alignItems: 'flex-end ',
                                    paddingBottom:'15px',
                                    textAlign: "center",
                                    borderTopRightRadius: '19px',
                                    borderTopLeftRadius: '19px',
                                    borderBottomLeftRadius: "19px",
                                    borderBottomRightRadius: "19px",
                                    opacity: "0",

                                    transition: "opacity 0.8s ease",}}
                                ></span>
                            Date des dégustations
                        </button>
                    </Link>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-start", gap: 100, position: "absolute  ", top: 350, zIndex: 10, left:'50px', backgroundColor:'white' }}>
                    <Link href="/app/notre-histoire/page.tsx">
                        <button
                            style={{
                                width: 175,
                                height: 80,
                                border: "1px solid #8ba9b7",
                                borderRadius: 25,
                                display: 'flex',
                                fontSize: 17,
                                color: '#24586f',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            Notre Histoire
                        </button>
                    </Link>

                    <Link href="/photo">
                        <button
                            style={{
                                width: 175,
                                height: 80,
                                border: "1px solid #8ba9b7",
                                borderRadius: 25,
                                display: 'flex',
                                fontSize: 17,
                                color: '#24586f',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            Galerie Photo
                        </button>
                    </Link>
                </div>

            </div>
            </div></div>

    );
            }