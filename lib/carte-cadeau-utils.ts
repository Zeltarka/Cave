// lib/carte-cadeau-utils.ts

/**
 * Génère un ID unique pour une carte cadeau
 * Format: CarteCadeau-{Destinataire}-{Prix}-{Date}-{Heure}-{Minute}-{Hash4}
 * Exemple: CarteCadeau-JeanDupont-50-20250210-14-35-A3F7
 */
export function generateCarteCadeauId(destinataire: string, montant: number): string {
    const now = new Date();

    // Nettoyer le nom du destinataire (enlever espaces et caractères spéciaux)
    const destClean = destinataire
        .trim()
        .replace(/\s+/g, '')  // Enlever les espaces
        .replace(/[^a-zA-Z0-9]/g, ''); // Enlever caractères spéciaux

    // Date au format YYYYMMDD
    const date = now.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).split('/').reverse().join('');

    // Heure (00-23)
    const heure = String(now.getHours()).padStart(2, '0');

    // Minute (00-59)
    const minute = String(now.getMinutes()).padStart(2, '0');

    // Hash de 4 caractères aléatoires (A-Z, 0-9)
    const hash = generateRandomHash(4);

    // Prix sans décimales
    const prixStr = Math.floor(montant).toString();

    return `CarteCadeau-${destClean}-${prixStr}-${date}-${heure}-${minute}-${hash}`;
}

/**
 * Génère un hash aléatoire de N caractères (A-Z, 0-9)
 */
function generateRandomHash(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Exemple d'utilisation:
 * generateCarteCadeauId("Jean Dupont", 50.00)
 * → "CarteCadeau-JeanDupont-50-20250210-14-35-A3F7"
 */