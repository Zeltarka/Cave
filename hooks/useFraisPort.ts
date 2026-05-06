import { useState, useEffect } from "react";

export type FraisPortTranche = {
    id: string;
    quantite_min: number;
    frais: number;
};

type UseFraisPortResult = {
    tranchesBouteilles: FraisPortTranche[];
    maxBouteilles:      number;
    paliersBouteilles:  number[];
    tranchesBagInBox:   FraisPortTranche[];
    maxBagInBox:        number;
    paliersBagInBox:    number[];
    loading:            boolean;
};

export function useFraisPort(): UseFraisPortResult {
    const [tranchesBouteilles, setTranchesB]  = useState<FraisPortTranche[]>([]);
    const [tranchesBagInBox,   setTranchesB2] = useState<FraisPortTranche[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/frais-port")
            .then(r => r.json())
            .then(data => {
                setTranchesB(Array.isArray(data?.bouteilles) ? data.bouteilles : []);
                setTranchesB2(Array.isArray(data?.bagInBox)  ? data.bagInBox  : []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const maxBouteilles = tranchesBouteilles.length > 0
        ? Math.max(...tranchesBouteilles.map(t => t.quantite_min))
        : 24;

    const maxBagInBox = tranchesBagInBox.length > 0
        ? Math.max(...tranchesBagInBox.map(t => t.quantite_min))
        : 12;

    const paliersBouteilles: number[] = [];
    for (let i = 6; i <= maxBouteilles; i += 6) paliersBouteilles.push(i);

    const paliersBagInBox: number[] = [];
    for (let i = 3; i <= maxBagInBox; i += 3) paliersBagInBox.push(i);

    return {
        tranchesBouteilles, maxBouteilles, paliersBouteilles,
        tranchesBagInBox,   maxBagInBox,   paliersBagInBox,
        loading,
    };
}