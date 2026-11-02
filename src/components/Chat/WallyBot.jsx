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
import { processChatMessage } from '../../services/aiService';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { OPEN_WALLY_EVENT } from './wallyEvents';
import { cn } from '../../lib/utils';
import { sidebarSpring, softSpring } from '../../lib/motion';

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
        { id: 1, text: "Hola, soy Wally. Contame qué gastaste o cobraste y lo anoto por vos.", isBot: true }
    ]);
    const [chatHistory, setChatHistory] = useState([]); // Real AI history
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

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
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

    const handleSendText = async (overrideText) => {
        // Ensure we only use overrideText if it's a string (not an Event object)
        const textToSend = (typeof overrideText === 'string') ? overrideText : inputValue;

        if (!textToSend || !textToSend.trim() || isLoading) return;

        try {
            const userMsg = { id: Date.now(), text: textToSend, isBot: false };
            setMessages(prev => [...prev, userMsg]);
            setInputValue("");
            setIsLoading(true);

            const response = await processChatMessage(textToSend, chatHistory);

            const botMsg = { id: Date.now() + 1, text: response.text, isBot: true, status: response.status };
            setMessages(prev => [...prev, botMsg]);
            if (response.newHistory) setChatHistory(response.newHistory);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: "No se pudo enviar el mensaje. Revisá tu conexión y probá de nuevo.",
                isBot: true,
                status: "error"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendAudio = async () => {
        if (!audioBlob || isLoading) return;

        try {
            setIsLoading(true);
            const base64 = await convertBlobToBase64(audioBlob);

            const userMsg = { id: Date.now(), text: "Mensaje de voz", isBot: false, isAudio: true };
            setMessages(prev => [...prev, userMsg]);

            const response = await processChatMessage(
                { base64, mimeType: audioBlob.type },
                chatHistory,
                true
            );

            const botMsg = { id: Date.now() + 1, text: response.text, isBot: true, status: response.status };
            setMessages(prev => [...prev, botMsg]);
            if (response.newHistory) setChatHistory(response.newHistory);
        } catch (error) {
            console.error("Audio Chat Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: "No se pudo procesar el audio. Revisá que el micrófono tenga permiso y probá de nuevo.",
                isBot: true,
                status: "error"
            }]);
        } finally {
            setIsLoading(false);
            setAudioBlob(null);
        }
    };

    const clearChat = () => {
        setMessages([{ id: 1, text: "Empezamos de nuevo. ¿Qué querés registrar?", isBot: true }]);
        setChatHistory([]);
    };

    // Quick Action Buttons Logic
    const lastBotMessage = messages[messages.length - 1];
    const showConfirmationButtons = lastBotMessage?.isBot && lastBotMessage.text.includes("¿Deseas subir esta información?");

    return (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                        style={{ transformOrigin: 'bottom right' }}
                        className="glass-panel w-[calc(100vw-2rem)] sm:w-[380px] h-[min(560px,calc(100dvh-7rem))] rounded-[2rem] flex flex-col overflow-hidden mb-3"
                        role="dialog"
                        aria-label="Chat con Wally"
                    >
                        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-hairline">
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
                            className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scroll-smooth"
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
                                    </div>
                                </motion.div>
                            ))}

                            {showConfirmationButtons && !isLoading && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {[
                                        { label: "Sí, guardar", reply: "si", className: "pill-button" },
                                        { label: "Editar", reply: "editar", className: "pill-ghost" },
                                        { label: "Cancelar", reply: "no", className: "pill-ghost" }
                                    ].map((action, i) => (
                                        <motion.button
                                            key={action.reply}
                                            type="button"
                                            initial={{ opacity: 0, scale: 0.85 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ ...softSpring, delay: 0.15 + i * 0.05 }}
                                            onClick={() => handleSendText(action.reply)}
                                            className={cn(action.className, "h-9 text-[13px]")}
                                        >
                                            {action.label}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

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

                        <div className="p-3 border-t border-hairline">
                            <div className="flex items-center gap-1.5 rounded-full bg-tile border border-hairline pl-4 pr-1.5 h-12 focus-within:border-ring transition-colors">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Gasté 4500 en el súper…"
                                    aria-label="Mensaje para Wally"
                                    className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-ink placeholder:text-ink-3"
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

            <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
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
