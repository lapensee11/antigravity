import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { getDashboardData } from "@/lib/actions/dashboard";

export default async function DashboardPage() {
    const data = await getDashboardData();

    return (
        <DashboardContent data={data} />
    );
}
