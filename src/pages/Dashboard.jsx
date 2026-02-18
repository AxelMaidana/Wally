import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

const StatCard = ({ title, value, icon, trend }) => (
    <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-primary">
                {icon}
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
            </span>
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold mt-1">{value}</h3>
        </div>
    </div>
);

const Dashboard = () => {
    const [firebaseStatus, setFirebaseStatus] = useState("Checking...");

    useEffect(() => {
        async function checkFirebase() {
            try {
                const q = query(collection(db, "expenses"), limit(1));
                await getDocs(q);
                setFirebaseStatus("Connected");
            } catch (error) {
                if (error.code === 'permission-denied') setFirebaseStatus("System Online");
                else setFirebaseStatus("Error");
            }
        }
        checkFirebase();
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight">Dashboard</h2>
                    <p className="text-slate-400 mt-2">Welcome back, Axel!</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{firebaseStatus}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Daily Spending"
                    value="$12,450"
                    trend={12}
                    icon={(
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    )}
                />
                <StatCard
                    title="Monthly Savings"
                    value="$145,200"
                    trend={-5}
                    icon={(
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                />
                <StatCard
                    title="Total Transactions"
                    value="156"
                    trend={24}
                    icon={(
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                />
            </div>

            <div className="glass-card rounded-3xl overflow-hidden">
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Recent WhatsApp Activity</h3>
                    <button className="text-primary text-sm font-semibold hover:underline">View All</button>
                </div>
                <div className="p-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-white/5">
                                <th className="px-8 py-4">Message Content</th>
                                <th className="px-8 py-4">Extracted Amount</th>
                                <th className="px-8 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            <tr className="hover:bg-white/5 transition-colors group">
                                <td className="px-8 py-5 text-slate-300 italic group-hover:text-white transition-colors">"Gaste 500 en un café"</td>
                                <td className="px-8 py-5 font-bold">$500</td>
                                <td className="px-8 py-5">
                                    <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md text-xs font-semibold">Parsed</span>
                                </td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors group">
                                <td className="px-8 py-5 text-slate-300 italic group-hover:text-white transition-colors">"Compre milanesas por 4500"</td>
                                <td className="px-8 py-5 font-bold">$4,500</td>
                                <td className="px-8 py-5">
                                    <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md text-xs font-semibold">Parsed</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
