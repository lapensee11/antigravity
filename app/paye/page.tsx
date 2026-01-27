"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useState } from "react";
import {
    Calculator,
    Users,
    Edit3,
    BookOpen,
    Calendar,
    Plus,
    Minus,
    ChevronDown,
    Search,
    User,
    Pencil,
    MapPin,
    Phone,
    CreditCard,
    Briefcase,
    Check,
    X,
    Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    netCible: number;
    jours: number;
    hSup: number;
    pRegul: number;
    pOccas: number;
    avances: number;
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
        lastSalary: string;
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
        date: string;
    }[];
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
        netCible: 6500,
        jours: 26,
        hSup: 0,
        pRegul: 500,
        pOccas: 0,
        avances: 0,
        credit: 12000,
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
            lastSalary: "7 000,00 Dh"
        },
        creditInfo: {
            loanAmount: 20000,
            payments: 8000,
            remaining: 12000
        },
        history: [
            { year: "22", type: "EMBAUCHE", amount: 5000, date: "01/03/2022" },
            { year: "23", type: "AUGMENTATION", amount: 5500, date: "01/01/2023" },
            { year: "24", type: "AUGMENTATION", amount: 6000, date: "01/06/2024" },
            { year: "25", type: "AUGMENTATION", amount: 6500, date: "01/01/2025" },
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
        netCible: 4200,
        jours: 26,
        hSup: 0,
        pRegul: 0,
        pOccas: 0,
        avances: 0,
        credit: 0,
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
            lastSalary: "4 200,00 Dh"
        },
        creditInfo: {
            loanAmount: 0,
            payments: 0,
            remaining: 0
        },
        history: [
            { year: "23", type: "EMBAUCHE", amount: 4200, date: "15/05/2023" },
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
        netCible: 3800,
        jours: 26,
        hSup: 0,
        pRegul: 300,
        pOccas: 0,
        avances: 0,
        credit: 1500,
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
            lastSalary: "4 100,00 Dh"
        },
        creditInfo: {
            loanAmount: 5000,
            payments: 3500,
            remaining: 1500
        },
        history: [
            { year: "24", type: "EMBAUCHE", amount: 3800, date: "10/01/2024" },
        ]
    },
];

export default function PayePage() {
    const [viewMode, setViewMode] = useState<"Journal" | "Base">("Journal");
    const [staffMembers, setStaffMembers] = useState(staff);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(staff[0].id);
    const [month, setMonth] = useState("JANVIER");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<StaffMember | null>(null);
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

    const handleJournalEdit = (emp: StaffMember) => {
        setJournalEditingId(emp.id);
        setJournalEditData({ ...emp });
    };

    const handleJournalSave = () => {
        if (journalEditData) {
            setStaffMembers(prev => prev.map(s => s.id === journalEditData.id ? journalEditData : s));
            setJournalEditingId(null);
            setJournalEditData(null);
        }
    };

    const handleJournalCancel = () => {
        setJournalEditingId(null);
        setJournalEditData(null);
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
            netCible: 0,
            jours: 26,
            hSup: 0,
            pRegul: 0,
            pOccas: 0,
            avances: 0,
            credit: 0,
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
                fixedBonus: 0,
                lastSalary: "0,00 Dh"
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
        setEditData(newEmployee);
        setIsEditing(true);
    };

    return (
        <div className="flex min-h-screen bg-[#F6F8FC] font-outfit">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col">

                {/* Custom Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tight text-[#1E293B]">Paye</span>
                        </div>

                        <div className="flex bg-[#E2E8F0]/50 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode("Journal")}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 tracking-wider uppercase",
                                    viewMode === "Journal" ? "bg-[#1E293B] text-white shadow-md font-black" : "text-slate-500 hover:text-slate-700 font-bold"
                                )}
                            >
                                <Calculator className="w-4 h-4" /> Journal de Paye
                            </button>
                            <button
                                onClick={() => setViewMode("Base")}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 tracking-wider uppercase",
                                    viewMode === "Base" ? "bg-[#1E293B] text-white shadow-md font-black" : "text-slate-500 hover:text-slate-700 font-bold"
                                )}
                            >
                                <Users className="w-4 h-4" /> Base Personnel
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-[#E2E8F0]/50 p-1 rounded-xl">
                            <button className="px-4 py-2 rounded-lg text-xs font-bold text-[#1E293B] bg-white shadow-sm flex items-center gap-2 tracking-wider uppercase">
                                <Edit3 className="w-4 h-4" /> Saisie
                            </button>
                            <button className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-white/50 flex items-center gap-2 tracking-wider uppercase">
                                <BookOpen className="w-4 h-4" /> Comptable
                            </button>
                        </div>

                        <button className="flex items-center gap-3 px-6 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-[#D97706]/50 transition-colors group">
                            <Calendar className="w-4 h-4 text-[#D97706]" />
                            <span className="text-sm font-black text-[#D97706] tracking-[0.2em]">{month}</span>
                            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-[#D97706]" />
                        </button>
                    </div>
                </header>

                <div className="p-0 flex-1 overflow-hidden flex">
                    {viewMode === "Journal" ? (
                        <div className="p-6 w-full h-full flex flex-col">
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 h-full flex flex-col">
                                <div className="overflow-auto custom-scrollbar flex-1">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100/50 text-[10px] text-slate-500 uppercase font-black tracking-widest border-b border-slate-200">
                                                <th className="px-4 py-3 text-left w-10">#</th>
                                                <th className="px-4 py-3 text-left">Salarié</th>
                                                <th className="px-4 py-3 text-right">Net Cible</th>
                                                <th className="px-4 py-3 text-center w-24">Jours</th>
                                                <th className="px-4 py-3 text-center w-20">H. Sup</th>
                                                <th className="px-4 py-3 text-right w-28">P. Régul</th>
                                                <th className="px-4 py-3 text-right w-28">P. Occas</th>
                                                <th className="px-4 py-3 text-right w-28 text-orange-600">Avances</th>
                                                <th className="px-4 py-3 text-right w-28 text-red-600">Crédit</th>
                                                <th className="px-4 py-3 text-right bg-slate-800 text-white w-32">Net à Payer</th>
                                                <th className="px-4 py-3 text-right w-24">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {staffMembers.map((emp, idx) => {
                                                const isJournalEditing = journalEditingId === emp.id;
                                                const currentData = isJournalEditing ? journalEditData! : emp;

                                                // Net à Payer calculation
                                                const netAPayer = currentData.netCible + currentData.pRegul + currentData.pOccas - currentData.avances;

                                                return (
                                                    <tr key={emp.id} className={cn(
                                                        "group transition-all hover:bg-slate-50/50",
                                                        isJournalEditing ? "bg-blue-50/30" : (idx % 2 === 0 ? "bg-white" : "bg-slate-50/20")
                                                    )}>
                                                        <td className="px-4 py-3 text-center text-[10px] font-bold text-slate-400">
                                                            {emp.id}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase shadow-sm">
                                                                    {emp.initials}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                                                        {emp.name}
                                                                        {emp.contract.exitDate && emp.contract.exitDate !== "-" && (
                                                                            <span className="px-1 py-0.5 rounded-md bg-slate-100 text-[7px] text-slate-400 border border-slate-200 uppercase font-black">Sorti</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{emp.role}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-sm font-black text-emerald-600 tracking-tight">
                                                                {emp.netCible.toLocaleString("fr-FR")} Dh
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {isJournalEditing ? (
                                                                <input
                                                                    type="number"
                                                                    value={journalEditData?.jours}
                                                                    onChange={(e) => setJournalEditData(prev => prev ? { ...prev, jours: Number(e.target.value) } : null)}
                                                                    className="w-14 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-black text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-black text-slate-700">{emp.jours}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {isJournalEditing ? (
                                                                <input
                                                                    type="number"
                                                                    value={journalEditData?.hSup}
                                                                    onChange={(e) => setJournalEditData(prev => prev ? { ...prev, hSup: Number(e.target.value) } : null)}
                                                                    className="w-14 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-black text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-bold text-slate-400">{emp.hSup > 0 ? emp.hSup : "—"}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {isJournalEditing ? (
                                                                <input
                                                                    type="number"
                                                                    value={journalEditData?.pRegul}
                                                                    onChange={(e) => setJournalEditData(prev => prev ? { ...prev, pRegul: Number(e.target.value) } : null)}
                                                                    className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-black text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-black text-purple-600/80">
                                                                    {emp.pRegul > 0 ? emp.pRegul.toLocaleString("fr-FR") : "—"}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {isJournalEditing ? (
                                                                <input
                                                                    type="number"
                                                                    value={journalEditData?.pOccas}
                                                                    onChange={(e) => setJournalEditData(prev => prev ? { ...prev, pOccas: Number(e.target.value) } : null)}
                                                                    className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-black text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-black text-blue-600/80">
                                                                    {emp.pOccas > 0 ? emp.pOccas.toLocaleString("fr-FR") : "—"}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {isJournalEditing ? (
                                                                <input
                                                                    type="number"
                                                                    value={journalEditData?.avances}
                                                                    onChange={(e) => setJournalEditData(prev => prev ? { ...prev, avances: Number(e.target.value) } : null)}
                                                                    className="w-24 bg-white border border-orange-200 rounded px-2 py-1 text-xs font-black text-right focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-600"
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-black text-orange-600/80">
                                                                    {emp.avances > 0 ? emp.avances.toLocaleString("fr-FR") : "—"}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-sm font-black text-red-500/80">
                                                                    {emp.credit > 0 ? emp.credit.toLocaleString("fr-FR") : "—"}
                                                                </span>
                                                                {emp.credit > 0 && <span className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter">Retenu</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right bg-slate-800">
                                                            <span className="text-lg font-black text-orange-400 tracking-tight">
                                                                {netAPayer.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {isJournalEditing ? (
                                                                <div className="flex justify-end gap-1.5 animate-in fade-in zoom-in duration-200">
                                                                    <button
                                                                        onClick={handleJournalSave}
                                                                        className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                                                                    >
                                                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                    </button>
                                                                    <button
                                                                        onClick={handleJournalCancel}
                                                                        className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                                                                    >
                                                                        <X className="w-3.5 h-3.5 stroke-[3]" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleJournalEdit(emp)}
                                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-[#1E293B] p-4 flex justify-between items-center text-white shrink-0">
                                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest opacity-60">
                                        <div>Total Salariés: {staffMembers.length}</div>
                                        <div>Masse Salariale Net: {staffMembers.reduce((acc, curr) => acc + curr.netCible + curr.pRegul + curr.pOccas - curr.avances, 0).toLocaleString("fr-FR")} Dh</div>
                                    </div>
                                    <button className="px-4 py-2 bg-[#D97706] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#B45309] transition-colors">
                                        Valider le Journal
                                    </button>
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
                                                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-300"
                                            />
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

                                                <div className="pr-1">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full transition-all",
                                                        emp.contract.exitDate && emp.contract.exitDate !== "-"
                                                            ? "bg-slate-300 shadow-none"
                                                            : "bg-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.5)]"
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
                                                    "w-16 h-16 rounded-[1rem] flex items-center justify-center shrink-0 shadow-sm border mt-1 relative",
                                                    selectedEmployee.contract.exitDate && selectedEmployee.contract.exitDate !== "-"
                                                        ? "bg-slate-100 border-slate-200"
                                                        : (selectedEmployee.gender === "Femme" ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100")
                                                )}>
                                                    <User className={cn(
                                                        "w-8 h-8 opacity-80",
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
                                                <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[4rem]">
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

                                        <div className="flex flex-col items-center px-8 border-l border-slate-100 min-w-[120px]">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Congés dus</div>
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex flex-col items-center justify-center shadow-sm">
                                                    <span className="text-emerald-700 font-black text-lg leading-none">
                                                        {calculateLeaveDays(selectedEmployee.contract.hireDate, selectedEmployee.contract.exitDate)}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-emerald-600 uppercase">Jours</span>
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end px-8 border-l border-slate-100 min-w-fit">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Dernier Salaire</div>
                                            {isEditing ? (
                                                <div className="flex items-baseline gap-1">
                                                    <input
                                                        value={editData?.contract.lastSalary || ""}
                                                        onChange={(e) => setEditData(prev => prev ? { ...prev, contract: { ...prev.contract, lastSalary: e.target.value } } : null)}
                                                        className={cn(
                                                            "bg-slate-50 border-b-2 border-slate-200 focus:outline-none text-xl font-black text-slate-900 text-right w-40",
                                                            selectedEmployee.gender === "Femme" ? "focus:border-red-500" : "focus:border-blue-500"
                                                        )}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-2xl font-black text-slate-900 tracking-tight">{selectedEmployee.contract.lastSalary}</div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isEditing ? (
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
                                            ) : (
                                                <button
                                                    onClick={handleEdit}
                                                    className={cn(
                                                        "font-bold py-2.5 px-6 rounded-xl text-sm transition-colors flex items-center gap-2 border shadow-md",
                                                        selectedEmployee.gender === "Femme"
                                                            ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-100"
                                                            : "bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100"
                                                    )}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" /> Modifier
                                                </button>
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
                                                <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-slate-100 shadow-sm space-y-8">
                                                    {/* Identity Group */}
                                                    <div className="grid grid-cols-3 gap-10">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                <Calendar className="w-3 h-3" /> Naissance
                                                            </div>
                                                            <div className="flex items-baseline gap-2">
                                                                {isEditing ? (
                                                                    <input
                                                                        type="text"
                                                                        value={editData?.birthDate || ""}
                                                                        onChange={(e) => setEditData(prev => prev ? { ...prev, birthDate: e.target.value } : null)}
                                                                        placeholder="JJ/MM/AAAA"
                                                                        className={cn(
                                                                            "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 w-48 transition-all shrink-0",
                                                                            selectedEmployee.gender === "Femme"
                                                                                ? "focus:ring-red-500/20 focus:border-red-500"
                                                                                : "focus:ring-blue-500/20 focus:border-blue-500"
                                                                        )}
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
                                                    <div className="h-px bg-slate-200/50 w-full" />

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
                                                                            onChange={(e) => setEditData(prev => prev ? { ...prev, personalInfo: { ...prev.personalInfo, phone: e.target.value } } : null)}
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
                                                                            onChange={(e) => setEditData(prev => prev ? { ...prev, personalInfo: { ...prev.personalInfo, phone2: e.target.value } } : null)}
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
                                                                            {(selectedEmployee.personalInfo.phone || "").replace(/(\d{2})(?=\d)/g, '$1 ')}
                                                                        </div>
                                                                        {selectedEmployee.personalInfo.phone2 && (
                                                                            <div className="text-sm font-bold text-slate-800 tracking-tight">
                                                                                {selectedEmployee.personalInfo.phone2.replace(/(\d{2})(?=\d)/g, '$1 ')}
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
                                                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex-1 flex flex-col min-h-0">
                                                    {/* Salary Graph */}
                                                    <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Évolution Salaire</div>
                                                            <div className={cn(
                                                                "text-[10px] font-bold uppercase tracking-widest",
                                                                selectedEmployee.gender === "Femme" ? "text-red-600 bg-red-50" : "text-blue-600 bg-blue-50",
                                                                "px-2 py-0.5 rounded"
                                                            )}>Derniers 12 mois</div>
                                                        </div>
                                                        <div className="h-32 w-full relative group">
                                                            {/* Simple SVG Graph */}
                                                            <svg viewBox="0 0 100 40" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                                                                <defs>
                                                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor={selectedEmployee.gender === "Femme" ? "#EF4444" : "#3B82F6"} stopOpacity="0.2" />
                                                                        <stop offset="100%" stopColor={selectedEmployee.gender === "Femme" ? "#EF4444" : "#3B82F6"} stopOpacity="0" />
                                                                    </linearGradient>
                                                                </defs>
                                                                {/* Area */}
                                                                <path
                                                                    d="M 0 40 L 0 25 L 20 28 L 40 22 L 60 24 L 80 15 L 100 12 L 100 40 Z"
                                                                    fill="url(#lineGradient)"
                                                                />
                                                                {/* Line */}
                                                                <path
                                                                    d="M 0 25 L 20 28 L 40 22 L 60 24 L 80 15 L 100 12"
                                                                    fill="none"
                                                                    stroke="#3B82F6"
                                                                    strokeWidth="1.5"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                                {/* Points */}
                                                                {[
                                                                    { x: 0, y: 25 }, { x: 20, y: 28 }, { x: 40, y: 22 },
                                                                    { x: 60, y: 24 }, { x: 80, y: 15 }, { x: 100, y: 12 }
                                                                ].map((p, i) => (
                                                                    <circle key={i} cx={p.x} cy={p.y} r="1" fill="white" stroke={selectedEmployee.gender === "Femme" ? "#EF4444" : "#3B82F6"} strokeWidth="0.5" />
                                                                ))}
                                                            </svg>
                                                            {/* Y-Axis Labels (Fake) */}
                                                            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] font-bold text-slate-300 pointer-events-none">
                                                                <span>5k</span>
                                                                <span>3k</span>
                                                                <span>1k</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/50">
                                                            <div className="text-[9px] font-bold text-slate-400">Progression</div>
                                                            <div className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                                                                +12.5% <span className="text-[8px] font-bold text-slate-300 ml-1">vs AN-1</span>
                                                            </div>
                                                        </div>
                                                    </div>

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
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            <input
                                                                                value={h.year}
                                                                                onChange={(e) => setEditData(prev => prev ? { ...prev, history: prev.history.map((ev, idx) => idx === i ? { ...ev, year: e.target.value } : ev) } : null)}
                                                                                className="bg-white border border-slate-200 text-[11px] font-bold rounded px-2 py-1 focus:outline-none"
                                                                                placeholder="Année (ex: 25)"
                                                                            />
                                                                            <input
                                                                                value={h.amount}
                                                                                type="number"
                                                                                onChange={(e) => setEditData(prev => prev ? { ...prev, history: prev.history.map((ev, idx) => idx === i ? { ...ev, amount: Number(e.target.value) } : ev) } : null)}
                                                                                className={cn(
                                                                                    "bg-white border border-slate-200 text-[11px] font-bold rounded px-2 py-1 focus:outline-none text-right",
                                                                                    selectedEmployee.gender === "Femme" ? "text-red-600" : "text-blue-600"
                                                                                )}
                                                                                placeholder="Montant"
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
                                                                    onClick={() => setEditData(prev => prev ? { ...prev, history: [...prev.history, { year: "", type: "ÉVÉNEMENT", amount: 0, date: "" }] } : null)}
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
                                                                <div key={i} className="flex gap-4 items-center">
                                                                    <div className={cn(
                                                                        "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0",
                                                                        i === selectedEmployee.history.length - 1
                                                                            ? (selectedEmployee.gender === "Femme" ? "bg-red-600 text-white shadow-lg" : "bg-blue-600 text-white shadow-lg")
                                                                            : "bg-slate-50 text-slate-400 border border-slate-100"
                                                                    )}>
                                                                        {h.year}
                                                                    </div>
                                                                    <div className="flex-1 flex justify-between items-center group">
                                                                        <div>
                                                                            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">{h.type}</div>
                                                                            <div className="text-[10px] font-medium text-slate-400">{h.date}</div>
                                                                        </div>
                                                                        <div className={cn(
                                                                            "text-sm font-bold",
                                                                            i === selectedEmployee.history.length - 1
                                                                                ? (selectedEmployee.gender === "Femme" ? "text-red-600" : "text-blue-600")
                                                                                : "text-slate-500"
                                                                        )}>
                                                                            {h.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} Dh
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
                                                <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-slate-100 shadow-sm flex-1">
                                                    <div className="space-y-12">
                                                        {/* Ligne 1: Infos Poste */}
                                                        <div className="grid grid-cols-3 gap-12">
                                                            <div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date Embauche</div>
                                                                {isEditing ? (
                                                                    <input
                                                                        type="text"
                                                                        value={editData?.contract.hireDate || ""}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
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
                                                                        placeholder="JJ/MM/AAAA"
                                                                        className={cn(
                                                                            "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 w-full",
                                                                            selectedEmployee.gender === "Femme"
                                                                                ? "focus:ring-red-500/10 focus:border-red-500"
                                                                                : "focus:ring-blue-500/10 focus:border-blue-500"
                                                                        )}
                                                                    />
                                                                ) : (
                                                                    <div className="text-base font-bold text-slate-800 tracking-tight">{selectedEmployee.contract.hireDate}</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date de Sortie</div>
                                                                {isEditing ? (
                                                                    <input
                                                                        type="text"
                                                                        value={editData?.contract.exitDate || ""}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
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
                                                                        placeholder="JJ/MM/AAAA"
                                                                        className={cn(
                                                                            "bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 w-full transition-all",
                                                                            selectedEmployee.gender === "Femme"
                                                                                ? "focus:ring-red-500/10 focus:border-red-500 text-red-600"
                                                                                : "focus:ring-blue-500/10 focus:border-blue-500 text-blue-600"
                                                                        )}
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

                                                        {/* Ligne 2: Infos Crédit */}
                                                        <div className="grid grid-cols-3 gap-12 pt-8 border-t border-slate-200/60">
                                                            <div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Montant Prêté</div>
                                                                {isEditing ? (
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number"
                                                                            value={editData?.creditInfo.loanAmount || 0}
                                                                            onChange={(e) => setEditData(prev => prev ? { ...prev, creditInfo: { ...prev.creditInfo, loanAmount: Number(e.target.value) } } : null)}
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
                                                                            onChange={(e) => setEditData(prev => prev ? { ...prev, creditInfo: { ...prev.creditInfo, payments: Number(e.target.value) } } : null)}
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
                                                                    )}>{selectedEmployee.creditInfo.payments.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} Dh</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Reste dû</div>
                                                                <div className="text-xl font-black text-red-600">
                                                                    {(() => {
                                                                        const credit = isEditing ? editData?.creditInfo : selectedEmployee.creditInfo;
                                                                        return ((credit?.loanAmount || 0) - (credit?.payments || 0)).toLocaleString("fr-FR", { minimumFractionDigits: 2 });
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
                    )}
                </div>
            </main>
        </div>
    );
}
