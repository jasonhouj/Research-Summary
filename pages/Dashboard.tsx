import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PaperCard } from '../components/PaperCard';
import { UploadZone } from '../components/UploadZone';
import { Paper, PaperStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, FileText, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { processPDF, uploadPaperPages, extractPDFText } from '../lib/pdfProcessor';
import { triggerPaperSummary, isN8nConfigured, convertToSummaryFormat } from '../lib/n8nService';

const statsData = [
  { name: 'Mon', papers: 2 },
  { name: 'Tue', papers: 4 },
  { name: 'Wed', papers: 1 },
  { name: 'Thu', papers: 8 },
  { name: 'Fri', papers: 5 },
  { name: 'Sat', papers: 2 },
  { name: 'Sun', papers: 3 },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPapers, setTotalPapers] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<{ stage: string; progress: number } | null>(null);

  useEffect(() => {
    if (user) {
      fetchPapers();
    }
  }, [user]);

  const fetchPapers = async () => {
    setLoading(true);
    const { data, error, count } = await supabase
      .from('papers')
      .select('*', { count: 'exact' })
      .eq('user_id', user?.id)
      .order('upload_date', { ascending: false })
      .limit(6);

    if (data && !error) {
      setPapers(data.map(p => ({
        ...p,
        authors: p.authors || []
      })));
      setTotalPapers(count || 0);
    }
    setLoading(false);
  };

  const handleUpload = async (file: File) => {
    if (!user) return;

    try {
      // Stage 1: Create paper record
      setUploadProgress({ stage: 'Creating paper record...', progress: 5 });

      const newPaper = {
        user_id: user.id,
        title: file.name.replace('.pdf', '').replace(/_/g, ' ').replace(/-/g, ' '),
        authors: ['Unknown Author'],
        upload_date: new Date().toISOString(),
        status: 'processing' as PaperStatus,
        original_filename: file.name
      };

      const { data: paperData, error: paperError } = await supabase
        .from('papers')
        .insert(newPaper)
        .select()
        .single();

      if (paperError || !paperData) {
        throw new Error('Failed to create paper record');
      }

      // Add to UI immediately
      setPapers(prev => [{ ...paperData, authors: paperData.authors || [] }, ...prev]);
      setTotalPapers(prev => prev + 1);

      // Stage 2: Process PDF to images
      setUploadProgress({ stage: 'Processing PDF pages...', progress: 15 });

      const processedPages = await processPDF(file, (current, total) => {
        const progress = 15 + Math.round((current / total) * 40);
        setUploadProgress({ stage: `Processing page ${current} of ${total}...`, progress });
      });

      // Stage 3: Upload images to storage
      setUploadProgress({ stage: 'Uploading page images...', progress: 60 });

      await uploadPaperPages(user.id, paperData.id, processedPages, (current, total) => {
        const progress = 60 + Math.round((current / total) * 30);
        setUploadProgress({ stage: `Uploading page ${current} of ${total}...`, progress });
      });

      // Stage 4: Update paper with page count
      setUploadProgress({ stage: 'Finalizing...', progress: 90 });

      await supabase
        .from('papers')
        .update({ page_count: processedPages.length, status: 'pending' as PaperStatus })
        .eq('id', paperData.id);

      // Stage 5: Trigger n8n workflow for AI summary (if configured)
      if (isN8nConfigured()) {
        setUploadProgress({ stage: 'Extracting text from PDF...', progress: 91 });

        try {
          // Extract text from PDF client-side (more reliable than n8n's PDF extraction)
          const pdfText = await extractPDFText(file);
          console.log('Extracted PDF text length:', pdfText.length);

          setUploadProgress({ stage: 'Generating AI summary (this may take a moment)...', progress: 93 });

          // Call n8n webhook with extracted text
          const n8nResponse = await triggerPaperSummary(pdfText, file.name, (stage) => {
            setUploadProgress({ stage, progress: 95 });
          });

          setUploadProgress({ stage: 'Saving summary to database...', progress: 97 });

          // Convert n8n response to our database format
          const summaryData = convertToSummaryFormat(n8nResponse);

          // Insert summary into Supabase
          const { error: summaryError } = await supabase
            .from('summaries')
            .insert({
              paper_id: paperData.id,
              ...summaryData
            });

          if (summaryError) {
            console.error('Failed to save summary:', summaryError);
            throw new Error('Failed to save summary to database');
          }

          // Update paper with title from AI and mark as completed
          const aiTitle = n8nResponse.paper.title !== 'Title not found'
            ? n8nResponse.paper.title
            : paperData.title;

          await supabase
            .from('papers')
            .update({
              title: aiTitle,
              status: 'completed' as PaperStatus
            })
            .eq('id', paperData.id);

          // Update local state
          setPapers(prev => prev.map(p =>
            p.id === paperData.id
              ? { ...p, page_count: processedPages.length, title: aiTitle, status: 'completed' as PaperStatus }
              : p
          ));
        } catch (n8nError) {
          console.error('AI summary generation failed:', n8nError);
          // Update status to failed so user knows something went wrong
          await supabase
            .from('papers')
            .update({ status: 'failed' as PaperStatus })
            .eq('id', paperData.id);

          setPapers(prev => prev.map(p =>
            p.id === paperData.id
              ? { ...p, page_count: processedPages.length, status: 'failed' as PaperStatus }
              : p
          ));

          // Show error but don't stop the flow
          alert('AI summary generation failed. You can retry later.');
        }
      } else {
        // No n8n configured - just update local state with pending status
        setPapers(prev => prev.map(p =>
          p.id === paperData.id
            ? { ...p, page_count: processedPages.length, status: 'pending' as PaperStatus }
            : p
        ));
      }

      setUploadProgress({ stage: 'Complete!', progress: 100 });

      // Clear progress after a short delay
      setTimeout(() => setUploadProgress(null), 1500);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload paper. Please try again.');
      setUploadProgress(null);
    }
  };

  const handleView = (id: string) => {
    navigate(`/paper/${id}`);
  };

  const handleDelete = async (paperId: string) => {
    if (!confirm('Delete this paper? This action cannot be undone.')) return;

    const { error } = await supabase
      .from('papers')
      .delete()
      .eq('id', paperId)
      .eq('user_id', user?.id);

    if (!error) {
      setPapers(papers.filter(p => p.id !== paperId));
      setTotalPapers(prev => prev - 1);
    } else {
      console.error('Error deleting paper:', error);
      alert('Failed to delete paper. Please try again.');
    }
  };

  const loadDemoPaper = async () => {
    if (!user) return;

    // Insert the demo paper
    const demoPaper = {
      user_id: user.id,
      title: 'Attention Is All You Need',
      authors: ['Vaswani A.', 'Shazeer N.', 'Parmar N.', 'Uszkoreit J.', 'Jones L.', 'Gomez A. N.', 'Kaiser L.', 'Polosukhin I.'],
      upload_date: new Date().toISOString(),
      status: 'completed' as PaperStatus,
      original_filename: 'attention_is_all_you_need.pdf'
    };

    const { data: paperData, error: paperError } = await supabase
      .from('papers')
      .insert(demoPaper)
      .select()
      .single();

    if (paperData && !paperError) {
      // Insert the summary for this paper
      const demoSummary = {
        paper_id: paperData.id,
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
        ],
        conflict_of_interest: "The authors are affiliated with Google Brain and Google Research. Some authors may hold equity in Alphabet Inc. The research was conducted using Google computational resources. No external funding sources were disclosed."
      };

      const { data: summaryData, error: summaryError } = await supabase
        .from('summaries')
        .insert(demoSummary)
        .select()
        .single();

      if (summaryError) {
        console.error('Error inserting summary:', summaryError);
        alert('Paper created but summary failed. Please check the console for details or run the SQL migration in supabase/005_fix_summaries_rls.sql');
      } else {
        console.log('Demo paper and summary created successfully');
      }

      // Refresh the papers list
      fetchPapers();
    } else if (paperError) {
      console.error('Error inserting paper:', paperError);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const processingCount = papers.filter(p => p.status === 'processing' || p.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Welcome Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end justify-between"
          >
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Overview</p>
              <h2 className="text-3xl font-display font-bold text-charcoal">
                {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Researcher'}
              </h2>
            </div>
            <p className="text-sm text-gray-400 hidden sm:block">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={FileText} label="Total Papers" value={totalPapers.toString()} delay={0.1} />
            <StatCard icon={BookOpen} label="Reading Time" value="42h" delay={0.2} sub="Saved this month" />
            <StatCard icon={Clock} label="Processing" value={processingCount.toString()} delay={0.3} active={processingCount > 0} />
            <StatCard icon={Zap} label="Insights" value="1.2k" delay={0.4} />
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-64">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-charcoal">Activity</h3>
              <span className="text-xs text-sage font-medium bg-sage/10 px-2 py-1 rounded">Weekly View</span>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={statsData}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="papers" radius={[4, 4, 0, 0]}>
                  {statsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 3 ? '#8fbc8f' : '#e5e7eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upload Column */}
        <div className="space-y-6">
          <h3 className="font-display font-semibold text-xl text-charcoal">Quick Upload</h3>

          {/* Upload Progress Indicator */}
          {uploadProgress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <Loader2 size={18} className="text-sage animate-spin" />
                <span className="text-sm text-charcoal font-medium">{uploadProgress.stage}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-sage rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          <UploadZone onUpload={handleUpload} />

          <div className="bg-charcoal text-white p-6 rounded-xl relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
              <h4 className="font-display text-lg font-bold mb-2">Connect Sources</h4>
              <p className="text-gray-400 text-sm mb-4">Auto-sync with Google Scholar or Zotero.</p>
              <button className="text-xs font-bold uppercase tracking-widest text-accent group-hover:text-white transition-colors">Configure &rarr;</button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BookOpen size={120} />
            </div>
          </div>
        </div>
      </section>

      {/* Papers Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-xl text-charcoal">Recent Papers</h3>
          <div className="flex gap-2">
            <select className="bg-white border border-gray-200 text-sm text-gray-600 rounded-lg px-3 py-2 outline-none focus:border-sage">
              <option>All Statuses</option>
              <option>Completed</option>
              <option>Processing</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading papers...</div>
        ) : papers.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No papers yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload your first research paper to get started</p>
            <button
              onClick={loadDemoPaper}
              className="mt-4 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors text-sm font-medium"
            >
              Load Demo Paper
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                onView={handleView}
                onDelete={() => handleDelete(paper.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, delay, active }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className={`p-4 rounded-xl border ${active ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-gray-100'} shadow-sm`}
  >
    <div className={`mb-3 ${active ? 'text-sage' : 'text-gray-400'}`}>
      <Icon size={20} />
    </div>
    <div className="font-display font-bold text-2xl mb-1">{value}</div>
    <div className={`text-xs font-medium ${active ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
  </motion.div>
);