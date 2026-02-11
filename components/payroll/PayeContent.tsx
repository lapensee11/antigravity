"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
    Search, Plus, X, Pencil, Trash2, Calendar, FileText, Download, Filter,
    MoreHorizontal, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, AlertCircle, TrendingUp, TrendingDown,
    Save, UserPlus, CreditCard, Clock, Activity, Briefcase, Hash, Phone, MapPin,
    Calendar as CalendarIcon, Heart, Baby, LogOut, Users, Minus, User, DollarSign, Mail, Building2, UserCircle, Calculator, Edit3, Table, ArrowRight, Cake, Banknote, Gift, RefreshCw, Lock, Unlock
} from "lucide-react";
import { cn, formatPhoneNumber } from "@/lib/utils";
import {
    getEmployees,
    saveEmployee,
    deleteEmployee,
    closePayrollMonth,
    unclosePayrollMonth
} from "@/lib/data-service";
import { useEmployees, useEmployeeMutation } from "@/lib/hooks/use-data";
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
import * as XLSX from 'xlsx-js-style';



interface PayeContentProps {
    initialEmployees?: StaffMember[];
    defaultViewMode?: "JOURNAL" | "BASE";
}

const PayrollInput = ({ value, onChange, onIncrement, onDecrement, className, isCurrency = false, disabled = false, id, onKeyDown }: {
    value: number;
    onChange: (val: number) => void;
    onIncrement?: () => void;
    onDecrement?: () => void;
    className?: string;
    isCurrency?: boolean;
    disabled?: boolean;
    id?: string;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState("");

    useEffect(() => {
        const formattedValue = isCurrency
            ? value.toFixed(2).replace('.', ',')
            : value.toString().replace('.', ',');

        // Always sync if not editing
        if (!isEditing) {
            setLocalValue(value === 0 ? "" : formattedValue);
            return;
        }

        // If editing, only sync if the numerical value from props changed 
        // (meaning an external update like arrow keys happened)
        const currentLocalNum = parseFloat(localValue.replace(',', '.')) || 0;
        if (value !== currentLocalNum) {
            setLocalValue(value === 0 ? "" : formattedValue);
        }
    }, [value, isEditing, isCurrency]);

    const handleBlur = () => {
        setIsEditing(false);
        const parsed = parseFloat(localValue.replace(',', '.'));
        onChange(isNaN(parsed) ? 0 : parsed);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (onKeyDown) onKeyDown(e);

        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
            const formattedValue = isCurrency
                ? value.toFixed(2).replace('.', ',')
                : value.toString().replace('.', ',');
            setLocalValue(formattedValue);
            setIsEditing(false);
            (e.target as HTMLInputElement).blur();
        }
        if (e.key === 'ArrowUp' && onIncrement) {
            e.preventDefault();
            onIncrement();
        }
        if (e.key === 'ArrowDown' && onDecrement) {
            e.preventDefault();
            onDecrement();
        }
    };

    const displayValue = isEditing
        ? localValue
        : (isCurrency
            ? value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (isCurrency ? ' Dh' : '')
            : value.toString().replace('.', ',')
        );

    return (
        <div className="relative flex items-center group/input min-w-[50px]">
            <input
                id={id}
                type="text"
                value={displayValue}
                className={cn(
                    "w-full text-center bg-transparent border-none p-0 text-[12px] font-black focus:ring-0 focus:outline-none transition-all",
                    (onIncrement || onDecrement) && "pr-4",
                    className
                )}
                onFocus={() => {
                    setIsEditing(true);
                    setLocalValue(value === 0 ? "" : value.toString().replace('.', ','));
                }}
                onBlur={handleBlur}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
            />
            {(!disabled && (onIncrement || onDecrement)) && (
                <div className="absolute right-0 flex flex-col opacity-0 group-hover/input:opacity-100 transition-opacity translate-x-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onIncrement?.(); }}
                        className="p-0.5 hover:text-blue-600 transition-colors"
                    >
                        <ChevronUp className="w-2.5 h-2.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDecrement?.(); }}
                        className="p-0.5 hover:text-blue-600 transition-colors"
                    >
                        <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                </div>
            )}
        </div>
    );
};

export function PayeContent({ initialEmployees = [], defaultViewMode = "JOURNAL" }: PayeContentProps) {
    // --- ÉTATS ---
    const { data: employees = [], refetch, isLoading } = useEmployees();
    const [localEmployees, setLocalEmployees] = useState<StaffMember[]>([]);

    const employeeMutation = useEmployeeMutation();

    // Sync local state when query data changes
    useEffect(() => {
        if (employees.length > 0) {
            setLocalEmployees(employees);
        }
    }, [employees]);
    const [viewMode, setViewMode] = useState<"JOURNAL" | "BASE">(defaultViewMode);
    const [journalSubView, setJournalSubView] = useState<"SAISIE" | "COMPTABLE">("SAISIE");
    const [currentMonth, setCurrentMonth] = useState("FÉVRIER");
    const [currentYear, setCurrentYear] = useState(2026);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);

    const MONTHS = [
        "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
        "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"
    ];

    // Pour Base Personnel
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"TOUS" | "ACTIFS" | "INACTIFS">("ACTIFS");
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

    // Auto-select first employee if none selected
    useEffect(() => {
        if (employees.length > 0 && !selectedEmployeeId) {
            setSelectedEmployeeId(employees[0].id);
        }
    }, [employees, selectedEmployeeId]);

    const handlePrevMonth = () => {
        const idx = MONTHS.indexOf(currentMonth);
        if (idx === 0) {
            setCurrentMonth(MONTHS[11]);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(MONTHS[idx - 1]);
        }
    };

    const handleNextMonth = () => {
        const idx = MONTHS.indexOf(currentMonth);
        if (idx === 11) {
            setCurrentMonth(MONTHS[0]);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(MONTHS[idx + 1]);
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsDatePickerOpen(false);
            }
        };
        if (isDatePickerOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isDatePickerOpen]);

    // --- LOGIQUE FILTRE ---
    const filteredEmployees = useMemo(() => {
        return localEmployees.filter(emp => {
            const matchesSearch =
                emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (emp.role || "").toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (filterStatus === "ACTIFS") return !emp.contract?.exitDate;
            if (filterStatus === "INACTIFS") return !!emp.contract?.exitDate;

            return true;
        }).sort((a, b) => {
            const matrA = a.matricule || `M00${a.id}`;
            const matrB = b.matricule || `M00${b.id}`;
            return matrA.localeCompare(matrB, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [localEmployees, searchQuery, filterStatus]);

    const selectedEmployee = useMemo(() =>
        localEmployees.find(e => e.id === selectedEmployeeId) || null
        , [localEmployees, selectedEmployeeId]);

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

    const sortedEmployees = useMemo(() => {
        const monthIndex = MONTHS.indexOf(currentMonth);
        const currentPeriodEnd = new Date(currentYear, monthIndex + 1, 0); // Last day of month

        return localEmployees.filter(emp => {
            // Filter by Hire Date: Employee must be hired on or before the current period
            if (emp.contract?.hireDate) {
                const hireDate = new Date(emp.contract.hireDate);
                if (hireDate > currentPeriodEnd) return false;
            }
            return true;
        }).sort((a, b) => {
            const matrA = a.matricule || `M00${a.id}`;
            const matrB = b.matricule || `M00${b.id}`;
            return matrA.localeCompare(matrB, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [localEmployees, currentMonth, currentYear]);

    const chartData = useMemo(() => {
        if (!selectedEmployee) return [];
        const hist = (selectedEmployee.history || []).map((h, idx) => {
            const amount = Number(h.amount);
            const bonus = Number((h as any).undeclaredBonus ?? (h as any).bonus ?? 0);
            return {
                ...h,
                amount: amount, // This will be the net salary
                total: amount + bonus, // This will be the total global
                originalIndex: idx // Track original index for editing/deleting
            };
        });

        if (hist.length > 0) {
            const sortedHist = [...hist].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const hasEmb = sortedHist.some(h => h.type === "EMBAUCHE");

            if (hasEmb) return sortedHist;

            // If no EMBAUCHE in history, use hireDate and the OLDEST history entry's amount as starting point
            // This prevents the chart from being flat when baseSalary is updated to the latest amount
            const firstTotal = sortedHist[0].total; // Use 'total' for the starting point
            const base = {
                date: selectedEmployee.contract?.hireDate || sortedHist[0].date,
                amount: sortedHist[0].amount, // Keep original amount for display
                total: sortedHist[0].amount, // Use base amount for chart start (assuming 0 bonus initially)
                type: "EMBAUCHE",
                originalIndex: -1 // Synthetic event cannot be edited/deleted directly as a history item
            };

            if (base.date === sortedHist[0].date) return sortedHist;
            return [base, ...sortedHist].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }

        const base = {
            date: selectedEmployee.contract?.hireDate || "",
            amount: selectedEmployee.contract?.baseSalary || 5000,
            total: selectedEmployee.contract?.baseSalary || 5000,
            type: "EMBAUCHE",
            originalIndex: -1
        };
        return [base];
    }, [selectedEmployee]);

    const evolutionPercentage = useMemo(() => {
        if (chartData.length < 2) return 0;
        const last = chartData[chartData.length - 1].total; // Use total for evolution
        const prev = chartData[chartData.length - 2].total; // Use total for evolution
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
            const targetTagName = (e.target as HTMLElement).tagName;
            const isInputActive = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(targetTagName);

            // Navigation Gauche/Droite pour changer de vue (JOURNAL / BASE) - Bloqué si input actif
            if (!isInputActive && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
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

            // Navigation Haut/Bas pour le sidebar (BASE) ou le journal (JOURNAL)
            // Navigation Haut/Bas pour le sidebar (BASE) ou le journal (JOURNAL)
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                // Allow navigation in inputs, but not textareas (multiline)
                if (targetTagName === "TEXTAREA") return;

                const list = viewMode === "JOURNAL" ? sortedEmployees : filteredEmployees;
                if (list.length === 0) return;

                e.preventDefault();

                const currentIndex = list.findIndex(emp => emp.id === selectedEmployeeId);
                let newIndex = currentIndex;

                if (currentIndex === -1) {
                    setSelectedEmployeeId(list[0].id);
                    return;
                }

                if (e.key === "ArrowUp") {
                    newIndex = Math.max(0, currentIndex - 1);
                } else {
                    newIndex = Math.min(list.length - 1, currentIndex + 1);
                }

                if (newIndex !== currentIndex) {
                    setSelectedEmployeeId(list[newIndex].id);
                }
            }

            // Global Tab -> Jump to "Jours" of selected employee
            if (e.key === "Tab" && !isInputActive && selectedEmployeeId && viewMode === "JOURNAL") {
                e.preventDefault();
                document.getElementById(`input-jours-${selectedEmployeeId}`)?.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const handleDeleteHistory = async (index: number) => {
        if (!selectedEmployee || !selectedEmployee.history) return;

        // Confirm before deleting
        if (!confirm("Voulez-vous vraiment supprimer cet événement de l'historique ?")) return;

        const updatedHistory = [...selectedEmployee.history];
        updatedHistory.splice(index, 1);

        // SYNC BASE SALARY: Find the new latest event in the updated history
        const latestEvent = [...updatedHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const updatedEmployee = {
            ...selectedEmployee,
            history: updatedHistory,
            contract: {
                ...selectedEmployee.contract,
                // If we have events, pick the latest amount, otherwise keep current (or rollback if we track initial)
                baseSalary: latestEvent ? latestEvent.amount : selectedEmployee.contract.baseSalary
            }
        };

        // Update local state first for instant UI response
        setLocalEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));

        // Persist and refetch
        try {
            await employeeMutation.mutateAsync(updatedEmployee);
        } catch (err) {
            console.error("Failed to delete history event:", err);
            // Revert local state if needed (optional but good practice)
        }
    };

    const handleSaveEmployee = async () => {
        if (!selectedEmployee) return;
        await saveEmployee(selectedEmployee);
        // Alert removed for silent save
    };

    const handleAddEmployee = () => {
        const newId = Math.max(...employees.map(e => e.id), 0) + 1;
        const newEmployee: any = {
            id: newId,
            firstName: "",
            lastName: "",
            role: "Employé",
            declarationStatus: "D",
            gender: "M",
            situationFamiliale: "Célibataire",
            childrenCount: 0,
            birthDate: "1990-01-01",
            personalInfo: {
                cin: "",
                cnss: "",
                address: "",
                city: "Casablanca",
                phone: "",
                phone2: ""
            },
            contract: {
                hireDate: new Date().toISOString().split('T')[0],
                baseSalary: 3000,
            },
            history: [],
            monthlyData: {},
            creditInfo: {
                loanAmount: 0,
                payments: 0,
                remaining: 0
            }
        };
        setLocalEmployees(prev => [...prev, newEmployee]);
        setSelectedEmployeeId(newId);
        setIsEditing(true);
    };

    const handleDeleteEmployee = async () => {
        if (selectedEmployeeId === null) return;
        if (confirm("Supprimer cet employé ?")) {
            await deleteEmployee(selectedEmployeeId);
            const newEmployees = employees.filter(e => e.id !== selectedEmployeeId);
            setLocalEmployees(newEmployees);
            if (newEmployees.length > 0) setSelectedEmployeeId(newEmployees[0].id);
            else setSelectedEmployeeId(null);
        }
    };

    // --- HELPERS ---
    
    /**
     * Calculate base salary for a specific month based on history
     * Returns the salary that was effective at the start of the given month
     */
    const getBaseSalaryForMonth = (emp: StaffMember, monthKey: string): number => {
        if (!emp.history || emp.history.length === 0) {
            return emp.contract?.baseSalary || 0;
        }

        // Parse month key (e.g., "JANVIER_2025")
        const [monthName, yearStr] = monthKey.split('_');
        const year = parseInt(yearStr);
        const monthIndex = MONTHS.indexOf(monthName);
        
        if (monthIndex === -1) {
            return emp.contract?.baseSalary || 0;
        }

        // Get the first day of the month
        const monthStartDate = new Date(year, monthIndex, 1);
        
        // Sort history by date (oldest first)
        const sortedHistory = [...emp.history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Find the last salary change that occurred before or on the first day of this month
        let effectiveSalary = emp.contract?.baseSalary || 0;
        
        for (const event of sortedHistory) {
            const eventDate = new Date(event.date);
            // Only consider AUGMENTATION or EMBAUCHE events
            if ((event.type === "AUGMENTATION" || event.type === "EMBAUCHE") && eventDate <= monthStartDate) {
                effectiveSalary = event.amount || effectiveSalary;
            }
        }
        
        return effectiveSalary;
    };

    const getMonthlyData = (emp: StaffMember) => {
        // Find latest undeclared bonus from history
        let latestBonus = 0;
        if (emp.history && emp.history.length > 0) {
            const sortedHistory = [...emp.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            latestBonus = sortedHistory[0]?.undeclaredBonus || 0;
        }

        // Read with Year Key (Migration friendly)
        const key = `${currentMonth}_${currentYear}`;
        const legacyKey = currentMonth;

        // Default Jours rule: 0 starting 2026, 26 before.
        const defaultJours = currentYear >= 2026 ? 0 : 26;

        // Auto-calculate Prorated Bonus for default state
        let defaultPRegul = latestBonus;
        if (latestBonus > 0) {
            const prorated = defaultJours < 26 ? (latestBonus * defaultJours / 26) : latestBonus;
            defaultPRegul = Math.round(prorated * 100) / 100;
        }

        return emp.monthlyData?.[key] || emp.monthlyData?.[legacyKey] || {
            jours: defaultJours,
            hSup: 0,
            pRegul: defaultPRegul,
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
        const monthKey = `${currentMonth}_${currentYear}`;
        // Use dynamic base salary based on month and history
        const base = getBaseSalaryForMonth(emp, monthKey);
        const dailyRate = base / 26;
        const hourlyRate = dailyRate / 8;
        const proratedBase = dailyRate * data.jours;
        // Formula: Prorated Base + H.Sup + Regul + Occas - Avances - Deduction - Virement
        return proratedBase + (data.hSup * hourlyRate) + data.pRegul + data.pOccas - data.avances - data.monthlyDeduction - data.virement;
    };

    const getSeniorityRate = (emp: StaffMember) => {
        if (!emp.contract?.hireDate) return 0;
        const start = new Date(emp.contract.hireDate);
        const end = emp.contract?.exitDate && emp.contract.exitDate !== "-" ? new Date(emp.contract.exitDate) : new Date();

        let years = end.getFullYear() - start.getFullYear();
        if (end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())) {
            years--;
        }

        if (years >= 25) return 0.25;
        if (years >= 20) return 0.20;
        if (years >= 12) return 0.15;
        if (years >= 5) return 0.10;
        if (years >= 2) return 0.05;
        return 0;
    };

    const calculateIR = (netImposable: number, childrenCount: number, situationFamiliale: string) => {
        // Moroccan IR Scale 2025 (Monthly)
        let rate = 0;
        let deduction = 0;

        if (netImposable <= 3333.33) { rate = 0; deduction = 0; }
        else if (netImposable <= 5000) { rate = 0.10; deduction = 333.33; }
        else if (netImposable <= 6666.67) { rate = 0.20; deduction = 833.33; }
        else if (netImposable <= 8333.33) { rate = 0.30; deduction = 1500; }
        else if (netImposable <= 15000) { rate = 0.34; deduction = 1833.33; }
        else { rate = 0.37; deduction = 2283.33; }

        let irBrut = Math.max(0, (netImposable * rate) - deduction);

        // Family Relief 2025: 41.67 MAD per dependent (Spouse + Children), max 6 dependents
        const dependents = (situationFamiliale === 'Marié' || situationFamiliale === 'Marié(e)') ? 1 : 0;
        const totalDependents = dependents + Math.min(childrenCount, dependents ? 5 : 6);
        const familyRelief = totalDependents * 41.67;

        return Math.max(0, irBrut - familyRelief);
    };


    const getForwardAccountingNet = (gross: number, emp: StaffMember) => {
        const cnssBase = Math.min(gross, 6000);
        const cnss = cnssBase * 0.0448;
        const amo = gross * 0.0226;

        const fraisPro = Math.min(gross * 0.20, 2500);
        const netImposable = Math.max(0, gross - cnss - amo - fraisPro);
        const ir = calculateIR(netImposable, emp.childrenCount || 0, emp.situationFamiliale || "");

        return gross - cnss - amo - ir;
    };

    const solveGrossFromNet = (targetNet: number, emp: StaffMember) => {
        if (targetNet <= 0) return 0;

        let low = targetNet;
        let high = targetNet * 2; // Safe upper bound for Moroccan taxes
        let iterations = 0;

        while (high - low > 0.01 && iterations < 50) {
            let mid = (low + high) / 2;
            let net = getForwardAccountingNet(mid, emp);
            if (net < targetNet) low = mid;
            else high = mid;
            iterations++;
        }
        return (low + high) / 2;
    };

    const calculateCompta = (emp: StaffMember) => {
        const data = getMonthlyData(emp);
        const monthKey = `${currentMonth}_${currentYear}`;
        // Use dynamic base salary based on month and history
        const baseTarget = getBaseSalaryForMonth(emp, monthKey);
        const referenceDays = data.jours; // Use actual days from Saisie
        const totalHours = referenceDays * 8;

        // 1. Solve for Gross that gives this Net (prorated by days)
        const targetNetForDays = (baseTarget * referenceDays) / 26;
        const totalGross = solveGrossFromNet(targetNetForDays, emp);

        // 2. Breakdown that Gross into Base and Seniority
        const seniorityRate = getSeniorityRate(emp);
        const accountingBase = totalGross / (1 + seniorityRate);
        const seniorityAmount = totalGross - accountingBase;

        // 3. Recalculate components for display
        const cnssBase = Math.min(totalGross, 6000);
        const cnss = cnssBase * 0.0448;
        const amo = totalGross * 0.0226;
        const fraisPro = Math.min(totalGross * 0.20, 2500);
        const netImposable = Math.max(0, totalGross - cnss - amo - fraisPro);
        const ir = calculateIR(netImposable, emp.childrenCount || 0, emp.situationFamiliale || "");

        const hourlyRate = totalHours > 0 ? accountingBase / totalHours : 0;

        return {
            brut: totalGross,
            baseImposable: totalGross,
            netImposable,
            cnss,
            amo,
            ir,
            salaireNet: totalGross - cnss - amo - ir,
            accountingBase,
            seniorityAmount,
            seniorityRate,
            hours: totalHours,
            days: referenceDays,
            hourlyRate
        };


    };

    const handleExportExcel = () => {
        const dataToExport = sortedEmployees.map(emp => {
            const mData = getMonthlyData(emp);
            const netAtPay = calculateNet(emp);
            const compta = calculateCompta(emp);

            if (journalSubView === "SAISIE") {
                const monthKey = `${currentMonth}_${currentYear}`;
                const baseSalaryForMonth = getBaseSalaryForMonth(emp, monthKey);
                return {
                    "Matricule": emp.matricule || `M00${emp.id}`,
                    "Salarié": `${emp.lastName.toUpperCase()} ${emp.firstName}`,
                    "Net Cible": baseSalaryForMonth,
                    "Jours": mData.jours,
                    "H. Sup": mData.hSup,
                    "P. Régul": mData.pRegul || 0,
                    "P. Occas": mData.pOccas || 0,
                    "Virement": mData.virement || 0,
                    "Avances": mData.avances || 0,
                    "Retenue Prêt": mData.monthlyDeduction || 0,
                    "Net à Payer": netAtPay
                };
            } else {
                if (emp.declarationStatus === "ND") return null;
                const monthKey = `${currentMonth}_${currentYear}`;
                const baseSalaryForMonth = getBaseSalaryForMonth(emp, monthKey);
                return {
                    "Matricule": emp.matricule || `M00${emp.id}`,
                    "Salarié": `${emp.lastName.toUpperCase()} ${emp.firstName}`,
                    "Net Cible": baseSalaryForMonth,
                    "Nb Jours": compta.days,
                    "Heures": Math.round(compta.hours),
                    "Taux H": compta.hourlyRate,
                    "Ancienneté": compta.seniorityAmount,
                    "Brut": compta.brut,
                    "Brut Imp.": compta.baseImposable,
                    "Net Imp.": compta.netImposable,
                    "CNSS": compta.cnss,
                    "AMO": compta.amo,
                    "IR": compta.ir,
                    "Salaire Net": compta.salaireNet
                };
            }
        }).filter(Boolean);

        const ws: any = XLSX.utils.json_to_sheet(dataToExport as any[]);

        // Define Column Widths and Styles
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const colWidths: any[] = [];

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const header = ws[XLSX.utils.encode_col(C) + 1]?.v;
            // Wider columns for Salarié and Monetary fields
            if (header === "Salarié") colWidths.push({ wch: 30 });
            else if (["Net Cible", "Net à Payer", "Salaire Net", "Ancienneté", "Brut", "Brut Imp.", "Net Imp."].includes(header)) colWidths.push({ wch: 15 });
            else colWidths.push({ wch: 10 });

            for (let R = range.s.r; R <= range.e.r; ++R) {
                const address = XLSX.utils.encode_col(C) + (R + 1);
                const cell = ws[address];
                if (!cell) continue;

                // Base style
                cell.s = {
                    font: { name: "Arial", sz: 12 },
                    alignment: { vertical: "center", horizontal: "center" }
                };

                // Header Style (Ligne 1)
                if (R === 0) {
                    cell.s.font = { bold: true, color: { rgb: "FF0000" }, sz: 14 };
                } else {
                    // Monetary fields detection
                    const isMonetary = ["Net Cible", "P. Régul", "P. Occas", "Virement", "Avances", "Retenue Prêt", "Net à Payer",
                        "Ancienneté", "Brut", "Brut Imp.", "Net Imp.", "CNSS", "AMO", "IR", "Salaire Net"].includes(header);

                    if (isMonetary) {
                        cell.s.alignment.horizontal = "right";
                        cell.z = '#,##0.00';
                    }

                    // Special for Salaire Net
                    if (header === "Salaire Net") {
                        cell.s.font = { bold: true, color: { rgb: "0000FF" } };
                    }
                }
            }
        }

        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();


        XLSX.utils.book_append_sheet(wb, ws, journalSubView);

        const fileName = `Journal_Paye_${journalSubView}_${currentMonth}_${currentYear}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const totals = useMemo(() => {
        const monthKey = `${currentMonth}_${currentYear}`;
        return localEmployees.reduce((acc, emp) => {
            const mData = getMonthlyData(emp);
            const net = calculateNet(emp);
            const compta = calculateCompta(emp);
            // Use dynamic base salary for this month
            const baseSalaryForMonth = getBaseSalaryForMonth(emp, monthKey);
            return {
                netCible: acc.netCible + baseSalaryForMonth,
                virement: acc.virement + (mData.virement || 0),
                avances: acc.avances + (mData.avances || 0),
                retenuePret: acc.retenuePret + (mData.monthlyDeduction || 0),
                netPayer: acc.netPayer + net,
                // Compta Totals
                brut: acc.brut + compta.brut,
                brutImposable: acc.brutImposable + compta.baseImposable,
                netImposable: acc.netImposable + compta.netImposable,
                cnss: acc.cnss + compta.cnss,
                amo: acc.amo + compta.amo,
                ir: acc.ir + compta.ir,
                salaireNet: acc.salaireNet + compta.salaireNet
            };
        }, {
            netCible: 0, virement: 0, avances: 0, retenuePret: 0, netPayer: 0,
            brut: 0, brutImposable: 0, netImposable: 0, cnss: 0, amo: 0, ir: 0, salaireNet: 0
        });
    }, [localEmployees, currentMonth, currentYear]);

    // --- CLOSING LOGIC ---
    const isMonthClosed = useMemo(() => {
        const key = `${currentMonth}_${currentYear}`;
        return localEmployees.some(e => e.monthlyData?.[key]?.isClosed);
    }, [localEmployees, currentMonth, currentYear]);

    const handleCloseMonthToggle = async () => {
        const key = `${currentMonth}_${currentYear}`;
        if (isMonthClosed) {
            if (confirm("Attention: La réouverture du mois supprimera les transactions financières générées. Voulez-vous continuer ?")) {
                await unclosePayrollMonth(key);
                // Refresh
                const emps = await getEmployees();
                setLocalEmployees(emps);
            }
        } else {
            if (confirm(`Confirmez-vous la clôture de ${currentMonth} ${currentYear} ?\n\n- Les paiements seront verrouillés.\n- Les retenues sur prêt seront appliquées sur la dette.\n- Les transactions financières (Banque/Caisse/Coffre) seront générées.\n- Le mois suivant sera initialisé.`)) {
                // Calculate Next Month Key
                const currentIdx = MONTHS.indexOf(currentMonth);
                let nextMonthName = "";
                let nextYearVal = currentYear;

                if (currentIdx === 11) {
                    nextMonthName = MONTHS[0];
                    nextYearVal = currentYear + 1;
                } else {
                    nextMonthName = MONTHS[currentIdx + 1];
                }
                const nextKey = `${nextMonthName}_${nextYearVal}`;

                await closePayrollMonth(key, nextKey, localEmployees, totals);
                // Refresh
                const emps = await getEmployees();
                setLocalEmployees(emps);
            }
        }
    };

    const getYearSuffix = (dateStr?: string) => {
        if (!dateStr) return "00";
        return dateStr.split('-')[0].slice(-2);
    };

    const handleAddHistory = async () => {
        if (!selectedEmployee || !newHistoryDate) return;
        const newHistory = {
            date: newHistoryDate,
            amount: Number(newHistoryAmount),
            bonus: Number(newHistoryBonus),
            undeclaredBonus: Number(newHistoryUndeclaredBonus),
            type: newHistoryType,
            year: newHistoryDate.split('-')[0],
        };

        let updatedHistory: any[];
        if (editingHistoryIndex !== null) {
            updatedHistory = [...(selectedEmployee.history || [])];
            updatedHistory[editingHistoryIndex] = newHistory;
        } else {
            // Check if we need to secure the "EMBAUCHE" state before adding the first augmentation
            const currentHistory = selectedEmployee.history || [];
            const hasEmbauche = currentHistory.some(h => h.type === "EMBAUCHE");

            if (!hasEmbauche && currentHistory.length === 0) {
                // Create Snapshot of the current state as "EMBAUCHE"
                const snapshotEmbauche = {
                    date: selectedEmployee.contract?.hireDate || new Date().toISOString().split('T')[0],
                    amount: selectedEmployee.contract?.baseSalary || 0,
                    bonus: 0,
                    undeclaredBonus: 0,
                    type: "EMBAUCHE",
                    year: (selectedEmployee.contract?.hireDate || new Date().toISOString()).split('-')[0]
                };
                updatedHistory = [snapshotEmbauche, newHistory];
            } else {
                updatedHistory = [...currentHistory, newHistory];
            }
        }

        // Find the chronologically latest event in the updated history
        const latestEvent = [...updatedHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const latestBonus = latestEvent?.undeclaredBonus || 0;

        // Current Month Key
        const currentKey = `${currentMonth}_${currentYear}`;

        const currentMData = selectedEmployee.monthlyData?.[currentKey] || getMonthlyData(selectedEmployee);
        let newMData = { ...currentMData };

        // Only update if month is NOT closed
        if (!currentMData.isClosed && latestEvent) {
            const days = currentMData.jours;
            // Prorata rule
            const prorated = days < 26 ? (latestBonus * days / 26) : latestBonus;
            newMData.pRegul = Math.round(prorated * 100) / 100;
        }

        // IMPORTANT: Do NOT update contract.baseSalary here
        // The baseSalary should remain as the latest salary for reference,
        // but calculations will use getBaseSalaryForMonth() which respects dates
        // Only update baseSalary if this is the latest event chronologically
        const allHistorySorted = [...updatedHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const absoluteLatest = allHistorySorted[0];
        
        const updatedEmployee = {
            ...selectedEmployee,
            history: updatedHistory,
            contract: {
                ...selectedEmployee.contract,
                // Only update baseSalary if this is the absolute latest event (for display purposes)
                // But actual calculations will use getBaseSalaryForMonth() for each month
                baseSalary: absoluteLatest && (absoluteLatest.type === "AUGMENTATION" || absoluteLatest.type === "EMBAUCHE") 
                    ? absoluteLatest.amount 
                    : selectedEmployee.contract?.baseSalary
            },
            monthlyData: {
                ...selectedEmployee.monthlyData,
                [currentKey]: newMData
            }
        };

        // Update local state
        setLocalEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));

        // Persist
        try {
            await employeeMutation.mutateAsync(updatedEmployee);
        } catch (err) {
            console.error("Failed to add/update history event:", err);
        }

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
        setNewHistoryBonus(event.bonus ?? 0);
        setNewHistoryUndeclaredBonus(event.undeclaredBonus ?? 0);
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
        const key = `${currentMonth}_${currentYear}`;
        const emp = localEmployees.find(e => e.id === empId);
        const mData = emp?.monthlyData?.[key];
        
        // Prevent modification of closed months
        if (mData?.isClosed) {
            alert("Ce mois est clôturé. Veuillez le réouvrir avant de le modifier.");
            return;
        }

        setLocalEmployees(prev => prev.map(emp => {
            if (emp.id === empId) {
                const currentData = getMonthlyData(emp);
                let updates: any = { [field]: value };

                // Auto-calculate Prorated Bonus if 'jours' changes
                if (field === 'jours') {
                    // Find latest undeclared bonus from history
                    let latestBonus = 0;
                    if (emp.history && emp.history.length > 0) {
                        const sortedHistory = [...emp.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        latestBonus = sortedHistory[0]?.undeclaredBonus || 0;
                    }

                    if (latestBonus > 0) {
                        const days = Number(value);
                        // Prorata based on 26 days. If days >= 26, full bonus.
                        const prorated = days < 26 ? (latestBonus * days / 26) : latestBonus;
                        updates.pRegul = Math.round(prorated * 100) / 100; // Round to 2 decimals
                    }
                }

                const updatedEmp = {
                    ...emp,
                    monthlyData: {
                        ...emp.monthlyData,
                        [key]: { ...currentData, ...updates }
                    }
                };

                // Persist immediately using mutation
                employeeMutation.mutateAsync(updatedEmp).catch(err => console.error("Auto-save failed:", err));

                return updatedEmp;
            }
            return emp;
        }));
    };

    const handleEmployeeChange = (empId: number, path: string, value: any) => {
        setLocalEmployees(prev => prev.map(emp => {
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
                    <div className="flex items-center gap-0">
                        <div className="w-[356px] text-2xl font-black text-slate-800 tracking-tight">Paye</div>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <button
                                onClick={() => { setViewMode("JOURNAL"); setJournalSubView("SAISIE"); }}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                    (viewMode === "JOURNAL" && journalSubView === "SAISIE") ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                SAISIE
                            </button>
                            <button
                                onClick={() => { setViewMode("JOURNAL"); setJournalSubView("COMPTABLE"); }}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                    (viewMode === "JOURNAL" && journalSubView === "COMPTABLE") ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                COMPTA
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

                    <div className="relative flex items-center gap-2" ref={datePickerRef}>
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                            className={cn(
                                "flex items-center gap-4 bg-white border border-slate-200 px-6 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-all group",
                                isDatePickerOpen && "ring-4 ring-blue-50 border-blue-200"
                            )}
                        >
                            <CalendarIcon className={cn("w-4 h-4 transition-colors", isDatePickerOpen ? "text-blue-600" : "text-slate-400")} />
                            <div className="flex flex-col items-center min-w-[120px] select-none">
                                <span className="text-[13px] font-black text-slate-800 uppercase tracking-widest leading-none mb-1">
                                    {currentMonth} <span className="text-blue-600/50">{currentYear}</span>
                                </span>
                                <div className={cn("h-0.5 w-10 bg-blue-600 rounded-full transition-all", isDatePickerOpen ? "w-16" : "w-10")} />
                            </div>
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isDatePickerOpen ? "rotate-180 text-blue-600" : "rotate-0")} />
                        </button>

                        <button
                            onClick={handleNextMonth}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Smart Popover */}
                        {isDatePickerOpen && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                                    <button onClick={() => setCurrentYear(prev => prev - 1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                        <ChevronLeft className="w-5 h-5 text-slate-400" />
                                    </button>
                                    <span className="text-xl font-black text-slate-800 tracking-tighter">{currentYear}</span>
                                    <button onClick={() => setCurrentYear(prev => prev + 1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {MONTHS.map(m => (
                                        <button
                                            key={m}
                                            onClick={() => {
                                                setCurrentMonth(m);
                                                setIsDatePickerOpen(false);
                                            }}
                                            className={cn(
                                                "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                currentMonth === m
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                                                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                            )}
                                        >
                                            {m.substring(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-orange-500 hover:border-orange-100 transition-all shadow-sm">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reset Futurs
                        </button>
                        <button
                            onClick={handleCloseMonthToggle}
                            className={cn(
                                "flex items-center gap-2 px-8 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-200/50",
                                isMonthClosed
                                    ? "bg-slate-800 hover:bg-slate-700 text-orange-500"
                                    : "bg-[#2D3748] hover:bg-slate-700 text-white"
                            )}
                        >
                            {isMonthClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {isMonthClosed ? "Réouvrir Mois" : "Clôturer Mois"}
                        </button>

                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Excel
                        </button>
                    </div>

                </div>

                {/* === MAIN CONTENT AREA === */}
                <div className="flex-1 overflow-hidden relative">

                    {/* JOURNAL VIEW */}
                    {viewMode === "JOURNAL" && (
                        <div className="h-full p-6 animate-in fade-in duration-500">
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden h-full flex flex-col">
                                {/* Table Header */}
                                {/* Table Header */}
                                {journalSubView === "SAISIE" ? (
                                    <div className="bg-[#2C3E50] text-[#7F8C8D] h-12 flex items-center px-4 shrink-0 font-black text-[12px] uppercase tracking-wider border-b border-slate-700">

                                        <div className="w-[3.5%] text-white">Matr</div>
                                        <div className="w-[13.5%] text-white border-r border-[#34495E]">Salarié</div>
                                        <div className="w-[7.5%] text-center text-[#2ECC71]">Net Cible</div>
                                        <div className="w-[10%] text-center text-white border-r border-[#34495E]">Mois / Année</div>
                                        <div className="w-[7%] text-center text-white">Jours</div>
                                        <div className="w-[7%] text-center text-white">H. Sup</div>
                                        <div className="w-[8%] text-center text-white">P. Régul</div>
                                        <div className="w-[8%] text-center text-white border-r border-[#34495E]">P. Occas</div>
                                        <div className="w-[7%] text-center text-[#F39C12]">Virement</div>
                                        <div className="w-[7%] text-center text-[#F39C12]">Avances</div>
                                        <div className="w-[8%] text-center text-[#F39C12] border-r border-[#34495E]">Retenue Prêt</div>
                                        <div className="w-[8%] text-right text-white">Net à Payer</div>
                                        <div className="w-[5%] text-center text-[#2ECC71]">Payé</div>
                                    </div>
                                ) : (
                                    <div className="bg-[#A67C00] text-white h-12 flex items-stretch px-4 shrink-0 font-black text-[11px] uppercase tracking-wider border-b border-[#8C6900]">

                                        <div className="w-[5%] flex items-center">Matr.</div>
                                        <div className="w-[14%] flex items-center border-r border-[#8C6900]">Salarié</div>
                                        <div className="w-[8%] flex items-center justify-center">Net Cible</div>
                                        <div className="w-[5%] flex items-center justify-center">Nb Jours</div>
                                        <div className="w-[5%] flex items-center justify-center">Heures</div>
                                        <div className="w-[5%] flex items-center justify-center border-r border-[#8C6900]/30">Taux H</div>
                                        <div className="w-[6%] flex items-center justify-center">Ancien.</div>
                                        <div className="w-[7%] flex items-center justify-center">Brut</div>
                                        <div className="w-[8%] flex items-center justify-center">Brut Imp.</div>
                                        <div className="w-[8%] flex items-center justify-center border-r border-[#8C6900]/30">Net Imp.</div>
                                        <div className="w-[6%] flex items-center justify-center">CNSS</div>
                                        <div className="w-[6%] flex items-center justify-center">AMO</div>
                                        <div className="w-[6%] flex items-center justify-center border-r border-[#8C6900]/30">IR</div>

                                        <div className="w-[11%] flex items-center justify-end pr-4">Salaire Net</div>
                                    </div>
                                )}

                                {/* Table Body */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-200">
                                    {sortedEmployees.map(emp => {
                                        const mData = getMonthlyData(emp);
                                        const netPayer = calculateNet(emp);

                                        // Filter ND employees in COMPTABLE view
                                        if (journalSubView === "COMPTABLE" && emp.declarationStatus === "ND") return null;

                                        return (
                                            <div
                                                key={emp.id}
                                                onClick={() => setSelectedEmployeeId(emp.id)}
                                                className={cn(
                                                    "flex items-center h-9 px-4 transition-colors group cursor-pointer relative",
                                                    selectedEmployeeId === emp.id ? "bg-slate-200 ring-1 ring-inset ring-[#2C3E50] z-10" : ""
                                                )}
                                            >

                                                {journalSubView === "SAISIE" ? (
                                                    <>
                                                        {/* Matr */}
                                                        <div className="w-[3.5%] flex items-center gap-1.5 h-full">
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{emp.matricule || `M00${emp.id}`}</div>
                                                            <div className={cn(
                                                                "w-1.5 h-1.5 rounded-full shrink-0",
                                                                emp.gender === 'H' || emp.gender === 'M' || emp.gender === 'Male' ? "bg-blue-400" : "bg-red-400"
                                                            )} />
                                                        </div>

                                                        {/* Salarié */}
                                                        <div className="w-[13.5%] flex items-center pr-2 h-full border-r border-[#2C3E50]/20">

                                                            <div className="flex items-center min-w-0">
                                                                <div className="text-[12px] font-black text-slate-800 leading-none truncate">
                                                                    <span className="uppercase">{emp.lastName}</span> <span className="capitalize">{emp.firstName.toLowerCase()}</span>
                                                                </div>
                                                                {emp.declarationStatus === "ND" && (
                                                                    <span className={cn(
                                                                        "text-[8px] font-black uppercase tracking-widest px-1 py-px rounded-[3px] border leading-none ml-2 shrink-0",
                                                                        emp.gender === "F"
                                                                            ? "bg-red-50 text-red-600 border-red-100"
                                                                            : "bg-blue-50 text-blue-600 border-blue-100"
                                                                    )}>
                                                                        ND
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="w-[7.5%] text-center text-[13px] font-black text-slate-700">
                                                            {getBaseSalaryForMonth(emp, `${currentMonth}_${currentYear}`).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[11px] font-black opacity-70">Dh</span>
                                                        </div>

                                                        {/* Mois / Année */}
                                                        <div className="w-[10%] text-center text-[12px] font-black text-black uppercase tracking-tight border-r border-[#2C3E50]/20 h-full flex items-center justify-center">
                                                            {currentMonth.substring(0, 3)} {currentYear}
                                                        </div>

                                                        {/* Jours */}
                                                        <div className="w-[7%] flex justify-center">
                                                            <div className="flex items-center transition-all w-full max-w-[60px]">
                                                                <PayrollInput
                                                                    id={`input-jours-${emp.id}`}
                                                                    value={mData.jours}
                                                                    onChange={(v) => updateMonthlyValue(emp.id, 'jours', v)}
                                                                    onIncrement={() => updateMonthlyValue(emp.id, 'jours', mData.jours + 0.5)}
                                                                    onDecrement={() => updateMonthlyValue(emp.id, 'jours', Math.max(0, mData.jours - 0.5))}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Tab" && !e.shiftKey) {
                                                                            e.preventDefault();
                                                                            document.getElementById(`input-hsup-${emp.id}`)?.focus();
                                                                        }
                                                                    }}
                                                                    className={cn("w-12", mData.jours !== 26 ? "text-green-600 font-black" : "text-black")}
                                                                    disabled={isMonthClosed}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* H. Sup */}
                                                        <div className="w-[7%] flex justify-center">
                                                            <div className="flex items-center transition-all w-full max-w-[60px]">
                                                                <PayrollInput
                                                                    id={`input-hsup-${emp.id}`}
                                                                    value={mData.hSup}
                                                                    onChange={(v) => updateMonthlyValue(emp.id, 'hSup', v)}
                                                                    onIncrement={() => updateMonthlyValue(emp.id, 'hSup', mData.hSup + 1)}
                                                                    onDecrement={() => updateMonthlyValue(emp.id, 'hSup', Math.max(0, mData.hSup - 1))}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Tab" && !e.shiftKey) {
                                                                            e.preventDefault();
                                                                            document.getElementById(`input-avances-${emp.id}`)?.focus();
                                                                        }
                                                                    }}
                                                                    className={cn("w-10", mData.hSup !== 0 ? "text-green-600 font-black" : "text-black")}
                                                                    disabled={isMonthClosed}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* P. Régul */}
                                                        <div className="w-[8%] flex justify-center h-full items-center">
                                                            <div className="w-full max-w-[70px]">
                                                                <PayrollInput
                                                                    value={mData.pRegul || 0}
                                                                    onChange={(v) => updateMonthlyValue(emp.id, 'pRegul', v)}
                                                                    isCurrency={true}
                                                                    className={cn(mData.pRegul ? "text-green-600 font-black" : "text-black")}
                                                                    disabled={isMonthClosed}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* P. Occas */}
                                                        <div className="w-[8%] flex justify-center border-r border-[#2C3E50]/20 h-full items-center">
                                                            <div className="w-full max-w-[70px]">
                                                                <PayrollInput
                                                                    value={mData.pOccas || 0}
                                                                    onChange={(v) => updateMonthlyValue(emp.id, 'pOccas', v)}
                                                                    isCurrency={true}
                                                                    className={cn(mData.pOccas ? "text-green-600 font-black" : "text-black")}
                                                                    disabled={isMonthClosed}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Virement */}
                                                        <div className="w-[7%] flex justify-center h-full items-center">
                                                            <div className="w-full max-w-[70px]">
                                                                <PayrollInput
                                                                    value={mData.virement || 0}
                                                                    onChange={(v) => updateMonthlyValue(emp.id, 'virement', v)}
                                                                    isCurrency={true}
                                                                    className="text-[#F39C12]"
                                                                    disabled={isMonthClosed}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Avances */}
                                                        <div className="w-[7%] flex justify-center">
                                                            <div className="w-full max-w-[70px]">
                                                                <PayrollInput
                                                                    id={`input-avances-${emp.id}`}
                                                                    value={mData.avances || 0}
                                                                    onChange={(v) => updateMonthlyValue(emp.id, 'avances', v)}
                                                                    isCurrency={true}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Tab" && !e.shiftKey) {
                                                                            e.preventDefault();
                                                                            document.getElementById(`input-jours-${emp.id}`)?.focus();
                                                                        }
                                                                    }}
                                                                    className="text-[#F39C12]"
                                                                    disabled={isMonthClosed}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Retenue Prêt */}
                                                        <div className="w-[8%] flex flex-col items-center justify-center border-r border-[#2C3E50]/20 h-full py-0.5">
                                                            <div className="w-full max-w-[70px]">
                                                                <PayrollInput
                                                                    value={mData.monthlyDeduction || 0}
                                                                    onChange={(v) => updateMonthlyValue(emp.id, 'monthlyDeduction', v)}
                                                                    isCurrency={true}
                                                                    className="text-[#F39C12]"
                                                                    disabled={isMonthClosed}
                                                                />
                                                            </div>
                                                            {(() => {
                                                                const projected = isMonthClosed
                                                                    ? (emp.creditInfo?.remaining || 0)
                                                                    : ((emp.creditInfo?.remaining || 0) - (mData.monthlyDeduction || 0));

                                                                return projected > 0 && (
                                                                    <div className="text-[9px] font-bold bg-orange-500 text-white px-1.5 py-px rounded mt-0.5 shadow-sm">
                                                                        {projected.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="opacity-70 text-[8px]">Dh</span>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Net à Payer */}
                                                        <div className="w-[8%] text-right">
                                                            <div className="text-[14px] font-black text-black">
                                                                {netPayer.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                        </div>

                                                        {/* Payé */}
                                                        <div className="w-[5%] flex justify-center">
                                                            <button
                                                                onClick={() => updateMonthlyValue(emp.id, 'isPaid', !mData.isPaid)}
                                                                className={cn(
                                                                    "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                                                    isMonthClosed
                                                                        ? "opacity-50 cursor-not-allowed " + (mData.isPaid ? "bg-green-500 border-green-500 text-white" : "border-slate-200")
                                                                        : mData.isPaid
                                                                            ? "bg-green-500 border-green-500 text-white"
                                                                            : "border-slate-200 hover:border-green-400 group-hover:bg-slate-50"
                                                                )}
                                                                disabled={isMonthClosed}
                                                            >
                                                                {mData.isPaid && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-stretch h-16 w-full px-4 transition-colors">
                                                        {/* Matr */}
                                                        <div className="w-[5%] flex items-center gap-1.5 h-full">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{emp.matricule || `M00${emp.id}`}</span>
                                                            <div className={cn(
                                                                "w-1.5 h-1.5 rounded-full shrink-0",
                                                                emp.gender === 'H' || emp.gender === 'M' || emp.gender === 'Male' ? "bg-blue-400" : "bg-red-400"
                                                            )} />
                                                        </div>

                                                        {/* Salarié */}
                                                        <div className="w-[14%] flex items-center gap-3 pr-2 h-full border-r border-[#A67C00]/40">
                                                            <div className="w-8 h-8 rounded-full bg-[#FDF6E3] text-[#A67C00] border border-[#F0E6D2] flex items-center justify-center font-black text-[11px] shrink-0">
                                                                {emp.lastName[0]}{emp.firstName[0]}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-[12px] font-black text-slate-800 leading-none mb-1 truncate">
                                                                    <span className="uppercase">{emp.lastName}</span> <span className="capitalize">{emp.firstName.toLowerCase()}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Net Cible */}
                                                        <div className="w-[8%] flex items-center justify-center text-[12px] font-bold text-slate-600">
                                                            {getBaseSalaryForMonth(emp, `${currentMonth}_${currentYear}`).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>

                                                        {/* Jours */}
                                                        <div className="w-[5%] flex items-center justify-center text-[12px] font-bold text-slate-800">
                                                            {calculateCompta(emp).days}
                                                        </div>

                                                        {/* Heures */}
                                                        <div className="w-[5%] flex items-center justify-center text-[12px] font-bold text-slate-600">
                                                            {Math.round(calculateCompta(emp).hours)}
                                                        </div>

                                                        {/* Taux H */}
                                                        <div className="w-[5%] flex items-center justify-center text-[12px] font-bold text-slate-600 border-r border-[#A67C00]/60 h-full">
                                                            {calculateCompta(emp).hourlyRate.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>


                                                        {/* Ancienneté */}
                                                        <div className="w-[6%] flex items-center justify-center text-[12px] font-bold text-blue-600">
                                                            {calculateCompta(emp).seniorityAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>

                                                        {/* Brut */}
                                                        <div className="w-[7%] flex items-center justify-center text-[11px] font-bold text-slate-500">
                                                            {calculateCompta(emp).brut.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>

                                                        {/* Brut Imp */}
                                                        <div className="w-[8%] flex items-center justify-center text-[11px] font-bold text-slate-400">
                                                            {calculateCompta(emp).baseImposable.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>

                                                        {/* Net Imp */}
                                                        <div className="w-[8%] flex items-center justify-center text-[11px] font-bold text-slate-400 border-r border-[#A67C00]/60 h-full">
                                                            {calculateCompta(emp).netImposable.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>


                                                        {/* CNSS */}
                                                        <div className="w-[6%] flex items-center justify-center text-[11px] font-bold text-slate-400">
                                                            {calculateCompta(emp).cnss.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>

                                                        {/* AMO */}
                                                        <div className="w-[6%] flex items-center justify-center text-[11px] font-bold text-slate-400">
                                                            {calculateCompta(emp).amo.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>

                                                        {/* IR */}
                                                        <div className="w-[6%] flex items-center justify-center text-[11px] font-bold text-slate-400 border-r border-[#A67C00]/60 h-full">
                                                            {calculateCompta(emp).ir.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>


                                                        {/* Salaire Net */}
                                                        <div className="w-[11%] flex items-center justify-end pr-4 text-[13px] font-black text-[#A67C00]">
                                                            {calculateCompta(emp).salaireNet.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] opacity-70">Dh</span>
                                                        </div>

                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Table Footer / Summary */}
                                {journalSubView === "SAISIE" ? (
                                    <div className="h-14 bg-[#2C3E50] border-t border-slate-700 flex items-center px-4 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-10">
                                        {/* Matr - Empty */}
                                        <div className="w-[3.5%]" />
                                        
                                        {/* Salarié */}
                                        <div className="w-[13.5%] flex items-center gap-2 pl-4 border-r border-[#34495E]">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{employees.length} Salaries</span>
                                        </div>

                                        {/* Net Cible Total */}
                                        <div className="w-[7.5%] text-center">
                                            <div className="text-[11px] font-black text-[#2ECC71]">
                                                {totals.netCible.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span className="text-[9px] ml-0.5 opacity-70">Dh</span>
                                            </div>
                                        </div>

                                        {/* Mois / Année - Masse Salariale */}
                                        <div className="w-[10%] text-center border-r border-[#34495E]">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Masse</span>
                                                <div className="text-[11px] font-black text-white">
                                                    {(totals.netPayer + totals.retenuePret + totals.avances + totals.virement).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    <span className="text-[9px] ml-0.5 opacity-70">Dh</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Jours - Empty */}
                                        <div className="w-[7%]" />

                                        {/* H. Sup - Empty */}
                                        <div className="w-[7%]" />

                                        {/* P. Régul - Empty */}
                                        <div className="w-[8%]" />

                                        {/* P. Occas - Empty */}
                                        <div className="w-[8%] border-r border-[#34495E]" />

                                        {/* Virement Total */}
                                        <div className="w-[7%] text-center">
                                            <div className="text-[11px] font-black text-[#F39C12]">
                                                {totals.virement.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span className="text-[9px] ml-0.5 opacity-70">Dh</span>
                                            </div>
                                        </div>

                                        {/* Avances Total */}
                                        <div className="w-[7%] text-center">
                                            <div className="text-[11px] font-black text-[#F39C12]">
                                                {totals.avances.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span className="text-[9px] ml-0.5 opacity-70">Dh</span>
                                            </div>
                                        </div>

                                        {/* Retenue Prêt Total */}
                                        <div className="w-[8%] text-center border-r border-[#34495E]">
                                            <div className="text-[11px] font-black text-[#F39C12]">
                                                {totals.retenuePret.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span className="text-[9px] ml-0.5 opacity-70">Dh</span>
                                            </div>
                                        </div>

                                        {/* Net à Payer Total */}
                                        <div className="w-[8%] text-right pr-4">
                                            <div className="text-[13px] font-black text-white">
                                                {totals.netPayer.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span className="text-[10px] ml-0.5 opacity-70 italic font-medium">Dh</span>
                                            </div>
                                        </div>

                                        {/* Payé - Empty */}
                                        <div className="w-[5%]" />
                                    </div>
                                ) : (
                                    <div className="h-14 bg-[#A67C00] text-white/90 border-t border-[#8C6900] flex items-stretch px-4 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-10">
                                        {/* Matr - Empty */}
                                        <div className="w-[5%]" />
                                        
                                        {/* Salarié */}
                                        <div className="w-[14%] flex items-center gap-2 border-r border-[#8C6900]">
                                            <Users className="w-4 h-4 text-white/70" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{employees.length} Salaries</span>
                                        </div>

                                        {/* Net Cible Total */}
                                        <div className="w-[8%] flex items-center justify-center text-[11px] font-black">
                                            {totals.netCible.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>

                                        {/* Nb Jours - Empty */}
                                        <div className="w-[5%]" />

                                        {/* Heures - Empty */}
                                        <div className="w-[5%]" />

                                        {/* Taux H - Empty */}
                                        <div className="w-[5%] border-r border-[#8C6900]/30" />

                                        {/* Ancienneté - Empty */}
                                        <div className="w-[6%]" />

                                        {/* Brut Total */}
                                        <div className="w-[7%] flex items-center justify-center text-[10px] font-bold opacity-80">
                                            {totals.brut.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>

                                        {/* Brut Imp */}
                                        <div className="w-[8%] flex items-center justify-center text-[10px] font-bold opacity-80">
                                            {totals.brutImposable.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>

                                        {/* Net Imp */}
                                        <div className="w-[8%] flex items-center justify-center text-[10px] font-bold opacity-80 border-r border-[#8C6900]/30">
                                            {totals.netImposable.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>

                                        {/* CNSS */}
                                        <div className="w-[6%] flex items-center justify-center text-[10px] font-bold opacity-80">
                                            {totals.cnss.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>

                                        {/* AMO */}
                                        <div className="w-[6%] flex items-center justify-center text-[10px] font-bold opacity-80">
                                            {totals.amo.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>

                                        {/* IR */}
                                        <div className="w-[6%] flex items-center justify-center text-[10px] font-bold opacity-80 border-r border-[#8C6900]/30">
                                            {totals.ir.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>

                                        {/* Salaire Net */}
                                        <div className="w-[11%] flex items-center justify-end pr-4 text-[13px] font-black text-white">
                                            {totals.salaireNet.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] opacity-70">Dh</span>
                                        </div>
                                    </div>
                                )}
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
                                            {["ACTIFS", "INACTIFS", "TOUS"].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setFilterStatus(f as any)}
                                                    className={cn(
                                                        "flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all",
                                                        filterStatus === f
                                                            ? "bg-slate-800 text-white shadow-md"
                                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
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
                                            <button
                                                onClick={handleAddEmployee}
                                                className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 shadow-md hover:bg-slate-800 hover:text-white hover:scale-105 active:scale-95 transition-all shrink-0"
                                            >
                                                <Plus className="w-5 h-5 stroke-[3px]" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Employee List Items */}
                                    <div ref={sidebarListRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-0 pb-10">
                                        {filteredEmployees.map(emp => {
                                            const isSelected = selectedEmployeeId === emp.id;
                                            return (
                                                <div
                                                    key={emp.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => setSelectedEmployeeId(emp.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            setSelectedEmployeeId(emp.id);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-4 px-6 py-2.5 rounded-none transition-all text-left relative group transition-all duration-300",
                                                        isSelected
                                                            ? cn(
                                                                "bg-blue-50/50 border-l-[6px] shadow-sm",
                                                                emp.contract?.exitDate
                                                                    ? "border-l-slate-400"
                                                                    : emp.gender === "F" ? "border-l-red-600" : "border-l-blue-600"
                                                            )
                                                            : "bg-transparent border-l-[6px] border-l-transparent hover:bg-slate-100/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-[14px] shrink-0 border transition-all",
                                                        isSelected ? "bg-white shadow-sm" : "bg-slate-50 group-hover:bg-white",
                                                        emp.contract?.exitDate
                                                            ? "border-slate-300 text-slate-500"
                                                            : emp.gender === "F" ? "border-red-200 text-red-600" : "border-blue-200 text-blue-600"
                                                    )}>
                                                        {emp.lastName[0]}{emp.firstName[0]}
                                                    </div>

                                                    <div className="flex-1 min-w-0 pr-6">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className={cn(
                                                                    "text-[14px] font-black truncate leading-tight",
                                                                    emp.contract?.exitDate
                                                                        ? "text-slate-500"
                                                                        : emp.gender === "F" ? "text-red-700" : "text-blue-700"
                                                                )}>
                                                                    {emp.lastName} {emp.firstName}
                                                                </span>
                                                                <div className="flex flex-col items-end gap-0.5 shrink-0">
                                                                    <span className="text-[10px] font-black text-slate-400 tracking-widest">
                                                                        {emp.matricule || `M00${emp.id}`}
                                                                    </span>
                                                                    {emp.declarationStatus === "ND" && (
                                                                        <span className={cn(
                                                                            "text-[8px] font-black uppercase tracking-widest px-1 py-px rounded-[3px] border leading-none",
                                                                            emp.gender === "F"
                                                                                ? "bg-red-50 text-red-600 border-red-100"
                                                                                : "bg-blue-50 text-blue-600 border-blue-100"
                                                                        )}>
                                                                            ND
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-0.5">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{emp.role}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="p-4 border-t border-slate-200 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                        {filteredEmployees.length} Salarié{filteredEmployees.length > 1 ? 's' : ''} : <span className="text-blue-600">{filteredEmployees.filter(e => e.gender !== 'F').length} H</span>, <span className="text-red-600">{filteredEmployees.filter(e => e.gender === 'F').length} F</span>
                                    </div>
                                </div>

                                {/* Main Detail Column */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F6F8FC] p-5 flex flex-col gap-10">
                                    {selectedEmployee ? (
                                        <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-8">
                                            {/* Column Left: Infos & Finance (Wrapper Removed here) */}
                                            {/* Profile Header Card */}
                                            <div className="flex items-center gap-8 px-4">
                                                <div className={cn(
                                                    "w-24 h-24 rounded-3xl flex items-center justify-center border shrink-0 relative transition-colors duration-300",
                                                    selectedEmployee.contract?.exitDate
                                                        ? "bg-slate-50 text-slate-400 border-slate-200"
                                                        : selectedEmployee.gender === "F"
                                                            ? "bg-red-50 text-red-600 border-red-100"
                                                            : "bg-blue-50 text-blue-600 border-blue-100"
                                                )}>
                                                    <User className="w-10 h-10 stroke-[2.5px]" />
                                                    {selectedEmployee.contract?.exitDate && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-3xl backdrop-blur-[1px] overflow-visible">
                                                            <X className="w-32 h-32 text-slate-400 stroke-[1.5px] -ml-1 -mt-1" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="mb-4 flex flex-col">
                                                        {isEditing ? (
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-3">
                                                                    <input
                                                                        value={selectedEmployee.lastName}
                                                                        onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'lastName', e.target.value.toUpperCase())}
                                                                        className="text-4xl font-black text-slate-800 tracking-tighter uppercase bg-white border border-slate-200 rounded-xl px-4 py-1 focus:outline-none focus:ring-4 focus:ring-blue-50 w-[300px]"
                                                                        placeholder="NOM"
                                                                    />
                                                                    <input
                                                                        value={selectedEmployee.firstName}
                                                                        onChange={(e) => {
                                                                            // Capitalize first letter
                                                                            const val = e.target.value;
                                                                            const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                                                                            handleEmployeeChange(selectedEmployee.id, 'firstName', capitalized);
                                                                        }}
                                                                        className="text-4xl font-bold text-slate-400 capitalize bg-white border border-slate-200 rounded-xl px-4 py-1 focus:outline-none focus:ring-4 focus:ring-blue-50 w-[300px]"
                                                                        placeholder="Prénom"
                                                                    />

                                                                    <div className="ml-auto flex items-center gap-2">
                                                                        {/* Save Button - Mouse Gray Style (Active) */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleSaveEmployee();
                                                                                setIsEditing(false);
                                                                            }}
                                                                            className="h-10 px-6 rounded-xl bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                                                                        >
                                                                            <Save className="w-4 h-4" />
                                                                            Enregistrer
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[12px] font-black tracking-widest text-slate-300 uppercase shrink-0 ml-1">Matricule:</span>
                                                                    <input
                                                                        value={selectedEmployee.matricule || ""}
                                                                        onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'matricule', e.target.value)}
                                                                        className="text-[12px] font-black tracking-widest text-slate-800 uppercase bg-white border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-none w-24"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-4">
                                                                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase whitespace-nowrap">
                                                                        {selectedEmployee.lastName} <span className="text-slate-400 font-bold capitalize">{selectedEmployee.firstName}</span>
                                                                    </h2>

                                                                    <div className="ml-auto flex items-center gap-3">
                                                                        {/* Delete Employee Button - Red Contrast Style */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${selectedEmployee.lastName} ${selectedEmployee.firstName} ?`)) {
                                                                                    handleDeleteEmployee();
                                                                                }
                                                                            }}
                                                                            className="h-8 px-4 rounded-xl bg-white text-red-500 text-[11px] font-black uppercase tracking-widest border border-red-200 hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center gap-2 group"
                                                                            title="Supprimer l'employé"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                            <span className="hidden group-hover:inline">Supprimer</span>
                                                                        </button>

                                                                        {/* Edit Button - Mouse Gray Style */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setIsEditing(true);
                                                                            }}
                                                                            className="h-8 px-4 rounded-xl bg-slate-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-600 transition-all shadow-sm flex items-center gap-2"
                                                                        >
                                                                            <Edit3 className="w-3.5 h-3.5" />
                                                                            Modifier
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[12px] font-black tracking-widest text-slate-300 uppercase shrink-0 ml-1">Matricule:</span>
                                                                    <span className="text-[12px] font-black tracking-widest text-slate-400 uppercase">{selectedEmployee.matricule || `M00${selectedEmployee.id}`}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-8 mb-4">
                                                        <div className={cn(
                                                            "flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-black shadow-sm",
                                                            selectedEmployee.gender === "F" ? "bg-red-600 text-white shadow-red-100" : "bg-blue-600 text-white shadow-blue-100"
                                                        )}>
                                                            {selectedEmployee.gender === "F" ? "F" : "H"}
                                                        </div>


                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 shrink-0">Poste:</span>
                                                            {isEditing ? (
                                                                <input
                                                                    value={selectedEmployee.role}
                                                                    onChange={(e) => {
                                                                        handleEmployeeChange(selectedEmployee.id, 'role', e.target.value);
                                                                        handleEmployeeChange(selectedEmployee.id, 'contract.post', e.target.value);
                                                                    }}
                                                                    className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-none w-48"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
                                                                        {selectedEmployee.role}
                                                                    </div>
                                                                    {selectedEmployee.declarationStatus === "ND" && (
                                                                        <span className={cn(
                                                                            "px-1.5 py-0.5 rounded-[4px] border text-[9px] font-black uppercase tracking-wider",
                                                                            selectedEmployee.gender === "F"
                                                                                ? "bg-red-100 text-red-600 border-red-200"
                                                                                : "bg-blue-100 text-blue-600 border-blue-200"
                                                                        )}>
                                                                            ND
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Declaration Status Radio - Edit Mode */}
                                                            {isEditing && (
                                                                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                                                    <button
                                                                        onClick={() => handleEmployeeChange(selectedEmployee.id, 'declarationStatus', 'D')}
                                                                        className={cn(
                                                                            "px-2 py-0.5 rounded-md text-[9px] font-black transition-all",
                                                                            (selectedEmployee.declarationStatus || "D") === "D"
                                                                                ? "bg-white text-emerald-600 shadow-sm border border-slate-100"
                                                                                : "text-slate-400 hover:text-slate-600"
                                                                        )}
                                                                    >
                                                                        D
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEmployeeChange(selectedEmployee.id, 'declarationStatus', 'ND')}
                                                                        className={cn(
                                                                            "px-2 py-0.5 rounded-md text-[9px] font-black transition-all",
                                                                            selectedEmployee.declarationStatus === "ND"
                                                                                ? "bg-white text-red-600 shadow-sm border border-slate-100"
                                                                                : "text-slate-400 hover:text-slate-600"
                                                                        )}
                                                                    >
                                                                        ND
                                                                    </button>
                                                                </div>
                                                            )}
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
                                                        {/* Old buttons removed as requested */}
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
                                                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm -mt-3">
                                                        <div className="grid grid-cols-3 gap-y-2 gap-x-12">
                                                            <div>
                                                                <div className="flex items-center gap-4">
                                                                    <Cake className="w-4 h-4 text-slate-400 shrink-0" />
                                                                    <div className="flex-1">
                                                                        {(() => {
                                                                            const calculateAge = (birthDate: string) => {
                                                                                if (!birthDate) return null;
                                                                                const today = new Date();
                                                                                const birthDateObj = new Date(birthDate);
                                                                                let age = today.getFullYear() - birthDateObj.getFullYear();
                                                                                const m = today.getMonth() - birthDateObj.getMonth();
                                                                                if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
                                                                                    age--;
                                                                                }
                                                                                return age;
                                                                            };

                                                                            const age = calculateAge(selectedEmployee.birthDate);

                                                                            return isEditing ? (
                                                                                <DateInput
                                                                                    value={selectedEmployee.birthDate || ""}
                                                                                    onChange={(val) => handleEmployeeChange(selectedEmployee.id, 'birthDate', val)}
                                                                                    className="w-full"
                                                                                />
                                                                            ) : (
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="text-base font-black text-slate-800 tracking-tight">{formatDate(selectedEmployee.birthDate)}</span>
                                                                                    {age !== null && (
                                                                                        <span className={cn(
                                                                                            "text-[10px] font-black px-2 py-0.5 rounded-lg border transition-colors duration-300",
                                                                                            selectedEmployee.contract?.exitDate
                                                                                                ? "bg-slate-50 text-slate-400 border-slate-200"
                                                                                                : selectedEmployee.gender === "F"
                                                                                                    ? "bg-red-50 text-red-600 border-red-100"
                                                                                                    : "bg-blue-50 text-blue-600 border-blue-100"
                                                                                        )}>
                                                                                            {age} ans
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })()}
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

                                                            <div className="border-r border-slate-100 pr-8">
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
                                                            <div className="border-r border-slate-100 pr-8">
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
                                                            <div>
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

                                                            <div className="col-span-3 h-px bg-slate-100 my-1" />

                                                            <div className="col-span-3 flex flex-col pt-0">
                                                                <div className="grid grid-cols-2 gap-8">
                                                                    <div className="border-r border-slate-100 pr-8">
                                                                        <div className="flex items-start gap-4">
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
                                                                    <div>
                                                                        <div className="flex items-start gap-4">
                                                                            <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-1.5" />
                                                                            <div className="flex-1">
                                                                                {isEditing ? (
                                                                                    <textarea
                                                                                        value={selectedEmployee.personalInfo.notes || ""}
                                                                                        onChange={(e) => handleEmployeeChange(selectedEmployee.id, 'personalInfo.notes', e.target.value)}
                                                                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all h-[75px] resize-none overflow-y-auto"
                                                                                        placeholder="Notes particulières..."
                                                                                    />
                                                                                ) : (
                                                                                    <div className="text-[13px] font-bold text-slate-800 leading-relaxed italic opacity-70 whitespace-pre-wrap">
                                                                                        {selectedEmployee.personalInfo.notes || "Aucune note particulière"}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
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
                                                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm -mt-3">
                                                        <div className="grid grid-cols-3 gap-2 mb-4">
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
                                                                        {(() => {
                                                                            const calculateSeniority = () => {
                                                                                const start = selectedEmployee.contract?.hireDate ? new Date(selectedEmployee.contract.hireDate) : new Date();
                                                                                const end = selectedEmployee.contract?.exitDate ? new Date(selectedEmployee.contract.exitDate) : new Date();

                                                                                let years = end.getFullYear() - start.getFullYear();
                                                                                let months = end.getMonth() - start.getMonth();

                                                                                if (months < 0) {
                                                                                    years--;
                                                                                    months += 12;
                                                                                }

                                                                                if (years === 0 && months === 0) return "Moins d'un mois";

                                                                                const parts = [];
                                                                                if (years > 0) parts.push(`${years} an${years > 1 ? 's' : ''}`);
                                                                                if (months > 0) parts.push(`${months} mois`);

                                                                                return parts.join(' et ');
                                                                            };

                                                                            return (
                                                                                <div className="w-full bg-slate-50 border border-slate-100/50 rounded-lg px-3 py-1.5 text-base font-black text-slate-500">
                                                                                    {calculateSeniority()}
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {(() => {
                                                            // Helper for all legal calculations
                                                            const start = selectedEmployee.contract?.hireDate ? new Date(selectedEmployee.contract.hireDate) : new Date();
                                                            const end = selectedEmployee.contract?.exitDate ? new Date(selectedEmployee.contract.exitDate) : new Date();

                                                            let years = end.getFullYear() - start.getFullYear();
                                                            let months = end.getMonth() - start.getMonth();
                                                            if (months < 0) { years--; months += 12; }

                                                            // Seniority Rate (Prime d'ancienneté)
                                                            let seniorityRate = 0;
                                                            if (years >= 25) seniorityRate = 25;
                                                            else if (years >= 20) seniorityRate = 20;
                                                            else if (years >= 12) seniorityRate = 15;
                                                            else if (years >= 5) seniorityRate = 10;
                                                            else if (years >= 2) seniorityRate = 5;

                                                            // Leave Days (Congés payés)
                                                            // Base: 18 days
                                                            // Bonus: 1.5 days per 5 years of seniority
                                                            const baseLeave = 18;
                                                            const seniorityBonusLeave = Math.floor(years / 5) * 1.5;
                                                            const totalLeave = baseLeave + seniorityBonusLeave;

                                                            return (
                                                                <div className="grid grid-cols-3 gap-2 mb-4">
                                                                    <div className="bg-emerald-50 border border-emerald-100 rounded-full aspect-square w-32 mx-auto flex flex-col items-center justify-center shadow-sm">
                                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Congés</span>
                                                                        <span className="text-xl font-black text-emerald-700 leading-none">{totalLeave}J</span>
                                                                    </div>
                                                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-center items-center shadow-[0_4px_6px_-1px_rgba(100,116,139,0.2)] relative overflow-hidden">
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Dernier Salaire</span>
                                                                        <span className="text-2xl font-black text-slate-800 leading-none">{(selectedEmployee.contract?.baseSalary || 0).toLocaleString()} <span className="text-[12px] opacity-70">Dh</span></span>
                                                                    </div>
                                                                    <div className="bg-emerald-50 border border-emerald-100 rounded-full aspect-square w-32 mx-auto flex flex-col items-center justify-center shadow-sm">
                                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Taux Anc.</span>
                                                                        <span className="text-xl font-black text-emerald-700 leading-none">
                                                                            {seniorityRate}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                        <div className="col-span-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-[0_4px_6px_-1px_rgba(100,116,139,0.2)]">
                                                            <div className="grid grid-cols-3 gap-2">
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
                                                                        tickFormatter={(v) => (v / 1000).toFixed(0) + " k"}
                                                                        width={25}
                                                                        axisLine={false}
                                                                        tickLine={false}
                                                                    />
                                                                    <Line
                                                                        type="monotone"
                                                                        dataKey="total"
                                                                        stroke={selectedEmployee.contract?.exitDate
                                                                            ? "#94a3b8"
                                                                            : selectedEmployee.gender === "F" ? "#ef4444" : "#2563EB"}
                                                                        strokeWidth={4}
                                                                        dot={{
                                                                            r: 4,
                                                                            fill: selectedEmployee.contract?.exitDate
                                                                                ? "#94a3b8"
                                                                                : selectedEmployee.gender === "F" ? "#ef4444" : "#2563EB",
                                                                            strokeWidth: 0
                                                                        }}
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
                                                                    const realIndex = (event as any).originalIndex;
                                                                    const isLatest = idx === 0;
                                                                    const yearSuffix = getYearSuffix(event.date);
                                                                    const isEditingThis = editingHistoryIndex !== null && editingHistoryIndex === realIndex;
                                                                    const isSynthetic = realIndex === -1;

                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            className={cn(
                                                                                "relative p-3.5 rounded-2xl group transition-all duration-300 border",
                                                                                isLatest && !isEditingThis
                                                                                    ? cn(
                                                                                        "shadow-xl transform -translate-x-1",
                                                                                        selectedEmployee.contract?.exitDate
                                                                                            ? "bg-slate-400 border-slate-300 shadow-slate-100"
                                                                                            : selectedEmployee.gender === "F"
                                                                                                ? "bg-red-600 border-red-500 shadow-red-100"
                                                                                                : "bg-blue-600 border-blue-500 shadow-blue-100"
                                                                                    )
                                                                                    : "bg-white border-transparent hover:border-slate-100",
                                                                                isEditingThis ? "bg-blue-50/50 border-blue-100 ring-4 ring-blue-50" : ""
                                                                            )}
                                                                        >
                                                                            {/* Year Bubble */}
                                                                            <div className={cn(
                                                                                "absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-[8px] font-black shadow-sm z-10 transition-colors",
                                                                                isLatest
                                                                                    ? (selectedEmployee.contract?.exitDate ? "bg-slate-400 text-white" : selectedEmployee.gender === "F" ? "bg-red-600 text-white" : "bg-blue-600 text-white")
                                                                                    : "bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white"
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
                                                                                                ? (selectedEmployee.contract?.exitDate
                                                                                                    ? "bg-slate-500 text-white border-slate-400"
                                                                                                    : selectedEmployee.gender === "F" ? "bg-red-500 text-white border-red-400" : "bg-blue-500 text-white border-blue-400")
                                                                                                : "bg-slate-100 text-slate-500 border-slate-200"
                                                                                        )}>
                                                                                            {(event as any).type}
                                                                                        </span>
                                                                                        <span className={cn("text-[10px] font-bold", isLatest ? "text-white/80" : "text-slate-400")}>
                                                                                            {formatDate(event.date)}
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* Row 2: Remuneration Details */}
                                                                                    <div className="flex items-stretch justify-between mt-1">
                                                                                        {/* Left: Salary & Bonus */}
                                                                                        <div className="flex flex-col gap-1.5 flex-1">
                                                                                            {/* Salary */}
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className={cn(
                                                                                                    "w-5 h-5 rounded flex items-center justify-center shadow-sm border",
                                                                                                    isLatest ? "bg-white/10 border-white/20 text-white" : "bg-white border-slate-100 text-slate-400"
                                                                                                )}>
                                                                                                    <Banknote className="w-3 h-3" />
                                                                                                </div>
                                                                                                <span className={cn("text-sm font-black tracking-tight", isLatest ? "text-white" : "text-slate-800")}>
                                                                                                    {event.amount.toLocaleString()} <span className="text-[9px] font-bold opacity-70">Dh</span>
                                                                                                </span>
                                                                                            </div>
                                                                                            {/* Bonus */}
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className={cn(
                                                                                                    "w-5 h-5 rounded flex items-center justify-center shadow-sm border",
                                                                                                    isLatest ? "bg-white/10 border-white/20 text-yellow-300" : "bg-white border-slate-100 text-amber-500"
                                                                                                )}>
                                                                                                    <Gift className="w-3 h-3" />
                                                                                                </div>
                                                                                                <span className={cn(
                                                                                                    "text-xs font-black",
                                                                                                    ((event as any).undeclaredBonus ?? (event as any).bonus ?? 0) > 0
                                                                                                        ? (isLatest ? "text-yellow-300" : "text-amber-500")
                                                                                                        : (isLatest ? "text-white/30" : "text-slate-300")
                                                                                                )}>
                                                                                                    {((event as any).undeclaredBonus ?? (event as any).bonus ?? 0).toLocaleString()} <span className="text-[9px] font-bold opacity-70">Dh</span>
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>

                                                                                        {isLatest && (
                                                                                            <>
                                                                                                <div className="w-px bg-white/20 mx-4" />
                                                                                                <div className="flex flex-col items-end justify-center py-1">
                                                                                                    <span className="text-[8px] font-black uppercase text-white/50 tracking-tighter mb-0.5">Total Global</span>
                                                                                                    <span className="text-xl font-black text-white leading-none">
                                                                                                        {((event as any).total ?? event.amount).toLocaleString()} <span className="text-[10px] opacity-70 font-bold">Dh</span>
                                                                                                    </span>
                                                                                                </div>
                                                                                            </>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Edit Button (Overlay) */}
                                                                                    {isEditing && !isSynthetic && (
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
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleDeleteHistory(realIndex);
                                                                                                }}
                                                                                                className="p-1.5 rounded-lg bg-white text-red-500 hover:bg-red-500 hover:text-white shadow-lg border border-slate-100 transition-colors"
                                                                                            >
                                                                                                <Trash2 className="w-3.5 h-3.5" />
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
                    )
                    }
                </div >
            </div >
        </div >
    );
}
