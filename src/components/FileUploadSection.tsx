import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Download, RefreshCw, CheckCircle2, SlidersHorizontal, Sparkles } from 'lucide-react';
import { ColumnMapping } from '../types';
import { downloadSampleExcelTemplate, downloadSampleCsvTemplate } from '../utils/sampleData';

interface FileUploadSectionProps {
  onFileUpload: (file: File) => void;
  onLoadSampleData: () => void;
  isLoading: boolean;
  fileName: string | null;
  totalRows: number;
  columns: string[];
  mapping: ColumnMapping;
  onUpdateMapping: (mapping: ColumnMapping) => void;
  sheetNames: string[];
  selectedSheet: string;
  onSelectSheet: (sheet: string) => void;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onFileUpload,
  onLoadSampleData,
  isLoading,
  fileName,
  totalRows,
  columns,
  mapping,
  onUpdateMapping,
  sheetNames,
  selectedSheet,
  onSelectSheet,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showMappingConfig, setShowMappingConfig] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      alert('請上傳 Excel (.xlsx, .xls) 或 CSV (.csv) 格式的檔案！');
      return;
    }
    onFileUpload(file);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 transition-all">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-600" />
            上傳差勤加班檔案 (Excel / CSV)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            支援三義鄉公所各課室出勤統計表、Web差勤系統匯出檔、差勤刷卡累計表等試算表格式
          </p>
        </div>

        {/* Action buttons: Demo data & Template downloads */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onLoadSampleData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            title="一鍵載入三義鄉公所真實情境模擬出勤資料測試系統"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>載入三義公所範例資料</span>
          </button>

          <div className="relative inline-flex group">
            <button
              type="button"
              onClick={downloadSampleExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
              title="下載標準Excel格式範本"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>下載 Excel 範本</span>
            </button>
          </div>

          <button
            type="button"
            onClick={downloadSampleCsvTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
            title="下載標準CSV格式範本"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>下載 CSV 範本</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="hidden"
          id="spreadsheet-file-input"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50'
              : fileName
              ? 'border-slate-300 hover:border-emerald-400 bg-slate-50/60'
              : 'border-slate-300 hover:border-emerald-500 bg-slate-50/40 hover:bg-slate-50'
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
              <p className="text-sm font-medium text-slate-700">正在解析試算表檔案中...</p>
            </div>
          ) : fileName ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">{fileName}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      已載入 {totalRows} 筆差勤資料
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    拖曳新檔案至此處或點擊即可更換檔案
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {sheetNames.length > 1 && (
                  <div className="flex items-center gap-1 text-xs" onClick={(e) => e.stopPropagation()}>
                    <span className="text-slate-500">工作表：</span>
                    <select
                      value={selectedSheet}
                      onChange={(e) => onSelectSheet(e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1 bg-white text-xs text-slate-700 focus:outline-emerald-500"
                    >
                      {sheetNames.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMappingConfig(!showMappingConfig);
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition"
                  title="檢視與自訂欄位對應"
                >
                  <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                  <span>欄位對應設定</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 px-4">
              <div className="p-3.5 bg-emerald-100/80 text-emerald-700 rounded-full mb-3 shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-slate-800 tracking-tight">
                請上傳加班時數統計表
              </p>
              <p className="text-xs text-slate-500 mt-1">
                點擊此處瀏覽，或將 Excel (.xlsx, .xls) / CSV 檔案拖曳至此處
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-100/80 px-3 py-1 rounded-full">
                <span>自動偵測表頭與時數欄位</span>
                <span>•</span>
                <span>時數欄位內看似數字之文字均自動轉換統計</span>
                <span>•</span>
                <span>單月 ≥60h 勤休門檻篩選</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Column Mapping Config Panel (Collapsible or visible if user opens) */}
      {fileName && showMappingConfig && (
        <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800">
                智慧欄位對應設定 (若系統自動判斷有異，可於此處手動指定來源欄位)
              </h3>
            </div>
            <button
              onClick={() => setShowMappingConfig(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              收合設定
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                員工編號欄位 <span className="text-red-500">*</span>
              </label>
              <select
                value={mapping.employeeIdCol}
                onChange={(e) => onUpdateMapping({ ...mapping, employeeIdCol: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-700 focus:outline-emerald-500"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                員工姓名欄位
              </label>
              <select
                value={mapping.nameCol}
                onChange={(e) => onUpdateMapping({ ...mapping, nameCol: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-700 focus:outline-emerald-500"
              >
                <option value="">(無)</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                服務課室/單位欄位
              </label>
              <select
                value={mapping.departmentCol}
                onChange={(e) => onUpdateMapping({ ...mapping, departmentCol: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-700 focus:outline-emerald-500"
              >
                <option value="">(無)</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                加班總時數欄位 <span className="text-red-500">*</span>
              </label>
              <select
                value={mapping.overtimeHoursCol}
                onChange={(e) => onUpdateMapping({ ...mapping, overtimeHoursCol: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-700 focus:outline-emerald-500 font-medium text-emerald-800"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                統計月份欄位
              </label>
              <select
                value={mapping.monthCol}
                onChange={(e) => onUpdateMapping({ ...mapping, monthCol: e.target.value })}
                className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-700 focus:outline-emerald-500"
              >
                <option value="">(無)</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
