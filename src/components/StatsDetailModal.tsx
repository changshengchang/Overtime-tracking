import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  Building,
  Users,
  Award,
  Clock,
  TrendingUp,
  AlertCircle,
  FileText
} from 'lucide-react';
import { AttendanceRecord, DepartmentStat, FilterConfig } from '../types';
import {
  exportFilteredDataToExcel,
  exportFilteredDataToCsv,
  exportDepartmentSummaryExcel
} from '../utils/exporter';

export type StatModalType =
  | 'filteredEmployees'
  | 'avgOvertime'
  | 'maxSingle'
  | 'maxDepartment';

interface StatsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType: StatModalType;
  records: AttendanceRecord[];
  filteredRecords: AttendanceRecord[];
  deptStats: DepartmentStat[];
  originalColumns: string[];
  filterConfig: FilterConfig;
  nameCol?: string;
  employeeIdCol?: string;
}

export const StatsDetailModal: React.FC<StatsDetailModalProps> = ({
  isOpen,
  onClose,
  modalType,
  records,
  filteredRecords,
  deptStats,
  originalColumns,
  filterConfig,
  nameCol,
  employeeIdCol,
}) => {
  if (!isOpen) return null;

  // 全所個人時數排行榜（依加班總時數由高至低完整排序，排除空白工號）
  const allRankedEmployees = useMemo(() => {
    return records
      .filter((r) => (r.employeeId || '').trim() !== '')
      .sort((a, b) => b.overtimeHours - a.overtimeHours);
  }, [records]);

  // 最高課室
  const topDept = deptStats.length > 0
    ? [...deptStats].sort((a, b) => b.totalOvertimeHours - a.totalOvertimeHours)[0]
    : null;

  // 最高個人 (由全所排行榜首位取得)
  const topEmployee = allRankedEmployees.length > 0 ? allRankedEmployees[0] : null;

  // 依加班時數降序排序清冊 (符合目前篩選條件)
  const sortedFilteredRecords = [...filteredRecords].sort(
    (a, b) => b.overtimeHours - a.overtimeHours
  );

  // 最高課室之人員清冊
  const topDeptRecords = topDept
    ? records.filter((r) => r.department === topDept.department && (r.employeeId || '').trim() !== '')
    : [];

  // 課室檢視切換 (全部課室統計 vs 最高課室同仁名冊)
  const [deptViewTab, setDeptViewTab] = useState<'summary' | 'topDeptEmployees'>('summary');

  // 下載最高課室同仁名單
  const handleDownloadTopDeptExcel = () => {
    if (!topDept) return;
    exportFilteredDataToExcel(
      topDeptRecords,
      originalColumns,
      filterConfig,
      nameCol,
      employeeIdCol,
      `三義鄉公所_${topDept.department}_加班時數清冊`
    );
  };

  // 下載各課室統計總表
  const handleDownloadDeptSummaryExcel = () => {
    exportDepartmentSummaryExcel(
      deptStats,
      records.length,
      filteredRecords.length,
      filterConfig
    );
  };

  // 依指示 1：下載個人時數排行榜，格式與「下載篩選清冊」100% 一樣
  const handleDownloadPersonalRankingExcel = () => {
    exportFilteredDataToExcel(
      allRankedEmployees,
      originalColumns,
      filterConfig,
      nameCol,
      employeeIdCol,
      '三義鄉公所_個人加班時數排行榜'
    );
  };

  const handleDownloadPersonalRankingCsv = () => {
    exportFilteredDataToCsv(
      allRankedEmployees,
      originalColumns,
      filterConfig,
      nameCol,
      employeeIdCol,
      '三義鄉公所_個人加班時數排行榜'
    );
  };

  // 下載目前篩選名冊 Excel
  const handleDownloadFilteredExcel = (customPrefix?: string) => {
    exportFilteredDataToExcel(
      sortedFilteredRecords,
      originalColumns,
      filterConfig,
      nameCol,
      employeeIdCol,
      customPrefix || '三義鄉公所勤休加班篩選清冊'
    );
  };

  // 下載目前篩選名冊 CSV
  const handleDownloadFilteredCsv = (customPrefix?: string) => {
    exportFilteredDataToCsv(
      sortedFilteredRecords,
      originalColumns,
      filterConfig,
      nameCol,
      employeeIdCol,
      customPrefix || '三義鄉公所勤休加班篩選清冊'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {modalType === 'filteredEmployees' && <Users className="w-5 h-5" />}
              {modalType === 'avgOvertime' && <Clock className="w-5 h-5" />}
              {modalType === 'maxSingle' && <Award className="w-5 h-5 text-rose-400" />}
              {modalType === 'maxDepartment' && <Building className="w-5 h-5 text-purple-400" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {modalType === 'filteredEmployees' && '符合條件人員清冊檢視與下載'}
                {modalType === 'avgOvertime' && '篩選對象平均加班時數統計與分佈'}
                {modalType === 'maxSingle' && '三義鄉公所個人加班時數排行與最高單人明細'}
                {modalType === 'maxDepartment' && '三義鄉公所各課室加班時數統計與最高單位分析'}
              </h3>
              <p className="text-xs text-slate-400">
                {modalType === 'filteredEmployees' && `共 ${filteredRecords.length} 筆符合條件，可即時檢視詳細資料並匯出`}
                {modalType === 'avgOvertime' && `平均加班時數與人員加班分佈彙整`}
                {modalType === 'maxSingle' && `依全所人員加班總時數由高至低完整排序`}
                {modalType === 'maxDepartment' && `全所各課室超時時數彙總及最高加班課室同仁名冊`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-header Actions & Summary Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {modalType === 'filteredEmployees' && (
              <>
                <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                  符合人次：{filteredRecords.length} 人
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-700">
                  篩選條件：{filterConfig.operator} {filterConfig.thresholdHours} 小時
                </span>
              </>
            )}

            {modalType === 'avgOvertime' && (
              <>
                <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                  平均時數：{filteredRecords.length > 0 ? (filteredRecords.reduce((s, r) => s + r.overtimeHours, 0) / filteredRecords.length).toFixed(1) : 0} 小時/月
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-700">
                  總累計時數：{filteredRecords.reduce((s, r) => s + r.overtimeHours, 0).toFixed(1)} 小時
                </span>
              </>
            )}

            {modalType === 'maxSingle' && topEmployee && (
              <>
                <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200">
                  最高加班：{topEmployee.overtimeHours} 小時
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 font-mono">
                  員工編號：{topEmployee.employeeId} ({topEmployee.title || '正式人員'} · {topEmployee.department})
                </span>
              </>
            )}

            {modalType === 'maxDepartment' && topDept && (
              <>
                <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-900 font-bold border border-purple-200">
                  最高加班單位：{topDept.department} (累計 {topDept.totalOvertimeHours.toFixed(1)} 小時)
                </span>
                <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white">
                  <button
                    type="button"
                    onClick={() => setDeptViewTab('summary')}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold cursor-pointer transition ${
                      deptViewTab === 'summary'
                        ? 'bg-purple-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    各課室統計表
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeptViewTab('topDeptEmployees')}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold cursor-pointer transition ${
                      deptViewTab === 'topDeptEmployees'
                        ? 'bg-purple-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {topDept.department}人員名冊 ({topDeptRecords.length}員)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Download Buttons Group */}
          <div className="flex items-center gap-2">
            {modalType === 'maxDepartment' ? (
              deptViewTab === 'summary' ? (
                <button
                  type="button"
                  onClick={handleDownloadDeptSummaryExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>下載各課室加班統計總表 (Excel)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadTopDeptExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>下載 {topDept?.department} 人員清冊 (Excel)</span>
                </button>
              )
            ) : modalType === 'maxSingle' ? (
              <>
                <button
                  type="button"
                  onClick={handleDownloadPersonalRankingExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition cursor-pointer shadow-2xs"
                  title="下載全所個人加班時數排行榜，格式與下載篩選清冊完全一致"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>下載個人時數排行榜 (Excel)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPersonalRankingCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下載 CSV</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleDownloadFilteredExcel('三義鄉公所勤休加班篩選清冊')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>下載清冊 (Excel)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadFilteredCsv('三義鄉公所勤休加班篩選清冊')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下載 CSV</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Scrollable Table Body */}
        <div className="flex-1 overflow-auto p-6">
          {modalType === 'maxDepartment' && deptViewTab === 'summary' ? (
            /* Department Summary Table */
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">排序</th>
                    <th className="py-3 px-4">課室/單位名稱</th>
                    <th className="py-3 px-4 text-center">編制人次</th>
                    <th className="py-3 px-4 text-center">超標列管人次</th>
                    <th className="py-3 px-4 text-center">超標比例</th>
                    <th className="py-3 px-4 text-right">累計加班總時數</th>
                    <th className="py-3 px-4 text-right">平均加班時數</th>
                    <th className="py-3 px-4 text-right">單人最高時數</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deptStats.map((stat, idx) => {
                    const isTop = idx === 0;
                    return (
                      <tr
                        key={stat.department}
                        className={`hover:bg-slate-50/80 transition ${
                          isTop ? 'bg-purple-50/40 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono">
                          {isTop ? (
                            <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 font-bold">
                              # 1 (最高)
                            </span>
                          ) : (
                            `# ${idx + 1}`
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">
                          {stat.department}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-600">
                          {stat.totalEmployees} 人
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              stat.filteredCount > 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {stat.filteredCount} 人
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-600">
                          {((stat.filteredCount / (stat.totalEmployees || 1)) * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                          {stat.totalOvertimeHours.toFixed(1)} 小時
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                          {stat.avgOvertimeHours.toFixed(1)} 小時
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-rose-700 font-semibold">
                          {stat.maxOvertimeHours.toFixed(1)} 小時
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Employee Records List Table */
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12">項次</th>
                    <th className="py-3 px-3.5">員工編號</th>
                    <th className="py-3 px-3.5">身分/類別</th>
                    <th className="py-3 px-3.5">服務課室</th>
                    <th className="py-3 px-3.5">月份</th>
                    {/* 依要求 1：附件一之欄位「時」及「分」呈現與保留 */}
                    <th className="py-3 px-3.5 text-center">時</th>
                    <th className="py-3 px-3.5 text-center">分</th>
                    <th className="py-3 px-3.5 text-right">加班總時數</th>
                    {/* 依要求 3：附件三之「勤休系統篩選註記」保留 */}
                    <th className="py-3 px-3.5 text-center">勤休系統篩選註記</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const displayRecords =
                      modalType === 'maxDepartment'
                        ? topDeptRecords
                        : modalType === 'maxSingle'
                        ? allRankedEmployees
                        : sortedFilteredRecords;

                    return displayRecords.length > 0 ? (
                      displayRecords.map((rec: AttendanceRecord, idx: number) => {
                        const isOver80 = rec.overtimeHours >= 80;
                        const isOver60 = rec.overtimeHours >= 60;
                        const isTopRank = idx === 0;

                        // 解析「時」與「分」
                        const rawH = rec.rawRow['時'] ?? rec.rawRow['總時'] ?? Math.floor(rec.overtimeHours);
                        const rawM = rec.rawRow['分'] ?? rec.rawRow['總分'] ?? Math.round((rec.overtimeHours - Math.floor(rec.overtimeHours)) * 60);

                        return (
                          <tr
                            key={rec.id || idx}
                            className={`hover:bg-slate-50 transition ${
                              isTopRank ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3.5 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {rec.employeeId || '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-700">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-medium">
                              {rec.title || '正式人員'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-700">
                            {rec.department}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 font-mono">
                            {rec.month}
                          </td>
                          {/* 依指示 1：附件一「時」與「分」呈現與保留 */}
                          <td className="py-2.5 px-3.5 text-center font-mono font-semibold text-slate-700">
                            {String(rawH)}
                          </td>
                          <td className="py-2.5 px-3.5 text-center font-mono font-semibold text-slate-700">
                            {String(rawM)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-bold text-sm">
                            <span
                              className={
                                isOver80
                                  ? 'text-rose-700 font-extrabold'
                                  : isOver60
                                  ? 'text-amber-700 font-extrabold'
                                  : 'text-slate-800'
                              }
                            >
                              {rec.overtimeHours} 小時
                            </span>
                          </td>
                          {/* 依指示 3：附件三「勤休系統篩選註記」 */}
                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                isOver80
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : isOver60
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {isOver80
                                ? '達80小時以上 (需專案行政院/縣府核准)'
                                : isOver60
                                ? '達60小時上限 (人事室列管督導)'
                                : '符合一般勤休規定'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        查無符合資料
                      </td>
                    </tr>
                  );
                })()}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>三義鄉公所勤休制度差勤管控專用 · 本地端安全解析</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-semibold border border-slate-300 transition cursor-pointer"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
