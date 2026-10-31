import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';

const DebugApiPage = () => {
    const { user, userData } = useAuth();

    const { data: messages, loading: messagesLoading, error: messagesError } = useSupabaseQuery('transactions', {
        limitCount: 5,
        conditions: [['user_id', '==', user?.id]]
    });
    const { data: users, loading: usersLoading, error: usersError } = useSupabaseQuery('profiles', {
        limitCount: 5,
        conditions: [['id', '==', user?.id]]
    });

    const apiResponse = {
        timestamp: new Date().toISOString(),
        auth: {
            isAuthenticated: !!user,
            uid: user?.id || null,
            email: user?.email || null,
            profile: userData || null
        },
        supabase: {
            status: "online",
            tables: {
                transactions: {
                    count: messages.length,
                    loading: messagesLoading,
                    error: messagesError,
                    sample: messages
                },
                profiles: {
                    count: users.length,
                    loading: usersLoading,
                    error: usersError,
                    sample: users
                }
            }
        }
    };

    return (
        <div className="p-8 font-mono text-sm dark:bg-zinc-950 min-h-screen text-indigo-400">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex justify-between items-center border-b border-indigo-500/20 pb-4">
                    <h1 className="text-xl font-bold uppercase tracking-tighter">Wally System API Explorer</h1>
                    <span className="bg-indigo-500/10 px-3 py-1 rounded text-xs">GET /api/debug</span>
                </div>

                <div className="glass-card p-6 bg-zinc-900/80 border border-indigo-500/10 rounded-xl overflow-hidden shadow-2xl">
                    <pre className="whitespace-pre-wrap break-all leading-relaxed">
                        {JSON.stringify(apiResponse, null, 4)}
                    </pre>
                </div>

                <div className="mt-8 text-zinc-500 text-xs text-center italic">
                    Esta vista está diseñada para depuración técnica y verificación de flujos de datos.
                </div>
            </div>
        </div>
    );
};

export default DebugApiPage;
