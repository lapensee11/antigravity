import { useState, useEffect, useRef, useCallback } from "react";
import { Check, X, Clock, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";
import { cn, formatFr, parseFrInput } from "@/lib/utils";
import { Partner } from "@/lib/types";

interface SalesInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (data: any, isDraft: boolean, targetDate?: string) => void;
    date: string;
    isDeclared?: boolean;

    initialData?: any;
    realData?: any;
    partners: Partner[];
    lastRates?: { commHT: string; commTTC: string; imp: string; exo: string }; // NEW PROP
}

// Grouped Families for Declaré
const FAMILY_GROUPS = [
    { name: "Group 1", items: ["BOULANGERIE", "CROIS.", "VIEN."] },
    { name: "Group 2", items: ["PAT INDIVID.", "PAT ENTRE."] },
    { name: "Group 3", items: ["FOURS SECS", "BELDI", "PRÉ-EMB."] },
    { name: "Group 4", items: ["SALÉS", "CONFISERIE"] },
    { name: "Group 5", items: ["PAIN SG", "GÂTEAUX SG"] },
];

export function SalesInputModal({ isOpen, onClose, onSave, date, isDeclared, initialData, realData, partners, lastRates }: SalesInputModalProps) {
    const isModalDeclared = isDeclared;
    // Glovo Partner Config
    // PARTNER LOGIC REMOVED - FULLY AUTONOMOUS
    // DEFAULTS: HT=15, Imp=90, Exo=10. TTC Calculated (HT*1.2)
    const initialGlovo = initialData?.glovo || {};
    const hasData = !!initialData?.glovo?.brut;
    const hasSnapshot = !!initialGlovo.usageCommissionTTC;

    // Hardcoded Defaults (Ultimate Fallback)
    const DEFAULT_HT = "15";
    const DEFAULT_IMP = "90";
    const DEFAULT_EXO = "10";
    const DEFAULT_TTC = (parseFloat(DEFAULT_HT) * 1.2).toFixed(2); // 18.00

    // NEW LOGIC: Use lastRates if available (Smart Default) for NEW entries
    // Fallback to Hardcoded if no lastRates.
    let defaultCommHT = lastRates?.commHT || DEFAULT_HT;
    let defaultCommTTC = lastRates?.commTTC || DEFAULT_TTC;
    let defaultImp = lastRates?.imp || DEFAULT_IMP;
    let defaultExo = lastRates?.exo || DEFAULT_EXO;

    if (hasData && !hasSnapshot) {
        // LEGACY ENTRY (Data exists but No Snapshot): Force STATIC Historic Defaults
        // Ignore smart defaults to protect history.
        defaultCommHT = "15";
        defaultCommTTC = "18";
        defaultImp = "90";
        defaultExo = "10";
    }

    const resolveRateRobust = (valStr: string | undefined, fallback: string) => {
        let val = parseFloat(valStr || fallback);
        // Robustness: Handle 0.15 vs 15
        if (val > 0 && val < 1) val = val * 100;
        return val;
    };

    let startCommHT = resolveRateRobust(initialGlovo.usageCommissionHT, defaultCommHT);
    let startCommTTC = resolveRateRobust(initialGlovo.usageCommissionTTC, defaultCommTTC);
    let startImp = resolveRateRobust(initialGlovo.usageTaxablePercentage, defaultImp);
    let startExo = resolveRateRobust(initialGlovo.usageExoneratedPercentage, defaultExo);

    // Safety: If snapshot has TTC but no HT (legacy), reverse calc HT?
    // Or just rely on defaults. 
    // If we have legacy TTC=18 but no HT, we set HT = 18/1.2 = 15.
    if (!initialGlovo.usageCommissionHT && initialGlovo.usageCommissionTTC) {
        startCommHT = startCommTTC / 1.2;
    }

    // Initial State
    const [rates, setRates] = useState({
        commHT: startCommHT.toString(),
        commTTC: (startCommHT * 1.2).toFixed(2), // Always drive TTC by HT
        imp: startImp.toString(),
        exo: startExo.toString()
    });

    const commTTC = parseFloat(rates.commTTC) / 100;
    const pImp = parseFloat(rates.imp) / 100;
    const pExo = parseFloat(rates.exo) / 100;


    // Header Color Logic
    const headerColor = isModalDeclared ? "bg-[#451a03]" : "bg-[#1E293B]";
    const buttonColor = isModalDeclared ? "bg-purple-600 hover:bg-purple-500" : "bg-emerald-500 hover:bg-emerald-400";

    // Form State
    const [sales, setSales] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState("");
    const [supplements, setSupplements] = useState({ traiteurs: "", caisse: "" });
    const [payments, setPayments] = useState({ nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" });
    const [subTotalInput, setSubTotalInput] = useState(""); // Manual Subtotal
    const [nbTickets, setNbTickets] = useState("");
    const [glovo, setGlovo] = useState({
        brut: "", brutImp: "", brutExo: "", incid: "", cash: "",
        usageCommissionTTC: "", usageTaxablePercentage: "", usageExoneratedPercentage: ""
    });

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
    /** Quand un champ numérique a le focus, on affiche la valeur brute pour la saisie ; sinon on affiche formatFr (séparateur de milliers + virgule, 2 décimales). */
    const [focusedNumericField, setFocusedNumericField] = useState<string | null>(null);

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

    const updateNotes = (value: string) => {
        setNotes(value);
        formDataRef.current.notes = value; // SYNC UPDATE
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
    const glovoNet = ((parseFloat(glovo.brut) || 0) * (1 - commTTC)) - (parseFloat(glovo.incid) || 0) - (parseFloat(glovo.cash) || 0);

    // Total HT (Remains based on sum of categories)
    const totalHT = valImpHT + valExo;

    // Theoretical TTC (Sum of categories)
    const theoreticalTTC = valExo + sumOthersTTC;

    // Total TTC (Display/Saved - New formula for Real: SubTotal + Supps)
    const totalTTC = isDeclared
        ? theoreticalTTC
        : (manualSubTotal + totalSupplements);

    // Remise (Calculated from Theoretical sum vs manual input)
    const valRemise = theoreticalTTC - manualSubTotal;

    // Derived Cash
    const valEsp = isDeclared
        ? (totalTTC - mtCmi - mtChq - (parseFloat(glovo.brut) || 0) + (parseFloat(glovo.cash) || 0))
        : (totalTTC - mtCmi - mtChq);



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
            // Sync inputs to ref (backwards compatibility for save)
            formDataRef.current.sales = sales;
            formDataRef.current.payments = payments;
            formDataRef.current.notes = notes;
            formDataRef.current.supplements = supplements;
            formDataRef.current.glovo = glovo;
            formDataRef.current.hours = hours;
            formDataRef.current.subTotalInput = subTotalInput;
            formDataRef.current.nbTickets = nbTickets;
            formDataRef.current.coeffExo = coeffExo;
            formDataRef.current.coeffImp = coeffImp;
        }
    }, [sales, notes, payments, supplements, glovo, hours, subTotalInput, nbTickets, coeffExo, coeffImp, valExo, valImpHT, totalHT, totalTTC, valRemise, valEsp, mtCmi, mtChq, glovoNet]);

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

    // Load initial data (ONLY ON OPEN OR DATE CHANGE)
    const prevOpenRef = useRef(false);
    const prevDateRef = useRef(date);

    useEffect(() => {
        const isOpening = isOpen && !prevOpenRef.current;
        const isDateChanging = date !== prevDateRef.current;

        if (isOpening || isDateChanging) {
            if (initialData) {
                setSales(initialData.sales || {});
                setNotes(initialData.notes || "");
                setSupplements(initialData.supplements || { traiteurs: "", caisse: "" });
                setPayments(initialData.payments || { nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" });
                setSubTotalInput(initialData.subTotalInput || "");
                setNbTickets(initialData.nbTickets || "");
                // Reset Local Rates State
                const iGlovo = initialData.glovo || {};
                const hData = !!iGlovo.brut;
                const hSnap = !!iGlovo.usageCommissionTTC;

                // DEFAULTS CONSTANTS
                const DEF_HT = 15;
                const DEF_IMP = 90;
                const DEF_EXO = 10;

                let rCommHT = DEF_HT.toString();
                let rImp = DEF_IMP.toString();
                let rExo = DEF_EXO.toString();

                if (!hData) {
                    // NEW/EMPTY: Use Smart Default (lastRates)
                    rCommHT = lastRates?.commHT || DEF_HT.toString();
                    rImp = lastRates?.imp || DEF_IMP.toString();
                    rExo = lastRates?.exo || DEF_EXO.toString();
                } else if (!hSnap) {
                    // Legacy: Force Historic
                    rCommHT = "15"; rImp = "90"; rExo = "10";
                } else {
                    // Snapshot: Use Stored
                    const resolveRateRobust = (valStr: string | undefined, fallback: number) => {
                        let val = parseFloat(valStr || fallback.toString());
                        if (val > 0 && val < 1) val = val * 100;
                        return val.toString();
                    };
                    rCommHT = resolveRateRobust(iGlovo.usageCommissionHT, DEF_HT);
                    rImp = resolveRateRobust(iGlovo.usageTaxablePercentage, DEF_IMP);
                    rExo = resolveRateRobust(iGlovo.usageExoneratedPercentage, DEF_EXO);
                }

                // Calc TTC from HT
                const rCommTTC = lastRates?.commTTC && !hData ? lastRates.commTTC : (parseFloat(rCommHT) * 1.2).toFixed(2);

                setRates({ commHT: rCommHT?.toString(), commTTC: rCommTTC?.toString(), imp: rImp?.toString(), exo: rExo?.toString() });

                setGlovo(initialData.glovo || {
                    brut: "", brutImp: "", brutExo: "", incid: "", cash: "",
                    usageCommissionHT: rCommHT, usageCommissionTTC: rCommTTC, usageTaxablePercentage: rImp, usageExoneratedPercentage: rExo
                });
                setHours(initialData.hours || { startH: "07", startM: "00", endH: "20", endM: "00" });
                setCoeffExo(initialData?.coeffExo || "1.11");
                setCoeffImp(initialData?.coeffImp || "0.60");

                formDataRef.current = {
                    sales: initialData.sales || {},
                    notes: initialData.notes || "",
                    supplements: initialData.supplements || { traiteurs: "", caisse: "" },
                    payments: initialData.payments || { nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" },
                    subTotalInput: initialData.subTotalInput || "",
                    nbTickets: initialData.nbTickets || "",
                    glovo: initialData.glovo || {
                        brut: "", brutImp: "", brutExo: "", incid: "", cash: "",
                        usageCommissionHT: initialData.glovo?.usageCommissionHT || rCommHT,
                        usageCommissionTTC: initialData.glovo?.usageCommissionTTC || rCommTTC,
                        usageTaxablePercentage: initialData.glovo?.usageTaxablePercentage || rImp,
                        usageExoneratedPercentage: initialData.glovo?.usageExoneratedPercentage || rExo
                    },
                    hours: initialData.hours || { startH: "07", startM: "00", endH: "20", endM: "00" },
                    coeffExo: initialData?.coeffExo || "1.11",
                    coeffImp: initialData?.coeffImp || "0.60"
                };
            } else {
                // Reset if new/empty
                setSales({});
                setSupplements({ traiteurs: "", caisse: "" });
                setPayments({ nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" });
                setSubTotalInput("");
                setNbTickets("");
                setGlovo({
                    brut: "", brutImp: "", brutExo: "", incid: "", cash: "",
                    usageCommissionTTC: "", usageTaxablePercentage: "", usageExoneratedPercentage: ""
                });
                setHours({ startH: "07", startM: "00", endH: "20", endM: "00" });
                setCoeffExo("1.11");
                setCoeffImp("0.60");

                formDataRef.current = {
                    sales: {},
                    notes: "",
                    supplements: { traiteurs: "", caisse: "" },
                    payments: { nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" },
                    subTotalInput: "",
                    nbTickets: "",
                    glovo: {
                        brut: "", brutImp: "", brutExo: "", incid: "", cash: "",
                        usageCommissionHT: "", usageCommissionTTC: "", usageTaxablePercentage: "", usageExoneratedPercentage: ""
                    },
                    hours: { startH: "07", startM: "00", endH: "20", endM: "00" },
                    coeffExo: "1.11",
                    coeffImp: "0.60"
                };
            }
        }
        prevOpenRef.current = isOpen;
        prevDateRef.current = date;
    }, [isOpen, date, initialData]);



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

                const declaredGlovo = {
                    ...realGlovo,
                    brutImp: (gBrut * pImp / 1.2).toFixed(2),
                    brutExo: (gBrut * pExo).toFixed(2)
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
            // 2. Parse Inputs
            const dSales = currentData.sales || {};
            const dSupp = currentData.supplements || { traiteurs: "0", caisse: "0" };
            const dPay = currentData.payments || { nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" };
            const dGlovo = currentData.glovo || { brut: "0", incid: "0", cash: "0" };
            const dSubTotal = parseFloat(currentData.subTotalInput) || 0;

            const cValExo = parseFloat(dSales["BOULANGERIE"] || "0");
            const cTotalSupp = (parseFloat(dSupp.traiteurs) || 0) + (parseFloat(dSupp.caisse) || 0);
            const cMtCmi = parseFloat(dPay.mtCmi) || 0;
            const cMtChq = parseFloat(dPay.mtChq) || 0;

            // 3. Totals
            let cSumOthersTTC = 0;
            Object.entries(dSales).forEach(([key, val]) => {
                if (key !== "BOULANGERIE") {
                    cSumOthersTTC += parseFloat(val as string) || 0;
                }
            });
            const cValImpHT = cSumOthersTTC / 1.2;

            const cTheoreticalTTC = cValExo + cSumOthersTTC;
            const cTotalHT = cValImpHT + cValExo;
            const cTotalTTC = isDeclared ? cTheoreticalTTC : (dSubTotal + cTotalSupp);
            const cValRemise = cTheoreticalTTC - dSubTotal;

            // 4. Glovo Net
            const cGlovoNet = ((parseFloat(dGlovo.brut) || 0) * (1 - commTTC)) - (parseFloat(dGlovo.incid) || 0) - (parseFloat(dGlovo.cash) || 0);

            // 5. Espèces (Unified Formula: TTC - CMI - Chq - GlovoBrut + GlovoCash)
            const cValEsp = cTotalTTC - cMtCmi - cMtChq - (parseFloat(dGlovo.brut) || 0) + (parseFloat(dGlovo.cash) || 0);

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
                notes: currentData.notes || "",
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
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
        >
            {/* Backdrop - Save & close like the Fermer button */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in cursor-pointer"
                onClick={() => handleSave(initialData?.status !== 'synced')}
            />

            {/* Modal Card - Outfit pour Saisie (Réel) et Déclaré */}
            <div 
                className={cn(
                    "relative z-10 w-full max-w-[1100px] bg-[#FDFBF7] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]",
                    isModalDeclared && "border-2 border-[#451a03]"
                )}
                style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
                onClick={(e) => e.stopPropagation()}
            >

                {/* 1. Header */}
                <div className={cn("px-8 py-4 flex justify-between items-center text-white flex-shrink-0", headerColor)}>
                    <h2 className="text-[21px] font-bold italic tracking-wide">{capitalizedDate}</h2>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] uppercase tracking-widest font-bold opacity-60">Total HT</span>
                            <span className="text-[21px] font-bold tracking-tight">{formatFr(totalHT)} Dh</span>
                        </div>
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-[11px] uppercase tracking-widest font-bold opacity-60">Total TTC</span>
                            <span className="text-[21px] font-bold tracking-tight">{formatFr(totalTTC)} Dh</span>
                        </div>

                        {/* Last Sync Display */}
                        {initialData?.lastSyncAt && (
                            <div className="flex flex-col items-end mr-6 opacity-80">
                                <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">Synchronisé le</span>
                                <span className="text-[13px] font-bold">
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
                                // SYNCHRONISE STATE (Green Action Button)
                                <button
                                    onClick={() => handleSave(false)}
                                    className="group flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 hover:border-green-400 rounded-lg px-3 py-1.5 backdrop-blur-sm transition-all active:scale-95"
                                    title="Re-synchroniser"
                                >
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest leading-none mb-0.5">Synchronisé</span>
                                        <span className="text-[11px] font-bold text-white leading-none">
                                            {initialData?.lastSyncAt ? new Date(initialData.lastSyncAt).toLocaleString('fr-FR', {
                                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                            }) : "--"}
                                        </span>
                                    </div>
                                    <RefreshCw className="w-4 h-4 text-green-400 group-hover:rotate-180 transition-transform duration-500" />
                                </button>
                            ) : (
                                // PRET STATE (Orange Action Button)
                                <button
                                    onClick={() => handleSave(false)}
                                    className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-orange-400/50 rounded-xl px-4 py-2 transition-all duration-300"
                                >
                                    <span className="text-[15px] font-bold text-orange-400 uppercase tracking-widest group-hover:text-orange-300 transition-colors">Prêt</span>
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
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-700 transition-colors w-1/2 truncate leading-tight">
                                                {fam}
                                            </span>
                                            <div className="w-1/2 border-b border-slate-100 group-hover:border-slate-300 transition-colors relative">
                                                <input
                                                    ref={fam === "BOULANGERIE" ? boulangerieRef : null}
                                                    type="text"
                                                    value={focusedNumericField === `sales_${fam}` ? (sales[fam] ?? "") : (sales[fam] ? formatFr(sales[fam]) : "")}
                                                    readOnly={isDeclared} // READ ONLY IN DECLARED
                                                    className={cn(
                                                        "w-full text-right bg-transparent focus:outline-none font-bold text-[13px] py-0.5",
                                                        isDeclared ? "text-slate-500 cursor-not-allowed" : "text-slate-800"
                                                    )}
                                                    placeholder="-"
                                                    onFocus={() => setFocusedNumericField(`sales_${fam}`)}
                                                    onBlur={() => setFocusedNumericField(null)}
                                                    onChange={(e) => updateSales(fam, parseFrInput(e.target.value))}
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
                                    <span className="text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-0.5">Total TTC (D)</span>
                                    <span className="text-[25px] font-bold tracking-tight leading-none text-white">
                                        {formatFr(totalTTC)}
                                    </span>
                                </div>
                            ) : (
                                // REAL: Show SubTotal/Remise
                                <>
                                    <div className="flex flex-col flex-1">
                                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Sous-Total (Saisi)</span>
                                        <input
                                            type="text"
                                            value={focusedNumericField === "subTotal" ? subTotalInput : (subTotalInput ? formatFr(subTotalInput) : "")}
                                            onChange={(e) => updateSubTotal(parseFrInput(e.target.value))}
                                            onFocus={() => setFocusedNumericField("subTotal")}
                                            onBlur={() => setFocusedNumericField(null)}
                                            className="bg-transparent border-none p-0 text-[19px] font-bold tracking-tight leading-none text-white focus:ring-0 placeholder:text-white/20 w-full"
                                            placeholder="0,00"
                                        />
                                    </div>

                                    <div className="flex flex-col flex-1 border-l border-white/10 pl-4">
                                        <span className="text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-0.5">Remise (Calc)</span>
                                        <span className="text-[19px] font-bold tracking-tight leading-none text-orange-400">
                                            {formatFr(valRemise)}
                                        </span>
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col items-end border-l border-white/20 pl-4">
                                <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", isDeclared && "text-slate-400")}>Nb Tickets</span>
                                <input
                                    value={focusedNumericField === "nbTickets" ? nbTickets : (nbTickets ? formatFr(nbTickets, 0) : "")}
                                    readOnly={isDeclared}
                                    onFocus={() => setFocusedNumericField("nbTickets")}
                                    onBlur={() => setFocusedNumericField(null)}
                                    onChange={(e) => updateNbTickets(parseFrInput(e.target.value))}
                                    className={cn("w-12 border-none rounded text-center text-[15px] font-bold focus:ring-1 h-7",
                                        isDeclared ? "bg-white/5 text-slate-300 cursor-not-allowed focus:ring-0" : "bg-white/10 text-white focus:ring-white/30"
                                    )}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Notes Field - Separate Element */}
                        {!isDeclared && (
                            <div className="bg-white rounded-xl p-2 shadow-sm border border-slate-100/60 transition-all duration-300">
                                <textarea
                                    value={notes}
                                    onChange={(e) => updateNotes(e.target.value)}
                                    className="w-full bg-slate-50 rounded-md border-none focus:ring-1 focus:ring-indigo-200 text-[13px] font-medium text-slate-700 py-1.5 px-2 resize-none"
                                    placeholder="Notes..."
                                    rows={1}
                                />
                            </div>
                        )}

                        {/* Supplements OR Coefficients (MOVED DOWN) */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100/60 transition-all duration-300">
                            {isDeclared ? (
                                // COEFFICIENTS UI - Single Line Elegance with Arrows
                                <div className="flex items-center justify-between gap-4 h-full">
                                    {/* Exo */}
                                    <div className="flex-1 flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider pl-1">Coeff Exo</span>
                                        <div className="relative flex items-center bg-purple-50/50 rounded-lg border border-purple-100 p-1 group hover:border-purple-300 transition-colors">
                                            <input
                                                type="text"
                                                value={focusedNumericField === "coeffExo" ? coeffExo : (coeffExo ? formatFr(coeffExo) : "")}
                                                onFocus={() => setFocusedNumericField("coeffExo")}
                                                onBlur={() => setFocusedNumericField(null)}
                                                onChange={(e) => updateCoeffState('exo', parseFrInput(e.target.value))}
                                                onKeyDown={(e) => handleCoeffKeyDown(e, 'exo')}
                                                className="w-full bg-transparent border-none text-center font-bold text-[21px] text-purple-700 p-0 focus:ring-0"
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
                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider pl-1">Coeff Imp</span>
                                        <div className="relative flex items-center bg-purple-50/50 rounded-lg border border-purple-100 p-1 group hover:border-purple-300 transition-colors">
                                            <input
                                                type="text"
                                                value={focusedNumericField === "coeffImp" ? coeffImp : (coeffImp ? formatFr(coeffImp) : "")}
                                                onFocus={() => setFocusedNumericField("coeffImp")}
                                                onBlur={() => setFocusedNumericField(null)}
                                                onChange={(e) => updateCoeffState('imp', parseFrInput(e.target.value))}
                                                onKeyDown={(e) => handleCoeffKeyDown(e, 'imp')}
                                                className="w-full bg-transparent border-none text-center font-bold text-[21px] text-purple-700 p-0 focus:ring-0"
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
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supp Traiteurs</span>
                                        <input
                                            type="text"
                                            value={focusedNumericField === "supp_traiteurs" ? supplements.traiteurs : (supplements.traiteurs ? formatFr(supplements.traiteurs) : "")}
                                            onChange={(e) => updateSupplements('traiteurs', parseFrInput(e.target.value))}
                                            onFocus={() => setFocusedNumericField("supp_traiteurs")}
                                            onBlur={() => setFocusedNumericField(null)}
                                            className="w-20 text-right bg-slate-50 rounded-md border-none focus:ring-1 focus:ring-indigo-200 text-[13px] font-bold text-slate-700 py-1 px-2"
                                            placeholder="0,00"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supp Caisse</span>
                                        <input
                                            type="text"
                                            value={focusedNumericField === "supp_caisse" ? supplements.caisse : (supplements.caisse ? formatFr(supplements.caisse) : "")}
                                            onChange={(e) => updateSupplements('caisse', parseFrInput(e.target.value))}
                                            onFocus={() => setFocusedNumericField("supp_caisse")}
                                            onBlur={() => setFocusedNumericField(null)}
                                            className="w-20 text-right bg-slate-50 rounded-md border-none focus:ring-1 focus:ring-indigo-200 text-[13px] font-bold text-slate-700 py-1 px-2"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payments Block */}
                        <div className="bg-[#FFF8F0] rounded-xl p-4 shadow-sm border border-[#F5E6D3] flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                                {/* CMI */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-0.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nb CMI</label>
                                        <input
                                            value={focusedNumericField === "nbCmi" ? payments.nbCmi : (payments.nbCmi ? formatFr(payments.nbCmi, 0) : "")}
                                            readOnly={isDeclared}
                                            onFocus={() => setFocusedNumericField("nbCmi")}
                                            onBlur={() => setFocusedNumericField(null)}
                                            onChange={(e) => setPayments(prev => ({ ...prev, nbCmi: parseFrInput(e.target.value) }))}
                                            className={cn("w-full bg-white rounded-lg border-none h-8 px-2 font-bold text-slate-700 shadow-sm text-[13px]",
                                                isDeclared && "opacity-50 cursor-not-allowed bg-slate-100")}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-0.5 text-right">
                                        <label className="text-[10px] font-bold text-blue-500 uppercase">Mt CMI</label>
                                        <div className={cn("w-full border-b border-blue-200 pb-0.5", isDeclared && "border-slate-200")}>
                                            <input
                                                value={focusedNumericField === "mtCmi" ? payments.mtCmi : (payments.mtCmi ? formatFr(payments.mtCmi) : "")}
                                                readOnly={isDeclared}
                                                onFocus={() => setFocusedNumericField("mtCmi")}
                                                onBlur={() => setFocusedNumericField(null)}
                                                onChange={(e) => setPayments(prev => ({ ...prev, mtCmi: parseFrInput(e.target.value) }))}
                                                className={cn("w-full text-right bg-transparent border-none p-0 font-bold text-slate-700 focus:ring-0 text-[15px]",
                                                    isDeclared && "text-slate-500 cursor-not-allowed")}
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* CHQ */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-0.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nb CHQ</label>
                                        <input
                                            value={focusedNumericField === "nbChq" ? payments.nbChq : (payments.nbChq ? formatFr(payments.nbChq, 0) : "")}
                                            readOnly={isDeclared}
                                            onFocus={() => setFocusedNumericField("nbChq")}
                                            onBlur={() => setFocusedNumericField(null)}
                                            onChange={(e) => setPayments(prev => ({ ...prev, nbChq: parseFrInput(e.target.value) }))}
                                            className={cn("w-full bg-white rounded-lg border-none h-8 px-2 font-bold text-slate-700 shadow-sm text-[13px]",
                                                isDeclared && "opacity-50 cursor-not-allowed bg-slate-100")}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-0.5 text-right">
                                        <label className="text-[10px] font-bold text-emerald-500 uppercase">Mt CHQ</label>
                                        <div className={cn("w-full border-b border-emerald-200 pb-0.5", isDeclared && "border-slate-200")}>
                                            <input
                                                value={focusedNumericField === "mtChq" ? payments.mtChq : (payments.mtChq ? formatFr(payments.mtChq) : "")}
                                                readOnly={isDeclared}
                                                onFocus={() => setFocusedNumericField("mtChq")}
                                                onBlur={() => setFocusedNumericField(null)}
                                                onChange={(e) => setPayments(prev => ({ ...prev, mtChq: parseFrInput(e.target.value) }))}
                                                className={cn("w-full text-right bg-transparent border-none p-0 font-bold text-slate-700 focus:ring-0 text-[15px]",
                                                    isDeclared && "text-slate-500 cursor-not-allowed")}
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 flex justify-between items-end border-t border-[#E8DCC8] pt-2">
                                <span className="text-[13px] font-bold text-[#D4A674] uppercase tracking-wider">Espèces</span>
                                <span className={cn("text-[21px] font-bold tracking-tight", isDeclared ? "text-slate-400" : "text-slate-800")}>
                                    {formatFr(valEsp)}
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
                                    className="w-6 bg-transparent border-none p-0 font-bold text-slate-700 text-center text-[15px] cursor-pointer outline-none hover:bg-white/50 rounded"
                                />
                                <span className="text-slate-400 font-bold">:</span>
                                <input
                                    type="text"
                                    value={hours.startM}
                                    onChange={(e) => updateHours('startM', e.target.value)}
                                    onKeyDown={(e) => handleTimeKeyDown(e, 'startM', 60)}
                                    className="w-6 bg-transparent border-none p-0 font-bold text-slate-700 text-center text-[15px] cursor-pointer outline-none hover:bg-white/50 rounded"
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
                                    className="w-6 bg-transparent border-none p-0 font-bold text-slate-700 text-center text-[15px] cursor-pointer outline-none hover:bg-white/50 rounded"
                                />
                                <span className="text-slate-400 font-bold">:</span>
                                <input
                                    type="text"
                                    value={hours.endM}
                                    onChange={(e) => updateHours('endM', e.target.value)}
                                    onKeyDown={(e) => handleTimeKeyDown(e, 'endM', 60)}
                                    className="w-6 bg-transparent border-none p-0 font-bold text-slate-700 text-center text-[15px] cursor-pointer outline-none hover:bg-white/50 rounded"
                                />
                            </div>
                        </div>

                        {/* Glovo Block (Detailed) */}
                        <div className="bg-[#FFF9C4] rounded-xl p-4 flex-1 shadow-sm border border-[#F9E79F] relative overflow-hidden flex flex-col">
                            {/* Glovo Header */}
                            <div className="flex items-center gap-2 mb-4 justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[#FFC107] flex items-center justify-center">
                                        <span className="text-[11px] font-bold text-black">G</span>
                                    </div>
                                    <span className="font-bold text-[#5D4037] text-[15px]">GLOVO</span>
                                </div>
                                {/* DISCREET RATES INPUTS */}
                                <div className="flex gap-1 items-center opacity-70 hover:opacity-100 transition-opacity">
                                    <div className="flex flex-col items-center">
                                        <label className="text-[7px] uppercase font-bold text-slate-400 leading-none">HT</label>
                                        <input
                                            value={focusedNumericField === "commHT" ? rates.commHT : (rates.commHT ? formatFr(rates.commHT) : "")}
                                            onFocus={() => setFocusedNumericField("commHT")}
                                            onBlur={() => setFocusedNumericField(null)}
                                            onChange={e => {
                                                const newHT = parseFrInput(e.target.value);
                                                const newHTVal = parseFloat(newHT || "0");
                                                const newTTC = (newHTVal * 1.2).toFixed(2); // Auto Calc TTC

                                                setRates(prev => ({ ...prev, commHT: newHT || "", commTTC: newTTC }));
                                                setGlovo(prev => {
                                                    const next = {
                                                        ...prev,
                                                        usageCommissionHT: newHT,
                                                        usageCommissionTTC: newTTC
                                                    };
                                                    formDataRef.current.glovo = next;
                                                    return next;
                                                });
                                            }}
                                            className="w-8 h-4 text-[11px] text-center bg-white/50 border border-[#FBC02D]/30 rounded focus:bg-white focus:border-[#FBC02D] outline-none text-[#5D4037]"
                                            tabIndex={-1}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <label className="text-[7px] uppercase font-bold text-slate-400 leading-none">TTC</label>
                                        <input
                                            value={rates.commTTC ? formatFr(rates.commTTC) : ""}
                                            readOnly // READ ONLY
                                            disabled
                                            className="w-8 h-4 text-[11px] text-center bg-slate-100/50 border border-slate-200 rounded text-slate-500 cursor-not-allowed"
                                            title="Calculé (HT * 1.2)"
                                            tabIndex={-1}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <label className="text-[7px] uppercase font-bold text-slate-400 leading-none">Imp</label>
                                        <input
                                            value={focusedNumericField === "ratesImp" ? rates.imp : (rates.imp ? formatFr(rates.imp) : "")}
                                            onFocus={() => setFocusedNumericField("ratesImp")}
                                            onBlur={() => setFocusedNumericField(null)}
                                            onChange={e => {
                                                const newImp = parseFrInput(e.target.value);
                                                setRates(prev => ({ ...prev, imp: newImp || "" }));
                                                // Trigger Recalc of Breakdown
                                                const val = parseFloat(glovo.brut) || 0;
                                                const pImpVal = parseFloat(newImp || "90") / 100;
                                                const impVal = (val * pImpVal) / 1.2;
                                                setGlovo(prev => {
                                                    const next = {
                                                        ...prev,
                                                        brutImp: impVal.toFixed(2),
                                                        usageTaxablePercentage: newImp
                                                    };
                                                    formDataRef.current.glovo = next;
                                                    return next;
                                                });
                                            }}
                                            className="w-8 h-4 text-[11px] text-center bg-white/50 border border-[#FBC02D]/30 rounded focus:bg-white focus:border-[#FBC02D] outline-none text-[#5D4037]"
                                            tabIndex={-1}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <label className="text-[7px] uppercase font-bold text-slate-400 leading-none">Exo</label>
                                        <input
                                            value={focusedNumericField === "ratesExo" ? rates.exo : (rates.exo ? formatFr(rates.exo) : "")}
                                            onFocus={() => setFocusedNumericField("ratesExo")}
                                            onBlur={() => setFocusedNumericField(null)}
                                            onChange={e => {
                                                const newExo = parseFrInput(e.target.value);
                                                setRates(prev => ({ ...prev, exo: newExo || "" }));
                                                // Trigger Recalc of Breakdown
                                                const val = parseFloat(glovo.brut) || 0;
                                                const pExoVal = parseFloat(newExo || "10") / 100;
                                                const exoVal = val * pExoVal;
                                                setGlovo(prev => {
                                                    const next = {
                                                        ...prev,
                                                        brutExo: exoVal.toFixed(2),
                                                        usageExoneratedPercentage: newExo
                                                    };
                                                    formDataRef.current.glovo = next;
                                                    return next;
                                                });
                                            }}
                                            className="w-8 h-4 text-[11px] text-center bg-white/50 border border-[#FBC02D]/30 rounded focus:bg-white focus:border-[#FBC02D] outline-none text-[#5D4037]"
                                            tabIndex={-1}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 relative z-10 flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-[#8D6E63] uppercase">Brut</span>
                                    <input
                                        value={focusedNumericField === "glovoBrut" ? glovo.brut : (glovo.brut ? formatFr(glovo.brut) : "")}
                                        readOnly={isDeclared}
                                        onFocus={() => setFocusedNumericField("glovoBrut")}
                                        onBlur={() => setFocusedNumericField(null)}
                                        onChange={(e) => {
                                            const valStr = parseFrInput(e.target.value);
                                            const val = parseFloat(valStr) || 0;

                                            // Auto-calc Breakdown using resolved rates (Snapshot or Current)
                                            const imp = (val * pImp) / 1.2;
                                            const exo = val * pExo;

                                            setGlovo(prev => {
                                                const next = {
                                                    ...prev,
                                                    brut: valStr || "",
                                                    brutImp: imp.toFixed(2),
                                                    brutExo: exo.toFixed(2),
                                                    // PERSIST SNAPSHOTS from explicit inputs
                                                    usageCommissionHT: rates.commHT,
                                                    usageCommissionTTC: rates.commTTC,
                                                    usageTaxablePercentage: rates.imp,
                                                    usageExoneratedPercentage: rates.exo
                                                };
                                                formDataRef.current.glovo = next; // SYNC UPDATE
                                                return next;
                                            });
                                        }}
                                        className={cn("w-20 h-7 bg-white/60 border-none rounded-md text-right font-bold text-[#5D4037] px-2 text-[15px]", isDeclared && "bg-white/30 opacity-60 cursor-not-allowed")}
                                    />
                                </div>

                                <div className="pl-3 space-y-1.5 border-l-2 border-[#FBC02D]/20 my-1.5">
                                    {/* Side-by-Side Layout for Imp/Exo */}
                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#F9E79F]/50">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-[#8D6E63] uppercase opacity-70">Imp. HT ({Math.round(pImp * 100)}%)</span>
                                            <input
                                                value={glovo.brutImp ? formatFr(glovo.brutImp) : ""}
                                                tabIndex={-1} // NO TAB
                                                readOnly={true} // Always Read Only (Calculated)
                                                className={cn("w-full h-6 bg-white/40 border-none rounded text-right font-bold text-[#5D4037]/80 px-2 text-[13px]", "opacity-80 cursor-not-allowed")}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-[#8D6E63] uppercase opacity-70">Exo ({Math.round(pExo * 100)}%)</span>
                                            <input
                                                value={glovo.brutExo ? formatFr(glovo.brutExo) : ""}
                                                tabIndex={-1} // NO TAB
                                                readOnly={true} // Always Read Only (Calculated)
                                                className={cn("w-full h-6 bg-white/40 border-none rounded text-right font-bold text-[#5D4037]/80 px-2 text-[13px]", "opacity-80 cursor-not-allowed")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-[11px] font-bold text-red-400 uppercase">Incid.</span>
                                    <input
                                        value={focusedNumericField === "glovoIncid" ? glovo.incid : (glovo.incid ? formatFr(glovo.incid) : "")}
                                        readOnly={isDeclared}
                                        onFocus={() => setFocusedNumericField("glovoIncid")}
                                        onBlur={() => setFocusedNumericField(null)}
                                        onChange={(e) => updateGlovo('incid', parseFrInput(e.target.value))}
                                        className={cn("w-20 h-7 bg-white/60 border-none rounded-md text-right font-bold text-red-500 px-2 text-[15px]", isDeclared && "bg-white/30 opacity-60 cursor-not-allowed")}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-[#8D6E63] uppercase">Cash</span>
                                    <input
                                        value={focusedNumericField === "glovoCash" ? glovo.cash : (glovo.cash ? formatFr(glovo.cash) : "")}
                                        readOnly={isDeclared}
                                        onFocus={() => setFocusedNumericField("glovoCash")}
                                        onBlur={() => setFocusedNumericField(null)}
                                        onChange={(e) => updateGlovo('cash', parseFrInput(e.target.value))}
                                        className={cn("w-20 h-7 bg-white/60 border-none rounded-md text-right font-bold text-[#5D4037] px-2 text-[15px]", isDeclared && "bg-white/30 opacity-60 cursor-not-allowed")}
                                    />
                                </div>
                            </div>

                            {/* Compact Net Display */}
                            <div className="flex justify-between items-end border-t border-[#FBC02D]/20 pt-1 mt-1">
                                <span className="text-[13px] font-bold text-[#795548] uppercase tracking-wider">Net</span>
                                <span className="text-[21px] font-bold text-[#3E2723] tracking-tight">{formatFr(glovoNet)}</span>
                            </div>
                        </div>

                        {/* EXPLICIT CLOSE BUTTON (Outside, Tall, Bottom Aligned) */}
                        <button
                            onClick={() => handleSave(initialData?.status !== 'synced')}
                            className={cn(
                                "w-full h-20 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 outline-none group mt-auto",
                                headerColor,
                                "hover:brightness-110 active:brightness-90 opacity-90 hover:opacity-100"
                            )}
                            title="Enregistrer et Fermer"
                        >
                            <X className="w-8 h-8 text-orange-400 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="font-bold uppercase tracking-widest text-[21px] text-orange-400">Fermer</span>
                        </button>

                    </div>

                </div>

            </div>
        </div>

    );
}
