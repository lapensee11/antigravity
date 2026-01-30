import { Suspense } from "react";
import { FinanceContent } from "@/components/finance/FinanceContent";
import { getTransactions } from "@/lib/actions/finance";

export default async function FinancePage() {
    const transactions = await getTransactions();

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <FinanceContent initialTransactions={transactions} />
        </Suspense>
    );
}
