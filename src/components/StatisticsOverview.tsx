import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  Award,
  Building,
  ExternalLink,
  Download
} from 'lucide-react';
import { AttendanceRecord, DepartmentStat, FilterConfig } from '../types';
import { StatsDetailModal, StatModalType } from './StatsDetailModal';

interface StatisticsOverviewProps {
  records: AttendanceRecord[];
  filteredRecords: AttendanceRecord[];
  deptStats: DepartmentStat[];
  thresholdHours: number;
  originalColumns?: string[];
  filterConfig?: FilterConfig;
  nameCol?: string;
  employeeIdCol?: string;
}

export const StatisticsOverview: React.FC<StatisticsOverviewProps> = ({
  records,
  filteredRecords,
  deptStats,
  thresholdHours,
  originalColumns = [],
  filterConfig = {
    thresholdHours: 60,
    operator: '>=',
    selectedMonth: 'all',
    selectedDepartment: 'all',
    keyword: '',
  },
  nameCol,
  employeeIdCol,
}) => {
  const [activeModal, setActiveModal] = useState<StatModalType | null>(null);

  if (records.length === 0) return null;

  // Calculate statistics
  const totalEmployees = records.length;
  const filteredCount = filteredRecords.length;
  const filteredPercentage = ((filteredCount / totalEmployees) * 100).toFixed(1);

  // Overtime hours stats
  const totalHours = filteredRecords.reduce((sum, r) => sum + r.overtimeHours, 0);
  const avgHours = filteredCount > 0 ? (totalHours / filteredCount).toFixed(1) : '0';

  // Find max record
  const maxRecord = filteredRecords.reduce<AttendanceRecord | null>((max, curr) => {
    if (!max || curr.overtimeHours > max.overtimeHours) return curr;
    return max;
  }, null);

  // Hours distribution tiers
  const tier80Plus = filteredRecords.filter((r) => r.overtimeHours >= 80).length;
  const tier60to80 = filteredRecords.filter((r) => r.overtimeHours >= 60 && r.overtimeHours < 80).length;
  const tier45to60 = filteredRecords.filter((r) => r.overtimeHours >= 45 && r.overtimeHours < 60).length;
  const tierUnder45 = filteredRecords.filter((r) => r.overtimeHours < 45).length;

  const maxDeptHours = Math.max(...deptStats.map((d) => d.totalOvertimeHours), 1);

  return (
    <div className="space-y-4">
      {/* 4 Metric Cards (依指示 3：點擊各選項時，可直接檢視資料並供下載) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: 符合條件人數 */}
        <div
          onClick={() => setActiveModal('filteredEmployees')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-400 transition cursor-pointer group flex flex-col justify-between"
          title="點擊直接檢視符合條件人員清冊並下載"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-700 transition">
                符合條件人數
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition">
                  檢視與下載 ↗
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800 group-hover:text-emerald-800 transition">
                {filteredCount}
              </span>
              <span className="text-xs text-slate-500">/ 總計 {totalEmployees} 人次</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">符合比例</span>
              <span className="font-semibold text-emerald-700">{filteredPercentage}%</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(parseFloat(filteredPercentage), 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: 篩選對象平均加班 */}
        <div
          onClick={() => setActiveModal('avgOvertime')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-400 transition cursor-pointer group flex flex-col justify-between"
          title="點擊直接檢視平均時數統計分佈並下載"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-700 transition">
                篩選對象平均加班
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">
                  檢視與下載 ↗
                </span>
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-800 group-hover:text-blue-800 transition">
                {avgHours}
              </span>
              <span className="text-xs font-semibold text-slate-600">小時 / 月</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">總累計時數</span>
              <span className="font-semibold text-slate-700">{totalHours.toFixed(1)} 小時</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${Math.min((parseFloat(avgHours) / 80) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 3: 最高單人加班時數 */}
        <div
          onClick={() => setActiveModal('maxSingle')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-md hover:border-rose-400 transition cursor-pointer group flex flex-col justify-between"
          title="點擊直接檢視個人加班時數排行並下載"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-rose-700 transition">
                最高單人加班時數
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-rose-600 font-medium opacity-0 group-hover:opacity-100 transition">
                  檢視排行與下載 ↗
                </span>
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition">
                  <Award className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-rose-700">
                {maxRecord ? maxRecord.overtimeHours : 0}
              </span>
              <span className="text-xs font-semibold text-slate-600">小時</span>
            </div>
            <div className="mt-2 text-xs truncate text-slate-600">
              {maxRecord ? (
                <span title={`${maxRecord.department} ${maxRecord.name} (${maxRecord.employeeId})`}>
                  <span className="font-semibold text-slate-800">{maxRecord.title || '正式人員'}</span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="text-slate-500">{maxRecord.department}</span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="font-mono text-slate-500">{maxRecord.employeeId}</span>
                </span>
              ) : (
                '無符合資料'
              )}
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-rose-500 h-1.5 rounded-full"
              style={{ width: `${maxRecord ? Math.min((maxRecord.overtimeHours / 100) * 100, 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Metric 4: 涉及公所課室 (最高單位加班時數) */}
        <div
          onClick={() => setActiveModal('maxDepartment')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-md hover:border-purple-400 transition cursor-pointer group flex flex-col justify-between"
          title="依指示：點選最高單位加班時數，可直接檢視各課室資料並供下載"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-purple-700 transition">
                涉及公所課室 / 最高單位
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-purple-700 font-semibold opacity-0 group-hover:opacity-100 transition">
                  檢視與下載 ↗
                </span>
                <div className="p-2 bg-purple-50 text-purple-700 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
                  <Building className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-800 group-hover:text-purple-900 transition">
                {deptStats.filter((d) => d.filteredCount > 0).length}
              </span>
              <span className="text-xs text-slate-500">/ 全所 {deptStats.length} 個單位</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">最高單位 (最超時)</span>
              <span className="font-semibold text-purple-800 truncate max-w-[130px] group-hover:underline">
                {deptStats[0]?.department || '無'} (
                {deptStats[0]?.totalOvertimeHours.toFixed(0) || 0}h)
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full"
              style={{
                width: `${(deptStats.filter((d) => d.filteredCount > 0).length / (deptStats.length || 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Visual Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Department Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800">
                三義鄉公所各課室超標人數與加班總時數統計
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal('maxDepartment')}
              className="inline-flex items-center gap-1 text-[11px] text-purple-700 hover:text-purple-900 font-semibold px-2 py-1 rounded bg-purple-50 border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
            >
              <span>檢視最高單位與完整報表下載</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 mt-3">
            {deptStats.slice(0, 6).map((dept) => {
              const pct = (dept.totalOvertimeHours / maxDeptHours) * 100;
              return (
                <div key={dept.department} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-700 w-28 truncate" title={dept.department}>
                      {dept.department}
                    </span>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-[11px] text-slate-500 font-mono">
                        總累計 {dept.totalOvertimeHours.toFixed(1)}h
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 min-w-[70px] text-center">
                        列管 {dept.filteredCount} 人
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overtime Tier Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-800">
                  勤休管制法規分級分布
                </h4>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {/* Tier 80+ */}
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    ≥ 80 小時 (特別專案上限)
                  </div>
                  <div className="text-[11px] text-rose-700">需行政院或縣府專案核備</div>
                </div>
                <span className="text-base font-bold text-rose-700 font-mono">
                  {tier80Plus} 人
                </span>
              </div>

              {/* Tier 60-80 */}
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    60 ~ 79.9 小時 (常態上限列管)
                  </div>
                  <div className="text-[11px] text-amber-700">公務員服務法一般上限門檻</div>
                </div>
                <span className="text-base font-bold text-amber-800 font-mono">
                  {tier60to80} 人
                </span>
              </div>

              {/* Tier 45-60 */}
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    45 ~ 59.9 小時 (預警關注區)
                  </div>
                  <div className="text-[11px] text-blue-700">即將達標，需協調業務分工</div>
                </div>
                <span className="text-base font-bold text-blue-800 font-mono">
                  {tier45to60} 人
                </span>
              </div>

              {/* Tier < 45 */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    &lt; 45 小時 (常態作息區)
                  </div>
                  <div className="text-[11px] text-slate-500">健康工時正常範圍</div>
                </div>
                <span className="text-base font-bold text-slate-700 font-mono">
                  {tierUnder45} 人
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            * 本統計基於當前篩選之 {filteredCount} 筆記錄分析 · 點擊任一統計卡片可直接檢視詳細資料並下載清冊
          </div>
        </div>
      </div>

      {/* 依指示 3：點擊各選項時直接檢視資料並供下載之彈出視窗 */}
      {activeModal && (
        <StatsDetailModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          modalType={activeModal}
          records={records}
          filteredRecords={filteredRecords}
          deptStats={deptStats}
          originalColumns={originalColumns}
          filterConfig={filterConfig}
          nameCol={nameCol}
          employeeIdCol={employeeIdCol}
        />
      )}
    </div>
  );
};
