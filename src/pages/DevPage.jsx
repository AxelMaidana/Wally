import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const DevPage = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(
                    collection(db, 'users'),
                    where('uid', '==', user?.uid),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const usersList = [];
                querySnapshot.forEach((doc) => {
                    usersList.push({ id: doc.id, ...doc.data() });
                });
                setUsers(usersList);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError("Failed to load users. Are firestore rules set?");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">Desarrollo</h2>
                <p className="text-zinc-500 mt-2 font-medium">Panel de administración de usuarios registrados.</p>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <h3 className="font-bold text-lg flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
                        Usuarios Registrados
                        <span className="text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-2.5 py-0.5 rounded-full font-bold">{users.length}</span>
                    </h3>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-500 font-medium">Cargando usuarios...</div>
                ) : error ? (
                    <div className="p-12 text-center text-red-500 bg-red-500/5">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                                <tr className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                                    <th className="px-8 py-4">Avatar</th>
                                    <th className="px-8 py-4">Nombre / Email</th>
                                    <th className="px-8 py-4">Rol</th>
                                    <th className="px-8 py-4">ID de Firebase</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName || u.email}`} className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm" alt="avatar" />
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                                                    {u.displayName || 'No name'}
                                                </span>
                                                <span className="text-xs text-zinc-500">{u.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                                            {u.id}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DevPage;
