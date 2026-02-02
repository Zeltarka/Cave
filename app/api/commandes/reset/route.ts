import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function DELETE(req: Request) {
    const cookieStore = await cookies();
    cookieStore.delete("panier"); // supprime le cookie panier
    return NextResponse.json({ success: true, message: "Panier réinitialisé" });
}
