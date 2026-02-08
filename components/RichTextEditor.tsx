// components/RichTextEditor.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

const COLORS = {
    noir: "#000000",
    gris: "#6B7280",
    "bleu-clair": "#8BA9B7",
    "bleu-fonce": "#24586f",
    rouge: "#DC2626",
    vert: "#16A34A",
    jaune: "#EAB308",
    orange: "#F97316",
};

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const isUserTyping = useRef(false);
    const lastValueRef = useRef(value);

    // Ne mettre à jour le contenu que si la valeur a changé de l'extérieur (pas de l'utilisateur)
    useEffect(() => {
        if (!isUserTyping.current && editorRef.current && value !== editorRef.current.innerHTML) {
            // Sauvegarder la position du curseur
            const selection = window.getSelection();
            const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            const startOffset = range?.startOffset || 0;
            const startContainer = range?.startContainer;

            editorRef.current.innerHTML = value;

            // Restaurer la position du curseur
            if (range && startContainer && editorRef.current.contains(startContainer)) {
                try {
                    const newRange = document.createRange();
                    newRange.setStart(startContainer, Math.min(startOffset, startContainer.textContent?.length || 0));
                    newRange.collapse(true);
                    selection?.removeAllRanges();
                    selection?.addRange(newRange);
                } catch (e) {
                    // Ignorer les erreurs de restauration du curseur
                }
            }
        }
        lastValueRef.current = value;
    }, [value]);

    const applyFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        // Forcer la mise à jour après le formatage
        handleInput();
    };

    const handleInput = () => {
        if (editorRef.current) {
            isUserTyping.current = true;
            const newValue = editorRef.current.innerHTML;

            // Ne mettre à jour que si la valeur a vraiment changé
            if (newValue !== lastValueRef.current) {
                onChange(newValue);
                lastValueRef.current = newValue;
            }

            // Réinitialiser le flag après un court délai
            setTimeout(() => {
                isUserTyping.current = false;
            }, 50);
        }
    };

    const applyColor = (color: string) => {
        applyFormat("foreColor", color);
        setShowColorPicker(false);
    };

    // Initialiser le contenu au montage
    useEffect(() => {
        if (editorRef.current && !editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, []);

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Barre d'outils */}
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
                {/* Gras */}
                <button
                    type="button"
                    onClick={() => applyFormat("bold")}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                    title="Gras"
                >
                    B
                </button>

                {/* Italique */}
                <button
                    type="button"
                    onClick={() => applyFormat("italic")}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 italic"
                    title="Italique"
                >
                    I
                </button>

                {/* Souligné */}
                <button
                    type="button"
                    onClick={() => applyFormat("underline")}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 underline"
                    title="Souligné"
                >
                    U
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Couleurs */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-2"
                        title="Couleur du texte"
                    >
                        <span className="font-semibold">A</span>
                        <div className="w-4 h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rounded"></div>
                    </button>

                    {showColorPicker && (
                        <>
                            {/* Overlay pour fermer en cliquant à l'extérieur */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowColorPicker(false)}
                            />

                            {/* Menu des couleurs */}
                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl p-2 z-20 min-w-[200px]">
                                <div className="text-xs font-medium text-gray-700 mb-2">Choisir une couleur</div>
                                <div className="grid grid-cols-4 gap-1">
                                    {Object.entries(COLORS).map(([nom, couleur]) => (
                                        <button
                                            key={nom}
                                            type="button"
                                            onClick={() => applyColor(couleur)}
                                            className="group relative flex flex-col items-center"
                                            title={nom.replace(/-/g, ' ')}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-md border-2 border-gray-300 hover:border-[#24586f] hover:scale-110 transition-all shadow-sm"
                                                style={{ backgroundColor: couleur }}
                                            />
                                            <span className="text-[10px] text-gray-600 mt-1 capitalize opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {nom.replace(/-/g, ' ')}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Supprimer formatage */}
                <button
                    type="button"
                    onClick={() => applyFormat("removeFormat")}
                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
                    title="Supprimer le formatage"
                >
                    ✕
                </button>
            </div>

            {/* Zone d'édition */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                suppressContentEditableWarning
                className="p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#24586f] focus:ring-inset"
                style={{ wordWrap: "break-word" }}
                data-placeholder={placeholder}
            />

            <style jsx>{`
                [contentEditable][data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: #9CA3AF;
                    cursor: text;
                }
            `}</style>
        </div>
    );
}