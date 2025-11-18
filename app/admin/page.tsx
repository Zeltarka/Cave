"use client";

import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { SessionProvider } from "next-auth/react";

function AdminContent() {
    const { data: session, status } = useSession();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await signIn("credentials", {
            username,
            password,
            redirect: false,
        });
    };

    if (status === "loading") return <p className="p-6">Chargement...</p>;

    if (!session)
        return (
            <form
                onSubmit={handleLogin}
                className="p-6 max-w-sm mx-auto flex flex-col gap-4"
            >
                <h1 className="text-2xl font-bold">Connexion Admin</h1>

                <input
                    type="text"
                    className="border p-2 rounded"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    type="password"
                    className="border p-2 rounded"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit" className="p-2 bg-black text-white rounded">
                    Se connecter
                </button>
            </form>
        );

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
            <p className="text-base">
                Bienvenue sur la zone d'administration sécurisée, {session.user?.name}.
            </p>
        </div>
    );
}

// On englobe juste cette page avec son propre SessionProvider
export default function Page() {
    return (
        <SessionProvider>
            <AdminContent />
        </SessionProvider>
    );
}
