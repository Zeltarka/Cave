"use client";
import Link from "next/link";
import React from "react";

export default function Boutique() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                textAlign: "center",
                color: "#24586f",
                fontSize: "40px",
                paddingTop: "",
            }}
        >
            <h1 style={{ marginTop: "0px", fontSize: "40px", marginBottom: "5px" }}>
                Nos Produits
            </h1>

            <p style={{ fontSize: "18px", color: "black", marginBottom: "10px" }}>
                Tout se passe au 3 rue Voltaire à La Garenne ! Nous avons cependant 2 produits de notre propre marque que nous vendons en ligne.
            </p>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    gap: "300px",
                    position: "relative",
                    marginTop: "0px",
                }}
            >
                <Link href="/boutique/champagne">
                    <button
                        style={{
                            position: "relative",
                            backgroundImage: 'url("/champagne.jpg")',
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            border: "1px solid #24586f",
                            width: "40vh",
                            height: "55vh",
                            borderRadius: "20px",
                            cursor: "pointer",
                            transition: "transform 0.4s ease, box-shadow 0.4s ease",
                            overflow: "hidden",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "0 10px 20px rgba(36, 88, 111, 0.3)";
                            const text = e.currentTarget.querySelector<HTMLElement>(".overlay-text");
                            if (text) text.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "none";
                            const text = e.currentTarget.querySelector<HTMLElement>(".overlay-text");
                            if (text) text.style.opacity = "0";
                        }}
                    >
                        <span
                            className="overlay-text"
                            style={{
                                position: "absolute",
                                top: "0",
                                left: "0",
                                right: "0",
                                bottom: "0",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "flex-end",
                                paddingBottom: "15px",
                                borderBottomLeftRadius: "19px",
                                borderBottomRightRadius: "19px",
                                opacity: "0",
                                transition: "opacity 0.8s ease",
                                fontWeight: "bold",
                                fontSize: "20px",
                                color: "black",
                                textAlign: "center",
                                backgroundColor: "rgba(255,255,255,0.9)",
                            }}
                        >
                            Champagne <br /> 29.90€
                        </span>
                    </button>
                </Link>

                <Link href="/boutique/rose">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        style={{
                            position: "relative",
                            backgroundImage: 'url("/rose.jpg")',
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            border: "1px solid #24586f",
                            width: "40vh",
                            height: "55vh",
                            borderRadius: "20px",
                            cursor: "not-allowed",
                            transition: "transform 0.4s ease, box-shadow 0.4s ease",
                            overflow: "hidden",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "0 10px 20px rgba(36, 88, 111, 0.3)";
                            const text = e.currentTarget.querySelector<HTMLElement>(".overlay-text");
                            if (text) text.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "none";
                            const text = e.currentTarget.querySelector<HTMLElement>(".overlay-text");
                            if (text) text.style.opacity = "0";
                        }}
                    >
                        <span
                            className="overlay-text"
                            style={{
                                position: "absolute",
                                top: "0",
                                left: "0",
                                right: "0",
                                bottom: "0",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "flex-end",
                                paddingBottom: "15px",
                                borderBottomLeftRadius: "19px",
                                borderBottomRightRadius: "19px",
                                opacity: "0",
                                transition: "opacity 0.8s ease",
                                fontWeight: "bold",
                                fontSize: "20px",
                                color: "black",
                                textAlign: "center",
                                backgroundColor: "rgba(143,141,141,0.9)",
                            }}
                        >
                            Disponible en avril 2026 <br /> Rosé <br /> 9.90€
                        </span>
                    </button>
                </Link>
            </div>
        </div>
    );
}
