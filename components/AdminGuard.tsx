// app/components/AdminGuard.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type AdminGuardProps = {
    children: React.ReactNode;
};

export default function AdminGuard({ children }: AdminGuardProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            console.log("🔍 Vérification authentification...");
            const res = await fetch("/api/admin/auth/verify");
            console.log("📊 Response verify:", res.status);

            if (res.ok) {
                const data = await res.json();
                console.log("✅ Auth data:", data);
                setIsAuthenticated(true);
            } else {
                console.log("❌ Non authentifié");
                setIsAuthenticated(false);
            }
        } catch (err) {
            console.error("❌ Erreur vérification auth:", err);
            setIsAuthenticated(false);
        } finally {
            setIsChecking(false);
        }
    };

    // Dans la fonction handleLogin de AdminGuard.tsx
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.status === 429) {
                // Trop de tentatives
                setError(data.error || "Trop de tentatives. Veuillez patienter.");
                setLoading(false);
                return;
            }

            if (!res.ok) {
                const errorMsg = data.remainingAttempts !== undefined
                    ? `${data.error} (${data.remainingAttempts} tentative${data.remainingAttempts > 1 ? 's' : ''} restante${data.remainingAttempts > 1 ? 's' : ''})`
                    : data.error || "Erreur de connexion";

                setError(errorMsg);
                setLoading(false);
                return;
            }

            // Connexion réussie
            setIsAuthenticated(true);
        } catch (err) {
            console.error("❌ Échec login:", err);
            setError("Erreur de connexion au serveur");
        } finally {
            setLoading(false);
        }
    };
    const handleLogout = async () => {
        try {
            await fetch("/api/admin/auth/logout", { method: "POST" });
            setIsAuthenticated(false);
            setEmail("");
            setPassword("");
        } catch (err) {
            console.error("❌ Erreur logout:", err);
        }
    };

    // Afficher le loader pendant la vérification initiale
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-[#24586f] text-xl mb-2">Vérification...</div>
                    <div className="text-sm text-gray-500">Chargement de la session</div>
                </div>
            </div>
        );
    }

    // Afficher le formulaire de login si pas authentifié
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f1f5ff] to-[#e8f0f7] p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#24586f] mb-2">
                            Administration
                        </h1>
                        <p className="text-gray-600">La Cave La Garenne</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#24586f] focus:border-transparent"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#24586f] text-white py-3 rounded-lg font-medium hover:bg-[#1a4557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Connexion..." : "Se connecter"}
                        </button>
                    </form>

                    <button
                        onClick={() => router.push("/")}
                        className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm"
                    >
                        ← Retour au site
                    </button>
                </div>
            </div>
        );
    }

    // Afficher le contenu protégé si authentifié
    return (
        <>
            <button
                onClick={handleLogout}
                className="fixed bottom-6 right-6 bg-red-400 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-50 text-sm font-medium"
            >
                Déconnexion
            </button>
            {children}
        </>
    );
}