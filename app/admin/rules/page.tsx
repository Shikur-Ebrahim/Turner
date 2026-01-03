"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    ImageIcon,
    FileText,
    ChevronDown,
    ChevronUp,
    Layout,
    Upload,
    Loader2
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";

const CATEGORIES = [
    { id: "recharge", label: "How to Recharge", icon: "💰" },
    { id: "invitation", label: "Invitational Rules", icon: "🤝" },
    { id: "withdrawal", label: "Withdrawal Rules", icon: "🏧" },
    { id: "salary", label: "Team Monthly Salary", icon: "📅" },
    { id: "tasks", label: "Daily Tasks", icon: "✅" },
    { id: "general", label: "Platform General", icon: "🏢" },
];

export default function AdminRulesPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRule, setEditingRule] = useState<any>(null);
    const [activeCategory, setActiveCategory] = useState("recharge");
    const [isAdding, setIsAdding] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        imageUrl: "",
        category: "recharge",
        steps: [""],
        order: 0
    });

    useEffect(() => {
        const q = query(collection(db, "rules"), orderBy("order", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rulesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRules(rulesData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadStatus("Uploading...");

        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default");

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: uploadData }
            );
            const data = await response.json();
            if (data.secure_url) {
                setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
                setUploadStatus("Success!");
            } else {
                setUploadStatus("Failed. Check Config.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            setUploadStatus("Error occurred.");
        } finally {
            setIsUploading(false);
            setTimeout(() => setUploadStatus(null), 3000);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            imageUrl: "",
            category: activeCategory,
            steps: [""],
            order: rules.filter(r => r.category === activeCategory).length
        });
        setEditingRule(null);
        setIsAdding(false);
    };

    const handleSave = async () => {
        try {
            const data = {
                ...formData,
                updatedAt: serverTimestamp()
            };

            if (editingRule) {
                await updateDoc(doc(db, "rules", editingRule.id), data);
            } else {
                await addDoc(collection(db, "rules"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
            }
            resetForm();
        } catch (error) {
            console.error("Error saving rule:", error);
            alert("Failed to save rule");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this rule?")) {
            await deleteDoc(doc(db, "rules", id));
        }
    };

    const startEdit = (rule: any) => {
        setEditingRule(rule);
        setFormData({
            title: rule.title,
            description: rule.description,
            imageUrl: rule.imageUrl || "",
            category: rule.category,
            steps: rule.steps || [""],
            order: rule.order || 0
        });
        setIsAdding(true);
    };

    const addStep = () => {
        setFormData({ ...formData, steps: [...formData.steps, ""] });
    };

    const updateStep = (index: number, value: string) => {
        const newSteps = [...formData.steps];
        newSteps[index] = value;
        setFormData({ ...formData, steps: newSteps });
    };

    const removeStep = (index: number) => {
        setFormData({ ...formData, steps: formData.steps.filter((_, i) => i !== index) });
    };

    const filteredRules = rules.filter(r => r.category === activeCategory);

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <main className="flex-1 p-8 overflow-y-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Platform Rules</h1>
                        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Manage guidelines and how-to guides</p>
                    </div>
                    {!isAdding && (
                        <button
                            onClick={() => {
                                resetForm();
                                setIsAdding(true);
                            }}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Plus size={20} />
                            Add New Rule
                        </button>
                    )}
                </div>

                {/* Category Navigation */}
                <div className="flex flex-wrap gap-2 mb-8 p-2 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all ${activeCategory === cat.id
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                : "text-gray-500 hover:bg-gray-50"
                                }`}
                        >
                            <span>{cat.icon}</span>
                            <span className="text-xs uppercase tracking-widest">{cat.label}</span>
                        </button>
                    ))}
                </div>

                {isAdding ? (
                    /* Editor Form */
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 max-w-4xl animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                {editingRule ? "Edit Rule" : "Create New Rule"}
                            </h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Rule Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Step 1: Secure Payment"
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-widest px-1">Rule Visual</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative group/upload w-full">
                                            <input
                                                type="file"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                accept="image/*"
                                            />
                                            <div className={`w-full px-6 py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${isUploading
                                                ? "bg-slate-50 border-slate-200"
                                                : "bg-white border-slate-200 group-hover/upload:border-indigo-600 group-hover/upload:bg-indigo-50/50"
                                                }`}>
                                                {isUploading ? (
                                                    <Loader2 size={24} className="animate-spin text-indigo-600" />
                                                ) : (
                                                    <Upload size={24} className="text-slate-400 group-hover/upload:text-indigo-600" />
                                                )}
                                                <span className={`text-sm font-bold ${isUploading ? "text-indigo-600" : "text-slate-500"}`}>
                                                    {uploadStatus || (formData.imageUrl ? "Change Image" : "Select Rule Image")}
                                                </span>
                                            </div>
                                        </div>
                                        {formData.imageUrl && (
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-sm p-1">
                                                <img src={formData.imageUrl} className="w-full h-full object-cover rounded-xl" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Main Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    placeholder="Enter the main explanation here..."
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all shadow-inner resize-none"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Detailed Steps / Bullet Points</label>
                                    <button onClick={addStep} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <Plus size={14} /> Add Step
                                    </button>
                                </div>
                                {formData.steps.map((step, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 font-black text-xs text-gray-400 border border-gray-200 shadow-sm">
                                            {idx + 1}
                                        </div>
                                        <input
                                            type="text"
                                            value={step}
                                            onChange={(e) => updateStep(idx, e.target.value)}
                                            placeholder="Detailed point..."
                                            className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-indigo-500 font-medium text-sm transition-all"
                                        />
                                        {formData.steps.length > 1 && (
                                            <button onClick={() => removeStep(idx)} className="text-red-400 hover:text-red-600 transition-colors px-2">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                            >
                                <Save size={20} />
                                {editingRule ? "Update Rule" : "Publish Rule"}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Rule List */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredRules.length === 0 ? (
                            <div className="col-span-full py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                <FileText size={48} className="opacity-20 mb-4" />
                                <p className="font-bold uppercase tracking-widest text-xs">No rules in this category yet</p>
                            </div>
                        ) : (
                            filteredRules.map((rule) => (
                                <div key={rule.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/40 border border-gray-50 flex flex-col group animate-in zoom-in-95 duration-300">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-black text-gray-900 leading-tight uppercase mb-1">{rule.title}</h3>
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{activeCategory}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => startEdit(rule)} className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(rule.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {rule.imageUrl && (
                                        <div className="w-full aspect-video rounded-2xl overflow-hidden mb-6 border border-gray-100 shadow-inner">
                                            <img src={rule.imageUrl} alt={rule.title} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <p className="text-gray-500 text-sm font-medium leading-relaxed line-clamp-3 italic">
                                            {rule.description}
                                        </p>

                                        {rule.steps && rule.steps.length > 0 && (
                                            <div className="pt-4 border-t border-gray-50 space-y-2">
                                                {rule.steps.map((step: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                        <span className="text-[11px] font-bold text-gray-400 truncate tracking-tight">{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
