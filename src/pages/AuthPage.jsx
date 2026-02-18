import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, login, signup, loginWithGoogle } = useAuth();

    // Redirect if already logged in
    if (user) return <Navigate to="/" />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
        } catch (err) {
            setError(err.message.replace('Firebase:', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            await loginWithGoogle();
        } catch (err) {
            setError(err.message.replace('Firebase:', ''));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-white dark:bg-zinc-950">
            <div className="absolute top-0 left-0 -z-10 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-300 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-200 blur-[120px] rounded-full"></div>
            </div>

            <div className="glass-card w-full max-w-md p-8 rounded-3xl space-y-8">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-100 rounded-xl mx-auto flex items-center justify-center shadow-sm mb-4">
                        <span className="text-white dark:text-black font-bold text-2xl">W</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                    <p className="text-zinc-500 text-sm">Minimalist expense tracking via WhatsApp</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest ml-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-0 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-0 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full py-3.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 rounded-xl font-bold transition-all mt-4 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>
                    </div>
                </form>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 font-bold tracking-widest">Or continue with</span></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full py-3.5 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-zinc-700 dark:text-zinc-300"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google Account
                </button>

                <p className="text-center text-sm text-zinc-500">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-zinc-900 dark:text-zinc-100 font-bold hover:underline"
                    >
                        {isLogin ? 'Create one' : 'Log in'}
                    </button>
                </p>

                <div className="flex justify-center gap-4 text-[10px] text-zinc-500 font-medium pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Link to="/terms" className="hover:text-primary transition-colors">Términos</Link>
                    <span>•</span>
                    <Link to="/privacy" className="hover:text-primary transition-colors">Privacidad</Link>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
