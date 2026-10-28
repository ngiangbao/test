import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PROVIDER_PRESETS } from '../types/ai';
import {
  Settings,
  Key,
  Database,
  Trash2,
  Check,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const {
    providerId,
    setProviderId,
    providerConfigs,
    setProviderConfig,
    effort,
    setEffort,
    clearAnalyses
  } = useApp();

  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentPreset = PROVIDER_PRESETS.find(p => p.id === providerId) || PROVIDER_PRESETS[0];
  const activeConf = providerConfigs[providerId] || {
    baseUrl: currentPreset.baseUrl,
    model: currentPreset.defaultModel,
    apiKey: ''
  };

  const [localModel, setLocalModel] = useState(activeConf.model);
  const [localKey, setLocalKey] = useState(activeConf.apiKey);
  const [localBaseUrl, setLocalBaseUrl] = useState(activeConf.baseUrl);

  // When changing provider, sync local state
  const handleProviderChange = (id: string) => {
    setProviderId(id);
    const p = PROVIDER_PRESETS.find(pr => pr.id === id) || PROVIDER_PRESETS[0];
    const c = providerConfigs[id] || { baseUrl: p.baseUrl, model: p.defaultModel, apiKey: '' };
    setLocalModel(c.model);
    setLocalKey(c.apiKey);
    setLocalBaseUrl(c.baseUrl);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProviderConfig(providerId, {
      model: localModel,
      apiKey: localKey,
      baseUrl: localBaseUrl
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClear = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ bộ nhớ đệm phân tích đã lưu?')) {
      clearAnalyses();
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Settings className="h-5 w-5 text-[#163A5F] dark:text-[#82B7E8]" />
          <span>Cài đặt Hệ thống & Trí tuệ Nhân tạo (AI)</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Tùy chỉnh mô hình LLM, khóa API Gemini và các thông số suy luận
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE4ED] dark:border-[#2B3948]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Cấu hình Nhà cung cấp AI (LLM Provider)</span>
            </h3>
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-500 dark:text-indigo-400">
              Khuyên dùng: Google Gemini
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 font-medium mb-1">Nhà cung cấp AI</label>
              <select
                value={providerId}
                onChange={e => handleProviderChange(e.target.value)}
                className="w-full rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#151F2B] p-2.5 text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                {PROVIDER_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 font-medium mb-1">Mô hình (Model Name)</label>
              <input
                type="text"
                value={localModel}
                onChange={e => setLocalModel(e.target.value)}
                placeholder={currentPreset.defaultModel}
                className="w-full rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#151F2B] p-2.5 text-gray-800 dark:text-gray-200 font-mono focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-gray-400 font-medium flex items-center space-x-1">
                  <Key className="h-3.5 w-3.5" />
                  <span>API Key</span>
                </label>
                {providerId === 'gemini' && (
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-500 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Lấy khóa Gemini miễn phí tại Google AI Studio</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <input
                type="password"
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                placeholder="Nhập API Key của bạn (nếu có)..."
                className="w-full rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#151F2B] p-2.5 text-gray-800 dark:text-gray-200 font-mono focus:outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {currentPreset.keyHint || 'Khóa được lưu cục bộ trên trình duyệt của bạn.'}
              </p>
            </div>

            <div>
              <label className="block text-gray-400 font-medium mb-1">Mức độ suy luận (Reasoning Effort)</label>
              <select
                value={effort}
                onChange={e => setEffort(e.target.value)}
                className="w-full rounded-lg border border-[#DCE4ED] dark:border-[#2B3948] bg-gray-50 dark:bg-[#151F2B] p-2.5 text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                <option value="low">Nhanh (Thấp)</option>
                <option value="medium">Cân bằng (Trung bình)</option>
                <option value="high">Sâu sắc (Cao)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="submit"
            className="flex items-center space-x-2 rounded-lg bg-[#163A5F] px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-[#163A5F]/80 transition dark:bg-[#82B7E8] dark:text-[#102033]"
          >
            {savedSuccess ? <Check className="h-4 w-4" /> : null}
            <span>{savedSuccess ? 'Đã lưu cấu hình!' : 'Lưu cấu hình'}</span>
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-[#DCE4ED] dark:border-[#2B3948] bg-white dark:bg-[#182331] p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-2 pb-3 border-b border-[#DCE4ED] dark:border-[#2B3948]">
          <Database className="h-4 w-4" />
          <span>Bộ nhớ & Lưu trữ Cục bộ</span>
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-white">Xóa báo cáo AI và lịch sử đã lưu</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Khôi phục lại dữ liệu mặc định ban đầu nếu có sai lệch.
            </p>
          </div>
          <button
            onClick={handleClear}
            className="flex items-center space-x-1.5 rounded-lg border border-red-500/30 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-[#C8322B] dark:text-[#FF6B62] hover:bg-rose-100 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Xóa Cache</span>
          </button>
        </div>
      </div>
    </div>
  );
};
