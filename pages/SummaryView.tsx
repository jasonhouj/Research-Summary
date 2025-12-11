import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Share2, Download, ArrowLeft, Copy, Lightbulb, Microscope, FileText, Target } from 'lucide-react';
import { PaperSummary } from '../types';

// Mock Data
const mockSummary: PaperSummary = {
  id: '1',
  paper_id: '1',
  hypothesis: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The authors hypothesize that a simple network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely, can achieve superior results.",
  introduction: "Recurrent neural networks, long short-term memory (LSTM) and gated recurrent neural networks have been established as state of the art approaches in sequence modeling. However, their sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths.",
  methodology: "The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder. The model architecture uses multi-head attention to allow the model to jointly attend to information from different representation subspaces at different positions.",
  results: [
    { label: "Machine Translation", content: "On the WMT 2014 English-to-German translation task, the big Transformer model establishes a new state-of-the-art BLEU score of 28.4.", discussion: "This is a significant improvement over the existing best results, including ensembles, and training took 3.5 days on 8 P100 GPUs." },
    { label: "Training Efficiency", content: "The Transformer generalizes well to other tasks, such as English constituency parsing.", discussion: "Training costs are significantly reduced compared to recurrent layers, enabling training on larger datasets." }
  ],
  conclusion: "The Transformer is the first sequence transduction model relying entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention. For translation tasks, the Transformer can be trained significantly faster than architectures based on recurrent or convolutional layers.",
  key_findings: [
    "Attention mechanisms alone are sufficient",
    "Superior parallelization capabilities",
    "New state-of-the-art BLEU scores",
    "Reduced training costs"
  ]
};

export const SummaryView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // In a real app, fetch summary based on ID. Using mock.
  const summary = mockSummary;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between mb-8 sticky top-20 bg-offwhite/95 backdrop-blur py-2 z-30 border-b border-gray-100 transition-all">
        <button 
          onClick={() => navigate(-1)}
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
                  Attention Is All You Need
                </h1>
              </div>
              
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Authors</span>
                <p className="text-gray-600 text-sm leading-relaxed">Vaswani A., Shazeer N., Parmar N., Uszkoreit J., Jones L., Gomez A. N., Kaiser L., Polosukhin I.</p>
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