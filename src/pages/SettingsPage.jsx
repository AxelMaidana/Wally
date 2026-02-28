import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import {
    User,
    Key,
    Send,
    Copy,
    Check,
    Save,
    ShieldCheck,
    Info
} from 'lucide-react';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

const SettingsPage = () => {
    const { user, userData } = useAuth();
    const [telegramToken, setTelegramToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Listen for changes in user data specifically for the telegramToken
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.telegramToken) {
                    setTelegramToken(data.telegramToken);
                }
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                telegramToken: telegramToken,
                updatedAt: new Date()
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Error al guardar la configuración.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(user.uid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="flex flex-col gap-10 max-w-4xl mx-auto w-full px-4 md:px-0"
        >
            {/* Header */}
            <motion.div variants={item}>
                <h2 className="text-5xl font-extrabold tracking-tighter text-white">Configuración</h2>
                <p className="text-zinc-400 mt-2 text-lg">Gestiona tu identidad y conexiones externas.</p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8">
                {/* Profile/Identity Section */}
                <motion.div variants={item} className="glass-card rounded-[2.5rem] p-8 overflow-hidden relative">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                            <User size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Identidad de Usuario</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Email</label>
                            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-300 font-medium">
                                {user?.email}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Firebase User ID (UID)</label>
                            <div className="flex gap-2">
                                <div className="flex-1 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-400 font-mono text-sm overflow-hidden truncate">
                                    {user?.uid}
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl transition-colors shrink-0"
                                    title="Copiar UID"
                                >
                                    {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1.5">
                                <Info size={12} /> Este ID es necesario para configurar tus flujos en n8n.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Telegram Integration Section */}
                <motion.div variants={item} className="glass-card rounded-[2.5rem] p-8 relative">
                    <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-sky-500/10 blur-3xl rounded-full" />

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
                            <Send size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Integración con Telegram</h3>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Telegram Bot Token</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                                    <Key size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={telegramToken}
                                    onChange={(e) => setTelegramToken(e.target.value)}
                                    placeholder="123456789:ABCDefGhIJKlmNoPQRstuVWxYz..."
                                    className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-700 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                />
                            </div>
                            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                                Ingresa el token de tu bot de Telegram obtenido vía <a href="https://t.me/botfather" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">@BotFather</a>. Este token se usará para que n8n pueda enviarte notificaciones directamente.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${saved
                                    ? 'bg-green-600 text-white shadow-green-500/20'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : saved ? (
                                    <>
                                        <Check size={20} />
                                        <span>¡Guardado con éxito!</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        <span>Guardar Configuración</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Security Warning */}
                <motion.div variants={item} className="flex items-start gap-4 p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl mt-1">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">Privacidad y Seguridad</h4>
                        <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                            Tus tokens se guardan de forma encriptada en nuestra base de datos segura de Firebase Firestore. Nunca compartas tu Bot Token con nadie.
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default SettingsPage;
