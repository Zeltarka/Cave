// utils/supabase.ts
// ─────────────────────────────────────────────
// Client Supabase — utilisé dans vos API routes
// et composants serveur (Server Components).
//
// Les variables d'environnement sont automatiquement
// synchronisées par l'intégration Vercel ↔ Supabase.
// ─────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ── Client PUBLIC (anon) ──────────────────────
// Pour les requêtes depuis le navigateur (ex: lire le catalogue).
// Respecte les politiques RLS.
export const supabase = createClient(supabaseUrl, supabaseKey);


// ── Client ADMIN (service_role) ───────────────
// Pour les API routes Next.js (côté serveur uniquement !).
// Contourne les politiques RLS → ne jamais exposer côté client.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
