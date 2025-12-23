import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, BookOpen, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const AuthPage: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, fullName);
                if (error) {
                    setError(error.message);
                } else {
                    setMessage('Account created! Please check your email to verify your account, then sign in.');
                    setIsSignUp(false);
                }
            } else {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/#/reset-password`,
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage('Password reset link sent! Check your email inbox.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-offwhite flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-charcoal text-white flex-col justify-between p-12 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded bg-gradient-to-tr from-accent to-purple-600" />
                        <span className="font-display font-bold text-2xl tracking-tight">STEM Stack</span>
                    </div>

                    <h1 className="font-display text-4xl font-bold mb-6 leading-tight">
                        Transform your research<br />
                        <span className="text-sage">workflow today.</span>
                    </h1>

                    <p className="text-gray-400 text-lg max-w-md">
                        Upload research papers, get AI-powered summaries, and organize your academic library with ease.
                    </p>
                </div>

                <div className="relative z-10">
                    <p className="text-gray-500 text-sm">
                        Trusted by researchers worldwide
                    </p>
                </div>

                {/* Decorative elements */}
                <div className="absolute -right-20 -bottom-20 opacity-5">
                    <BookOpen size={400} />
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-accent to-purple-600" />
                        <span className="font-display font-bold text-xl tracking-tight text-charcoal">STEM Stack</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <AnimatePresence mode="wait">
                            {showForgotPassword ? (
                                <motion.div
                                    key="forgot"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <button
                                        onClick={() => {
                                            setShowForgotPassword(false);
                                            setError('');
                                            setMessage('');
                                        }}
                                        className="flex items-center gap-2 text-gray-500 hover:text-charcoal mb-6 transition-colors"
                                    >
                                        <ArrowLeft size={16} />
                                        <span className="text-sm">Back to sign in</span>
                                    </button>

                                    <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
                                        Reset your password
                                    </h2>
                                    <p className="text-gray-500 mb-8">
                                        Enter your email and we'll send you a reset link
                                    </p>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-6 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {message && (
                                        <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-4 mb-6 text-sm">
                                            {message}
                                        </div>
                                    )}

                                    <form onSubmit={handleForgotPassword} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                            <div className="relative">
                                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="you@university.edu"
                                                    required
                                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-charcoal hover:bg-black text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Sending...' : 'Send Reset Link'}
                                        </button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="auth"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
                                        {isSignUp ? 'Create an account' : 'Welcome back'}
                                    </h2>
                                    <p className="text-gray-500 mb-8">
                                        {isSignUp ? 'Start your research journey' : 'Sign in to continue to your library'}
                                    </p>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-6 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {message && (
                                        <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-4 mb-6 text-sm">
                                            {message}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {isSignUp && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                                <div className="relative">
                                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={fullName}
                                                        onChange={(e) => setFullName(e.target.value)}
                                                        placeholder="Dr. Jane Doe"
                                                        required={isSignUp}
                                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                            <div className="relative">
                                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="you@university.edu"
                                                    required
                                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                                {!isSignUp && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowForgotPassword(true);
                                                            setError('');
                                                            setMessage('');
                                                        }}
                                                        className="text-xs text-sage hover:text-sage-dark transition-colors"
                                                    >
                                                        Forgot password?
                                                    </button>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    minLength={6}
                                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-charcoal hover:bg-black text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <span>Please wait...</span>
                                            ) : (
                                                <>
                                                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                                                    <ArrowRight size={18} />
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={() => {
                                                setIsSignUp(!isSignUp);
                                                setError('');
                                                setMessage('');
                                            }}
                                            className="text-sm text-gray-500 hover:text-charcoal transition-colors"
                                        >
                                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
