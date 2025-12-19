
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Client, ProductGroup, SuitabilityLevel, MatchedCategory, ContactPerson } from './types';
import { GeminiService } from './services/geminiService';
import * as XLSX from 'xlsx';
import { 
  Trash2, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  Search, 
  Download, 
  Mail, 
  UserCheck, 
  CheckSquare, 
  Square, 
  Pencil, 
  X, 
  TrendingUp, 
  ChevronRight, 
  ChevronDown, 
  FileUp, 
  Phone, 
  MapPin, 
  Settings, 
  Link2, 
  RefreshCw,
  Database,
  PlayCircle,
  Globe,
  Info,
  ShieldCheck,
  ShieldAlert,
  History,
  FileText,
  AlertTriangle,
  Code,
  User,
  Fingerprint,
  SquareX
} from 'lucide-react';

const INITIAL_PRODUCT_GROUPS: ProductGroup[] = [
  { 
    id: '1', 
    name: 'Shop Equipment (Оборудване за магазини)', 
    description: `# TARGET PROFILE: SHOP EQUIPMENT\n\n## 1. MAIN CRITERIA (The Physical Store Rule)\nНай-важният критерий е наличието на ФИЗИЧЕСКИ ТЪРГОВСКИ ОБЕКТ (Brick-and-Mortar). Търсим фирми, които имат реални помещения, в които клиентите влизат, за да пазаруват стоки от рафтове.\n\n## 2. IDEAL BUSINESS TYPES (High Potential)\n* Хранителни стоки (FMCG): Супермаркети, квартални минимаркети, магазини "Нон-стоп", магазини за алкохол и цигари, пекарни.\n* Специализирани: Аптеки, дрогерии, зоомагазини, книжарници, магазини за подаръци/играчки.\n* Технически: Железарии, строителни борси, магазини за авточасти, бои и лакове.\n\n## 3. NEGATIVE CRITERIA (Low Potential)\n* Pure E-commerce: Онлайн магазини без физически шоурум.\n* Офис дейности: Адвокати, ИТ, счетоводство, консултанти.\n* Услуги: Фризьори, козметици (имат малко рафтове).` 
  },
  { 
    id: '2', 
    name: 'Plexiglass Displays (Рекламни стелажи Плексиглас)', 
    description: `# TARGET PROFILE: PLEXIGLASS DISPLAYS (Distributors)\n\n## 1. MAIN CRITERIA (The Brand Owner)\nТърсим ПРОИЗВОДИТЕЛИ и ВНОСИТЕЛИ, които имат собствена марка продукти и ги дистрибутират в търговската мрежа. Продуктите им са визуално атрактивни, дребни или импулсни.\n\n## 2. IDEAL BUSINESS TYPES\n* Козметика и Фармация: Вносители на гримове, лакове, дермокозметика, хранителни добавки.\n* Vape & Tobacco: Дистрибутори на електронни цигари, течности, аксесоари.\n* Дребна техника: Калъфи за телефони, зарядни, смарт джаджи.\n* Импулсни сладкиши: Дъвки, шоколадови изделия за касова зона.` 
  },
  { 
    id: '3', 
    name: 'Wood Displays (Рекламни стелажи Дърво)', 
    description: `# TARGET PROFILE: PLYWOOD/WOOD DISPLAYS (Distributors)\n\n## 1. MAIN CRITERIA (Eco/Bio Brands)\nТърсим БРАНДОВЕ, чийто маркетинг залага на "Натурален", "Био", "Еко" или "Занаятчийски" (Craft) имидж. Дървото е част от тяхната идентичност.\n\n## 2. IDEAL BUSINESS TYPES\n* Храни и Напитки: Винарски изби, Крафт пивоварни, Производители на мед, чай, кафе, ядки, био храни.\n* Натурална козметика: Брандове за био козметика, сапуни, етерични масла.\n* Сувенири и Арт: Вносители на подаръци, свещи, керамика.` 
  },
  { 
    id: '4', 
    name: 'Metal & Showroom Displays (Рекламни стелажи Метал)', 
    description: `# TARGET PROFILE: METAL & SHOWROOM DISPLAYS (Distributors)\n\n## 1. MAIN CRITERIA (Heavy Duty & Showroom)\nТърсим ГОЛЕМИ ПРОИЗВОДИТЕЛИ и ВНОСИТЕЛИ на тежки/обемни стоки или такива, които изграждат мострени кътове (шоурум в шоурума).\n\n## 2. IDEAL BUSINESS TYPES\n* Строителство и Ремонт: Производители на фаянс, гранитогрес, паркет, врати, мазилки, бои.\n* Инструменти и Техника: Вносители на електроинструменти, градинска техника.\n* Авто части: Вносители на масла, гуми, акумулатори, автокозметика.\n* Масов FMCG: Големи производители на безалкохолни, бира, вода.` 
  },
  { 
    id: '5', 
    name: 'Store Accessories (Аксесоари за магазини)', 
    description: `# TARGET PROFILE: STORE ACCESSORIES (Universal)\n\n## 1. MAIN CRITERIA (Universal Application)\nТърсим АБСОЛЮТНО ВСЕКИ обект, в който се съхранява или продава физическа стока. Диапазонът е от най-малката сергия, през стандартните магазини, до ГОЛЕМИ СКЛАДОВИ БАЗИ.\n\n## 2. IDEAL CUSTOMER TYPES (All Inclusive)\n* Търговия на дребно (Retail): Всички видове магазини.\n* Складове и Логистика (Warehouse): Складови бази, които имат нужда от организация.\n* Физически лица и Микро-бизнес: Собственици на павилиони, сергии на пазари.\n* Специализирани обекти: Ателиета, сервизи, болнични складове, архиви.\n\n## 3. NEGATIVE CRITERIA (Very Limited)\n* Pure Digital/Service: Единствено фирми, които нямат НИКАКВА физическа дейност или стока.` 
  },
  { 
    id: '6', 
    name: 'Advertising & Event Equipment (Рекламно оборудване)', 
    description: `# TARGET PROFILE: ADVERTISING & EVENT EQUIPMENT\n\n## 1. MAIN CRITERIA (Visual Communication & Events)\nТърсим организации, които имат нужда да КОМУНИКИРАТ ВИЗУАЛНО с поток от хора.\n\n## 2. IDEAL CUSTOMER TYPES (High Potential)\n* Корпоративни и Услуги: Банки, Застрахователни офиси, Недвижими имоти, Туристически агенции.\n* Търговски обекти и HORECA: Ресторанти, Кафенета, Магазини.\n* B2B Търговци and Производители (The Exhibitors): Всички, които посещават панаири и събития.\n* Държавни и Образователни: Университети, Училища, Общини.\n* Посредници: Рекламни агенции.\n\n## 3. NEGATIVE CRITERIA (Low Potential)\n* Скрити производства: Цехове и фабрики без посетители.\n* Home Office / Freelancers: Индивидуални хора без офис.` 
  },
  { 
    id: '7', 
    name: 'Warehouse & Archive Shelving (Склад и Архив)', 
    description: `# TARGET PROFILE: WAREHOUSE & ARCHIVE SHELVING\n\n## 1. MAIN CRITERIA (Storage & Organization)\nТърсим организации, които имат нужда да СЪХРАНЯВАТ неща в помещения без достъп на крайни клиенти.\n\n## 2. IDEAL CUSTOMER TYPES (High Potential)\n* Администрация и Услуги: Счетоводни къщи, Адвокати, Банки, Болници, Общини.\n* E-commerce & Логистика (Picking Zones): Онлайн магазини, Куриерски офиси.\n* Търговия (Back-store): Складовата част на всеки магазин.\n* Индустрия и Сервизи: Автосервизи, цехове.\n\n## 3. NEGATIVE CRITERIA (Low Potential)\n* Тежка логистика (Pallet Only): Бази, които работят само с палети.\n* Виртуални офиси: Фирми без физически адрес.` 
  },
  { 
    id: '8', 
    name: 'Office Furniture (Офис обзавеждане)', 
    description: `# TARGET PROFILE: OFFICE FURNITURE\n\n## 1. MAIN CRITERIA (Workstations & Personnel)\nТърсим организации с ОФИС ДЕЙНОСТ и административен персонал.\n\n## 2. IDEAL CUSTOMER TYPES (High Potential)\n* "Paper-Heavy" Услуги: Счетоводни къщи, Адвокати, Нотариуси, ЧСИ.\n* Корпоративни и IT: Софтуерни компании, Кол центрове, Рекламни агенции.\n* Образование: Частни училища, Езикови школи.\n* Back-Office на други бизнеси: Административната част на заводи и логистични центрове.\n\n## 3. NEGATIVE CRITERIA (Low Potential)\n* Микро-търговия: Павилиони, сергии.\n* Тежък физически труд: Строителни бригади.\n* Хорека: Ресторанти и барове.` 
  }
];

const PROMPT_VERSIONS = [
  {
    version: "v8.0 (Anti-Guessing)",
    date: "Март 2025",
    changes: "Строг протокол срещу халюцинации. Забрана за налучкване на домейни. Въвеждане на 'НЯМА ЯСНИ ДАННИ'.",
    fullText: `# ZERO HALLUCINATION PROTOCOL:\n1. DO NOT GUESS DOMAINS.\n2. "НЯМА ЯСНИ ДАННИ" Rule.`
  },
  {
    version: "v9.0 (VAT-Ready Search)",
    date: "Текуща (Март 2025)",
    changes: "Добавена поддръжка за БУЛСТАТ (VAT ID) за максимална точност. Инструкция за използване на VAT като водещ идентификатор при търсене.",
    fullText: `# ROLE: Expert B2B Lead Researcher for "Zografa".\n# VAT MATCHING PROTOCOL:\nThe VAT/BULSTAT number is a unique identifier. Use it to confirm the legal entity. If name and VAT conflict, prioritize the VAT's data from official registers.`
  }
];

const STORAGE_KEY = 'zografa_sales_catalog_v9_final';
const CLIENTS_STORAGE_KEY = 'zografa_analyzed_clients_v9_final';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const SuitabilityBadge = ({ suitability }: { suitability: SuitabilityLevel }) => {
  const styles = {
    HIGH: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
    LOW: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  const labels = { HIGH: 'ВИСОК', MEDIUM: 'СРЕДЕН', LOW: 'НИСЪК' };
  return (
    <div className={`w-28 flex-shrink-0 px-2 py-1 rounded text-[10px] font-black border text-center uppercase tracking-tighter ${styles[suitability]}`}>
      {labels[suitability]}
    </div>
  );
};

const EmailBadge: React.FC<{ email: string }> = ({ email }) => {
  const isValid = EMAIL_REGEX.test(email);
  return (
    <div className="flex items-center gap-2 group relative">
      <span className={`text-base font-black ${isValid ? 'text-indigo-600' : 'text-slate-400'} hover:underline truncate`}>
        {email}
      </span>
      {isValid ? (
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
      )}
    </div>
  );
};

const ClientTypeBadge = ({ type }: { type: string }) => {
    let colorClass = "bg-slate-900";
    if (type === "Друго / Неприложимо") colorClass = "bg-rose-500";
    if (type === "Дистрибутор/Рекламна агенция") colorClass = "bg-indigo-600";
    if (type === "Магазин / Верига") colorClass = "bg-emerald-600";
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
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [dbSearch, setDbSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');
  
  const [catalog, setCatalog] = useState<ProductGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCT_GROUPS;
  });

  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set(catalog.map(g => g.id)));
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
    return saved ? JSON.parse(saved).map((c: any) => ({ ...c, status: c.status === 'completed' ? 'completed' : 'idle' })) : [];
  });

  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [newClientName, setNewClientName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shouldTerminate, setShouldTerminate] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPausedRef = useRef(false);
  const shouldTerminateRef = useRef(false);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { shouldTerminateRef.current = shouldTerminate; }, [shouldTerminate]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog)); }, [catalog]);
  useEffect(() => { localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients)); }, [clients]);

  const gemini = useMemo(() => new GeminiService(), []);

  const toggleExpand = (id: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSources = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addClient = () => {
    const lines = newClientName.split('\n').map(n => n.trim()).filter(n => n.length > 1);
    const existingNames = new Set(clients.map(c => c.name.toLowerCase()));
    
    const newBatch: Client[] = [];
    lines.forEach(line => {
      let name = line;
      let vat = "";
      if (line.includes(',')) {
        const parts = line.split(',');
        name = parts[0].trim();
        vat = parts[1].trim();
      }
      
      if (!existingNames.has(name.toLowerCase())) {
        newBatch.push({ 
          id: Math.random().toString(36).substr(2, 9), 
          name, 
          vat,
          status: 'idle' as const 
        });
      }
    });

    if (newBatch.length > 0) {
      setClients(prev => [...newBatch, ...prev]);
    }
    setNewClientName('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const json: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        
        const existingNames = new Set(clients.map(c => c.name.toLowerCase()));
        const newBatch: Client[] = [];
        
        json.forEach(row => {
          const name = row[0];
          const vat = row[1] ? String(row[1]).trim() : "";
          if (name && typeof name === 'string' && name.length > 1 && !existingNames.has(name.toLowerCase())) {
            newBatch.push({ 
              id: Math.random().toString(36).substr(2, 9), 
              name, 
              vat,
              status: 'idle' as const 
            });
          }
        });

        setClients(prev => [...newBatch, ...prev]);
      } catch (err) { alert('Грешка при четене на файла.'); }
    };
    reader.readAsArrayBuffer(file);
  };

  const runAnalysis = async () => {
    const activeGroups = catalog.filter(g => selectedGroupIds.has(g.id));
    if (clients.length === 0 || isProcessing || activeGroups.length === 0) return;
    setIsProcessing(true);
    setIsPaused(false);
    setShouldTerminate(false);

    for (let i = 0; i < clients.length; i++) {
      if (shouldTerminateRef.current) {
        setClients(prev => prev.map(c => c.status === 'processing' ? { ...c, status: 'idle' } : c));
        break;
      }
      while (isPausedRef.current) {
        await new Promise(r => setTimeout(r, 500));
        if (shouldTerminateRef.current) break;
      }
      if (shouldTerminateRef.current) {
          setClients(prev => prev.map(c => c.status === 'processing' ? { ...c, status: 'idle' } : c));
          break;
      }
      if (clients[i].status === 'completed') continue;

      setClients(prev => prev.map((c, idx) => i === idx ? { ...c, status: 'processing' as const } : c));
      
      try {
        const result = await gemini.analyzeCompany(clients[i].name, activeGroups, clients[i].vat);
        setClients(prev => prev.map((c, idx) => i === idx ? { ...c, status: 'completed' as const, ...result } : c));
        setExpandedClients(prev => new Set(prev).add(clients[i].id));
      } catch (e) {
        setClients(prev => prev.map((c, idx) => i === idx ? { ...c, status: 'error' as const } : c));
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    setIsProcessing(false);
  };

  const clearEverything = () => {
    if (window.confirm('Това ще ИЗЧИСТИ текущия списък и ще СПРЕ текущия анализ. Желаете ли?')) {
      setShouldTerminate(true);
      setIsProcessing(false);
      setClients([]);
      setExpandedClients(new Set());
      setExpandedSources(new Set());
      localStorage.removeItem(CLIENTS_STORAGE_KEY);
    }
  };

  const analyzedCount = clients.filter(c => c.status === 'completed').length;
  const queueCount = clients.filter(c => c.status === 'idle').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center font-normal">
      
      <header className="w-full bg-white border-b h-16 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          <h1 className="font-black text-lg tracking-tight uppercase">Zografa Analyst</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDatabaseOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
            <Database className="w-4 h-4" /> Архив ({analyzedCount})
          </button>
          <button onClick={() => { setIsSettingsOpen(true); setActiveTab('catalog'); }} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all">
            <Settings className="w-4 h-4" /> Настройки
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl mt-10 px-6 space-y-8">
        
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ново проучване</h3>
          <textarea 
            placeholder="Въведете имена на фирми или лица (формат: Име, БУЛСТАТ)..." 
            value={newClientName} 
            onChange={e => setNewClientName(e.target.value)} 
            className="w-full px-4 py-3 text-lg border border-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none h-28 bg-slate-50 rounded-xl resize-none mb-4 font-medium"
          />
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <FileUp className="w-4 h-4" /> Ексел / Текст
              </button>
            </div>
            <button 
              onClick={addClient}
              disabled={!newClientName.trim()}
              className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-30 shadow-lg shadow-indigo-100 transition-all"
            >
              Добави в списъка
            </button>
          </div>
        </section>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button 
              onClick={runAnalysis}
              disabled={isProcessing || queueCount === 0}
              className={`px-14 py-4 rounded-full text-base font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all ${isProcessing ? 'bg-amber-100 text-amber-700 cursor-default scale-95' : 'bg-indigo-600 text-white hover:scale-105 active:scale-95 disabled:opacity-20'}`}
            >
              {isProcessing ? <><Loader2 className="w-6 h-6 animate-spin" /> Анализиране...</> : <><PlayCircle className="w-6 h-6" /> Стартирай проучването</>}
            </button>

            {isProcessing && (
              <button 
                onClick={() => setShouldTerminate(true)}
                className="px-8 py-4 rounded-full text-base font-black uppercase tracking-widest shadow-xl bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95 flex items-center gap-3 transition-all animate-in slide-in-from-bottom-2"
              >
                <SquareX className="w-6 h-6" /> Спри
              </button>
            )}
          </div>
        </div>

        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Текущи резултати ({clients.length})</h2>
            {clients.length > 0 && (
              <button 
                onClick={clearEverything} 
                className="text-xs font-black text-rose-600 uppercase flex items-center gap-2 hover:bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 transition-all shadow-sm active:scale-95"
              >
                <Trash2 className="w-4 h-4" /> Изчисти всичко
              </button>
            )}
          </div>

          <div className="space-y-6">
            {clients.map((client, idx) => {
              const isExpanded = expandedClients.has(client.id);
              const isCompleted = client.status === 'completed';
              const isSourcesOpen = expandedSources.has(client.id);

              return (
                <div key={client.id} className={`bg-white rounded-2xl border transition-all ${client.status === 'processing' ? 'border-indigo-400 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-200 shadow-sm overflow-hidden'}`}>
                  <div className="p-8">
                    <div className={`flex items-start justify-between ${isCompleted ? 'cursor-pointer' : ''}`} onClick={() => isCompleted && toggleExpand(client.id)}>
                      <div className="flex items-center gap-6 w-full">
                        <div className={`w-12 h-12 rounded-xl text-sm font-black flex-shrink-0 flex items-center justify-center ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                          {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
                        </div>
                        <div className="flex-1 flex flex-wrap items-center justify-between gap-4">
                          <div>
                              <div className="flex items-center gap-3">
                                <h3 className="font-black text-2xl tracking-tight text-slate-800">{client.name}</h3>
                                {client.vat && (
                                  <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                    <Fingerprint className="w-3 h-3" /> {client.vat}
                                  </span>
                                )}
                              </div>
                              {isCompleted && client.website && (
                                  <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1.5 mt-1 uppercase tracking-wider">
                                      <Globe className="w-3.5 h-3.5" /> {client.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                  </a>
                              )}
                          </div>
                          {isCompleted && (
                            <div className="flex items-center gap-4">
                              <ClientTypeBadge type={client.clientType || ''} />
                              {isExpanded ? <ChevronDown className="w-6 h-6 text-slate-400" /> : <ChevronRight className="w-6 h-6 text-slate-400" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {client.status === 'processing' && (
                      <div className="mt-4 pl-18 ml-14">
                        <p className="text-sm text-indigo-600 font-bold animate-pulse">Проучване в реално време за "{client.name}"...</p>
                      </div>
                    )}

                    {isCompleted && isExpanded && (
                      <div className="mt-8 pt-8 border-t border-slate-100 space-y-10 animate-in fade-in duration-300">
                        <div className="w-full">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Search className="w-4 h-4 text-indigo-500" /> Основна дейност</h4>
                          <div className="bg-slate-50 p-6 rounded-xl text-slate-800 leading-relaxed text-lg font-medium border border-slate-100">
                            {client.activity}
                          </div>
                        </div>

                        <div className="w-full">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Обекти ({client.locationsCount})</h4>
                          <div className="bg-white p-6 rounded-xl text-slate-600 text-base border border-slate-100 italic">
                            {client.locationDetails || 'Няма потвърдена информация.'}
                          </div>
                        </div>

                        <div className="w-full">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Потенциал по категории</h4>
                          <div className="space-y-3">
                            {client.matches?.map((m, mi) => (
                              <div key={mi} className="border border-slate-100 p-4 rounded-xl flex items-center gap-6 hover:bg-slate-50 transition-colors">
                                <SuitabilityBadge suitability={m.suitability} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-black text-slate-900 text-sm">{m.categoryName}</div>
                                  <p className="text-xs text-slate-500 truncate">{m.reasoning}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-8 w-full">
                          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
                            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <UserCheck className="w-4 h-4" /> Отговорни лица
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {client.responsiblePersons?.length ? client.responsiblePersons.map((p, pi) => (
                                <div key={pi} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                                  <div className="font-black text-slate-800 text-base">{p.name}</div>
                                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-3">{p.role}</div>
                                  <div className="space-y-2">
                                    {p.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /><EmailBadge email={p.email} /></div>}
                                    {p.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm font-bold text-slate-700">{p.phone}</span></div>}
                                  </div>
                                </div>
                              )) : <span className="text-sm text-slate-400 italic">Няма открити конкретни лица.</span>}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-100/50 p-6 rounded-2xl border border-slate-200">
                              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Mail className="w-4 h-4" /> Общи Имейли</h4>
                              <div className="flex flex-col gap-3">
                                {client.emails?.length ? client.emails.map(e => <EmailBadge key={e} email={e} />) : <span className="text-sm text-slate-400 italic">Няма открити общи имейли.</span>}
                              </div>
                            </div>
                            <div className="bg-slate-100/50 p-6 rounded-2xl border border-slate-200">
                              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Phone className="w-4 h-4" /> Общи Телефони</h4>
                              <div className="flex flex-col gap-3">
                                {client.phoneNumbers?.length ? client.phoneNumbers.map(ph => <span key={ph} className="text-base font-black text-slate-700">{ph}</span>) : <span className="text-sm text-slate-400 italic">Няма открити общи телефони.</span>}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="w-full border-t border-slate-50 pt-6">
                           <button onClick={(e) => toggleSources(e, client.id)} className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-500 transition-colors">
                             <Globe className="w-4 h-4" /> Източници ({client.sources?.length || 0})
                           </button>
                           {isSourcesOpen && (
                             <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                               {client.sources?.map((s, si) => (
                                 <a key={si} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-100 p-3 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 truncate flex justify-between group">
                                   <span className="truncate">{s.title}</span> <ExternalLink className="w-3 h-3" />
                                 </a>
                               ))}
                             </div>
                           )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-8 border-b flex items-center justify-between">
              <div className="flex gap-8">
                <button 
                  onClick={() => setActiveTab('catalog')} 
                  className={`flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'catalog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <Settings className="w-4 h-4" /> Каталог
                </button>
                <button 
                  onClick={() => setActiveTab('history')} 
                  className={`flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <History className="w-4 h-4" /> История на настройките
                </button>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full mb-4"><X className="w-8 h-8" /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              {activeTab === 'catalog' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Активен каталог за ИИ</h3>
                    {catalog.map(g => (
                      <div key={g.id} className="p-5 border border-slate-200 bg-white rounded-2xl flex items-start gap-4 group hover:border-indigo-300 hover:shadow-md transition-all">
                        <button onClick={() => {
                          const next = new Set(selectedGroupIds);
                          if (next.has(g.id)) next.delete(g.id); else next.add(g.id);
                          setSelectedGroupIds(next);
                        }} className="mt-1">
                          {selectedGroupIds.has(g.id) ? <CheckSquare className="w-6 h-6 text-indigo-600" /> : <Square className="w-6 h-6 text-slate-200" />}
                        </button>
                        <div className="flex-1">
                          <div className="font-black text-slate-900 text-base uppercase tracking-tight">{g.name}</div>
                          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{g.description}</p>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingGroupId(g.id); setNewGroupName(g.name); setNewGroupDesc(g.description); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setCatalog(prev => prev.filter(pg => pg.id !== g.id))} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 h-fit sticky top-0">
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4" /> {editingGroupId ? 'Редактиране' : 'Ново направление'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Име на продуктова група</label>
                        <input type="text" placeholder="Напр. Складово оборудване..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full px-5 py-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-slate-50" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Инструкции за разпознаване</label>
                        <textarea placeholder="Опишете какви фирми се включват тук..." value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} className="w-full px-5 py-4 border border-slate-200 rounded-xl h-44 outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium bg-slate-50 leading-relaxed" />
                      </div>
                    </div>
                    <button onClick={() => {
                      if (editingGroupId) {
                        setCatalog(prev => prev.map(g => g.id === editingGroupId ? { ...g, name: newGroupName, description: newGroupDesc } : g));
                        setEditingGroupId(null);
                      } else {
                        const id = Math.random().toString(36).substr(2, 9);
                        setCatalog(prev => [...prev, { id, name: newGroupName, description: newGroupDesc }]);
                        setSelectedGroupIds(prev => new Set(prev).add(id));
                      }
                      setNewGroupName(''); setNewGroupDesc('');
                    }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-[0.98] transition-all">
                      {editingGroupId ? 'Запази промените' : 'Добави в каталога'}
                    </button>
                    {editingGroupId && (
                      <button onClick={() => { setEditingGroupId(null); setNewGroupName(''); setNewGroupDesc(''); }} className="w-full py-2 text-xs font-bold text-slate-400 uppercase">Отказ</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-12">
                   <div className="flex items-center gap-4 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                     <AlertTriangle className="w-10 h-10 text-amber-500 flex-shrink-0" />
                     <div>
                       <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest">Бележка за точността</h4>
                       <p className="text-sm text-amber-800 font-medium mt-1">Инструкциите се актуализират автоматично с всяка нова версия на приложението. Тук виждате хронологията на това как е "обучаван" моделът да избягва халюцинации и грешки.</p>
                     </div>
                   </div>

                   <div className="space-y-8">
                     {PROMPT_VERSIONS.slice().reverse().map((v, idx) => (
                       <div key={v.version} className="relative pl-10 border-l-2 border-slate-200 pb-8 last:pb-0">
                         <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 shadow-sm" />
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">{v.version}</span>
                              <span className="text-xs font-bold text-slate-400">{v.date}</span>
                            </div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{v.changes}</span>
                         </div>
                         <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">
                              <Code className="w-3.5 h-3.5" /> Пълен текст на инструкцията
                            </div>
                            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                              {v.fullText}
                            </pre>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-24 opacity-30 text-[10px] font-black uppercase tracking-[0.8em] text-center pb-20">
        Zografa Analyst v9.1 | High Precision AI Research
      </footer>
    </div>
  );
}
