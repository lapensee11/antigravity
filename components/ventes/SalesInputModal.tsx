import { useState, useEffect } from "react";
import { Check, X, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (data: any, isDraft: boolean) => void;
    date: string;
    isDeclared?: boolean;
    initialData?: any;
    realData?: any; // NEW PROP
}

// Grouped Families for Declaré
const FAMILY_GROUPS = [
    { name: "Group 1", items: ["BOULANGERIE", "CROIS.", "VIEN."] },
    { name: "Group 2", items: ["PAT INDIVID.", "PAT ENTRE."] },
    { name: "Group 3", items: ["FOURS SECS", "BELDI", "PRÉ-EMB."] },
    { name: "Group 4", items: ["SALÉS", "CONFISERIE"] },
    { name: "Group 5", items: ["PAIN SG", "GÂTEAUX SG"] },
];

export function SalesInputModal({ isOpen, onClose, onSave, date, isDeclared, initialData, realData }: SalesInputModalProps) {
    const isModalDeclared = isDeclared;

    // Header Color Logic
    const headerColor = isModalDeclared ? "bg-[#92400E]" : "bg-[#1E293B]";
    const buttonColor = isModalDeclared ? "bg-purple-600 hover:bg-purple-500" : "bg-emerald-500 hover:bg-emerald-400";

    // Form State
    const [sales, setSales] = useState<Record<string, string>>({});
    const [supplements, setSupplements] = useState({ traiteurs: "", caisse: "" });
    const [payments, setPayments] = useState({ nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" });
    const [subTotalInput, setSubTotalInput] = useState(""); // Manual Subtotal
    const [nbTickets, setNbTickets] = useState("");
    const [glovo, setGlovo] = useState({ brut: "", brutImp: "", brutExo: "", incid: "", cash: "" });

    // NEW: Coefficients State
    const [coeffExo, setCoeffExo] = useState("1.11");
    const [coeffImp, setCoeffImp] = useState("0.60");

    // Time State (Split H/M)
    const [hours, setHours] = useState({
        startH: "07", startM: "00",
        endH: "20", endM: "00"
    });

    // Load initial data
    useEffect(() => {
        if (isOpen && initialData) {
            setSales(initialData.sales || {});
            setSupplements(initialData.supplements || { traiteurs: "", caisse: "" });
            setPayments(initialData.payments || { nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" });
            setSubTotalInput(initialData.subTotalInput || "");
            setNbTickets(initialData.nbTickets || "");
            setGlovo(initialData.glovo || { brut: "", brutImp: "", brutExo: "", incid: "", cash: "" });
            setHours(initialData.hours || { startH: "07", startM: "00", endH: "20", endM: "00" });
        } else if (isOpen) {
            // Reset if new/empty
            setSales({});
            setSupplements({ traiteurs: "", caisse: "" });
            setPayments({ nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" });
            setSubTotalInput("");
            setNbTickets("");
            setGlovo({ brut: "", brutImp: "", brutExo: "", incid: "", cash: "" });
            setHours({ startH: "07", startM: "00", endH: "20", endM: "00" });
        }

        // Initialize Coeffs with persistence check
        if (isOpen && isDeclared) {
            // Preserve existing coeffs if editing, or default if new
            setCoeffExo(initialData?.coeffExo || "1.11");
            setCoeffImp(initialData?.coeffImp || "0.60");
        }
    }, [isOpen, initialData, isDeclared]);

    // AUTO-CALC EFFECT FOR DECLARED MODE
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // AUTO-CALC EFFECT FOR DECLARED MODE
    useEffect(() => {
        if (isDeclared && realData) {
            // 1. Calc Sales
            if (realData.sales) {
                const newSales: Record<string, string> = {};
                const cExo = parseFloat(coeffExo) || 0;
                const cImp = parseFloat(coeffImp) || 0;

                Object.entries(realData.sales).forEach(([key, val]) => {
                    const realVal = parseFloat(val as string) || 0;
                    let calcVal = 0;

                    if (key === "BOULANGERIE") {
                        calcVal = realVal * cExo;
                    } else {
                        calcVal = realVal * cImp;
                    }

                    newSales[key] = calcVal.toFixed(2);
                });
                setSales(newSales);
            }

            // 2. Sync Payments (CMI/Chq) from Real Data (Locked)
            if (realData.payments) {
                setPayments(realData.payments);
            }

            // 3. Sync Glovo from Real Data (Locked)
            if (realData.glovo) {
                setGlovo(realData.glovo);
            }
        }
    }, [isDeclared, realData, coeffExo, coeffImp]);

    // Helper for Time Input (Arrow keys)
    const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: keyof typeof hours, max: number) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const direction = e.key === "ArrowUp" ? 1 : -1;
            let val = parseInt(hours[field] || "0");

            // If empty or NaN, start at 0
            if (isNaN(val)) val = 0;

            val = (val + direction + max) % max; // Cycle with max (24 or 60)

            setHours(prev => ({ ...prev, [field]: String(val).padStart(2, '0') }));
        }
    };

    // Helper for Coeff Arrow Keys & Buttons
    const updateCoeff = (field: 'exo' | 'imp', direction: 'up' | 'down') => {
        const step = 0.01; // Updated to 0.01 per request
        if (field === 'exo') {
            const val = parseFloat(coeffExo) || 0;
            const newVal = val + (direction === 'up' ? step : -step);
            setCoeffExo(newVal.toFixed(2));
        } else {
            const val = parseFloat(coeffImp) || 0;
            const newVal = val + (direction === 'up' ? step : -step);
            setCoeffImp(newVal.toFixed(2));
        }
    };

    const handleCoeffKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'exo' | 'imp') => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            updateCoeff(field, e.key === "ArrowUp" ? 'up' : 'down');
        }
    };

    // --- CALCULATIONS ---

    // 1. Exonéré = Boulangerie only
    const valExo = parseFloat(sales["BOULANGERIE"] || "0");

    // 2. Imposable HT = Sum(Others) / 1.2
    let sumOthersTTC = 0;
    Object.entries(sales).forEach(([key, val]) => {
        if (key !== "BOULANGERIE") {
            sumOthersTTC += parseFloat(val) || 0;
        }
    });
    const valImpHT = sumOthersTTC / 1.2;

    // 3. SubTotal
    const manualSubTotal = parseFloat(subTotalInput) || 0;

    // 4. Espèces
    // Supplements = 0 in Declared Mode context
    const totalSupplements = isDeclared ? 0 : (parseFloat(supplements.traiteurs) || 0) + (parseFloat(supplements.caisse) || 0);

    const mtCmi = parseFloat(payments.mtCmi) || 0;
    const mtChq = parseFloat(payments.mtChq) || 0;



    // Glovo Net
    // Glovo Net
    const glovoNet = ((parseFloat(glovo.brut) || 0) * 0.82) - (parseFloat(glovo.incid) || 0) - (parseFloat(glovo.cash) || 0);

    // Total HT
    const totalHT = valImpHT + valExo;

    // Total TTC
    const totalTTC = valExo + sumOthersTTC;

    // Remise
    const valRemise = totalTTC - manualSubTotal;

    // Derived Cash (Moved here to access totalTTC)
    const valEsp = isDeclared
        ? (totalTTC - mtCmi - mtChq - (parseFloat(glovo.brut) || 0) + (parseFloat(glovo.cash) || 0))
        : ((manualSubTotal + totalSupplements) - mtCmi - mtChq);

    const handleSave = (isDraft: boolean = false) => {
        if (onSave) {
            onSave({
                sales,
                supplements,
                payments,
                subTotalInput,
                nbTickets,
                glovo,
                hours,
                coeffExo, // SAVE COEFFS
                coeffImp, // SAVE COEFFS
                calculated: {
                    exo: valExo.toFixed(2),
                    impHt: valImpHT.toFixed(2),
                    totHt: totalHT.toFixed(2),
                    ttc: totalTTC.toFixed(2),
                    remise: valRemise.toFixed(2),
                    esp: valEsp.toFixed(2),
                    cmi: mtCmi.toFixed(2),
                    chq: mtChq.toFixed(2),
                    glovo: glovoNet.toFixed(2)
                }
            }, isDraft);
        }
        onClose();
    };

    const formattedDate = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-[1100px] bg-[#FDFBF7] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* 1. Header */}
                <div className={cn("px-8 py-4 flex justify-between items-center text-white flex-shrink-0", headerColor)}>
                    <h2 className="text-xl font-bold italic font-serif tracking-wide">{capitalizedDate}</h2>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">Total HT</span>
                            <span className="text-xl font-bold tracking-tight">{totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh</span>
                        </div>
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">Total TTC</span>
                            <span className="text-xl font-bold tracking-tight">{totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh</span>
                        </div>

                        {/* Last Sync Display */}
                        {initialData?.lastSyncAt && (
                            <div className="flex flex-col items-end mr-6 opacity-80">
                                <span className="text-[9px] uppercase tracking-widest font-bold opacity-60">Synchronisé le</span>
                                <span className="text-xs font-mono font-bold">
                                    {new Date(initialData.lastSyncAt).toLocaleString('fr-FR', {
                                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        )}

                        {/* Actions */}
                        {/* Actions */}
                        {!isDeclared && (
                            <button
                                onClick={() => handleSave(false)}
                                className={cn("h-9 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95 text-xs font-bold uppercase tracking-wider", buttonColor)}
                            >
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="text-white">Synchroniser</span>
                            </button>
                        )}

                        <button
                            onClick={() => handleSave(true)}
                            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            title="Fermer et Enregistrer en Brouillon"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* 2. Content Body */}
                <div className="p-6 grid grid-cols-12 gap-6 overflow-y-auto min-h-0 bg-[#F8FAFC]">

                    {/* COL 1: CA Families Groups (Left) - Span 4 */}
                    <div className="col-span-4 space-y-2">
                        {FAMILY_GROUPS.map((group, gIdx) => (
                            <div key={gIdx} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100/60">
                                <div className="space-y-1">
                                    {group.items.map((fam) => (
                                        <div key={fam} className="flex justify-between items-center group">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700 transition-colors w-1/2 truncate leading-tight">
                                                {fam}
                                            </span>
                                            <div className="w-1/2 border-b border-slate-100 group-hover:border-slate-300 transition-colors relative">
                                                <input
                                                    type="text"
                                                    value={sales[fam] || ""}
                                                    readOnly={isDeclared} // READ ONLY IN DECLARED
                                                    className={cn(
                                                        "w-full text-right bg-transparent focus:outline-none font-bold text-xs py-0.5 font-mono",
                                                        isDeclared ? "text-slate-500 cursor-not-allowed" : "text-slate-800"
                                                    )}
                                                    placeholder="-"
                                                    onChange={(e) => setSales(prev => ({ ...prev, [fam]: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* COL 2: Middle - Span 4 */}
                    <div className="col-span-4 flex flex-col gap-3">

                        {/* Supplements OR Coefficients */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100/60 transition-all duration-300">
                            {isDeclared ? (
                                // COEFFICIENTS UI - Single Line Elegance with Arrows
                                <div className="flex items-center justify-between gap-4 h-full">
                                    {/* Exo */}
                                    <div className="flex-1 flex flex-col gap-1">
                                        <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider pl-1">Coeff Exo</span>
                                        <div className="relative flex items-center bg-purple-50/50 rounded-lg border border-purple-100 p-1 group hover:border-purple-300 transition-colors">
                                            <input
                                                type="text"
                                                value={coeffExo}
                                                onChange={(e) => setCoeffExo(e.target.value)}
                                                onKeyDown={(e) => handleCoeffKeyDown(e, 'exo')}
                                                className="w-full bg-transparent border-none text-center font-mono font-bold text-lg text-purple-700 p-0 focus:ring-0"
                                            />
                                            <div className="flex flex-col border-l border-purple-200/50 pl-1 ml-1 gap-px opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => updateCoeff('exo', 'up')}
                                                    className="hover:bg-purple-200 rounded p-px text-purple-700 transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    <ChevronUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => updateCoeff('exo', 'down')}
                                                    className="hover:bg-purple-200 rounded p-px text-purple-700 transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-px h-10 bg-slate-100 mx-1" />

                                    {/* Imp */}
                                    <div className="flex-1 flex flex-col gap-1">
                                        <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider pl-1">Coeff Imp</span>
                                        <div className="relative flex items-center bg-purple-50/50 rounded-lg border border-purple-100 p-1 group hover:border-purple-300 transition-colors">
                                            <input
                                                type="text"
                                                value={coeffImp}
                                                onChange={(e) => setCoeffImp(e.target.value)}
                                                onKeyDown={(e) => handleCoeffKeyDown(e, 'imp')}
                                                className="w-full bg-transparent border-none text-center font-mono font-bold text-lg text-purple-700 p-0 focus:ring-0"
                                            />
                                            <div className="flex flex-col border-l border-purple-200/50 pl-1 ml-1 gap-px opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => updateCoeff('imp', 'up')}
                                                    className="hover:bg-purple-200 rounded p-px text-purple-700 transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    <ChevronUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => updateCoeff('imp', 'down')}
                                                    className="hover:bg-purple-200 rounded p-px text-purple-700 transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // SUPPLEMENTS UI (Normal)
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supp Traiteurs</span>
                                        <input
                                            type="text"
                                            value={supplements.traiteurs}
                                            onChange={(e) => setSupplements(prev => ({ ...prev, traiteurs: e.target.value }))}
                                            className="w-20 text-right bg-slate-50 rounded-md border-none focus:ring-1 focus:ring-indigo-200 text-xs font-bold text-slate-700 py-1 px-2 font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supp Caisse</span>
                                        <input
                                            type="text"
                                            value={supplements.caisse}
                                            onChange={(e) => setSupplements(prev => ({ ...prev, caisse: e.target.value }))}
                                            className="w-20 text-right bg-slate-50 rounded-md border-none focus:ring-1 focus:ring-indigo-200 text-xs font-bold text-slate-700 py-1 px-2 font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Subtotal Display, Remise & Nb Tickets */}
                        <div className="bg-[#1E293B] rounded-xl p-4 shadow-md flex items-center justify-between text-white gap-4">
                            {isDeclared ? (
                                // DECLARED: Show Total TTC Only
                                <div className="flex flex-col flex-1">
                                    <span className="text-[9px] font-bold text-orange-300 uppercase tracking-widest mb-0.5">Total TTC (D)</span>
                                    <span className="text-2xl font-bold tracking-tight font-mono leading-none text-white">
                                        {totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ) : (
                                // REAL: Show SubTotal/Remise
                                <>
                                    <div className="flex flex-col flex-1">
                                        <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Sous-Total (Saisi)</span>
                                        <input
                                            type="text"
                                            value={subTotalInput}
                                            onChange={(e) => setSubTotalInput(e.target.value)}
                                            className="bg-transparent border-none p-0 text-xl font-bold tracking-tight font-mono leading-none text-white focus:ring-0 placeholder:text-white/20 w-full"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="flex flex-col flex-1 border-l border-white/10 pl-4">
                                        <span className="text-[9px] font-bold text-orange-300 uppercase tracking-widest mb-0.5">Remise (Calc)</span>
                                        <span className="text-xl font-bold tracking-tight font-mono leading-none text-orange-400">
                                            {valRemise.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col items-end border-l border-white/20 pl-4">
                                <span className={cn("text-[9px] font-bold uppercase tracking-widest mb-1", isDeclared && "text-slate-400")}>Nb Tickets</span>
                                <input
                                    value={nbTickets}
                                    readOnly={isDeclared}
                                    onChange={(e) => setNbTickets(e.target.value)}
                                    className={cn("w-16 border-none rounded text-center text-sm font-bold focus:ring-1 h-7 font-mono",
                                        isDeclared ? "bg-white/5 text-slate-300 cursor-not-allowed focus:ring-0" : "bg-white/10 text-white focus:ring-white/30"
                                    )}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Payments Block */}
                        <div className="bg-[#FFF8F0] rounded-xl p-4 shadow-sm border border-[#F5E6D3] flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                                {/* CMI */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-0.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Nb CMI</label>
                                        <input
                                            value={payments.nbCmi}
                                            readOnly={isDeclared}
                                            onChange={(e) => setPayments(prev => ({ ...prev, nbCmi: e.target.value }))}
                                            className={cn("w-full bg-white rounded-lg border-none h-8 px-2 font-bold text-slate-700 shadow-sm text-xs",
                                                isDeclared && "opacity-50 cursor-not-allowed bg-slate-100")}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-0.5 text-right">
                                        <label className="text-[9px] font-bold text-blue-500 uppercase">Mt CMI</label>
                                        <div className={cn("w-full border-b border-blue-200 pb-0.5", isDeclared && "border-slate-200")}>
                                            <input
                                                value={payments.mtCmi}
                                                readOnly={isDeclared}
                                                onChange={(e) => setPayments(prev => ({ ...prev, mtCmi: e.target.value }))}
                                                className={cn("w-full text-right bg-transparent border-none p-0 font-bold text-slate-700 focus:ring-0 font-mono text-sm",
                                                    isDeclared && "text-slate-500 cursor-not-allowed")}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* CHQ */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-0.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Nb CHQ</label>
                                        <input
                                            value={payments.nbChq}
                                            readOnly={isDeclared}
                                            onChange={(e) => setPayments(prev => ({ ...prev, nbChq: e.target.value }))}
                                            className={cn("w-full bg-white rounded-lg border-none h-8 px-2 font-bold text-slate-700 shadow-sm text-xs",
                                                isDeclared && "opacity-50 cursor-not-allowed bg-slate-100")}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-0.5 text-right">
                                        <label className="text-[9px] font-bold text-emerald-500 uppercase">Mt CHQ</label>
                                        <div className={cn("w-full border-b border-emerald-200 pb-0.5", isDeclared && "border-slate-200")}>
                                            <input
                                                value={payments.mtChq}
                                                readOnly={isDeclared}
                                                onChange={(e) => setPayments(prev => ({ ...prev, mtChq: e.target.value }))}
                                                className={cn("w-full text-right bg-transparent border-none p-0 font-bold text-slate-700 focus:ring-0 font-mono text-sm",
                                                    isDeclared && "text-slate-500 cursor-not-allowed")}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between items-end border-t border-[#E8DCC8] pt-3">
                                <span className="text-xs font-bold text-[#D4A674] uppercase tracking-wider">Espèces</span>
                                <span className={cn("text-xl font-bold tracking-tight font-mono", isDeclared ? "text-slate-400" : "text-slate-800")}>
                                    {valEsp.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* COL 3: Right (Hours & Glovo) - Span 4 */}
                    <div className="col-span-4 flex flex-col gap-3">

                        {/* Hours Inputs (Single Line, Split Fields) */}
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100/60 flex items-center justify-between gap-2">
                            {/* Open */}
                            <div className="flex items-center gap-1 flex-1 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100 justify-center">
                                {/* Sun Icon */}
                                <svg className="w-3.5 h-3.5 text-orange-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={hours.startH}
                                    onKeyDown={(e) => handleTimeKeyDown(e, 'startH', 24)}
                                    className="w-6 bg-transparent border-none p-0 font-mono font-bold text-slate-700 text-center text-sm cursor-pointer outline-none hover:bg-white/50 rounded"
                                />
                                <span className="text-slate-400 font-bold">:</span>
                                <input
                                    type="text"
                                    value={hours.startM}
                                    onKeyDown={(e) => handleTimeKeyDown(e, 'startM', 60)}
                                    className="w-6 bg-transparent border-none p-0 font-mono font-bold text-slate-700 text-center text-sm cursor-pointer outline-none hover:bg-white/50 rounded"
                                />
                            </div>

                            <div className="text-slate-300 font-bold">→</div>

                            {/* Close */}
                            <div className="flex items-center gap-1 flex-1 bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100 justify-center">
                                {/* Moon Icon */}
                                <svg className="w-3.5 h-3.5 text-indigo-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                                <input
                                    type="text"
                                    value={hours.endH}
                                    onKeyDown={(e) => handleTimeKeyDown(e, 'endH', 24)}
                                    className="w-6 bg-transparent border-none p-0 font-mono font-bold text-slate-700 text-center text-sm cursor-pointer outline-none hover:bg-white/50 rounded"
                                />
                                <span className="text-slate-400 font-bold">:</span>
                                <input
                                    type="text"
                                    value={hours.endM}
                                    onKeyDown={(e) => handleTimeKeyDown(e, 'endM', 60)}
                                    className="w-6 bg-transparent border-none p-0 font-mono font-bold text-slate-700 text-center text-sm cursor-pointer outline-none hover:bg-white/50 rounded"
                                />
                            </div>
                        </div>

                        {/* Glovo Block (Detailed) */}
                        <div className="bg-[#FFF9C4] rounded-xl p-4 flex-1 shadow-sm border border-[#F9E79F] relative overflow-hidden flex flex-col">
                            {/* Glovo Header */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-5 h-5 rounded-full bg-[#FFC107] flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-black">G</span>
                                </div>
                                <span className="font-serif font-bold text-[#5D4037] text-sm">GLOVO</span>
                            </div>

                            <div className="space-y-2 relative z-10 flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-[#8D6E63] uppercase">Brut</span>
                                    <input
                                        value={glovo.brut}
                                        readOnly={isDeclared}
                                        onChange={(e) => setGlovo(prev => ({ ...prev, brut: e.target.value }))}
                                        className={cn("w-20 h-7 bg-white/60 border-none rounded-md text-right font-bold text-[#5D4037] px-2 font-mono text-sm", isDeclared && "bg-white/30 opacity-60 cursor-not-allowed")}
                                    />
                                </div>

                                <div className="pl-3 space-y-1.5 border-l-2 border-[#FBC02D]/20 my-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-[#8D6E63]/70 uppercase">Brut Imp</span>
                                        <input
                                            value={glovo.brutImp}
                                            readOnly={isDeclared}
                                            onChange={(e) => setGlovo(prev => ({ ...prev, brutImp: e.target.value }))}
                                            className={cn("w-16 h-6 bg-white/40 border-none rounded text-right font-bold text-[#5D4037]/80 px-2 text-xs font-mono", isDeclared && "opacity-60 cursor-not-allowed")}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-[#8D6E63]/70 uppercase">Brut Exo</span>
                                        <input
                                            value={glovo.brutExo}
                                            readOnly={isDeclared}
                                            onChange={(e) => setGlovo(prev => ({ ...prev, brutExo: e.target.value }))}
                                            className={cn("w-16 h-6 bg-white/40 border-none rounded text-right font-bold text-[#5D4037]/80 px-2 text-xs font-mono", isDeclared && "opacity-60 cursor-not-allowed")}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-[10px] font-bold text-red-400 uppercase">Incid.</span>
                                    <input
                                        value={glovo.incid}
                                        readOnly={isDeclared}
                                        onChange={(e) => setGlovo(prev => ({ ...prev, incid: e.target.value }))}
                                        className={cn("w-20 h-7 bg-white/60 border-none rounded-md text-right font-bold text-red-500 px-2 font-mono text-sm", isDeclared && "bg-white/30 opacity-60 cursor-not-allowed")}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-[#8D6E63] uppercase">Cash</span>
                                    <input
                                        value={glovo.cash}
                                        readOnly={isDeclared}
                                        onChange={(e) => setGlovo(prev => ({ ...prev, cash: e.target.value }))}
                                        className={cn("w-20 h-7 bg-white/60 border-none rounded-md text-right font-bold text-[#5D4037] px-2 font-mono text-sm", isDeclared && "bg-white/30 opacity-60 cursor-not-allowed")}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between items-end border-t border-[#FBC02D]/20 pt-3">
                                <span className="text-xs font-bold text-[#795548] uppercase tracking-wider">Net</span>
                                <span className="text-xl font-bold text-[#3E2723] tracking-tight font-mono">{glovoNet.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
