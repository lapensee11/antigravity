"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect, useMemo } from "react";
import {
    Calculator,
    Users,
    Edit3,
    BookOpen,
    Calendar,
    Plus,
    Minus,
    ChevronDown,
    ChevronUp,
    Search,
    User,
    Pencil,
    MapPin,
    Phone,
    CreditCard,
    Briefcase,
    Check,
    X,
    Edit2,
    Baby,
    Heart,
    Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PayrollDatePicker } from "@/components/payroll/PayrollDatePicker";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";

// Mock Data inspired by image
interface StaffMember {
    id: number;
    initials: string;
    name: string;
    firstName: string;
    lastName: string;
    role: string;
    gender: string;
    birthDate: string;
    matricule: string;
    situationFamiliale: string;
    childrenCount: number;
    // Monthly variable data is now stored in monthlyData
    // Legacy fields removed or kept for backward-compatibility if needed during migration, 
    // but for this refactor we will remove them from the flat structure.
    credit: number;
    personalInfo: {
        cin: string;
        cnss: string;
        phone: string;
        phone2?: string;
        city: string;
        address: string;
    };
    contract: {
        post: string;
        hireDate: string;
        exitDate: string;
        seniority: string;
        leaveBalance: string;
        baseSalary: number;
        fixedBonus: number;
    };
    creditInfo: {
        loanAmount: number;
        payments: number;
        remaining: number;
    };
    history: {
        year: string;
        type: string;
        amount: number;
        bonus: number;
        date: string;
    }[];
    monthlyData: Record<string, {
        jours: number;
        hSup: number;
        pRegul: number;
        pOccas: number;
        virement: number;
        avances: number;
        monthlyDeduction: number;
    }>;
}

// Mock Data inspired by image
const staff: StaffMember[] = [
    {
        id: 1,
        initials: "HB",
        name: "HASSAN BAKIRI",
        firstName: "Hassan",
        lastName: "Bakiri",
        role: "Chef Boulanger",
        gender: "Homme",
        birthDate: "12/05/1985",
        matricule: "M001",
        situationFamiliale: "Marié",
        childrenCount: 2,
        credit: 12000,
        monthlyData: {
            "JANVIER-2025": {
                jours: 26,
                hSup: 0,
                pRegul: 500,
                pOccas: 0,
                virement: 0,
                avances: 0,
                monthlyDeduction: 1000,
            }
        },
        personalInfo: {
            cin: "BH123456",
            cnss: "123456789",
            phone: "0661123456",
            phone2: "0522123456",
            city: "Casablanca",
            address: "12 Rue des Farines"
        },
        contract: {
            post: "Chef Boulanger",
            hireDate: "01/03/2022",
            exitDate: "-",
            seniority: "2 ans, 10 mois",
            leaveBalance: "12 Jours",
            baseSalary: 6500,
            fixedBonus: 500,
        },
        creditInfo: {
            loanAmount: 20000,
            payments: 8000,
            remaining: 12000
        },
        history: [
            { year: "22", type: "EMBAUCHE", amount: 5000, bonus: 500, date: "01/03/2022" },
            { year: "23", type: "AUGMENTATION", amount: 5500, bonus: 500, date: "01/01/2023" },
            { year: "24", type: "AUGMENTATION", amount: 6000, bonus: 500, date: "01/06/2024" },
            { year: "25", type: "AUGMENTATION", amount: 6500, bonus: 500, date: "01/01/2025" },
        ]
    },
    {
        id: 2,
        initials: "FZ",
        name: "FATIMA ZAHRA",
        firstName: "Fatima",
        lastName: "Zahra",
        role: "Responsable Vente",
        gender: "Femme",
        birthDate: "24/11/1992",
        matricule: "M002",
        situationFamiliale: "Célibataire",
        childrenCount: 0,
        credit: 0,
        monthlyData: {
            "JANVIER-2025": {
                jours: 26,
                hSup: 0,
                pRegul: 0,
                pOccas: 0,
                virement: 0,
                avances: 0,
                monthlyDeduction: 0,
            }
        },
        personalInfo: {
            cin: "BH987654",
            cnss: "987654321",
            phone: "0661987654",
            phone2: "",
            city: "Casablanca",
            address: "45 Avenue Hassan II"
        },
        contract: {
            post: "Responsable Vente",
            hireDate: "15/05/2023",
            exitDate: "-",
            seniority: "1 an, 8 mois",
            leaveBalance: "8 Jours",
            baseSalary: 4200,
            fixedBonus: 0,
        },
        creditInfo: {
            loanAmount: 0,
            payments: 0,
            remaining: 0
        },
        history: [
            { year: "23", type: "EMBAUCHE", amount: 4200, bonus: 0, date: "15/05/2023" },
        ]
    },
    {
        id: 3,
        initials: "OF",
        name: "OMAR FIKRI",
        firstName: "Omar",
        lastName: "Fikri",
        role: "Aide Pâtissier",
        gender: "Homme",
        birthDate: "05/09/1998",
        matricule: "M003",
        situationFamiliale: "Célibataire",
        childrenCount: 0,
        credit: 1500,
        monthlyData: {
            "JANVIER-2025": {
                jours: 26,
                hSup: 0,
                pRegul: 300,
                pOccas: 0,
                virement: 0,
                avances: 0,
                monthlyDeduction: 500,
            }
        },
        personalInfo: {
            cin: "BH456123",
            cnss: "456123789",
            phone: "0661456123",
            phone2: "",
            city: "Casablanca",
            address: "78 Boulevard Moulay Youssef"
        },
        contract: {
            post: "Aide Pâtissier",
            hireDate: "10/01/2024",
            exitDate: "-",
            seniority: "1 an",
            leaveBalance: "5 Jours",
            baseSalary: 3800,
            fixedBonus: 300,
        },
        creditInfo: {
            loanAmount: 5000,
            payments: 3500,
            remaining: 1500
        },
        history: [
            { year: "24", type: "EMBAUCHE", amount: 3800, bonus: 300, date: "10/01/2024" },
        ]
    },
    {
        id: 4,
        initials: "SB",
        name: "SAIDA BENKIRANE",
        firstName: "Saida",
        lastName: "Benkirane",
        role: "Vendeuse",
        gender: "Femme",
        birthDate: "15/03/1995",
        matricule: "M004",
        situationFamiliale: "Célibataire",
        childrenCount: 0,
        credit: 0,
        monthlyData: {
            "JANVIER-2025": {
                jours: 26,
                hSup: 0,
                pRegul: 0,
                pOccas: 0,
                virement: 0,
                avances: 0,
                monthlyDeduction: 0,
            }
        },
        personalInfo: {
            cin: "BH654321",
            cnss: "654321987",
            phone: "0661654321",
            phone2: "",
            city: "Casablanca",
            address: "15 Rue des Oranges"
        },
        contract: {
            post: "Vendeuse",
            hireDate: "01/02/2024",
            exitDate: "-",
            seniority: "11 mois",
            leaveBalance: "2 Jours",
            baseSalary: 3000,
            fixedBonus: 0,
        },
        creditInfo: {
            loanAmount: 0,
            payments: 0,
            remaining: 0
        },
        history: [
            { year: "24", type: "EMBAUCHE", amount: 3000, bonus: 0, date: "01/02/2024" },
        ]
    },

];


// Helper to get latest salary from history
export const getLastSalaryInfo = (history: StaffMember['history'], fallbackNet: number = 0, fallbackBonus: number = 0) => {
    if (!history || history.length === 0) return { amount: fallbackNet, bonus: fallbackBonus };

    // Filter valid entries with amount > 0
    const valid = history.filter(h => h.amount > 0 || h.bonus > 0);
    if (valid.length === 0) return { amount: fallbackNet, bonus: fallbackBonus };

    // Sort by date descending
    const sorted = [...valid].sort((a, b) => {
        const parseDate = (d: string) => {
            if (!d || !d.includes('/')) return 0;
            const parts = d.split('/').map(Number);
            if (parts.length < 3) return 0;
            const [day, month, year] = parts;
            const fullYear = year < 100 ? 2000 + year : year;
            return new Date(fullYear, month - 1, day).getTime();
        };

        const t1 = parseDate(a.date);
        const t2 = parseDate(b.date);

        if (t1 !== t2) return t2 - t1;
        return history.indexOf(b) - history.indexOf(a);
    });

    return {
        amount: sorted[0].amount || 0,
        bonus: sorted[0].bonus || 0
    };
};

// Helper for Moroccan IR (Impôt sur le Revenu) - Standard progressive scale with family reductions
const calculateIR = (netImposable: number, dependentCount: number = 0) => {
    let ir = 0;
    // Monthly progressive scale
    if (netImposable <= 2500) ir = 0;
    else if (netImposable <= 4166.67) ir = (netImposable * 0.10) - 250;
    else if (netImposable <= 5000) ir = (netImposable * 0.20) - 666.67;
    else if (netImposable <= 6666.67) ir = (netImposable * 0.30) - 1166.67;
    else if (netImposable <= 15000) ir = (netImposable * 0.34) - 1433.33;
    else ir = (netImposable * 0.38) - 2033.33;

    // Family reductions: 30 MAD per dependent (spouse + children), max 180 MAD total
    const reduction = Math.min(dependentCount, 6) * 30;
    return Math.max(0, ir - reduction);
};

// Calculate Net Salary from Gross
const calculateNetFromGross = (gross: number, dependentCount: number = 0) => {
    const cnss = Math.min(gross, 6000) * 0.0448;
    const amo = gross * 0.0226;
    const fraisPro = Math.min(gross * 0.20, 2500);
    const netImposable = Math.max(0, gross - (cnss + amo + fraisPro));
    const ir = calculateIR(netImposable, dependentCount);
    return gross - cnss - amo - ir;
};

// Calculate Gross Salary from Net (Iterative Gross-up)
const calculateGrossFromNet = (targetNet: number, dependentCount: number = 0) => {
    if (targetNet <= 0) return 0;

    let low = targetNet;
    let high = targetNet * 2; // Sufficient upper bound

    // Binary search for high precision (20 iterations = ~10^-6 precision)
    for (let i = 0; i < 20; i++) {
        const mid = (low + high) / 2;
        const currentNet = calculateNetFromGross(mid, dependentCount);
        if (currentNet < targetNet) low = mid;
        else high = mid;
    }
    return (low + high) / 2;
};

export default function PayePage() {
    const [viewMode, setViewMode] = useState<"Journal" | "Base">("Journal");
    const [journalMode, setJournalMode] = useState<"Saisie" | "Comptable">("Saisie");

    // Date Navigation State
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonthStr, setCurrentMonthStr] = useState("JANVIER");

    // 1. Single source of truth for all staff data
    // We use 'bakery_staff' to preserve existing user data
    const [staffMembers, setStaffMembers, isLoaded] = usePersistedState<StaffMember[]>("bakery_staff", staff);

    // Sync new mock data (e.g. Saida) if missing from persisted profiles
    useEffect(() => {
        if (!isLoaded) return;

        setStaffMembers(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const missingStaff = staff.filter(s => !existingIds.has(s.id));

            if (missingStaff.length > 0) {
                // Return new array merged with missing staff
                // We append them to the end
                return [...prev, ...missingStaff];
            }
            return prev;
        });
    }, [isLoaded, setStaffMembers]);



    const [selectedEmployeeId, setSelectedEmployeeId] = useState(staff[0].id);
    // Remove old month state
    // const [month, setMonth] = useState("JANVIER");

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<StaffMember | null>(null);

    const MONTHS = [
        "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
        "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"
    ];

    const handlePrevMonth = () => {
        const currentIndex = MONTHS.indexOf(currentMonthStr);
        if (currentIndex > 0) {
            setCurrentMonthStr(MONTHS[currentIndex - 1]);
        } else {
            setCurrentMonthStr(MONTHS[11]);
            setCurrentYear(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        const currentIndex = MONTHS.indexOf(currentMonthStr);
        if (currentIndex < 11) {
            setCurrentMonthStr(MONTHS[currentIndex + 1]);
        } else {
            setCurrentMonthStr(MONTHS[0]);
            setCurrentYear(prev => prev + 1);
        }
    };

    // DEBUG: Clear Future Data
    const purgeFutureData = () => {
        if (!window.confirm("Attention: Cela va effacer toutes les données des mois FUTURS (après le mois actuel) pour tous les employés afin de tester la logique séquentielle. Voulez-vous continuer ?")) return;

        const currentMonthIndex = MONTHS.indexOf(currentMonthStr);

        setStaffMembers(prev => prev.map(emp => {
            const newMonthlyData = { ...emp.monthlyData };

            if (emp.monthlyData) {
                Object.keys(emp.monthlyData).forEach(key => {
                    const [mStr, yStr] = key.split('-');
                    const y = parseInt(yStr);
                    const mIndex = MONTHS.indexOf(mStr);

                    // If year is greater, OR year is same but month is greater
                    if (y > currentYear || (y === currentYear && mIndex > currentMonthIndex)) {
                        delete newMonthlyData[key];
                    }
                });
            }

            return {
                ...emp,
                monthlyData: newMonthlyData
            };
        }));
        alert("Données futures effacées ! Les mois suivants devraient maintenant être vides.");
    };

    const handleClotureMois = () => {
        if (!window.confirm("Êtes-vous sûr de vouloir clôturer ce mois ? Cette action validera les retenues, mettra à jour les soldes et ouvrira le mois suivant.")) return;

        // Determine next month key
        const currentIndex = MONTHS.indexOf(currentMonthStr);
        let nextMonthIndex = currentIndex + 1;
        let nextYear = currentYear;
        if (nextMonthIndex > 11) {
            nextMonthIndex = 0;
            nextYear++;
        }
        const nextMonthStr = MONTHS[nextMonthIndex];
        const nextKey = `${nextMonthStr}-${nextYear}`;

        setStaffMembers(prev => prev.map(emp => {
            const currentKey = `${currentMonthStr}-${currentYear}`;
            const currentData = emp.monthlyData?.[currentKey];

            // 1. Calculate new Loan Balance logic (from current month closure)
            let newCreditInfo = { ...emp.creditInfo };

            // If data exists for current month, process the deduction
            if (currentData) {
                const deduction = currentData.monthlyDeduction || 0;
                // Use stored creditInfo or fallback
                const loanAmount = emp.creditInfo?.loanAmount ?? emp.credit ?? 0;
                const currentPayments = emp.creditInfo?.payments ?? 0;
                // If we have a deduction and a loan
                if (deduction > 0 && loanAmount > 0) {
                    const newPayments = currentPayments + deduction;
                    const newRemaining = Math.max(0, loanAmount - newPayments);
                    newCreditInfo = {
                        loanAmount: loanAmount,
                        payments: newPayments,
                        remaining: newRemaining,
                        monthlyPayment: emp.creditInfo?.monthlyPayment ?? 0
                    };
                }
            }

            // 2. Initialize Next Month Data
            // We create the entry for the next month with defaults
            const nextMonthEntry = {
                jours: 26, // Default Days
                hSup: 0,
                pRegul: 0,
                pOccas: 0,
                virement: 0,
                avances: 0,
                monthlyDeduction: newCreditInfo.monthlyPayment || 0, // Auto-prefill deduction if scheduled? Simple default 0 for now unless requested
            };

            return {
                ...emp,
                creditInfo: newCreditInfo,
                monthlyData: {
                    ...emp.monthlyData,
                    [nextKey]: nextMonthEntry
                }
            };
        }));

        // Move to next month
        setCurrentMonthStr(nextMonthStr);
        setCurrentYear(nextYear);
    };
    const [filterType, setFilterType] = useState<"Tous" | "Actifs" | "Inactifs">("Tous");
    const [searchQuery, setSearchQuery] = useState("");
    const [journalEditingId, setJournalEditingId] = useState<number | null>(null);
    const [journalEditData, setJournalEditData] = useState<StaffMember | null>(null);

    // Helpers pour la conversion des dates (DD/MM/YYYY <-> YYYY-MM-DD)
    const toInputDate = (str: string) => {
        if (!str || str === "-" || !str.includes('/')) return "";
        const [d, m, y] = str.split('/');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    };

    const fromInputDate = (str: string) => {
        if (!str) return "-";
        const [y, m, d] = str.split('-');
        return `${d}/${m}/${y}`;
    };

    const getInitials = (first: string, last: string) => {
        const f = (first || "?")[0];
        const l = (last || "?")[0];
        return `${l}${f}`.toUpperCase();
    };

    const calculateSeniority = (hire: string, exit: string) => {
        if (!hire || hire === "-") return "-";

        const parseDate = (str: string) => {
            if (!str || !str.includes('/')) return null;
            const [d, m, y] = str.split('/').map(Number);
            return new Date(y, m - 1, d);
        };

        const start = parseDate(hire);
        const end = (exit && exit !== "-") ? parseDate(exit) : new Date();

        if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) return "-";

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        if (end.getDate() < start.getDate()) {
            months--;
            if (months < 0) {
                years--;
                months += 12;
            }
        }

        const parts = [];
        if (years > 0) parts.push(`${years} an${years > 1 ? 's' : ''}`);
        if (months > 0) parts.push(`${months} mois`);
        return parts.length > 0 ? parts.join(', ') : "0 mois";
    };

    const calculateSeniorityRate = (hireDate: string) => {
        if (!hireDate || hireDate === "-" || !hireDate.includes('/')) return "0%";
        const [d, m, y] = hireDate.split('/').map(Number);
        const start = new Date(y, m - 1, d);
        const now = new Date();

        let years = now.getFullYear() - start.getFullYear();
        const mDiff = now.getMonth() - start.getMonth();
        if (mDiff < 0 || (mDiff === 0 && now.getDate() < start.getDate())) {
            years--;
        }

        if (years >= 25) return "25%";
        if (years >= 20) return "20%";
        if (years >= 12) return "15%";
        if (years >= 5) return "10%";
        if (years >= 2) return "5%";
        return "0%";
    };

    const calculateLeaveDays = (hire: string, exit: string) => {
        if (!hire || hire === "-") return "0";

        const parseDate = (str: string) => {
            if (!str || !str.includes('/')) return null;
            const [d, m, y] = str.split('/').map(Number);
            return new Date(y, m - 1, d);
        };

        const start = parseDate(hire);
        const end = (exit && exit !== "-") ? parseDate(exit) : new Date();

        if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) return "0";

        let years = end.getFullYear() - start.getFullYear();
        if (end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())) {
            years--;
        }

        // Législation Marocaine : 
        // 1.5 jours/mois = 18 jours/an
        // +1.5 jours tous les 5 ans d'ancienneté
        // Plafond à 30 jours
        const baseLeave = 18;
        const seniorityBonus = Math.floor(years / 5) * 1.5;
        const total = Math.min(baseLeave + seniorityBonus, 30);

        return total % 1 === 0 ? total.toString() : total.toFixed(1);
    };

    // Helper to get current month data
    const getMonthData = (emp: StaffMember, mStr = currentMonthStr, y = currentYear) => {
        const key = `${mStr}-${y}`;
        return emp.monthlyData?.[key] || {
            jours: 26,
            hSup: 0,
            pRegul: 0,
            pOccas: 0,
            virement: 0,
            avances: 0,
            monthlyDeduction: 0,
        };
    };

    const updateMonthData = (empId: number, field: keyof ReturnType<typeof getMonthData>, value: number) => {
        setStaffMembers(prev => prev.map(emp => {
            if (emp.id !== empId) return emp;
            const key = `${currentMonthStr}-${currentYear}`;
            const currentData = emp.monthlyData?.[key] || {
                jours: 26,
                hSup: 0,
                pRegul: 0,
                pOccas: 0,
                virement: 0,
                avances: 0,
                monthlyDeduction: 0,
            };
            return {
                ...emp,
                monthlyData: {
                    ...emp.monthlyData,
                    [key]: {
                        ...currentData,
                        [field]: value
                    }
                }
            };
        }));
    };


    const filteredStaff = staffMembers.filter(emp => {
        const isInactive = emp.contract.exitDate && emp.contract.exitDate !== "-";
        const matchesFilter = filterType === "Tous" ||
            (filterType === "Actifs" && !isInactive) ||
            (filterType === "Inactifs" && isInactive);

        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = emp.name.toLowerCase().includes(searchLower) ||
            emp.firstName.toLowerCase().includes(searchLower) ||
            emp.lastName.toLowerCase().includes(searchLower);

        return matchesFilter && matchesSearch;
    });

    const selectedEmployee = staffMembers.find(e => e.id === selectedEmployeeId) || filteredStaff[0] || staffMembers[0];
    const selectedMonthData = getMonthData(selectedEmployee);

    const handleEdit = () => {
        setEditData({ ...selectedEmployee });
        setIsEditing(true);
    };

    const handleSave = () => {
        if (editData) {
            setStaffMembers(prev => prev.map(emp => emp.id === editData.id ? editData : emp));
        }
        setIsEditing(false);
        setEditData(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(null);
    };

    const handleAddNew = () => {
        const newId = Math.max(...staffMembers.map(s => s.id), 0) + 1;
        const newEmployee: StaffMember = {
            id: newId,
            initials: "??",
            name: "NOUVEAU SALARIÉ",
            firstName: "Prénom",
            lastName: "NOM",
            role: "À définir",
            gender: "Homme",
            birthDate: "01/01/1990",
            matricule: `M${String(newId).padStart(3, '0')}`,
            situationFamiliale: "Célibataire",
            childrenCount: 0,
            credit: 0,
            monthlyData: {
                [`${currentMonthStr}-${currentYear}`]: {
                    jours: 26,
                    hSup: 0,
                    pRegul: 0,
                    pOccas: 0,
                    virement: 0,
                    avances: 0,
                    monthlyDeduction: 0,
                }
            },
            personalInfo: {
                cin: "",
                cnss: "",
                phone: "",
                city: "",
                address: ""
            },
            contract: {
                post: "À définir",
                hireDate: fromInputDate(new Date().toISOString().split('T')[0]),
                exitDate: "-",
                seniority: "0 mois",
                leaveBalance: "0 Jours",
                baseSalary: 0,
                fixedBonus: 0
            },
            creditInfo: {
                loanAmount: 0,
                payments: 0,
                remaining: 0
            },
            history: []
        };
        setStaffMembers(prev => [...prev, newEmployee]);
        setSelectedEmployeeId(newId);
        // We can optionally init payroll for this month, but the view logic handles defaults
    };

    return (
        <div className="flex min-h-screen bg-[#F6F8FC] font-outfit">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col">

                {/* Custom Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm relative">
                    {/* Left: Title + View Switch Button */}
                    <div className="flex items-center gap-6">
                        <span className="text-2xl font-black tracking-tight text-[#1E293B]">Paye</span>

                        <div className="flex bg-[#F1F5F9] p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode("Journal")}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 uppercase",
                                    viewMode === "Journal" ? "bg-white text-[#1E293B] shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Calculator className="w-3.5 h-3.5" /> Journal
                            </button>
                            <button
                                onClick={() => setViewMode("Base")}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 uppercase",
                                    viewMode === "Base" ? "bg-white text-[#1E293B] shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Users className="w-3.5 h-3.5" /> Personnel
                            </button>
                        </div>
                    </div>

                    {/* Center: Date Filter */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 shadow-sm p-1">
                            <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-[#D97706] transition-colors">
                                <ChevronDown className="w-4 h-4 rotate-90" />
                            </button>
                            <div className="px-4 py-1 flex flex-col items-center min-w-[140px]">
                                <span className="text-sm font-black text-[#1E293B] tracking-widest uppercase">{currentMonthStr}</span>
                                <span className="text-[10px] font-bold text-slate-400">{currentYear}</span>
                            </div>
                            <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-[#D97706] transition-colors">
                                <ChevronDown className="w-4 h-4 -rotate-90" />
                            </button>
                        </div>
                    </div>

                    {/* Right: Journal Mode + Cloture */}
                    <div className="flex items-center gap-4">
                        {viewMode === "Journal" && (
                            <>
                                <div className="flex bg-[#F1F5F9] p-1 rounded-lg">
                                    <button
                                        onClick={() => setJournalMode("Saisie")}
                                        className={cn(
                                            "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 uppercase",
                                            journalMode === "Saisie" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <Edit3 className="w-3.5 h-3.5" /> Saisie
                                    </button>
                                    <button
                                        onClick={() => setJournalMode("Comptable")}
                                        className={cn(
                                            "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 uppercase",
                                            journalMode === "Comptable" ? "bg-[#422B1E] text-white shadow-sm border border-[#5D3A2A]" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <BookOpen className="w-3.5 h-3.5" /> Comptable
                                    </button>
                                </div>

                                <div className="h-8 w-px bg-slate-200 mx-2" />

                                <button onClick={purgeFutureData} className="px-3 py-2 text-[10px] bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors border border-red-100 whitespace-nowrap">
                                    Reset Futurs
                                </button>

                                <button
                                    onClick={handleClotureMois}
                                    className="bg-[#1E293B] hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-slate-700"
                                >
                                    <Lock className="w-3.5 h-3.5" />
                                    Clôturer le Mois
                                </button>
                            </>
                        )}
                    </div>
                </header>

                <div className="p-0 flex-1 overflow-hidden flex">
                    {viewMode === "Journal" ? (
                        <div className="p-6 w-full h-full flex flex-col">
                            <div className={cn(
                                "bg-white rounded-2xl shadow-2xl overflow-hidden border-2 h-full flex flex-col",
                                journalMode === "Comptable" ? "border-[#A37D4A]" : "border-[#1E293B]"
                            )}>
                                <div className="overflow-auto custom-scrollbar flex-1">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className={cn(
                                                "text-[10px] text-slate-300 uppercase font-black tracking-widest border-b",
                                                journalMode === "Comptable" ? "bg-[#5D4037] border-[#814C1D]" : "bg-[#1E293B] border-[#334155]"
                                            )}>
                                                <th className="px-4 py-3 text-left w-14">Matr.</th>
                                                <th className="px-4 py-3 text-left w-24">Salarié</th>
                                                <th className={cn(
                                                    "px-4 py-3 text-right w-32 border-r",
                                                    journalMode === "Comptable" ? "border-[#814C1D]" : "border-[#334155]"
                                                )}>Net Cible</th>
                                                {journalMode === "Saisie" ? (
                                                    <>
                                                        <th className="px-4 py-3 text-center w-32 border-r border-[#334155]">Mois / Année</th>
                                                        <th className="px-4 py-3 text-center w-32">Jours</th>
                                                        <th className="px-4 py-3 text-center w-20">H. Sup</th>
                                                        <th className="px-4 py-3 text-right w-28">P. Régul</th>
                                                        <th className="px-4 py-3 text-right w-28 border-r border-[#334155]">P. Occas</th>
                                                        <th className="px-4 py-3 text-right w-28 text-orange-600">Virement</th>
                                                        <th className="px-4 py-3 text-right w-28 text-orange-600">Avances</th>
                                                        <th className="px-4 py-3 text-right w-28 text-orange-600 border-r border-[#1E293B]/20">Retenue Prêt</th>
                                                        <th className="px-4 py-3 text-right text-white w-28">Net à Payer</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="px-4 py-3 text-center w-20 border-r border-[#814C1D]">Jours</th>
                                                        <th className="px-4 py-3 text-right w-28">Brut</th>
                                                        <th className="px-4 py-3 text-right w-28">Brut Imp.</th>
                                                        <th className="px-4 py-3 text-right w-28 border-r border-[#814C1D]">Net Imp.</th>
                                                        <th className="px-4 py-3 text-right w-24 text-red-300">CNSS</th>
                                                        <th className="px-4 py-3 text-right w-24 text-red-300">AMO</th>
                                                        <th className="px-4 py-3 text-right w-24 text-red-300 border-r border-[#814C1D]">IR</th>
                                                        <th className="px-4 py-3 text-right text-white w-32">Salaire Net</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {staffMembers.map((emp, idx) => {
                                                const isJournalEditing = journalEditingId === emp.id;
                                                const currentData = isJournalEditing ? journalEditData! : emp;

                                                // Net Calculation based on target "Net Cible" from history
                                                const dependentCount = (emp.situationFamiliale?.includes('Marié') ? 1 : 0) + (emp.childrenCount || 0);
                                                const salaryInfo = getLastSalaryInfo(emp.history, emp.contract.baseSalary, emp.contract.fixedBonus || 0);
                                                const netCibleValue = salaryInfo.amount;
                                                const historicalBonus = salaryInfo.bonus;

                                                const currentKey = `${currentMonthStr}-${currentYear}`;
                                                const isInitialized = !!emp.monthlyData?.[currentKey];
                                                const mData = getMonthData(emp); // Still returns defaults if missing, but we use isInitialized to control UI

                                                // 3. Pro-rate the Taxable Target Net (Base and Overtime only)
                                                // Note: Primes (pRegul, pOccas) are excluded from this target for fiscal reasons
                                                // 3. Pro-rate the Taxable Target Net (Base and Overtime only)
                                                // If not initialized, effective days are 0 for calculation purposes (visual)
                                                const effectiveJours = isInitialized ? (mData.jours || 0) : 0;
                                                const effectiveHSup = isInitialized ? (mData.hSup || 0) : 0;

                                                const targetNetBase = (netCibleValue / 26) * effectiveJours;
                                                const targetNetOvertime = ((netCibleValue / 26) / 8) * effectiveHSup;
                                                const targetNetForGrossUp = targetNetBase + targetNetOvertime;

                                                // 4. Perform Iterative Gross-up to find corresponding Gross (Brut)
                                                const brutGlobal = calculateGrossFromNet(targetNetForGrossUp, dependentCount);

                                                // 5. Derive all accounting figures from the Gross
                                                const cnss = Math.min(brutGlobal, 6000) * 0.0448;
                                                const amo = brutGlobal * 0.0226;
                                                const fraisPro = Math.min(brutGlobal * 0.20, 2500);
                                                const brutImposable = brutGlobal;
                                                const netImposable = Math.max(0, brutGlobal - (cnss + amo + fraisPro));
                                                const ir = calculateIR(netImposable, dependentCount);
                                                const salaireNetAcc = (brutGlobal - cnss - amo - ir); // This equals targetNetForGrossUp

                                                // Pro-rate the Prime Régulière as well (optional, but often preferred)
                                                const proRatedBonus = Math.round(((historicalBonus / 26) * Math.min(effectiveJours, 26)) * 100) / 100;
                                                const currentBonus = isInitialized ? (mData.pRegul > 0 ? mData.pRegul : proRatedBonus) : 0;

                                                // Net à Payer calculation (incl. IR and other professional deductions)
                                                // Primes are added to the Net AFTER tax calculations
                                                // Net à Payer calculation
                                                const netAPayer = isInitialized
                                                    ? (salaireNetAcc + currentBonus + (mData.pOccas || 0) - (mData.virement || 0) - (mData.avances || 0) - (mData.monthlyDeduction || 0))
                                                    : 0;

                                                // Remaining Credit:
                                                // We use creditInfo.remaining (historical balance) - monthlyDeduction (current payment)
                                                // Fallback to emp.credit if creditInfo is missing, but prefer creditInfo.remaining
                                                const startBalance = emp.creditInfo?.remaining ?? (emp.credit || 0);
                                                const remainingCredit = Math.max(0, startBalance - (mData.monthlyDeduction || 0));

                                                // Update Helper within the map loop
                                                // Update Helper within the map loop
                                                const updateField = (field: keyof ReturnType<typeof getMonthData>, val: number) => {
                                                    if (!isInitialized) return; // Prevent edits if not initialized
                                                    updateMonthData(emp.id, field, val);

                                                    // Auto-calculate P.Regul if days change
                                                    if (field === 'jours') {
                                                        const baseBonus = emp.contract.fixedBonus || 0;
                                                        const days = val;
                                                        const effectiveDays = Math.min(days, 26);
                                                        const calculatedBonus = (baseBonus / 26) * effectiveDays;
                                                        const finalBonus = Math.round(calculatedBonus * 100) / 100;
                                                        setTimeout(() => updateMonthData(emp.id, 'pRegul', finalBonus), 0);
                                                    }
                                                };

                                                return (
                                                    <tr key={emp.id} className={cn(
                                                        "group transition-all hover:bg-slate-50/50",
                                                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                                                    )}>
                                                        <td className="px-4 py-3 text-left text-[10px] font-bold text-slate-400">
                                                            {emp.matricule}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="font-bold text-slate-800 text-xs flex items-center gap-2 truncate">
                                                                    <span className="truncate">{emp.name}</span>
                                                                    {emp.contract.exitDate && emp.contract.exitDate !== "-" && (
                                                                        <span className="px-1 py-0.5 rounded-md bg-slate-100 text-[7px] text-slate-400 border border-slate-200 uppercase font-black shrink-0">Sorti</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5 truncate">{emp.role}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right border-r border-[#1E293B]/20">
                                                            <span className="text-sm font-black text-emerald-600 tracking-tight">
                                                                {netCibleValue.toLocaleString("fr-FR")} Dh
                                                            </span>
                                                        </td>
                                                        {journalMode === "Saisie" ? (
                                                            <>
                                                                <td className="px-4 py-3 text-center border-r border-[#1E293B]/20">
                                                                    <span className="text-xs font-bold text-slate-600">
                                                                        {currentMonthStr.slice(0, 3)} {currentYear.toString().slice(2)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <button
                                                                            onClick={() => updateField('jours', Math.max(0, mData.jours - 0.5))}
                                                                            disabled={!isInitialized}
                                                                            className={cn(
                                                                                "w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-slate-600 transition-colors",
                                                                                isInitialized ? "hover:bg-slate-200" : "opacity-30 cursor-not-allowed"
                                                                            )}
                                                                        >
                                                                            <ChevronDown className="w-3 h-3" />
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            value={isInitialized ? mData.jours : ""}
                                                                            placeholder="-"
                                                                            disabled={!isInitialized}
                                                                            onChange={(e) => updateField('jours', Number(e.target.value))}
                                                                            className={cn(
                                                                                "w-10 bg-transparent border-b border-transparent rounded-none px-1 py-1 text-xs font-black text-center focus:outline-none appearance-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                                isInitialized ? "hover:border-slate-300 focus:border-blue-500" : "opacity-30 cursor-not-allowed"
                                                                            )}
                                                                        />
                                                                        <button
                                                                            onClick={() => updateField('jours', mData.jours + 0.5)}
                                                                            disabled={!isInitialized}
                                                                            className={cn(
                                                                                "w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-slate-600 transition-colors",
                                                                                isInitialized ? "hover:bg-slate-200" : "opacity-30 cursor-not-allowed"
                                                                            )}
                                                                        >
                                                                            <ChevronUp className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <button
                                                                            onClick={() => updateField('hSup', Math.max(0, mData.hSup - 1))}
                                                                            disabled={!isInitialized}
                                                                            className={cn(
                                                                                "w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-slate-600 transition-colors",
                                                                                isInitialized ? "hover:bg-slate-200" : "opacity-30 cursor-not-allowed"
                                                                            )}
                                                                        >
                                                                            <ChevronDown className="w-3 h-3" />
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            value={isInitialized ? mData.hSup : ""}
                                                                            placeholder="-"
                                                                            disabled={!isInitialized}
                                                                            onChange={(e) => updateField('hSup', Number(e.target.value))}
                                                                            className={cn(
                                                                                "w-10 bg-transparent border-b border-transparent rounded-none px-1 py-1 text-xs font-bold text-slate-600 text-center focus:outline-none appearance-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                                isInitialized ? "hover:border-slate-300 focus:border-blue-500" : "opacity-30 cursor-not-allowed"
                                                                            )}
                                                                        />
                                                                        <button
                                                                            onClick={() => updateField('hSup', mData.hSup + 1)}
                                                                            disabled={!isInitialized}
                                                                            className={cn(
                                                                                "w-5 h-5 flex items-center justify-center bg-slate-100 rounded text-slate-600 transition-colors",
                                                                                isInitialized ? "hover:bg-slate-200" : "opacity-30 cursor-not-allowed"
                                                                            )}
                                                                        >
                                                                            <ChevronUp className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <div className="flex flex-col items-end">
                                                                        <input
                                                                            type="number"
                                                                            value={isInitialized && mData.pRegul > 0 ? mData.pRegul : ""}
                                                                            placeholder={isInitialized && proRatedBonus > 0 ? proRatedBonus.toString() : "-"}
                                                                            disabled={!isInitialized}
                                                                            onChange={(e) => updateField('pRegul', Number(e.target.value))}
                                                                            className={cn(
                                                                                "w-20 bg-transparent border-b border-transparent text-xs font-black text-black text-right focus:outline-none appearance-none transition-colors placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                                isInitialized ? "hover:border-slate-300 focus:border-blue-500" : "opacity-30 cursor-not-allowed"
                                                                            )}
                                                                        />
                                                                        {proRatedBonus > 0 && !mData.pRegul && (
                                                                            <span className="text-[8px] font-bold text-emerald-600 opacity-60">PRÉVU: {proRatedBonus}</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right border-r border-[#1E293B]/20">
                                                                    <input
                                                                        type="number"
                                                                        value={isInitialized && mData.pOccas > 0 ? mData.pOccas : ""}
                                                                        placeholder="-"
                                                                        disabled={!isInitialized}
                                                                        onChange={(e) => updateField('pOccas', Number(e.target.value))}
                                                                        className={cn(
                                                                            "w-20 bg-transparent border-b border-transparent text-xs font-black text-black text-right focus:outline-none appearance-none transition-colors placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                            isInitialized ? "hover:border-slate-300 focus:border-blue-500" : "opacity-30 cursor-not-allowed"
                                                                        )}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <input
                                                                        type="number"
                                                                        value={isInitialized && mData.virement > 0 ? mData.virement : ""}
                                                                        placeholder="-"
                                                                        disabled={!isInitialized}
                                                                        onChange={(e) => updateField('virement', Number(e.target.value))}
                                                                        className={cn(
                                                                            "w-20 bg-transparent border-b border-transparent text-xs font-black text-orange-600 text-right focus:outline-none appearance-none transition-colors placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                            isInitialized ? "hover:border-slate-300 focus:border-blue-500" : "opacity-30 cursor-not-allowed"
                                                                        )}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <input
                                                                        type="number"
                                                                        value={isInitialized && mData.avances > 0 ? mData.avances : ""}
                                                                        placeholder="-"
                                                                        disabled={!isInitialized}
                                                                        onChange={(e) => updateField('avances', Number(e.target.value))}
                                                                        className={cn(
                                                                            "w-20 bg-transparent border-b border-transparent text-xs font-black text-orange-600 text-right focus:outline-none appearance-none transition-colors placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                            isInitialized ? "hover:border-slate-300 focus:border-blue-500" : "opacity-30 cursor-not-allowed"
                                                                        )}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-right border-r border-[#1E293B]/20">
                                                                    <div className="flex flex-col items-end">
                                                                        <input
                                                                            type="number"
                                                                            value={isInitialized && mData.monthlyDeduction > 0 ? mData.monthlyDeduction : ""}
                                                                            placeholder="-"
                                                                            disabled={!isInitialized}
                                                                            onChange={(e) => updateField('monthlyDeduction', Number(e.target.value))}
                                                                            className={cn(
                                                                                "w-20 bg-transparent border-b border-transparent text-xs font-black text-orange-600 text-right focus:outline-none appearance-none transition-colors placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                                isInitialized ? "hover:border-slate-300 focus:border-blue-500" : "opacity-30 cursor-not-allowed"
                                                                            )}
                                                                        />
                                                                        {(emp.creditInfo?.loanAmount || emp.credit) > 0 && (
                                                                            <span className="text-[9px] font-bold text-slate-400">
                                                                                - R: {remainingCredit.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} Dh
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="text-sm font-black text-[#1E293B] tracking-normal">
                                                                        {netAPayer.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                                    </span>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="px-4 py-3 text-center border-r border-[#1E293B]/20">
                                                                    <span className="text-xs font-bold text-slate-600">{mData.jours}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="text-xs font-black text-slate-700">
                                                                        {brutGlobal.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="text-xs font-bold text-slate-600">
                                                                        {brutImposable.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right border-r border-[#1E293B]/20">
                                                                    <span className="text-xs font-black text-indigo-600">
                                                                        {netImposable.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="text-[10px] font-bold text-red-500">
                                                                        {cnss.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="text-[10px] font-bold text-red-500">
                                                                        {amo.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right border-r border-[#1E293B]/20">
                                                                    <span className="text-[10px] font-bold text-red-600">
                                                                        {ir.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right opacity-90">
                                                                    <span className="text-sm font-black text-[#1E293B] tracking-normal">
                                                                        {salaireNetAcc.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                                    </span>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className={cn(
                                    "p-0 flex items-center text-white shrink-0 h-10 border-t",
                                    journalMode === "Comptable" ? "bg-[#422B1E] border-[#814C1D]" : "bg-[#1E293B] border-[#334155]"
                                )}>
                                    <table className="w-full border-collapse table-fixed">
                                        <tbody>
                                            <tr>
                                                <td className="w-14 px-4 py-2 text-[8px] font-black uppercase tracking-widest opacity-40">
                                                    RH
                                                </td>
                                                <td className="w-24 px-4 py-2 text-[11px] font-black uppercase tracking-widest opacity-60">
                                                    Total: {staffMembers.length}
                                                </td>
                                                <td className={cn(
                                                    "w-32 px-4 py-2 text-right border-r",
                                                    journalMode === "Comptable" ? "border-[#814C1D]" : "border-[#334155]"
                                                )}>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-emerald-500">
                                                            {staffMembers.reduce((acc, curr) => acc + getLastSalaryInfo(curr.history, curr.contract.baseSalary).amount, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                        </span>
                                                    </div>
                                                </td>
                                                {journalMode === "Saisie" ? (
                                                    <>
                                                        <td className="w-32 border-r border-[#334155]"></td>
                                                        <td className="w-32"></td>
                                                        <td className="w-20"></td>
                                                        <td className="w-28"></td>
                                                        <td className="w-28 border-r border-[#334155]"></td>
                                                        <td className="w-28 px-4 py-2 text-right">
                                                            <span className="text-orange-500 text-[11px] font-black">
                                                                {staffMembers.reduce((acc, curr) => acc + (getMonthData(curr).virement || 0), 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                            </span>
                                                        </td>
                                                        <td className="w-28 px-4 py-2 text-right">
                                                            <span className="text-orange-400 text-[11px] font-black">
                                                                {staffMembers.reduce((acc, curr) => acc + (getMonthData(curr).avances || 0), 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                            </span>
                                                        </td>
                                                        <td className="w-28 border-r border-[#1E293B]/20 px-4 py-2 text-right">
                                                            <span className="text-orange-300 text-[11px] font-black">
                                                                {staffMembers.reduce((acc, curr) => acc + (getMonthData(curr).monthlyDeduction || 0), 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                            </span>
                                                        </td>
                                                        <td className="w-28 px-4 py-2 text-right">
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-black text-white">
                                                                    {staffMembers.reduce((acc, curr) => {
                                                                        const mData = getMonthData(curr);
                                                                        const depCount = (curr.situationFamiliale?.includes('Marié') ? 1 : 0) + (curr.childrenCount || 0);
                                                                        const salaryInfo = getLastSalaryInfo(curr.history, curr.contract.baseSalary, curr.contract.fixedBonus || 0);
                                                                        const netCible = salaryInfo.amount;
                                                                        const historicalBonus = salaryInfo.bonus;

                                                                        const tNet = (netCible / 26) * (mData.jours || 0) + ((netCible / 26) / 8) * (mData.hSup || 0);
                                                                        const brut = calculateGrossFromNet(tNet, depCount);
                                                                        const cnss = Math.min(brut, 6000) * 0.0448;
                                                                        const amo = brut * 0.0226;
                                                                        const frais = Math.min(brut * 0.20, 2500);
                                                                        const nImp = Math.max(0, brut - (cnss + amo + frais));
                                                                        const ir = calculateIR(nImp, depCount);
                                                                        const netAcc = brut - cnss - amo - ir;

                                                                        const proRatedBonus = Math.round(((historicalBonus / 26) * Math.min(mData.jours, 26)) * 100) / 100;
                                                                        const currentBonus = mData.pRegul > 0 ? mData.pRegul : proRatedBonus;

                                                                        return acc + (netAcc + currentBonus + (mData.pOccas || 0) - (mData.virement || 0) - (mData.avances || 0) - (mData.monthlyDeduction || 0));
                                                                    }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className={cn(
                                                            "w-20 border-r",
                                                            journalMode === "Comptable" ? "border-[#814C1D]" : "border-[#334155]"
                                                        )}></td>
                                                        <td className="w-28 px-4 py-2 text-right">
                                                            <span className="text-slate-300 text-[11px] font-black">
                                                                {staffMembers.reduce((acc, curr) => {
                                                                    const mData = getMonthData(curr);
                                                                    const depCount = (curr.situationFamiliale?.includes('Marié') ? 1 : 0) + (curr.childrenCount || 0);
                                                                    const netCible = getLastSalaryInfo(curr.history, curr.contract.baseSalary, curr.contract.fixedBonus || 0).amount;
                                                                    const tNet = (netCible / 26) * (mData.jours || 0) + ((netCible / 26) / 8) * (mData.hSup || 0) + (mData.pRegul || 0) + (mData.pOccas || 0);
                                                                    return acc + calculateGrossFromNet(tNet, depCount);
                                                                }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                            </span>
                                                        </td>
                                                        <td className="w-28 px-4 py-2 text-right">
                                                            <span className="text-slate-400 text-[11px] font-black">
                                                                {staffMembers.reduce((acc, curr) => {
                                                                    const mData = getMonthData(curr);
                                                                    const depCount = (curr.situationFamiliale?.includes('Marié') ? 1 : 0) + (curr.childrenCount || 0);
                                                                    const netCible = getLastSalaryInfo(curr.history, curr.contract.baseSalary, curr.contract.fixedBonus || 0).amount;
                                                                    const tNet = (netCible / 26) * (mData.jours || 0) + ((netCible / 26) / 8) * (mData.hSup || 0) + (mData.pRegul || 0) + (mData.pOccas || 0);
                                                                    return acc + calculateGrossFromNet(tNet, depCount);
                                                                }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                            </span>
                                                        </td>
                                                        <td className="w-28 border-r border-[#814C1D] px-4 py-2 text-right">
                                                            <span className="text-indigo-400 text-[11px] font-black">
                                                                {staffMembers.reduce((acc, curr) => {
                                                                    const mData = getMonthData(curr);
                                                                    const depCount = (curr.situationFamiliale?.includes('Marié') ? 1 : 0) + (curr.childrenCount || 0);
                                                                    const netCible = getLastSalaryInfo(curr.history, curr.contract.baseSalary, curr.contract.fixedBonus || 0).amount;
                                                                    const tNet = (netCible / 26) * (mData.jours || 0) + ((netCible / 26) / 8) * (mData.hSup || 0) + (mData.pRegul || 0) + (mData.pOccas || 0);
                                                                    const brut = calculateGrossFromNet(tNet, depCount);
                                                                    const cnssVal = Math.min(brut, 6000) * 0.0448;
                                                                    const amoVal = brut * 0.0226;
                                                                    const fPro = Math.min(brut * 0.20, 2500);
                                                                    return acc + Math.max(0, brut - (cnssVal + amoVal + fPro));
                                                                }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                            </span>
                                                        </td>
                                                        <td className="w-24 px-4 py-2 text-right">
                                                            <span className="text-red-400 text-[11px] font-black">
                                                                {staffMembers.reduce((acc, curr) => {
                                                                    const mData = getMonthData(curr);
                                                                    const depCount = (curr.situationFamiliale?.includes('Marié') ? 1 : 0) + (curr.childrenCount || 0);
                                                                    const netCible = getLastSalaryInfo(curr.history, curr.contract.baseSalary, curr.contract.fixedBonus || 0).amount;
                                                                    const tNet = (netCible / 26) * (mData.jours || 0) + ((netCible / 26) / 8) * (mData.hSup || 0) + (mData.pRegul || 0) + (mData.pOccas || 0);
                                                                    const brut = calculateGrossFromNet(tNet, depCount);
                                                                    return acc + Math.min(brut, 6000) * 0.0448;
                                                                }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                            </span>
                                                        </td>
                                                        <td className="w-24 px-4 py-2 text-right">
                                                            <span className="text-red-400 text-[11px] font-black">
                                                                {staffMembers.reduce((acc, curr) => {
                                                                    const mData = getMonthData(curr);
                                                                    const depCount = (curr.situationFamiliale?.includes('Marié') ? 1 : 0) + (curr.childrenCount || 0);
                                                                    const netCible = getLastSalaryInfo(curr.history, curr.contract.baseSalary, curr.contract.fixedBonus || 0).amount;
                                                                    const tNet = (netCible / 26) * (mData.jours || 0) + ((netCible / 26) / 8) * (mData.hSup || 0) + (mData.pRegul || 0) + (mData.pOccas || 0);
                                                                    const brut = calculateGrossFromNet(tNet, depCount);
                                                                    return acc + (brut * 0.0226);
                                                                }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                            </span>
                                                        </td>
                                                        <td className="w-24 border-r border-[#814C1D] px-4 py-2 text-right">
                                                            <span className="text-red-500 text-[11px] font-black">
                                                                {staffMembers.reduce((acc, curr) => {
                                                                    const mData = getMonthData(curr);
                                                                    const depCount = (curr.situationFamiliale?.includes('Marié') ? 1 : 0) + (curr.childrenCount || 0);
                                                                    const netCible = getLastSalaryInfo(curr.history, curr.contract.baseSalary, curr.contract.fixedBonus || 0).amount;
                                                                    const tNet = (netCible / 26) * (mData.jours || 0) + ((netCible / 26) / 8) * (mData.hSup || 0) + (mData.pRegul || 0) + (mData.pOccas || 0);
                                                                    const brut = calculateGrossFromNet(tNet, depCount);
                                                                    const cnssV = Math.min(brut, 6000) * 0.0448;
                                                                    const amoV = brut * 0.0226;
                                                                    const fP = Math.min(brut * 0.20, 2500);
                                                                    const nI = Math.max(0, brut - (cnssV + amoV + fP));
                                                                    return acc + calculateIR(nI, depCount);
                                                                }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                            </span>
                                                        </td>
                                                        <td className="w-32 px-4 py-2 text-right">
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-black text-white">
                                                                    {staffMembers.reduce((acc, curr) => {
                                                                        const mData = getMonthData(curr);
                                                                        const depCount = (curr.situationFamiliale?.includes('Marié') ? 1 : 0) + (curr.childrenCount || 0);
                                                                        const netCible = getLastSalaryInfo(curr.history, curr.contract.baseSalary, curr.contract.fixedBonus || 0).amount;
                                                                        const tNet = (netCible / 26) * (mData.jours || 0) + ((netCible / 26) / 8) * (mData.hSup || 0);
                                                                        const brut = calculateGrossFromNet(tNet, depCount);
                                                                        const cnssVal = Math.min(brut, 6000) * 0.0448;
                                                                        const amoVal = brut * 0.0226;
                                                                        const fPro = Math.min(brut * 0.20, 2500);
                                                                        const nImp = Math.max(0, brut - (cnssVal + amoVal + fPro));
                                                                        const taxIR = calculateIR(nImp, depCount);
                                                                        return acc + (brut - cnssVal - amoVal - taxIR);
                                                                    }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Base Personnel View */
                        <div className="flex w-full h-full">
                            {/* Personnel Sidebar List inspired by Articles */}
                            <aside className="w-[340px] h-full border-r border-slate-200 bg-[#F6F8FC] relative z-20 flex flex-col">
                                {/* Header */}
                                <div className="p-5 pb-2 flex flex-col gap-4">
                                    <div>
                                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Personnel</h2>
                                        <p className="text-slate-400 text-sm font-light">Base de données RH</p>
                                    </div>

                                    {/* Type Tabs inspired by Articles */}
                                    <div className="bg-white p-1 rounded-xl flex gap-1 shadow-sm">
                                        {["Tous", "Actifs", "Inactifs"].map((type) => {
                                            const isActive = type === filterType;
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => setFilterType(type as any)}
                                                    className={cn(
                                                        "flex-1 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all relative overflow-hidden",
                                                        isActive
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {type.toUpperCase()}
                                                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Search & Add inspired by Articles */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Rechercher..."
                                                className={cn(
                                                    "w-full bg-white border border-slate-200 rounded-xl pl-9 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-300",
                                                    searchQuery ? "pr-9" : "pr-4"
                                                )}
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery("")}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-all"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleAddNew}
                                            className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 hover:scale-105 transition-all shrink-0"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* List inspired by Articles */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-200">
                                    {filteredStaff.map(emp => {
                                        const isSelected = selectedEmployeeId === emp.id;
                                        return (
                                            <div
                                                key={emp.id}
                                                onClick={() => setSelectedEmployeeId(emp.id)}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 border-b border-slate-100 transition-all cursor-pointer group relative hover:bg-white",
                                                    isSelected
                                                        ? (emp.gender === "Femme" ? "bg-red-50 pl-7" : "bg-blue-50 pl-7")
                                                        : "bg-[#F6F8FC] pl-5"
                                                )}
                                            >
                                                {isSelected && (
                                                    <div className={cn(
                                                        "absolute left-0 top-0 bottom-0 w-[4px]",
                                                        emp.gender === "Femme" ? "bg-red-600" : "bg-blue-600"
                                                    )} />
                                                )}

                                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center shadow-sm shrink-0 relative">
                                                    <span className="text-xs font-black text-slate-400">{emp.initials}</span>
                                                    {emp.contract.exitDate && emp.contract.exitDate !== "-" && (
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <X className="w-14 h-14 text-slate-400/40 stroke-[2.5px]" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                            {emp.matricule}
                                                        </span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs font-bold truncate transition-colors",
                                                        isSelected
                                                            ? (emp.gender === "Femme" ? "text-red-700" : "text-blue-700")
                                                            : "text-slate-700"
                                                    )}>
                                                        {emp.name}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-slate-500 uppercase">
                                                        {emp.role}
                                                    </span>
                                                </div>

                                                <div className="pr-1" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEmployeeId(emp.id);
                                                    setEditData({ ...emp });
                                                    setIsEditing(true);
                                                }}>
                                                    <Pencil className={cn(
                                                        "w-3.5 h-3.5 transition-all",
                                                        isSelected
                                                            ? (emp.gender === "Femme" ? "text-red-400" : "text-blue-400")
                                                            : "text-slate-300 opacity-0 group-hover:opacity-100"
                                                    )} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </aside>

                            {/* Personnel Details inspired by Article Editor */}
                            <div className="flex-1 bg-white p-0 overflow-hidden flex flex-col">
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {/* Header Section */}
                                    <div className="px-10 pt-8 pb-6 flex justify-between items-start gap-6 border-b border-slate-50 mb-6">
                                        <div className="flex-1 min-w-0">

                                            <div className="flex gap-5 items-start">
                                                <div className={cn(
                                                    "w-24 h-24 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-sm border relative aspect-square",
                                                    selectedEmployee.contract.exitDate && selectedEmployee.contract.exitDate !== "-"
                                                        ? "bg-slate-100 border-slate-200"
                                                        : (selectedEmployee.gender === "Femme" ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100")
                                                )}>
                                                    <User className={cn(
                                                        "w-12 h-12 opacity-80",
                                                        selectedEmployee.contract.exitDate && selectedEmployee.contract.exitDate !== "-"
                                                            ? "text-slate-400"
                                                            : (selectedEmployee.gender === "Femme" ? "text-red-600" : "text-blue-600")
                                                    )} />
                                                    {selectedEmployee.contract.exitDate && selectedEmployee.contract.exitDate !== "-" && (
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <X className="w-24 h-24 text-slate-400/40 stroke-[3px]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[6rem]">
                                                    {isEditing ? (
                                                        <div className="flex gap-2 text-3xl font-extrabold tracking-tight leading-tight">
                                                            <input
                                                                value={editData?.lastName || ""}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setEditData(prev => prev ? {
                                                                        ...prev,
                                                                        lastName: val,
                                                                        name: `${val.toUpperCase()} ${prev.firstName}`,
                                                                        initials: getInitials(prev.firstName, val)
                                                                    } : null);
                                                                }}
                                                                className={cn(
                                                                    "bg-slate-50 border-b-2 border-slate-200 focus:outline-none w-full placeholder:text-slate-300 uppercase",
                                                                    selectedEmployee.gender === "Femme" ? "focus:border-red-500" : "focus:border-blue-500"
                                                                )}
                                                                placeholder="NOM"
                                                            />
                                                            <input
                                                                value={editData?.firstName || ""}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setEditData(prev => prev ? {
                                                                        ...prev,
                                                                        firstName: val,
                                                                        name: `${prev.lastName.toUpperCase()} ${val}`,
                                                                        initials: getInitials(val, prev.lastName)
                                                                    } : null);
                                                                }}
                                                                className={cn(
                                                                    "bg-slate-50 border-b-2 border-slate-200 focus:outline-none w-full placeholder:text-slate-300",
                                                                    selectedEmployee.gender === "Femme" ? "focus:border-red-500" : "focus:border-blue-500"
                                                                )}
                                                                placeholder="PRÉNOM"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight uppercase">
                                                            {selectedEmployee.lastName} <span className="font-normal capitalize">{selectedEmployee.firstName.toLowerCase()}</span>
                                                        </h1>
                                                    )}

                                                    <div className="mt-1 flex items-center gap-3">
                                                        {isEditing ? (
                                                            <div className="flex gap-1.5">
                                                                <button
                                                                    onClick={() => setEditData(prev => prev ? { ...prev, gender: "Homme" } : null)}
                                                                    className={cn(
                                                                        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all border shadow-sm",
                                                                        (editData?.gender === "Homme")
                                                                            ? "bg-blue-600 border-blue-600 text-white"
                                                                            : "bg-white border-slate-200 text-slate-400 hover:border-blue-400"
                                                                    )}
                                                                >
                                                                    H
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditData(prev => prev ? { ...prev, gender: "Femme" } : null)}
                                                                    className={cn(
                                                                        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all border shadow-sm",
                                                                        (editData?.gender === "Femme")
                                                                            ? "bg-red-600 border-red-600 text-white"
                                                                            : "bg-white border-slate-200 text-slate-400 hover:border-red-400"
                                                                    )}
                                                                >
                                                                    F
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm transition-colors shrink-0",
                                                                selectedEmployee.contract.exitDate && selectedEmployee.contract.exitDate !== "-"
                                                                    ? "bg-slate-400"
                                                                    : (selectedEmployee.gender === "Homme" ? "bg-blue-600" : "bg-red-600")
                                                            )}>
                                                                {selectedEmployee.gender === "Homme" ? "H" : "F"}
                                                            </div>
                                                        )}

                                                        {isEditing ? (
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    value={editData?.matricule || ""}
                                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, matricule: e.target.value } : null)}
                                                                    className={cn(
                                                                        "text-xs font-bold tracking-widest px-2 py-0.5 rounded focus:outline-none w-24 uppercase border",
                                                                        selectedEmployee.gender === "Femme"
                                                                            ? "text-red-600 bg-red-50 border-red-100 focus:border-red-400"
                                                                            : "text-blue-600 bg-blue-50 border-blue-100 focus:border-blue-400"
                                                                    )}
                                                                    placeholder="MATRICULE"
                                                                />
                                                                {editData?.contract.exitDate && editData.contract.exitDate !== "-" && (
                                                                    <div className="flex items-center gap-2 px-2 py-1 bg-red-50 border border-red-100 rounded-lg">
                                                                        <input type="checkbox" checked={true} readOnly className="w-3.5 h-3.5 accent-red-600" />
                                                                        <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">Inactif</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <span className={cn(
                                                                    "text-xs font-bold tracking-[0.2em] uppercase transition-colors",
                                                                    selectedEmployee.contract.exitDate && selectedEmployee.contract.exitDate !== "-"
                                                                        ? "text-slate-400"
                                                                        : (selectedEmployee.gender === "Femme" ? "text-red-500" : "text-blue-500")
                                                                )}>
                                                                    {selectedEmployee.matricule}
                                                                </span>
                                                                {selectedEmployee.contract.exitDate && selectedEmployee.contract.exitDate !== "-" && (
                                                                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg">
                                                                        <input type="checkbox" checked={true} readOnly className="w-3 h-3 accent-slate-500" />
                                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Inactif</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>


                                                    {isEditing ? (
                                                        <div className="flex items-center gap-1 mt-3">
                                                            <span className="text-slate-400 font-medium text-sm">RH <span className="mx-1 text-slate-300">›</span></span>
                                                            <input
                                                                value={editData?.role || ""}
                                                                onChange={(e) => setEditData(prev => prev ? { ...prev, role: e.target.value, contract: { ...prev.contract, post: e.target.value } } : null)}
                                                                className={cn(
                                                                    "bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600 rounded px-2 py-0.5 focus:outline-none w-full",
                                                                    selectedEmployee.gender === "Femme" ? "focus:border-red-500" : "focus:border-blue-500"
                                                                )}
                                                                placeholder="POSTE / RÔLE"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="text-slate-400 font-medium text-sm mt-0.5">
                                                            RH <span className="mx-1 text-slate-300">›</span> {selectedEmployee.role}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>


                                        <div className="flex items-center gap-2">
                                            {isEditing && (
                                                <>
                                                    <button
                                                        onClick={handleSave}
                                                        className={cn(
                                                            "text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-md",
                                                            selectedEmployee.gender === "Femme" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                                                        )}
                                                    >
                                                        <Check className="w-4 h-4" /> Enregistrer
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center gap-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="px-10 pb-10">
                                        <div className="grid grid-cols-5 grid-rows-[auto_auto] gap-x-12 gap-y-12 items-stretch">
                                            {/* 1- Informations Personnelles */}
                                            <section className="col-span-3 flex flex-col h-full">
                                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1.5 h-6 rounded-full transition-colors",
                                                        selectedEmployee.contract.exitDate && selectedEmployee.contract.exitDate !== "-"
                                                            ? "bg-slate-300"
                                                            : (selectedEmployee.gender === "Femme" ? "bg-red-600" : "bg-blue-600")
                                                    )} />
                                                    1- Informations Personnelles
                                                </h3>
                                                <div className={cn(
                                                    "bg-[#F8FAFC] rounded-2xl p-8 border shadow-2xl space-y-4 transition-all duration-300",
                                                    selectedEmployee.gender === "Femme"
                                                        ? "border-red-500/20 shadow-red-500/5"
                                                        : "border-blue-500/20 shadow-blue-500/5"
                                                )}>
                                                    {/* Identity Group */}
                                                    <div className="grid grid-cols-3 gap-10">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                <Calendar className="w-3 h-3" /> Naissance
                                                            </div>
                                                            <div className="flex items-baseline gap-2">
                                                                {isEditing ? (
                                                                    <PayrollDatePicker
                                                                        value={editData?.birthDate || ""}
                                                                        onChange={(val) => setEditData(prev => prev ? { ...prev, birthDate: val } : null)}
                                                                        gender={selectedEmployee.gender as "Homme" | "Femme"}
                                                                        className="w-48 shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="text-base font-bold text-slate-800 tracking-tight">{selectedEmployee.birthDate}</div>
                                                                )}
                                                                <span className="text-[11px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">
                                                                    {(() => {
                                                                        const bDate = (isEditing ? editData?.birthDate : selectedEmployee.birthDate) || "";
                                                                        if (!bDate.includes('/')) return "-";
                                                                        const [d, m, y] = bDate.split('/').map(Number);
                                                                        if (isNaN(y)) return "-";
                                                                        const birth = new Date(y, m - 1, d);
                                                                        const now = new Date();
                                                                        let age = now.getFullYear() - birth.getFullYear();
                                                                        if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
                                                                        return age;
                                                                    })()} ans
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                <CreditCard className="w-3 h-3" /> N° CIN
                                                            </div>
                                                            {isEditing ? (
                                                                <input
                                                                    value={editData?.personalInfo.cin || ""}
                                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, personalInfo: { ...prev.personalInfo, cin: e.target.value } } : null)}
                                                                    className={cn(
                                                                        "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 w-full uppercase transition-all",
                                                                        selectedEmployee.gender === "Femme"
                                                                            ? "focus:ring-red-500/20 focus:border-red-500"
                                                                            : "focus:ring-blue-500/20 focus:border-blue-500"
                                                                    )}
                                                                />
                                                            ) : (
                                                                <div className="text-base font-bold text-slate-800 tracking-tight">{selectedEmployee.personalInfo.cin}</div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                <Check className="w-3 h-3" /> N° CNSS
                                                            </div>
                                                            {isEditing ? (
                                                                <input
                                                                    value={editData?.personalInfo.cnss || ""}
                                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, personalInfo: { ...prev.personalInfo, cnss: e.target.value } } : null)}
                                                                    className={cn(
                                                                        "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 w-full transition-all",
                                                                        selectedEmployee.gender === "Femme"
                                                                            ? "focus:ring-red-500/20 focus:border-red-500"
                                                                            : "focus:ring-blue-500/20 focus:border-blue-500"
                                                                    )}
                                                                />
                                                            ) : (
                                                                <div className="text-base font-bold text-slate-800 tracking-tight">{selectedEmployee.personalInfo.cnss}</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Separator Line */}
                                                    <div className={cn(
                                                        "h-px w-full",
                                                        selectedEmployee.gender === "Femme" ? "bg-red-200" : "bg-blue-200"
                                                    )} />

                                                    {/* Family Situation Group */}
                                                    <div className="grid grid-cols-3 gap-10">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                <Heart className="w-3 h-3" /> Situation Familiale
                                                            </div>
                                                            {isEditing ? (
                                                                <div className="relative">
                                                                    <select
                                                                        value={editData?.situationFamiliale || "Célibataire"}
                                                                        onChange={(e) => setEditData(prev => prev ? { ...prev, situationFamiliale: e.target.value } : null)}
                                                                        className={cn(
                                                                            "w-full bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-1.5 appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer shadow-sm",
                                                                            selectedEmployee.gender === "Femme"
                                                                                ? "focus:ring-red-500/20 focus:border-red-500"
                                                                                : "focus:ring-blue-500/20 focus:border-blue-500"
                                                                        )}
                                                                    >
                                                                        <option value="Célibataire">Célibataire</option>
                                                                        <option value="Marié">Marié(e)</option>
                                                                        <option value="Divorcé">Divorcé(e)</option>
                                                                        <option value="Veuf">Veuf(ve)</option>
                                                                    </select>
                                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                                </div>
                                                            ) : (
                                                                <div className="text-base font-bold text-slate-800 tracking-tight">{selectedEmployee.situationFamiliale}</div>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                <Baby className="w-3 h-3" /> Enfants
                                                            </div>
                                                            {isEditing ? (
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={editData?.childrenCount ?? 0}
                                                                    onChange={(e) => setEditData(prev => prev ? { ...prev, childrenCount: parseInt(e.target.value) || 0 } : null)}
                                                                    className={cn(
                                                                        "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 w-full transition-all",
                                                                        selectedEmployee.gender === "Femme"
                                                                            ? "focus:ring-red-500/20 focus:border-red-500"
                                                                            : "focus:ring-blue-500/20 focus:border-blue-500"
                                                                    )}
                                                                />
                                                            ) : (
                                                                <div className="text-base font-bold text-slate-800 tracking-tight">{selectedEmployee.childrenCount}</div>
                                                            )}
                                                        </div>

                                                    </div>

                                                    {/* Separator Line */}
                                                    {/* Separator Line */}
                                                    <div className={cn(
                                                        "h-px w-full",
                                                        selectedEmployee.gender === "Femme" ? "bg-red-200" : "bg-blue-200"
                                                    )} />

                                                    {/* Contact Group */}
                                                    <div className="flex gap-8 items-start">
                                                        {/* Phones Group */}
                                                        <div className="flex gap-3">
                                                            <div className="mt-1 bg-slate-100 p-1.5 rounded-lg shrink-0">
                                                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                                            </div>
                                                            <div className="space-y-2 w-[125px]">
                                                                {isEditing ? (
                                                                    <>
                                                                        <input
                                                                            value={editData?.personalInfo.phone || ""}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value.replace(/\s/g, "");
                                                                                const formatted = val.replace(/(.{2})(?=.)/g, "$1 ");
                                                                                setEditData(prev => prev ? { ...prev, personalInfo: { ...prev.personalInfo, phone: formatted } } : null);
                                                                            }}
                                                                            className={cn(
                                                                                "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 w-full transition-all",
                                                                                selectedEmployee.gender === "Femme"
                                                                                    ? "focus:ring-red-500/20 focus:border-red-500"
                                                                                    : "focus:ring-blue-500/20 focus:border-blue-500"
                                                                            )}
                                                                            placeholder="06 00 00 00 00"
                                                                        />
                                                                        <input
                                                                            value={editData?.personalInfo.phone2 || ""}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value.replace(/\s/g, "");
                                                                                const formatted = val.replace(/(.{2})(?=.)/g, "$1 ");
                                                                                setEditData(prev => prev ? { ...prev, personalInfo: { ...prev.personalInfo, phone2: formatted } } : null);
                                                                            }}
                                                                            className={cn(
                                                                                "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 w-full transition-all",
                                                                                selectedEmployee.gender === "Femme"
                                                                                    ? "focus:ring-red-500/20 focus:border-red-500"
                                                                                    : "focus:ring-blue-500/20 focus:border-blue-500"
                                                                            )}
                                                                            placeholder="05 00 00 00 00"
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        <div className="text-sm font-bold text-slate-800 tracking-tight">
                                                                            {(selectedEmployee.personalInfo.phone || "").replace(/\s/g, '').replace(/(\d{2})(?=\d)/g, '$1 ')}
                                                                        </div>
                                                                        {selectedEmployee.personalInfo.phone2 && (
                                                                            <div className="text-sm font-bold text-slate-800 tracking-tight">
                                                                                {selectedEmployee.personalInfo.phone2.replace(/\s/g, '').replace(/(\d{2})(?=\d)/g, '$1 ')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Address Group */}
                                                        <div className="flex gap-4 flex-1">
                                                            <div className="mt-1 bg-slate-100 p-1.5 rounded-lg shrink-0">
                                                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                                            </div>
                                                            <div className="space-y-2 flex-1">
                                                                {isEditing ? (
                                                                    <>
                                                                        <input
                                                                            value={editData?.personalInfo.address || ""}
                                                                            onChange={(e) => setEditData(prev => prev ? { ...prev, personalInfo: { ...prev.personalInfo, address: e.target.value } } : null)}
                                                                            className={cn(
                                                                                "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 w-full transition-all",
                                                                                selectedEmployee.gender === "Femme"
                                                                                    ? "focus:ring-red-500/20 focus:border-red-500"
                                                                                    : "focus:ring-blue-500/20 focus:border-blue-500"
                                                                            )}
                                                                            placeholder="Adresse"
                                                                        />
                                                                        <input
                                                                            value={editData?.personalInfo.city || ""}
                                                                            onChange={(e) => setEditData(prev => prev ? { ...prev, personalInfo: { ...prev.personalInfo, city: e.target.value } } : null)}
                                                                            className={cn(
                                                                                "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 w-full transition-all",
                                                                                selectedEmployee.gender === "Femme"
                                                                                    ? "focus:ring-red-500/20 focus:border-red-500"
                                                                                    : "focus:ring-blue-500/20 focus:border-blue-500"
                                                                            )}
                                                                            placeholder="Ville"
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        <div className="text-sm font-bold text-slate-800 tracking-tight leading-tight">
                                                                            {selectedEmployee.personalInfo.address}
                                                                        </div>
                                                                        <div className="text-sm font-medium text-slate-400">
                                                                            {selectedEmployee.personalInfo.city}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>


                                            {/* 3- Historique */}
                                            <section className="col-span-2 row-span-2 flex flex-col h-full">
                                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1.5 h-6 rounded-full transition-colors",
                                                        selectedEmployee.contract.exitDate && selectedEmployee.contract.exitDate !== "-"
                                                            ? "bg-slate-300"
                                                            : (selectedEmployee.gender === "Femme" ? "bg-red-600" : "bg-blue-600")
                                                    )} />
                                                    3- Historique & Évolution
                                                </h3>
                                                <div className={cn(
                                                    "bg-white rounded-2xl p-6 border shadow-2xl flex-1 flex flex-col min-h-0 transition-all duration-300",
                                                    selectedEmployee.gender === "Femme"
                                                        ? "border-red-500/20 shadow-red-500/5"
                                                        : "border-blue-500/20 shadow-blue-500/5"
                                                )}>
                                                    {(() => {
                                                        const history = isEditing ? editData?.history : selectedEmployee.history;
                                                        if (!history || history.length === 0) return null;

                                                        const parseDate = (d: string) => {
                                                            if (!d || !d.includes('/')) return 0;
                                                            const parts = d.split('/').map(Number);
                                                            if (parts.length < 3) return 0;
                                                            const [day, month, year] = parts;
                                                            const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
                                                            return new Date(fullYear, month - 1, day).getTime();
                                                        };

                                                        // 1. Unify Sorting (Ascending Chronological)
                                                        const sorted = [...history].filter(h => h.amount > 0).sort((a, b) => parseDate(a.date) - parseDate(b.date));
                                                        if (sorted.length === 0) return null;

                                                        const timestamps = sorted.map(h => parseDate(h.date));
                                                        const minTime = timestamps[0];
                                                        const maxTime = timestamps[timestamps.length - 1];
                                                        const timeRange = maxTime - minTime || 1;

                                                        const amounts = sorted.map(h => h.amount);
                                                        const minVal = Math.min(...amounts);
                                                        const maxVal = Math.max(...amounts);
                                                        const range = maxVal - minVal || 1;

                                                        // 2. Proportional Mapping (X = Time, Y = Amount)
                                                        const points = sorted.map((h, i) => {
                                                            const time = parseDate(h.date);
                                                            const x = timeRange > 0 ? ((time - minTime) / timeRange) * 100 : 50;
                                                            // Scale to 5-35 in a 40px height SVG (padding 5px)
                                                            const y = 35 - ((h.amount - minVal) / range) * 30;
                                                            return { x, y, amount: h.amount, date: h.date };
                                                        });

                                                        const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
                                                        const areaPath = `${linePath} L 100 40 L 0 40 Z`;

                                                        const progression = sorted.length >= 2
                                                            ? ((sorted[sorted.length - 1].amount - sorted[sorted.length - 2].amount) / sorted[sorted.length - 2].amount) * 100
                                                            : 0;

                                                        const formatK = (v: number) => {
                                                            return (v / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'k';
                                                        };

                                                        return (
                                                            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                                <div className="flex justify-between items-center mb-4">
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Évolution Salaire</div>
                                                                    <div className={cn(
                                                                        "text-[10px] font-bold uppercase tracking-widest",
                                                                        selectedEmployee.gender === "Femme" ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50",
                                                                        "px-2 py-0.5 rounded"
                                                                    )}>Historique</div>
                                                                </div>
                                                                <div className="h-32 w-full relative group">
                                                                    <svg viewBox="0 0 100 40" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                                                                        <defs>
                                                                            <linearGradient id={`${selectedEmployee.id}-gradient`} x1="0" y1="0" x2="0" y2="1">
                                                                                <stop offset="0%" stopColor={selectedEmployee.gender === "Femme" ? "#EF4444" : "#3B82F6"} stopOpacity="0.2" />
                                                                                <stop offset="100%" stopColor={selectedEmployee.gender === "Femme" ? "#EF4444" : "#3B82F6"} stopOpacity="0" />
                                                                            </linearGradient>
                                                                        </defs>
                                                                        <path d={areaPath} fill={`url(#${selectedEmployee.id}-gradient)`} />
                                                                        <path
                                                                            d={linePath}
                                                                            fill="none"
                                                                            stroke={selectedEmployee.gender === "Femme" ? "#EF4444" : "#3B82F6"}
                                                                            strokeWidth="1.5"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        />
                                                                        {points.map((p, i) => (
                                                                            <circle
                                                                                key={i}
                                                                                cx={p.x}
                                                                                cy={p.y}
                                                                                r="1.2"
                                                                                fill="white"
                                                                                stroke={selectedEmployee.gender === "Femme" ? "#EF4444" : "#3B82F6"}
                                                                                strokeWidth="0.8"
                                                                            />
                                                                        ))}
                                                                    </svg>
                                                                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] font-bold text-slate-300 pointer-events-none pr-2 py-1">
                                                                        <span className="leading-none">{formatK(maxVal)}</span>
                                                                        <span className="leading-none">{formatK((maxVal + minVal) / 2)}</span>
                                                                        <span className="leading-none">{formatK(minVal)}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/50">
                                                                    <div className="text-[9px] font-bold text-slate-400">Progression</div>
                                                                    <div className={cn(
                                                                        "text-[10px] font-black flex items-center gap-0.5",
                                                                        progression >= 0 ? "text-emerald-600" : "text-red-500"
                                                                    )}>
                                                                        {progression >= 0 ? '+' : ''}{progression.toFixed(1)}%
                                                                        <span className="text-[8px] font-bold text-slate-300 ml-1">vs Évènement Précédent</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar" style={{ maxHeight: '500px' }}>
                                                        {isEditing ? (
                                                            <div className="space-y-4">
                                                                {editData?.history.map((h, i) => (
                                                                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 relative group">
                                                                        <button
                                                                            onClick={() => setEditData(prev => prev ? { ...prev, history: prev.history.filter((_, idx) => idx !== i) } : null)}
                                                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                        <div className="grid grid-cols-3 gap-3">
                                                                            <input
                                                                                value={h.year}
                                                                                onChange={(e) => setEditData(prev => prev ? { ...prev, history: prev.history.map((ev, idx) => idx === i ? { ...ev, year: e.target.value } : ev) } : null)}
                                                                                className="bg-white border border-slate-200 text-[11px] font-bold rounded px-2 py-1 focus:outline-none"
                                                                                placeholder="AAAA"
                                                                            />
                                                                            <input
                                                                                value={h.amount}
                                                                                type="number"
                                                                                onChange={(e) => setEditData(prev => prev ? { ...prev, history: prev.history.map((ev, idx) => idx === i ? { ...ev, amount: Number(e.target.value) } : ev) } : null)}
                                                                                className={cn(
                                                                                    "bg-white border border-slate-200 text-[11px] font-bold rounded px-2 py-1 focus:outline-none text-right",
                                                                                    selectedEmployee.gender === "Femme" ? "text-red-600" : "text-blue-600"
                                                                                )}
                                                                                placeholder="Net"
                                                                            />
                                                                            <input
                                                                                value={h.bonus}
                                                                                type="number"
                                                                                onChange={(e) => setEditData(prev => prev ? { ...prev, history: prev.history.map((ev, idx) => idx === i ? { ...ev, bonus: Number(e.target.value) } : ev) } : null)}
                                                                                className="bg-white border border-slate-200 text-[11px] font-bold rounded px-2 py-1 focus:outline-none text-right text-emerald-600"
                                                                                placeholder="Prime"
                                                                            />
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            <input
                                                                                value={h.type}
                                                                                onChange={(e) => setEditData(prev => prev ? { ...prev, history: prev.history.map((ev, idx) => idx === i ? { ...ev, type: e.target.value } : ev) } : null)}
                                                                                className="bg-white border border-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none uppercase"
                                                                                placeholder="Type (ex: AUGMENTATION)"
                                                                            />
                                                                            <input
                                                                                value={h.date}
                                                                                onChange={(e) => setEditData(prev => prev ? { ...prev, history: prev.history.map((ev, idx) => idx === i ? { ...ev, date: e.target.value } : ev) } : null)}
                                                                                className="bg-white border border-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none"
                                                                                placeholder="Date (ex: 01/01/2025)"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => setEditData(prev => prev ? { ...prev, history: [...prev.history, { year: "", type: "ÉVÉNEMENT", amount: 0, bonus: 0, date: "" }] } : null)}
                                                                    className={cn(
                                                                        "w-full py-2 border-2 border-dashed rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                                                                        selectedEmployee.gender === "Femme"
                                                                            ? "border-slate-200 text-slate-400 hover:border-red-400 hover:text-red-500"
                                                                            : "border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500"
                                                                    )}
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" /> Ajouter un événement
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            selectedEmployee.history.map((h, i) => (
                                                                <div key={i} className="flex gap-4 items-center transition-all hover:translate-x-1 duration-300">
                                                                    <div className={cn(
                                                                        "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0",
                                                                        i === selectedEmployee.history.length - 1
                                                                            ? (selectedEmployee.gender === "Femme" ? "bg-red-600 text-white shadow-lg" : "bg-blue-600 text-white shadow-lg")
                                                                            : "bg-slate-50 text-slate-400 border border-slate-100"
                                                                    )}>
                                                                        {h.year}
                                                                    </div>
                                                                    <div className="flex-1 flex justify-between items-center group">
                                                                        <div>
                                                                            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-tighter">{h.type}</div>
                                                                            <div className="text-[9px] font-bold text-slate-400 opacity-60 uppercase">{h.date}</div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className={cn(
                                                                                "text-xs font-black tracking-tight",
                                                                                i === selectedEmployee.history.length - 1
                                                                                    ? (selectedEmployee.gender === "Femme" ? "text-red-600" : "text-blue-600")
                                                                                    : "text-slate-700"
                                                                            )}>
                                                                                {h.amount.toLocaleString("fr-FR")} <span className="text-[10px] font-bold opacity-40">Net</span>
                                                                            </div>
                                                                            {h.bonus > 0 && (
                                                                                <div className="text-[10px] font-bold text-emerald-600 tracking-tight leading-none">
                                                                                    +{h.bonus.toLocaleString("fr-FR")} <span className="text-[8px] font-bold opacity-40 uppercase">Prime</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </section>


                                            {/* 2- Poste & Crédit */}
                                            <section className="col-span-3 flex flex-col h-full">
                                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1.5 h-6 rounded-full transition-colors",
                                                        selectedEmployee.contract.exitDate && selectedEmployee.contract.exitDate !== "-"
                                                            ? "bg-slate-300"
                                                            : (selectedEmployee.gender === "Femme" ? "bg-red-600" : "bg-blue-600")
                                                    )} />
                                                    2- Poste & Situation Financière
                                                </h3>
                                                <div className={cn(
                                                    "bg-[#F8FAFC] rounded-2xl p-8 border shadow-2xl flex-1 transition-all duration-300",
                                                    selectedEmployee.gender === "Femme"
                                                        ? "border-red-500/20 shadow-red-500/5"
                                                        : "border-blue-500/20 shadow-blue-500/5"
                                                )}>
                                                    <div className="space-y-3">
                                                        {/* Ligne 1: Infos Poste */}
                                                        <div className="grid grid-cols-3 gap-12">
                                                            <div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date Embauche</div>
                                                                {isEditing ? (
                                                                    <PayrollDatePicker
                                                                        value={editData?.contract.hireDate || ""}
                                                                        onChange={(val) => {
                                                                            setEditData(prev => prev ? {
                                                                                ...prev,
                                                                                contract: {
                                                                                    ...prev.contract,
                                                                                    hireDate: val,
                                                                                    seniority: calculateSeniority(val, prev.contract.exitDate),
                                                                                    leaveBalance: `${calculateLeaveDays(val, prev.contract.exitDate)} Jours`
                                                                                }
                                                                            } : null);
                                                                        }}
                                                                        gender={selectedEmployee.gender as "Homme" | "Femme"}
                                                                        className="w-full"
                                                                    />
                                                                ) : (
                                                                    <div className="text-base font-bold text-slate-800 tracking-tight">{selectedEmployee.contract.hireDate}</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date de Sortie</div>
                                                                {isEditing ? (
                                                                    <PayrollDatePicker
                                                                        value={editData?.contract.exitDate || ""}
                                                                        onChange={(val) => {
                                                                            setEditData(prev => prev ? {
                                                                                ...prev,
                                                                                contract: {
                                                                                    ...prev.contract,
                                                                                    exitDate: val,
                                                                                    seniority: calculateSeniority(prev.contract.hireDate, val),
                                                                                    leaveBalance: `${calculateLeaveDays(prev.contract.hireDate, val)} Jours`
                                                                                }
                                                                            } : null);
                                                                        }}
                                                                        gender={selectedEmployee.gender as "Homme" | "Femme"}
                                                                        className="w-full"
                                                                    />
                                                                ) : (
                                                                    <div className="text-base font-bold text-slate-800 tracking-tight">{selectedEmployee.contract.exitDate}</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ancienneté</div>
                                                                {isEditing ? (
                                                                    <input
                                                                        value={editData?.contract.seniority || ""}
                                                                        onChange={(e) => setEditData(prev => prev ? { ...prev, contract: { ...prev.contract, seniority: e.target.value } } : null)}
                                                                        className={cn(
                                                                            "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 w-full",
                                                                            selectedEmployee.gender === "Femme"
                                                                                ? "focus:ring-red-500/10 focus:border-red-500"
                                                                                : "focus:ring-blue-500/10 focus:border-blue-500"
                                                                        )}
                                                                    />
                                                                ) : (
                                                                    <div className="text-base font-bold text-slate-800 tracking-tight">
                                                                        {calculateSeniority(selectedEmployee.contract.hireDate, selectedEmployee.contract.exitDate)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Ligne Intermédiaire: Congés & Salaire (Quinconce) */}
                                                        <div className={cn(
                                                            "flex flex-row items-center justify-center gap-20 pt-2 border-t pb-2",
                                                            selectedEmployee.gender === "Femme" ? "border-red-200" : "border-blue-200"
                                                        )}>
                                                            <div className="flex flex-col items-center">
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Congés dus</div>
                                                                <div className="text-xl font-black text-emerald-700">
                                                                    {calculateLeaveDays(isEditing ? editData?.contract.hireDate || "" : selectedEmployee.contract.hireDate, isEditing ? editData?.contract.exitDate || "" : selectedEmployee.contract.exitDate)} <span className="text-xs font-bold text-emerald-600">Jours</span>
                                                                </div>
                                                            </div>

                                                            <div className="w-px h-10 bg-slate-200 mx-4" />

                                                            <div className="flex flex-col items-center">
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dernier Salaire</div>
                                                                <div className="text-xl font-black text-emerald-700">
                                                                    {getLastSalaryInfo(isEditing ? editData?.history || [] : selectedEmployee.history, selectedEmployee.contract.baseSalary).amount.toLocaleString("fr-FR")} <span className="text-xs font-bold text-emerald-600">Dh</span>
                                                                </div>
                                                                <div className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Source: Historique</div>
                                                            </div>

                                                            <div className="w-px h-10 bg-slate-200 mx-4" />

                                                            <div className="flex flex-col items-center">
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Taux Ancienneté</div>
                                                                <div className={cn(
                                                                    "text-2xl font-black tracking-tight",
                                                                    selectedEmployee.gender === "Femme" ? "text-red-600" : "text-blue-600"
                                                                )}>
                                                                    {calculateSeniorityRate(selectedEmployee.contract.hireDate)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Ligne 2: Infos Crédit */}
                                                        <div className={cn(
                                                            "grid grid-cols-3 gap-12 pt-2 border-t",
                                                            selectedEmployee.gender === "Femme" ? "border-red-200" : "border-blue-200"
                                                        )}>
                                                            <div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Montant Prêté</div>
                                                                {isEditing ? (
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number"
                                                                            value={editData?.creditInfo.loanAmount || 0}
                                                                            onChange={(e) => {
                                                                                const newVal = Number(e.target.value);
                                                                                setEditData(prev => prev ? {
                                                                                    ...prev,
                                                                                    creditInfo: {
                                                                                        ...prev.creditInfo,
                                                                                        loanAmount: newVal,
                                                                                        // Auto-calculate remaining: Loan - Payments
                                                                                        remaining: Math.max(0, newVal - (prev.creditInfo.payments || 0))
                                                                                    }
                                                                                } : null);
                                                                            }}
                                                                            className={cn(
                                                                                "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 w-full",
                                                                                selectedEmployee.gender === "Femme"
                                                                                    ? "focus:ring-red-500/10 focus:border-red-500"
                                                                                    : "focus:ring-blue-500/10 focus:border-blue-500"
                                                                            )}
                                                                        />
                                                                        <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">Dh</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-base font-bold text-slate-800">{selectedEmployee.creditInfo.loanAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} Dh</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Remboursé</div>
                                                                {isEditing ? (
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number"
                                                                            value={editData?.creditInfo.payments || 0}
                                                                            onChange={(e) => {
                                                                                const newVal = Number(e.target.value);
                                                                                setEditData(prev => prev ? {
                                                                                    ...prev,
                                                                                    creditInfo: {
                                                                                        ...prev.creditInfo,
                                                                                        payments: newVal,
                                                                                        // Auto-calculate remaining: Loan - Payments
                                                                                        remaining: Math.max(0, (prev.creditInfo.loanAmount || 0) - newVal)
                                                                                    }
                                                                                } : null);
                                                                            }}
                                                                            className={cn(
                                                                                "bg-white border border-slate-200 text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 w-full",
                                                                                selectedEmployee.gender === "Femme"
                                                                                    ? "text-red-600 focus:ring-red-500/10 focus:border-red-500"
                                                                                    : "text-blue-600 focus:ring-blue-500/10 focus:border-blue-500"
                                                                            )}
                                                                        />
                                                                        <span className={cn(
                                                                            "absolute right-3 top-2 text-[10px] font-bold",
                                                                            selectedEmployee.gender === "Femme" ? "text-red-400" : "text-blue-400"
                                                                        )}>Dh</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className={cn(
                                                                        "text-base font-bold",
                                                                        selectedEmployee.gender === "Femme" ? "text-red-600" : "text-blue-600"
                                                                    )}>
                                                                        {(() => {
                                                                            const credit = isEditing ? editData?.creditInfo : selectedEmployee.creditInfo;
                                                                            const mData = isEditing && editData ? getMonthData(editData) : selectedMonthData;
                                                                            const deduction = mData.monthlyDeduction || 0;
                                                                            const val = (credit?.payments || 0) + deduction;
                                                                            return val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                                        })()} Dh
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Reste dû</div>
                                                                <div className="text-xl font-black text-red-600">
                                                                    {(() => {
                                                                        const credit = isEditing ? editData?.creditInfo : selectedEmployee.creditInfo;
                                                                        const mData = isEditing && editData ? getMonthData(editData) : selectedMonthData;
                                                                        const deduction = mData.monthlyDeduction || 0;
                                                                        const val = (credit?.loanAmount || 0) - (credit?.payments || 0) - deduction;
                                                                        return val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                                    })()} <span className="text-xs font-bold">Dh</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                    }
                </div >
            </main >
        </div >
    );
}
