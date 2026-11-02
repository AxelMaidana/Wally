import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { softSpring, sidebarSpring } from '../lib/motion';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, login, signup, loginWithGoogle } = useAuth();

    // Redirect if already logged in
    if (user) return <Navigate to="/" />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                const { needsConfirmation } = await signup(email, password);
                if (needsConfirmation) {
                    setInfo('Te enviamos un email para confirmar tu cuenta. Revisá tu bandeja de entrada.');
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setInfo('');
        try {
            await loginWithGoogle();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-dvh flex items-center justify-center px-4 py-16">
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={softSpring}
                className="glass-panel w-full max-w-[400px] p-7 sm:p-8 rounded-[2rem] flex flex-col gap-6"
            >
                <div className="flex flex-col items-center text-center gap-3">
                    <span className="w-14 h-14 rounded-[18px] bg-ink text-background flex items-center justify-center text-2xl font-semibold">W</span>
                    <div>
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.h1
                                key={isLogin ? 'login' : 'signup'}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.18 }}
                                className="text-[28px] leading-tight font-bold tracking-[-0.02em]"
                            >
                                {isLogin ? 'Entrá a Wally' : 'Creá tu cuenta'}
                            </motion.h1>
                        </AnimatePresence>
                        <p className="text-[15px] text-ink-2 mt-1">Anotá tus gastos hablando, como si le escribieras a un amigo.</p>
                    </div>
                </div>

                <AnimatePresence initial={false}>
                    {(error || info) && (
                        <motion.p
                            key={error ? 'error' : 'info'}
                            role={error ? 'alert' : 'status'}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1, x: error ? [0, -6, 6, -4, 4, 0] : 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ ...sidebarSpring, x: { duration: 0.4 } }}
                            className={'glass-card px-4 py-3 text-sm text-center ' + (error ? 'text-gasto' : 'text-ingreso')}
                        >
                            {error || info}
                        </motion.p>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[13px] text-ink-2 px-1">Email</span>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            className="glass-input"
                            placeholder="vos@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[13px] text-ink-2 px-1">Contraseña</span>
                        <input
                            type="password"
                            required
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                            className="glass-input"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                    <button disabled={loading} className="pill-button h-12 mt-2 text-[15px] disabled:opacity-50">
                        {loading ? 'Un momento…' : (isLogin ? 'Iniciar sesión' : 'Crear cuenta')}
                    </button>
                </form>

                <div className="flex items-center gap-3 text-[13px] text-ink-3">
                    <span className="flex-1 h-px bg-hairline" />
                    o
                    <span className="flex-1 h-px bg-hairline" />
                </div>

                <button type="button" onClick={handleGoogleLogin} className="pill-ghost h-12 text-[15px]">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar con Google
                </button>

                <p className="text-center text-sm text-ink-2">
                    {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError(''); setInfo(''); }}
                        className="text-ink font-semibold hover:underline"
                    >
                        {isLogin ? 'Creá una' : 'Iniciá sesión'}
                    </button>
                </p>

                <div className="flex justify-center gap-4 text-xs text-ink-3">
                    <Link to="/terms" className="hover:text-ink">Términos</Link>
                    <Link to="/privacy" className="hover:text-ink">Privacidad</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPage;
