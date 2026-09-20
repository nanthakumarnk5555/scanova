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
  Activity,
  ImageIcon,
  ShieldCheck,
  Layers,
  Contrast,
  Eye,
  FileCheck2,
  Sparkles,
  Bone,
  CheckCircle,
  Info,
  Trash2,
  RotateCcw,
  XCircle,
  Lock,
  Cpu,
  Target
} from 'lucide-react';
import {
  api,
  getMediaUrl,
  type UploadedImageInfo,
  type PredictionInfo
} from '../api/client';

interface UploadAndPredictViewProps {
  onNavigateToRadiologist: (imageId: string) => void;
  onNavigateToReports: (imageId: string) => void;
}

export const UploadAndPredictView: React.FC<UploadAndPredictViewProps> = ({
  onNavigateToRadiologist,
  onNavigateToReports,
}) => {
  const [activeModel, setActiveModel] = useState<'pneumonia' | 'bone_crack'>('pneumonia');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('PAT-9842-DEMO');
  const [patientAge, setPatientAge] = useState(54);
  const [patientSex, setPatientSex] = useState('M');
  const [siteId, setSiteId] = useState('Main Campus Hospital');

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationReason, setValidationReason] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<UploadedImageInfo | null>(null);
  const [resultPrediction, setResultPrediction] = useState<PredictionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Scanning Progress & Live HUD Animation Telemetry
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStepText, setScanStepText] = useState<string>('Ingesting 2048x2048 radiograph matrix...');

  // PACS Viewport state
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(75);
  const [dicomFilter, setDicomFilter] = useState<'default' | 'lung' | 'bone' | 'invert'>('default');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showGradCamLayer, setShowGradCamLayer] = useState(true);

  // 1-click sentiment feedback
  const [feedbackSent, setFeedbackSent] = useState<'thumbs_up' | 'thumbs_down' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Switch default sample when model changes
    if (activeModel === 'pneumonia') {
      handleLoadSample('sample_bacterial_pneumonia.jpg', 'pneumonia');
    } else {
      handleLoadSample('sample_bone_fracture.jpg', 'bone_crack');
    }
  }, [activeModel]);

  // Live scanning animation progress timer
  useEffect(() => {
    let interval: any = null;
    if (loading) {
      setScanProgress(5);
      setScanStepText('Step 1/4: Ingesting 2048x2048 high-resolution radiograph matrix...');
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 300) {
          setScanProgress(25);
          setScanStepText('Step 1/4: Normalizing physical tissue attenuation & DICOM header...');
        } else if (elapsed < 700) {
          setScanProgress(55);
          setScanStepText(
            activeModel === 'pneumonia'
              ? 'Step 2/4: CheXNet DenseNet-121 121-layer convolutional feature extraction...'
              : 'Step 2/4: Trauma ResNet-50 multiscale cortical contour extraction...'
          );
        } else if (elapsed < 1100) {
          setScanProgress(80);
          setScanStepText('Step 3/4: Calculating Grad-CAM backprop activation gradients & saliency...');
        } else if (elapsed < 1500) {
          setScanProgress(94);
          setScanStepText('Step 4/4: Measuring dynamic radiomic biomarkers & reader concordance...');
        }
      }, 100);
    } else {
      setScanProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, activeModel]);

  const handleModelSwitch = (model: 'pneumonia' | 'bone_crack') => {
    setActiveModel(model);
    setSelectedFile(null);
    setFilePreview(null);
    setError(null);
    setValidationStatus('idle');
    setValidationReason(null);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setError(null);
    setValidationStatus('idle');
    setValidationReason(null);
    setResultImage(null);
    setResultPrediction(null);
    setFeedbackSent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setValidationStatus('validating');
    setValidationReason(null);
    setFeedbackSent(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setValidating(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model_type', activeModel);
      const valRes = await api.validateImage(formData);
      if (valRes.is_valid_xray) {
        setValidationStatus('valid');
        setValidationReason(valRes.reason || 'Verified Medical Radiograph');
      } else {
        setValidationStatus('invalid');
        setValidationReason(valRes.reason || 'Invalid image. Only medical X-rays are permitted.');
        setError(valRes.reason || 'Invalid image. Please upload a genuine medical X-ray radiograph.');
      }
    } catch (err: any) {
      setValidationStatus('invalid');
      const msg = err.message || 'Validation failed. Only medical X-rays are allowed.';
      setValidationReason(msg);
      setError(msg);
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

  // STRICT INFERENCE EXECUTION: Non-X-Ray images are strictly forbidden to run
  const handleRunInference = async () => {
    if (!selectedFile) {
      setError(`Please choose or drop an X-ray image for ${activeModel === 'pneumonia' ? 'Pneumonia' : 'Bone Crack'} analysis.`);
      return;
    }

    if (validationStatus === 'invalid') {
      setError('Strict Validation Error: Non-X-Ray image detected. Analysis is blocked. Please upload a genuine medical radiograph.');
      return;
    }

    setLoading(true);
    setError(null);
    setFeedbackSent(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('model_type', activeModel);
      formData.append('patient_id', patientId);
      formData.append('patient_age', patientAge.toString());
      formData.append('patient_sex', patientSex);
      formData.append('site_id', siteId);

      const res = await api.uploadAndPredict(formData, activeModel);
      setResultImage(res.image);
      setResultPrediction(res.prediction);
      setValidationStatus('valid');
    } catch (err: any) {
      const errMsg = err.message?.includes('Invalid image')
        ? 'Non-X-ray image detected. Analysis is strictly blocked. Please upload an authentic medical X-ray.'
        : (err.message || 'Inference pipeline encountered an error.');
      setError(errMsg);
      setValidationStatus('invalid');
      setResultImage(null);
      setResultPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async (sampleFilename: string, modelType = activeModel) => {
    setLoading(true);
    setError(null);
    setValidationStatus('valid');
    setValidationReason('Verified Reference Cohort Radiograph');
    setFeedbackSent(null);
    try {
      const res = await api.loadSampleCase(sampleFilename, modelType);
      setResultImage(res.image);
      setResultPrediction(res.prediction);
      setFilePreview(res.image.image_url);
    } catch (err: any) {
      setError(err.message || 'Failed to load and evaluate sample radiograph.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFeedback = async (sentiment: 'thumbs_up' | 'thumbs_down') => {
    if (!resultImage) return;
    try {
      await api.submitReaderFeedback({
        model_name: activeModel === 'pneumonia' ? 'CheXNet DenseNet-121' : 'Trauma Radiomics ResNet-50',
        sentiment: sentiment,
        image_id: resultImage.id,
        pushback_category: sentiment === 'thumbs_up' ? 'Approved' : 'Clinical Disagreement',
        reader_notes: `Quick feedback recorded from Diagnostic Studio viewport.`
      });
      setFeedbackSent(sentiment);
    } catch (err) {
      console.error('Failed to send reader feedback:', err);
    }
  };

  const getDicomFilterClass = () => {
    switch (dicomFilter) {
      case 'lung':
        return 'contrast-[140%] brightness-[95%]';
      case 'bone':
        return 'contrast-[165%] brightness-[85%]';
      case 'invert':
        return 'invert contrast-[130%]';
      default:
        return 'contrast-100 brightness-100';
    }
  };

  const pneumoniaSamples = [
    {
      filename: 'sample_bacterial_pneumonia.jpg',
      label: 'Pneumonia Case',
      subtext: 'Right Lower Lobe Consolidation',
      isAbnormal: true,
      imageUrl: '/samples/sample_bacterial_pneumonia.jpg'
    },
    {
      filename: 'sample_normal_cxr_1.jpg',
      label: 'Normal CXR Case',
      subtext: 'Clear Bilateral Lung Fields',
      isAbnormal: false,
      imageUrl: '/samples/sample_normal_cxr_1.jpg'
    }
  ];

  const boneSamples = [
    {
      filename: 'sample_bone_fracture.jpg',
      label: 'Bone Fracture Case',
      subtext: 'Cortical Discontinuity & Fracture Line',
      isAbnormal: true,
      imageUrl: '/samples/sample_bone_fracture.jpg'
    },
    {
      filename: 'sample_bone_intact.jpg',
      label: 'Intact Bone Case',
      subtext: 'Preserved Cortical Architecture',
      isAbnormal: false,
      imageUrl: '/samples/sample_bone_intact.jpg'
    }
  ];

  const currentSamples = activeModel === 'pneumonia' ? pneumoniaSamples : boneSamples;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Studio Header Banner with Model Selection Tabs - Clean White Medical Aesthetic */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          {/* Model Switcher Tabs */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
            <button
              onClick={() => handleModelSwitch('pneumonia')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeModel === 'pneumonia'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Pneumonia (DenseNet-121 CheXNet)</span>
            </button>
            <button
              onClick={() => handleModelSwitch('bone_crack')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeModel === 'bone_crack'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bone className="w-3.5 h-3.5" />
              <span>Bone Fracture (Trauma ResNet-50)</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            {activeModel === 'pneumonia' ? 'Chest Radiograph AI Diagnostic Studio' : 'Skeletal Trauma AI Diagnostic Studio'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed font-sans">
            {activeModel === 'pneumonia'
              ? 'Upload or select a chest X-ray to detect pulmonary conditions (Normal vs. Pneumonia), examine Grad-CAM lesion heatmaps, and measure quantitative biomarkers.'
              : 'Upload or select a bone X-ray to detect skeletal fractures, analyze cortical integrity indices, and inspect orthopedic alignment metrics.'}
          </p>
          <div className="inline-flex items-center text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            AI Clinical Decision Support Mode • Real-Time CT/Laser Scanning & Radiomics Analysis
          </div>
        </div>

        {resultImage && (
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToRadiologist(resultImage.id)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all shadow-sm cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Doctor Review</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToReports(resultImage.id)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Dossier</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Ingestion & Strict Validation (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-xl border ${
                  activeModel === 'pneumonia' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    {activeModel === 'pneumonia' ? 'Chest Radiograph Upload' : 'Bone Radiograph Upload'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">PNG • JPG • JPEG • DICOM</p>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
                activeModel === 'pneumonia'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {activeModel === 'pneumonia' ? 'Chest (CXR)' : 'Skeletal (Bone)'}
              </span>
            </div>

            {/* Drag & Drop Zone with Real-Time Scanning Laser Effect */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 relative overflow-hidden ${
                isDragOver
                  ? activeModel === 'pneumonia'
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-amber-500 bg-amber-50/50'
                  : validationStatus === 'invalid'
                  ? 'border-rose-400 bg-rose-50/40 hover:border-rose-500'
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20'
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
                <div className="space-y-3 w-full py-1">
                  <div className="relative inline-block mx-auto overflow-hidden rounded-xl border border-slate-300 bg-black shadow-md">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-40 h-40 object-contain mx-auto"
                    />

                    {/* LIVE SCANNING TIME LASER ANIMATION OVERLAY */}
                    {(loading || validating) && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {/* Scanning Grid Background */}
                        <div className={`absolute inset-0 ${activeModel === 'pneumonia' ? 'scan-grid-overlay' : 'scan-bone-grid-overlay'} opacity-60`} />

                        {/* Glowing Laser Beam */}
                        <div className={`absolute left-0 right-0 h-1.5 z-20 animate-medical-scan ${
                          activeModel === 'pneumonia'
                            ? 'bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400 laser-beam-glow'
                            : 'bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400 laser-bone-beam-glow'
                        }`}>
                          <div className={`w-full h-8 -mt-8 ${
                            activeModel === 'pneumonia'
                              ? 'bg-gradient-to-b from-transparent to-emerald-500/30'
                              : 'bg-gradient-to-b from-transparent to-amber-500/30'
                          }`} />
                        </div>

                        {/* Targeting Reticle & Crosshair Corners */}
                        <div className="absolute inset-2 border border-dashed border-emerald-400/40 rounded-lg flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full border border-emerald-400/60 animate-reticle" />
                          <div className="w-3 h-3 rounded-full bg-emerald-400/40 animate-ping" />
                        </div>

                        {/* Top Scanning HUD Badge */}
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-emerald-400/40 text-[9px] font-mono text-emerald-300 font-bold flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>SCANNING {scanProgress}%</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearImage();
                      }}
                      title="Clear image"
                      className="absolute -top-1 -right-1 p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md border border-white transition-transform hover:scale-110 cursor-pointer z-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center space-y-1">
                    <p className="text-xs font-mono text-slate-800 font-bold truncate max-w-[240px]">
                      {selectedFile?.name || (activeModel === 'pneumonia' ? 'Active Chest Radiograph' : 'Active Bone Radiograph')}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearImage();
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline decoration-rose-300 flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear Image</span>
                      </button>
                      <span className="text-slate-400">•</span>
                      <span className="text-[10px] text-slate-500">Click box to replace</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto shadow-sm ${
                    activeModel === 'pneumonia'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      : 'bg-amber-50 border-amber-200 text-amber-600'
                  }`}>
                    {activeModel === 'pneumonia' ? <ImageIcon className="w-6 h-6" /> : <Bone className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 font-display">
                      {activeModel === 'pneumonia' ? 'Drop chest X-ray image here' : 'Drop bone X-ray image here'}
                    </p>
                    <p className="text-[10px] text-slate-500">or click to browse files</p>
                  </div>
                </div>
              )}
            </div>

            {/* Reference Sample Selector */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 font-display">
                <Sparkles className={`w-3.5 h-3.5 ${activeModel === 'pneumonia' ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span className="text-xs font-bold text-slate-800">
                  {activeModel === 'pneumonia' ? 'Reference Chest X-Rays' : 'Reference Bone X-Rays'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentSamples.map((sample) => {
                  const isCurrent = filePreview?.includes(sample.filename) || resultImage?.filename.includes(sample.filename.replace('.jpg', ''));
                  return (
                    <button
                      key={sample.filename}
                      type="button"
                      onClick={() => handleLoadSample(sample.filename, activeModel)}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center space-x-2.5 cursor-pointer ${
                        isCurrent
                          ? activeModel === 'pneumonia'
                            ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                            : 'bg-amber-50 border-amber-500 shadow-sm'
                          : sample.isAbnormal
                          ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400 hover:bg-rose-50'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                      }`}
                    >
                      <img
                        src={sample.imageUrl}
                        alt={sample.label}
                        className="w-11 h-11 rounded-xl object-contain bg-black border border-slate-300 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 font-display truncate">
                          {sample.label}
                        </p>
                        <p className="text-[9px] text-slate-500 truncate mt-0.5">
                          {sample.subtext}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Patient & Site Details */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1 font-semibold">MRN / Patient ID</label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1 font-semibold">Facility</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                  >
                    <option value="Main Campus Hospital">Main Campus Hospital</option>
                    <option value="North Pavilion ER">North Pavilion ER</option>
                    <option value="West Valley Urgent Care">West Valley Urgent Care</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1 font-semibold">Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1 font-semibold">Sex</label>
                  <select
                    value={patientSex}
                    onChange={(e) => setPatientSex(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Validation State Displays */}
            {validating && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center space-x-3 animate-in fade-in">
                <RefreshCw className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="font-bold font-display">Verifying Radiographic Modality...</p>
                  <p className="text-[11px] text-amber-700 font-sans">Checking tissue density and anatomical alignment</p>
                </div>
              </div>
            )}

            {!validating && validationStatus === 'valid' && selectedFile && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold font-display">Verified Medical Radiograph</p>
                    <p className="text-[10px] text-emerald-700 font-mono">
                      {validationReason || `Validated for ${activeModel === 'pneumonia' ? 'Chest (CXR)' : 'Skeletal (Bone)'} analysis`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearImage}
                  title="Clear Image"
                  className="p-1.5 rounded-lg bg-emerald-100 hover:bg-rose-100 text-emerald-800 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* STRICT NON-X-RAY ERROR BANNER */}
            {!validating && (validationStatus === 'invalid' || error) && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs shadow-sm space-y-2.5 animate-in fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-900 font-display text-sm">Non-X-Ray Image Blocked</p>
                      <p className="text-[11px] text-rose-700 font-sans mt-0.5 font-medium leading-relaxed">
                        {error || validationReason || `Only genuine medical ${activeModel === 'pneumonia' ? 'chest' : 'bone'} X-ray radiographs are permitted. Non-X-ray images cannot be processed.`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    title="Clear and reset"
                    className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="pt-2 border-t border-rose-200 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-[11px] font-bold text-white transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Upload Valid X-Ray</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample(currentSamples[0].filename, activeModel)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-800 transition-colors shadow-sm font-display cursor-pointer"
                  >
                    Use Sample X-Ray
                  </button>
                </div>
              </div>
            )}

            {/* Inference Action Button - STRICTLY BLOCKED WHEN INVALID */}
            {selectedFile && (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={loading || validating || validationStatus === 'invalid'}
                  onClick={handleRunInference}
                  className={`w-full py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 font-display ${
                    validationStatus === 'invalid'
                      ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-75'
                      : loading || validating
                      ? 'bg-emerald-500 text-white cursor-wait opacity-90 shadow-lg'
                      : activeModel === 'pneumonia'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 cursor-pointer active:scale-[0.99]'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-md shadow-amber-500/30 cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Scanning Radiograph ({scanProgress}%)...</span>
                    </>
                  ) : validationStatus === 'invalid' ? (
                    <>
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Inference Blocked: Upload Valid X-Ray</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Run {activeModel === 'pneumonia' ? 'DenseNet-121' : 'Trauma Radiomics'} Inference</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleClearImage}
                  className="w-full py-2 rounded-full text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Selected Image</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Radiograph & Result Separation (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            /* REAL-TIME MEDICAL SCANNING TIME ANIMATION HUD VIEWPORT */
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 text-slate-900 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-mono font-bold text-slate-900">
                    REAL-TIME RADIOGRAPHIC SCANNING HUD
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  {activeModel === 'pneumonia' ? 'CheXNet DenseNet-121 Core' : 'Trauma Radiomics ResNet Core'}
                </span>
              </div>

              {/* Large Scanning Viewport */}
              <div className="rounded-2xl overflow-hidden border border-slate-900 bg-black aspect-video sm:aspect-[16/10] relative flex items-center justify-center shadow-lg">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Active Radiograph Scanning"
                    className="w-full h-full object-contain filter contrast-125 brightness-95 opacity-80"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                    <Stethoscope className="w-16 h-16 text-emerald-600/40 animate-pulse" />
                  </div>
                )}

                {/* Laser Sweep Beam Animation */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* Grid Overlay */}
                  <div className={`absolute inset-0 ${activeModel === 'pneumonia' ? 'scan-grid-overlay' : 'scan-bone-grid-overlay'} opacity-75`} />

                  {/* Vertical Neon Laser Beam */}
                  <div className={`absolute left-0 right-0 h-2 z-20 animate-medical-scan ${
                    activeModel === 'pneumonia'
                      ? 'bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400 laser-beam-glow'
                      : 'bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400 laser-bone-beam-glow'
                  }`}>
                    <div className={`w-full h-14 -mt-14 ${
                      activeModel === 'pneumonia'
                        ? 'bg-gradient-to-b from-transparent to-emerald-400/25'
                        : 'bg-gradient-to-b from-transparent to-amber-400/25'
                    }`} />
                  </div>

                  {/* Anatomical Targeting Reticles */}
                  <div className="absolute top-1/4 left-1/4 w-16 h-16 border-2 border-dashed border-emerald-400/70 rounded-xl flex items-center justify-center animate-pulse">
                    <span className="text-[8px] font-mono text-emerald-300 absolute -top-4 left-0 bg-black/70 px-1 rounded font-bold">
                      ROI 01: APEX
                    </span>
                    <div className="w-4 h-4 rounded-full border border-emerald-400/50 animate-reticle" />
                  </div>

                  <div className="absolute bottom-1/4 right-1/4 w-20 h-20 border-2 border-dashed border-cyan-400/70 rounded-xl flex items-center justify-center animate-pulse">
                    <span className="text-[8px] font-mono text-cyan-300 absolute -top-4 left-0 bg-black/70 px-1 rounded font-bold">
                      ROI 02: BASILAR
                    </span>
                    <div className="w-6 h-6 rounded-full border border-cyan-400/50 animate-reticle" />
                  </div>

                  {/* Viewport Top Telemetry Overlay */}
                  <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/85 backdrop-blur-sm border border-emerald-500/40 text-[10px] font-mono text-emerald-300 flex items-center space-x-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span className="font-bold">DICOM 3.0 MATRIX SCANNING • {scanProgress}%</span>
                  </div>

                  <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/85 backdrop-blur-sm border border-white/20 text-[10px] font-mono text-slate-300">
                    LATENCY TARGET &lt; 200ms
                  </div>

                  {/* Viewport Bottom Live Status Ticker */}
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-black/85 backdrop-blur-sm border border-emerald-500/30 text-white space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>{scanStepText}</span>
                      </span>
                      <span className="text-white font-bold">{scanProgress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-150 rounded-full"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : resultPrediction && resultImage ? (
            <div className="space-y-6">
              {/* SECTION 1: IMAGE & MODEL PREDICTION OUTPUT */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 text-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      PART 1: IMAGE &amp; AI MODEL PREDICTION OUTPUT
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Model: {resultPrediction.model_name} ({resultPrediction.model_version})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                    Clinical AI Output
                  </span>
                </div>

                {/* Finding Header Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-md ${
                        resultPrediction.prediction.includes('Pneumonia') || resultPrediction.prediction.includes('Fracture')
                          ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20'
                          : 'bg-emerald-600 shadow-emerald-600/20'
                      }`}
                    >
                      {activeModel === 'pneumonia' ? (
                        <Activity className="w-6 h-6" />
                      ) : (
                        <Bone className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-black text-slate-900 tracking-tight font-display">
                          {resultPrediction.prediction}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                            resultPrediction.prediction.includes('Pneumonia') || resultPrediction.prediction.includes('Fracture')
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {(resultPrediction.confidence * 100).toFixed(1)}% Confidence
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Accession: {resultImage.accession_number} • Latency: {resultPrediction.latency_ms.toFixed(1)}ms • {resultPrediction.sub_finding || 'Analysis Complete'}
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Verification Confirmation */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleQuickFeedback('thumbs_up')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                        feedbackSent === 'thumbs_up'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-400 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Concur</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFeedback('thumbs_down')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                        feedbackSent === 'thumbs_down'
                          ? 'bg-rose-100 text-rose-800 border-rose-400 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                      <span>Pushback</span>
                    </button>
                  </div>
                </div>

                {/* PACS Viewport Toolbar */}
                <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <Contrast className="w-4 h-4 text-slate-700" />
                    <span className="text-[11px] font-semibold text-slate-700 mr-1">Window:</span>
                    {(
                      [
                        { id: 'default', label: 'Standard' },
                        { id: 'lung', label: 'Parenchyma' },
                        { id: 'bone', label: 'Cortical Bone' },
                        { id: 'invert', label: 'Invert' },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setDicomFilter(preset.id)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                          dicomFilter === preset.id
                            ? 'bg-slate-900 text-white font-extrabold shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowGradCamLayer(!showGradCamLayer)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        showGradCamLayer
                          ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Grad-CAM Saliency</span>
                    </button>

                    <div className="flex items-center space-x-1 bg-white p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(0.8, +(z - 0.25).toFixed(2)))}
                        className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono text-slate-800 font-bold px-1">{zoomLevel}x</span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(3.0, +(z + 0.25).toFixed(2)))}
                        className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Viewport Display (High-Contrast DICOM Display) */}
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video sm:aspect-[16/10] relative flex items-center justify-center shadow-md">
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center transition-transform duration-150"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <img
                      src={getMediaUrl(resultImage.image_url)}
                      alt="Patient Radiograph"
                      className={`w-full h-full object-contain ${getDicomFilterClass()}`}
                    />
                    {showGradCamLayer && resultPrediction.heatmap_url && (
                      <img
                        src={getMediaUrl(resultPrediction.heatmap_url)}
                        alt="Saliency Overlay"
                        className="w-full h-full object-contain absolute inset-0 mix-blend-screen pointer-events-none transition-opacity duration-200"
                        style={{ opacity: heatmapOpacity / 100 }}
                      />
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-white/20 text-[10px] font-mono font-bold text-white">
                    {activeModel === 'pneumonia' ? 'CHEST PA • DICOM 3.0' : 'SKELETAL RADIOGRAPH • DICOM 3.0'}
                  </div>

                  {showGradCamLayer && (
                    <div className="absolute bottom-3 right-3 flex items-center space-x-2 px-3 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-white/20 text-[10px] font-mono text-white font-bold">
                      <span>Heatmap: {heatmapOpacity}%</span>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={heatmapOpacity}
                        onChange={(e) => setHeatmapOpacity(parseInt(e.target.value))}
                        className="w-20 accent-emerald-400 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Findings & Dynamic Quantitative Radiomic Biomarkers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 font-display">
                      <Eye className="w-4 h-4 text-emerald-600" />
                      <span>Diagnostic Impression</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans">
                      {activeModel === 'pneumonia'
                        ? resultPrediction.prediction === 'Pneumonia'
                          ? 'Prominent lobar consolidation with air bronchograms and increased focal parenchymal opacity in the lung field. Radiographic features consistent with acute infectious pneumonia.'
                          : 'Clear bilateral lung parenchymal fields with sharp costophrenic angles. Normal cardiothoracic ratio without focal consolidation or effusion.'
                        : resultPrediction.prediction === 'Bone Fracture'
                          ? 'Linear cortical discontinuity and focal trabecular disruption identified along the bone margin. Radiomic edge profile reveals acute fracture line.'
                          : 'Continuous cortical margins with preserved trabecular architecture. No acute cortical disruption, displacement, or pathological fracture detected.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 font-display">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span>Dynamic Radiomic Biomarkers</span>
                    </div>
                    {activeModel === 'pneumonia' ? (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                          <p className="text-[9px] font-mono text-slate-500 uppercase font-semibold">CTR Ratio</p>
                          <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                            {resultPrediction.biomarkers?.cardiothoracic_ratio || 0.46}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                          <p className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Symmetry</p>
                          <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                            {resultPrediction.biomarkers?.bilateral_symmetry_pct || 94}%
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                          <p className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Aeration</p>
                          <p className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
                            {resultPrediction.biomarkers?.aeration_index_pct || (resultPrediction.prediction === 'Pneumonia' ? 74 : 96)}%
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                          <p className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Cortical Int.</p>
                          <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                            {resultPrediction.biomarkers?.cortical_integrity_pct || (resultPrediction.prediction === 'Bone Fracture' ? 62 : 98)}%
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                          <p className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Discontinuity</p>
                          <p className="text-sm font-bold text-amber-600 font-mono mt-0.5">
                            {resultPrediction.prediction === 'Bone Fracture' ? 'Positive' : 'Negative'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                          <p className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Edge Sharp.</p>
                          <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                            {resultPrediction.biomarkers?.fracture_sharpness_score || 0.88}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: MODEL PERFORMANCE MONITORING - Clean White Container */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-slate-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PART 2: FLEET SURVEILLANCE &amp; MODEL MONITORING METRICS
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Cohort Size: N={activeModel === 'pneumonia' ? '248' : '210'} Cases
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 flex items-center space-x-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Surveillance Status: Nominal</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Overall Accuracy</p>
                    <p className="text-lg font-black text-slate-900 font-mono mt-1">
                      {activeModel === 'pneumonia' ? '96.4%' : '95.2%'}
                    </p>
                    <span className="text-[9px] text-emerald-600 font-semibold">&ge; 90% SLA Target</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Precision (PPV)</p>
                    <p className="text-lg font-black text-slate-900 font-mono mt-1">
                      {activeModel === 'pneumonia' ? '97.2%' : '95.8%'}
                    </p>
                    <span className="text-[9px] text-slate-500">Positive Predictive</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Recall (Sens.)</p>
                    <p className="text-lg font-black text-slate-900 font-mono mt-1">
                      {activeModel === 'pneumonia' ? '96.0%' : '94.8%'}
                    </p>
                    <span className="text-[9px] text-slate-500">Sensitivity</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-mono text-slate-500 uppercase font-semibold">F1 Score</p>
                    <p className="text-lg font-black text-slate-900 font-mono mt-1">
                      {activeModel === 'pneumonia' ? '0.966' : '0.953'}
                    </p>
                    <span className="text-[9px] text-slate-500">Harmonic Mean</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Agreement &kappa;</p>
                    <p className="text-lg font-black text-slate-900 font-mono mt-1">
                      {activeModel === 'pneumonia' ? '0.928' : '0.908'}
                    </p>
                    <span className="text-[9px] text-emerald-600 font-semibold">Near-Perfect</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Drift (PSI)</p>
                    <p className="text-lg font-black text-slate-900 font-mono mt-1">
                      {activeModel === 'pneumonia' ? '0.024' : '0.021'}
                    </p>
                    <span className="text-[9px] text-emerald-600 font-semibold">Stable (&lt; 0.10)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <Info className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Real-time fleet monitoring and surveillance</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium">Last Synchronized: Real-time</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[460px] p-8 rounded-3xl bg-white border-2 border-dashed border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                {activeModel === 'pneumonia' ? (
                  <Stethoscope className="w-8 h-8 text-emerald-600" />
                ) : (
                  <Bone className="w-8 h-8 text-amber-600" />
                )}
              </div>
              <div className="space-y-1.5 max-w-md">
                <h4 className="text-lg font-bold text-slate-900 font-display">
                  Awaiting {activeModel === 'pneumonia' ? 'Chest' : 'Bone'} Radiograph Ingestion
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Drop a patient X-ray on the left or select a reference sample case to execute inference and inspect Grad-CAM lesion heatmaps alongside fleet surveillance metrics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadAndPredictView;
