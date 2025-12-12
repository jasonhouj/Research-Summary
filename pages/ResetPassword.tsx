import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we have a valid session from the reset link
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // No session means invalid or expired reset link
                setError('Invalid or expired reset link. Please request a new one.');
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                // Redirect to home after 3 seconds
                setTimeout(() => {
                    navigate('/');
                }, 3000);
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
                        Set your new<br />
                        <span className="text-sage">password.</span>
                    </h1>

                    <p className="text-gray-400 text-lg max-w-md">
                        Choose a strong password to keep your research library secure.
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
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle size={32} className="text-green-500" />
                                </div>
                                <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
                                    Password Updated!
                                </h2>
                                <p className="text-gray-500 mb-4">
                                    Your password has been successfully reset.
                                </p>
                                <p className="text-sm text-gray-400">
                                    Redirecting you to the dashboard...
                                </p>
                            </motion.div>
                        ) : (
                            <>
                                <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
                                    Create new password
                                </h2>
                                <p className="text-gray-500 mb-8">
                                    Enter your new password below
                                </p>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-6 text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
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

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
