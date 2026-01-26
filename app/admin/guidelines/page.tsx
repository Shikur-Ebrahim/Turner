"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc,
    addDoc,
    deleteDoc,
    serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Plus,
    Loader2 as Loader,
    Trash2,
    Edit2,
    Save,
    X,
    AlertCircle,
    Menu,
    BookOpen,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { toast } from "sonner";

function GuidelinesManagement() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [guidelines, setGuidelines] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        descriptionAm: "",
        order: guidelines.length
    });

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            const isMaster = localStorage.getItem("admin_session") === "true";
            if (!user && !isMaster) {
                router.push("/");
                return;
            }
        });

        const q = query(collection(db, "platform_guidelines"), orderBy("order", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setGuidelines(data);
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribe();
        };
    }, [router]);

    const handleSave = async () => {
        if (!formData.title || !formData.description) {
            toast.error("Please fill in both title and description.");
            return;
        }

        setSaving(true);
        try {
            const data = {
                ...formData,
                updatedAt: serverTimestamp()
            };

            if (editingId) {
                const docRef = doc(db, "platform_guidelines", editingId);
                await updateDoc(docRef, data);
                toast.success("Guideline updated successfully");
            } else {
                await addDoc(collection(db, "platform_guidelines"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
                toast.success("New guideline added");
            }

            resetForm();
        } catch (error) {
            console.error("Error saving guideline:", error);
            toast.error("Failed to save guideline");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this guideline?")) return;

        try {
            await deleteDoc(doc(db, "platform_guidelines", id));
            toast.success("Guideline deleted");
        } catch (error) {
            console.error("Error deleting guideline:", error);
            toast.error("Failed to delete guideline");
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            descriptionAm: "",
            order: guidelines.length
        });
        setEditingId(null);
        setIsAdding(false);
    };

    const startEditing = (item: any) => {
        setFormData({
            title: item.title,
            description: item.description,
            descriptionAm: item.descriptionAm || "",
            order: item.order || 0
        });
        setEditingId(item.id);
        setIsAdding(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-indigo-600">
                <Loader className="w-12 h-12 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FD] flex">
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
                <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <Menu size={24} className="text-gray-600" />
                        </button>
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest hidden sm:block">
                            Manager / <span className="text-indigo-600">Platform Guidelines</span>
                        </h2>
                    </div>
                    <button
                        onClick={() => {
                            if (isAdding) resetForm();
                            else {
                                setFormData({ ...formData, order: guidelines.length });
                                setIsAdding(true);
                            }
                        }}
                        className={`px-6 py-2.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2 ${isAdding ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:scale-105"}`}
                    >
                        {isAdding ? <X size={18} /> : <Plus size={18} />}
                        {isAdding ? "Cancel" : "Add New"}
                    </button>
                </header>

                <main className="p-4 md:p-8 max-w-5xl mx-auto w-full">
                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/20 mb-8 overflow-hidden relative">
                        <div className="relative z-10">
                            <h1 className="text-3xl font-black mb-2">Platform Guidelines 📖</h1>
                            <p className="text-white/80 font-medium">Create and manage how-to-work guides for your users.</p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    </div>

                    {isAdding ? (
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                {editingId ? <Edit2 size={24} className="text-indigo-500" /> : <Plus size={24} className="text-indigo-500" />}
                                {editingId ? "Edit Guideline" : "Add New Guideline"}
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. How to Recharge"
                                        className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">English Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Detailed English explanation here..."
                                        rows={4}
                                        className="w-full p-6 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Amharic Description (የአማርኛ መግለጫ)</label>
                                    <textarea
                                        value={formData.descriptionAm}
                                        onChange={(e) => setFormData(prev => ({ ...prev, descriptionAm: e.target.value }))}
                                        placeholder="የአማርኛ መግለጫ እዚህ ይጻፉ..."
                                        rows={4}
                                        className="w-full p-6 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-2 w-32">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Order</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData(prev => ({ ...prev, order: Number(e.target.value) }))}
                                        className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all text-center"
                                    />
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full h-16 bg-indigo-600 text-white rounded-[1.8rem] font-black text-base uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-8 disabled:opacity-50"
                                >
                                    {saving ? <Loader className="animate-spin" /> : <Save size={20} />}
                                    {editingId ? "Update Guideline" : "Publish Guideline"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {guidelines.length === 0 ? (
                                <div className="py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                    <AlertCircle size={48} className="opacity-10 mb-4" />
                                    <p className="font-bold uppercase tracking-widest text-xs">No guidelines created yet</p>
                                </div>
                            ) : (
                                guidelines.map((item) => (
                                    <div key={item.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                                                    {item.order}
                                                </div>
                                                <h3 className="text-lg font-black text-gray-900 uppercase">{item.title}</h3>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">EN:</p>
                                                <p className="text-gray-500 text-sm font-medium leading-relaxed italic line-clamp-2">
                                                    {item.description}
                                                </p>
                                            </div>
                                            {item.descriptionAm && (
                                                <div className="space-y-1 pt-1 border-t border-gray-50">
                                                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest font-mono">AM:</p>
                                                    <p className="text-gray-500 text-sm font-medium leading-relaxed italic line-clamp-2">
                                                        {item.descriptionAm}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex sm:flex-col gap-2">
                                            <button
                                                onClick={() => startEditing(item)}
                                                className="flex-1 sm:w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="flex-1 sm:w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function GuidelinesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white text-indigo-600">
                <Loader className="w-12 h-12 animate-spin" />
            </div>
        }>
            <GuidelinesManagement />
        </Suspense>
    );
}
