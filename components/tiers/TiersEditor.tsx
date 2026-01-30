import { GlassInput } from "@/components/ui/GlassInput";
import { Tier, TierType } from "@/lib/types";
import { Save, User, Building, CreditCard, Phone, Mail, Globe, MapPin, Pencil, Trash2, FileText, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TiersEditorProps {
    tier?: Tier | null;
    onSave: (tier: Tier) => void;
    onDelete?: (id: string) => void;
    onGetTypeCode?: (type: "Fournisseur" | "Client") => string;
}

export function TiersEditor({ tier, onSave, onDelete, onGetTypeCode }: TiersEditorProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<Partial<Tier>>({});
    const [activeTab, setActiveTab] = useState("Contact");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (tier) {
            setFormData(tier);
            const isNew = tier.id === "new";
            setIsEditing(isNew);

            // Auto-generate code for new tier
            if (isNew && onGetTypeCode && tier.code === "Nouveau") {
                const newCode = onGetTypeCode(tier.type as any);
                setFormData(prev => ({ ...prev, code: newCode }));
            }
        } else {
            setFormData({
                type: "Fournisseur",
                code: "Frs-XXX",
                name: "",
            });
            setIsEditing(false);
        }
    }, [tier, onGetTypeCode]);

    const handleChange = (field: keyof Tier, value: string | number | boolean) => {
        let formattedValue = value;
        if ((field === "phone" || field === "phone2") && typeof value === "string") {
            // Remove existing spaces and add space every 2 characters
            const cleaned = value.replace(/\s/g, "");
            formattedValue = cleaned.replace(/(.{2})(?=.)/g, "$1 ");
        }

        // Auto-update code if Type changes
        if (field === "type" && onGetTypeCode && (isEditing || formData.id === "new")) {
            const newCode = onGetTypeCode(value as any);
            setFormData(prev => ({
                ...prev,
                [field]: formattedValue as TierType,
                code: newCode
            }));
            return;
        }

        setFormData(prev => ({ ...prev, [field]: formattedValue }));
    };

    const handleSave = () => {
        if (onSave && formData) {
            onSave(formData as Tier);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (!formData.id || formData.id === "new") return;
        if (confirm("Êtes-vous sûr de vouloir supprimer ce tiers ? Cette action est irréversible.")) {
            console.log("TiersEditor: Deleting", formData.id);
            if (onDelete) onDelete(formData.id);
        }
    };

    if (!tier) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white">
                <div className="w-24 h-24 bg-slate-50 rounded-full mb-6 flex items-center justify-center shadow-sm">
                    <User className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-300">Aucune sélection</h3>
                <p className="text-sm text-slate-400 mt-2">Sélectionnez un tiers pour voir les détails</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-white">
            {/* HEADER SECTION */}
            <div className="px-10 pt-10 pb-4 mb-4">
                <div className="flex justify-between items-start">
                    {/* Left: Identity */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            {isEditing ? (
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleChange("type", e.target.value)}
                                    className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Fournisseur">Fournisseur</option>
                                    <option value="Client">Client</option>
                                </select>
                            ) : (
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                                    formData.type === "Fournisseur" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                                )}>
                                    {formData.type}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-[1rem] bg-[#FFF8E1] border border-[#FFE082] flex items-center justify-center text-3xl shadow-sm shrink-0">
                                {formData.logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover rounded-[1rem]" />
                                ) : (
                                    <span>🏭</span>
                                )}
                            </div>
                            <div className="flex-1">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.name || ""}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        placeholder="Nom du Tiers"
                                        className="text-3xl font-serif font-bold text-slate-900 border-b-2 border-slate-200 focus:border-indigo-500 focus:outline-none bg-transparent w-full placeholder:text-slate-300"
                                    />
                                ) : (
                                    <h1 className="text-3xl font-serif font-bold text-slate-900 leading-tight">
                                        {formData.name || "Nouveau Tiers"}
                                    </h1>
                                )}
                                <p className="text-slate-400 font-medium text-sm mt-1">
                                    {formData.code}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Stats & Actions */}
                    <div className="flex items-center gap-4">
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold text-sm shadow-sm group border border-transparent",
                                    isEditing
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-[#F3E5F5] hover:bg-[#E1BEE7] text-[#6A1B9A]"
                                )}
                            >
                                {isEditing ? <Save className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                                {isEditing ? "Enregistrer" : "Modifier"}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-[#F3E5F5] border border-[#E1BEE7] rounded-xl px-4 py-2 min-w-[140px] text-center">
                            <p className="text-[9px] font-bold text-[#8E24AA] uppercase tracking-widest mb-0.5">
                                CA
                            </p>
                            <div className="text-xl font-black text-[#6A1B9A]">
                                0 <span className="text-[10px] font-bold text-[#8E24AA]/80">DH</span>
                            </div>
                            <div className="text-[10px] text-[#8E24AA] font-medium leading-none pb-1">
                                0 Factures
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-12">

                {/* DATA ENTRY FRAME (Inset) with Tabs - Compacted */}
                <div className="mt-2 border border-[#E1BEE7] bg-[#F3E5F5]/30 rounded-2xl p-3 mx-2">
                    {/* Tabs Header */}
                    <div className="flex items-center gap-1 mb-3 border-b border-[#E1BEE7]/50 pb-1">
                        {["Contact", "Infos / Banque", "Notes"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-bold transition-all relative",
                                    activeTab === tab
                                        ? "text-[#6A1B9A]"
                                        : "text-slate-400 hover:text-[#6A1B9A]"
                                )}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-[-5px] left-0 right-0 h-[3px] bg-[#6A1B9A] rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab 1: Contact */}
                    {activeTab === "Contact" && (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* LEFT COLUMN: Phones, Website, Address */}
                            <div className="space-y-3">
                                {/* Row 1: Nom & Prénom */}
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-0.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nom</label>
                                        {isEditing ? (
                                            <GlassInput
                                                icon={<User className="w-3.5 h-3.5" />}
                                                value={formData.lastName || ""}
                                                onChange={e => handleChange("lastName", e.target.value)}
                                                className="bg-white h-9 py-1 text-sm"
                                            />
                                        ) : (
                                            <div className="h-9 flex items-center px-1 text-sm font-bold text-slate-700">
                                                {formData.lastName || "-"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Prénom</label>
                                        {isEditing ? (
                                            <GlassInput
                                                icon={<User className="w-3.5 h-3.5" />}
                                                value={formData.firstName || ""}
                                                onChange={e => handleChange("firstName", e.target.value)}
                                                className="bg-white h-9 py-1 text-sm"
                                            />
                                        ) : (
                                            <div className="h-9 flex items-center px-1 text-sm font-bold text-slate-700">
                                                {formData.firstName || "-"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Tel 1 & Tel 2 */}
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-0.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tel 1</label>
                                        {isEditing ? (
                                            <GlassInput
                                                icon={<Phone className="w-3.5 h-3.5" />}
                                                value={formData.phone || ""}
                                                onChange={e => handleChange("phone", e.target.value)}
                                                className="bg-white h-9 py-1 text-sm"
                                            />
                                        ) : (
                                            <div className="h-9 flex items-center px-1 text-sm font-bold text-slate-700">
                                                {formData.phone || "-"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tel 2</label>
                                        {isEditing ? (
                                            <GlassInput
                                                icon={<Phone className="w-3.5 h-3.5" />}
                                                value={formData.phone2 || ""}
                                                onChange={e => handleChange("phone2", e.target.value)}
                                                className="bg-white h-9 py-1 text-sm"
                                            />
                                        ) : (
                                            <div className="h-9 flex items-center px-1 text-sm font-bold text-slate-700">
                                                {formData.phone2 || "-"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Adresse</label>
                                    <div className="relative">
                                        {isEditing ? (
                                            <>
                                                <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                                <textarea
                                                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 pl-10 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#9C27B0]/20 text-sm min-h-[60px]"
                                                    value={formData.address || ""}
                                                    onChange={e => handleChange("address", e.target.value)}
                                                />
                                            </>
                                        ) : (
                                            <div className="min-h-[60px] py-1 px-1 text-sm font-medium text-slate-700 whitespace-pre-line">
                                                {formData.address || "-"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Email, Photos */}
                            <div className="flex flex-col gap-3">
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                                    {isEditing ? (
                                        <GlassInput
                                            icon={<Mail className="w-3.5 h-3.5" />}
                                            value={formData.email || ""}
                                            onChange={e => handleChange("email", e.target.value)}
                                            className="bg-white h-9 py-1 text-sm"
                                        />
                                    ) : (
                                        <div className="h-9 flex items-center px-1 text-sm font-medium text-slate-700">
                                            {formData.email || "-"}
                                        </div>
                                    )}
                                </div>

                                {/* Photos Row - Flex Grow to match Address height */}
                                <div className="flex-1 flex gap-2">
                                    <div className="flex-1 flex flex-col space-y-0.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Logo Société</label>
                                        {isEditing ? (
                                            <div className="flex-1 relative group">
                                                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-[#6A1B9A] transition-colors">
                                                    <Building className="w-3.5 h-3.5" />
                                                </div>
                                                <textarea
                                                    className="w-full h-full bg-white border-transparent text-slate-900 placeholder:text-slate-500 font-medium rounded-2xl py-3 px-4 pl-11 focus:outline-none focus:bg-white focus:shadow-[0_0_0_2px_#6A1B9A] hover:bg-[#D1D1D6] resize-none text-sm leading-tight transition-all duration-200"
                                                    placeholder="URL..."
                                                    value={formData.logo || ""}
                                                    onChange={e => handleChange("logo", e.target.value)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex-1 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                                                {formData.logo ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Building className="w-8 h-8 text-slate-300" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col space-y-0.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Photo Gérant</label>
                                        {isEditing ? (
                                            <div className="flex-1 relative group">
                                                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-[#6A1B9A] transition-colors">
                                                    <User className="w-3.5 h-3.5" />
                                                </div>
                                                <textarea
                                                    className="w-full h-full bg-white border-transparent text-slate-900 placeholder:text-slate-500 font-medium rounded-2xl py-3 px-4 pl-11 focus:outline-none focus:bg-white focus:shadow-[0_0_0_2px_#6A1B9A] hover:bg-[#D1D1D6] resize-none text-sm leading-tight transition-all duration-200"
                                                    placeholder="URL..."
                                                    value={formData.photoManager || ""}
                                                    onChange={e => handleChange("photoManager", e.target.value)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex-1 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                                                {formData.photoManager ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={formData.photoManager} alt="Gerant" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-8 h-8 text-slate-300" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Infos / Banque */}
                    {activeTab === "Infos / Banque" && (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="col-span-2 mb-1">
                                <h4 className="text-[10px] font-bold text-[#8E24AA] uppercase tracking-widest border-b border-[#E1BEE7]/50 pb-1 mb-2">Juridique</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                    <div className="flex items-center gap-3">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right shrink-0">ICE</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput value={formData.ice || ""} onChange={e => handleChange("ice", e.target.value)} className="bg-white h-8 py-0.5 text-sm" />
                                            ) : (
                                                <div className="h-8 flex items-center px-2 text-sm font-bold text-slate-700 font-mono bg-white/50 rounded-lg border border-transparent">
                                                    {formData.ice || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right shrink-0">RC</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput value={formData.rc || ""} onChange={e => handleChange("rc", e.target.value)} className="bg-white h-8 py-0.5 text-sm" />
                                            ) : (
                                                <div className="h-8 flex items-center px-2 text-sm font-bold text-slate-700 bg-white/50 rounded-lg border border-transparent">
                                                    {formData.rc || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right shrink-0">IF</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput value={formData.if || ""} onChange={e => handleChange("if", e.target.value)} className="bg-white h-8 py-0.5 text-sm" />
                                            ) : (
                                                <div className="h-8 flex items-center px-2 text-sm font-bold text-slate-700 bg-white/50 rounded-lg border border-transparent">
                                                    {formData.if || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right shrink-0">CNSS</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput value={formData.cnss || ""} onChange={e => handleChange("cnss", e.target.value)} className="bg-white h-8 py-0.5 text-sm" />
                                            ) : (
                                                <div className="h-8 flex items-center px-2 text-sm font-bold text-slate-700 bg-white/50 rounded-lg border border-transparent">
                                                    {formData.cnss || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2 mt-1">
                                <h4 className="text-[10px] font-bold text-[#8E24AA] uppercase tracking-widest border-b border-[#E1BEE7]/50 pb-1 mb-2">Bancaire</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                    <div className="flex items-center gap-3">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right shrink-0">Banque</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput icon={<Building className="w-3.5 h-3.5" />} value={formData.bankName || ""} onChange={e => handleChange("bankName", e.target.value)} className="bg-white h-8 py-0.5 text-sm" />
                                            ) : (
                                                <div className="h-8 flex items-center px-2 text-sm font-bold text-slate-700 bg-white/50 rounded-lg border border-transparent">
                                                    {formData.bankName || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right shrink-0">RIB</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput icon={<CreditCard className="w-3.5 h-3.5" />} value={formData.rib || ""} onChange={e => handleChange("rib", e.target.value)} className="bg-white font-mono h-8 py-0.5 text-sm" />
                                            ) : (
                                                <div className="h-8 flex items-center px-2 text-sm font-bold text-slate-700 font-mono tracking-wide bg-white/50 rounded-lg border border-transparent">
                                                    {formData.rib || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Notes */}
                    {activeTab === "Notes" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-3 gap-4 h-[225px]">
                            {/* Note 1 */}
                            <div className="space-y-1 h-full flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Général</label>
                                {isEditing ? (
                                    <textarea
                                        className="w-full flex-1 bg-white border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#9C27B0]/20 text-sm resize-none"
                                        placeholder="Notes générales..."
                                        value={formData.note || ""}
                                        onChange={e => handleChange("note", e.target.value)}
                                    />
                                ) : (
                                    <div className="flex-1 w-full bg-slate-50 border border-transparent rounded-xl p-3 text-sm text-slate-600 whitespace-pre-wrap overflow-y-auto">
                                        {formData.note || "Aucune note."}
                                    </div>
                                )}
                            </div>

                            {/* Note 2 */}
                            <div className="space-y-1 h-full flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Logistique</label>
                                {isEditing ? (
                                    <textarea
                                        className="w-full flex-1 bg-white border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#9C27B0]/20 text-sm resize-none"
                                        placeholder="Notes logistique..."
                                        value={formData.note2 || ""}
                                        onChange={e => handleChange("note2", e.target.value)}
                                    />
                                ) : (
                                    <div className="flex-1 w-full bg-slate-50 border border-transparent rounded-xl p-3 text-sm text-slate-600 whitespace-pre-wrap overflow-y-auto">
                                        {formData.note2 || "Aucune note."}
                                    </div>
                                )}
                            </div>

                            {/* Note 3 */}
                            <div className="space-y-1 h-full flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Paiement / Autre</label>
                                {isEditing ? (
                                    <textarea
                                        className="w-full flex-1 bg-white border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#9C27B0]/20 text-sm resize-none"
                                        placeholder="Notes paiement..."
                                        value={formData.note3 || ""}
                                        onChange={e => handleChange("note3", e.target.value)}
                                    />
                                ) : (
                                    <div className="flex-1 w-full bg-slate-50 border border-transparent rounded-xl p-3 text-sm text-slate-600 whitespace-pre-wrap overflow-y-auto">
                                        {formData.note3 || "Aucune note."}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* HISTORY SECTION */}
                <div className="mt-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black text-[#3E2723] font-outfit">Historique</h2>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">Dernières opérations</p>
                        </div>
                        <button
                            onClick={() => {
                                if (formData.type === "Fournisseur") {
                                    router.push(`/achats?action=new&supplierId=${formData.id}&supplierName=${encodeURIComponent(formData.name || "")}`);
                                } else {
                                    // Client
                                    router.push(`/ventes?action=new&clientId=${formData.id}&clientName=${encodeURIComponent(formData.name || "")}`);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#5E35B1] hover:bg-[#4527A0] text-white rounded-xl shadow-lg shadow-indigo-200 transition-all font-bold text-sm"
                        >
                            <Plus className="w-4 h-4 stroke-[3px]" />
                            Créer Facture
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Référence</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Montant TTC</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {/* Empty History Message */}
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Aucune opération enregistrée pour ce tiers.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
