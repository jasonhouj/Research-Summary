import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Building2, Camera, Check, Crown, Zap, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { SubscriptionTier } from '../types';

export const Settings: React.FC = () => {
    const { user, profile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [tiers, setTiers] = useState<SubscriptionTier[]>([]);

    // Form state
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [affiliation, setAffiliation] = useState(profile?.affiliation || '');
    const [department, setDepartment] = useState(profile?.department || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        fetchTiers();
    }, []);

    useEffect(() => {
        console.log('Profile data received:', profile);
        if (profile) {
            setFullName(profile.full_name || '');
            setAffiliation(profile.affiliation || '');
            setDepartment(profile.department || '');
        }
        if (user) {
            setEmail(user.email || '');
        }
    }, [profile, user]);

    const fetchTiers = async () => {
        const { data } = await supabase
            .from('subscription_tiers')
            .select('*')
            .order('price_monthly', { ascending: true });

        if (data) {
            setTiers(data);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        if (!user?.id) {
            setError('No user logged in');
            setLoading(false);
            return;
        }

        console.log('Saving profile for user:', user.id);
        console.log('Data:', { full_name: fullName, affiliation, department });

        try {
            // Use upsert to create or update the profile
            const { data, error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: fullName,
                    affiliation: affiliation,
                    department: department,
                }, { onConflict: 'id' })
                .select();

            console.log('Upsert result:', { data, error });

            if (error) throw error;
            await refreshProfile();
            setMessage('Profile updated successfully!');
        } catch (err: any) {
            console.error('Profile update error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const { error } = await supabase.auth.updateUser({ email });
            if (error) throw error;
            setMessage('Verification email sent to your new address. Please confirm to complete the change.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setMessage('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setLoading(true);
        setError('');
        setMessage('');

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/avatar.${fileExt}`;

            console.log('Uploading avatar to:', filePath);

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            // Get public URL with cache-busting
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const avatarUrl = `${publicUrl}?t=${Date.now()}`;
            console.log('Avatar URL:', avatarUrl);

            // Upsert profile with new avatar
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    avatar_url: avatarUrl,
                }, { onConflict: 'id' });

            if (updateError) {
                console.error('Profile update error:', updateError);
                throw updateError;
            }

            await refreshProfile();
            setMessage('Avatar updated successfully!');
        } catch (err: any) {
            console.error('Avatar upload error:', err);
            setError(err.message || 'Failed to upload avatar');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscriptionChange = async (tierId: string) => {
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    subscription_tier: tierId,
                    subscription_started_at: new Date().toISOString(),
                })
                .eq('id', user?.id);

            if (error) throw error;
            setMessage(`Subscription updated to ${tierId.charAt(0).toUpperCase() + tierId.slice(1)}!`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const currentTier = profile?.subscription_tier || 'free';
    const paperCount = profile?.paper_count || 0;
    const currentTierData = tiers.find(t => t.id === currentTier);
    const paperLimit = currentTierData?.paper_limit;
    const usagePercent = paperLimit ? Math.min(100, (paperCount / paperLimit) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-charcoal">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account and subscription</p>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 text-green-600 rounded-lg p-4 mb-6 text-sm flex items-center gap-2"
                >
                    <Check size={18} />
                    {message}
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 mb-6 text-sm flex items-center gap-2"
                >
                    <AlertCircle size={18} />
                    {error}
                </motion.div>
            )}

            <div className="space-y-8">
                {/* Profile Section */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-display text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                        <User size={20} className="text-sage" />
                        Profile
                    </h2>

                    <div className="flex items-start gap-8 mb-6">
                        <div className="relative group">
                            <img
                                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=8fbc8f&color=fff`}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                            />
                            <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Camera size={24} className="text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Affiliation / Institution</label>
                                <div className="relative">
                                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={affiliation}
                                        onChange={(e) => setAffiliation(e.target.value)}
                                        placeholder="University of Example"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                <div className="relative">
                                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        placeholder="Computer Science"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-charcoal hover:bg-black text-white font-medium py-2.5 px-6 rounded-lg transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Profile'}
                            </button>
                        </form>
                    </div>
                </section>

                {/* Account Section */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-display text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                        <Shield size={20} className="text-sage" />
                        Account
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Email */}
                        <form onSubmit={handleEmailUpdate} className="space-y-4">
                            <h3 className="font-semibold text-charcoal">Email Address</h3>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || email === user?.email}
                                className="bg-gray-100 hover:bg-gray-200 text-charcoal font-medium py-2 px-4 rounded-lg transition-all disabled:opacity-50 text-sm"
                            >
                                Update Email
                            </button>
                        </form>

                        {/* Password */}
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <h3 className="font-semibold text-charcoal">Change Password</h3>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New password"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                                />
                            </div>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !newPassword}
                                className="bg-gray-100 hover:bg-gray-200 text-charcoal font-medium py-2 px-4 rounded-lg transition-all disabled:opacity-50 text-sm"
                            >
                                Update Password
                            </button>
                        </form>
                    </div>
                </section>

                {/* Subscription Section */}
                <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="font-display text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                        <Crown size={20} className="text-sage" />
                        Subscription
                    </h2>

                    {/* Usage Meter */}
                    {paperLimit && (
                        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Paper Usage</span>
                                <span className="text-sm text-gray-500">{paperCount} / {paperLimit} papers</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-sage'
                                        }`}
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                            {usagePercent > 90 && (
                                <p className="text-xs text-red-500 mt-2">You're running low on paper storage. Consider upgrading!</p>
                            )}
                        </div>
                    )}

                    {/* Tier Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {tiers.map((tier) => {
                            const isCurrent = tier.id === currentTier;
                            const Icon = tier.id === 'unlimited' ? Zap : tier.id === 'pro' ? Crown : User;

                            return (
                                <motion.div
                                    key={tier.id}
                                    whileHover={{ y: -4 }}
                                    className={`relative p-6 rounded-xl border-2 transition-all ${isCurrent
                                        ? 'border-sage bg-sage/5'
                                        : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-4 bg-sage text-white text-xs font-bold px-3 py-1 rounded-full">
                                            Current
                                        </div>
                                    )}

                                    <div className={`p-2 rounded-lg w-fit mb-4 ${tier.id === 'unlimited' ? 'bg-purple-100 text-purple-600' :
                                        tier.id === 'pro' ? 'bg-amber-100 text-amber-600' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        <Icon size={20} />
                                    </div>

                                    <h3 className="font-display font-bold text-lg text-charcoal">{tier.name}</h3>
                                    <div className="mt-2 mb-4">
                                        <span className="text-3xl font-bold text-charcoal">${tier.price_monthly}</span>
                                        <span className="text-gray-500 text-sm">/month</span>
                                    </div>

                                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                                        <li className="flex items-center gap-2">
                                            <Check size={14} className="text-sage" />
                                            {tier.paper_limit ? `${tier.paper_limit} papers` : 'Unlimited papers'}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check size={14} className="text-sage" />
                                            {tier.features.storage} storage
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check size={14} className="text-sage" />
                                            {tier.features.support} support
                                        </li>
                                        {tier.features.priority_processing && (
                                            <li className="flex items-center gap-2">
                                                <Check size={14} className="text-sage" />
                                                Priority processing
                                            </li>
                                        )}
                                    </ul>

                                    <button
                                        onClick={() => handleSubscriptionChange(tier.id)}
                                        disabled={isCurrent || loading}
                                        className={`w-full py-2.5 rounded-lg font-medium transition-all ${isCurrent
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-charcoal hover:bg-black text-white'
                                            }`}
                                    >
                                        {isCurrent ? 'Current Plan' : tier.price_monthly === 0 ? 'Downgrade' : 'Upgrade'}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>

                    <p className="text-xs text-gray-400 mt-6 text-center">
                        Payment processing coming soon. For now, tier changes are instant.
                    </p>
                </section>
            </div>
        </div>
    );
};
