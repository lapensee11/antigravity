import { TiersContent } from "@/components/tiers/TiersContent";
import { getTiers } from "@/lib/actions/tiers";

export default async function TiersPage() {
    const tiers = await getTiers();

    return <TiersContent initialTiers={tiers} />;
}
