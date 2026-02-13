"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[];
    showPageSizeSelector?: boolean;
    className?: string;
}

export function Pagination({
    page,
    pageSize,
    total,
    totalPages,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [25, 50, 100, 200],
    showPageSizeSelector = true,
    className
}: PaginationProps) {
    const startItem = page * pageSize + 1;
    const endItem = Math.min((page + 1) * pageSize, total);
    const hasNext = page < totalPages - 1;
    const hasPrevious = page > 0;

    // Générer les numéros de page à afficher
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 7; // Nombre max de pages visibles
        
        if (totalPages <= maxVisible) {
            // Afficher toutes les pages
            for (let i = 0; i < totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Afficher avec ellipses
            if (page < 3) {
                // Début : [0, 1, 2, 3, ..., last]
                for (let i = 0; i < 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages - 1);
            } else if (page > totalPages - 4) {
                // Fin : [0, ..., n-3, n-2, n-1, n]
                pages.push(0);
                pages.push('...');
                for (let i = totalPages - 4; i < totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // Milieu : [0, ..., p-1, p, p+1, ..., last]
                pages.push(0);
                pages.push('...');
                for (let i = page - 1; i <= page + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages - 1);
            }
        }
        
        return pages;
    };

    const pageNumbers = getPageNumbers();

    if (total === 0) {
        return (
            <div className={cn("flex items-center justify-between text-sm text-slate-500", className)}>
                <span>Aucun résultat</span>
            </div>
        );
    }

    return (
        <div className={cn("flex items-center justify-between gap-4", className)}>
            {/* Informations */}
            <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>
                    {startItem}-{endItem} sur {total.toLocaleString()}
                </span>
                
                {showPageSizeSelector && onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">Par page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="px-2 py-1 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Contrôles de pagination */}
            <div className="flex items-center gap-2">
                {/* Première page */}
                <button
                    onClick={() => onPageChange(0)}
                    disabled={!hasPrevious}
                    className={cn(
                        "p-2 rounded-md border transition-colors",
                        hasPrevious
                            ? "border-slate-300 hover:bg-slate-50 text-slate-700"
                            : "border-slate-200 text-slate-300 cursor-not-allowed"
                    )}
                    title="Première page"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Page précédente */}
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={!hasPrevious}
                    className={cn(
                        "p-2 rounded-md border transition-colors",
                        hasPrevious
                            ? "border-slate-300 hover:bg-slate-50 text-slate-700"
                            : "border-slate-200 text-slate-300 cursor-not-allowed"
                    )}
                    title="Page précédente"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Numéros de page */}
                <div className="flex items-center gap-1">
                    {pageNumbers.map((pageNum, idx) => {
                        if (pageNum === '...') {
                            return (
                                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                                    ...
                                </span>
                            );
                        }
                        
                        const pageIndex = pageNum as number;
                        const isCurrent = pageIndex === page;
                        
                        return (
                            <button
                                key={pageIndex}
                                onClick={() => onPageChange(pageIndex)}
                                className={cn(
                                    "min-w-[32px] px-2 py-1 rounded-md text-sm font-medium transition-colors",
                                    isCurrent
                                        ? "bg-blue-600 text-white"
                                        : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                                )}
                            >
                                {pageIndex + 1}
                            </button>
                        );
                    })}
                </div>

                {/* Page suivante */}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={!hasNext}
                    className={cn(
                        "p-2 rounded-md border transition-colors",
                        hasNext
                            ? "border-slate-300 hover:bg-slate-50 text-slate-700"
                            : "border-slate-200 text-slate-300 cursor-not-allowed"
                    )}
                    title="Page suivante"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dernière page */}
                <button
                    onClick={() => onPageChange(totalPages - 1)}
                    disabled={!hasNext}
                    className={cn(
                        "p-2 rounded-md border transition-colors",
                        hasNext
                            ? "border-slate-300 hover:bg-slate-50 text-slate-700"
                            : "border-slate-200 text-slate-300 cursor-not-allowed"
                    )}
                    title="Dernière page"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
