import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Download, 
  Layers, RefreshCw, Sparkles, User, Info, Stethoscope, Eye, Sliders
} from 'lucide-react';
import type { SampleXRay, ImageData, PredictionData, RadiologistReportData } from '../types';
import { API_BASE } from '../api/client';

interface DiagnosticStudioProps {
  samples: SampleXRay[];
  onUploadAndPredict: (formData: FormData) => Promise<any>;
  onLoadSample: (filename: string) => Promise<any>;
  onSubmitRadiologistReport: (data: any) => Promise<any>;
}

export const DiagnosticStudio: React.FC<DiagnosticStudioProps> = ({
  samples,
  onUploadAndPredict,
  onLoadSample,
  onSubmitRadiologistReport
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('PAT-9082');
  const [patientAge, setPatientAge] = useState(58);
  const [patientSex, setPatientSex] = useState<'M' | 'F'>('M');
  const [siteId, setSiteId] = useState('Main Hospital');

  const [isLoading, setIsLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionData | null>(null);
  const [currentReport, setCurrentReport] = useState<RadiologistReportData | null>(null);

  // Grad-CAM opacity slider
  const [camOpacity, setCamOpacity] = useState(0.85);

  // Radiologist form state
  const [radFinding, setRadFinding] = useState<'Normal' | 'Pneumonia'>('Normal');
  const [radConfidence, setRadConfidence] = useState('High');
  const [radNotes, setRadNotes] = useState('');
  const [isSubmittingRad, setIsSubmittingRad] = useState(false);

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRunInference = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setCurrentReport(null);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('patient_id', patientId);
      fd.append('patient_age', patientAge.toString());
      fd.append('patient_sex', patientSex);
      fd.append('site_id', siteId);

      const res = await onUploadAndPredict(fd);
      if (res && res.image && res.prediction) {
        setCurrentImage(res.image);
        setCurrentPrediction(res.prediction);
        setRadFinding(res.prediction.prediction);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSample = async (sample: SampleXRay) => {
    setIsLoading(true);
    setCurrentReport(null);
    try {
      const res = await onLoadSample(sample.filename);
      if (res && res.image && res.prediction) {
        setCurrentImage(res.image);
        setCurrentPrediction(res.prediction);
        setPreviewUrl(res.image.image_url);
        setRadFinding(sample.condition);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!currentImage) return;
    setIsSubmittingRad(true);
    try {
      const payload = {
        image_id: currentImage.id,
        finding_label: radFinding,
        confidence_level: radConfidence,
        clinical_notes: radNotes || `Clinical evaluation conducted. Ground truth assessment: ${radFinding}.`,
        radiologist_id_code: 'RAD_401',
        radiologist_name: 'Dr. Julian Reed, MD'
      };
      const res = await onSubmitRadiologistReport(payload);
      if (res && res.report) {
        setCurrentReport(res.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRad(false);
    }
  };

  const handleDownloadCasePdf = () => {
    if (!currentImage) return;
    window.open(`${API_BASE}/reports/case/${currentImage.id}/pdf`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Diagnostic & Inference Studio
          </h1>
          <p className="text-sm text-slate-400">
            Upload chest radiographs, execute DenseNet-121 classification with Grad-CAM, and perform radiologist adjudication.
          </p>
        </div>
      </div>

      {/* Preset Sample Gallery */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Preset Clinical Test Samples (One-Click Inference)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {samples.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              disabled={isLoading}
              className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/50 transition-all flex items-center justify-between group text-left disabled:opacity-50"
            >
              <div>
                <span className="text-xs font-medium text-slate-200 block group-hover:text-sky-300">
                  {sample.title}
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  sample.condition === 'Pneumonia' ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {sample.condition}
                </span>
              </div>
              <span className="text-xs text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Load →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload & Patient Form (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Upload Area */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all text-center relative"
          >
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
            />
            <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 text-sky-400 mb-2" />
              <span className="text-xs font-semibold text-slate-200">
                {selectedFile ? selectedFile.name : 'Choose or drop Chest X-Ray'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                PNG, JPEG, TIFF, DICOM up to 25MB
              </span>
            </div>
          </div>

          {/* Demographics Form */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>Study Demographics</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Patient Identifier (De-ID)</label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Sex</label>
                  <select
                    value={patientSex}
                    onChange={(e) => setPatientSex(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Imaging Site</label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="Main Hospital">Main Campus Hospital</option>
                  <option value="North Pavilion Urgent Care">North Pavilion Urgent Care</option>
                  <option value="Trauma Imaging Suite">Trauma Imaging Suite</option>
                  <option value="East Medical Center">East Medical Center</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunInference}
              disabled={!selectedFile || isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Running Inference...' : 'Execute DenseNet-121 Inference'}</span>
            </button>
          </div>
        </div>

        {/* Right: X-Ray & Grad-CAM Heatmap Viewer + Results + Ground Truth (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Main Visualizer Panel */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Chest Radiograph & Grad-CAM Visualizer</h3>
              </div>

              {currentPrediction && (
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>Heatmap Opacity:</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={camOpacity}
                    onChange={(e) => setCamOpacity(Number(e.target.value))}
                    className="w-24 accent-sky-400 cursor-pointer"
                  />
                  <span className="font-mono text-sky-400 text-xs w-8">{Math.round(camOpacity * 100)}%</span>
                </div>
              )}
            </div>

            {/* Visualizer Display Box */}
            <div className="h-80 bg-black rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800/80">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-sky-400 font-medium">Extracting pulmonary activations & Grad-CAM...</span>
                </div>
              ) : currentImage && currentPrediction ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Base Original Image */}
                  <img
                    src={currentImage.image_url}
                    alt="Original CXR"
                    className="absolute inset-0 w-full h-full object-contain"
                  />

                  {/* Grad-CAM Overlay with dynamic opacity */}
                  {currentPrediction.heatmap_url && (
                    <img
                      src={currentPrediction.heatmap_url}
                      alt="Grad-CAM Overlay"
                      style={{ opacity: camOpacity }}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-150"
                    />
                  )}

                  {/* Watermark badge */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/75 backdrop-blur-sm border border-slate-700 text-[10px] text-slate-300">
                    DenseNet-121 • Class: {currentPrediction.prediction} ({Math.round(currentPrediction.confidence * 100)}%)
                  </div>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="X-Ray Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-500 space-y-2">
                  <Eye className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">Select a preset sample above or upload an X-ray to inspect activations.</p>
                </div>
              )}
            </div>

            {/* Inference Prediction Banner */}
            {currentPrediction && (
              <div className={`p-4 rounded-xl border transition-all ${
                currentPrediction.prediction === 'Pneumonia'
                  ? 'bg-rose-950/40 border-rose-800/60'
                  : 'bg-emerald-950/40 border-emerald-800/60'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        DenseNet-121 AI Classification:
                      </span>
                      <span className={`text-base font-bold font-mono ${
                        currentPrediction.prediction === 'Pneumonia' ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {currentPrediction.prediction.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Confidence Score: <b className="text-white font-mono">{(currentPrediction.confidence * 100).toFixed(1)}%</b> • Inference Latency: <b className="text-white font-mono">{currentPrediction.latency_ms} ms</b>
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadCasePdf}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Case PDF</span>
                  </button>
                </div>

                {/* Probability Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Normal: {Math.round(currentPrediction.probabilities.Normal * 100)}%</span>
                    <span>Pneumonia: {Math.round(currentPrediction.probabilities.Pneumonia * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${currentPrediction.probabilities.Normal * 100}%` }} 
                      className="bg-emerald-500 h-full"
                    />
                    <div 
                      style={{ width: `${currentPrediction.probabilities.Pneumonia * 100}%` }} 
                      className="bg-rose-500 h-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Radiologist Ground Truth & Adjudication Box */}
          {currentImage && currentPrediction && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Stethoscope className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Radiologist Ground Truth & Concordance Review</h3>
                </div>
                {currentReport && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    currentReport.agreement_status === 'Concordant'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    {currentReport.agreement_status} ({currentReport.discordance_type})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Radiologist Clinical Finding</label>
                  <div className="flex space-x-2">
                    {(['Normal', 'Pneumonia'] as const).map((finding) => (
                      <button
                        key={finding}
                        type="button"
                        onClick={() => setRadFinding(finding)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                          radFinding === finding
                            ? finding === 'Normal'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {finding}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Diagnostic Confidence</label>
                  <select
                    value={radConfidence}
                    onChange={(e) => setRadConfidence(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="High">High Diagnostic Certainty</option>
                    <option value="Moderate">Moderate Certainty</option>
                    <option value="Low">Low / Borderline Read</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Clinical Impression & Notes</label>
                <textarea
                  rows={2}
                  value={radNotes}
                  onChange={(e) => setRadNotes(e.target.value)}
                  placeholder="e.g. Right lower lobe infiltrates confirmed on PA view. No pneumothorax or effusion."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={handleSubmitReport}
                  disabled={isSubmittingRad}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmittingRad ? 'Saving...' : 'Submit Ground Truth & Evaluate Concordance'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
