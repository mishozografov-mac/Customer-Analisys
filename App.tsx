import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Client, ProductGroup, ScoreLevel, ResponsiblePerson, ScaleAnalysis } from './types';
import { GeminiService } from './geminiService';
import SettingsModal from './SettingsModal';
import { DEFAULT_CATALOG } from './defaultCatalog';
import { SYSTEM_SHEET_URL, APP_VERSION } from './config';
import * as XLSX from 'xlsx';
import { 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Search, 
  FileUp, 
  X, 
  TrendingUp, 
  ChevronRight, 
  ChevronDown, 
  Phone, 
  MapPin, 
  Settings, 
  Database, 
  PlayCircle, 
  Globe, 
  Info, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Fingerprint, 
  SquareX, 
  AlertCircle, 
  RefreshCcw, 
  RotateCcw, 
  Clock, 
  ShieldBan,
  Mail,
  Building2,
  Users,
  Home,
  Layers,
  Zap,
  Star,
  ExternalLink,
  TableProperties,
  Target,
  CloudUpload,
  Link
} from 'lucide-react';

const STORAGE_KEY = 'zografa_sales_v15_1';

const ScoreBadge = ({ score }: { score: ScoreLevel }) => {
  const styles = {
    'High': 'text-emerald-600 font-black',
    'Medium': 'text-amber-600 font-bold',
    'Low': 'text-slate-400 font-medium',
    'NONE': 'text-slate-200 font-normal'
  };
  return <span className={styles[score]}>{score === 'NONE' ? '-' : score}</span>;
};

const ScaleBadge = ({ scale }: { scale: ScaleAnalysis | undefined }) => {
  if (!scale || scale.scale_category === 'Single' || scale.scale_category === 'Unknown') {
    if (scale?.scale_category === 'Single') return <span title="Единичен обект"><Home className="w-4 h-4 text-slate-300" /></span>;
    return null;
  }

  const styles = {
    'Small Chain': 'bg-amber-50 text-amber-700 border-amber-200',
    'Medium Chain': 'bg-purple-50 text-purple-700 border-purple-200',
    'Large Chain': 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-2 ring-indigo-100'
  };

  const icons = {
    'Small Chain': <Layers className="w-3.5 h-3.5" />,
    'Medium Chain': <Zap className="w-3.5 h-3.5" />,
    'Large Chain': <Star className="w-3.5 h-3.5 animate-pulse" />
  };

  const labels = {
    'Small Chain': `ВЕРИГА (${scale.estimated_locations})`,
    'Medium Chain': `СРЕДНА ВЕРИГА (${scale.estimated_locations})`,
    'Large Chain': `ГОЛЯМА ВЕРИГА (${scale.estimated_locations})`
  };

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${styles[scale.scale_category as keyof typeof styles]}`}>
      {icons[scale.scale_category as keyof typeof icons]}
      {labels[scale.scale_category as keyof typeof labels]}
    </div>
  );
};

const ClientTypeBadge = ({ type }: { type: string }) => {
    let colorClass = "bg-slate-900";
    if (type === "Магазин / Верига") colorClass = "bg-emerald-600";
    if (type === "Дистрибутор/Рекламна агенция") colorClass = "bg-indigo-600";
    if (type === "Краен клиент") colorClass = "bg-cyan-600";
    if (type === "Физическо лице") colorClass = "bg-amber-500";
    
    return (
        <span className={`text-xs ${colorClass} text-white px-4 py-1.5 rounded-full uppercase font-black tracking-widest shadow-sm flex items-center gap-2`}>
            {type === "Физическо лице" && <User className="w-3 h-3" />}
            {type}
        </span>
    );
};

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [catalog, setCatalog] = useState<ProductGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CATALOG;
  });

  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    const saved = localStorage.getItem('google_sheet_url');
    return saved && saved.length > 10 ? saved : SYSTEM_SHEET_URL;
  });

  useEffect(() => {
    if (!localStorage.getItem('google_sheet_url')) {
      localStorage.setItem('google_sheet_url', SYSTEM_SHEET_URL);
    }
  }, []);

  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, success: 0, error: 0 });
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [newClientName, setNewClientName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetSavingId, setSheetSavingId] = useState<string | null>(null);
  const shouldTerminateRef = useRef(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gemini = useMemo(() => new GeminiService(), []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog)); }, [catalog]);

  const addClient = () => {
    const lines = newClientName.split('\n').map(n => n.trim()).filter(n => n.length > 1);
    const newBatch: Client[] = lines.map(line => {
      let name = line;
      let vat = "";
      if (line.includes(',')) {
        const parts = line.split(',');
        name = parts[0].trim();
        vat = parts[1].trim();
      }
      return { id: Math.random().toString(36).substr(2, 9), name, vat, status: 'idle' as 'idle' };
    });
    setClients(prev => [...newBatch, ...prev]);
    setStats(prev => ({ ...prev, total: prev.total + newBatch.length }));
    setNewClientName('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const json: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
      const newBatch: Client[] = json.slice(1).map(row => ({
        id: Math.random().toString(36).substr(2, 9),
        name: String(row[0] || ''),
        vat: row[1] ? String(row[1]).trim() : "",
        status: 'idle' as 'idle'
      })).filter(c => c.name);
      setClients(prev => [...newBatch, ...prev]);
      setStats(prev => ({ ...prev, total: prev.total + newBatch.length }));
    };
    reader.readAsArrayBuffer(file);
  };

  const performSaveToSheet = async (client: any, url: string) => {
    // V2.0 Mapping Alignment
    const payload = {
      company_name: client.correctedName || client.name,
      category_scores: client.category_scores || {},
      analysis: client.analysis,
      client_type: client.clientType,
      distributor_signal: client.distributor_signal || false,
      contacts: {
        responsible_persons: client.contacts?.responsible_persons || [],
        emails: client.contacts?.emails || [],
        phones: client.contacts?.phones || [],
        website: client.contacts?.website || 'Няма данни'
      },
      scale_analysis: {
        scale_category: client.scale_analysis?.scale_category || 'Unknown',
        estimated_locations: client.scale_analysis?.estimated_locations || '1'
      }
    };

    return fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
  };

  const runAnalysis = async () => {
    if (clients.length === 0 || isProcessing) return;
    
    shouldTerminateRef.current = false;
    setIsProcessing(true);

    for (let i = 0; i < clients.length; i++) {
      if (shouldTerminateRef.current) break;
      if (clients[i].status === 'completed') continue;

      setClients(prev => prev.map((c, idx) => i === idx ? { ...c, status: 'processing' } : c));
      
      try {
        const result = await gemini.analyzeCompany(clients[i].name, catalog, clients[i].vat);
        
        if (sheetUrl) {
          try {
            await performSaveToSheet({ ...clients[i], ...result }, sheetUrl);
          } catch (sheetErr) {
            console.error("Auto-save failed for:", clients[i].name, sheetErr);
          }
        }

        setClients(prev => prev.map((c, idx) => i === idx ? { ...c, status: 'completed', ...result } : c));
        setStats(prev => ({ ...prev, completed: prev.completed + 1, success: prev.success + 1 }));
        setExpandedClients(prev => new Set(prev).add(clients[i].id));

        if (i < clients.length - 1 && !shouldTerminateRef.current) {
          await new Promise(r => setTimeout(r, 2000));
        }

      } catch (e) {
        setClients(prev => prev.map((c, idx) => i === idx ? { ...c, status: 'error' } : c));
        setStats(prev => ({ ...prev, completed: prev.completed + 1, error: prev.error + 1 }));
      }
    }
    setIsProcessing(false);
  };

  const handleManualSaveToSheet = async (client: Client) => {
    if (!sheetUrl) {
      alert("Моля, първо въведете Google Sheet URL в настройките!");
      setIsSettingsOpen(true);
      return;
    }
    setSheetSavingId(client.id);
    try {
      await performSaveToSheet(client, sheetUrl);
      alert('Данните са изпратени към таблицата!');
    } catch (error) {
      console.error('Error manual saving to sheet:', error);
      alert('Грешка при изпращането. Проверете URL адреса.');
    } finally {
      setSheetSavingId(null);
    }
  };

  const handleResetAll = () => {
    if (clients.length > 0) {
      if (!window.confirm("Сигурни ли сте? Това ще рестартира приложението и ще изчисти всичко.")) {
        return;
      }
    }
    window.location.reload();
  };

  const onResetCatalog = () => {
    if (window.confirm("Сигурни ли сте? Това ще върне оригиналните описания на Зографа.")) {
      setCatalog(DEFAULT_CATALOG);
    }
  };

  const sheetUrlActive = !!sheetUrl && sheetUrl.length > 10;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center">
      <header className="w-full bg-white border-b h-16 px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          <h1 className="font-black text-lg tracking-tight uppercase">Zografa Analyst <span className="text-indigo-500 font-bold ml-1">{APP_VERSION}</span></h1>
        </div>
        <div className="flex items-center gap-4">
          {sheetUrlActive && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <CloudUpload className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Auto-save On</span>
            </div>
          )}
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </header>

      <main className="w-full max-w-5xl mt-10 px-6 space-y-8 pb-20">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <textarea 
            placeholder="Въведете Име на фирма, БУЛСТАТ, Email или URL (на нов ред)..." 
            value={newClientName} 
            onChange={e => setNewClientName(e.target.value)} 
            className="w-full px-4 py-3 text-lg border border-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none h-28 bg-slate-50 rounded-xl resize-none mb-4 font-medium"
          />
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors">
              <FileUp className="w-4 h-4" /> ИМПОРТ ЕКСЕЛ
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload} 
                accept=".xlsx,.xls" 
              />
            </label>
            <button onClick={addClient} disabled={!newClientName.trim()} className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-30 shadow-lg shadow-indigo-100 transition-all">Добави</button>
          </div>
        </section>

        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={runAnalysis}
            disabled={isProcessing || clients.length === 0}
            className={`px-14 py-4 rounded-full text-base font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all ${isProcessing ? 'bg-amber-100 text-amber-700' : 'bg-indigo-600 text-white hover:scale-105 active:scale-95 disabled:opacity-20'}`}
          >
            {isProcessing ? <><Loader2 className="w-6 h-6 animate-spin" /> Обработка...</> : <><PlayCircle className="w-6 h-6" /> СТАРТ</>}
          </button>
          {isProcessing && (
            <button 
              onClick={() => { shouldTerminateRef.current = true; setIsProcessing(false); }} 
              className="text-xs font-black text-rose-600 uppercase flex items-center gap-2 hover:underline"
            >
              <SquareX className="w-3.5 h-3.5" /> Спри процеса
            </button>
          )}
        </div>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Списък за анализ ({clients.length}) 
              {stats.total > 0 && <span className="ml-2 lowercase opacity-60">| {stats.completed}/{stats.total} обработени</span>}
            </h2>
            <button onClick={handleResetAll} className="text-xs font-black text-rose-600 uppercase flex items-center gap-2 hover:underline">
              <RotateCcw className="w-3 h-3" /> Нулирай всичко
            </button>
          </div>

          <div className="space-y-4">
            {clients.map((client) => {
              const isExpanded = expandedClients.has(client.id);
              const isCompleted = client.status === 'completed';
              
              return (
                <div key={client.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                  <div className={`p-6 flex items-center justify-between ${isCompleted ? 'cursor-pointer hover:bg-slate-50/50' : ''}`} onClick={() => isCompleted && setExpandedClients(prev => {
                    const next = new Set(prev);
                    if (next.has(client.id)) next.delete(client.id); else next.add(client.id);
                    return next;
                  })}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-emerald-100 text-emerald-700' : client.status === 'processing' ? 'bg-amber-100 text-amber-600' : client.status === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                        {isCompleted ? <CheckCircle2 /> : client.status === 'processing' ? <Loader2 className="animate-spin" /> : client.status === 'error' ? <AlertCircle /> : <Clock />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-xl tracking-tight text-slate-800">{client.correctedName || client.name}</h3>
                          {client.contacts?.website && (
                             <a href={client.contacts.website.startsWith('http') ? client.contacts.website : `https://${client.contacts.website}`} target="_blank" className="p-1 hover:bg-slate-100 rounded transition-colors text-indigo-500" onClick={(e) => e.stopPropagation()}>
                               <ExternalLink className="w-4 h-4" />
                             </a>
                          )}
                          {client.vat && <span className="text-[10px] font-black text-slate-400 border px-1 rounded uppercase tracking-tighter">{client.vat}</span>}
                          <ScaleBadge scale={client.scale_analysis} />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {isCompleted && <ClientTypeBadge type={client.clientType || ''} />}
                          {client.distributor_signal && (
                            <span className="flex items-center gap-1 text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider animate-pulse">
                              <ShieldAlert className="w-3 h-3" /> Distributors List Found
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isCompleted && (isExpanded ? <ChevronDown className="text-slate-300" /> : <ChevronRight className="text-slate-300" />)}
                  </div>

                  {isCompleted && isExpanded && (
                    <div className="p-6 border-t border-slate-50 space-y-8 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                      
                      {client.distributor_signal && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                           <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                           <div>
                             <div className="text-xs font-black text-rose-700 uppercase tracking-widest mb-1">Дистрибуторски Сигнал</div>
                             <p className="text-sm text-rose-600 font-medium italic">{client.distributor_details}</p>
                           </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Target className="w-3 h-3" /> Оценки по направления</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          {catalog.map(cat => (
                            <div key={cat.id} className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-sm">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">{cat.name}</span>
                              <div className="text-sm">
                                <ScoreBadge score={client.category_scores?.[cat.id] || 'NONE'} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                         {client.scale_analysis && (
                          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-4 flex-1 shadow-sm">
                            <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Присъствие</div>
                              <div className="text-sm font-bold text-slate-800 mb-1">
                                {client.scale_analysis.scale_category === 'Single' ? 'Единичен обект' : `Мрежа от ${client.scale_analysis.estimated_locations} обекта`}
                              </div>
                              <p className="text-xs text-indigo-600 italic leading-relaxed">{client.scale_analysis.details}</p>
                            </div>
                          </div>
                        )}
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleManualSaveToSheet(client); }}
                          disabled={sheetSavingId === client.id}
                          className="px-6 py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 h-full"
                        >
                          {sheetSavingId === client.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <TableProperties className="w-4 h-4" />}
                          {sheetSavingId === client.id ? 'Запазване...' : 'Запази в Таблица'}
                        </button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1"><Search className="w-3 h-3" /> Обосновка</h4>
                        <div className="p-4 bg-white border border-slate-100 rounded-xl text-base font-medium leading-relaxed italic text-slate-700 shadow-sm">
                          {client.analysis}
                        </div>
                      </div>

                      <div className="flex flex-col gap-6 w-full">
                        <div className="space-y-3 w-full bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                          <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2"><Users className="w-4 h-4" /> 👤 Отговорни лица</h4>
                          <div className="space-y-2">
                            {client.contacts?.responsible_persons?.length ? client.contacts.responsible_persons.map((p, pi) => (
                              <div key={pi} className="p-4 bg-white border border-blue-50 rounded-xl shadow-sm group">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-black text-slate-800 text-sm">{p.name}</div>
                                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{p.role}</div>
                                  </div>
                                  <div className={`text-xs font-bold flex items-center gap-1.5 ${p.direct_contact === 'Няма данни' ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {p.direct_contact.includes('@') ? <Mail className="w-3.5 h-3.5 text-blue-400" /> : <Phone className="w-3.5 h-3.5 text-blue-400" />}
                                    {p.direct_contact}
                                  </div>
                                </div>
                              </div>
                            )) : (
                              <div className="p-4 bg-white/50 border border-dashed border-blue-200 rounded-xl text-xs font-bold text-slate-300 uppercase text-center py-6 italic">Няма данни за лица</div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-3 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                             <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2"><Mail className="w-4 h-4" /> Имейли</h4>
                             <div className="flex flex-wrap gap-2">
                               {client.contacts?.emails.length ? client.contacts.emails.map((em, pi) => (
                                 <span key={pi} className="px-3 py-1.5 bg-white border border-emerald-100 rounded-lg text-xs font-black text-emerald-700 select-all hover:bg-emerald-50 transition-colors">
                                   {em}
                                 </span>
                               )) : <span className="text-sm font-bold text-slate-300">Няма данни</span>}
                             </div>
                           </div>
                           <div className="space-y-3 bg-slate-100/50 p-5 rounded-2xl border border-slate-200/50">
                             <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Phone className="w-4 h-4" /> Телефони</h4>
                             <div className="flex flex-wrap gap-2">
                               {client.contacts?.phones.length ? client.contacts.phones.map((ph, pi) => (
                                 <span key={pi} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-600 select-all hover:bg-slate-50 transition-colors">
                                   {ph}
                                 </span>
                               )) : <span className="text-sm font-bold text-slate-300">Няма данни</span>}
                             </div>
                           </div>
                        </div>
                      </div>

                      {client.sources && client.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                          {client.sources.map((s, si) => (
                            <a key={si} href={s.uri} target="_blank" className="text-[9px] font-black text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 transition-colors uppercase truncate max-w-[150px]">
                              {s.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        catalog={catalog}
        setCatalog={setCatalog}
        onResetCatalog={onResetCatalog}
        sheetUrl={sheetUrl}
        setSheetUrl={setSheetUrl}
      />
    </div>
  );
}