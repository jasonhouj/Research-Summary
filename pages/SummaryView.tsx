import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Share2, Download, ArrowLeft, Copy, Lightbulb, Microscope, FileText, Target, AlertTriangle, Users, ExternalLink, BookOpen, X, FlaskConical, MessageSquare } from 'lucide-react';
import { PaperSummary, TerminologyItem, LimitationItem, MethodSection, DocumentSection } from '../types';
import { supabase } from '../lib/supabaseClient';

interface Paper {
    id: string;
    title: string;
    authors: string[] | null;
    file_url?: string;
}

export const SummaryView: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [paper, setPaper] = useState<Paper | null>(null);
    const [summary, setSummary] = useState<PaperSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'terminology' | 'limitations'>('terminology');

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

    // Get authors as array, handling null/undefined cases
    const authorsArray = paper.authors && Array.isArray(paper.authors) ? paper.authors : [];

    const handleViewPdf = () => {
        if (paper.file_url) {
            window.open(paper.file_url, '_blank');
        }
    };

    // Extract data from summary
    const terminologyData: TerminologyItem[] = summary?.terminology_to_clarify || [];
    const limitationsData: LimitationItem[] = summary?.gaps_and_limitations || [];
    const methodSections: MethodSection[] = summary?.method_sections || [];
    const resultsSections: DocumentSection[] = summary?.results_sections || [];
    const discussionSections: DocumentSection[] = summary?.discussion_sections || [];

    const hasTerminology = terminologyData.length > 0;
    const hasLimitations = limitationsData.length > 0;
    const hasMethodSections = methodSections.length > 0;
    const hasResultsSections = resultsSections.length > 0;
    const hasDiscussionSections = discussionSections.length > 0;

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Sidebar Tab - Terminology & Limitations */}
            <>
                {/* Tab Button (visible when panel is closed) */}
                <AnimatePresence>
                    {!sidebarOpen && (
                        <motion.button
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            onClick={() => setSidebarOpen(true)}
                            className="fixed right-0 top-1/3 z-40 bg-purple-600 hover:bg-purple-700 text-white px-3 py-4 rounded-l-lg shadow-lg flex flex-col items-center gap-2 transition-colors"
                        >
                            <BookOpen size={20} />
                            <span className="text-xs font-medium writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
                                Reference
                            </span>
                            <ChevronRight size={16} className="rotate-180" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Sliding Panel */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
                        >
                            {/* Panel Header with Tabs */}
                            <div className="border-b border-gray-100">
                                <div className="flex items-center justify-between p-4 bg-purple-50">
                                    <h3 className="font-display font-bold text-lg text-charcoal">Reference</h3>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors text-gray-500 hover:text-charcoal"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                {/* Tab Buttons */}
                                <div className="flex border-t border-gray-100">
                                    <button
                                        onClick={() => setActiveTab('terminology')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                            activeTab === 'terminology'
                                                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <BookOpen size={16} />
                                        Terminology
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('limitations')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                            activeTab === 'limitations'
                                                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/50'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <AlertTriangle size={16} />
                                        Limitations
                                    </button>
                                </div>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {activeTab === 'terminology' ? (
                                    hasTerminology ? (
                                        terminologyData.map((item: TerminologyItem, idx: number) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-colors"
                                            >
                                                <h4 className="font-semibold text-charcoal text-sm mb-2 flex items-start gap-2">
                                                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-medium mt-0.5">
                                                        {idx + 1}
                                                    </span>
                                                    {item.term}
                                                </h4>
                                                <p className="text-gray-600 text-sm leading-relaxed pl-7">
                                                    {item.explanation}
                                                </p>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
                                            <p className="text-sm">No terminology available</p>
                                            <p className="text-xs mt-1">Upload a new paper to generate terminology</p>
                                        </div>
                                    )
                                ) : (
                                    hasLimitations ? (
                                        limitationsData.map((item: LimitationItem, idx: number) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-colors"
                                            >
                                                <h4 className="font-semibold text-charcoal text-sm mb-2 flex items-start gap-2">
                                                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded font-medium mt-0.5">
                                                        {idx + 1}
                                                    </span>
                                                    {item.issue}
                                                </h4>
                                                <p className="text-gray-600 text-sm leading-relaxed pl-7">
                                                    {item.reason}
                                                </p>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
                                            <p className="text-sm">No limitations identified</p>
                                            <p className="text-xs mt-1">Upload a new paper to analyze gaps</p>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Panel Footer */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <p className="text-xs text-gray-500 text-center">
                                    {activeTab === 'terminology'
                                        ? `${terminologyData.length} terms defined`
                                        : `${limitationsData.length} limitations identified`
                                    }
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Backdrop */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/20 z-40"
                        />
                    )}
                </AnimatePresence>
            </>

            {/* Navigation & Actions */}
            <div className="flex items-center justify-between mb-8 py-2 border-b border-gray-100">
                <button
                    onClick={() => navigate('/papers')}
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

            {/* Main Layout: Left Sidebar + Right Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar: Metadata */}
                <div className="lg:col-span-4">
                    <div className="lg:sticky lg:top-24 space-y-6">
                        {/* Paper Title */}
                        <div>
                            <span className="text-xs font-bold text-accent uppercase tracking-widest mb-2 block">Paper Title</span>
                            <h1 className="font-display font-bold text-2xl lg:text-3xl text-charcoal leading-tight">
                                {paper.title}
                            </h1>
                        </div>

                        {/* Authors */}
                        {authorsArray.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Users size={14} className="text-gray-400" />
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Authors</span>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">{authorsArray.join(', ')}</p>
                            </div>
                        )}

                        {/* View Original PDF Button */}
                        <button
                            onClick={handleViewPdf}
                            disabled={!paper.file_url}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors shadow-sm ${paper.file_url
                                ? 'bg-sage text-white hover:bg-sage-dark'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <FileText size={18} />
                            <span className="font-medium">
                                {paper.file_url ? 'View Original PDF' : 'PDF Not Available'}
                            </span>
                            {paper.file_url && <ExternalLink size={16} />}
                        </button>

                        {/* Key Findings */}
                        <div className="pt-6 border-t border-gray-200">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Target size={14} className="text-sage" />
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

                        {/* Conflict of Interest */}
                        {summary.conflict_of_interest && (
                            <div className="pt-6 border-t border-gray-200">
                                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <AlertTriangle size={14} />
                                    Conflict of Interest
                                </h4>
                                <p className="text-amber-800 text-xs leading-relaxed bg-amber-50 p-3 rounded-lg border border-amber-100">
                                    {summary.conflict_of_interest}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Content: Summary Sections */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Hypothesis Card */}
                    <motion.div
                        data-section="hypothesis"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border-l-4 border-sage p-8 rounded-r-xl shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-4 text-sage-dark">
                            <Lightbulb size={20} />
                            <h3 className="font-display font-bold text-lg">Abstract & Hypothesis</h3>
                        </div>
                        <p className="text-lg text-charcoal leading-relaxed font-display italic">
                            "{summary.hypothesis}"
                        </p>
                    </motion.div>

                    {/* Abstract Summary */}
                    {summary.abstract_summary && (
                        <motion.div
                            data-section="abstract"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border-l-4 border-sage-dark p-8 rounded-r-xl shadow-sm"
                        >
                            <div className="flex items-center gap-2 mb-4 text-sage-dark">
                                <FileText size={20} />
                                <h3 className="font-display font-bold text-lg">Abstract Summary</h3>
                            </div>
                            <p className="text-lg text-charcoal leading-relaxed font-display">
                                {summary.abstract_summary}
                            </p>
                        </motion.div>
                    )}

                    {/* Introduction */}
                    <div data-section="introduction">
                        <Section title="Introduction" icon={FileText}>
                            {summary.introduction}
                        </Section>
                    </div>

                    {/* Methodology - with subsections from method_and_materials node */}
                    <div data-section="methodology">
                        <SectionWithSubsections
                            title="Methods & Materials"
                            icon={FlaskConical}
                            accentColor="blue"
                            subsections={methodSections.map(s => ({
                                title: s.subsection_title,
                                content: s.description
                            }))}
                            fallbackContent={summary.methodology}
                        />
                    </div>

                    {/* Results Section - from document_summary node */}
                    <div data-section="results">
                        <SectionWithSubsections
                            title="Results"
                            icon={Target}
                            accentColor="green"
                            subsections={
                                hasResultsSections
                                    ? resultsSections.map(s => ({
                                        title: s.subsection_title || s.section_title,
                                        content: s.content
                                    }))
                                    : summary.results.map(r => ({
                                        title: r.label,
                                        content: r.content
                                    }))
                            }
                        />
                    </div>

                    {/* Discussion Section - from document_summary node */}
                    <div data-section="discussion">
                        <SectionWithSubsections
                            title="Discussion"
                            icon={MessageSquare}
                            accentColor="amber"
                            subsections={
                                hasDiscussionSections
                                    ? discussionSections.map(s => ({
                                        title: s.subsection_title || s.section_title,
                                        content: s.content
                                    }))
                                    : []
                            }
                            fallbackContent={
                                summary.results.length > 0 && summary.results[0].discussion
                                    ? summary.results[0].discussion
                                    : undefined
                            }
                        />
                    </div>

                    {/* Conclusion */}
                    <motion.div
                        data-section="conclusion"
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

const Section = ({ title, icon: Icon, children, copyText }: { title: string; icon: React.ElementType; children: React.ReactNode; copyText?: string }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const textToCopy = copyText || (typeof children === 'string' ? children : '');
        if (textToCopy) {
            await navigator.clipboard.writeText(`${title}\n\n${textToCopy}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy();
                                    }}
                                    className="flex items-center gap-1 text-xs font-semibold text-sage hover:text-sage-dark uppercase tracking-wider"
                                >
                                    <Copy size={12} /> {copied ? 'Copied!' : 'Copy Section'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
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

interface SubsectionItem {
    title: string;
    content: string;
}

const SectionWithSubsections = ({
    title,
    icon: Icon,
    subsections,
    fallbackContent,
    accentColor = 'gray'
}: {
    title: string;
    icon: React.ElementType;
    subsections: SubsectionItem[];
    fallbackContent?: string;
    accentColor?: 'blue' | 'green' | 'amber' | 'gray';
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [copied, setCopied] = useState(false);

    const colorClasses = {
        blue: 'bg-blue-400',
        green: 'bg-green-400',
        amber: 'bg-amber-400',
        gray: 'bg-gray-400'
    };

    const iconBgClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        amber: 'bg-amber-100 text-amber-600',
        gray: 'bg-offwhite-dark text-gray-500'
    };

    const handleCopy = async () => {
        let textToCopy = `${title}\n\n`;
        if (subsections.length > 0) {
            textToCopy += subsections.map(item => `${item.title}\n${item.content}`).join('\n\n');
        } else if (fallbackContent) {
            textToCopy += fallbackContent;
        }
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded ${iconBgClasses[accentColor]}`}>
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
                        <div className="p-6 pt-0 border-t border-gray-50">
                            {subsections.length > 0 ? (
                                <div className="space-y-4">
                                    {subsections.map((item, idx) => (
                                        <div key={idx} className="relative pl-4">
                                            <div className={`absolute top-1 left-0 w-1 h-6 ${colorClasses[accentColor]} rounded-r`}></div>
                                            <h4 className="font-bold text-charcoal mb-2">{item.title}</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed">{item.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : fallbackContent ? (
                                <p className="text-gray-600 leading-relaxed">{fallbackContent}</p>
                            ) : (
                                <p className="text-gray-500 text-center">No content available.</p>
                            )}
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy();
                                    }}
                                    className="flex items-center gap-1 text-xs font-semibold text-sage hover:text-sage-dark uppercase tracking-wider"
                                >
                                    <Copy size={12} /> {copied ? 'Copied!' : 'Copy Section'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
