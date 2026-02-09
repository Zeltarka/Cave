// hooks/useFraisPort.ts
import { useEffect, useState } from "react";

type FraisPort = {
    id: string;
    bouteilles_min: number;
    bouteilles_max: number;
    frais: number;
};

export function useFraisPort() {
    const [fraisPort, setFraisPort] = useState<FraisPort[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/frais-port")
            .then(res => res.json())
            .then(data => {
                setFraisPort(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur chargement frais de port:", err);
                setLoading(false);
            });
    }, []);

    const calculerFrais = (nombreBouteilles: number): number => {
        if (nombreBouteilles === 0) return 0;

        const tranche = fraisPort.find(
            f => nombreBouteilles >= f.bouteilles_min && nombreBouteilles <= f.bouteilles_max
        );

        return tranche ? tranche.frais : 0;
    };

    return { fraisPort, calculerFrais, loading };
}