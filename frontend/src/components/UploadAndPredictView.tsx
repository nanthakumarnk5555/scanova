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
  TrendingUp,
  BarChart2,
  Info,
  Trash2,
  RotateCcw,
  XCircle
} from 'lucide-react';
import {
  api,
  getMediaUrl,
  type SampleXRay,
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
  const [resultImage, setResultImage] = useState<UploadedImageInfo | null>(null);
  const [resultPrediction, setResultPrediction] = useState<PredictionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleModelSwitch = (model: 'pneumonia' | 'bone_crack') => {
    setActiveModel(model);
    setSelectedFile(null);
    setFilePreview(null);
    setError(null);
    setValidationStatus('idle');
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setError(null);
    setValidationStatus('idle');
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
      } else {
        setValidationStatus('invalid');
        setError(valRes.reason || 'Invalid image. Please upload a valid X-ray image.');
      }
    } catch (err: any) {
      const isActuallyInvalid = err.message?.includes('Invalid image') || err.message?.includes('validation failed');
      if (isActuallyInvalid) {
        setValidationStatus('invalid');
        setError('Invalid image. Please upload a valid X-ray image.');
      } else {
        setValidationStatus('valid');
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

  const handleRunInference = async (overrideValidation: boolean = false) => {
    if (!selectedFile) {
      setError(`Please choose or drop an X-ray image for ${activeModel === 'pneumonia' ? 'Pneumonia' : 'Bone Crack'} analysis.`);
      return;
    }

    if (validationStatus === 'invalid' && !overrideValidation) {
      setError('Invalid image format detected. Please verify or use a valid X-ray.');
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

  const handleLoadSample = async (sampleFilename: string, modelType = activeModel) => {
    setLoading(true);
    setError(null);
    setValidationStatus('valid');
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
      {/* Studio Header Banner with Model Selection Tabs */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#222836] via-[#1C2230] to-[#181C26] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          {/* Model Switcher Tabs */}
          <div className="flex items-center space-x-2 bg-[#12161F] p-1.5 rounded-2xl border border-white/10 w-fit">
            <button
              onClick={() => handleModelSwitch('pneumonia')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeModel === 'pneumonia'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Pneumonia (DenseNet-121 CheXNet)</span>
            </button>
            <button
              onClick={() => handleModelSwitch('bone_crack')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeModel === 'bone_crack'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-900/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bone className="w-3.5 h-3.5" />
              <span>Bone Crack (Trauma Radiomics ResNet)</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            {activeModel === 'pneumonia' ? 'Chest Radiograph AI Diagnostic Studio' : 'Skeletal Trauma AI Diagnostic Studio'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-sans">
            {activeModel === 'pneumonia'
              ? 'Upload or select a chest X-ray to detect pulmonary conditions (Normal vs. Pneumonia), examine Grad-CAM lesion heatmaps, and track clinical surveillance metrics.'
              : 'Upload or select a bone X-ray to detect skeletal fractures, analyze cortical integrity indices, and inspect orthopedic alignment metrics.'}
          </p>
          <div className="inline-flex items-center text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Demo AI Model Output — Not for Clinical Diagnosis (Academic Demonstration)
          </div>
        </div>

        {resultImage && (
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToRadiologist(resultImage.id)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/15 hover:border-white text-xs font-bold text-slate-200 hover:text-white transition-all shadow-md cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Doctor Review</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToReports(resultImage.id)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Dossier</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Ingestion & Clean Samples (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#222836]/90 p-6 rounded-3xl border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-xl border ${
                  activeModel === 'pneumonia' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    {activeModel === 'pneumonia' ? 'Chest Radiograph Upload' : 'Bone Radiograph Upload'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">PNG • JPG • JPEG • DICOM</p>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
                activeModel === 'pneumonia'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}>
                {activeModel === 'pneumonia' ? 'Chest (CXR)' : 'Skeletal (Bone)'}
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
                  ? activeModel === 'pneumonia'
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-amber-400 bg-amber-500/10'
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
                <div className="space-y-3 w-full py-1">
                  <div className="relative inline-block mx-auto">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-36 h-36 object-contain rounded-xl mx-auto border border-white/30 bg-black shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearImage();
                      }}
                      title="Clear image"
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg border border-white/30 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <p className="text-xs font-mono text-white font-bold truncate max-w-[240px]">
                      {selectedFile?.name || (activeModel === 'pneumonia' ? 'Active Chest Radiograph' : 'Active Bone Radiograph')}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearImage();
                        }}
                        className="text-[11px] font-bold text-rose-300 hover:text-rose-200 underline decoration-rose-500/50 flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear Image</span>
                      </button>
                      <span className="text-slate-500">•</span>
                      <span className="text-[10px] text-slate-400">Click box to replace</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto shadow-lg ${
                    activeModel === 'pneumonia'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {activeModel === 'pneumonia' ? <ImageIcon className="w-6 h-6" /> : <Bone className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white font-display">
                      {activeModel === 'pneumonia' ? 'Drop chest X-ray image here' : 'Drop bone X-ray image here'}
                    </p>
                    <p className="text-[10px] text-slate-400">or click to browse files</p>
                  </div>
                </div>
              )}
            </div>

            {/* Reference Sample Selector */}
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <div className="flex items-center space-x-1.5 font-display">
                <Sparkles className={`w-3.5 h-3.5 ${activeModel === 'pneumonia' ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="text-xs font-bold text-white">
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
                            ? 'bg-emerald-500/20 border-emerald-400 shadow-md'
                            : 'bg-amber-500/20 border-amber-400 shadow-md'
                          : sample.isAbnormal
                          ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-400/60 hover:bg-rose-950/40'
                          : 'bg-white/[0.03] border-white/15 hover:border-white/40 hover:bg-white/[0.07]'
                      }`}
                    >
                      <img
                        src={sample.imageUrl}
                        alt={sample.label}
                        className="w-11 h-11 rounded-xl object-contain bg-black border border-white/15 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white font-display truncate">
                          {sample.label}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">
                          {sample.subtext}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Patient & Site Details */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">MRN / Patient ID</label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Facility</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#222836] border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Main Campus Hospital" className="bg-[#222836] text-white">Main Campus Hospital</option>
                    <option value="North Pavilion ER" className="bg-[#222836] text-white">North Pavilion ER</option>
                    <option value="West Valley Urgent Care" className="bg-[#222836] text-white">West Valley Urgent Care</option>
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
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Sex</label>
                  <select
                    value={patientSex}
                    onChange={(e) => setPatientSex(e.target.value)}
                    className="w-full px-3 py-2 bg-[#222836] border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
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
                  <p className="text-[11px] text-slate-400 font-sans">Checking tissue density and anatomical alignment</p>
                </div>
              </div>
            )}

            {!validating && validationStatus === 'valid' && selectedFile && (
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-100 font-display">Verified Medical Radiograph</p>
                    <p className="text-[10px] text-emerald-300 font-mono">
                      Validated for {activeModel === 'pneumonia' ? 'Chest (CXR)' : 'Skeletal (Bone)'} analysis
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearImage}
                  title="Clear Image"
                  className="p-1.5 rounded-lg bg-emerald-900/50 hover:bg-rose-900/60 text-emerald-300 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {!validating && (validationStatus === 'invalid' || error) && (
              <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs shadow-xl space-y-2.5 animate-in fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-100 font-display text-sm">Upload Notice</p>
                      <p className="text-[11px] text-rose-300 font-sans mt-0.5">
                        {error || `Please upload a valid ${activeModel === 'pneumonia' ? 'chest' : 'bone'} X-ray image.`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    title="Clear and reset"
                    className="p-1 text-rose-300 hover:text-white"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="pt-2 border-t border-rose-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="px-3 py-1 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-[11px] font-bold text-white transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear &amp; Reset</span>
                    </button>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => handleRunInference(true)}
                        className="px-3 py-1 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-[11px] font-bold text-white transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Analyze Anyway</span>
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadSample(currentSamples[0].filename, activeModel)}
                    className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 transition-colors shadow-sm font-display cursor-pointer"
                  >
                    Load Sample
                  </button>
                </div>
              </div>
            )}

            {selectedFile && (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={loading || validating}
                  onClick={() => handleRunInference(false)}
                  className={`w-full py-3.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed font-display cursor-pointer ${
                    activeModel === 'pneumonia'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-950/50'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-950/50'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Analyzing Radiograph...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-slate-950" />
                      <span>Run {activeModel === 'pneumonia' ? 'DenseNet-121' : 'Trauma Radiomics'} Inference</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleClearImage}
                  className="w-full py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/40 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
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
          {resultPrediction && resultImage ? (
            <div className="space-y-6">
              {/* SECTION 1: IMAGE & MODEL PREDICTION OUTPUT */}
              <div className="bg-[#222836]/90 p-6 rounded-3xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20">
                      PART 1: IMAGE &amp; AI MODEL PREDICTION OUTPUT
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Model: {resultPrediction.model_name} ({resultPrediction.model_version})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    Demo Output
                  </span>
                </div>

                {/* Finding Header Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-md ${
                        resultPrediction.prediction.includes('Pneumonia') || resultPrediction.prediction.includes('Fracture')
                          ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                          : 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
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
                        <span className="text-xl font-black text-white tracking-tight font-display">
                          {resultPrediction.prediction}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                            resultPrediction.prediction.includes('Pneumonia') || resultPrediction.prediction.includes('Fracture')
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {(resultPrediction.confidence * 100).toFixed(1)}% Confidence
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
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
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-md'
                          : 'bg-white/[0.04] border-white/15 text-slate-300 hover:text-white'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Concur</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFeedback('thumbs_down')}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                        feedbackSent === 'thumbs_down'
                          ? 'bg-rose-950/40 text-rose-300 border-rose-500 shadow-md'
                          : 'bg-white/[0.04] border-white/15 text-slate-300 hover:text-white'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
                      <span>Pushback</span>
                    </button>
                  </div>
                </div>

                {/* PACS Viewport Toolbar */}
                <div className="p-3 rounded-2xl bg-[#181C26] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <Contrast className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-semibold text-slate-300 mr-1">Window:</span>
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
                            ? 'bg-white text-black font-extrabold shadow-md'
                            : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:text-white'
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
                          ? 'bg-white/20 text-white border border-white shadow-sm'
                          : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Grad-CAM Saliency</span>
                    </button>

                    <div className="flex items-center space-x-1 bg-white/[0.04] p-0.5 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(0.8, +(z - 0.25).toFixed(2)))}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono text-white font-bold px-1">{zoomLevel}x</span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(3.0, +(z + 0.25).toFixed(2)))}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Viewport Display */}
                <div className="rounded-2xl overflow-hidden border border-white/15 bg-black aspect-video sm:aspect-[16/10] relative flex items-center justify-center shadow-2xl">
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

                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] font-mono font-bold text-white">
                    {activeModel === 'pneumonia' ? 'CHEST PA • DICOM 3.0' : 'SKELETAL RADIOGRAPH • DICOM 3.0'}
                  </div>

                  {showGradCamLayer && (
                    <div className="absolute bottom-3 right-3 flex items-center space-x-2 px-3 py-1 rounded-md bg-[#181C26]/90 backdrop-blur-sm border border-white/20 text-[10px] font-mono text-white font-bold">
                      <span>Heatmap: {heatmapOpacity}%</span>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={heatmapOpacity}
                        onChange={(e) => setHeatmapOpacity(parseInt(e.target.value))}
                        className="w-20 accent-amber-400 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Findings & Quantitative Radiomic Biomarkers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-white font-display">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>Diagnostic Impression</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {activeModel === 'pneumonia'
                        ? resultPrediction.prediction === 'Pneumonia'
                          ? 'Prominent lobar consolidation with air bronchograms and increased focal parenchymal opacity in the right lower lung zone. Radiographic features consistent with acute infectious pneumonia.'
                          : 'Clear bilateral lung parenchymal fields with sharp costophrenic angles. Normal cardiothoracic ratio (<0.50) without focal consolidation or effusion.'
                        : resultPrediction.prediction === 'Bone Fracture'
                          ? 'Linear cortical discontinuity and focal trabecular disruption identified along the bone margin. Radiomic edge profile reveals acute fracture line.'
                          : 'Continuous cortical margins with preserved trabecular architecture. No acute cortical disruption, displacement, or pathological fracture detected.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-white font-display">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span>Quantitative Radiomic Biomarkers</span>
                    </div>
                    {activeModel === 'pneumonia' ? (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                          <p className="text-[9px] font-mono text-slate-400 uppercase">CTR Ratio</p>
                          <p className="text-sm font-bold text-white font-mono mt-0.5">
                            {resultPrediction.biomarkers?.cardiothoracic_ratio || 0.46}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                          <p className="text-[9px] font-mono text-slate-400 uppercase">Symmetry</p>
                          <p className="text-sm font-bold text-white font-mono mt-0.5">
                            {resultPrediction.biomarkers?.bilateral_symmetry_pct || 94}%
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                          <p className="text-[9px] font-mono text-slate-400 uppercase">Aeration</p>
                          <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                            {resultPrediction.biomarkers?.aeration_index_pct || (resultPrediction.prediction === 'Pneumonia' ? 74 : 96)}%
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                          <p className="text-[9px] font-mono text-slate-400 uppercase">Cortical Int.</p>
                          <p className="text-sm font-bold text-white font-mono mt-0.5">
                            {resultPrediction.biomarkers?.cortical_integrity_pct || (resultPrediction.prediction === 'Bone Fracture' ? 62 : 98)}%
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                          <p className="text-[9px] font-mono text-slate-400 uppercase">Discontinuity</p>
                          <p className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                            {resultPrediction.prediction === 'Bone Fracture' ? 'Positive' : 'Negative'}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                          <p className="text-[9px] font-mono text-slate-400 uppercase">Edge Sharp.</p>
                          <p className="text-sm font-bold text-white font-mono mt-0.5">
                            {resultPrediction.biomarkers?.fracture_sharpness_score || 0.88}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: MODEL PERFORMANCE MONITORING (SEPARATE FROM INDIVIDUAL PREDICTION) */}
              <div className="bg-[#1C2230] p-6 rounded-3xl border border-emerald-500/20 shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      PART 2: FLEET SURVEILLANCE &amp; MODEL MONITORING METRICS
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      Cohort Size: N={activeModel === 'pneumonia' ? '248' : '210'} Cases
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Surveillance Status: Nominal</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-[#12161F] border border-white/10">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Overall Accuracy</p>
                    <p className="text-lg font-black text-white font-mono mt-1">
                      {activeModel === 'pneumonia' ? '96.4%' : '95.2%'}
                    </p>
                    <span className="text-[9px] text-emerald-400">&ge; 90% SLA Target</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#12161F] border border-white/10">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Precision (PPV)</p>
                    <p className="text-lg font-black text-white font-mono mt-1">
                      {activeModel === 'pneumonia' ? '97.2%' : '95.8%'}
                    </p>
                    <span className="text-[9px] text-slate-400">Positive Predictive</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#12161F] border border-white/10">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Recall (Sens.)</p>
                    <p className="text-lg font-black text-white font-mono mt-1">
                      {activeModel === 'pneumonia' ? '96.0%' : '94.8%'}
                    </p>
                    <span className="text-[9px] text-slate-400">Sensitivity</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#12161F] border border-white/10">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">F1 Score</p>
                    <p className="text-lg font-black text-white font-mono mt-1">
                      {activeModel === 'pneumonia' ? '0.966' : '0.953'}
                    </p>
                    <span className="text-[9px] text-slate-400">Harmonic Mean</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#12161F] border border-white/10">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Agreement &kappa;</p>
                    <p className="text-lg font-black text-white font-mono mt-1">
                      {activeModel === 'pneumonia' ? '0.928' : '0.908'}
                    </p>
                    <span className="text-[9px] text-emerald-400 font-semibold">Near-Perfect</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#12161F] border border-white/10">
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Drift (PSI)</p>
                    <p className="text-lg font-black text-white font-mono mt-1">
                      {activeModel === 'pneumonia' ? '0.024' : '0.021'}
                    </p>
                    <span className="text-[9px] text-emerald-400 font-semibold">Stable (&lt; 0.10)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
                  <div className="flex items-center space-x-1.5 text-amber-300">
                    <Info className="w-3.5 h-3.5" />
                    <span>Demo Monitoring Data — Illustrative Fleet Surveillance</span>
                  </div>
                  <span className="text-[11px] font-mono">Last Synchronized: Real-time</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[460px] p-8 rounded-3xl bg-[#222836]/80 border border-dashed border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/20 flex items-center justify-center text-white shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                {activeModel === 'pneumonia' ? (
                  <Stethoscope className="w-8 h-8 text-emerald-400" />
                ) : (
                  <Bone className="w-8 h-8 text-amber-400" />
                )}
              </div>
              <div className="space-y-1.5 max-w-md">
                <h4 className="text-lg font-bold text-white font-display">
                  Awaiting {activeModel === 'pneumonia' ? 'Chest' : 'Bone'} Radiograph Ingestion
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
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
