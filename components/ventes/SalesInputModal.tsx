import { useState, useEffect, useRef, useCallback } from "react";
import { Check, X, Clock, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (data: any, isDraft: boolean, targetDate?: string) => void;
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

    // Refs for Focus Management
    const boulangerieRef = useRef<HTMLInputElement>(null);

    // Ref for Data State (Always Fresh for Escape Key)
    const formDataRef = useRef<any>({});

    // --- SYNCHRONOUS REF UPDATE HELPERS (Prevents Race Conditions) ---
    // These ensure formDataRef is updated INSTANTLY, even before React re-renders.

    const updateSales = (key: string, value: string) => {
        setSales(prev => {
            const next = { ...prev, [key]: value };
            formDataRef.current.sales = next; // SYNC UPDATE
            return next;
        });
    };

    const updateSupplements = (field: 'traiteurs' | 'caisse', value: string) => {
        setSupplements(prev => {
            const next = { ...prev, [field]: value };
            formDataRef.current.supplements = next; // SYNC UPDATE
            return next;
        });
    };

    const updatePayments = (field: keyof typeof payments, value: string) => {
        setPayments(prev => {
            const next = { ...prev, [field]: value };
            formDataRef.current.payments = next; // SYNC UPDATE
            return next;
        });
    };

    const updateSubTotal = (value: string) => {
        setSubTotalInput(value);
        formDataRef.current.subTotalInput = value; // SYNC UPDATE
    };

    const updateNbTickets = (value: string) => {
        setNbTickets(value);
        formDataRef.current.nbTickets = value; // SYNC UPDATE
    };

    const updateGlovo = (field: keyof typeof glovo, value: string) => {
        // Special logic for Brut is handled inside its specific handler below due to complexity
        setGlovo(prev => {
            const next = { ...prev, [field]: value };
            formDataRef.current.glovo = next; // SYNC UPDATE
            return next;
        });
    };

    const updateCoeffState = (type: 'exo' | 'imp', value: string) => {
        if (type === 'exo') {
            setCoeffExo(value);
            formDataRef.current.coeffExo = value; // SYNC UPDATE
        } else {
            setCoeffImp(value);
            formDataRef.current.coeffImp = value; // SYNC UPDATE
        }
    };

    const updateHours = (field: keyof typeof hours, value: string) => {
        setHours(prev => {
            const next = { ...prev, [field]: value };
            formDataRef.current.hours = next; // SYNC UPDATE
            return next;
        });
    };

    // --- CALCULATIONS (Moved up to be available for Ref) ---
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
    const glovoNet = ((parseFloat(glovo.brut) || 0) * 0.82) - (parseFloat(glovo.incid) || 0) - (parseFloat(glovo.cash) || 0);

    // Total HT
    const totalHT = valImpHT + valExo;

    // Total TTC
    const totalTTC = valExo + sumOthersTTC;

    // Remise
    const valRemise = totalTTC - manualSubTotal;

    // Derived Cash
    const valEsp = isDeclared
        ? (totalTTC - mtCmi - mtChq - (parseFloat(glovo.brut) || 0) + (parseFloat(glovo.cash) || 0))
        : ((manualSubTotal + totalSupplements) - mtCmi - mtChq);



    // Derived values for REF SYNC (Just to keep totals updated, but inputs are live)
    useEffect(() => {
        // We only need to sync the CALCULATED totals here, 
        // because inputs are now synced immediately in handlers.
        if (formDataRef.current) {
            formDataRef.current.calculated = {
                exo: valExo.toFixed(2),
                impHt: valImpHT.toFixed(2),
                totHt: totalHT.toFixed(2),
                ttc: totalTTC.toFixed(2),
                remise: valRemise.toFixed(2),
                esp: valEsp.toFixed(2),
                cmi: mtCmi.toFixed(2),
                chq: mtChq.toFixed(2),
                glovo: glovoNet.toFixed(2)
            };
            // Ensure inputs are also synced (fallback)
            formDataRef.current.sales = sales;
            formDataRef.current.payments = payments;
            formDataRef.current.supplements = supplements;
            formDataRef.current.glovo = glovo;
            formDataRef.current.hours = hours;
            formDataRef.current.subTotalInput = subTotalInput;
            formDataRef.current.nbTickets = nbTickets;
            formDataRef.current.coeffExo = coeffExo;
            formDataRef.current.coeffImp = coeffImp;
        }
    }); // Run on every render to ensure derived calcs are fresh

    // Auto-focus Boulangerie logic
    useEffect(() => {
        if (isOpen && !isDeclared) {
            // Small timeout to allow render/animation
            const timer = setTimeout(() => {
                boulangerieRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isDeclared]);

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
            setHours(initialData.hours || { startH: "07", startM: "00", endH: "20", endM: "00" });

            // IMMEDIATE REF FILL (Prevent Escape key race condition on fresh load)
            formDataRef.current = {
                sales: initialData.sales || {},
                supplements: initialData.supplements || { traiteurs: "", caisse: "" },
                payments: initialData.payments || { nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" },
                subTotalInput: initialData.subTotalInput || "",
                nbTickets: initialData.nbTickets || "",
                glovo: initialData.glovo || { brut: "", brutImp: "", brutExo: "", incid: "", cash: "" },
                hours: initialData.hours || { startH: "07", startM: "00", endH: "20", endM: "00" },
                coeffExo: initialData?.coeffExo || "1.11",
                coeffImp: initialData?.coeffImp || "0.60"
            };
        } else if (isOpen) {
            // Reset if new/empty
            setSales({});
            setSupplements({ traiteurs: "", caisse: "" });
            setPayments({ nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" });
            setSubTotalInput("");
            setNbTickets("");
            setGlovo({ brut: "", brutImp: "", brutExo: "", incid: "", cash: "" });
            setHours({ startH: "07", startM: "00", endH: "20", endM: "00" });

            // IMMEDIATE REF RESET
            formDataRef.current = {
                sales: {},
                supplements: { traiteurs: "", caisse: "" },
                payments: { nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" },
                subTotalInput: "",
                nbTickets: "",
                glovo: { brut: "", brutImp: "", brutExo: "", incid: "", cash: "" },
                hours: { startH: "07", startM: "00", endH: "20", endM: "00" },
                coeffExo: "1.11",
                coeffImp: "0.60"
            };
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
                const realGlovo = realData.glovo || { brut: "0", incid: "0", cash: "0" };
                const gBrut = parseFloat(realGlovo.brut) || 0;
                const gImp = (gBrut * 0.90) / 1.2;
                const gExo = gBrut * 0.10;

                const declaredGlovo = {
                    ...realGlovo,
                    brutImp: gImp.toFixed(2),
                    brutExo: gExo.toFixed(2)
                };
                setGlovo(declaredGlovo);
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

            setHours(prev => {
                const next = { ...prev, [field]: String(val).padStart(2, '0') };
                formDataRef.current.hours = next; // SYNC UPDATE
                return next;
            });
        }
    };

    // Helper for Coeff Arrow Keys & Buttons
    const updateCoeff = (field: 'exo' | 'imp', direction: 'up' | 'down') => {
        const step = 0.01; // Updated to 0.01 per request
        if (field === 'exo') {
            const val = parseFloat(coeffExo) || 0;
            const newVal = val + (direction === 'up' ? step : -step);
            setCoeffExo(newVal.toFixed(2));
            formDataRef.current.coeffExo = newVal.toFixed(2); // SYNC UPDATE
        } else {
            const val = parseFloat(coeffImp) || 0;
            const newVal = val + (direction === 'up' ? step : -step);
            setCoeffImp(newVal.toFixed(2));
            formDataRef.current.coeffImp = newVal.toFixed(2); // SYNC UPDATE
        }
    };

    const handleCoeffKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'exo' | 'imp') => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            updateCoeff(field, e.key === "ArrowUp" ? 'up' : 'down');
        }
    };



    const handleSave = useCallback((isDraft: boolean = false, targetDate?: string) => { // Updated sig
        const currentData = formDataRef.current; // READ FROM REF
        if (onSave && currentData) {
            // ROBUST CALCULATION (Don't rely on useEffect)
            const dSales = currentData.sales || {};
            const dSupp = currentData.supplements || { traiteurs: "0", caisse: "0" };
            const dPay = currentData.payments || { nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" };
            const dGlovo = currentData.glovo || { brut: "0", incid: "0", cash: "0" };
            const dSubTotal = parseFloat(currentData.subTotalInput) || 0;

            // 1. Exonéré
            const cValExo = parseFloat(dSales["BOULANGERIE"] || "0");

            // 2. Imposable HT
            let cSumOthersTTC = 0;
            Object.entries(dSales).forEach(([key, val]) => {
                if (key !== "BOULANGERIE") {
                    cSumOthersTTC += parseFloat(val as string) || 0;
                }
            });
            const cValImpHT = cSumOthersTTC / 1.2;

            // 3. Totals
            const cTotalHT = cValImpHT + cValExo;
            const cTotalTTC = cValExo + cSumOthersTTC;
            const cValRemise = cTotalTTC - dSubTotal;

            // 4. Glovo Net
            const cGlovoNet = ((parseFloat(dGlovo.brut) || 0) * 0.82) - (parseFloat(dGlovo.incid) || 0) - (parseFloat(dGlovo.cash) || 0);

            // 5. Espèces & Supplements
            const cTotalSupp = (parseFloat(dSupp.traiteurs) || 0) + (parseFloat(dSupp.caisse) || 0);
            const cMtCmi = parseFloat(dPay.mtCmi) || 0;
            const cMtChq = parseFloat(dPay.mtChq) || 0;

            const cValEsp = isDeclared
                ? (cTotalTTC - cMtCmi - cMtChq - (parseFloat(dGlovo.brut) || 0) + (parseFloat(dGlovo.cash) || 0))
                : ((dSubTotal + cTotalSupp) - cMtCmi - cMtChq);

            const freshCalculated = {
                exo: cValExo.toFixed(2),
                impHt: cValImpHT.toFixed(2),
                totHt: cTotalHT.toFixed(2),
                ttc: cTotalTTC.toFixed(2),
                remise: cValRemise.toFixed(2),
                esp: cValEsp.toFixed(2),
                cmi: cMtCmi.toFixed(2),
                chq: cMtChq.toFixed(2),
                glovo: cGlovoNet.toFixed(2)
            };

            onSave({
                sales: currentData.sales,
                supplements: currentData.supplements,
                payments: currentData.payments,
                subTotalInput: currentData.subTotalInput,
                nbTickets: currentData.nbTickets,
                glovo: currentData.glovo,
                hours: currentData.hours,
                coeffExo: currentData.coeffExo,
                coeffImp: currentData.coeffImp,
                calculated: freshCalculated // PASS FRESH CALCS
            }, isDraft, targetDate || date);
        }
        onClose();
    }, [onSave, onClose, date, isDeclared]);

    // Keyboard Handlers (Escape to Save & Close) - Moved here to access handleSave


    const formattedDate = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
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
                            initialData?.status === 'synced' ? (
                                // SYNCHRONISE STATE (Green Badge)
                                <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest leading-none mb-0.5">Synchronisé</span>
                                        <span className="text-[10px] font-mono font-bold text-white leading-none">
                                            {initialData?.lastSyncAt ? new Date(initialData.lastSyncAt).toLocaleString('fr-FR', {
                                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                            }) : "--"}
                                        </span>
                                    </div>
                                    <Check className="w-4 h-4 text-green-400" />
                                </div>
                            ) : (
                                // PRET STATE (Orange Action Button)
                                <button
                                    onClick={() => handleSave(false)}
                                    className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-orange-400/50 rounded-xl px-4 py-2 transition-all duration-300"
                                >
                                    <span className="text-sm font-bold text-orange-400 uppercase tracking-widest group-hover:text-orange-300 transition-colors">Prêt</span>
                                    <div className="relative">
                                        <RefreshCw className="w-5 h-5 text-orange-400 group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
                                        <div className="absolute inset-0 bg-orange-400/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>
                            )
                        )}

                        {/* NO X BUTTON HERE anymore - Moved to Bottom Footer */}
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
                                                    ref={fam === "BOULANGERIE" ? boulangerieRef : null}
                                                    type="text"
                                                    value={sales[fam] || ""}
                                                    readOnly={isDeclared} // READ ONLY IN DECLARED
                                                    className={cn(
                                                        "w-full text-right bg-transparent focus:outline-none font-bold text-xs py-0.5 font-mono",
                                                        isDeclared ? "text-slate-500 cursor-not-allowed" : "text-slate-800"
                                                    )}
                                                    placeholder="-"
                                                    onChange={(e) => updateSales(fam, e.target.value)}
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

                        {/* Subtotal Display, Remise & Nb Tickets (MOVED UP) */}
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
                                            onChange={(e) => updateSubTotal(e.target.value)}
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
                                    onChange={(e) => updateNbTickets(e.target.value)}
                                    className={cn("w-12 border-none rounded text-center text-sm font-bold focus:ring-1 h-7 font-mono",
                                        isDeclared ? "bg-white/5 text-slate-300 cursor-not-allowed focus:ring-0" : "bg-white/10 text-white focus:ring-white/30"
                                    )}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Supplements OR Coefficients (MOVED DOWN) */}
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
                                                onChange={(e) => updateCoeffState('exo', e.target.value)}
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
                                                onChange={(e) => updateCoeffState('imp', e.target.value)}
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
                                            onChange={(e) => updateSupplements('traiteurs', e.target.value)}
                                            className="w-20 text-right bg-slate-50 rounded-md border-none focus:ring-1 focus:ring-indigo-200 text-xs font-bold text-slate-700 py-1 px-2 font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supp Caisse</span>
                                        <input
                                            type="text"
                                            value={supplements.caisse}
                                            onChange={(e) => updateSupplements('caisse', e.target.value)}
                                            className="w-20 text-right bg-slate-50 rounded-md border-none focus:ring-1 focus:ring-indigo-200 text-xs font-bold text-slate-700 py-1 px-2 font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </>
                            )}
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
                                    onChange={(e) => updateHours('startH', e.target.value)}
                                    onKeyDown={(e) => handleTimeKeyDown(e, 'startH', 24)}
                                    className="w-6 bg-transparent border-none p-0 font-mono font-bold text-slate-700 text-center text-sm cursor-pointer outline-none hover:bg-white/50 rounded"
                                />
                                <span className="text-slate-400 font-bold">:</span>
                                <input
                                    type="text"
                                    value={hours.startM}
                                    onChange={(e) => updateHours('startM', e.target.value)}
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
                                    onChange={(e) => updateHours('endH', e.target.value)}
                                    onKeyDown={(e) => handleTimeKeyDown(e, 'endH', 24)}
                                    className="w-6 bg-transparent border-none p-0 font-mono font-bold text-slate-700 text-center text-sm cursor-pointer outline-none hover:bg-white/50 rounded"
                                />
                                <span className="text-slate-400 font-bold">:</span>
                                <input
                                    type="text"
                                    value={hours.endM}
                                    onChange={(e) => updateHours('endM', e.target.value)}
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
                                        onChange={(e) => {
                                            const valStr = e.target.value;
                                            const val = parseFloat(valStr) || 0;
                                            // Auto-calc Breakdown (90% Imp HT, 10% Exo)
                                            const imp = (val * 0.90) / 1.2;
                                            const exo = val * 0.10;

                                            setGlovo(prev => {
                                                const next = {
                                                    ...prev,
                                                    brut: valStr,
                                                    brutImp: imp.toFixed(2),
                                                    brutExo: exo.toFixed(2)
                                                };
                                                formDataRef.current.glovo = next; // SYNC UPDATE
                                                return next;
                                            });
                                        }}
                                        className={cn("w-20 h-7 bg-white/60 border-none rounded-md text-right font-bold text-[#5D4037] px-2 font-mono text-sm", isDeclared && "bg-white/30 opacity-60 cursor-not-allowed")}
                                    />
                                </div>

                                <div className="pl-3 space-y-1.5 border-l-2 border-[#FBC02D]/20 my-1.5">
                                    {/* Side-by-Side Layout for Imp/Exo */}
                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#F9E79F]/50">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-[#8D6E63] uppercase opacity-70">Imp. HT (90%)</span>
                                            <input
                                                value={glovo.brutImp}
                                                tabIndex={-1} // NO TAB
                                                readOnly={true} // Always Read Only (Calculated)
                                                className={cn("w-full h-6 bg-white/40 border-none rounded text-right font-bold text-[#5D4037]/80 px-2 text-xs font-mono", "opacity-80 cursor-not-allowed")}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-[#8D6E63] uppercase opacity-70">Exo (10%)</span>
                                            <input
                                                value={glovo.brutExo}
                                                tabIndex={-1} // NO TAB
                                                readOnly={true} // Always Read Only (Calculated)
                                                className={cn("w-full h-6 bg-white/40 border-none rounded text-right font-bold text-[#5D4037]/80 px-2 text-xs font-mono", "opacity-80 cursor-not-allowed")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-[10px] font-bold text-red-400 uppercase">Incid.</span>
                                    <input
                                        value={glovo.incid}
                                        readOnly={isDeclared}
                                        onChange={(e) => updateGlovo('incid', e.target.value)}
                                        className={cn("w-20 h-7 bg-white/60 border-none rounded-md text-right font-bold text-red-500 px-2 font-mono text-sm", isDeclared && "bg-white/30 opacity-60 cursor-not-allowed")}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-[#8D6E63] uppercase">Cash</span>
                                    <input
                                        value={glovo.cash}
                                        readOnly={isDeclared}
                                        onChange={(e) => updateGlovo('cash', e.target.value)}
                                        className={cn("w-20 h-7 bg-white/60 border-none rounded-md text-right font-bold text-[#5D4037] px-2 font-mono text-sm", isDeclared && "bg-white/30 opacity-60 cursor-not-allowed")}
                                    />
                                </div>
                            </div>

                            {/* Compact Net Display */}
                            <div className="flex justify-between items-end border-t border-[#FBC02D]/20 pt-1 mt-1">
                                <span className="text-xs font-bold text-[#795548] uppercase tracking-wider">Net</span>
                                <span className="text-xl font-bold text-[#3E2723] tracking-tight font-mono">{glovoNet.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        {/* EXPLICIT CLOSE BUTTON (Outside, Tall, Bottom Aligned) */}
                        <button
                            onClick={() => handleSave(true)}
                            className={cn(
                                "w-full h-20 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 outline-none group mt-auto",
                                headerColor,
                                "hover:brightness-110 active:brightness-90 opacity-90 hover:opacity-100"
                            )}
                            title="Enregistrer et Fermer"
                        >
                            <X className="w-8 h-8 text-orange-400 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="font-bold uppercase tracking-widest text-lg text-orange-400">Fermer</span>
                        </button>

                    </div>

                </div>

            </div>
        </div>

    );
}
