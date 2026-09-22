import React from 'react';
import { ShieldCheck, FileSpreadsheet, AlertTriangle, Building2, HelpCircle } from 'lucide-react';

interface HeaderProps {
  fileName: string | null;
  totalRecordsCount: number;
  filteredRecordsCount: number;
  thresholdHours: number;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fileName,
  totalRecordsCount,
  filteredRecordsCount,
  thresholdHours,
  onOpenHelp,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title and Identity */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 bg-emerald-700/80 text-emerald-100 rounded-xl shadow-inner border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                  苗栗縣三義鄉公所
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  差勤人事列管專用
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                三義鄉公所勤休制度加班時數篩選系統
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                依據公務員服務法及行政院所屬機關勤休召集要點，精準篩選單月超時列管同仁名冊與導出審查清冊
              </p>
            </div>
          </div>

          {/* Quick Status / Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {fileName ? (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[180px] font-medium" title={fileName}>
                  {fileName}
                </span>
                <span className="text-slate-400">
                  ({totalRecordsCount} 筆)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-700/50 rounded-lg px-3 py-1.5 text-xs text-emerald-300 animate-pulse">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>請上傳加班時數統計表</span>
              </div>
            )}

            <button
              onClick={onOpenHelp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
              title="法規說明與操作指引"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>勤休法規須知</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
