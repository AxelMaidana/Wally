import React, { useState } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Users, Activity, Clock } from 'lucide-react';

const DataDemo = () => {
    const [activeTab, setActiveTab] = useState('messages');
    const { user } = useAuth();

    const {
        data: messages,
        loading: messagesLoading,
        error: messagesError
    } = useFirestore('messages', {
        orderByField: 'createdAt',
        limitCount: 20,
        conditions: [['uid', '==', user?.uid]]
    });

    const {
        data: users,
        loading: usersLoading,
        error: usersError
    } = useFirestore('users', {
        limitCount: 20,
        conditions: [['uid', '==', user?.uid]]
    });

    const currentData = activeTab === 'messages' ? messages : users;
    const isLoading = activeTab === 'messages' ? messagesLoading : usersLoading;
    const error = activeTab === 'messages' ? messagesError : usersError;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Firestore Explorer</h1>
                    <p className="text-zinc-400 mt-2">Explora los datos en tiempo real de tus colecciones de Firebase</p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'messages'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        <MessageSquare size={18} />
                        Mensajes
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'users'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        <Users size={18} />
                        Usuarios
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-center">
                    <p className="font-bold">Error al cargar datos</p>
                    <p className="text-sm opacity-80">{error}</p>
                </div>
            )}

            <div className="glass-card rounded-[2rem] overflow-hidden border border-zinc-800/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-900/40 text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] border-b border-zinc-800/50">
                                {currentData.length > 0 ? (
                                    Object.keys(currentData[0]).map((key) => (
                                        <th key={key} className="px-8 py-6 font-bold">
                                            {key}
                                        </th>
                                    ))
                                ) : (
                                    <th className="px-8 py-6 font-bold">Datos</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="100%" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-zinc-500">
                                            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                            <span className="font-medium">Sincronizando con Firestore...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentData.length === 0 ? (
                                <tr>
                                    <td colSpan="100%" className="px-8 py-20 text-center text-zinc-500 italic">
                                        No se encontraron documentos en la colección "{activeTab}"
                                    </td>
                                </tr>
                            ) : (
                                currentData.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-zinc-800/20 transition-colors group">
                                        {Object.entries(row).map(([key, value], i) => (
                                            <td key={i} className="px-8 py-6 text-zinc-300 whitespace-nowrap">
                                                {typeof value === 'object' && value?.toDate
                                                    ? value.toDate().toLocaleString()
                                                    : JSON.stringify(value).replace(/^"|"$/g, '')
                                                }
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 flex gap-6">
                <div className="flex-1 glass-card p-6 rounded-2xl flex items-center gap-4 border border-zinc-800/50">
                    <div className="p-3 bg-green-500/10 text-green-400 rounded-xl">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Estado de Conexión</p>
                        <p className="text-white font-bold">Tiempo Real Activo</p>
                    </div>
                </div>
                <div className="flex-1 glass-card p-6 rounded-2xl flex items-center gap-4 border border-zinc-800/50">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Última Actualización</p>
                        <p className="text-white font-bold">{new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataDemo;
