import { GlassInput, GlassButton } from "@/components/ui/GlassComponents";
import { Tier, TierType } from "@/lib/types";
import { Save, User, Building, CreditCard, Phone, Mail, Globe, MapPin, Pencil, Trash2, FileText, Plus, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
            <div className="px-10 pt-10 pb-6 mb-2">
                <div className="flex justify-between items-start mb-6">
                    {/* Left: Identity */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-5">
                            {isEditing ? (
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleChange("type", e.target.value)}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-slate-100 border-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Fournisseur">Fournisseur</option>
                                    <option value="Client">Client</option>
                                </select>
                            ) : (
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                                    formData.type === "Fournisseur" ? "bg-blue-600 text-white" : "bg-slate-600 text-white"
                                )}>
                                    {formData.type}
                                </span>
                            )}
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{formData.code}</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[1.2rem] bg-[#F8FAFC] border border-slate-100 flex items-center justify-center text-3xl shadow-sm shrink-0 overflow-hidden relative">
                                {formData.logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="opacity-80 grayscale">🏭</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <input
                                        autoFocus
                                        onFocus={(e) => e.target.select()}
                                        type="text"
                                        value={formData.name || ""}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        placeholder="Nom du Tiers"
                                        className="text-4xl font-serif font-black text-slate-800 border-b-2 border-slate-100 focus:border-blue-500 focus:outline-none bg-transparent w-full placeholder:text-slate-200 py-1"
                                    />
                                ) : (
                                    <h1 className="text-4xl font-serif font-black text-slate-800 leading-tight truncate">
                                        {formData.name || "Nouveau Tiers"}
                                    </h1>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions & Stats */}
                    <div className="flex flex-col items-end gap-4 min-w-[220px] shrink-0">
                        {/* Stats Card (Harmonized with Price Card) */}
                        <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl p-4 w-full text-center group transition-all hover:bg-white/90">
                            <div className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
                                Chiffre d'Affaires <Briefcase className="w-2.5 h-2.5" />
                            </div>
                            <div className="text-2xl font-black text-slate-800">
                                0,00 <span className="text-sm font-normal text-slate-400">DH</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 opacity-60">
                                0 Opérations
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 w-full">
                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm border",
                                    isEditing
                                        ? "bg-white border-green-200 text-green-600 hover:bg-green-50 shadow-green-500/5"
                                        : "bg-white border-blue-200 text-blue-600 hover:bg-blue-50 shadow-blue-500/5"
                                )}
                            >
                                {isEditing ? <Save className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                                {isEditing ? "Enregistrer" : "Modifier"}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-11 h-11 flex items-center justify-center bg-white border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-all shadow-sm shadow-red-500/5 group"
                                title="Supprimer"
                            >
                                <Trash2 className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-10 pb-12">

                {/* Informations Tiers Title (Matching Articles style) */}
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 mt-4 flex items-center gap-2">
                    <div className="w-1.5 h-6 rounded-full bg-[#1E293B] transition-colors" />
                    Informations Tiers
                </h3>

                {/* DATA ENTRY FRAME (Inset) with Tabs - Compacted */}
                <div className="border border-slate-200 bg-[#F8FAFC]/50 rounded-2xl p-4 shadow-sm">
                    {/* Tabs Header */}
                    <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-1">
                        {["Contact", "Infos / Banque", "Notes"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all relative",
                                    activeTab === tab
                                        ? "text-blue-600"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-[-5px] left-0 right-0 h-[3px] bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.3)]" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab 1: Contact */}
                    {activeTab === "Contact" && (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* LEFT COLUMN: Phones, Website, Address */}
                            <div className="space-y-4">
                                {/* Row 1: Nom & Prénom */}
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Nom</label>
                                        {isEditing ? (
                                            <GlassInput
                                                icon={<User className="w-3.5 h-3.5 opacity-50" />}
                                                value={formData.lastName || ""}
                                                onChange={e => handleChange("lastName", e.target.value)}
                                                className="bg-white h-10 text-sm border-slate-100"
                                            />
                                        ) : (
                                            <div className="h-10 flex items-center px-3 text-sm font-bold text-slate-700 bg-white/50 rounded-xl border border-transparent">
                                                {formData.lastName || "-"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Prénom</label>
                                        {isEditing ? (
                                            <GlassInput
                                                icon={<User className="w-3.5 h-3.5 opacity-50" />}
                                                value={formData.firstName || ""}
                                                onChange={e => handleChange("firstName", e.target.value)}
                                                className="bg-white h-10 text-sm border-slate-100"
                                            />
                                        ) : (
                                            <div className="h-10 flex items-center px-3 text-sm font-bold text-slate-700 bg-white/50 rounded-xl border border-transparent">
                                                {formData.firstName || "-"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Tel 1 & Tel 2 */}
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Tel 1</label>
                                        {isEditing ? (
                                            <GlassInput
                                                icon={<Phone className="w-3.5 h-3.5 opacity-50" />}
                                                value={formData.phone || ""}
                                                onChange={e => handleChange("phone", e.target.value)}
                                                className="bg-white h-10 text-sm border-slate-100"
                                            />
                                        ) : (
                                            <div className="h-10 flex items-center px-3 text-sm font-bold text-slate-700 bg-white/50 rounded-xl border border-transparent">
                                                {formData.phone || "-"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Tel 2</label>
                                        {isEditing ? (
                                            <GlassInput
                                                icon={<Phone className="w-3.5 h-3.5 opacity-50" />}
                                                value={formData.phone2 || ""}
                                                onChange={e => handleChange("phone2", e.target.value)}
                                                className="bg-white h-10 text-sm border-slate-100"
                                            />
                                        ) : (
                                            <div className="h-10 flex items-center px-3 text-sm font-bold text-slate-700 bg-white/50 rounded-xl border border-transparent">
                                                {formData.phone2 || "-"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Adresse</label>
                                    <div className="relative">
                                        {isEditing ? (
                                            <>
                                                <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400 opacity-50" />
                                                <textarea
                                                    className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 pl-10 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-sm min-h-[80px] transition-all"
                                                    value={formData.address || ""}
                                                    onChange={e => handleChange("address", e.target.value)}
                                                />
                                            </>
                                        ) : (
                                            <div className="min-h-[80px] py-2 px-3 text-sm font-medium text-slate-600 bg-white/50 rounded-xl border border-transparent whitespace-pre-line leading-relaxed">
                                                {formData.address || "-"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Email, Photos */}
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Email</label>
                                    {isEditing ? (
                                        <GlassInput
                                            icon={<Mail className="w-3.5 h-3.5 opacity-50" />}
                                            value={formData.email || ""}
                                            onChange={e => handleChange("email", e.target.value)}
                                            className="bg-white h-10 text-sm border-slate-100"
                                        />
                                    ) : (
                                        <div className="h-10 flex items-center px-3 text-sm font-medium text-slate-600 bg-white/50 rounded-xl border border-transparent">
                                            {formData.email || "-"}
                                        </div>
                                    )}
                                </div>

                                {/* Photos Row - Flex Grow to match Address height */}
                                <div className="flex-1 flex gap-4">
                                    <div className="flex-1 flex flex-col space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Logo Société</label>
                                        {isEditing ? (
                                            <div className="flex-1 relative group">
                                                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-600 opacity-50 transition-colors">
                                                    <Building className="w-3.5 h-3.5" />
                                                </div>
                                                <textarea
                                                    className="w-full h-full bg-white border border-slate-100 text-slate-700 placeholder:text-slate-300 font-medium rounded-2xl py-3 px-4 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none text-xs leading-tight transition-all"
                                                    placeholder="URL du logo..."
                                                    value={formData.logo || ""}
                                                    onChange={e => handleChange("logo", e.target.value)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex-1 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden relative group">
                                                {formData.logo ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                ) : (
                                                    <Building className="w-8 h-8 text-slate-200" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Photo Gérant</label>
                                        {isEditing ? (
                                            <div className="flex-1 relative group">
                                                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-600 opacity-50 transition-colors">
                                                    <User className="w-3.5 h-3.5" />
                                                </div>
                                                <textarea
                                                    className="w-full h-full bg-white border border-slate-100 text-slate-700 placeholder:text-slate-300 font-medium rounded-2xl py-3 px-4 pl-11 focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none text-xs leading-tight transition-all"
                                                    placeholder="URL de la photo..."
                                                    value={formData.photoManager || ""}
                                                    onChange={e => handleChange("photoManager", e.target.value)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex-1 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden relative group">
                                                {formData.photoManager ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={formData.photoManager} alt="Gerant" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                ) : (
                                                    <User className="w-8 h-8 text-slate-200" />
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
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="col-span-2">
                                <h4 className="text-[10px] font-bold text-blue-600/60 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Informations Juridiques</h4>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                                    <div className="flex items-center gap-4">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right shrink-0 opacity-70">ICE</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput value={formData.ice || ""} onChange={e => handleChange("ice", e.target.value)} className="bg-white h-9 text-sm border-slate-100 font-mono" />
                                            ) : (
                                                <div className="h-9 flex items-center px-3 text-sm font-bold text-slate-700 font-mono bg-white/50 rounded-xl border border-transparent">
                                                    {formData.ice || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right shrink-0 opacity-70">RC</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput value={formData.rc || ""} onChange={e => handleChange("rc", e.target.value)} className="bg-white h-9 text-sm border-slate-100" />
                                            ) : (
                                                <div className="h-9 flex items-center px-3 text-sm font-bold text-slate-700 bg-white/50 rounded-xl border border-transparent">
                                                    {formData.rc || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right shrink-0 opacity-70">IF</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput value={formData.if || ""} onChange={e => handleChange("if", e.target.value)} className="bg-white h-9 text-sm border-slate-100" />
                                            ) : (
                                                <div className="h-9 flex items-center px-3 text-sm font-bold text-slate-700 bg-white/50 rounded-xl border border-transparent">
                                                    {formData.if || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right shrink-0 opacity-70">CNSS</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput value={formData.cnss || ""} onChange={e => handleChange("cnss", e.target.value)} className="bg-white h-9 text-sm border-slate-100" />
                                            ) : (
                                                <div className="h-9 flex items-center px-3 text-sm font-bold text-slate-700 bg-white/50 rounded-xl border border-transparent">
                                                    {formData.cnss || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <h4 className="text-[10px] font-bold text-blue-600/60 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Coordonnées Bancaires</h4>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                                    <div className="flex items-center gap-4">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right shrink-0 opacity-70">Banque</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput icon={<Building className="w-3.5 h-3.5 opacity-50" />} value={formData.bankName || ""} onChange={e => handleChange("bankName", e.target.value)} className="bg-white h-9 text-sm border-slate-100" />
                                            ) : (
                                                <div className="h-9 flex items-center px-3 text-sm font-bold text-slate-700 bg-white/50 rounded-xl border border-transparent">
                                                    {formData.bankName || "-"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-16 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right shrink-0 opacity-70">RIB</label>
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <GlassInput icon={<CreditCard className="w-3.5 h-3.5 opacity-50" />} value={formData.rib || ""} onChange={e => handleChange("rib", e.target.value)} className="bg-white font-mono h-9 text-sm border-slate-100" />
                                            ) : (
                                                <div className="h-9 flex items-center px-3 text-sm font-bold text-slate-700 font-mono tracking-wide bg-white/50 rounded-xl border border-transparent">
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
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-3 gap-6 h-[250px]">
                            {/* Note 1 */}
                            <div className="space-y-2 h-full flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Général</label>
                                {isEditing ? (
                                    <textarea
                                        className="w-full flex-1 bg-white border border-slate-100 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-sm resize-none transition-all"
                                        placeholder="Notes générales..."
                                        value={formData.note || ""}
                                        onChange={e => handleChange("note", e.target.value)}
                                    />
                                ) : (
                                    <div className="flex-1 w-full bg-slate-50 border border-transparent rounded-xl p-4 text-sm text-slate-500 whitespace-pre-wrap overflow-y-auto leading-relaxed">
                                        {formData.note || "Aucune note."}
                                    </div>
                                )}
                            </div>

                            {/* Note 2 */}
                            <div className="space-y-2 h-full flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Logistique</label>
                                {isEditing ? (
                                    <textarea
                                        className="w-full flex-1 bg-white border border-slate-100 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-sm resize-none transition-all"
                                        placeholder="Notes logistique..."
                                        value={formData.note2 || ""}
                                        onChange={e => handleChange("note2", e.target.value)}
                                    />
                                ) : (
                                    <div className="flex-1 w-full bg-slate-50 border border-transparent rounded-xl p-4 text-sm text-slate-500 whitespace-pre-wrap overflow-y-auto leading-relaxed">
                                        {formData.note2 || "Aucune note."}
                                    </div>
                                )}
                            </div>

                            {/* Note 3 */}
                            <div className="space-y-2 h-full flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">Paiement / Autre</label>
                                {isEditing ? (
                                    <textarea
                                        className="w-full flex-1 bg-white border border-slate-100 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-sm resize-none transition-all"
                                        placeholder="Notes paiement..."
                                        value={formData.note3 || ""}
                                        onChange={e => handleChange("note3", e.target.value)}
                                    />
                                ) : (
                                    <div className="flex-1 w-full bg-slate-50 border border-transparent rounded-xl p-4 text-sm text-slate-500 whitespace-pre-wrap overflow-y-auto leading-relaxed">
                                        {formData.note3 || "Aucune note."}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* HISTORY SECTION */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <div className="w-1.5 h-6 rounded-full bg-[#1E293B] transition-colors" />
                                Historique des Opérations
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70 ml-[14px]">Dernières factures et règlements</p>
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
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all font-bold text-[10px] uppercase tracking-widest"
                        >
                            <Plus className="w-4 h-4 stroke-[3px]" />
                            Nouvelle Facture
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Référence</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant TTC</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {/* Empty History Message */}
                                <tr>
                                    <td colSpan={4} className="px-8 py-16 text-center text-slate-300 font-bold italic opacity-60">
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
