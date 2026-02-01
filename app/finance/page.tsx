"use client";

import { Suspense, useEffect, useState } from "react";
import { FinanceContent } from "@/components/finance/FinanceContent";
import { getTransactions } from "@/lib/data-service";
import { Transaction } from "@/lib/types";

export default function FinancePage() {
    const [transactions, setTransactions] = useState<Transaction[] | null>(null);

    useEffect(() => {
        async function fetchData() {
            setTransactions(await getTransactions());
        }
        fetchData();
    }, []);

    if (!transactions) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement des finances...</div>;

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <FinanceContent initialTransactions={transactions} />
        </Suspense>
    );
}
