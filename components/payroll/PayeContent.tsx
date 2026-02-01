"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
    Search, Plus, User, FileText, DollarSign, Calendar,
    ChevronRight, Mail, Phone, MapPin, Briefcase,
    CreditCard, Building2, UserCircle, Trash2, Save,
    Calculator, Users, Edit3, Table, ChevronLeft, Minus, ArrowRight, Check, X,
    Cake, Heart, Baby, LogOut, Clock, Banknote, Gift, Pencil
} from "lucide-react";
import { cn, formatPhoneNumber } from "@/lib/utils";
import {
    getEmployees,
    saveEmployee,
    deleteEmployee
} from "@/lib/data-service";
import { Sidebar } from "@/components/layout/Sidebar";
import { DateInput } from "@/components/ui/DateInput";
import { GlassCard, GlassInput, GlassButton, GlassBadge } from "@/components/ui/GlassComponents";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { StaffMember } from "@/lib/types";

interface PayeContentProps {
    initialEmployees?: StaffMember[];
    defaultViewMode?: "JOURNAL" | "BASE";
}

export function PayeContent({ initialEmployees = [], defaultViewMode = "JOURNAL" }: PayeContentProps) {
    // --- ÉTATS ---
    const [employees, setEmployees] = useState<StaffMember[]>(initialEmployees);
    const [viewMode, setViewMode] = useState<"JOURNAL" | "BASE">(defaultViewMode);
    const [journalSubView, setJournalSubView] = useState<"SAISIE" | "COMPTABLE">("SAISIE");
    const [currentMonth] = useState("JANVIER");

    // Pour Base Personnel
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState<"profile" | "contract" | "salary">("profile");

    // History Edit State
    const [newHistoryType, setNewHistoryType] = useState("AUGMENTATION");
    const [newHistoryDate, setNewHistoryDate] = useState("");
    const [newHistoryAmount, setNewHistoryAmount] = useState<number>(0);
    const [newHistoryBonus, setNewHistoryBonus] = useState<number>(0);
    const [newHistoryUndeclaredBonus, setNewHistoryUndeclaredBonus] = useState<number>(0);
    const [editingHistoryIndex, setEditingHistoryIndex] = useState<number | null>(null);
    const [isAddingNewHistory, setIsAddingNewHistory] = useState<boolean>(false);

    // Runtime Load
    useEffect(() => {
        const load = async () => {
            const emps = await getEmployees();
            setEmployees(emps);
            if (emps.length > 0 && !selectedEmployeeId) {
                setSelectedEmployeeId(emps[0].id);
            }
        };
        load();
    }, []);

    // --- LOGIQUE FILTRE ---
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp =>
            emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (emp.role || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [employees, searchQuery]);

    const selectedEmployee = useMemo(() =>
        employees.find(e => e.id === selectedEmployeeId) || null
        , [employees, selectedEmployeeId]);

    const theme = useMemo(() => {
        const isFemale = selectedEmployee?.gender === "F";
        return {
            isFemale,
            primary: isFemale ? "red-600" : "blue-600",
            primaryText: isFemale ? "text-red-600" : "text-blue-600",
            primaryBg: isFemale ? "bg-red-600" : "bg-blue-600",
            bgAccent: isFemale ? "bg-red-50" : "bg-blue-50",
            borderAccent: isFemale ? "border-red-100" : "border-blue-100",
            ring: isFemale ? "focus:ring-red-500/20" : "focus:ring-blue-500/20",
            shadow: "shadow-2xl " + (isFemale ? "shadow-red-500/5" : "shadow-blue-500/5"),
            borderCard: "border-slate-200 " + (isFemale ? "border-red-500/20" : "border-blue-500/20"),
        };
    }, [selectedEmployee]);

    const chartData = useMemo(() => {
        if (!selectedEmployee) return [];
        const base = { date: selectedEmployee.contract?.hireDate || "", amount: selectedEmployee.contract?.baseSalary || 5000, type: "EMBAUCHE" }; // Fallback amount if baseSalary reused or initial
        const hist = (selectedEmployee.history || []).map(h => ({ ...h, amount: Number(h.amount) })); // Ensure numbers
        // Combine and sort chronological
        return [base, ...hist].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [selectedEmployee]);

    const evolutionPercentage = useMemo(() => {
        if (chartData.length < 2) return 0;
        const last = chartData[chartData.length - 1].amount;
        const prev = chartData[chartData.length - 2].amount;
        return prev ? Math.round(((last - prev) / prev) * 100) : 0;
    }, [chartData]);

    // Refs for keyboard navigation in BASE mode
    const cinRef = useRef<HTMLInputElement>(null);
    const cnssRef = useRef<HTMLInputElement>(null);
    const addressRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const cityRef = useRef<HTMLInputElement>(null);

    const hireDateRef = useRef<HTMLInputElement>(null);
    const exitDateRef = useRef<HTMLInputElement>(null);
    const seniorityRef = useRef<HTMLInputElement>(null);
    const leaveBalanceRef = useRef<HTMLInputElement>(null);
    const baseSalaryRef = useRef<HTMLInputElement>(null);
    const seniorityPercentageRef = useRef<HTMLInputElement>(null);
    const loanAmountRef = useRef<HTMLInputElement>(null);
    const paymentsRef = useRef<HTMLInputElement>(null);
    const remainingRef = useRef<HTMLInputElement>(null);

    const handleEmployeeKeyDown = (e: React.KeyboardEvent, field: string) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const flow: Record<string, React.RefObject<HTMLInputElement> | any> = {
                "cin": cnssRef,
                "cnss": addressRef,
                "address": phoneRef,
                "phone": cityRef,
                "city": hireDateRef,
                "hireDate": exitDateRef,
                "exitDate": seniorityRef,
                "seniority": leaveBalanceRef,
                "leaveBalance": baseSalaryRef,
                "baseSalary": seniorityPercentageRef,
                "seniorityPercentage": loanAmountRef,
                "loanAmount": paymentsRef,
                "payments": handleSaveEmployee // Trigger save
            };

            const nextRef = flow[field];
            if (typeof nextRef === 'function') {
                nextRef();
            } else {
                nextRef?.current?.focus();
            }
        }
    };

    // --- NAVIGATION CLAVIER ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.defaultPrevented) return;

            // Ignorer si focus dans un input, textarea, select ou bouton
            const isInputActive = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName || "");
            if (isInputActive) return;

            // Navigation Gauche/Droite pour changer de vue (JOURNAL / BASE)
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                const views: ("JOURNAL" | "BASE")[] = ["JOURNAL", "BASE"];
                const currentIndex = views.indexOf(viewMode);
                let newIndex = currentIndex;

                if (e.key === "ArrowLeft") {
                    newIndex = Math.max(0, currentIndex - 1);
                } else {
                    newIndex = Math.min(views.length - 1, currentIndex + 1);
                }

                if (newIndex !== currentIndex) {
                    e.preventDefault();
                    setViewMode(views[newIndex]);
                }
                return;
            }

            // Navigation Haut/Bas pour le sidebar (uniquement en mode BASE)
            if (viewMode === "BASE" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
                if (filteredEmployees.length === 0) return;
                e.preventDefault();

                const currentIndex = filteredEmployees.findIndex(emp => emp.id === selectedEmployeeId);
                let newIndex = currentIndex;

                if (currentIndex === -1) {
                    setSelectedEmployeeId(filteredEmployees[0].id);
                    return;
                }

                if (e.key === "ArrowUp") {
                    newIndex = Math.max(0, currentIndex - 1);
                } else {
                    newIndex = Math.min(filteredEmployees.length - 1, currentIndex + 1);
                }

                if (newIndex !== currentIndex) {
                    setSelectedEmployeeId(filteredEmployees[newIndex].id);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [viewMode, filteredEmployees, selectedEmployeeId]);

    // Auto-scroll sidebar list
    const sidebarListRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (viewMode === "BASE" && selectedEmployeeId && sidebarListRef.current) {
            const index = filteredEmployees.findIndex(emp => emp.id === selectedEmployeeId);
            if (index >= 0) {
                const el = sidebarListRef.current.children[index] as HTMLElement;
                el?.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedEmployeeId, filteredEmployees, viewMode]);

    // --- ACTIONS ---
    const handleSaveEmployee = async () => {
        if (!selectedEmployee) return;
        await saveEmployee(selectedEmployee);
        alert("Modifications enregistrées");
    };

    const handleDeleteEmployee = async () => {
        if (selectedEmployeeId === null) return;
        if (confirm("Supprimer cet employé ?")) {
            await deleteEmployee(selectedEmployeeId);
            const newEmployees = employees.filter(e => e.id !== selectedEmployeeId);
            setEmployees(newEmployees);
            if (newEmployees.length > 0) setSelectedEmployeeId(newEmployees[0].id);
            else setSelectedEmployeeId(null);
        }
    };

    // --- HELPERS ---
    const getMonthlyData = (emp: StaffMember) => {
        return emp.monthlyData?.[currentMonth] || {
            jours: 26,
            hSup: 0,
            pRegul: 0,
            pOccas: 0,
            virement: 0,
            avances: 0,
            monthlyDeduction: 0
        };
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "";
        const [y, m, d] = dateStr.split("-");
        if (!y || !m || !d) return dateStr;
        return `${d}/${m}/${y}`;
    };

    const calculateNet = (emp: StaffMember) => {
        const data = getMonthlyData(emp);
        const base = emp.contract?.baseSalary || 0;
        const dailyRate = base / 26;
        const proratedBase = dailyRate * data.jours;
        // Formula: Prorated Base + H.Sup + Regul + Occas - Avances - Deduction
        return proratedBase + (data.hSup * 50) + data.pRegul + data.pOccas - data.avances - data.monthlyDeduction;
    };

    const getYearSuffix = (dateStr?: string) => {
        if (!dateStr) return "00";
        return dateStr.split('-')[0].slice(-2);
    };

    const handleAddHistory = () => {
        if (!selectedEmployee || !newHistoryDate) return;
        const newHistory = {
            date: newHistoryDate,
            amount: newHistoryAmount,
            bonus: newHistoryBonus,
            undeclaredBonus: newHistoryUndeclaredBonus,
            type: newHistoryType,
            year: newHistoryDate.split('-')[0],
        };

        let updatedHistory;
        if (editingHistoryIndex !== null) {
            updatedHistory = [...(selectedEmployee.history || [])];
            updatedHistory[editingHistoryIndex] = newHistory;
        } else {
            updatedHistory = [...(selectedEmployee.history || []), newHistory];
        }

        handleEmployeeChange(selectedEmployee.id, 'history', updatedHistory);

        // Reset form
        setNewHistoryDate("");
        setNewHistoryAmount(0);
        setNewHistoryBonus(0);
        setNewHistoryUndeclaredBonus(0);
        setNewHistoryType("AUGMENTATION");
        setEditingHistoryIndex(null);
        setIsAddingNewHistory(false);
    };

    const handleEditHistory = (index: number, event: any) => {
        setEditingHistoryIndex(index);
        setIsAddingNewHistory(false);
        setNewHistoryDate(event.date);
        setNewHistoryAmount(event.amount);
        setNewHistoryBonus(event.bonus || 0);
        setNewHistoryUndeclaredBonus(event.undeclaredBonus || 0);
        setNewHistoryType(event.type);
    };

    const handleStartAdding = () => {
        setIsAddingNewHistory(true);
        setEditingHistoryIndex(null);
        setNewHistoryDate(new Date().toISOString().split('T')[0]);
        setNewHistoryAmount(selectedEmployee?.contract?.baseSalary || 0);
        setNewHistoryBonus(0);
        setNewHistoryUndeclaredBonus(0);
        setNewHistoryType("AUGMENTATION");
    };

    const handleCancelEdit = () => {
        setNewHistoryDate("");
        setNewHistoryAmount(0);
        setNewHistoryBonus(0);
        setNewHistoryUndeclaredBonus(0);
        setNewHistoryType("AUGMENTATION");
        setEditingHistoryIndex(null);
        setIsAddingNewHistory(false);
    };

    const updateMonthlyValue = (empId: number, field: string, value: any) => {
        setEmployees(prev => prev.map(emp => {
            if (emp.id === empId) {
                const currentData = getMonthlyData(emp);
                return {
                    ...emp,
                    monthlyData: {
                        ...emp.monthlyData,
                        [currentMonth]: { ...currentData, [field]: value }
                    }
                };
            }
            return emp;
        }));
    };

    const handleEmployeeChange = (empId: number, path: string, value: any) => {
        setEmployees(prev => prev.map(emp => {
            if (emp.id === empId) {
                const newEmp = { ...emp };
                let formattedValue = value;

                // Auto-format phone numbers
                if (path === 'personalInfo.phone' || path === 'personalInfo.phone2') {
                    formattedValue = formatPhoneNumber(String(value));
                }

                if (path.includes('.')) {
                    const [p1, p2] = path.split('.');
                    (newEmp as any)[p1] = { ...(newEmp as any)[p1], [p2]: formattedValue };

                    // Auto-calculate remaining loan
                    if (p1 === 'creditInfo') {
                        const loan = p2 === 'loanAmount' ? Number(formattedValue) : (emp.creditInfo?.loanAmount || 0);
                        const paid = p2 === 'payments' ? Number(formattedValue) : (emp.creditInfo?.payments || 0);
                        (newEmp.creditInfo as any).remaining = loan - paid;
                    }
                } else {
                    (newEmp as any)[path] = formattedValue;
                }
                return newEmp;
            }
            return emp;
        }));
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-outfit">
            <Sidebar />

            <div className="flex-1 ml-64 flex flex-col min-w-0">

                {/* === TOP BANDEAU (IMAGE STYLE) === */}
                <div className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 z-30 shrink-0 shadow-sm">
                    <div className="flex items-center gap-12">
                        <div className="text-2xl font-black text-slate-800 tracking-tight">Paye</div>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <button
                                onClick={() => setViewMode("JOURNAL")}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                    viewMode === "JOURNAL" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                JOURNAL
                            </button>
                            <button
                                onClick={() => setViewMode("BASE")}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                    viewMode === "BASE" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                PERSONNEL
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-6 py-2.5 rounded-2xl shadow-sm">
                        <ChevronLeft className="w-4 h-4 text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
                        <div className="flex flex-col items-center min-w-[120px]">
                            <span className="text-[12px] font-black text-slate-800 uppercase tracking-widest leading-none mb-1">{currentMonth} 2026</span>
                            <div className="h-0.5 w-8 bg-blue-600 rounded-full" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
                    </div>

                    <div className="w-40 flex justify-end">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* === MAIN CONTENT AREA === */}
                <div className="flex-1 overflow-hidden relative">

                    {/* JOURNAL VIEW */}
                    {viewMode === "JOURNAL" && (
                        <div className="h-full p-6 animate-in fade-in duration-500">
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden h-full flex flex-col">
                                {/* Table Header */}
                                <div className="bg-[#2C3E50] text-[#7F8C8D] h-14 flex items-center px-4 shrink-0 font-black text-[9px] uppercase tracking-widest">
                                    <div className="w-[18%]">Salarié</div>
                                    {journalSubView === "SAISIE" ? (
                                        <>
                                            <div className="w-[10%] text-center text-[#2ECC71]">Net Cible</div>
                                            <div className="w-[10%] text-center">Jours</div>
                                            <div className="w-[10%] text-center">H. Sup</div>
                                            <div className="w-[10%] text-center text-[#9B59B6]">P. Régul</div>
                                            <div className="w-[10%] text-center text-[#3498DB]">P. Occas</div>
                                            <div className="w-[10%] text-center text-[#F39C12]">Avances</div>
                                            <div className="w-[10%] text-center text-[#E74C3C]">Crédit</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-[10%] text-center">Salaire Base</div>
                                            <div className="w-[10%] text-center">CNSS P.P</div>
                                            <div className="w-[10%] text-center">AMO</div>
                                            <div className="w-[10%] text-center">IGR</div>
                                            <div className="w-[10%] text-center">CIMR</div>
                                            <div className="w-[10%] text-center">Frais Prof.</div>
                                            <div className="w-[10%] text-center">Divers.</div>
                                        </>
                                    )}
                                    <div className="w-[12%] text-right pr-4 text-white">Net à Payer</div>
                                </div>

                                {/* Table Body */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                                    {employees.map(emp => {
                                        const mData = getMonthlyData(emp);
                                        const netPayer = calculateNet(emp);

                                        return (
                                            <div key={emp.id} className="flex items-center h-16 px-4 hover:bg-slate-50 transition-colors group">
                                                {/* Salarié */}
                                                <div className="w-[18%] flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center font-black text-[10px] ring-2 ring-white shadow-sm">
                                                        {emp.firstName[0]}{emp.lastName[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1 truncate">{emp.lastName} {emp.firstName}</div>
                                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">M00{emp.id}</div>
                                                    </div>
                                                </div>

                                                {journalSubView === "SAISIE" ? (
                                                    <>
                                                        {/* Net Cible */}
                                                        <div className="w-[10%] text-center">
                                                            <div className="text-[13px] font-black text-[#27AE60]">
                                                                {emp.contract?.baseSalary.toLocaleString('fr-FR')} <span className="text-[9px] opacity-70">Dh</span>
                                                            </div>
                                                        </div>

                                                        {/* Jours */}
                                                        <div className="w-[10%] flex justify-center">
                                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 transition-all group-hover:bg-white">
                                                                <button
                                                                    onClick={() => updateMonthlyValue(emp.id, 'jours', Math.max(0, mData.jours - 1))}
                                                                    className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                                                >
                                                                    <Minus className="w-2.5 h-2.5" />
                                                                </button>
                                                                <span className="text-xs font-black text-slate-800 w-5 text-center">{mData.jours}</span>
                                                                <button
                                                                    onClick={() => updateMonthlyValue(emp.id, 'jours', Math.min(31, mData.jours + 1))}
                                                                    className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                                                >
                                                                    <Plus className="w-2.5 h-2.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* H. Sup */}
                                                        <div className="w-[10%] text-center font-bold text-slate-300 text-xs">
                                                            {mData.hSup || "—"}
                                                        </div>

                                                        {/* P. Régul */}
                                                        <div className="w-[10%] text-center">
                                                            <div className="text-[12px] font-black text-[#8E44AD]">
                                                                {mData.pRegul > 0 ? `${mData.pRegul.toLocaleString('fr-FR')} Dh` : "—"}
                                                            </div>
                                                        </div>

                                                        {/* P. Occas */}
                                                        <div className="w-[10%] text-center">
                                                            <div className="text-[12px] font-black text-[#2980B9]">
                                                                {mData.pOccas > 0 ? `${mData.pOccas.toLocaleString('fr-FR')} Dh` : "—"}
                                                            </div>
                                                        </div>

                                                        {/* Avances */}
                                                        <div className="w-[10%] text-center">
                                                            <div className="text-[12px] font-black text-[#D35400]">
                                                                {mData.avances > 0 ? `${mData.avances.toLocaleString('fr-FR')} Dh` : "—"}
                                                            </div>
                                                        </div>

                                                        {/* Crédit */}
                                                        <div className="w-[10%] text-center bg-[#FDEDEC]/50 h-full flex flex-col justify-center border-x border-[#FADBD8]/20">
                                                            <div className="text-[12px] font-black text-[#C0392B]">
                                                                {mData.monthlyDeduction > 0 ? `${mData.monthlyDeduction.toLocaleString('fr-FR')} Dh` : "—"}
                                                            </div>
                                                            <div className="text-[8px] font-black text-[#E74C3C] uppercase tracking-tighter mt-1 opacity-70">
                                                                Reste: {(emp.creditInfo?.remaining || 0).toLocaleString('fr-FR')} Dh
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* Vue Comptable */}
                                                        <div className="w-[10%] text-center font-black text-slate-600 text-[11px]">{emp.contract?.baseSalary.toLocaleString('fr-FR')}</div>
                                                        <div className="w-[10%] text-center font-black text-[#3498DB] text-[11px]">{(emp.contract?.baseSalary! * 0.0448).toFixed(2)}</div>
                                                        <div className="w-[10%] text-center font-black text-slate-400 text-[11px]">{(emp.contract?.baseSalary! * 0.0226).toFixed(2)}</div>
                                                        <div className="w-[10%] text-center font-black text-[#E74C3C] text-[11px]">{(emp.contract?.baseSalary! * 0.12).toFixed(0)}</div>
                                                        <div className="w-[10%] text-center font-black text-slate-500 text-[11px]">{(emp.contract?.baseSalary! * 0.03).toFixed(2)}</div>
                                                        <div className="w-[10%] text-center font-black text-slate-400 text-[11px]">{(emp.contract?.baseSalary! * 0.2).toFixed(0)}</div>
                                                        <div className="w-[10%] text-center font-black text-slate-300 text-[11px]">0.00</div>
                                                    </>
                                                )}

                                                {/* Net à Payer */}
                                                <div className="w-[12%] text-right pr-4">
                                                    <div className="text-base font-black text-[#D35400] leading-none mb-0.5">
                                                        {netPayer.toLocaleString('fr-FR')}
                                                    </div>
                                                    <span className="text-[8px] font-black text-[#E67E22] uppercase tracking-[.15em] opacity-60">Dh Net à Payer</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Table Footer / Summary */}
                                <div className="h-12 bg-slate-50 border-t border-slate-100 flex items-center px-8 gap-10 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Masse Salariale</span>
                                        <span className="text-lg font-black text-slate-800">
                                            {employees.reduce((acc, emp) => acc + calculateNet(emp), 0).toLocaleString('fr-FR')}
                                            <span className="text-[10px] ml-1">Dh</span>
                                        </span>
                                    </div>
                                    <div className="h-3 w-px bg-slate-200" />
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Users className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{employees.length} Salaries</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BASE PERSONNEL VIEW (3-Column Card Layout) */}
                    {viewMode === "BASE" && (
                        <div className="h-full flex flex-col bg-[#F6F8FC] overflow-hidden font-outfit">
                            <div className="flex-1 flex flex-row overflow-hidden">
                                {/* Sidebar Column Card */}
                                <div className="w-[360px] bg-[#F6F8FC] border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
                                    <div className="p-5 pb-2">
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Personnel</h2>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-8">Base de données RH</p>

                                        {/* Filtres : 3 Pill Tabs */}
                                        <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1 mb-8">
                                            {["TOUS", "ACTIFS", "INACTIFS"].map(f => (
                                                <button
                                                    key={f}
                                                    className={cn(
                                                        "flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all",
                                                        f === "TOUS" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-500"
                                                    )}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Search & Add */}
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex-1 group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Rechercher..."
                                                    className="w-full bg-white border-none rounded-2xl pl-12 pr-10 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm shadow-slate-200/50 transition-all placeholder:text-slate-300"
                                                />
                                                {searchQuery && (
                                                    <button
                                                        onClick={() => setSearchQuery("")}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-50 rounded-lg transition-all text-slate-300 hover:text-slate-400"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <button className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100/50 hover:scale-105 active:scale-95 transition-all shrink-0">
                                                <Plus className="w-5 h-5 stroke-[3px]" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Employee List Items */}
                                    <div ref={sidebarListRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-0 pb-10">
                                        {filteredEmployees.map(emp => {
                                            const isSelected = selectedEmployeeId === emp.id;
                                            return (
                                                <button
                                                    key={emp.id}
                                                    onClick={() => setSelectedEmployeeId(emp.id)}
                                                    className={cn(
                                                        "w-full flex items-center gap-4 px-8 py-4 rounded-none transition-all text-left relative group border-b border-transparent transition-all duration-300",
                                                        isSelected
                                                            ? "bg-blue-50/50 border-l-[6px] border-l-blue-600 shadow-sm"
                                                            : "bg-transparent border-l-[6px] border-l-transparent hover:bg-slate-100/50 hover:border-b-slate-100"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[14px] shrink-0 border transition-all",
                                                        isSelected
                                                            ? "bg-white border-blue-200 text-blue-600 shadow-sm"
                                                            : "bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-white"
                                                    )}>
                                                        {emp.firstName[0]}{emp.lastName[0]}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">M00{emp.id}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedEmployeeId(emp.id);
                                                                        setIsEditing(true);
                                                                    }}
                                                                    className={cn(
                                                                        "p-1.5 rounded-lg transition-all shadow-sm border",
                                                                        isSelected && isEditing
                                                                            ? cn(
                                                                                "opacity-100 bg-white shadow-md scale-110",
                                                                                emp.gender === "F" ? "text-red-600 border-red-100" : "text-blue-600 border-blue-100"
                                                                            )
                                                                            : "opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-400 border-transparent hover:bg-white hover:border-slate-100"
                                                                    )}
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <span className={cn(
                                                                "text-[15px] font-black truncate leading-tight",
                                                                isSelected ? "text-blue-700" : "text-slate-800"
                                                            )}>
                                                                {emp.lastName} {emp.firstName}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{emp.role}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Main Detail Column */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F6F8FC] p-5 flex flex-col gap-10">
                                    {selectedEmployee ? (
                                        <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-8">
                                            {/* Column Left: Infos & Finance (Wrapper Removed here) */}
                                            {/* Profile Header Card */}
                                            <div className="flex items-center gap-8 px-4">
                                                <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                                                    <User className="w-10 h-10 stroke-[2.5px]" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="mb-2">
                                                        <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase whitespace-nowrap">
                                                            {selectedEmployee.lastName} <span className="text-slate-400 font-bold capitalize">{selectedEmployee.firstName}</span>
                                                        </h2>
                                                    </div>

                                                    <div className="flex items-center gap-8 mb-4">
                                                        <div className={cn(
                                                            "flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-black shadow-sm",
                                                            selectedEmployee.gender === "F" ? "bg-red-600 text-white shadow-red-100" : "bg-blue-600 text-white shadow-blue-100"
                                                        )}>
                                                            {selectedEmployee.gender === "F" ? "F" : "H"}
                                                        </div>

                                                        <span className="text-[12px] font-black tracking-widest text-slate-400 uppercase">M00{selectedEmployee.id}</span>

                                                        <div className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
                                                            {selectedEmployee.role}
                                                        </div>

                                                        {isEditing && (
                                                            <div className="flex items-center gap-4 ml-4 border-l border-slate-200 pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                                                <label className="flex items-center gap-2 cursor-pointer group/radio">
                                                                    <input
                                                                        type="radio"
                                                                        name="gender"
                                                                        value="M"
                                                                        checked={selectedEmployee.gender === "M"}
                                                                        onChange={() => handleEmployeeChange(selectedEmployee.id, 'gender', 'M')}
                                                                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 transition-all cursor-pointer"
                                                                    />
                                                                    <span className="text-[10px] font-black text-slate-400 group-hover/radio:text-blue-600 uppercase transition-colors">Homme</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer group/radio">
                                                                    <input
                                                                        type="radio"
                                                                        name="gender"
                                                                        value="F"
                                                                        checked={selectedEmployee.gender === "F"}
                                                                        onChange={() => handleEmployeeChange(selectedEmployee.id, 'gender', 'F')}
                                                                        className="w-3.5 h-3.5 text-red-600 focus:ring-red-500 border-slate-300 transition-all cursor-pointer"
                                                                    />
                                                                    <span className="text-[10px] font-black text-slate-400 group-hover/radio:text-red-600 uppercase transition-colors">Femme</span>
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {isEditing && (
                                                    <div className="flex items-center gap-3 ml-auto animate-in fade-in slide-in-from-right-4 duration-300">
                                                        <button
                                                            onClick={() => setIsEditing(false)}
                                                            className="px-6 py-2.5 rounded-xl text-slate-400 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-100"
                                                        >
                                                            Annuler
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleSaveEmployee();
                                                                setIsEditing(false);
                                                            }}
                                                            className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                        >
                                                            <Save className="w-3.5 h-3.5" />
                                                            Enregistrer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="w-full relative">
                                                <div className="flex flex-col gap-8 pb-2 mr-[452px]">
                                                    {/* 1- INFORMATIONS PERSONNELLES */}
                                                    <div className="flex items-center gap-3 mb-0 mt-4 px-1">
                                                        <div className={cn("w-1 h-5 rounded-full", selectedEmployee.gender === "F" ? "bg-red-600" : "bg-blue-600")} />
                                                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.3em]">
                                                            1. Informations Personnelles
                                                        </h3>
                                                    </div>
                                                    <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm -mt-3">
                                                        <div className="grid grid-cols-3 gap-y-6 gap-x-12">
                                                            <div>
                                                                <div className="flex items-center gap-4">
                                                                    <Cake className="w-4 h-4 text-slate-400 shrink-0" />
                                                                    <div className="flex-1">
                                                                        {isEditing ? (
                                                                            <DateInput
                                                                                value={selectedEmployee.birthDate || ""}
                                                                                onChange={(val) => handleEmployeeChange(selectedEmployee.id, 'birthDate', val)}
                                                                                className="w-full"
                                                                            />
                                                                        ) : (
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-base font-black text-slate-800 tracking-tight">{formatDate(selectedEmployee.birthDate) || "12/05/1985"}</span>
                                                                                <span className="bg-blue-50 text-[10px] font-black text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100">40 ans</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-4">
                                                                    <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                                                                    <div className="flex-1">
                                                                        {isEditing ? (
                                                                            <input
                                                                                value={selectedEmployee.personalInfo.cin || ""}
                                                                                onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'personalInfo.cin', e.target.value)}
                                                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all uppercase"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-base font-black text-slate-800 tracking-tight uppercase">{selectedEmployee.personalInfo.cin || "BH123456"}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-4">
                                                                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                                                    <div className="flex-1">
                                                                        {isEditing ? (
                                                                            <input
                                                                                value={selectedEmployee.personalInfo.cnss || ""}
                                                                                onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'personalInfo.cnss', e.target.value)}
                                                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-base font-black text-slate-800 tracking-tight">{selectedEmployee.personalInfo.cnss || "123456789"}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="col-span-3 h-px bg-slate-100 my-1" />

                                                            <div>
                                                                <div className="flex items-center gap-4">
                                                                    <Heart className="w-4 h-4 text-slate-400 shrink-0" />
                                                                    <div className="flex-1">
                                                                        {isEditing ? (
                                                                            <div className="relative">
                                                                                <select
                                                                                    value={selectedEmployee.situationFamiliale || "Célibataire"}
                                                                                    onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'situationFamiliale', e.target.value)}
                                                                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all appearance-none cursor-pointer"
                                                                                >
                                                                                    <option value="Célibataire">Célibataire</option>
                                                                                    <option value="Marié(e)">Marié(e)</option>
                                                                                    <option value="Veuf(ve)">Veuf(ve)</option>
                                                                                </select>
                                                                                <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-[-90deg] pointer-events-none" />
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-base font-black text-slate-800 tracking-tight">{selectedEmployee.situationFamiliale || "Célibataire"}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-4">
                                                                    <Baby className="w-4 h-4 text-slate-400 shrink-0" />
                                                                    <div className="flex-1">
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="number"
                                                                                value={selectedEmployee.childrenCount || 0}
                                                                                onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'childrenCount', parseInt(e.target.value))}
                                                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-base font-black text-slate-800 tracking-tight">{selectedEmployee.childrenCount || 2}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="col-span-3 h-px bg-slate-100 my-1" />

                                                            <div className="col-span-1 border-r border-slate-100 pr-8">
                                                                <div className="flex items-start gap-4 pt-1">
                                                                    <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-1.5" />
                                                                    <div className="flex-1 flex flex-col gap-1">
                                                                        {isEditing ? (
                                                                            <>
                                                                                <input
                                                                                    value={selectedEmployee.personalInfo.phone || ""}
                                                                                    onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'personalInfo.phone', e.target.value)}
                                                                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1 text-[13px] font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                                                                    placeholder="Pro..."
                                                                                />
                                                                                <input
                                                                                    value={selectedEmployee.personalInfo.phone2 || ""}
                                                                                    onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'personalInfo.phone2', e.target.value)}
                                                                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1 text-[13px] font-black text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                                                                    placeholder="Perso..."
                                                                                />
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <span className="text-[13px] font-black text-slate-800">{formatPhoneNumber(selectedEmployee.personalInfo.phone || "") || "06 12 34 56 78"}</span>
                                                                                <span className="text-[13px] font-black text-slate-400">{formatPhoneNumber(selectedEmployee.personalInfo.phone2 || "") || "05 12 34 56 78"}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-span-2 flex flex-col">
                                                                <div className="flex items-start gap-4 pt-1">
                                                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-1.5" />
                                                                    <div className="flex-1">
                                                                        {isEditing ? (
                                                                            <div className="space-y-2">
                                                                                <input
                                                                                    value={selectedEmployee.personalInfo.address || ""}
                                                                                    onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'personalInfo.address', e.target.value)}
                                                                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[13px] font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                                                                />
                                                                                <input
                                                                                    value={selectedEmployee.personalInfo.city || ""}
                                                                                    onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'personalInfo.city', e.target.value)}
                                                                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                                                                    placeholder="Ville"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[13px] font-black text-slate-800 leading-relaxed">
                                                                                    {selectedEmployee.personalInfo.address || "Quartier Maârif, Rue 123, Immeuble 45"}
                                                                                </span>
                                                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                                                    {selectedEmployee.personalInfo.city || "Casablanca"}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 2- POSTE & SITUATION FINANCIÈRE */}
                                                    <div className="flex items-center gap-3 mb-0 mt-4 px-1">
                                                        <div className={cn("w-1 h-5 rounded-full", selectedEmployee.gender === "F" ? "bg-red-600" : "bg-blue-600")} />
                                                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.3em]">
                                                            2. Poste & FINANCE
                                                        </h3>
                                                    </div>
                                                    <div className="bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm -mt-3">
                                                        <div className="grid grid-cols-3 gap-6 mb-8">
                                                            <div className="border-r border-slate-100 pr-8">
                                                                <div className="flex items-center gap-4">
                                                                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                                                                    <div className="flex-1">
                                                                        {isEditing ? (
                                                                            <DateInput
                                                                                value={selectedEmployee.contract?.hireDate || ""}
                                                                                onChange={(val) => handleEmployeeChange(selectedEmployee.id, 'contract.hireDate', val)}
                                                                                className="w-full"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-base font-black text-slate-800 tracking-tight">{formatDate(selectedEmployee.contract?.hireDate)}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="border-r border-slate-100 pr-8">
                                                                <div className="flex items-center gap-4">
                                                                    <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
                                                                    <div className="flex-1">
                                                                        {isEditing ? (
                                                                            <DateInput
                                                                                value={selectedEmployee.contract?.exitDate || ""}
                                                                                onChange={(val) => handleEmployeeChange(selectedEmployee.id, 'contract.exitDate', val)}
                                                                                className="w-full"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-base font-black text-slate-400 tracking-tight">
                                                                                {selectedEmployee.contract?.exitDate ? formatDate(selectedEmployee.contract.exitDate) : "—"}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-4">
                                                                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                                                    <div className="flex-1">
                                                                        {isEditing ? (
                                                                            <input
                                                                                value={selectedEmployee.contract?.seniority || ""}
                                                                                onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'contract.seniority', e.target.value)}
                                                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-base font-black text-slate-800 tracking-tight">{selectedEmployee.contract?.seniority || "3 ans"}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-6 mb-12">
                                                            <div className="bg-emerald-50 border border-emerald-100 rounded-full aspect-square w-32 mx-auto flex flex-col items-center justify-center shadow-sm">
                                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Congés</span>
                                                                <span className="text-xl font-black text-emerald-700 leading-none">18J</span>
                                                            </div>
                                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-center items-center shadow-[0_4px_6px_-1px_rgba(100,116,139,0.2)] relative overflow-hidden">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Dernier Salaire</span>
                                                                <span className="text-2xl font-black text-slate-800 leading-none mb-1">{(selectedEmployee.contract?.baseSalary || 0).toLocaleString()} <span className="text-[12px] opacity-70">Dh</span></span>
                                                            </div>
                                                            <div className="bg-emerald-50 border border-emerald-100 rounded-full aspect-square w-32 mx-auto flex flex-col items-center justify-center shadow-sm">
                                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Taux Anc.</span>
                                                                {isEditing ? (
                                                                    <div className="flex items-baseline gap-0.5">
                                                                        <input
                                                                            type="number"
                                                                            value={selectedEmployee.contract?.seniorityPercentage || 0}
                                                                            onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'contract.seniorityPercentage', Number(e.target.value))}
                                                                            className="w-10 bg-transparent text-center text-xl font-black text-emerald-700 focus:outline-none"
                                                                        />
                                                                        <span className="text-xl font-black text-emerald-700">%</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xl font-black text-emerald-700 leading-none">
                                                                        {selectedEmployee.contract?.seniorityPercentage || 0}%
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="col-span-3 bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-[0_4px_6px_-1px_rgba(100,116,139,0.2)]">
                                                                <div className="grid grid-cols-3 gap-6">
                                                                    <div className="flex flex-col items-center justify-center">
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase mb-2">Montant Prêté</span>
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="number"
                                                                                value={selectedEmployee.creditInfo?.loanAmount || 0}
                                                                                onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'creditInfo.loanAmount', Number(e.target.value))}
                                                                                className="bg-transparent text-lg font-black text-slate-800 focus:outline-none text-center w-full"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-lg font-black text-slate-800">
                                                                                {(selectedEmployee.creditInfo?.loanAmount || 0).toLocaleString('fr-FR')} <span className="text-xs opacity-50">Dh</span>
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex flex-col items-center justify-center">
                                                                        <span className="text-[10px] font-black text-blue-600 uppercase mb-2">Remboursé</span>
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="number"
                                                                                value={selectedEmployee.creditInfo?.payments || 0}
                                                                                onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'creditInfo.payments', Number(e.target.value))}
                                                                                className="bg-transparent text-lg font-black text-blue-600 focus:outline-none text-center w-full"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-lg font-black text-blue-600">
                                                                                {(selectedEmployee.creditInfo?.payments || 0).toLocaleString('fr-FR')} <span className="text-xs opacity-50">Dh</span>
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex flex-col items-center justify-center">
                                                                        <span className="text-[10px] font-black text-red-500 uppercase mb-2">Reste Dû</span>
                                                                        <span className="text-xl font-black text-red-600">
                                                                            {(selectedEmployee.creditInfo?.remaining ||
                                                                                ((selectedEmployee.creditInfo?.loanAmount || 0) - (selectedEmployee.creditInfo?.payments || 0))
                                                                            ).toLocaleString('fr-FR')} <span className="text-xs opacity-50">Dh</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column Right: Historique (Full Height) */}
                                                <div className="absolute top-0 right-0 bottom-0 w-[420px] flex flex-col pt-2">
                                                    <div className="flex items-center gap-3 mb-0 mt-4 px-1 shrink-0">
                                                        <div className={cn("w-1 h-5 rounded-full", selectedEmployee.gender === "F" ? "bg-red-600" : "bg-blue-600")} />
                                                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.3em]">
                                                            3. HISTORIQUE & ÉVOLUTION
                                                        </h3>
                                                    </div>
                                                    <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm flex flex-col flex-1 mt-4 overflow-hidden">
                                                        {/* Recharts Salary Chart */}
                                                        <div className="h-40 mb-2 shrink-0">
                                                            <div className="flex items-center justify-between mb-4">
                                                                {/* Removed Subtitle & Badge as requested */}
                                                            </div>
                                                            <ResponsiveContainer width="100%" height="80%">
                                                                <LineChart data={chartData}>
                                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                                    <XAxis dataKey="date" hide />
                                                                    <YAxis
                                                                        domain={['auto', 'auto']}
                                                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                                                        width={25}
                                                                        axisLine={false}
                                                                        tickLine={false}
                                                                    />
                                                                    <Line
                                                                        type="monotone"
                                                                        dataKey="amount"
                                                                        stroke="#2563EB"
                                                                        strokeWidth={4}
                                                                        dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }}
                                                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                                                    />
                                                                </LineChart>
                                                            </ResponsiveContainer>
                                                        </div>

                                                        {/* Timeline Content */}
                                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300">
                                                            <div className="space-y-4 relative pl-10">
                                                                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-50" />

                                                                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-50" />

                                                                {isEditing && !isAddingNewHistory && editingHistoryIndex === null && (
                                                                    <button
                                                                        onClick={handleStartAdding}
                                                                        className="w-full mb-4 py-2 border-2 border-dashed border-blue-200 rounded-xl text-blue-400 text-[10px] font-black uppercase tracking-widest hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                        Ajouter un événement
                                                                    </button>
                                                                )}

                                                                {isAddingNewHistory && (
                                                                    <div className="relative p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 ring-4 ring-blue-50 mb-6">
                                                                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-black shadow-sm z-10 border-4 border-white">
                                                                            <Plus className="w-3 h-3" />
                                                                        </div>
                                                                        {/* --- MODE SAISIE (INLINE FORM) --- */}
                                                                        <div className="flex flex-col gap-2">
                                                                            {/* Row 1: Type / Date */}
                                                                            <div className="flex justify-between items-center bg-white rounded-lg border border-blue-200 p-0.5 mb-1.5">
                                                                                <select
                                                                                    value={newHistoryType}
                                                                                    onChange={(e) => setNewHistoryType(e.target.value)}
                                                                                    className="w-[85px] bg-transparent text-[9px] font-black uppercase text-blue-600 focus:outline-none pl-1"
                                                                                >
                                                                                    <option value="AUGMENTATION">AUGMENTATION</option>
                                                                                    <option value="PRIMES">PRIMES</option>
                                                                                    <option value="PROMOTION">PROMOTION</option>
                                                                                    <option value="EMBAUCHE">EMBAUCHE</option>
                                                                                </select>
                                                                                <div className="w-px h-3 bg-blue-100 mx-1" />
                                                                                <DateInput
                                                                                    value={newHistoryDate}
                                                                                    onChange={setNewHistoryDate}
                                                                                    className="w-[70px] text-[9px] h-4 leading-none border-none p-0 focus:ring-0"
                                                                                />
                                                                            </div>
                                                                            {/* Row 2: Salary / Prime / Buttons */}
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="relative flex-1">
                                                                                    <input
                                                                                        type="number"
                                                                                        value={newHistoryAmount}
                                                                                        onChange={(e) => setNewHistoryAmount(Number(e.target.value))}
                                                                                        className="w-full bg-white border border-blue-200 rounded-lg pl-7 pr-2 py-1 text-[10px] font-bold text-slate-700 h-8"
                                                                                        placeholder="Sal."
                                                                                    />
                                                                                    <Banknote className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                                                                </div>
                                                                                <div className="relative flex-1">
                                                                                    <input
                                                                                        type="number"
                                                                                        value={newHistoryUndeclaredBonus}
                                                                                        onChange={(e) => setNewHistoryUndeclaredBonus(Number(e.target.value))}
                                                                                        className="w-full bg-white border border-blue-200 rounded-lg pl-7 pr-2 py-1 text-[10px] font-bold text-slate-700 h-8"
                                                                                        placeholder="Pri."
                                                                                    />
                                                                                    <Gift className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                                                                </div>
                                                                                <div className="flex gap-1 shrink-0">
                                                                                    <button
                                                                                        onClick={handleAddHistory}
                                                                                        className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
                                                                                    >
                                                                                        <Check className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={handleCancelEdit}
                                                                                        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                                                                    >
                                                                                        <X className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Reverse chronological list from chartData */}
                                                                {chartData.slice().reverse().map((event, idx) => {
                                                                    const realIndex = chartData.length - 1 - idx;
                                                                    const isLatest = idx === 0;
                                                                    const yearSuffix = getYearSuffix(event.date);
                                                                    const isEditingThis = editingHistoryIndex === realIndex;

                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            className={cn(
                                                                                "relative p-3.5 rounded-2xl group transition-all duration-300 border",
                                                                                isLatest && !isEditingThis
                                                                                    ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-100 transform -translate-x-1"
                                                                                    : "bg-white border-transparent hover:border-slate-100",
                                                                                isEditingThis ? "bg-blue-50/50 border-blue-100 ring-4 ring-blue-50" : ""
                                                                            )}
                                                                        >
                                                                            {/* Year Bubble */}
                                                                            <div className={cn(
                                                                                "absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-[8px] font-black shadow-sm z-10 transition-colors",
                                                                                isLatest ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white"
                                                                            )}>
                                                                                {yearSuffix}
                                                                            </div>

                                                                            {isEditingThis ? (
                                                                                // --- MODE SAISIE (INLINE FORM) ---
                                                                                <div className="flex flex-col gap-2">
                                                                                    {/* Row 1: Type / Date */}
                                                                                    <div className="flex justify-between items-center bg-white rounded-lg border border-blue-200 p-0.5 mb-1.5">
                                                                                        <select
                                                                                            value={newHistoryType}
                                                                                            onChange={(e) => setNewHistoryType(e.target.value)}
                                                                                            className="w-[85px] bg-transparent text-[9px] font-black uppercase text-blue-600 focus:outline-none pl-1"
                                                                                        >
                                                                                            <option value="AUGMENTATION">AUGMENTATION</option>
                                                                                            <option value="PRIMES">PRIMES</option>
                                                                                            <option value="PROMOTION">PROMOTION</option>
                                                                                            <option value="EMBAUCHE">EMBAUCHE</option>
                                                                                        </select>
                                                                                        <div className="w-px h-3 bg-blue-100 mx-1" />
                                                                                        <DateInput
                                                                                            value={newHistoryDate}
                                                                                            onChange={setNewHistoryDate}
                                                                                            className="w-[70px] text-[9px] h-4 leading-none border-none p-0 focus:ring-0"
                                                                                        />
                                                                                    </div>
                                                                                    {/* Row 2: Salary / Prime / Buttons */}
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="relative flex-1">
                                                                                            <input
                                                                                                type="number"
                                                                                                value={newHistoryAmount}
                                                                                                onChange={(e) => setNewHistoryAmount(Number(e.target.value))}
                                                                                                className="w-full bg-white border border-blue-200 rounded-lg pl-7 pr-2 py-1 text-[10px] font-bold text-slate-700 h-8"
                                                                                                placeholder="Sal."
                                                                                            />
                                                                                            <Banknote className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                                                                        </div>
                                                                                        <div className="relative flex-1">
                                                                                            <input
                                                                                                type="number"
                                                                                                value={newHistoryUndeclaredBonus}
                                                                                                onChange={(e) => setNewHistoryUndeclaredBonus(Number(e.target.value))}
                                                                                                className="w-full bg-white border border-blue-200 rounded-lg pl-7 pr-2 py-1 text-[10px] font-bold text-slate-700 h-8"
                                                                                                placeholder="Pri."
                                                                                            />
                                                                                            <Gift className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                                                                        </div>
                                                                                        <div className="flex gap-1 shrink-0">
                                                                                            <button
                                                                                                onClick={handleAddHistory}
                                                                                                className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
                                                                                            >
                                                                                                <Check className="w-4 h-4" />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={handleCancelEdit}
                                                                                                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                                                                            >
                                                                                                <X className="w-4 h-4" />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                // --- MODE CONSULTATION ---
                                                                                <div className="flex flex-col gap-3">
                                                                                    {/* Row 1: Type / Date */}
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className={cn(
                                                                                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                                                            isLatest
                                                                                                ? "bg-blue-500 text-white border-blue-400"
                                                                                                : "bg-slate-100 text-slate-500 border-slate-200"
                                                                                        )}>
                                                                                            {(event as any).type}
                                                                                        </span>
                                                                                        <span className={cn("text-[10px] font-bold", isLatest ? "text-blue-100" : "text-slate-400")}>
                                                                                            {formatDate(event.date)}
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* Row 2: Salary / Bonus */}
                                                                                    <div className="flex items-center justify-between">
                                                                                        {/* Salary */}
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className={cn(
                                                                                                "w-6 h-6 rounded-lg flex items-center justify-center shadow-sm border",
                                                                                                isLatest ? "bg-white/10 border-white/20 text-white" : "bg-white border-slate-100 text-slate-400"
                                                                                            )}>
                                                                                                <Banknote className="w-3.5 h-3.5" />
                                                                                            </div>
                                                                                            <span className={cn("text-base font-black tracking-tight", isLatest ? "text-white" : "text-slate-800")}>
                                                                                                {event.amount.toLocaleString()} <span className="text-[10px] font-bold opacity-70">Dh</span>
                                                                                            </span>
                                                                                        </div>

                                                                                        {/* Bonus */}
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className={cn(
                                                                                                "w-6 h-6 rounded-lg flex items-center justify-center shadow-sm border",
                                                                                                isLatest ? "bg-white/10 border-white/20 text-yellow-300" : "bg-white border-slate-100 text-amber-500"
                                                                                            )}>
                                                                                                <Gift className="w-3.5 h-3.5" />
                                                                                            </div>
                                                                                            <span className={cn(
                                                                                                "text-sm font-black",
                                                                                                ((event as any).undeclaredBonus || (event as any).bonus) > 0
                                                                                                    ? (isLatest ? "text-yellow-300" : "text-amber-500")
                                                                                                    : (isLatest ? "text-white/30" : "text-slate-300")
                                                                                            )}>
                                                                                                {((event as any).undeclaredBonus || (event as any).bonus || 0).toLocaleString()} <span className="text-[9px] font-bold opacity-70">Dh</span>
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Edit Button (Overlay) */}
                                                                                    {isEditing && (
                                                                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleEditHistory(realIndex, event);
                                                                                                }}
                                                                                                className="p-1.5 rounded-lg bg-white text-blue-600 hover:bg-blue-600 hover:text-white shadow-lg border border-slate-100 transition-colors"
                                                                                            >
                                                                                                <Pencil className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                            <div className="w-20 h-20 bg-white shadow-xl shadow-slate-100 rounded-3xl flex items-center justify-center mb-6 border border-slate-50">
                                                <Users className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <p className="font-black text-xl text-slate-400 tracking-tight">Sélectionnez un agent pour voir son profil</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
