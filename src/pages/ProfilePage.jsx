import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, LogOut, Send } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/skeleton';
import { AnimatedNumber } from '../components/ui/animated-number';
import { sidebarSpring } from '../lib/motion';

const capitalize = (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
const formatCount = (value) => Math.round(value).toLocaleString('es-AR');

// Button that briefly turns into "Guardado" after a successful save
const SaveButton = ({ saving, saved, disabled }) => (
    <button type="submit" disabled={disabled || saving} className="pill-button min-w-[120px] disabled:opacity-40">
        <AnimatePresence mode="wait" initial={false}>
            <motion.span
                key={saved ? 'saved' : saving ? 'saving' : 'idle'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-1.5"
            >
                {saved ? <><Check size={16} /> Guardado</> : saving ? 'Guardando…' : 'Guardar'}
            </motion.span>
        </AnimatePresence>
    </button>
);

const useSaveState = () => {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const run = async (action) => {
        setSaving(true);
        setError('');
        try {
            await action();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Error saving profile:', err);
            setError('No se pudo guardar. Revisá tu conexión y probá de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return { saving, saved, error, run };
};

const ProfilePage = () => {
    const { user, userData, updateProfile, logout } = useAuth();
    const [name, setName] = useState(userData?.display_name || '');
    const [telegramToken, setTelegramToken] = useState(userData?.telegram_token || '');
    const [copied, setCopied] = useState(false);
    const [activity, setActivity] = useState(null);
    const [now] = useState(() => Date.now());
    const nameSave = useSaveState();
    const telegramSave = useSaveState();

    useEffect(() => {
        if (!user) return;
        supabase
            .from('transactions')
            .select('categoria, tipo')
            .eq('user_id', user.id)
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error loading activity:', error);
                    setActivity({ count: 0, topCategory: null });
                    return;
                }
                const counts = {};
                data.filter((tx) => tx.tipo === 'gasto').forEach((tx) => {
                    counts[tx.categoria] = (counts[tx.categoria] || 0) + 1;
                });
                const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
                setActivity({ count: data.length, topCategory });
            });
    }, [user]);

    const displayName = userData?.display_name || user?.user_metadata?.full_name || 'Usuario';
    const avatar = userData?.photo_url || `https://ui-avatars.com/api/?background=random&size=160&name=${encodeURIComponent(displayName)}`;
    const memberSince = userData?.created_at ? new Date(userData.created_at) : null;
    const daysWithWally = memberSince
        ? Math.max(1, Math.ceil((now - memberSince.getTime()) / 86400000))
        : 0;

    const copyId = () => {
        navigator.clipboard.writeText(user.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="max-w-[720px] mx-auto flex flex-col gap-6">
            <header className="flex flex-col items-center text-center gap-3 pt-2">
                <motion.img
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={sidebarSpring}
                    src={avatar}
                    alt=""
                    className="w-24 h-24 rounded-full object-cover border-4 border-[var(--tile-edge)] shadow-[0_20px_40px_-16px_rgba(0,0,0,0.45)]"
                />
                <div>
                    <h1 className="text-[28px] md:text-[32px] leading-tight font-bold tracking-[-0.02em]">{displayName}</h1>
                    <p className="text-[15px] text-ink-2">{user?.email}</p>
                </div>
            </header>

            <section className="grid grid-cols-3 gap-3" aria-label="Tu actividad">
                {activity === null ? (
                    [0, 1, 2].map((i) => (
                        <div key={i} className="glass-card px-4 py-4 flex flex-col items-center gap-2">
                            <Skeleton className="h-7 w-12" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    ))
                ) : (
                    <>
                        <div className="glass-card px-4 py-4 text-center">
                            <p className="text-[26px] font-semibold tabular-nums leading-tight">
                                <AnimatedNumber value={activity.count} format={formatCount} />
                            </p>
                            <p className="text-[13px] text-ink-2">movimientos</p>
                        </div>
                        <div className="glass-card px-4 py-4 text-center">
                            <p className="text-[26px] font-semibold leading-tight truncate">
                                {activity.topCategory ? capitalize(activity.topCategory) : '—'}
                            </p>
                            <p className="text-[13px] text-ink-2">categoría más usada</p>
                        </div>
                        <div className="glass-card px-4 py-4 text-center">
                            <p className="text-[26px] font-semibold tabular-nums leading-tight">
                                <AnimatedNumber value={daysWithWally} format={formatCount} />
                            </p>
                            <p className="text-[13px] text-ink-2">{daysWithWally === 1 ? 'día' : 'días'} con Wally</p>
                        </div>
                    </>
                )}
            </section>

            <form
                className="glass-card p-5 md:p-6 flex flex-col gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    nameSave.run(() => updateProfile({ display_name: name.trim() }));
                }}
            >
                <h2 className="text-[17px] font-semibold">Tus datos</h2>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] text-ink-2 px-1">Nombre</span>
                    <input
                        className="glass-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Cómo querés que te salude Wally"
                        autoComplete="name"
                    />
                </label>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] text-ink-2 px-1">Email</span>
                    <p className="glass-input flex items-center text-ink-2">{user?.email}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] text-gasto">{nameSave.error}</p>
                    <SaveButton
                        saving={nameSave.saving}
                        saved={nameSave.saved}
                        disabled={!name.trim() || name.trim() === (userData?.display_name || '')}
                    />
                </div>
            </form>

            <form
                className="glass-card p-5 md:p-6 flex flex-col gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    telegramSave.run(() => updateProfile({ telegram_token: telegramToken.trim() || null }));
                }}
            >
                <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-[#2aabee] text-white flex items-center justify-center shrink-0">
                        <Send size={18} />
                    </span>
                    <div>
                        <h2 className="text-[17px] font-semibold leading-tight">Avisos por Telegram</h2>
                        <p className="text-[13px] text-ink-2">Para que n8n te mande notificaciones a tu bot.</p>
                    </div>
                </div>
                <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] text-ink-2 px-1">
                        Token del bot (lo conseguís con <a href="https://t.me/botfather" target="_blank" rel="noreferrer" className="text-ink underline">@BotFather</a>)
                    </span>
                    <input
                        type="password"
                        className="glass-input"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        placeholder="123456789:ABCdef…"
                        autoComplete="off"
                    />
                </label>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] text-ink-2 px-1">Tu ID de usuario, para configurar los flujos de n8n</span>
                    <div className="flex gap-2">
                        <p className="glass-input flex items-center font-mono text-[13px] text-ink-2 truncate">{user?.id}</p>
                        <button
                            type="button"
                            onClick={copyId}
                            className="pill-ghost h-12 w-12 px-0 shrink-0"
                            aria-label={copied ? 'ID copiado' : 'Copiar ID'}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.span
                                    key={copied ? 'ok' : 'copy'}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex"
                                >
                                    {copied ? <Check size={18} className="text-ingreso" /> : <Copy size={18} />}
                                </motion.span>
                            </AnimatePresence>
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] text-gasto">{telegramSave.error}</p>
                    <SaveButton
                        saving={telegramSave.saving}
                        saved={telegramSave.saved}
                        disabled={telegramToken.trim() === (userData?.telegram_token || '')}
                    />
                </div>
            </form>

            <div className="flex flex-col items-center gap-2 pb-4">
                <button type="button" onClick={logout} className="pill-ghost text-gasto">
                    <LogOut size={16} /> Cerrar sesión
                </button>
                {memberSince && (
                    <p className="text-xs text-ink-3">
                        Usás Wally desde el {memberSince.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
