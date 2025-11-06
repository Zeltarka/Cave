"use client";
import Image from "next/image";
import React, { useState } from "react";

export default function Page() {
    const [montant, setMontant] = useState("");
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");

    const achetercartecadeau = async () => {
        try {
            const response = await fetch("/api/achetercartecadeau", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, montant }),
            });

            if (!response.ok) throw new Error("Erreur lors de l’envoi");

            const data = await response.json();
            setMessage(data.message);
        } catch (error) {
            console.error(error);
            setMessage("Erreur serveur !");
        }
    };

    return (
        <div>
            <h1
                style={{
                    textAlign: "center",
                    fontSize: "4vh",
                    color: "#24586f",
                    justifyContent: "center",
                    paddingTop: "5vh",
                }}
            >
                Offrez une carte cadeau La Cave
            </h1>

            <div style={{ display: "flex", flexDirection: "row", gap: "10vh" }}>
                <Image
                    src={"/cartecadeau.png"}
                    alt={"carte cadeau"}

                    width={500}
                    height={500}
                    style={{ marginTop: "10vh", marginLeft: "20vh" }}
                />

                <div
                    style={{
                        display: "flex",
                        textAlign: "center",
                        alignItems: "left",
                        justifyContent: "space-between",
                        paddingTop: "5vh",
                        position: "absolute",
                        left: "100vh",
                        top: "40vh",
                        flexDirection: "column",
                    }}
                >

                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Votre adresse mail"
                        style={{
                            fontSize: "18px",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: "1px solid #ccc",
                            width: "200px",
                            textAlign: "center",
                            marginBottom: "2vh",
                        }}
                    />

                    <p style={{ marginBottom: "2vh" }}>
                        Montant de votre carte cadeau :
                    </p>
                    <div style={{ display: "flex", flexDirection: "row" }}>
                        <input
                            type="number"
                            min="0"
                            value={montant}
                            onChange={(e) => setMontant(e.target.value)}
                            style={{
                                fontSize: "18px",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid #ccc",
                                width: "120px",
                                textAlign: "right",
                            }}
                            placeholder="0.00"
                        />
                        <span
                            style={{
                                marginLeft: "8px",
                                fontSize: "18px",
                                marginTop: "10px",
                            }}
                        >
              €
            </span>
                    </div>

                    <button
                        onClick={achetercartecadeau}
                        style={{
                            backgroundSize: "cover",
                            marginTop: "3vh",
                            width: "30vh",
                            height: "5vh",
                            backgroundColor: "#8ba9b7",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 10px",
                            cursor: "pointer",
                        }}
                    >
                        Acheter la carte cadeau
                    </button>

                    {message && (
                        <p style={{ marginTop: "2vh", color: "#24586f" }}>{message}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
