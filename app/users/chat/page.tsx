"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    getDocs,
    limit
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ChevronLeft,
    Send,
    Loader2,
    MessageSquare,
    Check,
    CheckCheck,
    Image as ImageIcon,
    Paperclip
} from "lucide-react";

export default function UserChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [guidelines, setGuidelines] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasScrolledToUnread = useRef(false);
    const initialUnreadCount = useRef(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        // Real-time guidelines listener with error handling
        const unsubscribeGuidelines = onSnapshot(collection(db, "guidelines"), (snapshot) => {
            const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            const order = ["welcome", "goal", "recharge", "product", "invite"];
            const sorted = data.sort((a: any, b: any) => {
                const indexA = order.indexOf(String(a.id));
                const indexB = order.indexOf(String(b.id));
                return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
            });
            setGuidelines(sorted);
        }, (error) => {
            console.error("Guidelines listener failed:", error);
        });

        let unsubscribeMessages: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            try {
                // Fetch user data for chat info
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }

                // Fetch initial unread count once
                const chatSnap = await getDoc(doc(db, "chats", currentUser.uid));
                if (chatSnap.exists()) {
                    initialUnreadCount.current = chatSnap.data().unreadCountUser || 0;
                } else {
                    // If no chat doc yet, it's not loading anymore
                    setLoading(false);
                }

                // Real-time messages listener
                const messagesRef = collection(db, "chats", currentUser.uid, "messages");
                const q = query(messagesRef, orderBy("timestamp", "asc"), limit(100));

                unsubscribeMessages = onSnapshot(q, (snapshot) => {
                    const msgs = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    const shouldScrollToUnread = initialUnreadCount.current > 0 && !hasScrolledToUnread.current;

                    setMessages(msgs);
                    setLoading(false);

                    if (shouldScrollToUnread) {
                        hasScrolledToUnread.current = true;
                        setTimeout(() => {
                            if (scrollRef.current) {
                                const container = scrollRef.current;
                                const bubbles = container.querySelectorAll('.message-bubble');
                                const targetIdx = msgs.length - initialUnreadCount.current;
                                if (bubbles[targetIdx]) {
                                    bubbles[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                                } else {
                                    scrollToBottom(true);
                                }
                            }
                        }, 500); // More delay for guidelines/images
                    } else {
                        scrollToBottom(true);
                    }

                    // Clear unread count for user when they open the chat
                    updateUnreadCount(currentUser.uid).catch(console.error);
                }, (error) => {
                    console.error("Messages listener failed:", error);
                    setLoading(false);
                });
            } catch (error) {
                console.error("Error initializing chat:", error);
                setLoading(false);
            }
        }, (error) => {
            console.error("Auth observer failed:", error);
            setLoading(false);
        });

        // Safety timeout to prevent permanent loading state
        const loadingTimeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        return () => {
            unsubscribeAuth();
            unsubscribeGuidelines();
            clearTimeout(loadingTimeout);
            if (unsubscribeMessages) unsubscribeMessages();
        };
    }, [router, mounted]);

    // Auto-scroll to bottom
    const scrollToBottom = (smooth = true) => {
        if (scrollRef.current) {
            const container = scrollRef.current;

            const performScroll = () => {
                const bubbles = container.querySelectorAll('.message-bubble');
                if (bubbles.length > 0) {
                    const lastBubble = bubbles[bubbles.length - 1];
                    lastBubble.scrollIntoView({
                        behavior: smooth ? 'smooth' : 'auto',
                        block: 'end'
                    });
                } else {
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior: smooth ? 'smooth' : 'auto'
                    });
                }
            };

            // Immediate
            performScroll();

            // Catch late renders
            setTimeout(performScroll, 100);
            setTimeout(performScroll, 300);
            setTimeout(performScroll, 800);
        }
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom(true);
        }
    }, [messages, guidelines]);

    const updateUnreadCount = async (uid: string) => {
        try {
            const chatRef = doc(db, "chats", uid);
            const chatSnap = await getDoc(chatRef);
            if (chatSnap.exists()) {
                await setDoc(chatRef, {
                    unreadCountUser: 0
                }, { merge: true });
            }
        } catch (error) {
            console.error("Error updating unread count:", error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || sending) return;

        setSending(true);
        const text = newMessage.trim();
        setNewMessage("");

        try {
            // 1. Add message to sub-collection
            const messagesRef = collection(db, "chats", user.uid, "messages");
            await addDoc(messagesRef, {
                text,
                senderId: user.uid,
                timestamp: serverTimestamp()
            });

            // 2. Update chat summary for admin inbox
            const chatRef = doc(db, "chats", user.uid);
            const chatSnap = await getDoc(chatRef);
            const currentUnread = chatSnap.exists() ? (chatSnap.data().unreadCountAdmin || 0) : 0;

            await setDoc(chatRef, {
                lastMessage: text,
                lastTimestamp: serverTimestamp(),
                userId: user.uid,
                userPhone: userData?.phone || user.email || "Unknown User",
                unreadCountAdmin: currentUnread + 1,
                updatedAt: serverTimestamp()
            }, { merge: true });

        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return "";
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            if (isNaN(date.getTime())) return "";
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return "";
        }
    };

    if (!mounted || loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="h-screen bg-zinc-50 flex flex-col max-w-lg mx-auto shadow-2xl overflow-hidden relative border-x border-zinc-100">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 active:scale-90 transition-transform"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-3xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <img src="/logo.png" className="w-7 h-7 object-contain" alt="Support" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-gray-900 leading-none mb-1 uppercase tracking-tight">Support Staff</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Active Now</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <main
                ref={scrollRef}
                className="flex-1 px-5 overflow-y-auto space-y-4 py-6"
            >
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in duration-700">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-zinc-100 flex items-center justify-center text-zinc-300">
                            <MessageSquare size={40} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">No Messages Yet</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Send a message to start chatting</p>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user.uid;
                    return (
                        <div key={msg.id || idx}>
                            <div
                                className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300 mb-4 message-bubble`}
                            >
                                <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                    <div className={`
                                        px-5 py-3.5 rounded-[1.75rem] text-sm font-medium leading-relaxed
                                        ${isMe
                                            ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10"
                                            : "bg-white text-zinc-800 rounded-tl-none border border-zinc-100 shadow-sm"
                                        }
                                    `}>
                                        {msg.text}
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-1 px-1">
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                            {formatTime(msg.timestamp)}
                                        </span>
                                        {isMe && (
                                            <CheckCheck size={12} className="text-blue-500" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Show Guidelines after the FIRST message ONLY */}
                            {idx === 0 && guidelines.length > 0 && (
                                <div className="space-y-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center gap-2 mb-4 px-1">
                                        <div className="h-px bg-zinc-200 flex-1"></div>
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Official Support Guide</span>
                                        <div className="h-px bg-zinc-200 flex-1"></div>
                                    </div>
                                    {guidelines.map((guide) => (
                                        <div key={guide.id} className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden border-l-4 border-l-blue-600">
                                            {guide.imageUrl && (
                                                <div className="w-full aspect-video overflow-hidden">
                                                    <img
                                                        src={guide.imageUrl}
                                                        alt={guide.id}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="p-5 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">
                                                        {guide.id === 'welcome' ? 'Welcome Message' :
                                                            guide.id === 'goal' ? 'Company Goal' :
                                                                guide.id === 'recharge' ? 'How to Recharge' :
                                                                    guide.id === 'product' ? 'How to Buy Product' :
                                                                        guide.id === 'invite' ? 'How to Invite User' : guide.id}
                                                    </h3>
                                                </div>
                                                <p className="text-[11px] text-zinc-600 font-medium leading-relaxed whitespace-pre-wrap">
                                                    {guide.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 mt-8 px-1">
                                        <div className="h-px bg-zinc-200 flex-1"></div>
                                        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">Chat History</span>
                                        <div className="h-px bg-zinc-200 flex-1"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </main>

            {/* Input Area */}
            <div className="sticky bottom-0 bg-white/90 backdrop-blur-xl border-t border-zinc-100 p-4 pb-8 z-50 shrink-0">
                <form
                    onSubmit={handleSendMessage}
                    className="max-w-lg mx-auto flex items-center gap-3"
                >
                    <button
                        type="button"
                        className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors shrink-0"
                    >
                        <Paperclip size={20} />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full h-12 pl-5 pr-12 rounded-2xl bg-zinc-100 border-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium text-zinc-800"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0
                            ${newMessage.trim() && !sending
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-95"
                                : "bg-zinc-100 text-zinc-400"
                            }
                        `}
                    >
                        {sending ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <Send size={20} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
