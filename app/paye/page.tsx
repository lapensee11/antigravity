import { Suspense } from "react";
import { PayeContent } from "@/components/payroll/PayeContent";
import { getStaffMembers } from "@/lib/actions/paye";

export default async function PayePage() {
    const staff = await getStaffMembers();

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <PayeContent initialStaff={staff} />
        </Suspense>
    );
}
