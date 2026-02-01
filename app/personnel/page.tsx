"use client";

import { Suspense, useEffect, useState } from "react";
import { PayeContent } from "@/components/payroll/PayeContent";
import { getEmployees } from "@/lib/data-service";
import { StaffMember } from "@/lib/types";

export default function PersonnelPage() {
    const [employees, setEmployees] = useState<StaffMember[] | null>(null);

    useEffect(() => {
        async function fetchData() {
            const data = await getEmployees();
            setEmployees(data);
        }
        fetchData();
    }, []);

    if (!employees) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Initialisation de l'annuaire RH...</div>;

    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement...</div>}>
            <PayeContent initialEmployees={employees} defaultViewMode="BASE" />
        </Suspense>
    );
}
