
import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Button } from './components/Button';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ImageUploader } from './components/ImageUploader';
import { Viewer3D } from './components/Viewer3D';
import { generateImage, generateObjectParts, createCoachChat, analyzeImage } from './services/geminiService';
import { GenerationParams, GeneratedImage, Category, AspectRatio, DetailLevel, Part, ChatMessage, AnalysisResult } from './types';
import { CATEGORIES, PRESETS } from './constants';
import { Download, Copy, Trash2, Maximize2, Sparkles, Box, CircuitBoard, Activity, ChevronRight, Settings, Layers, Key, Lock, AlertCircle, Info, MessageSquare, Send, RotateCcw, ZoomIn, ZoomOut, Move, Camera, Type, ShoppingBag, BarChart3, TrendingUp, Users, Search } from 'lucide-react';
import { Chat } from '@google/genai';

function App() {
  // Auth State
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);

  // Navigation State
  const [currentPage, setCurrentPage] = useState<string>('home');
  
  // App Data State
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  
  // Generator Form State
  const [params, setParams] = useState<GenerationParams>({
    objectName: '',
    category: 'technical',
    aspectRatio: '1:1',
    detailLevel: 'High',
    showLabels: true,
    isKidFriendly: true,
    mode: 'text',
    userHint: ''
  });
  
  // Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<GeneratedImage | null>(null);
  const [currentParts, setCurrentParts] = useState<Part[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Studio UI State
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [rightPanelTab, setRightPanelTab] = useState<'info' | 'coach'>('info');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<number | undefined>(undefined);
  
  // Coach State
  const [coachChat, setCoachChat] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial Key Check
  useEffect(() => {
    async function checkKey() {
      try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          setHasApiKey(!!process.env.API_KEY);
        }
      } catch (e) {
        console.error("Failed to check API key status", e);
      } finally {
        setIsCheckingKey(false);
      }
    }
    checkKey();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, rightPanelTab]);

  // Reset Zoom on new image
  useEffect(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [currentResult]);

  const handleConnectApiKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setError(null);
    } else {
      console.warn("AI Studio window object not found");
    }
  };

  const loadPreset = (presetParams: Partial<GenerationParams>) => {
    setParams(prev => ({ ...prev, ...presetParams, mode: 'text' }));
    setCurrentPage('studio');
  };

  const handleImageUploaded = async (base64: string) => {
    setParams(prev => ({ ...prev, referenceImage: base64 }));
    
    if (base64) {
        setIsAnalyzing(true);
        setError(null);
        try {
            const analysis = await analyzeImage(base64, params.userHint);
            if (analysis) {
                setAnalysisResult(analysis);
                
                // Map analysis category to app category
                let appCategory: Category = 'technical';
                if (analysis.category === 'organism') appCategory = 'organic';
                if (analysis.category === 'electronics') appCategory = 'electronics';

                setParams(prev => ({
                    ...prev,
                    objectName: analysis.canonicalName,
                    category: appCategory,
                    referenceImage: base64,
                    aspectRatio: '1:1'
                }));
            }
        } catch (e) {
            console.error("Analysis error", e);
            setError("Could not analyze image. You can still generate, but auto-fill failed.");
        } finally {
            setIsAnalyzing(false);
        }
    } else {
        setAnalysisResult(null);
    }
  };

  const handleGenerate = async () => {
    if (!params.objectName.trim()) return;
    if (params.mode === 'photo' && !params.referenceImage) {
        setError("Please upload a reference photo for Photo Mode.");
        return;
    }
    
    setIsGenerating(true);
    setError(null);
    setCurrentResult(null);
    setCurrentParts([]);
    setChatMessages([]);
    setViewMode('2d');
    
    // Reset Coach
    try {
        const newChat = createCoachChat(params);
        setCoachChat(newChat);
        setChatMessages([{ role: 'model', text: `I'm analyzing your request for ${params.objectName}. Ask me anything about the structure or how to improve the visual!`, timestamp: Date.now() }]);
    } catch (e) { console.error("Coach init failed", e); }

    try {
      // Parallel execution: Image + Parts Analysis
      const [base64Image, parts] = await Promise.all([
        generateImage(params),
        generateObjectParts(params)
      ]);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: base64Image,
        params: { ...params },
        timestamp: Date.now(),
        promptUsed: `Exploded View of ${params.objectName}`,
        parts: parts
      };

      setCurrentResult(newImage);
      setCurrentParts(parts);
      setHistory(prev => [newImage, ...prev]);
      setRightPanelTab('info');

    } catch (err: any) {
      console.error("Generation failed:", err);
      const errorMessage = err.message || JSON.stringify(err);
      
      if (errorMessage.includes("403") || errorMessage.includes("permission") || errorMessage.includes("API Key")) {
        setError("Authorization failed. Please reconnect your API Key.");
        setHasApiKey(false);
      } else {
        setError(errorMessage || "Failed to generate image. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !coachChat) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: Date.now() }]);
    setChatInput('');

    try {
        const result = await coachChat.sendMessage({ message: userMsg });
        setChatMessages(prev => [...prev, { role: 'model', text: result.text || "", timestamp: Date.now() }]);
    } catch (e) {
        setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now.", timestamp: Date.now() }]);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  // --- RENDERING HELPERS ---

  const renderHome = () => (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <div className="inline-block mb-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-cyan-400">
          POWERED BY GEMINI 2.5
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          See inside <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">anything.</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Create ultra-detailed exploded technical views and anatomical visuals in seconds. Perfect for engineers, educators, and creators.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button className="w-full sm:w-auto text-lg h-12" onClick={() => setCurrentPage('studio')}>
            <Sparkles className="mr-2 w-5 h-5" /> Open Studio
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto text-lg h-12" onClick={() => setCurrentPage('presets')}>
            View Presets
          </Button>
        </div>
      </div>
      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-24">
        {[{ icon: Box, title: "Technical Products", desc: "Automotive, Machinery, Hardware" },
          { icon: CircuitBoard, title: "Electronics", desc: "Gadgets, PCB layouts, Sensors" },
          { icon: Activity, title: "Anatomy", desc: "Biology, Medical, Veterinary" }].map((f, i) => (
          <div key={i} className="bg-surface border border-white/5 hover:border-cyan-500/30 p-8 rounded-lg transition-all group">
            <f.icon className="w-10 h-10 text-gray-500 group-hover:text-cyan-400 mb-4 transition-colors" />
            <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
            <p className="text-gray-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMarketplace = () => (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2">Community Marketplace</h2>
           <p className="text-gray-400">Discover prompts and layouts created by other experts.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <input type="text" placeholder="Search..." className="bg-black border border-white/10 rounded-sm pl-9 pr-4 py-2 text-sm text-white focus:border-cyan-500 outline-none w-64" />
            </div>
            <Button variant="secondary">My Uploads</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[1,2,3,4,5,6,7,8].map(i => (
             <div key={i} className="bg-surface border border-white/10 rounded-lg overflow-hidden group hover:border-cyan-500/30 transition-all">
                 <div className="aspect-video bg-gray-900 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-700">
                        <Box size={32} />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
                        Community
                    </div>
                 </div>
                 <div className="p-4">
                     <h3 className="font-bold text-white text-sm mb-1">Advanced Engine Block v{i}</h3>
                     <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                             <Users size={12} /> {100 + i * 12}
                        </div>
                        <Button variant="ghost" className="h-6 px-2 text-[10px] uppercase">Get</Button>
                     </div>
                 </div>
             </div>
         ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8">Generation Analytics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface border border-white/10 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                    <Layers className="text-cyan-400" size={20} />
                    <h3 className="text-sm font-bold text-gray-400 uppercase">Total Generated</h3>
                </div>
                <div className="text-4xl font-bold text-white">{history.length}</div>
                <div className="text-xs text-gray-500 mt-2">+2 this week</div>
            </div>
            <div className="bg-surface border border-white/10 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="text-green-400" size={20} />
                    <h3 className="text-sm font-bold text-gray-400 uppercase">Most Used Category</h3>
                </div>
                <div className="text-4xl font-bold text-white capitalize">{params.category}</div>
                <div className="text-xs text-gray-500 mt-2">75% of your activity</div>
            </div>
            <div className="bg-surface border border-white/10 p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="text-amber-400" size={20} />
                    <h3 className="text-sm font-bold text-gray-400 uppercase">Credits Remaining</h3>
                </div>
                <div className="text-4xl font-bold text-white">∞</div>
                <div className="text-xs text-gray-500 mt-2">Pro Plan Active</div>
            </div>
        </div>
        
        <div className="bg-surface border border-white/10 p-8 rounded-lg min-h-[300px] flex items-center justify-center">
             <div className="text-center text-gray-500">
                 <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
                 <p>Detailed usage charts coming soon.</p>
             </div>
        </div>
    </div>
  );

  const renderStudio = () => (
    <div className="pt-20 pb-4 px-4 h-[calc(100vh)] flex flex-col md:flex-row gap-4 max-w-[1920px] mx-auto overflow-hidden">
      
      {/* LEFT: Controls Panel */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col bg-surface border border-white/10 rounded-lg overflow-hidden h-[calc(100vh-120px)] md:h-auto">
        <div className="p-4 border-b border-white/10">
             <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Settings size={14} /> Generator Settings
            </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* Mode Toggle */}
            <div className="flex bg-black p-1 rounded-md mb-6 border border-white/5">
                <button 
                    onClick={() => setParams({...params, mode: 'text'})}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-sm transition-all ${params.mode === 'text' ? 'bg-surfaceHighlight text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Type size={14} /> Text Mode
                </button>
                <button 
                    onClick={() => setParams({...params, mode: 'photo'})}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-sm transition-all ${params.mode === 'photo' ? 'bg-surfaceHighlight text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Camera size={14} /> Photo Mode
                </button>
            </div>

            {/* Category Select */}
            <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded-md mb-6">
                {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setParams({...params, category: cat.id})}
                        className={`text-[10px] font-bold uppercase py-2 rounded-sm transition-all ${params.category === cat.id ? 'bg-surfaceHighlight text-cyan-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                        {cat.label.split(' ')[0]}
                    </button>
                ))}
            </div>

            <div className="space-y-5">
                {/* Photo Upload Area */}
                {params.mode === 'photo' && (
                    <div className="space-y-3">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">Reference Photo</label>
                        <ImageUploader 
                            currentImage={params.referenceImage} 
                            onImageSelected={handleImageUploaded} 
                        />
                        {isAnalyzing && (
                            <div className="text-xs text-cyan-400 flex items-center gap-2 animate-pulse">
                                <Sparkles size={12} /> Analyzing image...
                            </div>
                        )}
                        {analysisResult && (
                            <div className="bg-cyan-900/10 border border-cyan-500/20 p-2 rounded text-xs text-cyan-200">
                                <strong>Detected:</strong> {analysisResult.canonicalName} ({Math.round(analysisResult.confidence * 100)}%)
                            </div>
                        )}
                        <div>
                            <input 
                                type="text" 
                                value={params.userHint || ''}
                                onChange={(e) => setParams({...params, userHint: e.target.value})}
                                placeholder="Optional hint (e.g. 'my old keyboard')"
                                className="w-full bg-black border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none placeholder:text-gray-600"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Object / Species Name</label>
                    <input type="text" value={params.objectName}
                        onChange={(e) => setParams({...params, objectName: e.target.value})}
                        placeholder={params.category === 'organic' ? "e.g. Human Heart" : "e.g. Turbocharger"}
                        className="w-full bg-black border border-white/10 rounded-sm px-3 py-3 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-gray-600 font-medium"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Aspect Ratio</label>
                        <select value={params.aspectRatio} onChange={(e) => setParams({...params, aspectRatio: e.target.value as AspectRatio})}
                            className="w-full bg-black border border-white/10 rounded-sm px-2 py-2 text-xs text-white focus:border-cyan-500 outline-none">
                            {['1:1', '3:4', '4:3', '9:16', '16:9'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Detail Level</label>
                        <select value={params.detailLevel} onChange={(e) => setParams({...params, detailLevel: e.target.value as DetailLevel})}
                             className="w-full bg-black border border-white/10 rounded-sm px-2 py-2 text-xs text-white focus:border-cyan-500 outline-none">
                            {['Standard', 'High', 'Ultra'].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-3 pt-2 bg-black/20 p-3 rounded">
                    <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer group">
                        <span>Show Labels</span>
                        <input type="checkbox" checked={params.showLabels} onChange={(e) => setParams({...params, showLabels: e.target.checked})}
                            className="w-4 h-4 bg-black border-white/20 rounded text-cyan-500 accent-cyan-500" />
                    </label>
                    {params.category === 'organic' && (
                        <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer group">
                            <span>Kid-Friendly (No Gore)</span>
                            <input type="checkbox" checked={params.isKidFriendly} onChange={(e) => setParams({...params, isKidFriendly: e.target.checked})}
                                className="w-4 h-4 bg-black border-white/20 rounded text-cyan-500 accent-cyan-500" />
                        </label>
                    )}
                </div>
            </div>
        </div>

        <div className="p-4 bg-black/20 border-t border-white/10 space-y-3">
             <Button onClick={handleGenerate} className="w-full h-12 text-sm uppercase tracking-widest font-bold shadow-lg shadow-cyan-900/20" isLoading={isGenerating}>
                {params.mode === 'photo' ? 'Transform to Exploded View' : 'Generate Inside View'}
            </Button>
            {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-sm flex items-start gap-2 text-xs text-red-200">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
        </div>
      </div>

      {/* CENTER: Canvas */}
      <div className="flex-1 bg-[#080808] border border-white/10 rounded-lg relative overflow-hidden flex flex-col shadow-2xl">
         {/* Top Toolbar */}
         <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex bg-surface/80 backdrop-blur border border-white/10 rounded-full p-1 shadow-lg">
             <button onClick={() => setViewMode('2d')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${viewMode === '2d' ? 'bg-cyan-500 text-black shadow' : 'text-gray-400 hover:text-white'}`}>
                 2D Image
             </button>
             <button onClick={() => setViewMode('3d')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${viewMode === '3d' ? 'bg-cyan-500 text-black shadow' : 'text-gray-400 hover:text-white'}`} disabled={!currentResult}>
                 Interactive 3D
             </button>
         </div>

         {/* Zoom Controls */}
         {viewMode === '2d' && (
             <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.2))} className="p-2 bg-black/60 backdrop-blur text-white rounded hover:bg-white/10 border border-white/5"><ZoomOut size={16}/></button>
                <button onClick={() => { setZoomLevel(1); setPanOffset({x:0, y:0}); }} className="p-2 bg-black/60 backdrop-blur text-white rounded hover:bg-white/10 border border-white/5"><RotateCcw size={16}/></button>
                <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.2))} className="p-2 bg-black/60 backdrop-blur text-white rounded hover:bg-white/10 border border-white/5"><ZoomIn size={16}/></button>
             </div>
         )}

         {isGenerating && <LoadingOverlay />}
         
         <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-dots">
            {currentResult ? (
                viewMode === '2d' ? (
                 <div 
                    className="cursor-move relative"
                    onMouseDown={(e) => { setIsDragging(true); }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onMouseMove={(e) => {
                        if (isDragging) {
                            setPanOffset(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
                        }
                    }}
                 >
                     <img 
                        src={currentResult.url} 
                        alt="Generated Result" 
                        draggable={false}
                        style={{ 
                            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                        }}
                        className="max-h-[85vh] max-w-[90vw] object-contain select-none shadow-2xl"
                    />
                 </div>
                ) : (
                    <Viewer3D 
                        parts={currentParts} 
                        selectedPartId={selectedPartId} 
                        onPartSelect={(id) => {
                            setSelectedPartId(id);
                            setRightPanelTab('info');
                        }} 
                    />
                )
            ) : (
                 <div className="text-center text-gray-600">
                    <div className="w-20 h-20 rounded-full bg-white/5 mx-auto mb-6 flex items-center justify-center animate-pulse-slow">
                        <Layers className="w-10 h-10 opacity-30" />
                    </div>
                    <p className="text-sm font-mono tracking-widest uppercase">Canvas Empty</p>
                    <p className="text-xs text-gray-500 mt-2">Configure settings to generate geometry</p>
                 </div>
            )}
         </div>

         {/* Bottom Action Bar */}
         {currentResult && viewMode === '2d' && (
            <div className="h-14 border-t border-white/10 bg-surface px-6 flex items-center justify-between z-20">
                <div className="flex gap-4">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-mono uppercase">Aspect</span>
                        <span className="text-xs text-white font-mono">{currentResult.params.aspectRatio}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-mono uppercase">Quality</span>
                        <span className="text-xs text-white font-mono">{currentResult.params.detailLevel}</span>
                     </div>
                </div>
                <div className="flex gap-2">
                    <a href={currentResult.url} download={`insideview-${currentResult.id}.png`}>
                        <Button variant="secondary" className="h-8 px-4 text-xs">
                            <Download size={14} className="mr-2" /> Download 8K
                        </Button>
                    </a>
                </div>
            </div>
         )}
      </div>

      {/* RIGHT: Intelligence Panel */}
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col bg-surface border border-white/10 rounded-lg overflow-hidden h-[calc(100vh-120px)] md:h-auto">
         <div className="flex border-b border-white/10">
             <button 
                onClick={() => setRightPanelTab('info')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${rightPanelTab === 'info' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'text-gray-500 hover:text-white'}`}>
                <Info size={14} /> Parts
             </button>
             <button 
                onClick={() => setRightPanelTab('coach')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${rightPanelTab === 'coach' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' : 'text-gray-500 hover:text-white'}`}>
                <MessageSquare size={14} /> Coach
             </button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0C1018]">
             {rightPanelTab === 'info' && (
                 <div className="p-4 space-y-4">
                     {!currentResult ? (
                         <div className="text-center py-10 text-gray-500 text-xs font-mono">
                             WAITING FOR GENERATION DATA...
                         </div>
                     ) : (
                         <>
                            <div className="bg-black border border-white/10 p-3 rounded-md">
                                <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-wider">{currentResult.params.objectName}</h3>
                                <p className="text-[10px] text-gray-500 font-mono">{new Date(currentResult.timestamp).toLocaleTimeString()}</p>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest">Component Analysis</h4>
                                <div className="space-y-2">
                                    {currentParts.map((part) => (
                                        <div 
                                            key={part.id} 
                                            onClick={() => {
                                                setSelectedPartId(part.id);
                                                if (viewMode === '3d') setViewMode('3d'); 
                                            }}
                                            className={`border p-3 rounded-md group transition-all cursor-pointer ${selectedPartId === part.id ? 'bg-cyan-900/30 border-cyan-500' : 'bg-black/40 border-white/5 hover:border-cyan-500/30'}`}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <span className={`text-xs font-mono ${selectedPartId === part.id ? 'text-cyan-400' : 'text-gray-400'}`}>#{part.id}</span>
                                                <span className="text-[9px] uppercase tracking-wide text-gray-500 border border-white/10 px-1 rounded">{part.system}</span>
                                            </div>
                                            <div className="font-medium text-sm text-gray-200">{part.name}</div>
                                            <div className="text-xs text-gray-500 mt-1 leading-relaxed">{part.description}</div>
                                        </div>
                                    ))}
                                    {currentParts.length === 0 && (
                                        <div className="text-xs text-gray-500 italic">No specific parts data returned for this generation.</div>
                                    )}
                                </div>
                            </div>
                         </>
                     )}
                 </div>
             )}

             {rightPanelTab === 'coach' && (
                 <div className="flex flex-col min-h-full">
                     <div className="flex-1 p-4 space-y-4">
                         {chatMessages.map((msg, i) => (
                             <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                                     msg.role === 'user' 
                                     ? 'bg-cyan-600 text-black rounded-br-none font-medium' 
                                     : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
                                 }`}>
                                     {msg.text}
                                 </div>
                             </div>
                         ))}
                         <div ref={chatEndRef} />
                     </div>
                     <div className="p-3 border-t border-white/10 bg-surface">
                         <div className="relative">
                             <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask Inside Coach..."
                                className="w-full bg-black border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                             />
                             <button 
                                onClick={handleSendMessage}
                                className="absolute right-1 top-1 p-1.5 bg-cyan-600 text-black rounded-full hover:bg-cyan-400 transition-colors">
                                 <Send size={14} />
                             </button>
                         </div>
                     </div>
                 </div>
             )}
         </div>
      </div>
    </div>
  );

  const renderPresets = () => (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8">Quick Start Presets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRESETS.map(preset => (
            <div key={preset.id} className="bg-surface border border-white/10 rounded-lg overflow-hidden group hover:border-cyan-500/50 transition-all">
                <div className="aspect-video bg-gray-800 relative overflow-hidden">
                    <img src={preset.thumbnail} alt={preset.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0" />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 text-[10px] font-mono uppercase text-white rounded border border-white/10">
                        {preset.category}
                    </div>
                </div>
                <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-1">{preset.title}</h3>
                    <p className="text-sm text-gray-400 mb-4 h-10 line-clamp-2">{preset.description}</p>
                    <Button variant="secondary" className="w-full" onClick={() => loadPreset(preset.params)}>
                        Use Preset <ChevronRight size={16} className="ml-1" />
                    </Button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );

  const renderGallery = () => (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">My Gallery</h2>
            <div className="text-gray-500 text-sm font-mono border border-white/10 px-3 py-1 rounded">{history.length} GENERATIONS</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {history.map(item => (
                <div key={item.id} className="bg-surface border border-white/10 rounded-lg overflow-hidden group relative">
                    <div className="aspect-square bg-black relative">
                        <img src={item.url} alt={item.params.objectName} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button variant="secondary" className="p-2" onClick={() => { setCurrentResult(item); setCurrentParts(item.parts || []); setCurrentPage('studio'); }} title="Open in Studio">
                                <Maximize2 size={16} />
                            </Button>
                            <a href={item.url} download={`insideview-${item.id}.png`}>
                                <Button variant="secondary" className="p-2" title="Download">
                                    <Download size={16} />
                                </Button>
                            </a>
                        </div>
                    </div>
                    <div className="p-4">
                            <h4 className="text-white font-medium truncate text-sm">{item.params.objectName}</h4>
                            <div className="flex justify-between items-center mt-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{item.params.category}</span>
                            <span className="text-[10px] text-gray-600 font-mono">{new Date(item.timestamp).toLocaleDateString()}</span>
                            </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  // --- AUTH GATE ---
  if (isCheckingKey) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="max-w-md w-full bg-surface border border-white/10 p-8 rounded-lg shadow-2xl relative z-10 text-center backdrop-blur-xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <Layers className="text-black w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Welcome to InsideView</h1>
          <p className="text-gray-400 mb-8 leading-relaxed text-sm">
              Premium AI-powered visualization. Connect your Google Cloud Project to unlock 8K generation and neural analysis.
          </p>
          <Button onClick={handleConnectApiKey} className="w-full h-12 text-sm"><Key className="mr-2 w-4 h-4" /> Connect API Key</Button>
          <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Secure Google Authentication</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-gray-200 font-sans selection:bg-cyan-500/30 selection:text-white">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main>
        {currentPage === 'home' && renderHome()}
        {currentPage === 'studio' && renderStudio()}
        {currentPage === 'presets' && renderPresets()}
        {currentPage === 'gallery' && renderGallery()}
        {currentPage === 'marketplace' && renderMarketplace()}
        {currentPage === 'analytics' && renderAnalytics()}
      </main>
    </div>
  );
}

export default App;
