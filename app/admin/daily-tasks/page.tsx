"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import {
    Gamepad2,
    Save,
    RefreshCcw,
    ToggleLeft,
    ToggleRight,
    Star,
    Zap,
    Trophy,
    LayoutDashboard,
    Loader2
} from "lucide-react";
import { toast } from "sonner";

interface TaskConfig {
    id: string;
    name: string;
    type: string;
    reward_type: 'fixed' | 'random';
    reward_value: number | { min: number; max: number };
    daily_limit: number;
    is_active: boolean;
    icon: string;
    color: string;
}

const DEFAULT_TASKS: TaskConfig[] = [
    { id: 'spin_wheel', name: 'Lucky Spin', type: 'spin', reward_type: 'random', reward_value: { min: 5, max: 100 }, daily_limit: 5, is_active: true, icon: '🎡', color: 'from-purple-500 to-indigo-600' },
    { id: 'scratch_card', name: 'Magic Scratch', type: 'scratch', reward_type: 'random', reward_value: { min: 10, max: 150 }, daily_limit: 3, is_active: true, icon: '🃏', color: 'from-emerald-400 to-teal-600' },
    { id: 'mini_quiz', name: 'Brain IQ', type: 'quiz', reward_type: 'fixed', reward_value: 20, daily_limit: 10, is_active: true, icon: '🧠', color: 'from-amber-400 to-orange-600' },
    { id: 'memory_card', name: 'Memory Match', type: 'memory', reward_type: 'random', reward_value: { min: 15, max: 200 }, daily_limit: 3, is_active: true, icon: '🧩', color: 'from-rose-500 to-pink-600' },
    { id: 'daily_checklist', name: 'Daily Check', type: 'checklist', reward_type: 'fixed', reward_value: 50, daily_limit: 1, is_active: true, icon: '📅', color: 'from-blue-400 to-sky-600' },
    { id: 'word_scramble', name: 'Word Master', type: 'word', reward_type: 'fixed', reward_value: 30, daily_limit: 5, is_active: true, icon: '📚', color: 'from-violet-500 to-fuchsia-600' },
    { id: 'math_rush', name: 'Math Rush', type: 'math', reward_type: 'random', reward_value: { min: 20, max: 80 }, daily_limit: 10, is_active: true, icon: '➕', color: 'from-cyan-500 to-blue-600' },
    { id: 'treasure_hunt', name: 'Vault Hunt', type: 'treasure', reward_type: 'random', reward_value: { min: 50, max: 500 }, daily_limit: 2, is_active: true, icon: '💎', color: 'from-yellow-400 to-yellow-600' },
    { id: 'coin_flip', name: 'Flip N Win', type: 'coin', reward_type: 'fixed', reward_value: 15, daily_limit: 15, is_active: true, icon: '🪙', color: 'from-zinc-400 to-zinc-600' },
    { id: 'rps_battle', name: 'RPS Battle', type: 'rps', reward_type: 'fixed', reward_value: 25, daily_limit: 10, is_active: true, icon: '✂️', color: 'from-red-500 to-orange-600' },
    { id: 'number_guess', name: 'Number Guru', type: 'guess', reward_type: 'random', reward_value: { min: 10, max: 100 }, daily_limit: 8, is_active: true, icon: '🔢', color: 'from-lime-400 to-lime-600' },
    { id: 'color_tap', name: 'Color Dash', type: 'color', reward_type: 'fixed', reward_value: 20, daily_limit: 12, is_active: true, icon: '🎨', color: 'from-pink-400 to-rose-500' },
    { id: 'fast_clicker', name: 'Fast Tap', type: 'clicker', reward_type: 'random', reward_value: { min: 5, max: 150 }, daily_limit: 5, is_active: true, icon: '⚡', color: 'from-orange-400 to-red-500' },
    { id: 'dice_roller', name: 'Lucky Dice', type: 'dice', reward_type: 'random', reward_value: { min: 10, max: 120 }, daily_limit: 7, is_active: true, icon: '🎲', color: 'from-blue-500 to-indigo-600' },
    { id: 'slot_machine', name: 'Star Slots', type: 'slots', reward_type: 'random', reward_value: { min: 10, max: 1000 }, daily_limit: 3, is_active: true, icon: '🎰', color: 'from-purple-600 to-pink-500' }
];

export default function AdminDailyTasks() {
    const [configs, setConfigs] = useState<TaskConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "Settings", "tasks"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const loadedConfigs = DEFAULT_TASKS.map(task => ({
                    ...task,
                    ...(data[task.id] || {})
                }));
                setConfigs(loadedConfigs);
            } else {
                setConfigs(DEFAULT_TASKS);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleToggle = (id: string) => {
        setConfigs(prev => prev.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t));
    };

    const handleValueChange = (id: string, field: string, value: any) => {
        setConfigs(prev => prev.map(t => {
            if (t.id === id) {
                if (field === 'fixed_val') return { ...t, reward_type: 'fixed', reward_value: Number(value) };
                if (field === 'min_val') return { ...t, reward_type: 'random', reward_value: { ...(t.reward_value as any), min: Number(value) } };
                if (field === 'max_val') return { ...t, reward_type: 'random', reward_value: { ...(t.reward_value as any), max: Number(value) } };
                if (field === 'limit') return { ...t, daily_limit: Number(value) };
            }
            return t;
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const dataToSave = configs.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
            await setDoc(doc(db, "Settings", "tasks"), dataToSave);
            toast.success("Task configurations updated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save configurations.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Gamepad2 size={32} className="text-indigo-600" />
                        Daily Task Manager
                    </h1>
                    <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-xs">Configure Rewards & Game Access</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Save All Changes
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {configs.map((task) => (
                    <div key={task.id} className={`bg-white rounded-[2.5rem] p-6 border-2 transition-all ${task.is_active ? 'border-slate-100 shadow-xl shadow-slate-200/50' : 'border-slate-50 opacity-70 grayscale'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${task.color} flex items-center justify-center text-3xl shadow-lg`}>
                                {task.icon}
                            </div>
                            <button onClick={() => handleToggle(task.id)} className="transition-all">
                                {task.is_active ? <ToggleRight size={48} className="text-indigo-600" /> : <ToggleLeft size={48} className="text-slate-300" />}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">{task.name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{task.type} Game</p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Reward Structure</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setConfigs(prev => prev.map(t => t.id === task.id ? { ...t, reward_type: 'fixed' } : t))}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${task.reward_type === 'fixed' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                    >Fixed</button>
                                    <button
                                        onClick={() => setConfigs(prev => prev.map(t => t.id === task.id ? { ...t, reward_type: 'random' } : t))}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${task.reward_type === 'random' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                    >Random</button>
                                </div>

                                {task.reward_type === 'fixed' ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={typeof task.reward_value === 'number' ? task.reward_value : 0}
                                            onChange={(e) => handleValueChange(task.id, 'fixed_val', e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-200 outline-none transition-all"
                                            placeholder="Fixed Stars"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">STARS</span>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                value={(task.reward_value as any).min}
                                                onChange={(e) => handleValueChange(task.id, 'min_val', e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300">MIN</span>
                                        </div>
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                value={(task.reward_value as any).max}
                                                onChange={(e) => handleValueChange(task.id, 'max_val', e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300">MAX</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Limit</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={task.daily_limit}
                                        onChange={(e) => handleValueChange(task.id, 'limit', e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">PLAYS / DAY</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section className="bg-amber-50 rounded-[2.5rem] p-8 border-2 border-amber-100 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-lg shadow-amber-200 transition-transform hover:scale-110">
                    <Trophy size={32} />
                </div>
                <div>
                    <h4 className="text-lg font-black text-amber-900 tracking-tight">System Info</h4>
                    <p className="text-sm font-bold text-amber-700/70 leading-relaxed">
                        Changes apply instantly to all users. "Stars" are credited to the <span className="text-amber-900">userData.stars</span> field.
                        Ensure random ranges are logical (Max &gt; Min).
                    </p>
                </div>
            </section>
        </div>
    );
}
