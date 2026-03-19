// components/RichTextEditor.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

const COLORS: Record<string, string> = {
    noir:         "#000000",
    gris:         "#6B7280",
    "bleu-clair": "#8BA9B7",
    "bleu-fonce": "#24586f",
    rouge:        "#DC2626",
    vert:         "#16A34A",
    jaune:        "#EAB308",
    orange:       "#F97316",
};

const FONTS = [
    { label: "Montserrat",             value: "var(--font-montserrat)" },
    { label: "Arial",                  value: "Arial, sans-serif" },
    { label: "Bahnschrift Condensed",  value: "'Bahnschrift Condensed', 'Franklin Gothic Medium', sans-serif" },
    { label: "Calibri",                value: "Calibri, 'Gill Sans', sans-serif" },
    { label: "Segoe UI",               value: "'Segoe UI', system-ui, sans-serif" },
    { label: "Tahoma",                 value: "Tahoma, Geneva, sans-serif" },
    { label: "Times New Roman",        value: "'Times New Roman', Times, serif" },
];

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [selectedFont, setSelectedFont] = useState("var(--font-montserrat)");
    const [selectedSize, setSelectedSize] = useState("");
    const isUserTyping = useRef(false);
    const lastValueRef = useRef(value);

    useEffect(() => {
        if (!isUserTyping.current && editorRef.current && value !== editorRef.current.innerHTML) {
            const selection = window.getSelection();
            const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            const startOffset = range?.startOffset || 0;
            const startContainer = range?.startContainer;

            editorRef.current.innerHTML = value;

            if (range && startContainer && editorRef.current.contains(startContainer)) {
                try {
                    const newRange = document.createRange();
                    newRange.setStart(startContainer, Math.min(startOffset, startContainer.textContent?.length || 0));
                    newRange.collapse(true);
                    selection?.removeAllRanges();
                    selection?.addRange(newRange);
                } catch (e) {}
            }
        }
        lastValueRef.current = value;
    }, [value]);

    useEffect(() => {
        if (editorRef.current && !editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, []);

    // Intercepte le collage pour ne garder que texte brut (évite les décalages)
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
    };

    const applyFormat = (command: string, val?: string) => {
        document.execCommand(command, false, val);
        editorRef.current?.focus();
        handleInput();
    };

    const handleInput = () => {
        if (editorRef.current) {
            isUserTyping.current = true;
            const newValue = editorRef.current.innerHTML;
            if (newValue !== lastValueRef.current) {
                onChange(newValue);
                lastValueRef.current = newValue;
            }
            setTimeout(() => { isUserTyping.current = false; }, 50);
        }
    };

    const applyColor = (hex: string) => {
        applyFormat("foreColor", hex);
        setShowColorPicker(false);
    };

    const applyFont = (fontValue: string) => {
        setSelectedFont(fontValue);
        editorRef.current?.focus();
        if (fontValue) {
            // Avec ou sans sélection : execCommand gère les deux cas
            document.execCommand("fontName", false, fontValue);
        }
        // "Par défaut" (valeur vide) : on ne fait rien de destructif,
        // le curseur reprend simplement la police héritée du parent
        handleInput();
    };

    // Insère un <span style="font-size"> autour de la sélection,
    // ou avec un espace zéro-largeur si rien n'est sélectionné (le curseur
    // se place à l'intérieur → le texte tapé hérite de la taille).
    const applySize = (px: string) => {
        setSelectedSize(px);
        if (!px) return;
        editorRef.current?.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.style.fontSize = px;

        if (!selection.isCollapsed) {
            // Texte sélectionné → on l'enveloppe
            try {
                range.surroundContents(span);
            } catch {
                const fragment = range.extractContents();
                span.appendChild(fragment);
                range.insertNode(span);
            }
            selection.removeAllRanges();
        } else {
            // Rien de sélectionné → on insère un span avec espace zéro-largeur
            // et on place le curseur à l'intérieur
            span.innerHTML = "\u200B"; // zero-width space
            range.insertNode(span);
            const newRange = document.createRange();
            newRange.setStart(span.firstChild!, 1);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }

        handleInput();
        setTimeout(() => setSelectedSize(""), 0);
    };

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Barre d'outils */}
            <div className="bg-gray-50 dark:bg-[#0f1117] border-b border-gray-300 dark:border-gray-700 p-2 flex flex-wrap gap-1 items-center">

                {/* Gras */}
                <button
                    type="button"
                    onClick={() => applyFormat("bold")}
                    className="px-3 py-1 bg-white dark:bg-[#1a1d27] dark:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 font-bold"
                    title="Gras"
                >
                    B
                </button>

                {/* Italique */}
                <button
                    type="button"
                    onClick={() => applyFormat("italic")}
                    className="px-3 py-1 bg-white dark:bg-[#1a1d27] dark:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 italic"
                    title="Italique"
                >
                    I
                </button>

                {/* Souligné */}
                <button
                    type="button"
                    onClick={() => applyFormat("underline")}
                    className="px-3 py-1 bg-white dark:bg-[#1a1d27] dark:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 underline"
                    title="Souligné"
                >
                    U
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Couleurs */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="px-3 py-1 bg-white dark:bg-[#1a1d27] dark:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        title="Couleur du texte"
                    >
                        <span className="font-semibold">A</span>
                        <div className="w-4 h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rounded" />
                    </button>

                    {showColorPicker && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(false)} />
                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl p-2 z-20 min-w-[200px]">
                                <div className="text-xs font-medium text-gray-700 mb-2">Choisir une couleur</div>
                                <div className="grid grid-cols-4 gap-1">
                                    {Object.entries(COLORS).map(([nom, hex]) => (
                                        <button
                                            key={nom}
                                            type="button"
                                            onClick={() => applyColor(hex)}
                                            className="group relative flex flex-col items-center"
                                            title={nom.replace(/-/g, " ")}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-md border-2 border-gray-300 hover:border-[#24586f] hover:scale-110 transition-all shadow-sm"
                                                style={{ backgroundColor: hex }}
                                            />
                                            <span className="text-[10px] text-gray-600 mt-1 capitalize opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {nom.replace(/-/g, " ")}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Sélecteur de police */}
                <select
                    value={selectedFont}
                    onChange={(e) => applyFont(e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-[#1a1d27] dark:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#24586f]"
                    title="Police"
                    style={{ fontFamily: selectedFont || "inherit" }}
                >
                    {FONTS.map((f) => (
                        <option key={f.value} value={f.value} style={{ fontFamily: f.value || "inherit" }}>
                            {f.label}
                        </option>
                    ))}
                </select>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Taille */}
                <select
                    value={selectedSize}
                    onChange={(e) => applySize(e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-[#1a1d27] dark:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#24586f] w-20"
                    title="Taille du texte"
                >
                    <option value="">Taille</option>
                    {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((s) => (
                        <option key={s} value={`${s}px`}>{s}</option>
                    ))}
                </select>

                <div className="w-px h-6 bg-gray-300 mx-1" />
                <button
                    type="button"
                    onClick={() => applyFormat("removeFormat")}
                    className="px-3 py-1 bg-white dark:bg-[#1a1d27] dark:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
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
                onPaste={handlePaste}
                suppressContentEditableWarning
                className="p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#24586f] focus:ring-inset bg-white dark:bg-[#1a1d27] text-black dark:text-[#faf5f1]"
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