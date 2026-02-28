import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    MessageSquare,
    X,
    Send,
    Mic,
    MicOff,
    Bot,
    User,
    Loader2,
    Sparkles,
    Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { processChatMessage } from '../../services/aiService';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { cn } from '../../lib/utils';

export const WallyBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "¡Hola! Soy WallyBot. Puedo ayudarte a registrar tus gastos e ingresos. ¿En qué puedo ayudarte hoy?", isBot: true }
    ]);
    const [chatHistory, setChatHistory] = useState([]); // Real AI history
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);
    const { user } = useAuth();
    const { isRecording, startRecording, stopRecording, convertBlobToBase64, audioBlob, setAudioBlob } = useVoiceRecorder();

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

            const response = await processChatMessage(textToSend, user?.uid, chatHistory);

            const botMsg = { id: Date.now() + 1, text: response.text, isBot: true, status: response.status };
            setMessages(prev => [...prev, botMsg]);
            if (response.newHistory) setChatHistory(response.newHistory);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: "❌ Hubo un error al procesar el mensaje. Por favor intenta de nuevo.",
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

            const userMsg = { id: Date.now(), text: "🎤 Mensaje de voz enviado...", isBot: false };
            setMessages(prev => [...prev, userMsg]);

            const response = await processChatMessage(
                { base64, mimeType: audioBlob.type },
                user?.uid,
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
                text: "❌ Error al procesar el audio. Asegúrate de que el micrófono funciona.",
                isBot: true,
                status: "error"
            }]);
        } finally {
            setIsLoading(false);
            setAudioBlob(null);
        }
    };

    const clearChat = () => {
        setMessages([{ id: 1, text: "Chat reiniciado. ¿En qué más puedo ayudarte?", isBot: true }]);
        setChatHistory([]);
    };

    // Quick Action Buttons Logic
    const lastBotMessage = messages[messages.length - 1];
    const showConfirmationButtons = lastBotMessage?.isBot && lastBotMessage.text.includes("¿Deseas subir esta información?");

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="w-[350px] md:w-[400px] h-[550px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-primary/5 flex justify-between items-center group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                    <Bot size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                        WallyBot
                                        <Sparkles size={14} className="text-primary animate-pulse" />
                                    </h3>
                                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        En línea
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={clearChat}
                                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                    title="Limpiar chat"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-zinc-50/30 dark:bg-zinc-900/10"
                        >
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: msg.isBot ? -10 : 10, y: 5 }}
                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                    className={cn(
                                        "flex w-full items-end gap-2",
                                        msg.isBot ? "justify-start" : "justify-end"
                                    )}
                                >
                                    {msg.isBot && (
                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
                                            <Bot size={16} />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap",
                                        msg.isBot
                                            ? "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                                            : "bg-primary text-white font-medium"
                                    )}>
                                        {msg.text}
                                    </div>
                                    {!msg.isBot && (
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <User size={16} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Quick Confirmation Buttons */}
                            {showConfirmationButtons && !isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-wrap gap-2 ml-10 mt-2"
                                >
                                    <button
                                        onClick={() => handleSendText("si")}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center gap-1.5"
                                    >
                                        <Bot size={14} /> Si, subir
                                    </button>
                                    <button
                                        onClick={() => handleSendText("no")}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all"
                                    >
                                        No, cancelar
                                    </button>
                                    <button
                                        onClick={() => handleSendText("editar")}
                                        className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all"
                                    >
                                        Editar datos
                                    </button>
                                </motion.div>
                            )}

                            {isLoading && (
                                <div className="flex justify-start items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
                                        <Bot size={16} />
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3 shadow-sm">
                                        <Loader2 size={16} className="animate-spin text-primary" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 pl-4 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                                <input
                                    type="text"
                                    placeholder="Dime un gasto o ingreso..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                                />
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={cn(
                                            "p-2.5 rounded-xl transition-all",
                                            isRecording
                                                ? "bg-red-500 text-white animate-pulse"
                                                : "text-zinc-400 hover:text-primary hover:bg-primary/10"
                                        )}
                                        title={isRecording ? "Detener grabación" : "Grabar audio"}
                                    >
                                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                                    </button>
                                    <button
                                        onClick={() => handleSendText()}
                                        disabled={!inputValue.trim() || isLoading}
                                        className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-[9px] text-center text-zinc-400 mt-2 font-medium uppercase tracking-widest italic">
                                Desarrollado con Gemini 1.5 Flash
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-all duration-300 relative",
                    isOpen
                        ? "bg-zinc-900 dark:bg-zinc-800"
                        : "bg-primary hover:bg-primary-dark shadow-primary/30"
                )}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}

                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                )}
            </motion.button>
        </div>
    );
};
