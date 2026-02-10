// lib/rate-limit.ts

type AttemptRecord = {
    count: number;
    firstAttempt: number;
    blockedUntil?: number;
};

// Stockage en mémoire (réinitialisé au redémarrage du serveur)
const loginAttempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 10; // Nombre max de tentatives
const WINDOW_MS = 15 * 60 * 1000; // Fenêtre de 15 minutes
const BLOCK_DURATION_MS = 30 * 60 * 1000; // Blocage de 30 minutes

/**
 * Vérifie si une IP est bloquée et enregistre une tentative
 * @param ip Adresse IP du client
 * @returns { blocked: boolean, remainingAttempts?: number, blockedUntil?: Date }
 */
export function checkRateLimit(ip: string): {
    blocked: boolean;
    remainingAttempts?: number;
    blockedUntil?: Date;
    retryAfter?: number;
} {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    // Pas d'historique pour cette IP
    if (!record) {
        loginAttempts.set(ip, {
            count: 1,
            firstAttempt: now,
        });
        return { blocked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
    }

    // IP actuellement bloquée
    if (record.blockedUntil && record.blockedUntil > now) {
        const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
        return {
            blocked: true,
            blockedUntil: new Date(record.blockedUntil),
            retryAfter,
        };
    }

    // Fenêtre expirée : réinitialiser
    if (now - record.firstAttempt > WINDOW_MS) {
        loginAttempts.set(ip, {
            count: 1,
            firstAttempt: now,
        });
        return { blocked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
    }

    // Incrémenter le compteur
    record.count++;

    // Trop de tentatives : bloquer
    if (record.count >= MAX_ATTEMPTS) {
        record.blockedUntil = now + BLOCK_DURATION_MS;
        loginAttempts.set(ip, record);

        const retryAfter = Math.ceil(BLOCK_DURATION_MS / 1000);
        return {
            blocked: true,
            blockedUntil: new Date(record.blockedUntil),
            retryAfter,
        };
    }

    // Encore des tentatives restantes
    return {
        blocked: false,
        remainingAttempts: MAX_ATTEMPTS - record.count,
    };
}

/**
 * Réinitialise les tentatives pour une IP (après connexion réussie)
 */
export function resetRateLimit(ip: string): void {
    loginAttempts.delete(ip);
}

/**
 * Nettoie les anciennes entrées (à appeler périodiquement)
 */
export function cleanupOldAttempts(): void {
    const now = Date.now();
    for (const [ip, record] of loginAttempts.entries()) {
        // Supprimer les entrées expirées
        if (
            (!record.blockedUntil || record.blockedUntil < now) &&
            now - record.firstAttempt > WINDOW_MS
        ) {
            loginAttempts.delete(ip);
        }
    }
}

// Nettoyage automatique toutes les heures
setInterval(cleanupOldAttempts, 60 * 60 * 1000);