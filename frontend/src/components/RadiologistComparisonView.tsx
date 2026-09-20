import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
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
    try {
      setLoading(true);
      const res = await api.getPredictionHistory({
        limit: 50,
        agreement: filterAgreement !== 'all' ? filterAgreement : undefined,
      });
      setCases(res.cases || []);

      if (initialImageId) {
        const found = res.cases.find((c) => c.image_id === initialImageId);
        if (found) handleSelectCase(found);
      } else if (res.cases.length > 0 && !selectedCase) {
        handleSelectCase(res.cases[0]);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
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
      setFindingLabel((c.radiologist.finding as any) || 'Normal');
      setConfidenceLevel((c.radiologist.confidence as any) || 'High');
      setClinicalNotes(c.radiologist.notes || '');
      setRadiologistName(c.radiologist.name || 'Dr. Julian Reed, MD');
    } else {
      const defaultPred = (c.prediction?.label || 'Normal') as 'Normal' | 'Pneumonia' | 'Bone Fracture';
      setFindingLabel(defaultPred);
      if (defaultPred === 'Bone Fracture') {
        setClinicalNotes('Acute traumatic cortical step-off and fracture lucency line identified across lateral rib arc. Intact thoracic visceral pleura.');
        setSelectedPathologies(['Rib Fracture', 'Cortical Discontinuity']);
        setSelectedZone('Right Lower Lobe (RLL)');
      } else if (defaultPred === 'Pneumonia') {
        setClinicalNotes('Focal airspace consolidation identified in right lower zone consistent with infectious pneumonia. Ground truth assessment completed.');
        setSelectedPathologies(['Consolidation', 'Infiltrate']);
        setSelectedZone('Right Lower Lobe (RLL)');
      } else {
        setClinicalNotes('Clear lung fields bilaterally. Normal cardiothoracic ratio. Intact skeletal framework and no focal consolidation or effusion identified.');
        setSelectedPathologies([]);
        setSelectedZone('Bilateral Clear');
      }
    }
  };

  // Pathology tag toggle
  const togglePathology = (tag: string) => {
    setSelectedPathologies((prev) => {
      const exists = prev.includes(tag);
      const next = exists ? prev.filter((t) => t !== tag) : [...prev, tag];
      updateNotesWithTags(next, selectedZone);
      return next;
    });
  };

  const handleZoneSelect = (zone: string) => {
    setSelectedZone(zone);
    updateNotesWithTags(selectedPathologies, zone);
  };

  const updateNotesWithTags = (tags: string[], zone: string) => {
    const baseText = findingLabel === 'Bone Fracture'
      ? `Acute cortical step-off and fracture lucency line identified in [${zone}]. `
      : findingLabel === 'Pneumonia'
      ? `Focal airspace opacity identified in [${zone}]. `
      : `Bilateral chest fields clear [${zone}]. `;
    const tagsText = tags.length > 0 ? `Associated findings: ${tags.join(', ')}. ` : '';
    const closing = 'Ground truth validated for clinical AI surveillance engine.';
    setClinicalNotes(`${baseText}${tagsText}${closing}`);
  };

  // 1-Click Structured Template Inserter
  const applyTemplate = (templateType: 'normal' | 'pneumonia' | 'viral' | 'equivocal') => {
    if (templateType === 'normal') {
      setFindingLabel('Normal');
      setConfidenceLevel('High');
      setSelectedPathologies([]);
      setSelectedZone('Bilateral Clear');
      setClinicalNotes('Clear lung fields bilaterally. Normal cardiac silhouette. No focal consolidation, pneumothorax, or pleural effusion identified.');
    } else if (templateType === 'pneumonia') {
      setFindingLabel('Pneumonia');
      setConfidenceLevel('High');
      setSelectedPathologies(['Consolidation', 'Air Bronchogram']);
      setSelectedZone('Right Lower Lobe (RLL)');
      setClinicalNotes('Focal lobar airspace consolidation identified in right lower zone with peribronchial cuffing consistent with bacterial pneumonia. Recommend clinical antibiotic correlation.');
    } else if (templateType === 'viral') {
      setFindingLabel('Pneumonia');
      setConfidenceLevel('Moderate');
      setSelectedPathologies(['Interstitial Markings', 'Patchy Infiltrate']);
      setSelectedZone('Bilateral Diffuse');
      setClinicalNotes('Bilateral patchy peribronchial opacities and interstitial markings. Clinical presentation and radiologic pattern suggestive of multifocal viral / atypical pneumonitis.');
    } else if (templateType === 'equivocal') {
      setFindingLabel('Normal');
      setConfidenceLevel('Low');
      setSelectedPathologies(['Perihilar Haziness']);
      setSelectedZone('Perihilar');
      setClinicalNotes('Subtle perihilar haziness without definite lobar consolidation. Indeterminate read; recommend short-interval follow-up radiograph or low-dose CT correlation.');
    }
  };

  // Quick 1-Click Concordant Sign
  const handleQuickConcordantSign = async () => {
    if (!selectedCase || !selectedCase.prediction) return;
    setFindingLabel((selectedCase.prediction.label as any) || 'Normal');
    setConfidenceLevel('High');
    setSubmitting(true);
    setFeedback(null);

    try {
      await api.submitRadiologistReport({
        image_id: selectedCase.image_id,
        finding_label: selectedCase.prediction.label,
        confidence_level: 'High',
        clinical_notes: `1-Click Concordant Verification: Concur with AI finding of ${selectedCase.prediction.label} (${(selectedCase.prediction.confidence * 100).toFixed(1)}% confidence).`,
        radiologist_id_code: radiologistCode,
        radiologist_name: radiologistName,
      });

      setFeedback(`Verified & Signed: Case ${selectedCase.accession_number} marked Concordant.`);
      await loadCases();
    } catch (err: any) {
      setFeedback(`Error: ${err.message || 'Failed to submit report'}`);
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

  // Helper CSS for image filters
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#222836] via-[#2B3345] to-[#222836] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-mono font-bold bg-white/10 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              Doctor Review & Ground Truth Workstation
            </span>
            <span className="text-xs text-slate-400 font-medium">DICOM Viewport • Grad-CAM Overlay • Multi-Zone Pathology</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Radiologist Case Adjudication & Concordance Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed font-sans">
            Examine patient chest radiographs with PACS window/level presets, evaluate Grad-CAM heatmaps, apply diagnostic templates, and file ground truth.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={loadCases}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/15 hover:border-white text-xs font-bold text-slate-200 hover:text-white transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Case List (4 cols) & Right Adjudication Workstation (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Searchable Case Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4">
            {/* Search & Filter Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search accession # or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-white font-sans"
              />
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-white/[0.03] p-1 rounded-2xl border border-white/10 text-[11px] font-bold text-center">
              {(['all', 'Concordant', 'Discordant'] as const).map((ag) => (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setFilterAgreement(ag)}
                  className={`py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                    filterAgreement === ag
                      ? 'bg-white text-black font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                      : 'text-slate-400 hover:text-white'
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
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white/[0.08] border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">{c.accession_number}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPneu
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                            : 'bg-white/10 text-white border border-white/20'
                        }`}
                      >
                        AI: {pred?.label || 'N/A'} ({(pred ? pred.confidence * 100 : 0).toFixed(0)}%)
                      </span>

                      <div>
                        {rad ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isConcordant
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-950/70 text-rose-300 border border-rose-500/40 animate-pulse'
                            }`}
                          >
                            {rad.agreement}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold italic">Awaiting Read</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Adjudication Workstation & Facilities (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedCase ? (
            <div className="p-6 rounded-3xl bg-[#222836]/90 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-5">
              {/* Study Info Header & Quick Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white font-display">
                      Study Workstation
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-xs font-bold text-amber-300">{selectedCase.accession_number}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    Patient: {selectedCase.patient_age}y / {selectedCase.patient_sex} | Site: <span className="text-white font-semibold">{selectedCase.site_id}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Prev / Next study stepper */}
                  <div className="flex items-center space-x-1 bg-white/[0.04] p-1 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={navigatePrev}
                      disabled={!hasPrev}
                      title="Previous Case"
                      className={`p-1.5 rounded-xl ${hasPrev ? 'hover:bg-white/10 text-white cursor-pointer shadow-sm' : 'text-slate-600 cursor-not-allowed'}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-mono px-2 text-slate-300">
                      {currentIndex + 1} / {filteredCases.length}
                    </span>
                    <button
                      type="button"
                      onClick={navigateNext}
                      disabled={!hasNext}
                      title="Next Case"
                      className={`p-1.5 rounded-xl ${hasNext ? 'hover:bg-white/10 text-white cursor-pointer shadow-sm' : 'text-slate-600 cursor-not-allowed'}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToReports(selectedCase.image_id)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/15 hover:border-white text-slate-200 hover:text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>PDF Dossier</span>
                  </button>
                </div>
              </div>

              {/* PACS Viewport Controls Toolbar */}
              <div className="p-3 rounded-2xl bg-[#181C26] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Window / Level Filter Presets */}
                <div className="flex items-center space-x-1.5">
                  <Contrast className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-semibold text-slate-300 mr-1">PACS Window:</span>
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
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        filterPreset === preset.id
                          ? 'bg-white text-black font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                          : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Zoom & Layer Controls */}
                <div className="flex items-center space-x-2">
                  {/* Grad-CAM Fusion Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowGradCamLayer(!showGradCamLayer)}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      showGradCamLayer
                        ? 'bg-white/20 text-white border border-white shadow-[0_0_10px_rgba(255,255,255,0.25)]'
                        : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Grad-CAM Fusion</span>
                  </button>

                  {/* Zoom Controls */}
                  <div className="flex items-center space-x-1 bg-white/[0.04] p-0.5 rounded-xl border border-white/10 shadow-sm">
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
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1.0)}
                      className="p-1 text-slate-400 hover:text-slate-300 cursor-pointer"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Fullscreen Button */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreenViewer(true)}
                    className="p-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white cursor-pointer shadow-sm"
                    title="Fullscreen Diagnostic View"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Imagery & DenseNet-121 Readout Viewport */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active X-Ray Viewport with Layer Overlay */}
                <div className="rounded-2xl overflow-hidden border border-white/15 bg-black aspect-square relative flex items-center justify-center shadow-md">
                  <div
                    className="w-full h-full relative overflow-hidden flex items-center justify-center transition-transform duration-150"
                    style={{ transform: `scale(${zoomLevel})` }}
                  >
                    {/* Base Radiograph */}
                    <img
                      src={getMediaUrl(selectedCase.image_url)}
                      alt="CXR"
                      className={`w-full h-full object-contain ${getFilterStyle()}`}
                    />

                    {/* Grad-CAM Fusion Layer */}
                    {showGradCamLayer && selectedCase.prediction?.heatmap_url && (
                      <img
                        src={getMediaUrl(selectedCase.prediction.heatmap_url)}
                        alt="Grad-CAM Layer"
                        className="w-full h-full object-contain absolute inset-0 mix-blend-screen pointer-events-none transition-opacity duration-200"
                        style={{ opacity: gradCamOpacity }}
                      />
                    )}
                  </div>

                  {/* HUD Overlay Badges */}
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] font-mono font-bold text-white">
                    PA CXR • {filterPreset.toUpperCase()}
                  </div>

                  {showGradCamLayer && (
                    <div className="absolute bottom-2.5 right-2.5 flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#181C26]/90 backdrop-blur-sm border border-white/20 text-[10px] font-mono text-white font-bold shadow-sm">
                      <span>Opacity:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={gradCamOpacity}
                        onChange={(e) => setGradCamOpacity(parseFloat(e.target.value))}
                        className="w-16 h-1 accent-amber-400 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* AI Finding Card & Instant Quick-Sign Facility */}
                <div className="p-5 rounded-2xl bg-[#181C26] border border-white/10 flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                        DenseNet-121 Clinical AI Finding
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20">
                        PyTorch 2.6
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between shadow-sm">
                      <div>
                        <p
                          className={`text-xl font-black font-display ${
                            selectedCase.prediction?.label === 'Pneumonia' ? 'text-rose-400' : 'text-white'
                          }`}
                        >
                          {selectedCase.prediction?.label === 'Pneumonia' ? 'Pathology / Infiltrate' : 'Normal CXR'}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Confidence: <span className="font-bold text-white">{((selectedCase.prediction?.confidence || 0) * 100).toFixed(1)}%</span>
                        </p>
                      </div>
                      <div className="text-right text-[11px] font-mono text-slate-400">
                        <p>Latency: <span className="text-white font-bold">{selectedCase.prediction?.latency_ms} ms</span></p>
                        <p className="text-emerald-400 font-semibold">Sub-200ms Target</p>
                      </div>
                    </div>

                    {/* Concordance Status Banner if already reviewed */}
                    {selectedCase.radiologist && (
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1.5 text-xs shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Filed Ground Truth:</span>
                          <span className="font-bold text-white font-mono">{selectedCase.radiologist.finding}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Concordance:</span>
                          <span
                            className={`font-bold font-mono ${
                              selectedCase.radiologist.agreement === 'Concordant' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {selectedCase.radiologist.agreement}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-white/[0.06]">
                          "{selectedCase.radiologist.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 1-Click Fast Concordant Action Facility */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>Agree with AI Finding?</span>
                      <span className="text-amber-400 font-mono font-bold">1-Click Fast Adjudication</span>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleQuickConcordantSign}
                      className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer font-display shadow-sm"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Concur & 1-Click Sign as Concordant</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Smart Structured Reporting Macros / Templates */}
              <div className="p-4 rounded-2xl bg-[#181C26] border border-white/10 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5 font-display">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Smart Clinical Dictation Templates</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">Click to insert structured impression:</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => applyTemplate('normal')}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/50 text-left transition-all cursor-pointer group shadow-sm"
                  >
                    <p className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">Clear / Normal</p>
                    <p className="text-[9px] text-slate-400 truncate">No consolidation or effusion</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTemplate('pneumonia')}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-rose-500/50 text-left transition-all cursor-pointer group shadow-sm"
                  >
                    <p className="text-[11px] font-bold text-rose-400 group-hover:text-rose-300">Focal Pneumonia</p>
                    <p className="text-[9px] text-slate-400 truncate">Lobar consolidation pattern</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTemplate('viral')}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/50 text-left transition-all cursor-pointer group shadow-sm"
                  >
                    <p className="text-[11px] font-bold text-amber-400 group-hover:text-amber-300">Multifocal / Viral</p>
                    <p className="text-[9px] text-slate-400 truncate">Bilateral patchy markings</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTemplate('equivocal')}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/50 text-left transition-all cursor-pointer group shadow-sm"
                  >
                    <p className="text-[11px] font-bold text-white group-hover:text-slate-200">Equivocal / Indeterminate</p>
                    <p className="text-[9px] text-slate-400 truncate">Recommend repeat radiograph</p>
                  </button>
                </div>
              </div>

              {/* Secondary Pathology Checkers & Lung Zone Selectors */}
              <div className="p-4 rounded-2xl bg-[#181C26] border border-white/10 space-y-3 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5 font-display">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Secondary Pathology Tags & Localization</span>
                  </span>
                  {/* Zone Selector */}
                  <div className="flex items-center space-x-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-400 mr-1">Anatomy Zone:</span>
                    <select
                      value={selectedZone}
                      onChange={(e) => handleZoneSelect(e.target.value)}
                      className="py-1 px-3 bg-[#1e2536] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white font-sans"
                    >
                      <option value="Bilateral Clear" className="bg-[#1e2536] text-white">Bilateral Clear</option>
                      <option value="Right Upper Lobe (RUL)" className="bg-[#1e2536] text-white">Right Upper Lobe (RUL)</option>
                      <option value="Right Middle Lobe (RML)" className="bg-[#1e2536] text-white">Right Middle Lobe (RML)</option>
                      <option value="Right Lower Lobe (RLL)" className="bg-[#1e2536] text-white">Right Lower Lobe (RLL)</option>
                      <option value="Left Upper Lobe (LUL)" className="bg-[#1e2536] text-white">Left Upper Lobe (LUL)</option>
                      <option value="Left Lower Lobe (LLL)" className="bg-[#1e2536] text-white">Left Lower Lobe (LLL)</option>
                      <option value="Bilateral Diffuse" className="bg-[#1e2536] text-white">Bilateral Diffuse</option>
                      <option value="Perihilar" className="bg-[#1e2536] text-white">Perihilar</option>
                    </select>
                  </div>
                </div>

                {/* Pathology multi-choice pills */}
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
                        className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                          active
                            ? 'bg-white text-black font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                            : 'bg-white/[0.03] border border-white/10 text-slate-300 hover:border-white'
                        }`}
                      >
                        {pathology}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* If Discordant Preview, show Discordance Reason Selector */}
              {isDiscordantPreview && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center space-x-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold font-display">
                      Discordance Detected: AI ({selectedCase.prediction?.label}) &ne; Doctor ({findingLabel})
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Select the clinical discordance root cause to feed back into the AI quality surveillance loop:
                  </p>
                  <select
                    value={discordanceReason}
                    onChange={(e) => setDiscordanceReason(e.target.value)}
                    className="w-full py-2 px-3 bg-[#1e2536] border border-amber-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-sans"
                  >
                    <option value="None" className="bg-[#1e2536] text-white">-- Select Root Cause for Disagreement --</option>
                    <option value="Subtle / Early-Stage Infiltrate (Overlooked by general screen)" className="bg-[#1e2536] text-white">Subtle / Early-Stage Infiltrate</option>
                    <option value="Motion / Inspiration Artifact (Caused false opacity)" className="bg-[#1e2536] text-white">Motion / Inspiration Artifact</option>
                    <option value="AI False Positive (Over-called vascular marking)" className="bg-[#1e2536] text-white">AI False Positive (Over-called vascular marking)</option>
                    <option value="Underlying Chronic Cardiomegaly / Effusion" className="bg-[#1e2536] text-white">Underlying Chronic Cardiomegaly / Effusion</option>
                    <option value="Atypical Patchy Morphology" className="bg-[#1e2536] text-white">Atypical Patchy Morphology</option>
                  </select>
                </div>
              )}

              {feedback && (
                <div
                  className={`p-4 rounded-2xl text-xs flex items-center space-x-2 ${
                    feedback.startsWith('Error')
                      ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                      : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{feedback}</span>
                </div>
              )}

              {/* Radiologist Ground Truth Entry Form */}
              <form onSubmit={handleSubmitReport} className="space-y-4 pt-2 border-t border-white/10">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                  Official Radiologist Ground Truth Entry
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Finding Label Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ground Truth Diagnosis
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFindingLabel('Normal')}
                        className={`py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          findingLabel === 'Normal'
                            ? 'bg-white text-black font-extrabold shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                            : 'bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        Normal CXR
                      </button>
                      <button
                        type="button"
                        onClick={() => setFindingLabel('Pneumonia')}
                        className={`py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          findingLabel === 'Pneumonia'
                            ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                            : 'bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        Pneumonia
                      </button>
                      <button
                        type="button"
                        onClick={() => setFindingLabel('Bone Fracture')}
                        className={`py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          findingLabel === 'Bone Fracture'
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                            : 'bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        Bone Fracture
                      </button>
                    </div>
                  </div>

                  {/* Diagnostic Confidence Level */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Diagnostic Confidence
                    </label>
                    <select
                      value={confidenceLevel}
                      onChange={(e) => setConfidenceLevel(e.target.value as any)}
                      className="w-full py-2.5 px-3 bg-[#1e2536] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-white font-sans cursor-pointer"
                    >
                      <option value="High" className="bg-[#1e2536] text-white py-1">High Diagnostic Certainty (Gold Standard)</option>
                      <option value="Moderate" className="bg-[#1e2536] text-white py-1">Moderate Diagnostic Certainty</option>
                      <option value="Low" className="bg-[#1e2536] text-white py-1">Low / Equivocal Read</option>
                    </select>
                  </div>
                </div>

                {/* Radiologist Name & Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Attending Radiologist Name
                    </label>
                    <input
                      type="text"
                      value={radiologistName}
                      onChange={(e) => setRadiologistName(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Radiologist ID Code</label>
                    <input
                      type="text"
                      value={radiologistCode}
                      onChange={(e) => setRadiologistCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-white font-mono"
                    />
                  </div>
                </div>

                {/* Clinical Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Clinical Impression & Adjudication Notes
                  </label>
                  <textarea
                    rows={3}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Enter radiological findings, focal opacities, pleural effusion, or secondary diagnostic notes..."
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/10 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-white font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full text-xs sm:text-sm font-black transition-all font-display cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 btn-lumina-primary"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Filing Ground Truth into MySQL 8.0 Store...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4 text-black" />
                      <span>Sign & File Certified Radiologist Ground Truth</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="h-full min-h-[420px] p-8 rounded-3xl bg-[#222836]/90 border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-3">
              <FileCheck2 className="w-10 h-10 text-slate-400" />
              <p className="text-sm font-semibold text-white font-display">Select a case on the left queue to enter radiologist ground truth.</p>
              <p className="text-xs text-slate-400">Complete with PACS zoom/pan, Grad-CAM fusion, and smart dictation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Diagnostic Lightbox Modal */}
      {isFullscreenViewer && selectedCase && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
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
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  showGradCamLayer ? 'bg-white text-black font-extrabold border-white' : 'bg-white/10 text-slate-300 border-white/20'
                }`}
              >
                Grad-CAM Fusion: {showGradCamLayer ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreenViewer(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
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
