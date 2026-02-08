// app/admin/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";

function AdminRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/dashboard");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-[#24586f] text-xl">Redirection...</div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <AdminGuard>
            <AdminRedirect />
        </AdminGuard>
    );
}