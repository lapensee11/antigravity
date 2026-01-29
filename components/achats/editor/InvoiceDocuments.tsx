import React from "react";
import { Invoice } from "@/lib/types";

interface InvoiceDocumentsProps {
    comment?: string;
    onCommentChange: (value: string) => void;
}

export const InvoiceDocuments: React.FC<InvoiceDocumentsProps> = ({ comment, onCommentChange }) => {
    return (
        <div className="space-y-3 pt-6 border-t border-slate-200 mt-6">
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#1E293B] rounded-full" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Documents</h3>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Block 1: Commentaire */}
                <div className="bg-white rounded-xl border border-[#1E293B]/20 p-4 shadow-sm h-40 flex flex-col">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Commentaire</h4>
                    <textarea
                        value={comment || ""}
                        onChange={e => onCommentChange(e.target.value)}
                        placeholder="Ajouter une note..."
                        className="w-full flex-1 bg-slate-50 rounded-lg p-3 text-sm text-slate-700 outline-none resize-none focus:bg-white focus:ring-1 focus:ring-[#1E293B] transition-all"
                    />
                </div>

                {/* Block 2: Scan */}
                <div className="bg-white rounded-xl border border-[#1E293B]/20 p-4 shadow-sm h-40 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-[#1E293B] transition-all hover:bg-slate-50/50">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#1E293B] transition-colors">
                        <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v15a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-[#1E293B]">Scanner Document</span>
                </div>

                {/* Block 3: Photo */}
                <div className="bg-white rounded-xl border border-[#1E293B]/20 p-4 shadow-sm h-40 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-[#1E293B] transition-all hover:bg-slate-50/50">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#1E293B] transition-colors">
                        <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-[#1E293B]">Prendre Photo</span>
                </div>
            </div>
        </div>
    );
};
