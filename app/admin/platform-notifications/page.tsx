"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import {
    Bell,
    Plus,
    Trash2,
    Loader2,
    Menu,
    RefreshCcw,
    Image as ImageIcon,
    Type,
    Layers,
    Eye,
    CheckCircle2,
    XCircle,
    Copy,
    Settings,
    Layout
} from "lucide-react";
import { toast } from "sonner";

export default function PlatformNotificationsAdmin() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        imageUrl: "",
        type: "general", // welcome, product, general
        maxDisplays: 1, // 1 time, 2 times, etc.
        isActive: true
    });

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            const isMaster = localStorage.getItem("admin_session") === "true";
            if (!user && !isMaster) {
                router.push("/");
                return;
            }
            setLoading(false);
        });

        const q = query(
            collection(db, "PlatformNotifications"),
            orderBy("createdAt", "desc")
        );
        const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(data);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeNotifs();
        };
    }, [router]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.error("Please fill in title and content");
            return;
        }

        setIsSaving(true);
        try {
            await addDoc(collection(db, "PlatformNotifications"), {
                ...formData,
                createdAt: serverTimestamp()
            });
            setFormData({
                title: "",
                content: "",
                imageUrl: "",
                type: "general",
                maxDisplays: 1,
                isActive: true
            });
            toast.success("Notification published successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to publish notification");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this notification?")) return;
        try {
            await deleteDoc(doc(db, "PlatformNotifications", id));
            toast.success("Notification deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete notification");
        }
    };

    const toggleStatus = async (notif: any) => {
        try {
            await updateDoc(doc(db, "PlatformNotifications", notif.id), {
                isActive: !notif.isActive
            });
            toast.success(`Notification ${!notif.isActive ? "activated" : "deactivated"}`);
        } catch (error) {
            console.error(error);
            toast.error("Update failed");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col min-h-screen w-full">
                {/* Header */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-xl px-6 py-6 flex items-center justify-between z-40 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Platform Alerts</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Advanced Announcement Hub</p>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {/* Management Column */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                <Plus size={20} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Create Announcement</h3>
                        </div>

                        <form onSubmit={handleAdd} className="bg-white rounded-[2.5rem] p-8 sm:p-10 border-2 border-slate-100 shadow-2xl shadow-slate-900/5 space-y-6">
                            <div className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                                        <Type size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Notification Title (e.g. Welcome Back!)"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full h-16 pl-14 pr-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-sm font-bold tracking-tight"
                                    />
                                </div>

                                <div className="relative group">
                                    <textarea
                                        placeholder="Write your announcement content here..."
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full h-32 p-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-sm font-medium resize-none"
                                    />
                                </div>

                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                                        <ImageIcon size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Image URL (Optional)"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="w-full h-16 pl-14 pr-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-sm font-bold tracking-tight"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Layers size={18} />
                                        </div>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase appearance-none focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        >
                                            <option value="general">General</option>
                                            <option value="welcome">Welcome</option>
                                            <option value="product">Product</option>
                                        </select>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Eye size={18} />
                                        </div>
                                        <select
                                            value={formData.maxDisplays}
                                            onChange={(e) => setFormData({ ...formData, maxDisplays: Number(e.target.value) })}
                                            className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black uppercase appearance-none focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        >
                                            <option value={1}>Show 1 Time</option>
                                            <option value={2}>Show 2 Times</option>
                                            <option value={3}>Show 3 Times</option>
                                            <option value={999}>Always Show</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <Bell size={18} />}
                                <span>Publish to Users</span>
                            </button>
                        </form>
                    </section>

                    {/* Preview/List Column */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Layout size={20} />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Alerts</h3>
                            </div>
                            <span className="bg-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {notifications.length} LIVE
                            </span>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] p-20 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                                <Bell size={48} className="mb-4 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">No active broadcasts</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                                {notifications.map((notif) => (
                                    <div key={notif.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                        <div className={`absolute top-0 right-0 w-1 pt-6 h-full ${notif.isActive ? "bg-emerald-500" : "bg-slate-200"}`}></div>

                                        <div className="flex gap-6">
                                            {notif.imageUrl && (
                                                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100">
                                                    <img src={notif.imageUrl} alt="Notif" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${notif.type === 'welcome' ? 'bg-indigo-50 text-indigo-600' :
                                                        notif.type === 'product' ? 'bg-emerald-50 text-emerald-600' :
                                                            'bg-slate-50 text-slate-500'
                                                        }`}>
                                                        {notif.type}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase underline decoration-indigo-200 underline-offset-4">
                                                        Show {notif.maxDisplays === 999 ? 'Always' : `${notif.maxDisplays}x`}
                                                    </span>
                                                </div>
                                                <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none">{notif.title}</h4>
                                                <p className="text-xs text-slate-400 line-clamp-2 font-medium">{notif.content}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-slate-50">
                                            <button
                                                onClick={() => toggleStatus(notif)}
                                                className={`p-3 rounded-xl transition-all ${notif.isActive ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                                            >
                                                {notif.isActive ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(notif.id)}
                                                className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all shadow-sm"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}
