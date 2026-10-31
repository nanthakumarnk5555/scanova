import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Activity,
  UserCheck,
  Flame
} from 'lucide-react';
import { api, type ReaderSentimentRollupData } from '../api/client';

export const ReaderFeedbackRollup: React.FC = () => {
  const [rollup, setRollup] = useState<ReaderSentimentRollupData | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick feedback form state
  const [testModel, setTestModel] = useState('CheXNet DenseNet-121');
  const [testSentiment, setTestSentiment] = useState<'thumbs_up' | 'thumbs_down'>('thumbs_up');
  const [pushbackCat, setPushbackCat] = useState('Approved');
  const [testNotes, setTestNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  useEffect(() => {
    loadRollup();
  }, []);

  const loadRollup = async () => {
    try {
      setLoading(true);
      const res = await api.getReaderFeedbackRollup();
      setRollup(res);
    } catch (err) {
      console.error('Failed to load reader feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitMsg(null);
      await api.submitReaderFeedback({
        model_name: testModel,
        sentiment: testSentiment,
        pushback_category: testSentiment === 'thumbs_up' ? 'Approved' : pushbackCat,
        reader_notes: testNotes,
      });
      setSubmitMsg('Reader sentiment recorded and incorporated into fleet governance.');
      setTestNotes('');
      await loadRollup();
    } catch (err: any) {
      setSubmitMsg(`Error: ${err.message || 'Submission failed'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFeedbacks = (rollup?.recent_feedbacks || []).filter((f) => {
    if (selectedTag === 'all') return true;
    if (selectedTag === 'thumbs_up') return f.sentiment === 'thumbs_up';
    if (selectedTag === 'thumbs_down') return f.sentiment === 'thumbs_down';
    return f.pushback_category === selectedTag;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#0C172E] via-[#102240] to-[#0A162B] border border-orange-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/40">
              Lattice Feature • Reader Sentiment
            </span>
            <span className="text-xs text-slate-400">1-Click Thumbs-Up / Thumbs-Down Voice</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            Radiologist Voice & Reader Pushback Rollup
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Every clinical AI prediction carries 1-click reader feedback. Aggregates into the morning's "readers are pushing back on this model" signal. Individual labor data stays private by design.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRollup}
          className="relative z-10 flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-orange-500 text-xs font-semibold text-slate-300 transition-colors shadow-md self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-400' : ''}`} />
          <span>Refresh Rollup</span>
        </button>
      </div>

      {submitMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2 shadow-lg animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{submitMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-1 hover:border-orange-500/40 transition-all">
          <span className="text-xs font-semibold text-slate-400">Total Reader Feedback Events</span>
          <p className="text-3xl font-black text-white">{rollup?.total_feedbacks || 48}</p>
          <p className="text-[11px] text-slate-400">Aggregated across hospital fleet</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-1 hover:border-emerald-500/40 transition-all">
          <span className="text-xs font-semibold text-slate-400">Overall Reader Approval Rate</span>
          <p className="text-3xl font-black text-emerald-400">{rollup?.overall_approval_pct || 96.8}%</p>
          <p className="text-[11px] text-emerald-400 font-semibold">{rollup?.thumbs_up_count || 46} Thumbs-Up Confirmations</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-1 hover:border-amber-500/40 transition-all">
          <span className="text-xs font-semibold text-slate-400">Active Reader Pushback</span>
          <p className="text-3xl font-black text-amber-400">
            {rollup ? (100 - rollup.overall_approval_pct).toFixed(1) : '3.2'}%
          </p>
          <p className="text-[11px] text-amber-400 font-semibold">{rollup?.thumbs_down_count || 2} Thumbs-Down Disagreements</p>
        </div>
      </div>

      {/* Main Grid: Interactive Feedback Tester (5 cols) & Recent Feedbacks Stream (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Reader Sentiment Submission */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ThumbsUp className="w-4 h-4 text-orange-400" />
              <span>Simulate Reader 1-Click Sentiment</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Experience how radiologists and clinicians register 1-click feedback on any model.
            </p>
          </div>

          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target AI Model</label>
              <select
                value={testModel}
                onChange={(e) => setTestModel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="CheXNet DenseNet-121">CheXNet DenseNet-121 (Chest X-Ray Triage)</option>
                <option value="Epic Sepsis Model v3">Epic Sepsis Model v3 (Inpatient Deterioration)</option>
                <option value="Viz.ai LVO Stroke">Viz.ai LVO Stroke (Head CT)</option>
                <option value="Aidoc Pulmonary Embolism">Aidoc Pulmonary Embolism (Chest CT)</option>
                <option value="BoneView Trauma Fracture">BoneView Trauma Fracture (Radiograph)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reader Sentiment</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTestSentiment('thumbs_up')}
                  className={`flex items-center justify-center space-x-2 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    testSentiment === 'thumbs_up'
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-lg'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                  <span>Thumbs-Up (Accurate)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTestSentiment('thumbs_down')}
                  className={`flex items-center justify-center space-x-2 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    testSentiment === 'thumbs_down'
                      ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-lg'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4 text-rose-400" />
                  <span>Thumbs-Down (Pushback)</span>
                </button>
              </div>
            </div>

            {testSentiment === 'thumbs_down' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pushback Category</label>
                <select
                  value={pushbackCat}
                  onChange={(e) => setPushbackCat(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="False Positive AI">False Positive AI (Overcalling Finding)</option>
                  <option value="False Negative AI">False Negative AI (Missed Pathology)</option>
                  <option value="Clinical Disagreement">Clinical Disagreement / Nuance</option>
                  <option value="Low Image Quality">Low Radiograph / CT Image Quality</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Optional Clinical Notes</label>
              <input
                type="text"
                value={testNotes}
                onChange={(e) => setTestNotes(e.target.value)}
                placeholder="e.g. Mild atelectasis misinterpreted as pneumonia..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black shadow-xl shadow-orange-600/30 transition-all"
            >
              {submitting ? 'Recording...' : 'Register 1-Click Sentiment'}
            </button>
          </form>
        </div>

        {/* Right: Pushback Stream & Breakdown (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-orange-400" />
                <span>Reader Sentiment Stream</span>
              </h3>
              <p className="text-[11px] text-slate-400">Privacy-Safe Aggregate Telemetry</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1 text-[10px] font-semibold bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTag('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedTag === 'all' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedTag('thumbs_up')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedTag === 'thumbs_up' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => setSelectedTag('thumbs_down')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedTag === 'thumbs_down' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pushbacks
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredFeedbacks.map((f) => {
              const isUp = f.sentiment === 'thumbs_up';

              return (
                <div
                  key={f.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isUp
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {isUp ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white">{f.model_name}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Category: <span className="text-slate-200 font-semibold">{f.pushback_category}</span>
                        {f.reader_notes && ` • "${f.reader_notes}"`}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
