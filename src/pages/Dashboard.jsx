import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { supabase } from '../services/supabase';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { openWallyBot } from '../components/Chat/wallyEvents';
import { Skeleton } from '../components/ui/skeleton';
import { AnimatedNumber } from '../components/ui/animated-number';
import { sidebarSpring, softSpring, iosEase } from '../lib/motion';
import {
    TrendingUp,
    TrendingDown,
    Plus,
    MessageCircle,
    Coffee,
    ShoppingCart,
    Car,
    Home,
    HeartPulse,
    Ticket,
    Zap,
    Briefcase,
    Shirt,
    Circle
} from 'lucide-react';

const DAYS_IN_CHART = 14;

const categoryIcons = {
    comida: Coffee,
    cafe: Coffee,
    café: Coffee,
    restaurante: Coffee,
    supermercado: ShoppingCart,
    compras: ShoppingCart,
    transporte: Car,
    nafta: Car,
    alquiler: Home,
    hogar: Home,
    salud: HeartPulse,
    ocio: Ticket,
    entretenimiento: Ticket,
    servicios: Zap,
    sueldo: Briefcase,
    trabajo: Briefcase,
    ropa: Shirt,
};

// Ring colors for the category breakdown, from most to least spent
const ringColors = ['#f5b26b', '#8fa6c8', '#e8a0a0', '#b8c99a', 'rgba(255,255,255,0.35)'];

const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatPercent = (value) => `${Math.round(value)}%`;

const capitalize = (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

const CategoryIcon = ({ categoria, className }) => {
    const Icon = categoryIcons[categoria?.toLowerCase()] || Circle;
    return <Icon className={className} strokeWidth={1.75} />;
};

const Trend = ({ value, inverse = false, suffix }) => {
    if (value === null) return <span className="text-ink-3">{suffix}</span>;
    const up = value >= 0;
    const good = inverse ? !up : up;
    const Icon = up ? TrendingUp : TrendingDown;
    return (
        <span className={`inline-flex items-center gap-1 font-medium ${good ? 'text-ingreso' : 'text-gasto'}`}>
            <Icon size={14} strokeWidth={2} />
            {Math.abs(value)}% <span className="text-ink-3 font-normal">{suffix}</span>
        </span>
    );
};

const StatTile = ({ label, value, footer, loading }) => (
    <div className="glass-card p-5 flex flex-col gap-1">
        <p className="text-sm text-ink-2">{label}</p>
        {loading ? (
            <>
                <Skeleton className="h-8 my-[3px] w-3/4" />
                <Skeleton className="h-3 w-1/2 mt-2.5" />
            </>
        ) : (
            <>
                <p className="text-[32px] leading-tight font-semibold tracking-tight text-ink tabular-nums">
                    <AnimatedNumber value={value} format={formatCurrency} />
                </p>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                    className="text-[13px] mt-1"
                >
                    {footer}
                </motion.p>
            </>
        )}
    </div>
);

// Placeholder bar heights so the loading chart looks like a chart, not a flat line
const skeletonBars = [55, 30, 70, 45, 85, 25, 60, 40, 75, 35, 50, 65, 30, 45];

// Capsule bars, like the iOS Screen Time and Health widgets
const SpendingBars = ({ days, loading }) => {
    const [hovered, setHovered] = useState(null);
    const max = Math.max(...days.map(d => d.total), 1);
    const total = days.reduce((sum, d) => sum + d.total, 0);
    const average = total / days.length;

    return (
        <div className="glass-card p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-6">
                <div>
                    <p className="text-sm text-ink-2">Gastos de los últimos {DAYS_IN_CHART} días</p>
                    {loading
                        ? <Skeleton className="h-8 my-[3px] w-40" />
                        : (
                            <p className="text-[32px] leading-tight font-semibold tracking-tight tabular-nums">
                                <AnimatedNumber value={total} format={formatCurrency} />
                            </p>
                        )}
                </div>
                {loading
                    ? <Skeleton className="h-3 w-32 mb-1" />
                    : (
                        <p className="text-[13px] text-ink-2 tabular-nums">
                            Promedio diario <AnimatedNumber value={average} format={formatCurrency} />
                        </p>
                    )}
            </div>

            <div className="relative h-44">
                {loading ? (
                    <div className="flex items-end justify-between gap-1.5 md:gap-2.5 h-full">
                        {skeletonBars.slice(0, DAYS_IN_CHART).map((height, i) => (
                            <div key={i} className="flex-1 h-full flex items-end justify-center">
                                <Skeleton className="w-full max-w-7" style={{ height: `${height}%` }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <motion.div
                            className="absolute inset-x-0 border-t border-dashed border-hairline"
                            initial={{ bottom: '0%', opacity: 0 }}
                            animate={{ bottom: `${(average / max) * 100}%`, opacity: 1 }}
                            transition={{ ...softSpring, delay: 0.3 }}
                            aria-hidden="true"
                        />
                        <LayoutGroup id="spending-bars">
                            <ol
                                className="relative flex items-end justify-between gap-1.5 md:gap-2.5 h-full"
                                onMouseLeave={() => setHovered(null)}
                            >
                                {days.map((day, i) => {
                                    const height = day.total > 0 ? Math.max((day.total / max) * 100, 6) : 4;
                                    return (
                                        <li
                                            key={day.key}
                                            className="relative flex-1 h-full flex flex-col justify-end items-center"
                                            onMouseEnter={() => setHovered(i)}
                                        >
                                            <span className="sr-only">{day.longLabel}: {formatCurrency(day.total)}</span>
                                            <AnimatePresence>
                                                {hovered === i && (
                                                    <motion.span
                                                        layoutId="bar-tip"
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                        transition={sidebarSpring}
                                                        className="glass-panel absolute z-10 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums pointer-events-none"
                                                        style={{ bottom: `calc(${height}% + 8px)` }}
                                                        aria-hidden="true"
                                                    >
                                                        {formatCurrency(day.total)}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                            <motion.div
                                                initial={{ height: '0%' }}
                                                animate={{ height: `${height}%` }}
                                                transition={{ ...softSpring, delay: i * 0.03 }}
                                                className={`w-full max-w-7 rounded-full transition-colors ${day.isToday
                                                    ? 'bg-ink shadow-[0_8px_24px_-6px_rgba(255,255,255,0.35)]'
                                                    : hovered === i ? 'bg-ink/40 border border-hairline' : 'bg-tile-strong border border-hairline'
                                                    }`}
                                            />
                                        </li>
                                    );
                                })}
                            </ol>
                        </LayoutGroup>
                    </>
                )}
            </div>
            <ol className="flex justify-between gap-1.5 md:gap-2.5 mt-3" aria-hidden="true">
                {days.map((day, i) => (
                    <li
                        key={day.key}
                        className={`flex-1 text-center text-[11px] transition-colors ${day.isToday || hovered === i ? 'text-ink font-semibold' : 'text-ink-3'}`}
                    >
                        {day.shortLabel}
                    </li>
                ))}
            </ol>
        </div>
    );
};

const CategoryRing = ({ categories, total, loading }) => {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const segments = categories.map((cat, i) => ({
        ...cat,
        length: (cat.total / total) * circumference,
        offset: categories.slice(0, i).reduce((sum, c) => sum + (c.total / total) * circumference, 0)
    }));

    return (
        <div className="glass-card p-5 md:p-6 flex flex-col">
            <p className="text-[17px] font-semibold mb-5">En qué gastás</p>
            {loading ? (
                <div className="flex flex-col items-center gap-5">
                    <div className="skeleton w-32 h-32 rounded-full flex items-center justify-center" aria-hidden="true">
                        <span className="w-[100px] h-[100px] rounded-full bg-[var(--panel)]" />
                    </div>
                    <div className="w-full space-y-3.5 py-0.5">
                        {[70, 55, 40].map((width) => (
                            <div key={width} className="flex items-center gap-2.5">
                                <Skeleton className="w-2.5 h-2.5" />
                                <Skeleton className="h-3" style={{ width: `${width}%` }} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : categories.length === 0 ? (
                <p className="text-sm text-ink-2">Cuando registres gastos este mes, vas a ver acá en qué categorías se va tu plata.</p>
            ) : (
                <div className="flex flex-col items-center gap-5">
                    <svg viewBox="0 0 128 128" className="w-32 h-32 shrink-0 -rotate-90" aria-hidden="true">
                        <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--hairline)" strokeWidth="12" />
                        {segments.map((seg, i) => (
                            <motion.circle
                                key={seg.name}
                                cx="64" cy="64" r={radius}
                                fill="none"
                                stroke={ringColors[i]}
                                strokeWidth="12"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: `0 ${circumference}`, strokeDashoffset: -seg.offset }}
                                animate={{
                                    strokeDasharray: `${Math.max(seg.length - 4, 1)} ${circumference}`,
                                    strokeDashoffset: -seg.offset
                                }}
                                transition={{ duration: 0.8, ease: iosEase, delay: 0.15 + i * 0.1 }}
                            />
                        ))}
                    </svg>
                    <ul className="w-full space-y-2.5">
                        {categories.map((cat, i) => (
                            <li key={cat.name} className="flex items-center gap-2.5 text-sm">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ringColors[i] }} />
                                <span className="truncate flex-1">{capitalize(cat.name)}</span>
                                <AnimatedNumber
                                    value={(cat.total / total) * 100}
                                    format={formatPercent}
                                    className="text-ink-2 tabular-nums"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const RecentActivity = ({ rows, loading }) => {
    const [hovered, setHovered] = useState(null);

    return (
        <div className="glass-card p-2 md:p-3">
            <p className="text-[17px] font-semibold px-3 pt-3 pb-2">Últimos movimientos</p>
            {loading ? (
                <ul aria-hidden="true">
                    {[60, 45, 70, 50].map((width) => (
                        <li key={width} className="flex items-center gap-3 px-3 py-3">
                            <Skeleton className="w-10 h-10 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3.5" style={{ width: `${width}%` }} />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                            <Skeleton className="h-3.5 w-16" />
                        </li>
                    ))}
                </ul>
            ) : rows.length === 0 ? (
                <div className="px-3 py-8 flex flex-col items-start gap-4">
                    <p className="text-sm text-ink-2 max-w-sm">
                        Todavía no registraste nada este mes. Contale a Wally tu primer gasto, por ejemplo "gasté 4500 en el súper".
                    </p>
                    <button type="button" className="pill-button" onClick={openWallyBot}>
                        <MessageCircle size={16} /> Hablar con Wally
                    </button>
                </div>
            ) : (
                <LayoutGroup id="recent-activity">
                    <ul onMouseLeave={() => setHovered(null)}>
                        {/* New movements (e.g. saved from the chat) slide in; the first load doesn't */}
                        <AnimatePresence initial={false}>
                            {rows.map((row) => {
                                const isGasto = row.tipo === 'gasto';
                                return (
                                    <motion.li
                                        key={row.id}
                                        layout
                                        initial={{ opacity: 0, y: -12, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={sidebarSpring}
                                        onMouseEnter={() => setHovered(row.id)}
                                        className="relative flex items-center gap-3 px-3 py-3 rounded-2xl"
                                    >
                                        {hovered === row.id && (
                                            <motion.span
                                                layoutId="activity-hover"
                                                transition={sidebarSpring}
                                                className="absolute inset-0 rounded-2xl bg-tile"
                                            />
                                        )}
                                        <span className="relative w-10 h-10 rounded-full bg-tile-strong flex items-center justify-center shrink-0">
                                            <CategoryIcon categoria={row.categoria} className="w-[18px] h-[18px] text-ink" />
                                        </span>
                                        <div className="relative flex-1 min-w-0">
                                            <p className="text-[15px] font-medium truncate">{row.descripcion || 'Sin descripción'}</p>
                                            <p className="text-[13px] text-ink-2 truncate">
                                                {capitalize(row.categoria)}, {new Date(row.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <p className={`relative text-[15px] font-semibold tabular-nums ${isGasto ? 'text-ink' : 'text-ingreso'}`}>
                                            {isGasto ? '−' : '+'}{formatCurrency(row.monto || 0)}
                                        </p>
                                    </motion.li>
                                );
                            })}
                        </AnimatePresence>
                    </ul>
                </LayoutGroup>
            )}
        </div>
    );
};

const Dashboard = () => {
    const { user, userData } = useAuth();
    const [dbOnline, setDbOnline] = useState(null);

    // Enough history for the chart and the current month
    const since = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const chartStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (DAYS_IN_CHART - 1));
        return chartStart < startOfMonth ? chartStart : startOfMonth;
    }, []);

    const { data: transactions, loading } = useSupabaseQuery('transactions', {
        orderByField: 'created_at',
        conditions: [
            ['user_id', '==', user?.id],
            ['created_at', '>=', since.toISOString()]
        ]
    });

    const stats = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let todayTotal = 0;
        let yesterdayTotal = 0;
        let monthExpenses = 0;
        let monthIncome = 0;
        let monthCount = 0;
        const byCategory = {};
        const monthRows = [];

        transactions.forEach(tx => {
            const date = new Date(tx.created_at);
            const amount = Number(tx.monto) || 0;
            const isGasto = tx.tipo === 'gasto';

            if (isGasto && sameDay(date, today)) todayTotal += amount;
            if (isGasto && sameDay(date, yesterday)) yesterdayTotal += amount;

            if (date >= startOfMonth) {
                monthCount++;
                monthRows.push(tx);
                if (isGasto) {
                    monthExpenses += amount;
                    const key = tx.categoria || 'otros';
                    byCategory[key] = (byCategory[key] || 0) + amount;
                } else {
                    monthIncome += amount;
                }
            }
        });

        const days = Array.from({ length: DAYS_IN_CHART }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (DAYS_IN_CHART - 1 - i));
            const total = transactions
                .filter(tx => tx.tipo === 'gasto' && sameDay(new Date(tx.created_at), date))
                .reduce((sum, tx) => sum + (Number(tx.monto) || 0), 0);
            return {
                key: date.toISOString(),
                total,
                isToday: i === DAYS_IN_CHART - 1,
                shortLabel: date.toLocaleDateString('es-AR', { weekday: 'narrow' }).toUpperCase(),
                longLabel: date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
            };
        });

        // Top four categories, the rest grouped together
        const sorted = Object.entries(byCategory)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total);
        const categories = sorted.length > 5
            ? [...sorted.slice(0, 4), { name: 'el resto', total: sorted.slice(4).reduce((s, c) => s + c.total, 0) }]
            : sorted;

        return {
            todayTotal,
            dailyTrend: yesterdayTotal > 0
                ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)
                : null,
            monthExpenses,
            monthIncome,
            monthCount,
            balance: monthIncome - monthExpenses,
            savingsRate: monthIncome > 0
                ? Math.round(((monthIncome - monthExpenses) / monthIncome) * 100)
                : null,
            days,
            categories,
            recent: monthRows.slice(0, 6)
        };
    }, [transactions]);

    useEffect(() => {
        async function checkDatabase() {
            const { error } = await supabase
                .from('transactions')
                .select('id', { count: 'exact', head: true });
            setDbOnline(!error);
        }
        checkDatabase();
    }, []);

    const firstName = userData?.display_name?.split(' ')[0];
    const now = new Date();
    const monthName = now.toLocaleDateString('es-AR', { month: 'long' });
    const todayLabel = capitalize(now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }));

    return (
        <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[15px] text-ink-2">{todayLabel}</p>
                    <h1 className="text-[34px] md:text-[40px] leading-tight font-bold tracking-[-0.025em]">
                        {firstName ? `Hola, ${firstName}` : 'Hola'}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {dbOnline === false && (
                        <span className="pill-ghost h-9 text-[13px] text-gasto">Sin conexión con la base de datos</span>
                    )}
                    <button type="button" className="pill-button" onClick={openWallyBot}>
                        <Plus size={18} strokeWidth={2.25} />
                        Registrar movimiento
                    </button>
                </div>
            </header>

            {loading && <p className="sr-only" role="status">Cargando tus movimientos…</p>}

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 md:gap-5" aria-busy={loading}>
                <div className="flex flex-col gap-4 md:gap-5 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
                        <StatTile
                            label="Gastaste hoy"
                            value={stats.todayTotal}
                            loading={loading}
                            footer={<Trend value={stats.dailyTrend} inverse suffix="vs. ayer" />}
                        />
                        <StatTile
                            label={`Gastos de ${monthName}`}
                            value={stats.monthExpenses}
                            loading={loading}
                            footer={<span className="text-ink-3">{stats.monthCount} movimientos</span>}
                        />
                        <StatTile
                            label="Ahorro del mes"
                            value={Math.max(stats.balance, 0)}
                            loading={loading}
                            footer={stats.savingsRate === null
                                ? <span className="text-ink-3">Sin ingresos registrados</span>
                                : <span className="text-ink-3">{stats.savingsRate}% de lo que ingresó</span>}
                        />
                    </div>

                    <SpendingBars days={stats.days} loading={loading} />

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 md:gap-5">
                        <RecentActivity rows={stats.recent} loading={loading} />
                        <CategoryRing categories={stats.categories} total={stats.monthExpenses} loading={loading} />
                    </div>
                </div>

                <aside className="flex flex-col sm:flex-row xl:flex-col gap-4 md:gap-5">
                    <div className="glass-tint rounded-[1.75rem] p-6 flex-1 xl:flex-none">
                        <p className="text-sm text-white/75">Balance de {monthName}</p>
                        {loading ? (
                            <div className="mt-2">
                                <Skeleton onTint className="h-10 w-3/4" />
                                <div className="mt-7 space-y-4">
                                    <Skeleton onTint className="h-3.5 w-full" />
                                    <Skeleton onTint className="h-3.5 w-full" />
                                    <Skeleton onTint className="h-2 w-full mt-5" />
                                    <Skeleton onTint className="h-3 w-2/3" />
                                </div>
                            </div>
                        ) : (
                            <>
                            <p className="text-[40px] leading-tight font-bold tracking-[-0.025em] tabular-nums mt-1">
                                <AnimatedNumber value={stats.balance} format={formatCurrency} />
                            </p>
                            <dl className="mt-6 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-white/75">Ingresos</dt>
                                    <dd className="font-semibold tabular-nums">{formatCurrency(stats.monthIncome)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-white/75">Gastos</dt>
                                    <dd className="font-semibold tabular-nums">{formatCurrency(stats.monthExpenses)}</dd>
                                </div>
                            </dl>
                            <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden" aria-hidden="true">
                                <motion.div
                                    className="h-full rounded-full bg-white"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${stats.monthIncome > 0 ? Math.min((stats.monthExpenses / stats.monthIncome) * 100, 100) : 0}%` }}
                                    transition={{ duration: 0.9, ease: iosEase, delay: 0.2 }}
                                />
                            </div>
                            <p className="text-xs text-white/70 mt-2">
                                {stats.monthIncome > 0
                                    ? `Gastaste el ${Math.round((stats.monthExpenses / stats.monthIncome) * 100)}% de tus ingresos`
                                    : 'Registrá tus ingresos para ver cuánto te queda'}
                            </p>
                            </>
                        )}
                    </div>

                    <div className="glass-card p-6 flex-1 xl:flex-none flex flex-col gap-4">
                        <span className="w-11 h-11 rounded-full bg-ink text-background flex items-center justify-center">
                            <MessageCircle size={20} />
                        </span>
                        <div>
                            <p className="text-[17px] font-semibold">Contale a Wally</p>
                            <p className="text-sm text-ink-2 mt-1">
                                Escribile o mandale un audio con lo que gastaste y lo anota por vos.
                            </p>
                        </div>
                        <button type="button" className="pill-ghost self-start" onClick={openWallyBot}>
                            Abrir chat
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;
