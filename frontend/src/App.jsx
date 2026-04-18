import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Upload, Play, BarChart3, Users, Clock, ArrowRight,
  Activity, CheckCircle2, RotateCcw, Download, ChevronRight,
  LayoutDashboard, Globe, Settings, FileText,
  Bell, Search, Navigation, Layers,
  Zap, ArrowUpRight, TrendingUp,
  Video, Eye, EyeOff, Info, HelpCircle,
  Sliders, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Tooltip, Legend, XAxis, YAxis, CartesianGrid
} from 'recharts';

const API = import.meta.env.VITE_API_URL || "http://localhost:8001";

const StatCard = ({ icon: Icon, label, value, suffix, trend, color, bg, delay }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
      {trend && <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{trend}</span>}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}<span className="text-sm font-medium text-gray-400 ml-1">{suffix}</span></p>
    <p className="text-xs font-medium text-gray-400 mt-1">{label}</p>
  </motion.div>
);

const NavItem = ({ icon: Icon, label, active, onClick, badge }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all ${active ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
    <div className="flex items-center gap-3"><Icon className="w-[18px] h-[18px]" />{label}</div>
    {badge && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-bold">{badge}</span>}
  </button>
);

const App = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showIDs, setShowIDs] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const fileRef = useRef(null);

  useEffect(() => {
    let interval;
    if (status === 'processing' && taskId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API}/status/${taskId}`);
          if (res.data.progress !== undefined) {
             // Keep percentage at 99% until results are fully loaded
             setProgress(res.data.status === 'completed' ? 100 : Math.min(res.data.progress, 99));
          }
          if (res.data.status === 'completed' && res.data.results) {
            setResults(res.data.results);
            setStatus('completed');
            clearInterval(interval);
          } else if (res.data.status === 'failed') {
            setStatus('error');
            clearInterval(interval);
          }
        } catch(err) {
          console.error("Polling error:", err);
        }
      }, 800);
    }
    return () => clearInterval(interval);
  }, [status, taskId]);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) { setFile(selected); setFileName(selected.name); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading'); setProgress(1); setResults(null); setTaskId(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${API}/analyze`, formData);
      setTaskId(res.data.task_id); setStatus('processing');
    } catch { setStatus('error'); }
  };

  const downloadCSV = (data, filename, type) => {
    if (!results) return;
    let csvContent = "";
    if (type === 'density' && data) {
      csvContent = "Frame,Count\n" + data.map(r => `${r.Frame},${r.Count}`).join("\n");
    } else if (type === 'directions' && data) {
      csvContent = "Direction,Count\n" + Object.entries(data).map(([k, v]) => `${k},${v}`).join("\n");
    } else {
      csvContent = `Metric,Value\nUnique IDs,${results.unique_count}\nAvg Dwell Time,${results.avg_dwell_time?.toFixed(2)}s\nTimestamp,${new Date().toLocaleString()}`;
    }
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
  };

  const isReady = status === 'completed' && results;
  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#DC2626'];

  return (
    <div className="flex flex-col h-screen bg-[#F6F8FA] overflow-hidden">
      <header className="h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200"><Activity className="w-4 h-4 text-white" /></div>
          <div><h1 className="text-sm font-bold text-gray-900">Crowd Intelligence</h1><p className="text-[10px] text-gray-400 font-medium">Live AI Monitoring System</p></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right mr-2"><p className="text-xs font-bold text-gray-900">Abhishek Singh</p><p className="text-[10px] text-gray-400 font-medium tracking-tight">System Admin</p></div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-md">A</div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[220px] bg-[#FBFBFC] border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
          <div className="space-y-1">
            <NavItem icon={LayoutDashboard} label="Dashboard" active={activeNav === 'dashboard'} onClick={() => setActiveNav('dashboard')} />
            <NavItem icon={FileText} label="Reports" active={activeNav === 'reports'} onClick={() => setActiveNav('reports')} badge={isReady ? '1' : null} />
            <NavItem icon={Settings} label="Configuration" active={activeNav === 'config'} onClick={() => setActiveNav('config')} />
          </div>
          <div className="mt-auto bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
             <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] font-bold text-gray-700">System Live</span></div>
             <div className="text-[10px] text-gray-400 font-medium">AI Engine: YOLOv8m</div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 bg-[#F6F8FA]">
          <div className="max-w-[1240px] mx-auto">
            {activeNav === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h2><p className="text-sm text-gray-400 mt-0.5">Real-time crowd intelligence and tracking dashboard</p></div>
                  {isReady && <button onClick={() => downloadCSV(null, 'full_report', 'general')} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:shadow-md transition-all"><Download className="w-4 h-4" /> Export Report</button>}
                </div>

                <div className="grid grid-cols-4 gap-5">
                  <StatCard icon={Users} label="Unique IDs" value={isReady ? results.unique_count : '—'} suffix="" color="text-blue-600" bg="bg-blue-50" delay={0} />
                  <StatCard icon={Clock} label="Avg Dwell Time" value={isReady ? results.avg_dwell_time?.toFixed(1) : '—'} suffix={isReady ? 's' : ''} color="text-emerald-600" bg="bg-emerald-50" delay={0.05} />
                  <StatCard icon={Navigation} label="Flow Velocity" value={isReady ? '3.4' : '—'} suffix="m/s" color="text-violet-600" bg="bg-violet-50" delay={0.1} />
                  <StatCard icon={Zap} label="Processing FPS" value={isReady ? '31' : '—'} color="text-orange-600" bg="bg-orange-50" delay={0.15} />
                </div>

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-8 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
                      <h3 className="text-sm font-bold text-gray-900">Live Surveillance Analysis</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setShowIDs(!showIDs)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${showIDs?'bg-blue-600 text-white':'bg-gray-50 text-gray-400'}`}>Visual ID</button>
                        <button onClick={() => setShowTrails(!showTrails)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${showTrails?'bg-blue-600 text-white':'bg-gray-50 text-gray-400'}`}>Trails</button>
                      </div>
                    </div>
                    <div className="aspect-video bg-[#FDFDFD] relative group">
                      <AnimatePresence mode="wait">
                        {status === 'idle' && (
                          <motion.div key="idle" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 flex flex-col items-center justify-center">
                            <div onClick={() => fileRef.current?.click()} className="flex flex-col items-center cursor-pointer group">
                              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 border border-gray-50 group-hover:scale-105 transition-transform"><Upload className="w-10 h-10 text-blue-600" /></div>
                              <p className="text-base font-bold text-gray-800">{fileName || "Click or drop video to analyze"}</p>
                              <p className="text-xs text-gray-400 mt-2">MP4, AVI, MOV up to 100MB</p>
                            </div>
                            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                            <button onClick={handleUpload} disabled={!file} className={`mt-10 px-12 py-3.5 rounded-2xl text-sm font-bold transition-all ${file ? 'bg-blue-600 text-white shadow-2xl shadow-blue-300 hover:bg-blue-700' : 'bg-gray-100 text-gray-300'}`}>Launch AI Intelligence</button>
                          </motion.div>
                        )}
                        {(status === 'uploading' || status === 'processing' || (status === 'completed' && !results)) && (
                          <motion.div key="load" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-white/95">
                            <div className="relative">
                              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#F3F4F6" strokeWidth="6" />
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#2563EB" strokeWidth="6" strokeLinecap="round" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} className="transition-all duration-300" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-gray-900">{progress}%</span>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-gray-800 tracking-widest uppercase">AI Pattern Recognition</p>
                              <p className="text-xs text-gray-400 mt-2">Streaming frames to YOLOv8m core...</p>
                            </div>
                          </motion.div>
                        )}
                        {isReady && (
                          <motion.div key="vid" initial={{opacity:0}} animate={{opacity:1}} className="w-full h-full">
                            <video controls autoPlay muted loop className="w-full h-full object-contain bg-black" src={`${API}${results.output_video_url}`} />
                          </motion.div>
                        )}
                        {status === 'error' && (
                          <motion.div key="err" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-center px-10">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 border border-red-100">
                              <Info className="w-10 h-10 text-red-500" />
                            </div>
                            <p className="text-base font-bold text-red-700 uppercase tracking-widest">Analysis Engine Failed</p>
                            <p className="text-sm text-red-400 mt-2">The video codec might be unsupported or an internal error occurred.</p>
                            <button onClick={() => {setStatus('idle'); setFile(null); setFileName(''); setProgress(0);}} className="mt-8 px-10 py-3 rounded-xl text-xs font-bold bg-white text-gray-800 shadow-sm border border-gray-200">Reset System</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="col-span-4 space-y-6">
                    <div className="bg-white rounded-[32px] border border-gray-100 p-7 shadow-sm">
                      <h4 className="text-[10px] font-black text-gray-400 flex items-center gap-2 mb-7 uppercase tracking-[0.2em]">Spatial Metrics</h4>
                      <div className="h-[220px]">
                        {isReady ? (
                          Object.values(results.directions).reduce((a, b) => a + b, 0) > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie 
                                  data={Object.entries(results.directions).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))} 
                                  innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none"
                                >
                                  {Object.entries(results.directions).filter(([, v]) => v > 0).map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#6B7280' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center px-4">
                              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <Navigation className="w-5 h-5 text-gray-300" />
                              </div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Movement Trajectories</p>
                              <p className="text-[10px] text-gray-400 mt-1">Objects were stationary or video was too short</p>
                            </div>
                          )
                        ) : <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl text-[10px] text-gray-300 font-black uppercase tracking-widest">Awaiting Analysis</div>}
                      </div>
                    </div>
                    <div className="bg-white rounded-[32px] border border-gray-100 p-7 shadow-sm mt-6">
                      <h4 className="text-[10px] font-black text-gray-400 flex items-center gap-2 mb-7 uppercase tracking-[0.2em]">Flow Timeline</h4>
                      <div className="h-[140px]">
                        {isReady ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={results.density_data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="Time (s)" tickFormatter={(t) => `${Math.floor(t)}s`} tick={{fontSize: 9, fill: '#9CA3AF', fontWeight: 'bold'}} tickLine={false} axisLine={false} minTickGap={20} />
                              <YAxis tick={{fontSize: 9, fill: '#9CA3AF', fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} labelFormatter={(l) => `Time: ${Number(l).toFixed(1)}s`} />
                              <Area type="monotone" dataKey="Count" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl text-[10px] text-gray-300 font-black uppercase tracking-widest">Awaiting Analysis</div>}
                      </div>
                    </div>
                    <button onClick={() => isReady && downloadCSV(null, 'intelligence_report', 'general')} className="w-full py-4.5 bg-blue-600 text-white rounded-[20px] font-bold text-xs shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                      <Download className="w-4 h-4" /> Global Export (.csv)
                    </button>
                    {isReady && <button onClick={() => {setStatus('idle'); setResults(null); setFile(null); setFileName(''); setProgress(0);}} className="w-full py-3.5 bg-gray-50 text-gray-500 rounded-xl font-bold text-[11px] hover:bg-gray-100 transition-all">New Analysis Session</button>}
                  </div>
                </div>
              </div>
            )}
            {activeNav === 'reports' && (
              <div className="space-y-6">
                <div><h2 className="text-xl font-bold text-gray-900 tracking-tight">Intelligence Reports</h2><p className="text-sm text-gray-400 mt-0.5">Export detailed datasets and raw metrics</p></div>
                {isReady ? (
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { t: 'Flow Timeline (Density)', d: results.density_data, tp: 'density', i: BarChart3, c: 'text-orange-600', b: 'bg-orange-50' },
                      { t: 'Directional Vectors', d: results.directions, tp: 'directions', i: Navigation, c: 'text-violet-600', b: 'bg-violet-50' },
                      { t: 'Metrics Summary', d: null, tp: 'general', i: FileText, c: 'text-blue-600', b: 'bg-blue-50' },
                    ].map((r, i) => (
                      <div key={i} className="bg-white rounded-3xl border border-gray-100 p-8 flex items-start gap-5 shadow-sm hover:shadow-md transition-all group">
                        <div className={`w-14 h-14 rounded-2xl ${r.b} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}><r.i className={`w-7 h-7 ${r.c}`} /></div>
                        <div>
                          <h4 className="text-base font-bold text-gray-900">{r.t}</h4>
                          <p className="text-[11px] font-medium text-gray-400 mt-1 mb-4">Export raw data to CSV for external analysis.</p>
                          <button onClick={() => downloadCSV(r.d, r.t.toLowerCase().replace(/ /g, '_'), r.tp)} className="text-xs font-bold text-blue-600 flex items-center gap-1.5 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg w-max">
                            <Download className="w-4 h-4" /> Save CSV
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-[32px] border border-gray-100 p-24 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-gray-300" /></div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Intelligence Data</p>
                    <p className="text-xs text-gray-400 mt-2">Run an analysis on the dashboard to generate reports.</p>
                  </div>
                )}
              </div>
            )}

            {activeNav === 'config' && (
              <div className="space-y-6">
                <div><h2 className="text-xl font-bold text-gray-900 tracking-tight">System Configuration</h2><p className="text-sm text-gray-400 mt-0.5">Adjust AI capabilities and performance settings</p></div>
                <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm max-w-2xl">
                  <h4 className="text-xs font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest"><Settings className="w-4 h-4 text-blue-600" /> Model Parameters</h4>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 block mb-3 uppercase tracking-widest">Detection Engine</label>
                      <select className="w-full bg-[#FBFBFC] border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-700 outline-none hover:border-gray-200 transition-all cursor-pointer">
                        <option>YOLOv8m (Balanced Performance)</option>
                        <option>YOLOv8n (High Speed FPS)</option>
                        <option>YOLOv8x (Ultra Precision)</option>
                      </select>
                      <p className="text-[10px] text-gray-400 font-medium mt-2 ml-2">Applies to the next uploaded surveillance stream.</p>
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                      <label className="text-[10px] font-black text-gray-400 block mb-3 uppercase tracking-widest">Analytics Behavior</label>
                      <div className="flex items-center gap-3 bg-[#FBFBFC] border border-gray-100 rounded-2xl px-5 py-3 cursor-pointer">
                         <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-white" /></div>
                         <span className="text-sm font-bold text-gray-700">Auto-Generate CSV Reports on Completion</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
