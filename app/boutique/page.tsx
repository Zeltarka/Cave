"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Boutique() {
    return (

        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#24586f",
                fontSize: "40px",

            }}
        >
            <h1
                style={{
                    marginTop: "40px",
                    fontSize: "40px",
                    marginBottom: "30px",
                }}
            >
                Nos Produits
            </h1>


            <div
                style={{
                    width: "100%",
                    height: "300px",
                    position: "relative",
                    top: "0px",
                    zIndex: "-1",
                    opacity: "0.75",
                }}
            >
                {/*        <Image
                    src="/bouteille.jpg"
                    height={3000}
                    width={3000}

                    style={{
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                    }}
                />     */}
            </div>


            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "300px",

                    position: "absolute",
                    top:'32vh'
                }}
            >

                <Link href="/champagne">
                    <button
                        style={{
                            position: "relative",
                            backgroundImage: 'url("/champagne.jpg")',
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            border: "1px solid #24586f",
                            width: "40vh",
                            height: "60vh",
                            borderRadius: "20px",
                            cursor: "pointer",
                            transition: "transform 0.4s ease, box-shadow 0.4s ease",
                            overflow: "hidden",
                        }}
                        onMouseEnter={(e) => {
                        //    e.currentTarget.style.transform = "translateZ(-30px) translateY(-30px) ";
                            e.currentTarget.style.boxShadow =
                                "0 10px 20px rgba(36, 88, 111, 0.3)";
                            const text = e.currentTarget.querySelector(".overlay-text");
                            if (text) text.style.opacity = "0.9";

                        }}
                        onMouseLeave={(e) => {
                        //    e.currentTarget.style.transform = "translateY(0) translateZ(0)";
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
                                    backgroundColor: "#fff",
                                    backgroundSize: "230px 360px",
                                    animation: "gradientShift 5s ease-in-out infinite",
                                    display:'flex',
                                    justifyContent: 'center',
                                    alignItems: 'flex-end ',
                                    paddingBottom:'15px',
                                    textAlign: "center",

                                    borderBottomLeftRadius: "19px",
                                    borderBottomRightRadius: "19px",
                                    opacity: "0",

                                    transition: "opacity 0.8s ease",
                                    fontWeight: "bold",
                                    fontSize: "20px",
                                    color:"black",





                                }}
                            >Champagne <br/> x€
                            </span>
                    </button>
                </Link>


                <Link href="/rose">
                    <button
                        style={{
                            position: "relative",
                            backgroundImage: 'url("/rose.jpg")',
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            border: "1px solid #24586f",
                            width: "40vh",
                            height: "60vh",
                            borderRadius: "20px",
                            cursor: "pointer",
                            transition: "transform 0.4s ease, box-shadow 0.4s ease",
                            overflow: "hidden",
                        }}
                        onMouseEnter={(e) => {
                       //     e.currentTarget.style.transform = "translateZ(-30px) translateY(-30px) ";
                            e.currentTarget.style.boxShadow =
                                "0 10px 20px rgba(36, 88, 111, 0.3)";
                            const text = e.currentTarget.querySelector(".overlay-text");
                            if (text) text.style.opacity = "0.9";

                        }}
                        onMouseLeave={(e) => {
                         //   e.currentTarget.style.transform = "translateY(0) translateZ(0)";
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
                                    backgroundColor: "#fff",
                                    backgroundSize: "230px 360px",
                                    animation: "gradientShift 5s ease-in-out infinite",
                                    display:'flex',
                                    justifyContent: 'center',
                                    alignItems: 'flex-end ',
                                    paddingBottom:'15px',
                                    textAlign: "center",

                                    borderBottomLeftRadius: "19px",
                                    borderBottomRightRadius: "19px",
                                    opacity: "0",

                                    transition: "opacity 0.8s ease",
                                    fontWeight: "bold",
                                    fontSize: "20px",
                                    color:"black",





                                }}
                            >Rosé <br/> x€
                            </span>
                    </button>
                </Link>
            </div>
        </div>
    );
}
