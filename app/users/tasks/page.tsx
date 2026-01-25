"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    ChevronLeft,
    RefreshCcw,
    Trophy,
    Gamepad2,
    Star,
    Zap,
    Lock,
    Play,
    CheckCircle2,
    Loader2,
    X,
    RotateCw,
    Info,
    Sparkles,
    HandMetal
} from "lucide-react";
import { toast } from "sonner";

interface Task {
    id: string;
    name: string;
    type: string;
    reward_type: 'fixed' | 'random';
    reward_value: number | { min: number; max: number };
    daily_limit: number;
    is_active: boolean;
    icon: string;
    color: string;
    description: string;
    accent: string;
}

const DEFAULT_TASKS: Task[] = [
    { id: 'spin_wheel', name: 'Lucky Spin', type: 'spin', reward_type: 'random', reward_value: { min: 5, max: 100 }, daily_limit: 5, is_active: true, icon: '🎡', color: 'from-purple-500 to-indigo-600', accent: 'bg-purple-100 text-purple-600', description: 'Spin the wheel and test your luck!' },
    { id: 'scratch_card', name: 'Magic Scratch', type: 'scratch', reward_type: 'random', reward_value: { min: 10, max: 150 }, daily_limit: 3, is_active: true, icon: '🃏', color: 'from-emerald-400 to-teal-600', accent: 'bg-emerald-100 text-emerald-600', description: 'Scratch to reveal your hidden treasure.' },
    { id: 'mini_quiz', name: 'Brain IQ', type: 'quiz', reward_type: 'fixed', reward_value: 20, daily_limit: 10, is_active: true, icon: '🧠', color: 'from-amber-400 to-orange-600', accent: 'bg-amber-100 text-amber-600', description: 'Answer correctly to win instant rewards.' },
    { id: 'memory_card', name: 'Memory Match', type: 'memory', reward_type: 'random', reward_value: { min: 15, max: 200 }, daily_limit: 3, is_active: true, icon: '🧩', color: 'from-rose-500 to-pink-600', accent: 'bg-rose-100 text-rose-600', description: 'Match the symbols to claim the prize.' },
    { id: 'daily_checklist', name: 'Daily Check', type: 'checklist', reward_type: 'fixed', reward_value: 50, daily_limit: 1, is_active: true, icon: '📅', color: 'from-blue-400 to-sky-600', accent: 'bg-blue-100 text-blue-600', description: 'Sign in daily to claim your bonus.' },
    { id: 'word_scramble', name: 'Word Master', type: 'word', reward_type: 'fixed', reward_value: 30, daily_limit: 5, is_active: true, icon: '📚', color: 'from-violet-500 to-fuchsia-600', accent: 'bg-violet-100 text-violet-600', description: 'Unscramble the word to earn stars.' },
    { id: 'math_rush', name: 'Math Rush', type: 'math', reward_type: 'random', reward_value: { min: 20, max: 80 }, daily_limit: 10, is_active: true, icon: '➕', color: 'from-cyan-500 to-blue-600', accent: 'bg-cyan-100 text-cyan-600', description: 'Solve quick math problems.' },
    { id: 'treasure_hunt', name: 'Vault Hunt', type: 'treasure', reward_type: 'random', reward_value: { min: 50, max: 500 }, daily_limit: 2, is_active: true, icon: '💎', color: 'from-yellow-400 to-yellow-600', accent: 'bg-yellow-100 text-yellow-600', description: 'Pick a chest to find hidden stars.' },
    { id: 'coin_flip', name: 'Flip N Win', type: 'coin', reward_type: 'fixed', reward_value: 15, daily_limit: 15, is_active: true, icon: '🪙', color: 'from-zinc-400 to-zinc-600', accent: 'bg-zinc-100 text-zinc-600', description: 'Guess Head or Tail for stars.' },
    { id: 'rps_battle', name: 'RPS Battle', type: 'rps', reward_type: 'fixed', reward_value: 25, daily_limit: 10, is_active: true, icon: '✂️', color: 'from-red-500 to-orange-600', accent: 'bg-red-100 text-red-600', description: 'Win Rock Paper Scissors vs AI.' },
    { id: 'number_guess', name: 'Number Guru', type: 'guess', reward_type: 'random', reward_value: { min: 10, max: 100 }, daily_limit: 8, is_active: true, icon: '🔢', color: 'from-lime-400 to-lime-600', accent: 'bg-lime-100 text-lime-600', description: 'Guess the lucky number from 1-10.' },
    { id: 'color_tap', name: 'Color Dash', type: 'color', reward_type: 'fixed', reward_value: 20, daily_limit: 12, is_active: true, icon: '🎨', color: 'from-pink-400 to-rose-500', accent: 'bg-pink-100 text-pink-600', description: 'Tap the color that matches the prompt.' },
    { id: 'fast_clicker', name: 'Fast Tap', type: 'clicker', reward_type: 'random', reward_value: { min: 5, max: 150 }, daily_limit: 5, is_active: true, icon: '⚡', color: 'from-orange-400 to-red-500', accent: 'bg-orange-100 text-orange-600', description: 'Tap as fast as you can!' },
    { id: 'dice_roller', name: 'Lucky Dice', type: 'dice', reward_type: 'random', reward_value: { min: 10, max: 120 }, daily_limit: 7, is_active: true, icon: '🎲', color: 'from-blue-500 to-indigo-600', accent: 'bg-blue-100 text-blue-600', description: 'Roll the dice for star rewards.' },
    { id: 'slot_machine', name: 'Star Slots', type: 'slots', reward_type: 'random', reward_value: { min: 10, max: 1000 }, daily_limit: 3, is_active: true, icon: '🎰', color: 'from-purple-600 to-pink-500', accent: 'bg-purple-100 text-purple-600', description: 'Spin the slots for a huge jackpot!' }
];

// --- Mini Game Components ---

const SpinWheel = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const sectors = useState(() => {
        if (config.reward_type === 'fixed') {
            const val = config.reward_value as number;
            return [val, val, val, val, val, val, val, val];
        }
        const { min, max } = config.reward_value as { min: number; max: number };
        return Array.from({ length: 8 }, () => Math.floor(Math.random() * (max - min + 1)) + min);
    })[0];

    const spin = () => {
        if (spinning) return;
        setSpinning(true);
        const extraDegrees = Math.floor(Math.random() * 360) + 2160; // 6 full rotations
        const newRotation = rotation + extraDegrees;
        setRotation(newRotation);

        setTimeout(() => {
            setSpinning(false);
            const actualRotation = newRotation % 360;
            // Indicator is at top (270deg). We want to find which sector is there.
            // Sectors are i*45deg. At 0 rotation, sector 6 (6*45=270) is at top.
            // As rotation increases (clockwise), wedges move from 5->4->3...
            const winningIndex = (6 - Math.round(actualRotation / 45) % 8 + 8) % 8;
            onComplete(sectors[winningIndex]);
        }, 3000);
    };

    return (
        <div className="flex flex-col items-center gap-8 py-4">
            <div className="relative w-64 h-64">
                <div className="absolute top-0 left-1/2 -ml-3 -mt-4 w-6 h-8 bg-red-500 z-20 clip-path-triangle shadow-lg"></div>
                <div className="w-full h-full rounded-full border-8 border-slate-900 shadow-2xl relative overflow-hidden transition-transform duration-[3000ms] cubic-bezier(0.13, 0.99, 0.3, 1)" style={{ transform: `rotate(${rotation}deg)` }}>
                    {sectors.map((val, i) => (
                        <div
                            key={i}
                            className="absolute top-0 left-1/2 w-1/2 h-full origin-left flex items-center justify-end pr-10"
                            style={{
                                transform: `rotate(${i * 45}deg)`,
                                backgroundColor: i % 2 === 0 ? '#fafafa' : '#f0f4f8'
                            }}
                        >
                            <div className="flex flex-col items-center justify-center transform -rotate-90 translate-x-4">
                                <span className="text-[10px] font-black text-slate-900 leading-none">{val}</span>
                                <Star size={8} className="text-amber-400 mt-0.5" fill="currentColor" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 rounded-full border-4 border-white shadow-xl flex items-center justify-center z-10">
                    <Star size={20} className="text-amber-400 fill-amber-400" />
                </div>
            </div>
            <button onClick={spin} disabled={spinning} className={`px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${spinning ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white shadow-slate-200'}`}>
                {spinning ? t("spinning") : t("spinNow")}
            </button>
        </div>
    );
};

const ScratchCard = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scratched, setScratched] = useState(false);
    const [reward] = useState(() => {
        if (config.reward_type === 'fixed') return config.reward_value as number;
        const { min, max } = config.reward_value as { min: number; max: number };
        return Math.floor(Math.random() * (max - min + 1)) + min;
    });
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8'; for (let i = 0; i < 1000; i++) ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
        ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#475569'; ctx.textAlign = 'center'; ctx.fillText(t("scratchHere"), canvas.width / 2, canvas.height / 2 + 6);
    }, [t]);

    const scratch = (e: any) => {
        if (scratched) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left);
        const y = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top);
        ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let clearPixels = 0; for (let i = 3; i < imageData.data.length; i += 4) if (imageData.data[i] === 0) clearPixels++;
        if (clearPixels > (canvas.width * canvas.height) * 0.4) {
            setScratched(true);
            setTimeout(() => onComplete(reward), 1000);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="relative w-64 h-40 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900">
                <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-2">
                    <Trophy size={48} className="text-amber-500 animate-bounce" />
                    <span className="text-2xl font-black text-slate-900">{reward} {t("stars").toUpperCase()}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("youWon")}</span>
                </div>
                <canvas ref={canvasRef} width={256} height={160} className="absolute inset-0 cursor-crosshair touch-none" onMouseDown={() => setIsDrawing(true)} onMouseUp={() => setIsDrawing(false)} onMouseMove={(e) => isDrawing && scratch(e)} onTouchStart={() => setIsDrawing(true)} onTouchEnd={() => setIsDrawing(false)} onTouchMove={(e) => isDrawing && scratch(e)} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">{t("scratchReveal")}</p>
        </div>
    );
};

const MiniQuiz = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const questions = [{ q: "What is 25 + 75?", a: "100", o: ["90", "100", "110", "120"] }, { q: "Which color is usually for profit?", a: "Green", o: ["Red", "Blue", "Green", "Yellow"] }, { q: "What is 10 x 10?", a: "100", o: ["10", "100", "1000", "50"] }, { q: "How many hours in a day?", a: "24", o: ["12", "24", "48", "6"] }];
    const [currentQ] = useState(questions[Math.floor(Math.random() * questions.length)]);
    const [selected, setSelected] = useState<string | null>(null);
    const reward = useState(() => {
        if (config.reward_type === 'fixed') return config.reward_value as number;
        const { min, max } = config.reward_value as { min: number; max: number };
        return Math.floor(Math.random() * (max - min + 1)) + min;
    })[0];

    const checkAnswer = (opt: string) => {
        if (selected) return; setSelected(opt);
        if (opt === currentQ.a) setTimeout(() => onComplete(reward), 1000);
        else { toast.error("Oops! Wrong answer."); setTimeout(() => onComplete(0), 1000); }
    };

    return (
        <div className="flex flex-col gap-6 py-4 w-full">
            <div className="bg-slate-50 rounded-3xl p-8 text-center border-2 border-slate-100 shadow-inner">
                <h4 className="text-xl font-black text-slate-900 leading-tight">{currentQ.q}</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {currentQ.o.map((opt) => (
                    <button key={opt} onClick={() => checkAnswer(opt)} className={`p-5 rounded-2xl font-black transition-all border-2 active:scale-95 ${selected === opt ? opt === currentQ.a ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200' : 'bg-red-500 border-red-600 text-white' : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200'}`}>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

const MemoryGame = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const icons = ['🔥', '💎', '🚀', '🌈'];
    const [cards, setCards] = useState(() => [...icons, ...icons].sort(() => Math.random() - 0.5));
    const [flipped, setFlipped] = useState<number[]>([]);
    const [solved, setSolved] = useState<number[]>([]);
    const reward = useState(() => {
        if (config.reward_type === 'fixed') return config.reward_value as number;
        const { min, max } = config.reward_value as { min: number; max: number };
        return Math.floor(Math.random() * (max - min + 1)) + min;
    })[0];

    const handleFlip = (i: number) => {
        if (flipped.length === 2 || solved.includes(i) || flipped.includes(i)) return;
        const newFlipped = [...flipped, i]; setFlipped(newFlipped);
        if (newFlipped.length === 2) {
            if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
                const newSolved = [...solved, ...newFlipped]; setSolved(newSolved);
                setFlipped([]);
                if (newSolved.length === cards.length) setTimeout(() => onComplete(reward), 1000);
            } else {
                setTimeout(() => setFlipped([]), 1000);
            }
        }
    };

    return (
        <div className="grid grid-cols-4 gap-3 py-4">
            {cards.map((icon, i) => (
                <button key={i} onClick={() => handleFlip(i)} className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 transform active:scale-90 ${flipped.includes(i) || solved.includes(i) ? 'bg-white shadow-lg rotate-0' : 'bg-slate-900 text-transparent rotate-180'}`}>
                    {(flipped.includes(i) || solved.includes(i)) ? icon : '?'}
                </button>
            ))}
        </div>
    );
};

const WordMaster = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const words = ["TURNER", "STARS", "FORTUNE", "CRYPTO", "ELITE"];
    const [word] = useState(() => words[Math.floor(Math.random() * words.length)]);
    const [scrambled] = useState(() => word.split('').sort(() => Math.random() - 0.5).join(''));
    const [guess, setGuess] = useState("");
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    const check = () => {
        if (guess.toUpperCase() === word) onComplete(reward);
        else toast.error("Incorrect word!");
    };

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 text-3xl font-black tracking-[0.5em] text-slate-900">{scrambled}</div>
            <input value={guess} onChange={(e) => setGuess(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-center font-bold outline-none focus:border-indigo-500" placeholder={t("typeWord")} />
            <button onClick={check} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase">{t("verifyWord")}</button>
        </div>
    );
};

const MathRush = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const [num1] = useState(Math.floor(Math.random() * 50) + 1);
    const [num2] = useState(Math.floor(Math.random() * 50) + 1);
    const [ans, setAns] = useState("");
    const reward = useState(() => config.reward_type === 'fixed' ? config.reward_value as number : Math.floor(Math.random() * ((config.reward_value as any).max - (config.reward_value as any).min)) + (config.reward_value as any).min)[0];

    const check = () => {
        if (parseInt(ans) === num1 + num2) onComplete(reward);
        else toast.error("Wrong calculation!");
    };

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="text-4xl font-black text-slate-900">{num1} + {num2} = ?</div>
            <input type="number" value={ans} onChange={(e) => setAns(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-center font-bold outline-none" placeholder={t("yourAnswer")} />
            <button onClick={check} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest">{t("submitResult")}</button>
        </div>
    );
};

const TreasureHunt = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const [reward] = useState(() => config.reward_type === 'fixed' ? config.reward_value as number : Math.floor(Math.random() * ((config.reward_value as any).max - (config.reward_value as any).min)) + (config.reward_value as any).min);
    return (
        <div className="grid grid-cols-3 gap-4 py-8">
            {[1, 2, 3].map(i => (
                <button key={i} onClick={() => onComplete(reward)} className="aspect-square bg-slate-50 rounded-3xl border-2 border-slate-100 flex items-center justify-center text-5xl hover:scale-110 transition-transform active:scale-90">🎁</button>
            ))}
        </div>
    );
};

const CoinFlip = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const [flipping, setFlipping] = useState(false);
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    const flip = () => {
        setFlipping(true);
        setTimeout(() => onComplete(Math.random() > 0.5 ? reward : 0), 1500);
    };

    return (
        <div className="flex flex-col items-center gap-8 py-4">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-700 shadow-xl flex items-center justify-center text-5xl text-white font-black ${flipping ? 'animate-bounce' : ''}`}>$</div>
            <button onClick={flip} disabled={flipping} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest">{t("flipCoin")}</button>
        </div>
    );
};

const RPSBattle = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const options = ["ROCK", "PAPER", "SCISSORS"];
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    const play = (choice: string) => {
        const ai = options[Math.floor(Math.random() * 3)];
        if (choice === ai) { toast.info(`AI picked ${ai}. Draw!`); onComplete(Math.floor(reward / 2)); }
        else if ((choice === "ROCK" && ai === "SCISSORS") || (choice === "PAPER" && ai === "ROCK") || (choice === "SCISSORS" && ai === "PAPER")) { toast.success(`AI picked ${ai}. You Won!`); onComplete(reward); }
        else { toast.error(`AI picked ${ai}. You Lost!`); onComplete(5); }
    };

    return (
        <div className="grid grid-cols-3 gap-3 py-4">
            {["🪨", "📄", "✂️"].map((icon, i) => (
                <button key={i} onClick={() => play(options[i])} className="aspect-square bg-slate-50 border-2 border-slate-100 rounded-2xl text-4xl flex flex-col items-center justify-center gap-2 hover:bg-white transition-all active:scale-90 shadow-sm"><span className="text-3xl">{icon}</span><span className="text-[8px] font-black">{options[i]}</span></button>
            ))}
        </div>
    );
};

const NumberGuess = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const [target] = useState(Math.floor(Math.random() * 10) + 1);
    const reward = useState(() => config.reward_type === 'fixed' ? config.reward_value as number : Math.floor(Math.random() * ((config.reward_value as any).max - (config.reward_value as any).min)) + (config.reward_value as any).min)[0];

    return (
        <div className="grid grid-cols-5 gap-2 py-4">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => n === target ? onComplete(reward) : toast.error("Try again!")} className="aspect-square bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-700 hover:bg-white active:scale-90">{n}</button>
            ))}
        </div>
    );
};

const ColorTap = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const colors = ["RED", "BLUE", "GREEN", "YELLOW"];
    const [target] = useState(colors[Math.floor(Math.random() * 4)]);
    const reward = config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).min;

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <p className="text-xl font-black text-slate-900">{t("tapCircle")} <span className="text-indigo-600">{target}</span> {t("circle")}</p>
            <div className="flex gap-4">
                {colors.map(c => (
                    <button key={c} onClick={() => c === target ? onComplete(reward) : onComplete(0)} className={`w-14 h-14 rounded-full shadow-lg border-2 border-white transition-transform active:scale-90 ${c === 'RED' ? 'bg-red-500' : c === 'BLUE' ? 'bg-blue-500' : c === 'GREEN' ? 'bg-emerald-500' : 'bg-yellow-400'}`}></button>
                ))}
            </div>
        </div>
    );
};

const FastClicker = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const [clicks, setClicks] = useState(0);
    const [timer, setTimer] = useState(5);
    const [active, setActive] = useState(false);
    const reward = useState(() => config.reward_type === 'fixed' ? config.reward_value as number : Math.floor(Math.random() * ((config.reward_value as any).max - (config.reward_value as any).min)) + (config.reward_value as any).min)[0];

    useEffect(() => {
        let interval: any;
        if (active && timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
        else if (timer === 0) onComplete(clicks >= 25 ? reward : Math.floor(clicks * 1.5));
        return () => clearInterval(interval);
    }, [active, timer]);

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex justify-between w-full font-black text-xs text-slate-400 uppercase tracking-widest"><span>{t("clicks")}: {clicks}</span><span>{t("time")}: {timer}s</span></div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="h-full bg-orange-500 transition-all" style={{ width: `${(timer / 5) * 100}%` }}></div></div>
            <button onClick={() => { if (!active) setActive(true); setClicks(c => c + 1); }} disabled={timer === 0} className="w-32 h-32 rounded-full bg-slate-900 text-white font-black text-2xl shadow-xl active:scale-90 transition-transform">{t("tap")}</button>
        </div>
    );
};

const DiceRoller = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const [rolling, setRolling] = useState(false);
    const [result, setResult] = useState(1);
    const reward = useState(() => config.reward_type === 'fixed' ? config.reward_value as number : Math.floor(Math.random() * ((config.reward_value as any).max - (config.reward_value as any).min)) + (config.reward_value as any).min)[0];

    const roll = () => {
        setRolling(true);
        setTimeout(() => {
            const res = Math.floor(Math.random() * 6) + 1;
            setResult(res); setRolling(false); onComplete(Math.floor(reward * (res / 3)));
        }, 1000);
    };

    return (
        <div className="flex flex-col items-center gap-8 py-4">
            <div className={`w-24 h-24 bg-white border-4 border-slate-900 rounded-3xl flex items-center justify-center text-5xl shadow-xl ${rolling ? 'animate-spin' : ''}`}>{result}</div>
            <button onClick={roll} disabled={rolling} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest">{t("rollDice")}</button>
        </div>
    );
};

const SlotMachine = ({ config, onComplete, t }: { config: Task, onComplete: (reward: number) => void, t: (key: string) => string }) => {
    const emojis = ['⭐', '💎', '🔥', '👑'];
    const [slots, setSlots] = useState(['⭐', '⭐', '⭐']);
    const [rolling, setRolling] = useState(false);
    const reward = useState(() => config.reward_type === 'fixed' ? config.reward_value as number : (config.reward_value as any).max)[0];

    const spin = () => {
        setRolling(true);
        const interval = setInterval(() => setSlots([emojis[Math.floor(Math.random() * 4)], emojis[Math.floor(Math.random() * 4)], emojis[Math.floor(Math.random() * 4)]]), 100);
        setTimeout(() => {
            clearInterval(interval); setRolling(false);
            const final = [emojis[Math.floor(Math.random() * 4)], emojis[Math.floor(Math.random() * 4)], emojis[Math.floor(Math.random() * 4)]];
            setSlots(final);
            if (final[0] === final[1] && final[1] === final[2]) onComplete(reward);
            else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) onComplete(Math.floor(reward / 5));
            else onComplete(5);
        }, 2000);
    };

    return (
        <div className="flex flex-col items-center gap-8 py-4">
            <div className="flex gap-4 p-6 bg-slate-900 rounded-3xl shadow-inner">
                {slots.map((s, i) => (
                    <div key={i} className="w-16 h-20 bg-white rounded-xl flex items-center justify-center text-3xl shadow-lg">{s}</div>
                ))}
            </div>
            <button onClick={spin} disabled={rolling} className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-purple-200">{t("pullLever")}</button>
        </div>
    );
};

export default function TasksPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [taskStats, setTaskStats] = useState<any>({});
    const [isClaiming, setIsClaiming] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);

    const [language, setLanguage] = useState<"english" | "amharic">("english");

    useEffect(() => {
        const savedLang = localStorage.getItem("appLanguage") as "english" | "amharic";
        if (savedLang && (savedLang === "english" || savedLang === "amharic")) {
            setLanguage(savedLang);
        }
    }, []);

    const translations = {
        english: {
            premiumAssets: "Premium Assets",
            dailyTasks: "Daily Tasks",
            starWallet: "Turner Star Wallet",
            stars: "Stars",
            status: "Status",
            active: "Active",
            earnings: "Earnings",
            dailyRewards: "Daily Star Rewards",
            availableTasks: "Available Tasks",
            completed: "Completed",
            left: "Left",
            winStars: "Win Turner Stars",
            claimStars: "Collect Turner Stars",
            collecting: "Collecting Stars...",
            readyToClaim: "Ready to Claim",
            received: "Received",
            failedReward: "Failed to reward Stars.",
            task_spin_wheel_name: 'Lucky Spin', task_spin_wheel_desc: 'Spin the wheel and test your luck!',
            task_scratch_card_name: 'Magic Scratch', task_scratch_card_desc: 'Scratch to reveal your hidden treasure.',
            task_mini_quiz_name: 'Brain IQ', task_mini_quiz_desc: 'Answer correctly to win instant rewards.',
            task_memory_card_name: 'Memory Match', task_memory_card_desc: 'Match the symbols to claim the prize.',
            task_daily_checklist_name: 'Daily Check', task_daily_checklist_desc: 'Sign in daily to claim your bonus.',
            task_word_scramble_name: 'Word Master', task_word_scramble_desc: 'Unscramble the word to earn stars.',
            task_math_rush_name: 'Math Rush', task_math_rush_desc: 'Solve quick math problems.',
            task_treasure_hunt_name: 'Vault Hunt', task_treasure_hunt_desc: 'Pick a chest to find hidden stars.',
            task_coin_flip_name: 'Flip N Win', task_coin_flip_desc: 'Guess Head or Tail for stars.',
            task_rps_battle_name: 'RPS Battle', task_rps_battle_desc: 'Win Rock Paper Scissors vs AI.',
            task_number_guess_name: 'Number Guru', task_number_guess_desc: 'Guess the lucky number from 1-10.',
            task_color_tap_name: 'Color Dash', task_color_tap_desc: 'Tap the color that matches the prompt.',
            task_fast_clicker_name: 'Fast Tap', task_fast_clicker_desc: 'Tap as fast as you can!',
            task_dice_roller_name: 'Lucky Dice', task_dice_roller_desc: 'Roll the dice for star rewards.',
            task_slot_machine_name: 'Star Slots', task_slot_machine_desc: 'Spin the slots for a huge jackpot!',
            spinNow: 'Spin Now', spinning: 'Spinning...',
            scratchHere: 'SCRATCH HERE', youWon: 'You Won!', scratchReveal: 'Scratch to reveal Stars',
            verifyWord: 'Verify Word', typeWord: 'Type the word...', incorrectWord: 'Incorrect word!',
            submitResult: 'Submit Result', yourAnswer: 'Your answer', wrongCalc: 'Wrong calculation!',
            flipCoin: 'Flip Coin',
            tapCircle: 'TAP THE', circle: 'CIRCLE',
            clicks: 'Clicks', time: 'Time', tap: 'TAP!',
            rollDice: 'Roll Lucky Dice',
            pullLever: 'Pull Lever'
        },
        amharic: {
            premiumAssets: "ፕሪሚየም ንብረቶች",
            dailyTasks: "ዕለታዊ ተግባራት",
            starWallet: "የተርነር ኮከብ ቦርሳ",
            stars: "ኮከቦች",
            status: "ሁኔታ",
            active: "ንቁ",
            earnings: "ገቢዎች",
            dailyRewards: "ዕለታዊ የኮከብ ሽልማቶች",
            availableTasks: "የሚገኙ ተግባራት",
            completed: "ተጠናቋል",
            left: "ቀሪ",
            winStars: "ተርነር ኮከቦችን ያሸንፉ",
            claimStars: "ተርነር ኮከቦችን ይሰብስቡ",
            collecting: "ኮከቦችን በመሰብሰብ ላይ...",
            readyToClaim: "ለመቀበል ዝግጁ",
            received: "ተቀብለዋል",
            failedReward: "ኮከቦችን መሸለም አልተቻለም።",
            task_spin_wheel_name: 'ዕድለኛው መንኮራኩር', task_spin_wheel_desc: 'መንኮራኩሩን ያሽከርክሩ እና ዕድልዎን ይፈትሹ!',
            task_scratch_card_name: 'አስማታዊ ካርድ', task_scratch_card_desc: 'የተደበቀውን ሀብት ለማግኘት ይፋቁ።',
            task_mini_quiz_name: 'የአዕምሮ IQ', task_mini_quiz_desc: 'ሽልማቶችን ለማግኘት በትክክል ይመልሱ።',
            task_memory_card_name: 'የማስታወስ ጨዋታ', task_memory_card_desc: 'ሽልማቱን ለማግኘት ምልክቶቹን ያዛምዱ።',
            task_daily_checklist_name: 'ዕለታዊ ክትትል', task_daily_checklist_desc: 'ጉርሻዎን ለማግኘት በየቀኑ ይግቡ።',
            task_word_scramble_name: 'የቃላት ጌታ', task_word_scramble_desc: 'ኮከቦችን ለማግኘት ቃሉን ያስተካክሉ።',
            task_math_rush_name: 'የሂሳብ ፍጥጫ', task_math_rush_desc: 'ፈጣን የሂሳብ ጥያቄዎችን ይፍቱ።',
            task_treasure_hunt_name: 'የሀብት ፍለጋ', task_treasure_hunt_desc: 'የተደበቁ ኮከቦችን ለማግኘት ሳጥን ይምረጡ።',
            task_coin_flip_name: 'ሳንቲም ወርውር', task_coin_flip_desc: 'ለኮከቦች ሰው ወይም በሬ ይገምቱ።',
            task_rps_battle_name: 'የድንጋይ ወረቀት', task_rps_battle_desc: 'AIን በድንጋይ ወረቀት መቀስ ያሸንፉ።',
            task_number_guess_name: 'ቁጥር ገማሪ', task_number_guess_desc: 'ከ1-10 ዕድለኛውን ቁጥር ይገምቱ።',
            task_color_tap_name: 'የቀለም ውድድር', task_color_tap_desc: 'ከጥያቄው ጋር የሚዛመደውን ቀለም ይንኩ።',
            task_fast_clicker_name: 'ፈጣን ጣቶች', task_fast_clicker_desc: 'በተቻለ ፍጥነት ይንኩ!',
            task_dice_roller_name: 'ዕድለኛ ዛር', task_dice_roller_desc: 'ለኮከብ ሽልማቶች ዛሩን ይወርውሩ።',
            task_slot_machine_name: 'የኮከብ ማሽን', task_slot_machine_desc: 'ለትልቅ ሽልማት ማሽኑን ያሽከርክሩ!',
            spinNow: 'አሽከርክር', spinning: 'በማሽከርከር ላይ...',
            scratchHere: 'እዚህ ይፋቁ', youWon: 'አሸንፈዋል!', scratchReveal: 'ኮከቦችን ለማግኘት ይፋቁ',
            verifyWord: 'ቃሉን ያረጋግጡ', typeWord: 'ቃሉን ይተይቡ...', incorrectWord: 'የተሳሳተ ቃል!',
            submitResult: 'ውጤት ያስገቡ', yourAnswer: 'የእርስዎ መልስ', wrongCalc: 'የተሳሳተ ስሌት!',
            flipCoin: 'ሳንቲም ወርውር',
            tapCircle: 'ክቡን', circle: 'ይንኩ',
            clicks: 'ጠቅታዎች', time: 'ጊዜ', tap: 'ንካ!',
            rollDice: 'ዕድለኛ ዛር ወርውር',
            pullLever: 'ማሽኑን አሽከርክር'
        }
    };

    const t = (key: string) => {
        return (translations[language] as any)[key] || (translations.english as any)[key] || key;
    };


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) { router.push("/"); return; }
            setUser(currentUser);
            const userRef = doc(db, "users", currentUser.uid);
            const unsubscribeData = onSnapshot(userRef, (doc) => {
                if (doc.exists()) { setUserData(doc.data()); setTaskStats(doc.data().task_stats || {}); }
                setLoading(false);
            });
            return () => unsubscribeData();
        });

        const unsubscribeConfig = onSnapshot(doc(db, "Settings", "tasks"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const activeConfigs = DEFAULT_TASKS.map(task => ({
                    ...task,
                    ...(data[task.id] || {})
                })).filter(t => t.is_active);
                setTasks(activeConfigs);
            } else {
                setTasks(DEFAULT_TASKS.filter(t => t.is_active));
            }
        });

        return () => {
            unsubscribe();
            unsubscribeConfig();
        };
    }, [router]);

    const claimReward = async (taskId: string, amount: number) => {
        if (!user || isClaiming) { setActiveTask(null); return; }
        if (amount <= 0) { setActiveTask(null); return; }
        setIsClaiming(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const key = `${taskId}_${todayStr}`;
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                stars: increment(amount),
                [`task_stats.${key}`]: increment(1)
            });
            toast.success(`${t("received")} ${amount} ${t("stars")}!`, { icon: '✨' });
        } catch (error) { console.error(error); toast.error(t("failedReward")); }
        finally { setIsClaiming(false); setActiveTask(null); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-slate-900" /></div>;

    const todayStr = new Date().toISOString().split('T')[0];
    const getRemainingPlays = (taskId: string, limit: number) => {
        const key = `${taskId}_${todayStr}`;
        return Math.max(0, limit - (taskStats[key] || 0));
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 select-none font-sans overflow-hidden">
            <header className="px-6 pt-12 pb-6 flex items-center justify-between bg-white border-b border-slate-100 z-20 shadow-sm">
                <button onClick={() => router.push("/users/welcome")} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100"><ChevronLeft size={20} /></button>
                <div className="flex flex-col items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t("premiumAssets")}</span><span className="text-xl font-black tracking-tight">{t("dailyTasks")}</span></div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-100"><Star size={18} fill="currentColor" /></div>
            </header>

            <main className="flex-1 overflow-y-auto px-6 py-6 pb-12 space-y-8 no-scrollbar">
                <section className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("starWallet")}</span><Star size={20} className="text-amber-400 fill-amber-400" /></div>
                        <div className="flex items-baseline gap-2"><span className="text-5xl font-black tracking-tighter">{Number(userData?.stars || 0).toLocaleString()}</span><span className="text-sm font-bold opacity-60 uppercase tracking-widest">{t("stars")}</span></div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 uppercase tracking-widest font-black text-[9px]">
                            <div className="flex flex-col gap-1"><span className="text-slate-500">{t("status")}</span><span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={10} /> {t("active")}</span></div>
                            <div className="flex flex-col gap-1"><span className="text-slate-500">{t("earnings")}</span><span className="text-amber-400 flex items-center gap-1"><Sparkles size={10} /> {t("dailyRewards")}</span></div>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-1.5 h-4 bg-slate-900 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]"></div><h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t("availableTasks")}</h3></div><RefreshCcw size={16} className="text-slate-300" /></div>
                    <div className="grid grid-cols-2 gap-5">
                        {tasks.map((task) => {
                            const remaining = getRemainingPlays(task.id, task.daily_limit);
                            const locked = remaining === 0;
                            // Dynamic translation lookup
                            const tName = t(`task_${task.id}_name` as any) || task.name;
                            // const tDesc = t(`task_${task.id}_desc` as any) || task.description; // Description used in modal

                            return (
                                <button key={task.id} disabled={locked} onClick={() => setActiveTask(task)} className={`relative aspect-[0.9/1] rounded-[2.5rem] p-6 flex flex-col items-center justify-between transition-all duration-300 overflow-hidden ${locked ? 'bg-slate-100 opacity-60 shadow-inner' : 'bg-white shadow-xl shadow-slate-200/40 active:scale-95 group'}`}>
                                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-[0.05] bg-gradient-to-br ${task.color}`}></div>
                                    <div className="relative z-10 w-full flex justify-between items-start"><span className={`px-2 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${locked ? 'bg-slate-200' : 'bg-slate-50 text-slate-600'}`}>{locked ? t("completed") : `${remaining} ${t("left")}`}</span>{locked ? <Lock size={14} className="text-slate-400" /> : <Sparkles size={14} className="text-amber-400 animate-pulse" />}</div>
                                    <div className="relative z-10 flex flex-col items-center gap-3"><span className="text-4xl filter drop-shadow-lg transform group-hover:scale-125 transition-transform">{task.icon}</span><div className="text-center"><p className="text-xs font-black uppercase tracking-tight">{tName}</p><p className="text-[9px] font-black text-slate-400 mt-1 uppercase opacity-60">{t("winStars")}</p></div></div>
                                    <div className={`relative z-10 w-full h-11 rounded-2xl flex items-center justify-center transition-all ${locked ? 'bg-slate-200' : 'bg-slate-900 shadow-lg'}`}>{locked ? <CheckCircle2 size={16} className="text-slate-400" /> : <Play size={14} fill="white" className="text-white" />}</div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </main>

            {activeTask && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-6 animate-in fade-in">
                    <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 relative shadow-2xl animate-in zoom-in-95">
                        <button onClick={() => setActiveTask(null)} className="absolute top-8 right-8 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><X size={20} /></button>
                        <div className="text-center mb-10"><div className={`w-20 h-20 rounded-[2rem] mx-auto mb-6 bg-gradient-to-br ${activeTask.color} flex items-center justify-center text-4xl shadow-xl border-4 border-white`}>{activeTask.icon}</div><h3 className="text-2xl font-black tracking-tight">{t(`task_${activeTask.id}_name` as any) || activeTask.name}</h3><p className="text-xs font-bold text-slate-400 mt-2">{t(`task_${activeTask.id}_desc` as any) || activeTask.description}</p></div>
                        <div className="mb-10">
                            {activeTask.type === 'spin' && <SpinWheel config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'scratch' && <ScratchCard config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'quiz' && <MiniQuiz config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'memory' && <MemoryGame config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'word' && <WordMaster config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'math' && <MathRush config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'treasure' && <TreasureHunt config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'coin' && <CoinFlip config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'rps' && <RPSBattle config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'guess' && <NumberGuess config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'color' && <ColorTap config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'clicker' && <FastClicker config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'dice' && <DiceRoller config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'slots' && <SlotMachine config={activeTask} onComplete={(r) => claimReward(activeTask.id, r)} t={t} />}
                            {activeTask.type === 'checklist' && <div className="flex flex-col items-center gap-6"><div className="w-48 h-48 rounded-full bg-slate-50 border-8 border-slate-100 flex flex-col items-center justify-center gap-2 shadow-inner"><HandMetal size={48} className="text-indigo-600 animate-bounce" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("readyToClaim")}</span></div><button onClick={() => claimReward(activeTask.id, (activeTask.reward_value as number) || 50)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl active:scale-95">{t("claimStars")}</button></div>}
                        </div>
                    </div>
                </div>
            )}
            {isClaiming && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/90 backdrop-blur-xl animate-in fade-in"><div className="flex flex-col items-center gap-6"><div className="relative"><Loader2 className="w-16 h-16 animate-spin text-slate-900" /><Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500 animate-pulse" /></div><p className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">{t("collecting")}</p></div></div>}
        </div>
    );
}
