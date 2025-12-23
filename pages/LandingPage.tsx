import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Zap,
  Clock,
  FileText,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  Shield,
  Upload
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: 'Upload Any Paper',
      description: 'Simply drag and drop your PDF research papers. We support all major academic formats.'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Summaries',
      description: 'Get comprehensive summaries with key findings, methodology, and conclusions in seconds.'
    },
    {
      icon: Clock,
      title: 'Save Hours of Reading',
      description: 'Quickly understand complex papers without spending hours reading through dense text.'
    },
    {
      icon: BookOpen,
      title: 'Organized Library',
      description: 'Keep all your research organized in one place with folders and tags.'
    }
  ];

  const benefits = [
    'Extract key findings automatically',
    'Understand methodology at a glance',
    'Identify research gaps',
    'Generate citation summaries',
    'Export notes and highlights',
    'Collaborate with your team'
  ];

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-offwhite/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-accent to-purple-600" />
            <span className="font-display font-bold text-xl tracking-tight text-charcoal">STEM Stack</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/auth')}
              className="text-gray-600 hover:text-charcoal font-medium transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="bg-charcoal hover:bg-black text-white font-medium py-2 px-5 rounded-lg transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-sage/10 text-sage px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap size={16} />
                <span>AI-Powered Research Assistant</span>
              </div>

              <h1 className="font-display text-5xl lg:text-6xl font-bold text-charcoal leading-tight mb-6">
                Read Research Papers
                <span className="text-sage"> 10x Faster</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Upload any scientific paper and get instant AI-generated summaries.
                Understand key findings, methodology, and conclusions in minutes, not hours.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/auth')}
                  className="bg-charcoal hover:bg-black text-white font-semibold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-charcoal/20"
                >
                  <span>Start for Free</span>
                  <ArrowRight size={20} />
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white hover:bg-gray-50 text-charcoal font-semibold py-4 px-8 rounded-xl border border-gray-200 transition-all"
                >
                  See How It Works
                </button>
              </div>

              <div className="flex items-center gap-6 mt-10 pt-10 border-t border-gray-200">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-sage to-emerald-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Trusted by 2,000+ researchers</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Dashboard Preview */}
              <div className="bg-white rounded-2xl shadow-2xl shadow-charcoal/10 border border-gray-100 overflow-hidden">
                <div className="bg-charcoal px-4 py-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center">
                      <FileText size={20} className="text-sage" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal">Attention Is All You Need</h3>
                      <p className="text-sm text-gray-500">Vaswani et al. • 2017</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-sage/5 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-sage mb-2">Key Findings</h4>
                      <p className="text-sm text-gray-600">
                        The Transformer architecture achieves state-of-the-art results using only attention mechanisms,
                        eliminating the need for recurrence and convolutions...
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Machine Learning</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">NLP</span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Deep Learning</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute -left-8 top-1/4 bg-white rounded-xl shadow-lg p-4 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">Summary Ready</p>
                    <p className="text-xs text-gray-500">In just 30 seconds</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="absolute -right-4 bottom-1/4 bg-charcoal text-white rounded-xl shadow-lg p-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  <span className="text-sm font-medium">AI Analysis Complete</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold text-charcoal mb-4">
              Everything You Need to
              <span className="text-sage"> Accelerate Research</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for researchers, students, and academics.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-offwhite rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-sage" />
                </div>
                <h3 className="font-display font-semibold text-lg text-charcoal mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-4xl font-bold text-charcoal mb-6">
                Focus on What Matters:
                <span className="text-sage"> Your Research</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Stop spending hours reading through papers. Let AI extract the essential information
                so you can focus on making breakthroughs.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 size={20} className="text-sage flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-charcoal rounded-3xl p-8 text-white relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Clock size={32} className="text-sage" />
                  </div>
                  <div>
                    <p className="text-4xl font-bold">42+</p>
                    <p className="text-gray-400">Hours saved per month</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Papers analyzed</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-sage rounded-full" />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Key findings extracted</span>
                    <span className="font-semibold">892</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-accent rounded-full" />
                  </div>
                </div>
              </div>

              <div className="absolute -right-10 -bottom-10 opacity-10">
                <BookOpen size={200} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            <div className="flex items-center gap-3 text-gray-400">
              <Shield size={24} />
              <span className="font-medium">Secure & Private</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Users size={24} />
              <span className="font-medium">2,000+ Researchers</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Zap size={24} />
              <span className="font-medium">Instant Analysis</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <FileText size={24} />
              <span className="font-medium">50,000+ Papers Processed</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-charcoal mb-6">
              Ready to Transform Your
              <span className="text-sage"> Research Workflow?</span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Join thousands of researchers who are already saving time and gaining deeper insights with STEM Stack.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="bg-charcoal hover:bg-black text-white font-semibold py-4 px-10 rounded-xl inline-flex items-center gap-3 transition-all shadow-lg shadow-charcoal/20 text-lg"
            >
              <span>Get Started for Free</span>
              <ArrowRight size={22} />
            </button>
            <p className="text-sm text-gray-500 mt-4">No credit card required</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-purple-600" />
              <span className="font-display font-bold text-lg">STEM Stack</span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} STEM Stack. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
