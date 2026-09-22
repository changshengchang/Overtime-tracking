import React from 'react';
import { Filter, Sliders, Search, RotateCcw, AlertCircle, Clock } from 'lucide-react';
import { FilterConfig, FilterOperator } from '../types';

interface FilterControlsProps {
  config: FilterConfig;
  onChangeConfig: (newConfig: FilterConfig) => void;
  availableMonths: string[];
  availableDepartments: string[];
  totalRecords: number;
  filteredRecordsCount: number;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  config,
  onChangeConfig,
  availableMonths,
  availableDepartments,
  totalRecords,
  filteredRecordsCount,
}) => {
  const setPreset = (threshold: number, operator: FilterOperator = '>=') => {
    onChangeConfig({
      ...config,
      thresholdHours: threshold,
      operator,
    });
  };

  const handleOperatorChange = (op: FilterOperator) => {
    onChangeConfig({
      ...config,
      operator: op,
    });
  };

  const handleReset = () => {
    onChangeConfig({
      thresholdHours: 60,
      operator: '>=',
      thresholdMaxHours: 80,
      selectedMonth: 'all',
      selectedDepartment: 'all',
      keyword: '',
    });
  };

  const filterPercentage =
    totalRecords > 0 ? ((filteredRecordsCount / totalRecords) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              加班時數條件篩選核心
            </h3>
            <p className="text-xs text-slate-500">
              設定法規門檻（如 ≥ 60小時），即時篩選並鎖定公所超標列管同仁
            </p>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">常見門檻：</span>
          <button
            type="button"
            onClick={() => setPreset(60, '>=')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
              config.thresholdHours === 60 && config.operator === '>='
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
          >
            ≥ 60 小時 (法規上限)
          </button>
          <button
            type="button"
            onClick={() => setPreset(80, '>=')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
              config.thresholdHours === 80 && config.operator === '>='
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200'
            }`}
          >
            ≥ 80 小時 (專案極限)
          </button>
          <button
            type="button"
            onClick={() => setPreset(45, '>=')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
              config.thresholdHours === 45 && config.operator === '>='
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            ≥ 45 小時 (警戒預防)
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            title="重設所有篩選"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 mt-4">
        {/* Condition Operator & Hours */}
        <div className="lg:col-span-4 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
          <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              加班時數條件：
            </span>
            <span className="text-[11px] text-amber-700 font-normal">
              {config.operator === '>=' && '大於等於指定時數'}
              {config.operator === '>' && '大於指定時數'}
              {config.operator === '<=' && '小於等於指定時數'}
              {config.operator === '<' && '小於指定時數'}
              {config.operator === '==' && '等於指定時數'}
              {config.operator === 'between' && '介於兩時數之間'}
            </span>
          </label>

          <div className="flex items-center gap-2">
            <select
              value={config.operator}
              onChange={(e) => handleOperatorChange(e.target.value as FilterOperator)}
              className="border border-slate-300 rounded-md px-2 py-1.5 bg-white text-xs text-slate-800 font-semibold focus:outline-emerald-500 shadow-2xs"
            >
              <option value=">=">&gt;= (大於等於)</option>
              <option value=">">&gt; (大於)</option>
              <option value="<=">&lt;= (小於等於)</option>
              <option value="<">&lt; (小於)</option>
              <option value="==">== (剛好等於)</option>
              <option value="between">介於區間 (Between)</option>
            </select>

            <div className="relative flex-1 flex items-center">
              <input
                type="number"
                min="0"
                max="300"
                step="0.5"
                value={config.thresholdHours}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    thresholdHours: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full border border-slate-300 rounded-md px-3 py-1.5 bg-white text-xs font-bold text-slate-900 focus:outline-emerald-500 shadow-2xs text-right pr-10"
              />
              <span className="absolute right-2.5 text-xs text-slate-500 pointer-events-none">
                小時
              </span>
            </div>

            {config.operator === 'between' && (
              <>
                <span className="text-xs text-slate-400">至</span>
                <div className="relative flex-1 flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="300"
                    step="0.5"
                    value={config.thresholdMaxHours ?? 80}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        thresholdMaxHours: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 bg-white text-xs font-bold text-slate-900 focus:outline-emerald-500 shadow-2xs text-right pr-10"
                  />
                  <span className="absolute right-2.5 text-xs text-slate-500 pointer-events-none">
                    小時
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Month Selector */}
        <div className="lg:col-span-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            統計月份篩選：
          </label>
          <select
            value={config.selectedMonth}
            onChange={(e) =>
              onChangeConfig({
                ...config,
                selectedMonth: e.target.value,
              })
            }
            className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-xs text-slate-800 focus:outline-emerald-500 shadow-2xs"
          >
            <option value="all">全部月份 (跨月份總覽)</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Department Selector */}
        <div className="lg:col-span-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            服務課室/單位：
          </label>
          <select
            value={config.selectedDepartment}
            onChange={(e) =>
              onChangeConfig({
                ...config,
                selectedDepartment: e.target.value,
              })
            }
            className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-xs text-slate-800 focus:outline-emerald-500 shadow-2xs"
          >
            <option value="all">全公所所有課室</option>
            {availableDepartments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Search by ID / Name */}
        <div className="lg:col-span-2 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            快速搜尋人員：
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="輸入工號或姓名..."
              value={config.keyword}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  keyword: e.target.value,
                })
              }
              className="w-full border border-slate-300 rounded-md pl-7 pr-2.5 py-1.5 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-emerald-500 shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
          </div>
        </div>
      </div>

      {/* Real-time Result Count Bar */}
      <div className="mt-3.5 flex items-center justify-between flex-wrap gap-2 pt-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">篩選結果：</span>
          <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-xs">
            符合條件 {filteredRecordsCount} 筆
          </span>
          <span className="text-slate-400">/ 總計 {totalRecords} 筆</span>
          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium text-[11px]">
            超標率 {filterPercentage}%
          </span>
        </div>

        {config.thresholdHours >= 60 && config.operator === '>=' && (
          <div className="flex items-center gap-1.5 text-amber-700 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>
              已依公務員服務法設定60小時管制線，下表已即時標示超標人員
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
