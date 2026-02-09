// components/ConfirmationModal.tsx
"use client";
import { useEffect } from "react";

type ConfirmationModalProps = {
    isOpen: boolean;
    onClose: () => void;
    type?: "success" | "error" | "info";
    title?: string;
    message: string;
    autoClose?: boolean;
    autoCloseDelay?: number;
};

export default function ConfirmationModal({
                                              isOpen,
                                              onClose,
                                              type = "success",
                                              title,
                                              message,

                                          }: ConfirmationModalProps) {


    if (!isOpen) return null;

    const styles = {
        success: {
            bg: "bg-[#8BA9B7]",
            border: "border-[#24586f]",
            text: "text-white",
            icon: "✓",
            iconBg: "bg-[#24586f]",
        },
        error: {
            bg: "bg-red-50",
            border: "border-red-500",
            text: "text-red-800",
            icon: "✕",
            iconBg: "bg-red-500",
        },
        info: {
            bg: "bg-blue-50",
            border: "border-blue-500",
            text: "text-blue-800",
            icon: "ℹ",
            iconBg: "bg-blue-500",
        },
    };

    const style = styles[type];

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={`${style.bg} ${style.border} border-2 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 pointer-events-auto animate-slideUp`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Icône */}
                    <div className="flex justify-center mb-4">
                        <div
                            className={`${style.iconBg} w-16 h-16 rounded-full flex items-center justify-center`}
                        >
                            <span className="text-white text-3xl font-bold">
                                {style.icon}
                            </span>
                        </div>
                    </div>

                    {/* Titre */}
                    {title && (
                        <h2
                            className={`text-2xl font-bold text-center ${style.text} mb-4`}
                        >
                            {title}
                        </h2>
                    )}

                    {/* Message */}
                    <p
                        className={`text-center ${style.text} text-base sm:text-lg leading-relaxed mb-6`}
                    >
                        {message}
                    </p>

                    {/* Bouton Fermer */}
                    <button
                        onClick={onClose}
                        className={`w-full py-3 px-6 bg-white text-black border-2 ${style.border} rounded-lg font-semibold hover:bg-opacity-80 transition-colors cursor-pointer`}
                    >
                        Fermer
                    </button>


                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shrink {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }

                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }

                .animate-shrink {
                    animation: shrink linear;
                }
            `}</style>
        </>
    );
}