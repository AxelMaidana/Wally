import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Mic, Pencil } from 'lucide-react';
import { CategoryIcon } from '../CategoryIcon';
import { cn } from '../../lib/utils';
import { softSpring } from '../../lib/motion';

// Same list the n8n workflow gives the AI (node "Config")
const CATEGORIAS = ['comida', 'supermercado', 'transporte', 'hogar', 'servicios', 'salud', 'ocio', 'compras', 'ropa', 'sueldo', 'trabajo', 'otros'];

const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);
const formatMoney = (n) => `$ ${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;

// "2026-11-03" -> "Hoy" / "Ayer" / "1 nov"
const formatDay = (iso) => {
    if (!iso) return 'Hoy';
    const [y, m, d] = iso.split('-').map(Number);
    const day = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - day) / 864e5);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return day.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

const Field = ({ label, children }) => (
    <label className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-ink-2 px-1">{label}</span>
        {children}
    </label>
);

const inputClass = 'w-full rounded-xl px-3 h-10 text-[15px] bg-tile border border-hairline outline-none focus:border-ring text-ink';

const DraftForm = ({ draft, onSubmit, onCancel }) => {
    const [form, setForm] = useState({ ...draft, monto: String(draft.monto) });
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const monto = Number(String(form.monto).replace(/\./g, '').replace(',', '.'));
    const valid = monto > 0 && form.descripcion.trim() && /^\d{4}-\d{2}-\d{2}$/.test(form.fecha);

    const submit = (e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({ ...form, monto, descripcion: form.descripcion.trim(), observacion: form.observacion.trim() });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex rounded-full bg-tile p-1" role="radiogroup" aria-label="Tipo">
                {['gasto', 'ingreso'].map((tipo) => (
                    <button
                        key={tipo}
                        type="button"
                        role="radio"
                        aria-checked={form.tipo === tipo}
                        onClick={() => setForm((f) => ({ ...f, tipo }))}
                        className={cn(
                            'flex-1 h-8 rounded-full text-[13px] font-semibold transition-colors',
                            form.tipo === tipo ? 'glass-bubble text-ink' : 'text-ink-2'
                        )}
                    >
                        {capitalize(tipo)}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-[1fr_1.4fr] gap-2">
                <Field label="Monto">
                    <input className={inputClass} inputMode="decimal" value={form.monto} onChange={set('monto')} autoFocus />
                </Field>
                <Field label="Fecha">
                    <input className={inputClass} type="date" value={form.fecha} onChange={set('fecha')} />
                </Field>
            </div>
            <Field label="Motivo">
                <input className={inputClass} value={form.descripcion} onChange={set('descripcion')} />
            </Field>
            <Field label="Categoría">
                <select className={inputClass} value={form.categoria} onChange={set('categoria')}>
                    {[...new Set([form.categoria, ...CATEGORIAS])].map((c) => (
                        <option key={c} value={c}>{capitalize(c)}</option>
                    ))}
                </select>
            </Field>
            <Field label="Observación">
                <input className={inputClass} value={form.observacion} onChange={set('observacion')} placeholder="Opcional" />
            </Field>
            <div className="flex gap-2 pt-1">
                <button type="submit" disabled={!valid} className="pill-button h-9 text-[13px] flex-1 disabled:opacity-50">Guardar</button>
                <button type="button" onClick={onCancel} className="pill-ghost h-9 text-[13px]">Cancelar</button>
            </div>
        </form>
    );
};

// Preview of what Wally understood. Nothing is saved until the person taps Guardar.
// status: "pending" | "saving" | "saved" | "undone" | "discarded"
export const DraftCard = ({ draft, status, onSave, onRedo, onUndo }) => {
    const [editing, setEditing] = useState(false);
    const done = status !== 'pending' && status !== 'saving';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: status === 'discarded' || status === 'undone' ? 0.55 : 1, y: 0, scale: 1 }}
            transition={softSpring}
            style={{ transformOrigin: 'top left' }}
            className="glass-card w-full max-w-[88%] p-4 mt-1"
        >
            <AnimatePresence mode="wait" initial={false}>
                {editing ? (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <DraftForm
                            draft={draft}
                            onCancel={() => setEditing(false)}
                            onSubmit={(edited) => {
                                setEditing(false);
                                onSave(edited);
                            }}
                        />
                    </motion.div>
                ) : (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <div className="flex items-start gap-3">
                            <span className="w-10 h-10 rounded-full bg-tile-strong flex items-center justify-center shrink-0">
                                <CategoryIcon categoria={draft.categoria} className="w-[18px] h-[18px] text-ink" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className={cn('text-[22px] font-semibold leading-tight tabular-nums', draft.tipo === 'ingreso' ? 'text-ingreso' : 'text-ink')}>
                                    {draft.tipo === 'ingreso' ? '+' : '−'}{formatMoney(draft.monto)}
                                </p>
                                <p className="text-[15px] font-medium truncate">{draft.descripcion}</p>
                                <p className="text-[13px] text-ink-2">
                                    {capitalize(draft.tipo)} · {capitalize(draft.categoria)} · {formatDay(draft.fecha)}{draft.hora ? `, ${draft.hora}` : ''}
                                </p>
                                {draft.observacion && <p className="text-[13px] text-ink-2 mt-1 italic">“{draft.observacion}”</p>}
                            </div>
                        </div>

                        {!done && (
                            <div className="grid grid-cols-3 gap-1.5 mt-4">
                                <button type="button" onClick={() => onSave(draft)} disabled={status === 'saving'} className="pill-button h-9 px-2 text-[13px] disabled:opacity-60">
                                    {status === 'saving' ? 'Guardando…' : 'Guardar'}
                                </button>
                                <button type="button" onClick={() => setEditing(true)} disabled={status === 'saving'} className="pill-ghost h-9 px-2 gap-1.5 text-[13px]">
                                    <Pencil size={13} /> Editar
                                </button>
                                <button type="button" onClick={onRedo} disabled={status === 'saving'} className="pill-ghost h-9 px-2 gap-1.5 text-[13px]">
                                    <Mic size={13} /> Regrabar
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 empty:hidden mt-3">
                            {status === 'saved' && (
                                <>
                                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ingreso"><Check size={15} /> Guardado</span>
                                    <button type="button" onClick={onUndo} className="ml-auto text-[13px] font-semibold text-[#0a84ff] hover:opacity-80">Deshacer</button>
                                </>
                            )}
                            {status === 'undone' && <span className="text-[13px] text-ink-2">Deshecho</span>}
                            {status === 'discarded' && <span className="text-[13px] text-ink-2">Descartado</span>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
