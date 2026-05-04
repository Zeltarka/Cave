// hooks/useFraisPort.ts
import { useState, useEffect } from "react";

export type FraisPortTranche = {
    id: string;
    bouteilles_min: number;
    frais: number;
};

type UseFraisPortResult = {
    tranches: FraisPortTranche[];
    maxBouteilles: number;
    paliers: number[];
    loading: boolean;
};

/**
 * Charge les tranches de frais de port et en déduit :
 *   - maxBouteilles  : la valeur bouteilles_min la plus haute
 *   - paliers        : [6, 12, ..., maxBouteilles]
 */
export function useFraisPort(): UseFraisPortResult {
    const [tranches, setTranches]   = useState<FraisPortTranche[]>([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        fetch("/api/frais-port")
            .then(r => r.json())
            .then(data => {
                const arr: FraisPortTranche[] = Array.isArray(data) ? data : data.frais ?? [];
                setTranches(arr);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const maxBouteilles = tranches.length > 0
        ? Math.max(...tranches.map(t => t.bouteilles_min))
        : 24; // valeur par défaut si l'API n'a pas encore répondu

    const paliers: number[] = [];
    for (let i = 6; i <= maxBouteilles; i += 6) paliers.push(i);

    return { tranches, maxBouteilles, paliers, loading };
}