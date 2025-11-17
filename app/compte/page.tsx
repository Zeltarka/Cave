"use client";
import { useState } from "react";

export default function CreerCompte() {
    const [prenom, setPrenom] = useState("");
    const [nom, setNom] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [disabled, setDisabled] = useState(false);

    const handleSubmit = async () => {
        if (disabled) return;
        setDisabled(true);
        setMessage("");

        // Validation simple
        if (!prenom || !nom || !email || !password || !confirmPassword) {
            setMessage("Veuillez remplir tous les champs.");
            setDisabled(false);
            return;
        }
        if (password !== confirmPassword) {
            setMessage("Les mots de passe ne correspondent pas.");
            setDisabled(false);
            return;
        }

        try {
            const response = await fetch("/api/inscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prenom, nom, email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setMessage(data.message || "Erreur serveur !");
            } else {
                setMessage("Compte créé avec succès !");
                setPrenom("");
                setNom("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
            }
        } catch (err) {
            console.error(err);
            setMessage("Erreur serveur !");
        } finally {
            setTimeout(() => setDisabled(false), 2000);
        }
    };

    return (
        <div style={{ padding: "5vh 10vw", fontFamily: "Arial, sans-serif", color: "#24586f" }}>
            <h1 style={{ fontSize: "4vh", marginBottom: "3vh" }}>Créer un compte</h1>

            <div style={{ display: "flex", flexDirection: "column", gap: "2vh", maxWidth: "400px" }}>
                <input
                    type="text"
                    placeholder="Prénom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <input
                    type="text"
                    placeholder="Nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
                />

                <button
                    onClick={handleSubmit}
                    disabled={disabled}
                    style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#8ba9b7",
                        color: "#fff",
                        cursor: disabled ? "not-allowed" : "pointer",
                        marginTop: "1vh",
                    }}
                >
                    Créer mon compte
                </button>

                {message && (
                    <p style={{ marginTop: "2vh", color: "#24586f", fontWeight: "bold" }}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
