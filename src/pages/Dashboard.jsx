import { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { motion } from 'motion/react';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowRightLeft,
    Calendar,
    Activity,
    ChevronRight,
    RefreshCcw,
    Plus,
    MessageSquare
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

const Sparkline = ({ data, color, isNegative }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data) || 1;
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 24;
    const points = data.map((val, i) => ({
        x: (i / (data.length - 1)) * width,
        y: height - ((val - min) / range) * height
    }));
    const d = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

    return (
        <div className="flex items-center">
            <svg width={width} height={height} className="overflow-visible">
                <motion.path
                    d={d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isNegative ? 'text-red-500' : 'text-green-500'}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </svg>
        </div>
    );
};

const StatCard = ({ title, value, icon, trend, trendLabel, chartData, inverseTrend = false }) => {
    const isPositive = trend >= 0;
    const isGood = inverseTrend ? !isPositive : isPositive;

    return (
        <motion.div
            variants={item}
            className="glass-card p-6 flex flex-col gap-5 group relative overflow-hidden"
        >
            <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-secondary rounded-2xl border border-border text-primary group-hover:scale-110 transition-transform duration-500">
                    {icon}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${isGood
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                    {chartData && (
                        <div className="opacity-40 group-hover:opacity-100 transition-opacity pr-1">
                            <Sparkline data={chartData} isNegative={inverseTrend ? isPositive : !isPositive} />
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 pt-2">
                <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-1">{title}</p>
                <h3 className="text-4xl font-bold tracking-tight text-foreground">{value}</h3>
            </div>

            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 px-0.5">
                <Calendar size={10} /> {trendLabel || 'Comparado a ayer'}
            </p>
        </motion.div>
    );
};

const Dashboard = () => {
    const { user, userData } = useAuth();
    const [firebaseStatus, setFirebaseStatus] = useState("Checking...");

    // Optimization: Only fetch messages from the beginning of the current month
    const startOfMonthDate = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }, []);

    // Fetch user messages (filtered by UID and performance)
    const { data: messages, loading: messagesLoading } = useFirestore('messages', {
        orderByField: 'createdAt',
        conditions: [
            ['uid', '==', user?.uid],
            ['createdAt', '>=', startOfMonthDate.toISOString()]
        ]
    });

    // Calculate Dynamic Stats
    const stats = useMemo(() => {
        if (!messages || messages.length === 0) {
            return {
                daily: 0,
                monthly: 0,
                transactionCount: 0,
                savings: 0,
                trend: 0
            };
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let dailyTotal = 0;
        let yesterdayTotal = 0;
        let monthlyExpenses = 0;
        let monthlyIncome = 0;
        let count = 0;

        const history = {}; // Map for sparkline

        messages.forEach(msg => {
            let msgDate;
            if (msg.createdAt?.toDate) msgDate = msg.createdAt.toDate();
            else if (typeof msg.createdAt === 'string') msgDate = new Date(msg.createdAt.trim());
            else msgDate = new Date();

            const amount = parseFloat(msg.monto) || 0;
            const isGasto = msg.tipo?.toLowerCase() === 'gasto';
            const dateKey = msgDate.toDateString();

            if (isGasto) {
                history[dateKey] = (history[dateKey] || 0) + amount;
                if (msgDate >= today) dailyTotal += amount;
                else if (msgDate >= yesterday && msgDate < today) yesterdayTotal += amount;
            }

            if (msgDate >= startOfMonth) {
                if (isGasto) monthlyExpenses += amount;
                else monthlyIncome += amount;
                count++;
            }
        });

        // Calculate Daily Trend
        let dailyTrend = 0;
        if (yesterdayTotal > 0) {
            dailyTrend = parseFloat(((dailyTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(1));
        } else if (dailyTotal > 0) {
            dailyTrend = 100;
        }

        // Prepare sparkline data for last 7 days
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            chartData.push(history[d.toDateString()] || 0);
        }

        const savings = Math.max(0, monthlyIncome - monthlyExpenses);
        const savingsRate = monthlyIncome > 0 ? parseFloat(((savings / monthlyIncome) * 100).toFixed(1)) : 0;

        return {
            daily: dailyTotal,
            monthly: monthlyExpenses,
            transactionCount: count,
            savings,
            dailyTrend,
            savingsTrend: savingsRate,
            chartData
        };
    }, [messages]);

    useEffect(() => {
        async function checkFirebase() {
            try {
                // Use 'messages' to check status since 'expenses' doesn't exist
                const q = query(collection(db, "messages"), limit(1));
                await getDocs(q);
                setFirebaseStatus("Online");
            } catch (error) {
                if (error.code === 'permission-denied') setFirebaseStatus("System Online");
                else setFirebaseStatus("Offline");
            }
        }
        checkFirebase();
    }, []);

    const userFirstName = userData?.displayName?.split(' ')[0] || 'Axel';

    // Get only last 5 for the table
    const recentMessages = messages.slice(0, 5);

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="flex flex-col gap-10 max-w-7xl mx-auto w-full px-4 md:px-0"
        >
            {/* Header Section */}
            <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-5xl font-extrabold tracking-tighter text-foreground">
                        Panel Principal
                    </h2>
                    <p className="text-muted-foreground mt-3 text-lg font-medium">Bienvenido de nuevo, {userFirstName} 👋</p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                        <Plus size={20} />
                        <span>Nuevo Gasto</span>
                    </button>

                    <div className="flex items-center gap-2.5 px-4 py-2 bg-secondary border border-border rounded-2xl">
                        <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${firebaseStatus === 'Offline' ? 'bg-red-500' : 'bg-green-500'
                            }`}></div>
                        <span className="text-xs font-bold text-foreground uppercase tracking-widest">{firebaseStatus}</span>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard
                    title="Gasto Diario"
                    value={messagesLoading ? '...' : formatCurrency(stats.daily)}
                    trend={stats.dailyTrend}
                    chartData={stats.chartData}
                    inverseTrend={true} // Higher spend is bad
                    icon={<Activity size={24} />}
                />
                <StatCard
                    title="Ahorro Mensual"
                    value={messagesLoading ? '...' : formatCurrency(stats.savings)}
                    trend={stats.savingsTrend}
                    trendLabel="De los ingresos totales"
                    icon={<Wallet size={24} />}
                />
                <StatCard
                    title="Transacciones"
                    value={messagesLoading ? '...' : stats.transactionCount}
                    trend={stats.transactionCount > 0 ? 100 : 0}
                    icon={<ArrowRightLeft size={24} />}
                    trendLabel="Total este mes"
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Section */}
                <motion.div variants={item} className="lg:col-span-2 glass-card rounded-[2.5rem]">
                    <div className="px-10 py-8 border-b border-border flex justify-between items-center bg-secondary/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                <RefreshCcw size={20} />
                            </div>
                            <h3 className="font-bold text-xl text-foreground">Actividad Reciente</h3>
                        </div>
                        <button className="text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors flex items-center gap-1 group">
                            Ver Todo <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] border-b border-border">
                                    <th className="px-10 py-6">Descripción</th>
                                    <th className="px-10 py-6">Monto</th>
                                    <th className="px-10 py-6">Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                                {messagesLoading ? (
                                    <tr>
                                        <td colSpan="3" className="px-10 py-10 text-center text-zinc-500">Cargando datos...</td>
                                    </tr>
                                ) : messages.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-10 py-10 text-center text-zinc-500">No hay transacciones recientes</td>
                                    </tr>
                                ) : (
                                    recentMessages.map((row, idx) => (
                                        <tr key={row.id || idx} className="hover:bg-secondary/50 transition-colors group">
                                            <td className="px-10 py-7 text-foreground/80 font-medium group-hover:text-foreground transition-colors flex items-center gap-3">
                                                <span className={`block w-1.5 h-1.5 rounded-full ${row.tipo?.toLowerCase() === 'gasto' ? 'bg-red-500/40' : 'bg-green-500/40'}`}></span>
                                                {row.descripcion || 'Sin descripción'}
                                            </td>
                                            <td className="px-10 py-7 font-bold text-foreground text-lg">
                                                {formatCurrency(row.monto || 0)}
                                            </td>
                                            <td className="px-10 py-7">
                                                <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${row.tipo?.toLowerCase() === 'gasto'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    }`}>
                                                    {row.tipo ? row.tipo.charAt(0).toUpperCase() + row.tipo.slice(1) : 'Procesado'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>


                {/* Side Section / Quick Tips or Insights */}
                <motion.div variants={item} className="flex flex-col gap-6">
                    <div className="glass-card rounded-[2.5rem] p-8 bg-gradient-to-br from-indigo-500/10 to-transparent">
                        <h4 className="font-bold text-white text-lg mb-4">Wally Insight AI</h4>
                        <p className="text-zinc-400 leading-relaxed text-sm mb-6">
                            {messages.length > 5
                                ? "Tus gastos han sido estables esta semana. ¡Sigue así!"
                                : "Aún estamos analizando tus patrones de gasto. ¡Registra más actividades para obtener consejos personalizados!"}
                        </p>
                        <button className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold transition-colors text-sm">
                            Ver Análisis Completo
                        </button>
                    </div>

                    <div className="glass-card rounded-[2.5rem] p-8">
                        <h4 className="font-bold text-white text-lg mb-4">Exportar Resumen</h4>
                        <p className="text-zinc-500 text-xs mb-6">
                            Descarga tu resumen mensual para contabilidad o control personal.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:border-zinc-700 transition-all text-center">
                                PDF
                            </button>
                            <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:border-zinc-700 transition-all text-center">
                                Excel/CSV
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
