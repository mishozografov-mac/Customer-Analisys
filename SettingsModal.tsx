
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, RotateCcw, Server, Thermometer, ScrollText, ShieldAlert, Package, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { ProductGroup } from './types';
import { SYSTEM_CONFIG, SYSTEM_PROMPT_TEXT } from './geminiService'; 
import { SYSTEM_SHEET_URL } from './config';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: ProductGroup[];
  setCatalog: (groups: ProductGroup[]) => void;
  onResetCatalog: () => void;
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  catalog, 
  setCatalog, 
  onResetCatalog,
  sheetUrl,
  setSheetUrl
}: SettingsModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'products' | 'system'>('products');
  const [localCatalog, setLocalCatalog] = useState<ProductGroup[]>(catalog);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = () => {
    setCatalog(localCatalog);
    onClose();
  };

  const updateGroup = (id: string, field: keyof ProductGroup, value: string) => {
    setLocalCatalog(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const addGroup = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setLocalCatalog([...localCatalog, { id: newId, name: 'Ново направление', description: 'Описание на критериите...' }]);
  };

  const removeGroup = (id: string) => {
    if (confirm('Сигурни ли сте, че искате да изтриете тази група?')) {
      setLocalCatalog(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleSaveUrl = () => {
    try {
      localStorage.setItem('google_sheet_url', sheetUrl);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleResetToDefaultUrl = () => {
    setSheetUrl(SYSTEM_SHEET_URL);
    localStorage.setItem('google_sheet_url', SYSTEM_SHEET_URL);
    alert("Възстановени са фабричните настройки на връзката.");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Настройки</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b bg-slate-50 px-6 pt-2 gap-4">
          <button 
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'products' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Package className="w-4 h-4" /> Продуктови направления
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'system' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Server className="w-4 h-4" /> Системно Инфо & Интеграции
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-slate-500">Тук дефинирате критериите, по които AI оценява фирмите.</p>
                <div className="flex gap-2">
                   <button onClick={onResetCatalog} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 rounded hover:bg-rose-100 transition-colors">
                      <RotateCcw className="w-3 h-3" /> Reset Default
                   </button>
                   <button onClick={addGroup} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-800 rounded hover:bg-slate-700 transition-colors">
                      <Plus className="w-3 h-3" /> Добави
                   </button>
                </div>
              </div>

              <div className="grid gap-4">
                {localCatalog.map((group) => (
                  <div key={group.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex gap-4 items-start">
                      <div className="mt-2 bg-indigo-50 p-2 rounded-lg text-indigo-600">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Име на категория</label>
                          <input 
                            value={group.name} 
                            onChange={(e) => updateGroup(group.id, 'name', e.target.value)}
                            className="w-full font-bold text-slate-800 border-b border-slate-200 focus:border-indigo-500 outline-none pb-1 bg-transparent"
                            placeholder="Напр. Офис мебели"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Критерии (Промпт инструкция)</label>
                          <textarea 
                            value={group.description} 
                            onChange={(e) => updateGroup(group.id, 'description', e.target.value)}
                            className="w-full text-sm text-slate-600 border border-slate-100 rounded-lg p-3 focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white resize-none h-24 transition-all"
                            placeholder="Опишете какво търсим..."
                          />
                        </div>
                      </div>
                      <button onClick={() => removeGroup(group.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-800 text-sm">
                 <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                 <div>
                   <span className="font-bold block">Системна зона</span>
                   Конфигурация на модела и външни интеграции.
                 </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-500 uppercase tracking-widest">
                    <Database className="w-4 h-4" />
                    Google Sheet Webhook URL
                  </div>
                  {sheetUrl === SYSTEM_SHEET_URL && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold border border-green-200">
                      Active: System Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Поставете тук <strong>Web App URL</strong> адреса от Google Apps Script deployment-а, за да активирате бутона "Запази в Таблица".
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all font-mono"
                  />
                  <button 
                    onClick={handleResetToDefaultUrl}
                    title="Върни фабричния линк"
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 border border-slate-200 transition-colors"
                  >
                    Default
                  </button>
                  <button 
                    onClick={handleSaveUrl}
                    className={`px-6 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      saveStatus === 'success' ? 'bg-emerald-500 text-white' : 
                      saveStatus === 'error' ? 'bg-rose-500 text-white' : 
                      'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    {saveStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : 
                     saveStatus === 'error' ? <AlertCircle className="w-4 h-4" /> : 
                     <Save className="w-4 h-4" />}
                    {saveStatus === 'success' ? 'Запазено' : saveStatus === 'error' ? 'Грешка' : 'Запази'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                     <Server className="w-4 h-4" /> AI Model
                   </div>
                   <div className="text-lg font-mono font-bold text-indigo-600">{SYSTEM_CONFIG.MODEL_NAME}</div>
                   <div className="text-xs text-slate-400 mt-1">API Version: {SYSTEM_CONFIG.API_VERSION}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-2">
                     <Thermometer className="w-4 h-4" /> Temperature
                   </div>
                   <div className="text-lg font-mono font-bold text-indigo-600">{SYSTEM_CONFIG.TEMPERATURE}</div>
                   <div className="text-xs text-slate-400 mt-1">Creativity / Randomness factor</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-600 uppercase">System Instructions (Prompt)</span>
                </div>
                <div className="flex-1 p-4 overflow-auto bg-[#1e1e1e]">
                  <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap leading-relaxed selection:bg-green-900">
                    {SYSTEM_PROMPT_TEXT}
                  </pre>
                </div>
              </div>

            </div>
          )}
        </div>

        <div className="p-6 border-t bg-white flex justify-end gap-3 z-10">
          <button onClick={onClose} className="px-6 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors">
            Затвори
          </button>
          {activeTab === 'products' && (
            <button onClick={handleSave} className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /> Запази промените
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
