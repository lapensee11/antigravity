"use client";

import React, { useRef, useState } from "react";
import { FileText, Camera, X, Trash2 } from "lucide-react";
import { compressImage, cn } from "@/lib/utils";

/**
 * documentImage et photoImage : stockés dans la facture elle-même (objet Invoice), en base IndexedDB (table `invoices`).
 * Pas de fichier disque ni autre base : tout est dans la facture, en base de données locale.
 * Valeurs = chaînes base64 (data URL). Photo : compressée à l'import (largeur max 400 px) pour limiter la taille.
 */
interface InvoiceDocumentsProps {
    comment?: string;
    onCommentChange: (value: string) => void;
    documentImage?: string;
    onDocumentChange: (value: string) => void;
    photoImage?: string;
    onPhotoChange: (value: string) => void;
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const isPdf = (data: string) => data?.startsWith("data:application/pdf");

/** Bloc Document : image ou PDF */
function DocumentBlock({
    data,
    label,
    icon: Icon,
    onUpload,
    onRemove,
    emptyLabel,
    acceptPdf = false,
}: {
    data?: string;
    label: string;
    icon: React.ElementType;
    onUpload: (base64: string) => void;
    onRemove: () => void;
    emptyLabel: string;
    acceptPdf?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [enlargeSrc, setEnlargeSrc] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            if (acceptPdf && file.type === "application/pdf") {
                const base64 = await fileToBase64(file);
                onUpload(base64);
            } else {
                const base64 = await compressImage(file, 400);
                onUpload(base64);
            }
        } catch (_) {
            /* ignore */
        }
        e.target.value = "";
    };

    return (
        <>
            <div className="bg-white rounded-xl border border-[#1E293B]/20 p-4 shadow-sm flex flex-col aspect-square min-h-0">
                <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2 shrink-0">{label}</h4>
                <input
                    ref={inputRef}
                    type="file"
                    accept={acceptPdf ? "image/*,application/pdf" : "image/*"}
                    capture={!acceptPdf && label.includes("Photo") ? "environment" : undefined}
                    className="hidden"
                    onChange={handleFileChange}
                />
                <div
                    onClick={() => data ? setEnlargeSrc(data) : inputRef.current?.click()}
                    className={cn(
                        "flex-1 rounded-lg border-2 border-dashed overflow-hidden flex items-center justify-center min-h-0 cursor-pointer transition-all relative group/thumb",
                        data
                            ? "border-slate-200 hover:border-[#1E293B]/40 bg-slate-50"
                            : "border-slate-200 hover:border-[#1E293B] hover:bg-slate-50/50 group"
                    )}
                >
                    {data ? (
                        isPdf(data) ? (
                            <div className="w-full h-full flex flex-col min-h-0">
                                <div className="flex-1 min-h-0 w-full overflow-hidden bg-slate-100 rounded flex items-center justify-center">
                                    <iframe
                                        src={data}
                                        title={label}
                                        className="w-full h-full min-h-[120px] max-h-[200px] pointer-events-none border-0"
                                        style={{ minHeight: "120px" }}
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 py-1.5 text-slate-500 shrink-0 justify-center">
                                    <FileText className="w-4 h-4 shrink-0" />
                                    <span className="text-[11px] font-bold">Cliquer pour agrandir</span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col min-h-0">
                                <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center bg-slate-50">
                                    <img src={data} alt={label} className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="py-1.5 shrink-0 text-center">
                                    <span className="text-[11px] font-bold text-slate-500">Cliquer pour agrandir</span>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-[#1E293B]">
                            <Icon className="w-8 h-8" />
                            <span className="text-[12px] font-bold">{emptyLabel}</span>
                        </div>
                    )}
                </div>
                {data && (
                    <div className="flex gap-1 mt-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="text-[11px] text-slate-500 hover:text-[#1E293B] font-bold"
                        >
                            Remplacer
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            className="text-[11px] text-red-500 hover:text-red-600 font-bold flex items-center gap-0.5"
                        >
                            <Trash2 className="w-3 h-3" />
                            Supprimer
                        </button>
                    </div>
                )}
            </div>

            {/* Modal agrandissement — fond clair */}
            {enlargeSrc && (
                <div
                    className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setEnlargeSrc(null)}
                >
                    <button
                        onClick={() => setEnlargeSrc(null)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    {isPdf(enlargeSrc) ? (
                        <iframe
                            src={enlargeSrc}
                            title={label}
                            className="w-[90vw] h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <img
                            src={enlargeSrc}
                            alt={label}
                            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            )}
        </>
    );
}

export const InvoiceDocuments: React.FC<InvoiceDocumentsProps> = ({
    comment,
    onCommentChange,
    documentImage,
    onDocumentChange,
    photoImage,
    onPhotoChange,
}) => {
    return (
        <div className="space-y-3 pt-6 border-t border-slate-200 mt-6">
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#1E293B] rounded-full" />
                <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">Documents</h3>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Block 1: Commentaire */}
                <div className="bg-white rounded-xl border border-[#1E293B]/20 p-4 shadow-sm flex flex-col aspect-square min-h-0">
                    <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2 shrink-0">Commentaire</h4>
                    <textarea
                        value={comment || ""}
                        onChange={(e) => onCommentChange(e.target.value)}
                        placeholder="Ajouter une note..."
                        className="w-full flex-1 bg-slate-50 rounded-lg p-3 text-base text-slate-700 outline-none resize-none focus:bg-white focus:ring-1 focus:ring-[#1E293B] transition-all min-h-0"
                    />
                </div>

                {/* Block 2: Scanner Document (image + PDF) */}
                <DocumentBlock
                    data={documentImage}
                    label="Scanner Document"
                    icon={FileText}
                    onUpload={onDocumentChange}
                    onRemove={() => onDocumentChange("")}
                    emptyLabel="Importer scan / PDF"
                    acceptPdf
                />

                {/* Block 3: Photo */}
                <DocumentBlock
                    data={photoImage}
                    label="Photo"
                    icon={Camera}
                    onUpload={onPhotoChange}
                    onRemove={() => onPhotoChange("")}
                    emptyLabel="Importer photo"
                />
            </div>
        </div>
    );
};
