import { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Search, Trash2, MessageCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { openWallyBot } from '../components/Chat/wallyEvents';
import { CategoryIcon } from '../components/CategoryIcon';
import { Skeleton } from '../components/ui/skeleton';
import { AnimatedNumber } from '../components/ui/animated-number';
import { Segmented } from '../components/ui/segmented';
import { sidebarSpring, iosEase } from '../lib/motion';

const filters = [
    { value: 'todos', label: 'Todos' },
    { value: 'gasto', label: 'Gastos' },
    { value: 'ingreso', label: 'Ingresos' },
];

const capitalize = (text) => text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

const dayLabel = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return capitalize(date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }));
};

const SummaryTile = ({ label, value, tone }) => (
    <div className="glass-card px-5 py-4">
        <p className="text-sm text-ink-2">{label}</p>
        <p className={`text-[26px] leading-tight font-semibold tracking-tight tabular-nums ${tone || 'text-ink'}`}>
            <AnimatedNumber value={value} format={formatCurrency} />
        </p>
    </div>
);

const TransactionRow = ({ row, hovered, onHover, confirming, onAskDelete, onCancelDelete, onDelete }) => {
    const isGasto = row.tipo === 'gasto';
    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
            transition={sidebarSpring}
            onMouseEnter={() => onHover(row.id)}
            className="group relative flex items-center gap-3 px-3 py-3 rounded-2xl"
        >
            {hovered && (
                <motion.span
                    layoutId="history-hover"
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
                    {capitalize(row.categoria)}, {row.observacion || new Date(row.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
                {confirming ? (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={sidebarSpring}
                        className="relative flex items-center gap-1.5"
                    >
                        <button type="button" onClick={onCancelDelete} className="pill-ghost h-8 px-3 text-[13px]">
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(row.id)}
                            className="inline-flex items-center h-8 px-3 rounded-full text-[13px] font-semibold bg-gasto text-white"
                        >
                            Borrar
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="amount"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative flex items-center gap-1"
                    >
                        <p className={`text-[15px] font-semibold tabular-nums ${isGasto ? 'text-ink' : 'text-ingreso'}`}>
                            {isGasto ? '−' : '+'}{formatCurrency(row.monto || 0)}
                        </p>
                        <button
                            type="button"
                            onClick={() => onAskDelete(row.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-gasto hover:bg-tile-strong opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                            aria-label={`Borrar ${row.descripcion || 'movimiento'}`}
                        >
                            <Trash2 size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.li>
    );
};

const HistoryPage = () => {
    const { user } = useAuth();
    const [monthOffset, setMonthOffset] = useState(0);
    const [filter, setFilter] = useState('todos');
    const [search, setSearch] = useState('');
    const [hovered, setHovered] = useState(null);
    const [confirmingId, setConfirmingId] = useState(null);
    const [deletedIds, setDeletedIds] = useState([]);
    const [deleteError, setDeleteError] = useState('');

    const { start, end, label } = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);
        return {
            start: monthStart,
            end: monthEnd,
            label: capitalize(monthStart.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }))
        };
    }, [monthOffset]);

    const { data: transactions, loading } = useSupabaseQuery('transactions', {
        orderByField: 'created_at',
        conditions: [
            ['user_id', '==', user?.id],
            ['created_at', '>=', start.toISOString()],
            ['created_at', '<', end.toISOString()]
        ]
    });

    // Deleted rows disappear right away; realtime confirms it a moment later
    const monthRows = useMemo(
        () => transactions.filter((tx) => !deletedIds.includes(tx.id)),
        [transactions, deletedIds]
    );

    const totals = useMemo(() => monthRows.reduce((acc, tx) => {
        const amount = Number(tx.monto) || 0;
        if (tx.tipo === 'gasto') acc.gastos += amount;
        else acc.ingresos += amount;
        return acc;
    }, { gastos: 0, ingresos: 0 }), [monthRows]);

    const groups = useMemo(() => {
        const query = search.trim().toLowerCase();
        const visible = monthRows.filter((tx) =>
            (filter === 'todos' || tx.tipo === filter) &&
            (!query || `${tx.descripcion} ${tx.categoria} ${tx.observacion ?? ''}`.toLowerCase().includes(query))
        );

        const byDay = new Map();
        visible.forEach((tx) => {
            const date = new Date(tx.created_at);
            const key = date.toDateString();
            if (!byDay.has(key)) byDay.set(key, { key, label: dayLabel(date), rows: [], total: 0 });
            const group = byDay.get(key);
            group.rows.push(tx);
            group.total += (tx.tipo === 'gasto' ? -1 : 1) * (Number(tx.monto) || 0);
        });
        return [...byDay.values()];
    }, [monthRows, filter, search]);

    const handleDelete = async (id) => {
        setConfirmingId(null);
        setDeleteError('');
        setDeletedIds((ids) => [...ids, id]);
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) {
            setDeletedIds((ids) => ids.filter((x) => x !== id));
            setDeleteError('No se pudo borrar el movimiento. Probá de nuevo.');
        }
    };

    const emptyMessage = search.trim()
        ? `No hay movimientos que coincidan con "${search.trim()}".`
        : filter === 'gasto'
            ? 'No registraste gastos este mes.'
            : filter === 'ingreso'
                ? 'No registraste ingresos este mes.'
                : 'No hay movimientos en este mes.';

    return (
        <div className="max-w-[880px] mx-auto flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[15px] text-ink-2">Todo lo que registraste</p>
                    <h1 className="text-[34px] md:text-[40px] leading-tight font-bold tracking-[-0.025em]">Movimientos</h1>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-tile border border-hairline p-1">
                    <button
                        type="button"
                        onClick={() => setMonthOffset((m) => m - 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-ink-2 hover:text-ink hover:bg-tile-strong"
                        aria-label="Mes anterior"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="relative w-36 h-8 overflow-hidden">
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.p
                                key={label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: iosEase }}
                                className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
                                aria-live="polite"
                            >
                                {label}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMonthOffset((m) => m + 1)}
                        disabled={monthOffset === 0}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-ink-2 hover:text-ink hover:bg-tile-strong disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Mes siguiente"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {loading ? (
                    [0, 1, 2].map((i) => (
                        <div key={i} className="glass-card px-5 py-4 space-y-2.5">
                            <Skeleton className="h-3.5 w-1/3" />
                            <Skeleton className="h-7 w-2/3" />
                        </div>
                    ))
                ) : (
                    <>
                        <SummaryTile label="Gastos" value={totals.gastos} />
                        <SummaryTile label="Ingresos" value={totals.ingresos} tone="text-ingreso" />
                        <SummaryTile label="Balance" value={totals.ingresos - totals.gastos} />
                    </>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Segmented id="history-filter" options={filters} value={filter} onChange={setFilter} />
                <label className="relative flex-1 min-w-[200px]">
                    <span className="sr-only">Buscar movimientos</span>
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por descripción o categoría"
                        className="glass-input h-10 rounded-full pl-10"
                    />
                </label>
            </div>

            {deleteError && (
                <p role="alert" className="glass-card px-4 py-3 text-sm text-gasto">{deleteError}</p>
            )}

            <div className="glass-card p-2 md:p-3" aria-busy={loading}>
                {loading ? (
                    <ul aria-hidden="true">
                        {[60, 45, 70, 50, 55].map((width) => (
                            <li key={width} className="flex items-center gap-3 px-3 py-3">
                                <Skeleton className="w-10 h-10 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-3.5" style={{ width: `${width}%` }} />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                                <Skeleton className="h-3.5 w-16" />
                            </li>
                        ))}
                    </ul>
                ) : groups.length === 0 ? (
                    <div className="px-3 py-10 flex flex-col items-center text-center gap-4">
                        <p className="text-sm text-ink-2 max-w-sm">{emptyMessage}</p>
                        {!search.trim() && monthOffset === 0 && (
                            <button type="button" className="pill-button" onClick={openWallyBot}>
                                <MessageCircle size={16} /> Registrar con Wally
                            </button>
                        )}
                    </div>
                ) : (
                    <LayoutGroup id="history-list">
                        {/* A new month swaps the whole list at once instead of shuffling sections */}
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, ease: iosEase }}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <AnimatePresence initial={false}>
                                {groups.map((group) => (
                                    <motion.section
                                        key={group.key}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={sidebarSpring}
                                        className="pb-2"
                                    >
                                        <div className="flex items-baseline justify-between px-3 pt-3 pb-1">
                                            <h2 className="text-[13px] font-semibold text-ink-2">{group.label}</h2>
                                            <p className="text-[13px] text-ink-3 tabular-nums">
                                                {group.total < 0 ? '−' : '+'}{formatCurrency(Math.abs(group.total))}
                                            </p>
                                        </div>
                                        <ul>
                                            <AnimatePresence initial={false}>
                                                {group.rows.map((row) => (
                                                    <TransactionRow
                                                        key={row.id}
                                                        row={row}
                                                        hovered={hovered === row.id}
                                                        onHover={setHovered}
                                                        confirming={confirmingId === row.id}
                                                        onAskDelete={setConfirmingId}
                                                        onCancelDelete={() => setConfirmingId(null)}
                                                        onDelete={handleDelete}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </ul>
                                    </motion.section>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </LayoutGroup>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
