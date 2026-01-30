import { getLocalDB } from "@/lib/db";
import { staffMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { safeRevalidate } from "./revalidate";
import { StaffMember } from "@/lib/types";
import { isTauri, getDesktopDB } from "./db-desktop";

export async function getStaffMembers() {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const res = await tauriDb.select("SELECT * FROM staff_members ORDER BY id ASC") as any[];
            return res.map(member => ({
                ...member,
                firstName: member.first_name,
                lastName: member.last_name,
                birthDate: member.birth_date,
                situationFamiliale: member.situation_familiale,
                childrenCount: member.children_count,
                personalInfo: member.personal_info ? JSON.parse(member.personal_info) : { cin: "", cnss: "", phone: "", city: "", address: "" },
                contract: member.contract ? JSON.parse(member.contract) : { post: "", hireDate: "", exitDate: "", seniority: "", leaveBalance: "", baseSalary: 0, fixedBonus: 0 },
                creditInfo: member.credit_info ? JSON.parse(member.credit_info) : { loanAmount: 0, payments: 0, remaining: 0 },
                history: member.history ? JSON.parse(member.history) : [],
                monthlyData: member.monthly_data ? JSON.parse(member.monthly_data) : {},
            })) as StaffMember[];
        } catch (error) {
            console.error("Tauri Fetch Staff Error:", error);
            return [];
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return [];
        const res = await db.query.staffMembers.findMany({
            orderBy: (staffMembers: any, { asc }: any) => [asc(staffMembers.id)],
        });

        return res.map(member => ({
            ...member,
            personalInfo: member.personalInfo ? JSON.parse(member.personalInfo) : { cin: "", cnss: "", phone: "", city: "", address: "" },
            contract: member.contract ? JSON.parse(member.contract) : { post: "", hireDate: "", exitDate: "", seniority: "", leaveBalance: "", baseSalary: 0, fixedBonus: 0 },
            creditInfo: member.creditInfo ? JSON.parse(member.creditInfo) : { loanAmount: 0, payments: 0, remaining: 0 },
            history: member.history ? JSON.parse(member.history) : [],
            monthlyData: member.monthlyData ? JSON.parse(member.monthlyData) : {},
        })) as StaffMember[];
    } catch (error) {
        console.error("Fetch Staff Error:", error);
        return [];
    }
}

export async function saveStaffMember(member: StaffMember) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const { personalInfo, contract, creditInfo, history, monthlyData } = member;

            await tauriDb.execute(`
                INSERT INTO staff_members (id, initials, name, first_name, last_name, role, gender, birth_date, matricule, situation_familiale, children_count, credit, personal_info, contract, credit_info, history, monthly_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    initials = excluded.initials,
                    name = excluded.name, 
                    first_name = excluded.first_name,
                    last_name = excluded.last_name,
                    role = excluded.role, 
                    gender = excluded.gender,
                    birth_date = excluded.birth_date,
                    matricule = excluded.matricule,
                    situation_familiale = excluded.situation_familiale,
                    children_count = excluded.children_count,
                    credit = excluded.credit,
                    personal_info = excluded.personal_info, 
                    contract = excluded.contract,
                    credit_info = excluded.credit_info, 
                    history = excluded.history,
                    monthly_data = excluded.monthly_data
            `, [
                member.id, member.initials, member.name, member.firstName, member.lastName,
                member.role, member.gender, member.birthDate, member.matricule,
                member.situationFamiliale, member.childrenCount, member.credit,
                JSON.stringify(personalInfo), JSON.stringify(contract),
                JSON.stringify(creditInfo), JSON.stringify(history),
                JSON.stringify(monthlyData)
            ]);
            return { success: true };
        } catch (error) {
            console.error("Tauri Save Staff Error:", error);
            return { success: false, error: String(error) };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false, error: "DB not loaded" };
        const { personalInfo, contract, creditInfo, history, monthlyData, ...flatData } = member;
        const dataToSave = {
            ...flatData,
            personalInfo: JSON.stringify(personalInfo),
            contract: JSON.stringify(contract),
            creditInfo: JSON.stringify(creditInfo),
            history: JSON.stringify(history),
            monthlyData: JSON.stringify(monthlyData),
        };
        const existing = await db.query.staffMembers.findFirst({ where: eq(staffMembers.id, member.id) });
        if (existing) {
            await db.update(staffMembers).set(dataToSave).where(eq(staffMembers.id, member.id));
        } else {
            await db.insert(staffMembers).values(dataToSave);
        }
        if (!isTauri()) {
            await safeRevalidate("/paye");
        }
        return { success: true };
    } catch (error) {
        console.error("Save Staff Error:", error);
        return { success: false, error: String(error) };
    }
}

export async function deleteStaffMember(id: number) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            await tauriDb.execute("DELETE FROM staff_members WHERE id = ?", [id]);
            return { success: true };
        } catch (error) {
            console.error("Tauri Delete Staff Error:", error);
            return { success: false, error: String(error) };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        await db.delete(staffMembers).where(eq(staffMembers.id, id));
        if (!isTauri()) {
            await safeRevalidate("/paye");
        }
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}
