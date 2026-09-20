import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  RefreshCw,
  Search,
  FileText,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Layers,
  Contrast,
  ChevronLeft,
  ChevronRight,
  Zap,
  Tag,
  MapPin,
  X,
  AlertTriangle
} from 'lucide-react';
import { api, getMediaUrl, type CaseRecord } from '../api/client';

interface RadiologistComparisonViewProps {
  initialImageId?: string;
  onNavigateToReports: (imageId: string) => void;
}

// Window / Level image filter presets
type FilterPreset = 'normal' | 'lung' | 'bone' | 'invert' | 'high_contrast';

export const RadiologistComparisonView: React.FC<RadiologistComparisonViewProps> = ({
  initialImageId,
  onNavigateToReports,
}) => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [findingLabel, setFindingLabel] = useState<'Normal' | 'Pneumonia' | 'Bone Fracture'>('Normal');
  const [confidenceLevel, setConfidenceLevel] = useState<'High' | 'Moderate' | 'Low'>('High');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [radiologistName, setRadiologistName] = useState('Dr. Julian Reed, MD');
  const [radiologistCode, setRadiologistCode] = useState('RAD_401');

  // Interactive Viewport State (PACS Tools)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showGradCamLayer, setShowGradCamLayer] = useState<boolean>(true);
  const [gradCamOpacity, setGradCamOpacity] = useState<number>(0.65);
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('normal');
  const [isFullscreenViewer, setIsFullscreenViewer] = useState<boolean>(false);

  // Secondary Findings & Localization Tags
  const [selectedPathologies, setSelectedPathologies] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('Bilateral');
  const [discordanceReason, setDiscordanceReason] = useState<string>('None');

  const [filterAgreement, setFilterAgreement] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, [filterAgreement]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const res = await api.getPredictionHistory({
        agreement: filterAgreement === 'all' ? undefined : filterAgreement,
        limit: 100,
      });
      const data: CaseRecord[] = res.cases || [];
      setCases(data);

      const targetId = initialImageId || sessionStorage.getItem('scanova_latest_upload_id');
      if (targetId) {
        const found = data.find((c: CaseRecord) => c.image_id === targetId);
        if (found) {
          handleSelectCase(found);
        } else if (data.length > 0) {
          handleSelectCase(data[0]);
        }
      } else if (data.length > 0 && !selectedCase) {
        handleSelectCase(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load radiologist cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCase = (c: CaseRecord) => {
    setSelectedCase(c);
    setFeedback(null);
    setZoomLevel(1.0);
    setFilterPreset('normal');
    setSelectedPathologies([]);
    setDiscordanceReason('None');

    if (c.radiologist) {
      setFindingLabel(c.radiologist.finding as any);
      setConfidenceLevel(c.radiologist.confidence as any);
      setClinicalNotes(c.radiologist.notes);
      setRadiologistName(c.radiologist.name);
      setRadiologistCode(c.radiologist.code);
    } else {
      setFindingLabel(c.prediction?.label as any || 'Normal');
      setConfidenceLevel('High');
      setClinicalNotes('');
    }
  };

  const togglePathology = (pathology: string) => {
    setSelectedPathologies((prev) =>
      prev.includes(pathology) ? prev.filter((p) => p !== pathology) : [...prev, pathology]
    );
  };

  const applyTemplate = (templateType: 'normal' | 'pneumonia' | 'viral' | 'equivocal') => {
    let text = '';
    switch (templateType) {
      case 'normal':
        setFindingLabel('Normal');
        setSelectedPathologies([]);
        setSelectedZone('Bilateral Clear');
        text = 'Lungs are clear bilaterally without focal consolidation, pneumothorax, or pleural effusion. Cardiomediastinal contours are normal (<0.50 CTR). Osseous structures are intact. Impression: No acute cardiopulmonary abnormality.';
        break;
      case 'pneumonia':
        setFindingLabel('Pneumonia');
        setSelectedPathologies(['Consolidation', 'Air Bronchogram']);
        setSelectedZone('Right Lower Lobe (RLL)');
        text = 'Focal alveolar airspace opacity noted in the right lower lung zone with air bronchograms, consistent with bacterial lobar pneumonia. No pleural effusion or pneumothorax identified.';
        break;
      case 'viral':
        setFindingLabel('Pneumonia');
        setSelectedPathologies(['Infiltrate', 'Interstitial Markings']);
        setSelectedZone('Bilateral Diffuse');
        text = 'Diffuse bilateral interstitial and perihilar opacities without prominent lobar consolidation. Findings characteristic of viral bronchopneumonia or atypical pulmonary process.';
        break;
      case 'equivocal':
        setFindingLabel('Normal');
        setSelectedPathologies(['Infiltrate']);
        setSelectedZone('Perihilar');
        text = 'Mild prominence of perihilar bronchovascular markings, possibly artifactual or low inspiratory volume. Recommend correlation with clinical markers or repeat radiograph.';
        break;
    }
    setClinicalNotes(text);
  };

  const handleZoneSelect = (zone: string) => {
    setSelectedZone(zone);
    if (zone !== 'Bilateral Clear') {
      setClinicalNotes((prev) => {
        if (!prev.includes(`[Zone: ${zone}]`)) {
          return `${prev.trim()} [Zone: ${zone}]`.trim();
        }
        return prev;
      });
    }
  };

  const handleQuickConcordantSign = async () => {
    if (!selectedCase || !selectedCase.prediction) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const predLabel = selectedCase.prediction.label as any;
      const res = await api.submitRadiologistReport({
        image_id: selectedCase.image_id,
        finding_label: predLabel,
        confidence_level: 'High',
        clinical_notes: `Confirmed concordant with AI diagnostic model (${selectedCase.prediction.model_version}). No discordant findings observed upon peer adjudication.`,
        radiologist_id_code: radiologistCode,
        radiologist_name: radiologistName,
      });
      setFeedback(res.message);
      await loadCases();
    } catch (err: any) {
      setFeedback(`Error: ${err.message || 'Failed to submit concordant report'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const fullNotes = discordanceReason !== 'None'
        ? `[Discordance Reason: ${discordanceReason}] ${clinicalNotes}`
        : clinicalNotes;

      const res = await api.submitRadiologistReport({
        image_id: selectedCase.image_id,
        finding_label: findingLabel,
        confidence_level: confidenceLevel,
        clinical_notes: fullNotes,
        radiologist_id_code: radiologistCode,
        radiologist_name: radiologistName,
      });

      setFeedback(res.message);
      await loadCases();
    } catch (err: any) {
      setFeedback(`Error: ${err.message || 'Failed to submit report'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.accession_number.toLowerCase().includes(q) ||
      c.patient_id_hash.toLowerCase().includes(q) ||
      (c.prediction?.label || '').toLowerCase().includes(q)
    );
  });

  const currentIndex = selectedCase ? filteredCases.findIndex((c) => c.image_id === selectedCase.image_id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredCases.length - 1;

  const navigatePrev = () => {
    if (hasPrev) handleSelectCase(filteredCases[currentIndex - 1]);
  };

  const navigateNext = () => {
    if (hasNext) handleSelectCase(filteredCases[currentIndex + 1]);
  };

  const getFilterStyle = () => {
    switch (filterPreset) {
      case 'lung':
        return 'contrast-[140%] brightness-[95%]';
      case 'bone':
        return 'contrast-[165%] brightness-[85%]';
      case 'invert':
        return 'invert contrast-[130%]';
      case 'high_contrast':
        return 'contrast-[180%] brightness-[110%]';
      default:
        return 'contrast-100 brightness-100';
    }
  };

  const isDiscordantPreview = selectedCase?.prediction && selectedCase.prediction.label !== findingLabel;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header - Clean White Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-slate-900">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Doctor Review & Ground Truth Workstation
            </span>
            <span className="text-xs text-slate-500 font-medium">DICOM Viewport • Grad-CAM Overlay • Multi-Zone Pathology</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Radiologist Case Adjudication & Concordance Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed font-sans">
            Examine patient chest radiographs with PACS window/level presets, evaluate Grad-CAM heatmaps, apply diagnostic templates, and file ground truth.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={loadCases}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Case List (4 cols) & Right Adjudication Workstation (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Searchable Case Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 text-slate-900">
            {/* Search & Filter Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search accession # or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 font-sans"
              />
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-[11px] font-bold text-center">
              {(['all', 'Concordant', 'Discordant'] as const).map((ag) => (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setFilterAgreement(ag)}
                  className={`py-1.5 rounded-xl capitalize transition-all cursor-pointer ${filterAgreement === ag
                    ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {ag === 'all' ? 'All' : ag}
                </button>
              ))}
            </div>

            {/* Case List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredCases.map((c) => {
                const isSelected = selectedCase?.image_id === c.image_id;
                const pred = c.prediction;
                const rad = c.radiologist;
                const isPneu = pred?.label === 'Pneumonia';
                const isConcordant = rad?.agreement === 'Concordant';

                return (
                  <div
                    key={c.image_id}
                    onClick={() => handleSelectCase(c)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${isSelected
                      ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">{c.accession_number}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isPneu
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                      >
                        AI: {pred?.label || 'N/A'} ({(pred ? pred.confidence * 100 : 0).toFixed(0)}%)
                      </span>

                      <div>
                        {rad ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isConcordant
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                          >
                            {rad.agreement}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-semibold italic">Awaiting Read</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Adjudication Workstation (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedCase ? (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5 text-slate-900">
              {/* Study Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-display">
                      Study Workstation
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-xs font-bold text-emerald-700">{selectedCase.accession_number}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-sans">
                    Patient: {selectedCase.patient_age}y / {selectedCase.patient_sex} | Site: <span className="font-semibold text-slate-900">{selectedCase.site_id}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={navigatePrev}
                      disabled={!hasPrev}
                      title="Previous Case"
                      className={`p-1.5 rounded-xl ${hasPrev ? 'hover:bg-white text-slate-800 cursor-pointer shadow-sm' : 'text-slate-400 cursor-not-allowed'}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-mono px-2 text-slate-700">
                      {currentIndex + 1} / {filteredCases.length}
                    </span>
                    <button
                      type="button"
                      onClick={navigateNext}
                      disabled={!hasNext}
                      title="Next Case"
                      className={`p-1.5 rounded-xl ${hasNext ? 'hover:bg-white text-slate-800 cursor-pointer shadow-sm' : 'text-slate-400 cursor-not-allowed'}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToReports(selectedCase.image_id)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PDF Dossier</span>
                  </button>
                </div>
              </div>

              {/* PACS Viewport Controls Toolbar */}
              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-1.5">
                  <Contrast className="w-4 h-4 text-slate-700" />
                  <span className="text-[11px] font-semibold text-slate-700 mr-1">PACS Window:</span>
                  {(
                    [
                      { id: 'normal', label: 'Standard' },
                      { id: 'lung', label: 'Lung Parenchyma' },
                      { id: 'bone', label: 'Bone / Edge' },
                      { id: 'invert', label: 'Invert' },
                      { id: 'high_contrast', label: 'High Contrast' },
                    ] as const
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFilterPreset(preset.id)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${filterPreset === preset.id
                        ? 'bg-slate-900 text-white font-extrabold shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
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
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${showGradCamLayer
                      ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Grad-CAM Fusion</span>
                  </button>

                  <div className="flex items-center space-x-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-sm">
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
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1.0)}
                      className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFullscreenViewer(true)}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer shadow-sm"
                    title="Fullscreen Diagnostic View"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Imagery & Readout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-square relative flex items-center justify-center shadow-md">
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center transition-transform duration-150"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    <img
                      src={getMediaUrl(selectedCase.image_url)}
                      alt="CXR"
                      className={`w-full h-full object-contain ${getFilterStyle()}`}
                    />

                    {showGradCamLayer && selectedCase.prediction?.heatmap_url && (
                      <img
                        src={getMediaUrl(selectedCase.prediction.heatmap_url)}
                        alt="Grad-CAM Layer"
                        className="w-full h-full object-contain absolute inset-0 mix-blend-screen pointer-events-none transition-opacity duration-200"
                        style={{ opacity: gradCamOpacity }}
                      />
                    )}
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-white/20 text-[10px] font-mono font-bold text-white">
                    PA CXR • {filterPreset.toUpperCase()}
                  </div>

                  {showGradCamLayer && (
                    <div className="absolute bottom-2.5 right-2.5 flex items-center space-x-2 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-white/20 text-[10px] font-mono text-white font-bold shadow-sm">
                      <span>Opacity:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={gradCamOpacity}
                        onChange={(e) => setGradCamOpacity(parseFloat(e.target.value))}
                        className="w-16 h-1 accent-emerald-400 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                        {selectedCase.prediction?.label === 'Bone Fracture' || selectedCase.prediction?.label === 'Intact Bone'
                          ? 'Trauma ResNet-50 Skeletal AI Finding'
                          : 'DenseNet-121 Clinical AI Finding'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        PyTorch 2.6
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                      <div>
                        <p
                          className={`text-xl font-black font-display ${
                            selectedCase.prediction?.label === 'Bone Fracture'
                              ? 'text-amber-600'
                              : selectedCase.prediction?.label === 'Pneumonia'
                              ? 'text-rose-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {selectedCase.prediction?.label === 'Bone Fracture'
                            ? 'Bone Fracture Identified'
                            : selectedCase.prediction?.label === 'Intact Bone'
                            ? 'Intact Bone Framework'
                            : selectedCase.prediction?.label === 'Pneumonia'
                            ? 'Pathology / Infiltrate'
                            : 'Normal CXR'}
                        </p>
                        <p className="text-xs text-slate-600 font-mono mt-0.5">
                          Confidence: <span className="font-bold text-slate-900">{((selectedCase.prediction?.confidence || 0.95) * 100).toFixed(1)}%</span>
                        </p>
                      </div>
                      <div className="text-right text-[11px] font-mono text-slate-500">
                        <p>Latency: <span className="text-slate-900 font-bold">{selectedCase.prediction?.latency_ms || 118} ms</span></p>
                        <p className="text-emerald-600 font-semibold">Sub-200ms Target</p>
                      </div>
                    </div>

                    {selectedCase.radiologist && (
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5 text-xs shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Filed Ground Truth:</span>
                          <span className="font-bold text-slate-900 font-mono">{selectedCase.radiologist.finding}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Concordance:</span>
                          <span
                            className={`font-bold font-mono ${selectedCase.radiologist.agreement === 'Concordant' ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                          >
                            {selectedCase.radiologist.agreement}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-100">
                          "{selectedCase.radiologist.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                      <span>Agree with AI Finding?</span>
                      <span className="text-emerald-700 font-mono font-bold">1-Click Fast Adjudication</span>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleQuickConcordantSign}
                      className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer font-display shadow-sm"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Concur & 1-Click Sign as Concordant</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dictation Templates */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 font-display">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Smart Clinical Dictation Templates</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans">Click to insert structured impression:</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => applyTemplate('normal')}
                    className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 text-left transition-all cursor-pointer group shadow-sm"
                  >
                    <p className="text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800">Clear / Normal</p>
                    <p className="text-[9px] text-slate-500 truncate">No consolidation or effusion</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTemplate('pneumonia')}
                    className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-rose-500 text-left transition-all cursor-pointer group shadow-sm"
                  >
                    <p className="text-[11px] font-bold text-rose-700 group-hover:text-rose-800">Focal Pneumonia</p>
                    <p className="text-[9px] text-slate-500 truncate">Lobar consolidation pattern</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTemplate('viral')}
                    className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 text-left transition-all cursor-pointer group shadow-sm"
                  >
                    <p className="text-[11px] font-bold text-amber-700 group-hover:text-amber-800">Multifocal / Viral</p>
                    <p className="text-[9px] text-slate-500 truncate">Bilateral patchy markings</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTemplate('equivocal')}
                    className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 text-left transition-all cursor-pointer group shadow-sm"
                  >
                    <p className="text-[11px] font-bold text-slate-800 group-hover:text-slate-900">Equivocal / Indeterminate</p>
                    <p className="text-[9px] text-slate-500 truncate">Recommend repeat radiograph</p>
                  </button>
                </div>
              </div>

              {/* Secondary Pathology Checkers */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 font-display">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Secondary Pathology Tags & Localization</span>
                  </span>
                  <div className="flex items-center space-x-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-600 mr-1">Anatomy Zone:</span>
                    <select
                      value={selectedZone}
                      onChange={(e) => handleZoneSelect(e.target.value)}
                      className="py-1 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-sans"
                    >
                      <option value="Bilateral Clear">Bilateral Clear</option>
                      <option value="Right Upper Lobe (RUL)">Right Upper Lobe (RUL)</option>
                      <option value="Right Middle Lobe (RML)">Right Middle Lobe (RML)</option>
                      <option value="Right Lower Lobe (RLL)">Right Lower Lobe (RLL)</option>
                      <option value="Left Upper Lobe (LUL)">Left Upper Lobe (LUL)</option>
                      <option value="Left Lower Lobe (LLL)">Left Lower Lobe (LLL)</option>
                      <option value="Bilateral Diffuse">Bilateral Diffuse</option>
                      <option value="Perihilar">Perihilar</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Consolidation',
                    'Pleural Effusion',
                    'Atelectasis',
                    'Air Bronchogram',
                    'Infiltrate',
                    'Interstitial Markings',
                    'Cardiomegaly',
                    'Pneumothorax',
                    'Rib Fracture',
                    'Cortical Discontinuity',
                    'Clavicle Fracture',
                    'Cavitation',
                    'Fibrosis'
                  ].map((pathology) => {
                    const active = selectedPathologies.includes(pathology);
                    return (
                      <button
                        key={pathology}
                        type="button"
                        onClick={() => togglePathology(pathology)}
                        className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${active
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'bg-white border border-slate-300 text-slate-700 hover:border-slate-400'
                          }`}
                      >
                        {pathology}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Discordance Alert */}
              {isDiscordantPreview && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 animate-in fade-in duration-200 text-amber-900">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold font-display">
                      Discordance Detected: AI ({selectedCase.prediction?.label}) &ne; Doctor ({findingLabel})
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Select the clinical discordance root cause to feed back into the AI quality surveillance loop:
                  </p>
                  <select
                    value={discordanceReason}
                    onChange={(e) => setDiscordanceReason(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-sans"
                  >
                    <option value="None">-- Select Root Cause for Disagreement --</option>
                    <option value="Subtle / Early-Stage Infiltrate">Subtle / Early-Stage Infiltrate</option>
                    <option value="Motion / Inspiration Artifact">Motion / Inspiration Artifact</option>
                    <option value="AI False Positive">AI False Positive</option>
                    <option value="Underlying Chronic Cardiomegaly / Effusion">Underlying Chronic Cardiomegaly / Effusion</option>
                    <option value="Atypical Patchy Morphology">Atypical Patchy Morphology</option>
                  </select>
                </div>
              )}

              {feedback && (
                <div
                  className={`p-4 rounded-2xl text-xs flex items-center space-x-2 ${feedback.startsWith('Error')
                    ? 'bg-rose-50 border border-rose-300 text-rose-800'
                    : 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{feedback}</span>
                </div>
              )}

              {/* Radiologist Ground Truth Entry Form */}
              <form onSubmit={handleSubmitReport} className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                  Official Radiologist Ground Truth Entry
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ground Truth Diagnosis
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFindingLabel('Normal')}
                        className={`py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${findingLabel === 'Normal'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        Normal CXR
                      </button>
                      <button
                        type="button"
                        onClick={() => setFindingLabel('Pneumonia')}
                        className={`py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${findingLabel === 'Pneumonia'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        Pneumonia
                      </button>
                      <button
                        type="button"
                        onClick={() => setFindingLabel('Bone Fracture')}
                        className={`py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${findingLabel === 'Bone Fracture'
                          ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                          : 'bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        Bone Fracture
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Diagnostic Confidence
                    </label>
                    <select
                      value={confidenceLevel}
                      onChange={(e) => setConfidenceLevel(e.target.value as any)}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-sans cursor-pointer"
                    >
                      <option value="High">High Diagnostic Certainty (Gold Standard)</option>
                      <option value="Moderate">Moderate Diagnostic Certainty</option>
                      <option value="Low">Low / Equivocal Read</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Attending Radiologist Name
                    </label>
                    <input
                      type="text"
                      value={radiologistName}
                      onChange={(e) => setRadiologistName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Radiologist ID Code</label>
                    <input
                      type="text"
                      value={radiologistCode}
                      onChange={(e) => setRadiologistCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinical Impression & Adjudication Notes
                  </label>
                  <textarea
                    rows={3}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Enter radiological findings, focal opacities, pleural effusion, or secondary diagnostic notes..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all font-display cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Filing Ground Truth into Certified Store...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <span>Sign & File Certified Radiologist Ground Truth</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="h-full min-h-[420px] p-8 rounded-3xl bg-white border-2 border-dashed border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
              <FileCheck2 className="w-10 h-10 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800 font-display">Select a case on the left queue to enter radiologist ground truth.</p>
              <p className="text-xs text-slate-500">Complete with PACS zoom/pan, Grad-CAM fusion, and smart dictation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreenViewer && selectedCase && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Diagnostic Fullscreen Lightbox — {selectedCase.accession_number}
              </h2>
              <p className="text-xs text-slate-400">
                Patient: {selectedCase.patient_age}y / {selectedCase.patient_sex} | AI Prediction: <span className="text-white font-bold">{selectedCase.prediction?.label} ({((selectedCase.prediction?.confidence || 0) * 100).toFixed(1)}%)</span>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowGradCamLayer(!showGradCamLayer)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${showGradCamLayer ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
              >
                Grad-CAM Fusion: {showGradCamLayer ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreenViewer(false)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative flex items-center justify-center">
            <div
              className="max-w-4xl max-h-full aspect-square relative flex items-center justify-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={getMediaUrl(selectedCase.image_url)}
                alt="CXR"
                className={`max-w-full max-h-full object-contain ${getFilterStyle()}`}
              />

              {showGradCamLayer && selectedCase.prediction?.heatmap_url && (
                <img
                  src={getMediaUrl(selectedCase.prediction.heatmap_url)}
                  alt="Grad-CAM Layer"
                  className="max-w-full max-h-full object-contain absolute inset-0 mix-blend-screen pointer-events-none"
                  style={{ opacity: gradCamOpacity }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadiologistComparisonView;
