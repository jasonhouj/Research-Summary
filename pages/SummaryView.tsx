import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Share2, Download, ArrowLeft, Copy, Lightbulb, Microscope, FileText, Target } from 'lucide-react';
import { PaperSummary } from '../types';
import { supabase } from '../lib/supabaseClient';

interface Paper {
    id: string;
    title: string;
    authors: string[];
}

export const SummaryView: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [paper, setPaper] = useState<Paper | null>(null);
    const [summary, setSummary] = useState<PaperSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            // Fetch paper
            const { data: paperData, error: paperError } = await supabase
                .from('papers')
                .select('*')
                .eq('id', id)
                .single();

            if (paperError) {
                console.error('Error fetching paper:', paperError);
            }

            if (paperData) {
                setPaper(paperData);

                // Fetch summary
                const { data: summaryData, error: summaryError } = await supabase
                    .from('summaries')
                    .select('*')
                    .eq('paper_id', id)
                    .single();

                if (summaryError) {
                    console.error('Error fetching summary:', summaryError);
                }

                if (summaryData) {
                    console.log('Summary data:', summaryData);
                    setSummary(summaryData);
                } else {
                    console.warn('No summary found for paper:', id);
                }
            }
            setLoading(false);
        };

        fetchData();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto py-20 text-center">
                <div className="animate-pulse text-gray-400">Loading summary...</div>
            </div>
        );
    }

    if (!paper || !summary) {
        return (
            <div className="max-w-6xl mx-auto py-20 text-center">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Summary not found</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 text-sage hover:text-sage-dark transition-colors"
                >
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between mb-8 py-2 border-b border-gray-100">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-500 hover:text-charcoal transition-colors px-2 py-1 rounded"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Library</span>
                </button>

                <div className="flex gap-2">
                    <ActionButton icon={Share2} label="Share" />
                    <ActionButton icon={Download} label="Download PDF" primary />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Col: Metadata (Sticky only on Large screens) */}
                <div className="lg:col-span-3">
                    <div className="lg:sticky lg:top-40 space-y-6">
                        <div>
                            <span className="text-xs font-bold text-accent uppercase tracking-widest mb-2 block">Paper Title</span>
                            <h1 className="font-display font-bold text-2xl lg:text-3xl text-charcoal leading-tight">
                                {paper.title}
                            </h1>
                        </div>

                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Authors</span>
                            <p className="text-gray-600 text-sm leading-relaxed">{paper.authors.join(', ')}</p>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                            <h4 className="text-sm font-semibold text-charcoal mb-4 flex items-center gap-2">
                                <Target size={16} className="text-sage" />
                                Key Findings
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {summary.key_findings.map((finding, idx) => (
                                    <span key={idx} className="bg-white border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full shadow-sm">
                                        {finding}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Content */}
                <div className="lg:col-span-9 space-y-8 relative z-10">

                    {/* Hypothesis Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border-l-4 border-sage p-8 rounded-r-xl shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-4 text-sage-dark">
                            <Lightbulb size={20} />
                            <h3 className="font-display font-bold text-lg">Research Hypothesis</h3>
                        </div>
                        <p className="text-lg text-charcoal leading-relaxed font-display italic">
                            "{summary.hypothesis}"
                        </p>
                    </motion.div>

                    <Section title="Introduction & Context" icon={FileText}>
                        {summary.introduction}
                    </Section>

                    <Section title="Methodology" icon={Microscope}>
                        {summary.methodology}
                    </Section>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 bg-amber-100 text-amber-600 rounded">
                                <Target size={18} />
                            </div>
                            <h3 className="font-display font-bold text-xl text-charcoal">Results & Discussion</h3>
                        </div>

                        {summary.results.map((result, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-white border border-gray-100 rounded-lg p-6 hover:shadow-md transition-shadow relative"
                            >
                                <div className="absolute top-6 left-0 w-1 h-8 bg-amber-400 rounded-r"></div>
                                <h4 className="font-bold text-charcoal mb-2">{result.label}</h4>
                                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{result.content}</p>
                                <div className="bg-offwhite-dark p-4 rounded text-sm text-gray-500 italic">
                                    <span className="font-semibold text-charcoal not-italic mr-2">Analysis:</span>
                                    {result.discussion}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="bg-charcoal text-white p-8 rounded-xl shadow-lg mt-8"
                    >
                        <h3 className="font-display font-bold text-xl mb-4 text-accent">Conclusion</h3>
                        <p className="leading-relaxed opacity-90">
                            {summary.conclusion}
                        </p>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

const Section = ({ title, icon: Icon, children }: any) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-offwhite-dark rounded text-gray-500">
                        <Icon size={18} />
                    </div>
                    <h3 className="font-display font-bold text-xl text-charcoal">{title}</h3>
                </div>
                <ChevronDown className={`text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-50">
                            {children}
                            <div className="mt-4 flex justify-end">
                                <button className="flex items-center gap-1 text-xs font-semibold text-sage hover:text-sage-dark uppercase tracking-wider">
                                    <Copy size={12} /> Copy Section
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const ActionButton = ({ icon: Icon, label, primary }: any) => (
    <button className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${primary
            ? 'bg-charcoal text-white hover:bg-black shadow-lg hover:shadow-xl'
            : 'bg-white text-charcoal border border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
    `}>
        <Icon size={16} />
        <span className="hidden sm:inline">{label}</span>
    </button>
);