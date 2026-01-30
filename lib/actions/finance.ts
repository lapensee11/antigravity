import { getLocalDB } from "@/lib/db";
import { invoices, invoiceLines, payments, transactions, articles } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { safeRevalidate } from "./revalidate";
import { Invoice, Transaction, InvoiceLine, Payment, Article } from "@/lib/types";
import { isTauri, getDesktopDB } from "./db-desktop";

// --- INVOICES ---

export async function getInvoices() {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const allInvoices = await tauriDb.select("SELECT * FROM invoices ORDER BY date DESC") as any[];
            const allLines = await tauriDb.select("SELECT * FROM invoice_lines") as any[];
            const allPayments = await tauriDb.select("SELECT * FROM payments") as any[];

            return allInvoices.map(inv => ({
                ...inv,
                supplierId: inv.supplier_id,
                totalHT: inv.total_ht,
                totalTTC: inv.total_ttc,
                balanceDue: inv.balance_due,
                dateEncaissement: inv.date_encaissement,
                paymentDelay: inv.payment_delay,
                lines: allLines.filter((l: any) => l.invoice_id === inv.id).map((ll: any) => ({
                    ...ll,
                    articleId: ll.article_id,
                    articleName: ll.article_name,
                    priceHT: ll.price_ht,
                    vatRate: ll.vat_rate,
                    totalTTC: ll.total_ttc
                })),
                payments: allPayments.filter((p: any) => p.invoice_id === inv.id).map((pp: any) => ({
                    ...pp,
                    invoiceId: pp.invoice_id,
                    checkAmount: pp.check_amount,
                    isReconciled: !!pp.is_reconciled
                })),
            })) as Invoice[];
        } catch (error) {
            console.error("Tauri Fetch Invoices Error:", error);
            return [];
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return [];
        const res = await db.query.invoices.findMany({
            with: { lines: true, payments: true, },
            orderBy: [desc(invoices.date)],
        });
        return res.map(inv => ({
            ...inv,
            lines: inv.lines || [],
            payments: inv.payments || [],
        })) as Invoice[];
    } catch (error) {
        console.error("Fetch Invoices Error:", error);
        return [];
    }
}

export async function saveInvoice(invoiceData: Invoice) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const { lines, payments: invPayments } = invoiceData;

            console.log("Tauri: Saving invoice", invoiceData.id, invoiceData.number);
            await tauriDb.execute(`
                INSERT INTO invoices (
                    id, supplier_id, number, date, status, total_ht, total_ttc, 
                    rounding, deposit, balance_due, comment, date_encaissement, payment_delay
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET 
                    supplier_id=excluded.supplier_id,
                    number=excluded.number, 
                    date=excluded.date,
                    status=excluded.status, 
                    total_ht=excluded.total_ht,
                    total_ttc=excluded.total_ttc,
                    rounding=excluded.rounding,
                    deposit=excluded.deposit,
                    balance_due=excluded.balance_due,
                    comment=excluded.comment,
                    date_encaissement=excluded.date_encaissement,
                    payment_delay=excluded.payment_delay
            `, [
                invoiceData.id,
                invoiceData.supplierId,
                invoiceData.number,
                invoiceData.date,
                invoiceData.status,
                invoiceData.totalHT,
                invoiceData.totalTTC,
                invoiceData.rounding || 0,
                invoiceData.deposit || 0,
                invoiceData.balanceDue,
                invoiceData.comment || null,
                invoiceData.dateEncaissement || null,
                invoiceData.paymentDelay || null
            ]);

            console.log("Tauri: Deleting and re-inserting lines for", invoiceData.id);
            await tauriDb.execute("DELETE FROM invoice_lines WHERE invoice_id = ?", [invoiceData.id]);
            for (const l of (lines || [])) {
                await tauriDb.execute(`
                    INSERT INTO invoice_lines (id, invoice_id, article_id, article_name, quantity, unit, price_ht, discount, vat_rate, total_ttc)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [l.id, invoiceData.id, l.articleId, l.articleName, l.quantity, l.unit, l.priceHT, l.discount, l.vatRate, l.totalTTC]);
            }

            console.log("Tauri: Deleting and re-inserting payments for", invoiceData.id);
            await tauriDb.execute("DELETE FROM payments WHERE invoice_id = ?", [invoiceData.id]);
            for (const p of (invPayments || [])) {
                await tauriDb.execute(`
                    INSERT INTO payments (id, invoice_id, date, amount, mode, account, reference, check_amount, note, is_reconciled)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [p.id, invoiceData.id, p.date, p.amount, p.mode, p.account, p.reference || null, p.checkAmount || 0, p.note || null, p.isReconciled ? 1 : 0]);
            }
            console.log("Tauri: Save invoice SUCCESS.");
            return { success: true };
        } catch (error) {
            console.error("Tauri Save Invoice Error:", error);
            return { success: false, error: String(error) };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        const { lines, payments: invPayments, ...mainData } = invoiceData;
        const existing = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceData.id) });
        if (existing) {
            await db.update(invoices).set(mainData).where(eq(invoices.id, invoiceData.id));
            await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceData.id));
            await db.delete(payments).where(eq(payments.invoiceId, invoiceData.id));
        } else {
            await db.insert(invoices).values(mainData);
        }
        if (lines && lines.length > 0) {
            await db.insert(invoiceLines).values(lines.map(l => ({ ...l, invoiceId: invoiceData.id })));
        }
        if (invPayments && invPayments.length > 0) {
            await db.insert(payments).values(invPayments.map(p => ({ ...p, invoiceId: invoiceData.id })));
        }
        if (!isTauri()) {
            await safeRevalidate("/achats");
            await safeRevalidate("/finance");
        }
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function deleteInvoice(id: string) {
    if (isTauri()) {
        try {
            console.log("Tauri: Final Delete Invoice attempt for ID:", id);
            const tauriDb = await getDesktopDB();

            console.log("Tauri: Deleting lines...");
            await tauriDb.execute("DELETE FROM invoice_lines WHERE invoice_id = ?", [id]);

            console.log("Tauri: Deleting payments...");
            await tauriDb.execute("DELETE FROM payments WHERE invoice_id = ?", [id]);

            console.log("Tauri: Deleting transactions...");
            await tauriDb.execute("DELETE FROM transactions WHERE invoice_id = ?", [id]);

            console.log("Tauri: Deleting invoice itself...");
            const res = await tauriDb.execute("DELETE FROM invoices WHERE id = ?", [id]);

            console.log("Tauri: Delete result from driver:", res);
            return { success: true };
        } catch (error) {
            console.error("Tauri: Delete Invoice CRITICAL FAILURE:", error);
            return { success: false, error: String(error) };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));
        await db.delete(payments).where(eq(payments.invoiceId, id));
        await db.delete(invoices).where(eq(invoices.id, id));
        await db.delete(transactions).where(eq(transactions.invoiceId, id));
        if (!isTauri()) {
            await safeRevalidate("/achats");
            await safeRevalidate("/finance");
        }
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function getTransactions() {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const res = await tauriDb.select("SELECT * FROM transactions ORDER BY date DESC") as any[];
            return res.map(tx => ({
                ...tx,
                invoiceId: tx.invoice_id,
                pieceNumber: tx.piece_number,
                isReconciled: !!tx.is_reconciled,
                reconciledDate: tx.reconciled_date
            })) as Transaction[];
        } catch (error) {
            console.error("Tauri Fetch Transactions Error:", error);
            return [];
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return [];
        return (await db.select().from(transactions).orderBy(desc(transactions.date))) as Transaction[];
    } catch (error) {
        return [];
    }
}

export async function saveTransaction(txData: Transaction) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            await tauriDb.execute(`
                INSERT INTO transactions (id, date, label, amount, type, category, account, invoice_id, tier, piece_number, is_reconciled, reconciled_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET label=excluded.label, amount=excluded.amount, is_reconciled=excluded.is_reconciled
            `, [txData.id, txData.date, txData.label, txData.amount, txData.type, txData.category, txData.account, txData.invoiceId, txData.tier, txData.pieceNumber, txData.isReconciled ? 1 : 0, txData.reconciledDate]);
            return { success: true };
        } catch (e) {
            return { success: false };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        const existing = await db.query.transactions.findFirst({ where: eq(transactions.id, txData.id) });
        if (existing) {
            await db.update(transactions).set(txData).where(eq(transactions.id, txData.id));
        } else {
            await db.insert(transactions).values(txData);
        }
        if (!isTauri()) {
            await safeRevalidate("/finance");
            await safeRevalidate("/achats");
        }
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function deleteTransaction(id: string) {
    if (isTauri()) {
        const tauriDb = await getDesktopDB();
        await tauriDb.execute("DELETE FROM transactions WHERE id = ?", [id]);
        return { success: true };
    }
    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        await db.delete(transactions).where(eq(transactions.id, id));
        if (!isTauri()) {
            await safeRevalidate("/finance");
        }
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

// Support for handleSync logic: Replace transactions for an invoice
export async function syncInvoiceTransactions(invoiceId: string, newTxs: Transaction[]) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            await tauriDb.execute("DELETE FROM transactions WHERE invoice_id = ?", [invoiceId]);
            for (const tx of newTxs) {
                await tauriDb.execute(`
                    INSERT INTO transactions (id, date, label, amount, type, category, account, invoice_id, tier, piece_number, is_reconciled, reconciled_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [tx.id, tx.date, tx.label, tx.amount, tx.type, tx.category, tx.account, tx.invoiceId, tx.tier, tx.pieceNumber, tx.isReconciled ? 1 : 0, tx.reconciledDate]);
            }
            return { success: true };
        } catch (error) {
            console.error("Tauri Sync Transactions Error:", error);
            return { success: false, error: String(error) };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        await db.delete(transactions).where(eq(transactions.invoiceId, invoiceId));
        if (newTxs.length > 0) {
            await db.insert(transactions).values(newTxs);
        }
        if (!isTauri()) {
            await safeRevalidate("/finance");
            await safeRevalidate("/achats");
        }
        return { success: true };
    } catch (error) {
        console.error("Sync Transactions Error:", error);
        return { success: false, error: String(error) };
    }
}

export async function updateArticlePivotPrices(articlesToUpdate: { id: string, lastPivotPrice: number }[]) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            for (const art of articlesToUpdate) {
                await tauriDb.execute("UPDATE articles SET last_pivot_price = ? WHERE id = ?", [art.lastPivotPrice, art.id]);
            }
            return { success: true };
        } catch (e) {
            return { success: false };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        for (const art of articlesToUpdate) {
            await db.update(articles).set({ lastPivotPrice: art.lastPivotPrice }).where(eq(articles.id, art.id));
        }
        if (!isTauri()) {
            await safeRevalidate("/achats");
        }
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}
