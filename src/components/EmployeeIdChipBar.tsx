import React, { useState, useMemo } from 'react';
import { UserCheck, Copy, Check, Sparkles } from 'lucide-react';
import { AttendanceRecord } from '../types';

interface EmployeeIdChipBarProps {
  filteredRecords: AttendanceRecord[];
  selectedEmpId?: string;
  onSelectEmployee?: (empId: string) => void;
  highlightedCategory?: string;
  onHighlightCategory?: (category: string) => void;
}

export const EmployeeIdChipBar: React.FC<EmployeeIdChipBarProps> = ({
  filteredRecords,
  selectedEmpId,
  onSelectEmployee,
  highlightedCategory = 'all',
  onHighlightCategory,
}) => {
  const [copied, setCopied] = useState(false);

  // 去重員工，過濾掉空白員工編號
  const uniqueEmployees = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    filteredRecords.forEach((r) => {
      const empId = (r.employeeId || '').trim();
      if (empId !== '' && !map.has(empId)) {
        map.set(empId, r);
      }
    });
    return Array.from(map.values());
  }, [filteredRecords]);

  // 統計附件二各類人員（正式人員、約僱人員等）
  const categoriesStats = useMemo(() => {
    const counts: Record<string, number> = {};
    uniqueEmployees.forEach((emp) => {
      const cat = (emp.title || '').trim() || '正式人員';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [uniqueEmployees]);

  const categoryNames = Object.keys(categoriesStats);

  const uniqueIds = uniqueEmployees.map((e) => e.employeeId);

  const handleCopyAll = () => {
    if (uniqueIds.length === 0) return;
    const text = uniqueIds.join(', ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (uniqueEmployees.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-xs">
      {/* 頂部說明列與複製按鈕 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-lg">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                附件二：各類人員篩選與顏色註記 (共 {uniqueEmployees.length} 員)
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 font-mono">
                {uniqueEmployees.length} 人
              </span>
            </div>
            <p className="text-xs text-slate-400">
              點選下方人員類別即可於差勤清冊中顏色亮起標記，其他類別完整保留不隱藏
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
          title="複製全部符合員工編號（以逗號分隔）"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-200" />
              <span>已複製 {uniqueIds.length} 個員工編號！</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-emerald-200" />
              <span>一鍵複製員工編號名冊</span>
            </>
          )}
        </button>
      </div>

      {/* 依要求：僅保留篩選的類別按鈕 (正式人員、約僱人員等)，以簡潔版面呈現 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          類別顏色註記：
        </span>

        {/* 全部呈現/取消特定類別高亮 */}
        <button
          type="button"
          onClick={() => onHighlightCategory?.('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
            highlightedCategory === 'all' && !selectedEmpId
              ? 'bg-slate-700 text-white border-slate-500 shadow-xs'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
          }`}
        >
          全部人員 ({uniqueEmployees.length})
        </button>

        {/* 各類人員切換鈕 (正式人員、約僱人員..) */}
        {categoryNames.map((cat) => {
          const count = categoriesStats[cat] || 0;
          const isCategoryHighlighted = highlightedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onHighlightCategory?.(isCategoryHighlighted ? 'all' : cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                isCategoryHighlighted
                  ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300 shadow-md font-bold'
                  : 'bg-slate-800 text-amber-300 border-amber-800/50 hover:bg-slate-700/90'
              }`}
              title={`按下以亮起顏色註記所有「${cat}」，其他類別依然可見`}
            >
              <span className={`w-2 h-2 rounded-full ${isCategoryHighlighted ? 'bg-slate-900' : 'bg-amber-400'}`} />
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isCategoryHighlighted ? 'bg-slate-950/20 text-slate-950 font-mono' : 'bg-slate-700 text-amber-200 font-mono'
              }`}>
                {count}
              </span>
            </button>
          );
        })}

        {selectedEmpId && (
          <button
            type="button"
            onClick={() => onSelectEmployee?.('')}
            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer ml-auto"
          >
            清除個人註記
          </button>
        )}
      </div>
    </div>
  );
};
