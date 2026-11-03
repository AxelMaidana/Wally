import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    MessageCircle,
    X,
    ArrowUp,
    Mic,
    Square,
    RotateCcw
} from 'lucide-react';
import { processChatMessage, undoTransaction } from '../../services/aiService';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { OPEN_WALLY_EVENT } from './wallyEvents';
import { cn } from '../../lib/utils';
import { sidebarSpring, softSpring } from '../../lib/motion';

const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

// "2026-11-03" -> "hoy" / "ayer" / "1 nov"
const formatDay = (iso) => {
    if (!iso) return "hoy";
    const [y, m, d] = iso.split("-").map(Number);
    const day = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - day) / 864e5);
    if (diff === 0) return "hoy";
    if (diff === 1) return "ayer";
    return day.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
};

const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => matchMedia(query).matches);
    useEffect(() => {
        const mql = matchMedia(query);
        const onChange = () => setMatches(mql.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, [query]);
    return matches;
};

// The area left visible by the on-screen keyboard. iOS Safari keeps 100dvh at full height
// when the keyboard opens and pans the page instead, which pushes the sheet out of view.
const useVisualViewport = (active) => {
    const [box, setBox] = useState(null);
    useEffect(() => {
        const vv = window.visualViewport;
        if (!active || !vv) return;
        const update = () => setBox({ top: vv.offsetTop, height: vv.height });
        update();
        vv.addEventListener("resize", update);
        vv.addEventListener("scroll", update);
        return () => {
            vv.removeEventListener("resize", update);
            vv.removeEventListener("scroll", update);
            setBox(null);
        };
    }, [active]);
    return box;
};

// iMessage-style "typing" bubble
const TypingDots = () => (
    <div className="bg-tile-strong rounded-[20px] rounded-bl-md px-4 py-3.5 flex items-center gap-1" role="status" aria-label="Wally está escribiendo">
        {[0, 1, 2].map((i) => (
            <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-ink-2"
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            />
        ))}
    </div>
);

export const WallyBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hola, soy Wally. Mandame un audio o escribime qué gastaste o cobraste y lo anoto.", isBot: true, local: true }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const { isRecording, startRecording, stopRecording, convertBlobToBase64, audioBlob, setAudioBlob } = useVoiceRecorder();

    // Other screens can open the chat (e.g. "Registrar movimiento" on the dashboard)
    useEffect(() => {
        const open = () => setIsOpen(true);
        window.addEventListener(OPEN_WALLY_EVENT, open);
        return () => window.removeEventListener(OPEN_WALLY_EVENT, open);
    }, []);

    // On phones the chat is a full-screen sheet. Opening the keyboard by itself would hide
    // half of it, so only focus right away where there's a mouse.
    const isPhone = useMediaQuery("(max-width: 639px)");
    const viewport = useVisualViewport(isOpen && isPhone);

    useEffect(() => {
        if (isOpen && matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
    }, [isOpen]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Handle audio sending when recording stops
    useEffect(() => {
        if (!isRecording && audioBlob) {
            handleSendAudio();
        }
    }, [isRecording, audioBlob]);

    // What the AI sees of the conversation: the greeting and failed sends aren't real turns
    const historyFor = (list) => list
        .filter((m) => !m.local && m.status !== "error")
        .map((m) => ({ role: m.isBot ? "model" : "user", text: m.text }));

    const addBotReply = (response) => setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: response.text,
        isBot: true,
        status: response.status,
        saved: response.saved,
    }]);

    const addError = (text) => setMessages((prev) => [...prev, { id: Date.now() + 1, text, isBot: true, status: "error", local: true }]);

    const handleSendText = async () => {
        const text = inputValue.trim();
        if (!text || isLoading) return;

        const history = historyFor(messages);
        setMessages((prev) => [...prev, { id: Date.now(), text, isBot: false }]);
        setInputValue("");
        setIsLoading(true);
        try {
            addBotReply(await processChatMessage({ text }, history));
        } catch (error) {
            console.error("Chat Error:", error);
            addError("No se pudo enviar el mensaje. Revisá tu conexión y probá de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendAudio = async () => {
        if (!audioBlob || isLoading) return;

        const id = Date.now();
        const history = historyFor(messages);
        // Shown as "Mensaje de voz" until the workflow sends back what it heard
        setMessages((prev) => [...prev, { id, text: "Mensaje de voz", isBot: false, isAudio: true, local: true }]);
        setIsLoading(true);
        try {
            const base64 = await convertBlobToBase64(audioBlob);
            const response = await processChatMessage({ audio: { base64, mimeType: audioBlob.type } }, history);
            if (response.transcript) {
                setMessages((prev) => prev.map((m) => m.id === id ? { ...m, text: response.transcript, local: false } : m));
            }
            addBotReply(response);
        } catch (error) {
            console.error("Audio Chat Error:", error);
            addError("No se pudo procesar el audio. Probá de nuevo.");
        } finally {
            setIsLoading(false);
            setAudioBlob(null);
        }
    };

    const handleUndo = async (msg) => {
        const { error } = await undoTransaction(msg.saved.id);
        if (error) {
            addError("No lo pude deshacer. Borralo desde Movimientos.");
            return;
        }
        setMessages((prev) => [
            ...prev.map((m) => m.id === msg.id ? { ...m, undone: true } : m),
            { id: Date.now(), text: "Listo, lo saqué.", isBot: true },
        ]);
    };

    const clearChat = () => {
        setMessages([{ id: 1, text: "Empezamos de nuevo. ¿Qué querés registrar?", isBot: true, local: true }]);
    };

    return (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                        style={isPhone
                            ? { transformOrigin: 'bottom center', top: viewport?.top ?? 0, height: viewport?.height ?? '100dvh' }
                            : { transformOrigin: 'bottom right' }}
                        className={cn(
                            "glass-panel flex flex-col overflow-hidden",
                            isPhone
                                ? "fixed inset-x-0 z-[60] rounded-none border-0"
                                : "w-[380px] h-[min(560px,calc(100dvh-7rem))] rounded-[2rem] mb-3"
                        )}
                        role="dialog"
                        aria-label="Chat con Wally"
                    >
                        <div className={cn("flex items-center justify-between px-5 pt-4 pb-3 border-b border-hairline", isPhone && "pt-[calc(1rem+env(safe-area-inset-top))]")}>
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-full bg-ink text-background flex items-center justify-center font-semibold">W</span>
                                <div>
                                    <p className="text-[15px] font-semibold leading-tight">Wally</p>
                                    <p className="text-xs text-ink-2">{isLoading ? 'Escribiendo…' : 'Anota tus gastos e ingresos'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={clearChat}
                                    className="p-2 rounded-full text-ink-2 hover:text-ink hover:bg-tile transition-colors"
                                    aria-label="Empezar de nuevo"
                                    title="Empezar de nuevo"
                                >
                                    <RotateCcw size={17} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-full text-ink-2 hover:text-ink hover:bg-tile transition-colors"
                                    aria-label="Cerrar chat"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-2 scroll-smooth"
                            aria-live="polite"
                        >
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    // Bubbles grow out of their own corner, like iMessage
                                    initial={{ opacity: 0, y: 10, scale: 0.92 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={softSpring}
                                    style={{ transformOrigin: msg.isBot ? "bottom left" : "bottom right" }}
                                    className={cn("flex w-full", msg.isBot ? "justify-start" : "justify-end")}
                                >
                                    <div className={cn(
                                        "max-w-[82%] px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap",
                                        msg.isBot
                                            ? "bg-tile-strong text-ink rounded-[20px] rounded-bl-md"
                                            : "bg-[#0a84ff] text-white rounded-[20px] rounded-br-md",
                                        msg.status === "error" && "text-gasto"
                                    )}>
                                        {msg.isAudio && <Mic size={14} className="inline mr-1.5 -mt-0.5" />}
                                        {msg.text}
                                        {msg.saved && (
                                            <span className="mt-2 flex items-center justify-between gap-3 border-t border-hairline pt-2 text-[13px] text-ink-2">
                                                <span className="truncate">
                                                    {msg.saved.observacion || `${capitalize(msg.saved.categoria)} · ${formatDay(msg.saved.fecha)}`}
                                                </span>
                                                {msg.undone ? (
                                                    <span className="shrink-0">Deshecho</span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUndo(msg)}
                                                        className="shrink-0 font-semibold text-[#0a84ff] hover:opacity-80"
                                                    >
                                                        Deshacer
                                                    </button>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            <AnimatePresence>
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={softSpring}
                                        style={{ transformOrigin: "bottom left" }}
                                        className="flex justify-start"
                                    >
                                        <TypingDots />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className={cn("p-3 border-t border-hairline", isPhone && "pb-[calc(0.75rem+env(safe-area-inset-bottom))]")}>
                            <div className="flex items-center gap-1.5 rounded-full bg-tile border border-hairline pl-4 pr-1.5 h-12 focus-within:border-ring transition-colors">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Gasté 4500 en el súper…"
                                    aria-label="Mensaje para Wally"
                                    className="flex-1 min-w-0 bg-transparent outline-none text-base sm:text-[15px] text-ink placeholder:text-ink-3"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                                />
                                {/* Mic turns into the send arrow as soon as there's text, like iMessage */}
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {inputValue.trim() ? (
                                        <motion.button
                                            key="send"
                                            type="button"
                                            initial={{ scale: 0.4, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.4, opacity: 0 }}
                                            transition={sidebarSpring}
                                            whileTap={{ scale: 0.88 }}
                                            onClick={() => handleSendText()}
                                            disabled={isLoading}
                                            className="w-9 h-9 rounded-full bg-[#0a84ff] text-white flex items-center justify-center disabled:opacity-50"
                                            aria-label="Enviar"
                                        >
                                            <ArrowUp size={18} strokeWidth={2.5} />
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            key="mic"
                                            type="button"
                                            initial={{ scale: 0.4, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.4, opacity: 0 }}
                                            transition={sidebarSpring}
                                            whileTap={{ scale: 0.88 }}
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className={cn(
                                                "relative w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                                                isRecording ? "bg-gasto text-white" : "text-ink-2 hover:text-ink hover:bg-tile"
                                            )}
                                            aria-label={isRecording ? "Detener grabación" : "Grabar audio"}
                                        >
                                            {isRecording && (
                                                <motion.span
                                                    className="absolute inset-0 rounded-full bg-gasto"
                                                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <span className="relative">
                                                {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={18} />}
                                            </span>
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* On phones the open sheet covers the screen and has its own close button */}
            <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                hidden={isOpen && isPhone}
                onClick={() => setIsOpen(!isOpen)}
                className="glass-panel w-14 h-14 rounded-full flex items-center justify-center text-ink"
                aria-label={isOpen ? "Cerrar chat" : "Abrir chat con Wally"}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={isOpen ? "close" : "open"}
                        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                        animate={{ rotate: 0, scale: 1, opacity: 1 }}
                        exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex"
                    >
                        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
                    </motion.span>
                </AnimatePresence>
            </motion.button>
        </div>
    );
};
