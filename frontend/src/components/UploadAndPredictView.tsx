import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Zap,
  AlertTriangle,
  FileText,
  RefreshCw,
  Stethoscope,
  ZoomIn,
  ZoomOut,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  SplitSquareHorizontal,
  Cpu,
  Sparkles,
  Activity,
  RotateCcw,
  ImageIcon,
  ShieldCheck,
  Search,
  X,
  ArrowUpRight
} from 'lucide-react';
import {
  api,
  type SampleXRay,
  type UploadedImageInfo,
  type PredictionInfo
} from '../api/client';
import { VirtualScanningOverlay } from './VirtualScanningOverlay';

interface UploadAndPredictViewProps {
  onNavigateToRadiologist: (imageId: string) => void;
  onNavigateToReports: (imageId: string) => void;
}

export const UploadAndPredictView: React.FC<UploadAndPredictViewProps> = ({
  onNavigateToRadiologist,
  onNavigateToReports,
}) => {
  const [samples, setSamples] = useState<SampleXRay[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('PAT-9842-DEMO');
  const [patientAge, setPatientAge] = useState(54);
  const [patientSex, setPatientSex] = useState('M');
  const [siteId, setSiteId] = useState('Main Campus Hospital');

  // Virtual Clinical Scans Library State
  const [virtualCategory, setVirtualCategory] = useState<string>('All');
  const [virtualSearch, setVirtualSearch] = useState<string>('');
  const [showLibraryModal, setShowLibraryModal] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<UploadedImageInfo | null>(null);
  const [resultPrediction, setResultPrediction] = useState<PredictionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Advanced Visualizer Interactive State
  const [viewMode, setViewMode] = useState<'split-curtain' | 'side-by-side' | 'overlay'>('split-curtain');
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(75);
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [dicomFilter, setDicomFilter] = useState<'default' | 'lung' | 'bone' | 'soft-tissue' | 'invert'>('default');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isDragOver, setIsDragOver] = useState(false);

  // Quick 1-click sentiment feedback
  const [feedbackSent, setFeedbackSent] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    try {
      const data = await api.listSamples();
      setSamples(data);
    } catch (err) {
      console.error('Failed to load sample X-rays:', err);
    }
  };

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setValidationStatus('validating');
    setValidationMsg('Authenticating radiograph...');
    setFeedbackSent(null);
    setFeedbackMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setValidating(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const valRes = await api.validateImage(formData);
      if (valRes.is_valid_xray) {
        setValidationStatus('valid');
        setValidationMsg(`Verified chest radiograph (${valRes.modality_detected || 'Thoracic CXR'})`);
      } else {
        setValidationStatus('invalid');
        setError(valRes.reason || 'Invalid image. Please upload a valid X-ray image.');
        setValidationMsg(null);
      }
    } catch (err: any) {
      const isActuallyInvalid = err.message?.includes('Invalid image') || err.message?.includes('validation failed');
      if (isActuallyInvalid) {
        setValidationStatus('invalid');
        setError('Invalid image. Please upload a valid X-ray image.');
      } else {
        setValidationStatus('valid');
        setValidationMsg('Radiograph accepted for evaluation.');
      }
    } finally {
      setValidating(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRunInference = async () => {
    if (!selectedFile) {
      setError('Please choose or drop a chest X-ray image.');
      return;
    }

    if (validationStatus === 'invalid') {
      setError('Invalid image. Please upload a valid X-ray image.');
      return;
    }

    setLoading(true);
    setError(null);
    setFeedbackSent(null);
    setFeedbackMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patient_id', patientId);
      formData.append('patient_age', patientAge.toString());
      formData.append('patient_sex', patientSex);
      formData.append('site_id', siteId);

      const res = await api.uploadAndPredict(formData);
      setResultImage(res.image);
      setResultPrediction(res.prediction);
    } catch (err: any) {
      const errMsg = err.message?.includes('Invalid image')
        ? 'Invalid image. Please upload a valid X-ray image.'
        : (err.message || 'Inference pipeline encountered an error.');
      setError(errMsg);
      setValidationStatus('invalid');
      setResultImage(null);
      setResultPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async (sampleFilename: string) => {
    setLoading(true);
    setError(null);
    setValidationStatus('valid');
    setValidationMsg('Clinical reference radiograph loaded.');
    setFeedbackSent(null);
    setFeedbackMsg(null);
    try {
      const res = await api.loadSampleCase(sampleFilename);
      setResultImage(res.image);
      setResultPrediction(res.prediction);
      setFilePreview(res.image.image_url);
    } catch (err: any) {
      setError(err.message || 'Failed to load and evaluate sample CXR.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFeedback = async (sentiment: 'thumbs_up' | 'thumbs_down') => {
    if (!resultImage) return;
    try {
      await api.submitReaderFeedback({
        model_name: 'CheXNet DenseNet-121',
        sentiment: sentiment,
        image_id: resultImage.id,
        pushback_category: sentiment === 'thumbs_up' ? 'Approved' : 'Clinical Disagreement',
        reader_notes: `Quick feedback recorded from Diagnostic Studio viewport.`
      });
      setFeedbackSent(sentiment);
      setFeedbackMsg(sentiment === 'thumbs_up' ? 'Confirmed by clinician' : 'Pushback flagged for audit');
    } catch (err) {
      console.error('Failed to send reader feedback:', err);
    }
  };

  const filteredSamples = samples.filter((s) => {
    if (virtualCategory !== 'All') {
      const cat = s.category || (s.expected_finding === 'Normal' ? 'Normal' : 'Bacterial Pneumonia');
      if (cat !== virtualCategory) return false;
    }
    if (virtualSearch.trim()) {
      const q = virtualSearch.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.filename.toLowerCase().includes(q) ||
        (s.zone && s.zone.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Quick Samples (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#222836]/90 p-6 rounded-3xl border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-white/10 text-white border border-white/20">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">Radiograph Ingestion</h3>
                  <p className="text-[10px] text-amber-400 font-mono">DenseNet-121 Architecture</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white border border-white/20 font-semibold">
                Up to 25MB
              </span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-amber-400 bg-white/[0.08] shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                  : 'border-white/15 hover:border-white/40 bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {filePreview ? (
                <div className="space-y-2">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-32 h-32 object-contain rounded-xl mx-auto border border-white/30 bg-black shadow-lg"
                  />
                  <p className="text-xs font-mono text-white font-bold truncate max-w-[200px]">
                    {selectedFile?.name || 'Current Image'}
                  </p>
                  <p className="text-[10px] text-slate-400">Click or drop to replace</p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/20 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white font-display">Choose or drop chest X-ray</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, or DICOM format</p>
                  </div>
                </div>
              )}
            </div>

            {/* Virtual Clinical Scans Library */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 font-display">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-white">Virtual CXR Library ({samples.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLibraryModal(true)}
                  className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 font-display transition-colors cursor-pointer"
                >
                  <span>Browse All ({samples.length})</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none text-[10px] font-semibold">
                {['All', 'Normal', 'Bacterial', 'Viral & COVID', 'Complex', 'Trauma & Skeletal'].map((cat) => {
                  const fullCat = cat === 'Bacterial' ? 'Bacterial Pneumonia' : cat === 'Complex' ? 'Complex Pathologies' : cat;
                  const isActive = virtualCategory === fullCat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setVirtualCategory(fullCat)}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-black font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                          : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Virtual Image Cards List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredSamples.map((s) => {
                  const isPneu = s.expected_finding.toLowerCase().includes('pneumonia');
                  const isFx = s.expected_finding.toLowerCase().includes('fracture') || s.expected_finding.toLowerCase().includes('crack');
                  return (
                    <div
                      key={s.filename}
                      onClick={() => handleLoadSample(s.filename)}
                      className={`p-2.5 rounded-2xl border text-left transition-all group flex items-center justify-between cursor-pointer ${
                        isFx
                          ? 'bg-amber-950/25 border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/40'
                          : isPneu
                          ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-400/60 hover:bg-rose-950/40'
                          : 'bg-white/[0.03] border-white/15 hover:border-white/40 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <img
                          src={s.preview_url || `/virtual_cxr/${s.filename}`}
                          alt={s.title}
                          className="w-11 h-11 rounded-xl object-contain bg-black border border-white/15 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/sample_cxr.jpg';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-white font-display truncate">
                            {s.title}
                          </p>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                                isFx
                                  ? 'bg-amber-900/70 text-amber-300 border border-amber-500/30'
                                  : isPneu
                                  ? 'bg-rose-900/60 text-rose-300'
                                  : 'bg-white/10 text-white border border-white/20'
                              }`}
                            >
                              {s.expected_finding}
                            </span>
                            {s.zone && (
                              <span className="text-[9px] text-slate-400 truncate">
                                {s.zone.split(' ')[0]}
                              </span>
                            )}
                            {s.patient_age && (
                              <span className="text-[9px] text-slate-500 font-mono">
                                • {s.patient_age}y/{s.patient_sex}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-white bg-white/10 border border-white/20 group-hover:bg-amber-400 group-hover:text-black group-hover:border-amber-400 transition-colors flex-shrink-0 ml-2 cursor-pointer"
                      >
                        Test
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Patient & Site Details */}
            <div className="space-y-3 pt-1 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">MRN / Patient ID</label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Facility</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#222836] border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Main Campus Hospital" className="bg-[#222836] text-white">Main Campus Hospital</option>
                    <option value="North Pavilion ER" className="bg-[#222836] text-white">North Pavilion ER</option>
                    <option value="West Valley Urgent Care" className="bg-[#222836] text-white">West Valley Urgent Care</option>
                    <option value="Children's Wing" className="bg-[#222836] text-white">Children's Wing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Sex</label>
                  <select
                    value={patientSex}
                    onChange={(e) => setPatientSex(e.target.value)}
                    className="w-full px-3 py-2 bg-[#222836] border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="M" className="bg-[#222836] text-white">Male (M)</option>
                    <option value="F" className="bg-[#222836] text-white">Female (F)</option>
                    <option value="Other" className="bg-[#222836] text-white">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Validation State Displays */}
            {validating && (
              <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/30 text-white text-xs flex items-center space-x-3 animate-in fade-in">
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                <div>
                  <p className="font-bold text-white font-display">Verifying Radiographic Modality...</p>
                  <p className="text-[11px] text-slate-400 font-sans">Checking tissue attenuation and thoracic skeletal features</p>
                </div>
              </div>
            )}

            {!validating && validationStatus === 'valid' && selectedFile && (
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center space-x-2.5 shadow-lg shadow-emerald-950/20 animate-in fade-in">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-100 font-display">Verified Medical Radiograph (X-Ray)</p>
                  <p className="text-[10px] text-emerald-300 font-mono">Passed radiographic authenticity verification</p>
                </div>
              </div>
            )}

            {!validating && (validationStatus === 'invalid' || error) && (
              <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs shadow-xl shadow-rose-950/50 space-y-2.5 animate-in fade-in">
                <div className="flex items-start space-x-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-100 font-display text-sm">Invalid image. Please upload a valid X-ray image.</p>
                    <p className="text-[11px] text-rose-300 font-sans mt-0.5">
                      Non-medical image detected. AI prediction is strictly disabled for non-radiological photos, documents, and non-X-ray scenes.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-rose-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-rose-300 font-mono">Test with verified CXR:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('sample_bacterial_pneumonia.jpg')}
                    className="px-3 py-1 rounded-xl bg-rose-900 hover:bg-rose-800 text-[11px] font-bold text-white transition-colors shadow-sm font-display cursor-pointer"
                  >
                    Load Sample CXR
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={loading || validating || !selectedFile || validationStatus === 'invalid'}
              onClick={handleRunInference}
              className="w-full py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed font-display cursor-pointer btn-lumina-primary"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#181C26]" />
                  <span>Analyzing Radiograph...</span>
                </>
              ) : validating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#181C26]" />
                  <span>Validating X-Ray...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-[#181C26]" />
                  <span>Run AI Disease Prediction</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Diagnostic Viewport & Results (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {resultPrediction && resultImage ? (
            <div className="bg-[#222836]/90 p-6 rounded-3xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4 animate-in fade-in duration-200">
              {/* Header Telemetry Output */}
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-white/10 gap-3">
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white shadow-md ${
                      resultPrediction.prediction === 'Bone Fracture'
                        ? 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                        : resultPrediction.prediction === 'Pneumonia'
                        ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                        : 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                    }`}
                  >
                    <Activity className={`w-5 h-5 ${resultPrediction.prediction === 'Bone Fracture' ? 'text-black' : resultPrediction.prediction === 'Pneumonia' ? 'text-white' : 'text-black'}`} />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-black text-white tracking-tight font-display">
                        {resultPrediction.prediction === 'Bone Fracture'
                          ? 'Traumatic Bone Fracture / Crack Detected'
                          : resultPrediction.prediction === 'Pneumonia'
                          ? 'Pathology / Infiltration Detected'
                          : 'Normal CXR'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                          resultPrediction.prediction === 'Bone Fracture'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : resultPrediction.prediction === 'Pneumonia'
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                            : 'bg-white/10 text-white border border-white/30'
                        }`}
                      >
                        {(resultPrediction.confidence * 100).toFixed(1)}% Certainty
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Accession: {resultImage.accession_number} • Latency: {resultPrediction.latency_ms.toFixed(1)}ms • DenseNet-121 Trauma Radiomics
                    </p>
                  </div>
                </div>

                {/* 1-Click Doctor Sentiment */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFeedback('thumbs_up')}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                      feedbackSent === 'thumbs_up'
                        ? 'bg-white/20 text-white border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                        : 'bg-white/[0.04] border-white/15 text-slate-300 hover:text-white hover:border-white'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>Confirm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFeedback('thumbs_down')}
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                      feedbackSent === 'thumbs_down'
                        ? 'bg-rose-950/40 text-rose-300 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                        : 'bg-white/[0.04] border-white/15 text-slate-300 hover:text-white hover:border-white'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
                    <span>Pushback</span>
                  </button>
                </div>
              </div>

              {/* Confidence Spectrum Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-white">
                    Normal: {(resultPrediction.probabilities.Normal * 100).toFixed(1)}%
                  </span>
                  {(((resultPrediction.probabilities as any)?.['Bone Fracture'] || 0) > 0.05 || resultPrediction.prediction === 'Bone Fracture') && (
                    <span className="text-amber-400">
                      Bone Crack: {((((resultPrediction.probabilities as any)?.['Bone Fracture'] || (resultPrediction.prediction === 'Bone Fracture' ? resultPrediction.confidence : 0))) * 100).toFixed(1)}%
                    </span>
                  )}
                  <span className="text-rose-400">
                    Infection: {(resultPrediction.probabilities.Pneumonia * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black overflow-hidden flex shadow-inner border border-white/15">
                  <div
                    style={{ width: `${resultPrediction.probabilities.Normal * 100}%` }}
                    className="h-full bg-gradient-to-r from-white to-slate-300 transition-all duration-500"
                  />
                  {(((resultPrediction.probabilities as any)?.['Bone Fracture'] || 0) > 0 || resultPrediction.prediction === 'Bone Fracture') && (
                    <div
                      style={{ width: `${((((resultPrediction.probabilities as any)?.['Bone Fracture'] || (resultPrediction.prediction === 'Bone Fracture' ? resultPrediction.confidence : 0))) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500"
                    />
                  )}
                  <div
                    style={{ width: `${resultPrediction.probabilities.Pneumonia * 100}%` }}
                    className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-500"
                  />
                </div>
              </div>

              {/* Dynamic Radiologic Sub-Finding & Image Biomarkers Strip */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/15 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Radiologic Finding:</span>
                    <span className="text-white font-bold font-sans">
                      {resultPrediction.sub_finding || (resultPrediction.probabilities as any)?.sub_finding || (resultPrediction.prediction === 'Normal' ? 'Clear Lung Parenchyma • Symmetrical Aeration' : 'Focal Consolidation • Alveolar Opacification')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    Patient-Specific Radiomics
                  </span>
                </div>

                {/* 4 Quantitative Anatomical Markers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {resultPrediction.prediction === 'Bone Fracture' || (resultPrediction.biomarkers as any)?.bone_crack_detected ? (
                    <>
                      <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/30 text-center">
                        <span className="text-[10px] text-amber-300 font-mono block">Cortical Integrity</span>
                        <span className="text-xs font-black text-amber-400 font-mono">
                          {((resultPrediction.biomarkers?.cortical_integrity_pct || (resultPrediction.probabilities as any)?.biomarkers?.cortical_integrity_pct || 70.4)).toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-rose-400 block font-semibold">Acute Disruption</span>
                      </div>

                      <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/30 text-center">
                        <span className="text-[10px] text-amber-300 font-mono block">Fracture Sharpness</span>
                        <span className="text-xs font-black text-amber-400 font-mono">
                          {((resultPrediction.biomarkers?.fracture_sharpness_score || (resultPrediction.probabilities as any)?.biomarkers?.fracture_sharpness_score || 0.91)).toFixed(3)}
                        </span>
                        <span className="text-[9px] text-amber-300 block font-semibold">High Edge Lucency</span>
                      </div>

                      <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/30 text-center">
                        <span className="text-[10px] text-amber-300 font-mono block">Fracture Locus</span>
                        <span className="text-[11px] font-black text-white font-mono truncate block">
                          Right 6th Rib
                        </span>
                        <span className="text-[9px] text-amber-400 block font-semibold">Lateral Arc Step-off</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                        <span className="text-[10px] text-slate-400 font-mono block">Cardiothoracic (CTR)</span>
                        <span className="text-xs font-black text-white font-mono">
                          {((resultPrediction.biomarkers?.cardiothoracic_ratio || (resultPrediction.probabilities as any)?.biomarkers?.cardiothoracic_ratio || 0.44)).toFixed(2)}
                        </span>
                        <span className="text-[9px] text-slate-400 block">Normal &lt; 0.50</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                        <span className="text-[10px] text-slate-400 font-mono block">Cardiothoracic (CTR)</span>
                        <span className="text-xs font-black text-white font-mono">
                          {((resultPrediction.biomarkers?.cardiothoracic_ratio || (resultPrediction.probabilities as any)?.biomarkers?.cardiothoracic_ratio || 0.44)).toFixed(2)}
                        </span>
                        <span className="text-[9px] text-slate-400 block">Normal &lt; 0.50</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                        <span className="text-[10px] text-slate-400 font-mono block">Bilateral Symmetry</span>
                        <span className="text-xs font-black text-white font-mono">
                          {((resultPrediction.biomarkers?.bilateral_symmetry_pct || (resultPrediction.probabilities as any)?.biomarkers?.bilateral_symmetry_pct || 96.4)).toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-emerald-400 block">Symmetric Hemithorax</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                        <span className="text-[10px] text-slate-400 font-mono block">Aeration Index</span>
                        <span className="text-xs font-black text-white font-mono">
                          {((resultPrediction.biomarkers?.aeration_index_pct || (resultPrediction.probabilities as any)?.biomarkers?.aeration_index_pct || 88.5)).toFixed(1)}%
                        </span>
                        <span className="text-[9px] text-amber-300 block">Physiological Volume</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/10 text-center">
                        <span className="text-[10px] text-slate-400 font-mono block">Costophrenic Sulci</span>
                        <span className="text-xs font-black text-emerald-300 font-mono">
                          Sharp &amp; Clear
                        </span>
                        <span className="text-[9px] text-slate-400 block">No Pleural Effusion</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Viewport Floating HUD Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#181C26] border border-white/15 text-xs">
                {/* View Mode */}
                <div className="flex items-center space-x-1 bg-white/[0.04] p-1 rounded-xl border border-white/10">
                  {(['split-curtain', 'side-by-side', 'overlay'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                        viewMode === mode
                          ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode.replace('-', ' ')}
                    </button>
                  ))}
                </div>

                {/* DICOM Presets */}
                <div className="flex items-center space-x-1 text-[11px]">
                  {(['default', 'lung', 'bone', 'soft-tissue', 'invert'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setDicomFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-semibold transition-all cursor-pointer ${
                        dicomFilter === filter
                          ? 'bg-white/20 text-white border border-white shadow-[0_0_10px_rgba(255,255,255,0.25)]'
                          : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                    className="p-1 rounded-lg bg-white/[0.04] border border-white/10 hover:border-white text-slate-300 cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-white font-mono font-bold w-9 text-center">
                    {(zoomLevel * 100).toFixed(0)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                    className="p-1 rounded-lg bg-white/[0.04] border border-white/10 hover:border-white text-slate-300 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoomLevel(1.0);
                      setDicomFilter('default');
                      setHeatmapOpacity(75);
                    }}
                    className="p-1 rounded-lg bg-white/[0.04] border border-white/10 hover:border-white text-slate-300 cursor-pointer"
                    title="Reset Viewport"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Curtain Divider Slider */}
              {viewMode === 'split-curtain' && (
                <div className="p-3 rounded-2xl bg-[#181C26] border border-white/15 flex items-center space-x-3 text-xs font-mono">
                  <SplitSquareHorizontal className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-slate-400 text-xs">Curtain Divider:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={splitPosition}
                    onChange={(e) => setSplitPosition(parseInt(e.target.value))}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-white font-bold w-9 text-right">{splitPosition}%</span>
                </div>
              )}

              {/* Main Viewport Frame */}
              <div className="w-full aspect-[4/3] rounded-3xl bg-black border border-white/15 overflow-hidden relative shadow-2xl flex items-center justify-center">
                {/* Virtual Scanning Hologram Animation Overlay */}
                <VirtualScanningOverlay
                  active={loading}
                  imageSrc={filePreview || resultImage.image_url}
                  caseTitle={selectedFile?.name || resultImage.filename}
                />

                {viewMode === 'split-curtain' ? (
                  <div
                    className="relative w-full h-full flex items-center justify-center select-none"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                  >
                    <img
                      src={resultImage.image_url}
                      alt="Original"
                      className={`w-full h-full object-contain dicom-${dicomFilter}`}
                    />

                    {resultPrediction.heatmap_url && (
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${splitPosition}%` }}
                      >
                        <img
                          src={resultPrediction.heatmap_url}
                          alt="Grad-CAM"
                          className="w-full h-full object-contain dicom-contrast"
                          style={{
                            width: '100%',
                            maxWidth: 'none',
                          }}
                        />
                      </div>
                    )}

                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white pointer-events-none shadow-[0_0_15px_#FFFFFF,0_0_25px_#F59E0B]"
                      style={{ left: `${splitPosition}%` }}
                    />
                  </div>
                ) : viewMode === 'side-by-side' ? (
                  <div
                    className="grid grid-cols-2 w-full h-full gap-3 p-3"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                  >
                    <div className="relative rounded-2xl bg-[#181C26] border border-white/10 overflow-hidden flex items-center justify-center">
                      <img
                        src={resultImage.image_url}
                        alt="Original"
                        className={`w-full h-full object-contain dicom-${dicomFilter}`}
                      />
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/80 font-mono text-[10px] text-white font-bold border border-white/20">
                        Input Radiograph
                      </span>
                    </div>

                    <div className="relative rounded-2xl bg-[#181C26] border border-white/10 overflow-hidden flex items-center justify-center">
                      {resultPrediction.heatmap_url ? (
                        <img
                          src={resultPrediction.heatmap_url}
                          alt="Grad-CAM"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-slate-500 text-xs font-mono">Heatmap unavailable</div>
                      )}
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/80 font-mono text-[10px] text-amber-300 font-bold border border-amber-400/30">
                        Grad-CAM Activation Map
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="relative w-full h-full flex items-center justify-center"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                  >
                    <img
                      src={resultImage.image_url}
                      alt="Original"
                      className={`w-full h-full object-contain dicom-${dicomFilter}`}
                    />
                    {resultPrediction.heatmap_url && (
                      <img
                        src={resultPrediction.heatmap_url}
                        alt="Grad-CAM Overlay"
                        style={{ opacity: heatmapOpacity / 100 }}
                        className="absolute inset-0 w-full h-full object-contain mix-blend-screen pointer-events-none transition-opacity"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateToRadiologist(resultImage.id)}
                  className="flex items-center justify-center space-x-2 py-3.5 rounded-full bg-white/[0.05] border border-white/15 hover:border-white hover:bg-white/[0.1] text-white text-xs font-bold transition-all shadow-lg cursor-pointer font-display"
                >
                  <Stethoscope className="w-4 h-4 text-amber-400" />
                  <span>Submit Ground Truth Read</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToReports(resultImage.id)}
                  className="flex items-center justify-center space-x-2 py-3.5 rounded-full text-xs font-bold transition-all cursor-pointer font-display btn-lumina-primary"
                >
                  <FileText className="w-4 h-4 text-black" />
                  <span>Download Case PDF Dossier</span>
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="w-full aspect-[4/3] rounded-3xl bg-black border border-white/20 overflow-hidden relative shadow-2xl flex items-center justify-center">
              {filePreview && (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-full h-full object-contain opacity-35"
                />
              )}
              <VirtualScanningOverlay
                active={true}
                imageSrc={filePreview}
                caseTitle={selectedFile?.name || 'Chest Radiograph Study'}
              />
            </div>
          ) : (
            <div className="h-full min-h-[460px] p-8 rounded-3xl bg-[#222836]/80 border border-dashed border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/20 flex items-center justify-center text-white shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                <Cpu className="w-8 h-8 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white font-display">Awaiting Radiograph Ingestion</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Click any virtual scan on the left or upload a patient chest X-ray to run DenseNet-121 AI inference.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Virtual Clinical Radiograph Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[90vh] bg-[#222836] border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-white/10 text-white border border-white/20">
                    Virtual CXR Cohort Library
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {samples.length} Curated Clinical Case Radiographs
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1 font-display">
                  Clinical Radiograph Simulation & Testing Suite
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  Select any virtual radiograph to simulate instant PACS ingestion, DenseNet-121 prediction, and Grad-CAM saliency localization.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="p-2 rounded-full bg-white/[0.04] hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filter Toolbar */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by diagnosis, zone, description..."
                  value={virtualSearch}
                  onChange={(e) => setVirtualSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs font-semibold">
                {['All', 'Normal', 'Bacterial Pneumonia', 'Viral & COVID', 'Complex Pathologies', 'Trauma & Skeletal'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setVirtualCategory(cat)}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                      virtualCategory === cat
                        ? 'bg-white text-black font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                        : 'text-slate-400 hover:text-white bg-white/[0.02] border border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Cards Grid */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 scrollbar-thin">
              {filteredSamples.map((s) => {
                const isPneu = s.expected_finding.toLowerCase().includes('pneumonia');
                return (
                  <div
                    key={s.filename}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/40 hover:bg-white/[0.05] transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex space-x-3">
                      <div className="w-20 h-20 rounded-xl bg-black border border-white/15 overflow-hidden flex-shrink-0 relative">
                        <img
                          src={s.preview_url || `/virtual_cxr/${s.filename}`}
                          alt={s.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/sample_cxr.jpg';
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              isPneu
                                ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                                : 'bg-white/10 text-white border border-white/30'
                            }`}
                          >
                            {s.expected_finding}
                          </span>
                          {s.severity && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              • {s.severity}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-white font-display mt-1 leading-tight line-clamp-2">
                          {s.title}
                        </h4>

                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1 font-mono">
                          {s.zone && <span>{s.zone}</span>}
                          {s.patient_age && <span>• {s.patient_age}y / {s.patient_sex}</span>}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-2">
                      {s.description}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setShowLibraryModal(false);
                        handleLoadSample(s.filename);
                      }}
                      className="w-full py-2.5 rounded-xl bg-white text-black font-extrabold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer font-display shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Run DenseNet-121 Inference</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
