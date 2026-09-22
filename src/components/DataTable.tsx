import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Eye,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  AttendanceRecord,
  FilterConfig,
} from '../types';
import {
  exportFilteredDataToExcel,
  exportFilteredDataToCsv,
  shouldOmitColumnFromExport,
} from '../utils/exporter';

interface DataTableProps {
  records: AttendanceRecord[];
  filteredRecords: AttendanceRecord[];
  originalColumns: string[];
  filterConfig: FilterConfig;
  nameCol?: string;
  employeeIdCol?: string;
  selectedEmpId?: string;
  onClearSelectedEmpId?: () => void;
  highlightedCategory?: string;
  onClearHighlightedCategory?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  records,
  filteredRecords,
  originalColumns,
  filterConfig,
  nameCol,
  employeeIdCol,
  selectedEmpId,
  onClearSelectedEmpId,
  highlightedCategory = 'all',
  onClearHighlightedCategory,
}) => {
  const [sortColumn, setSortColumn] = useState<string>('overtimeHours');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AttendanceRecord | null>(null);

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortColumn === 'overtimeHours') {
        valA = a.overtimeHours;
        valB = b.overtimeHours;
      } else if (sortColumn === 'employeeId') {
        valA = a.employeeId;
        valB = b.employeeId;
      } else if (sortColumn === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortColumn === 'department') {
        valA = a.department;
        valB = b.department;
      } else if (sortColumn === 'month') {
        valA = a.month;
        valB = b.month;
      } else {
        // Raw row column
        valA = a.rawRow[sortColumn];
        valB = b.rawRow[sortColumn];
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA ?? '');
      const strB = String(valB ?? '');
      return sortDirection === 'asc'
        ? strA.localeCompare(strB, 'zh-Hant')
        : strB.localeCompare(strA, 'zh-Hant');
    });
  }, [filteredRecords, sortColumn, sortDirection]);

  // Pagination
  const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedRecords.length / pageSize);
  const paginatedRecords = useMemo(() => {
    if (pageSize === -1) return sortedRecords;
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleExcelExport = () => {
    exportFilteredDataToExcel(filteredRecords, originalColumns, filterConfig, nameCol, employeeIdCol);
  };

  const handleCsvExport = () => {
    exportFilteredDataToCsv(filteredRecords, originalColumns, filterConfig, nameCol, employeeIdCol);
  };

  // 依要求：排除姓名與附件二所載無須呈現之欄位
  const remainingColumns = useMemo(() => {
    return originalColumns.filter((col) => {
      const isCore = [
        '員工編號', '員工代號', '代號', '工號', '員工姓名', '姓名',
        '服務課室', '課室', '單位', '統計月份', '月份', '加班總時數',
        '總時分數', '加班時數'
      ].includes(col);
      if (isCore) return false;
      if (shouldOmitColumnFromExport(col, nameCol)) return false;
      return true;
    });
  }, [originalColumns, nameCol]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header and Download Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">
                符合篩選之員工差勤詳細清冊
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                共 {filteredRecords.length} 筆
              </span>
              {selectedEmpId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-100 text-xs font-mono shadow-2xs">
                  ★ 已亮起個人: {selectedEmpId}
                  <button
                    onClick={onClearSelectedEmpId}
                    className="ml-1 text-emerald-300 hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {highlightedCategory && highlightedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-800 text-amber-100 text-xs font-semibold shadow-2xs">
                  ★ 已亮起類別: {highlightedCategory}
                  <button
                    onClick={onClearHighlightedCategory}
                    className="ml-1 text-amber-300 hover:text-white cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              依規範提供符合條件人員差勤清冊，下載時依指示自動排除「員工姓名」保護個資。點選人員類別即時亮起顏色註記，其他類別完整保留不隱藏。
            </p>
          </div>

          {/* Download Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExcelExport}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
              title="將篩選出的所有員工差勤資料匯出為 Excel 檔案 (.xlsx，依規範自動刪除員工姓名欄位)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>下載篩選清冊 (Excel)</span>
            </button>

            <button
              type="button"
              onClick={handleCsvExport}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
              title="將篩選出的所有員工差勤資料匯出為 CSV 檔案 (.csv，依規範自動刪除員工姓名欄位)"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>下載篩選清冊 (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table content */}
      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
              <th className="py-3 px-3.5 text-center w-12 text-slate-400">#</th>

              {/* Primary Key Columns */}
              <th
                onClick={() => handleSort('employeeId')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition"
              >
                <div className="flex items-center gap-1">
                  <span>員工代號 / 編號</span>
                  {sortColumn === 'employeeId' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>

              {Boolean(nameCol) && (
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>員工姓名</span>
                    {sortColumn === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
              )}

              <th
                onClick={() => handleSort('department')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition"
              >
                <div className="flex items-center gap-1">
                  <span>服務課室</span>
                  {sortColumn === 'department' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort('month')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition"
              >
                <div className="flex items-center gap-1">
                  <span>統計月份</span>
                  {sortColumn === 'month' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort('overtimeHours')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition text-right bg-amber-50/60 font-bold"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>加班總時數 (h)</span>
                  {sortColumn === 'overtimeHours' ? (
                    sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-600" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>

              <th className="py-3 px-3.5 text-center">勤休法規列管狀態</th>

              {/* All remaining original columns (已排除附件二欄位與姓名) */}
              {remainingColumns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>{col}</span>
                      {sortColumn === col && (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                      )}
                    </div>
                  </th>
                ))}

              <th className="py-3 px-3.5 text-center w-20">檢視</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((record, idx) => {
                const rowIndex = (currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1;
                const isOver80 = record.overtimeHours >= 80;
                const isOver60 = record.overtimeHours >= 60;
                const isSelected = selectedEmpId === record.employeeId;
                const recordCat = (record.title || '').trim() || '正式人員';
                const isCategoryHighlighted =
                  highlightedCategory &&
                  highlightedCategory !== 'all' &&
                  recordCat === highlightedCategory;

                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected
                        ? 'bg-emerald-100/90 ring-2 ring-emerald-400 font-semibold border-l-4 border-l-emerald-600 shadow-2xs'
                        : isCategoryHighlighted
                        ? 'bg-amber-100/90 ring-1 ring-amber-400 font-medium border-l-4 border-l-amber-500 shadow-2xs'
                        : isOver80
                        ? 'bg-rose-50/30'
                        : isOver60
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3.5 text-center font-mono text-[11px]">
                      {isSelected || isCategoryHighlighted ? (
                        <span className="font-bold text-amber-900">★ {rowIndex}</span>
                      ) : (
                        <span className="text-slate-400">{rowIndex}</span>
                      )}
                    </td>

                    {/* Employee ID */}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {record.employeeId}
                      </span>
                    </td>

                    {/* Employee Name (僅在原始資料具備姓名欄時呈現) */}
                    {Boolean(nameCol) && (
                      <td className="py-2.5 px-3.5 font-medium text-slate-900 whitespace-nowrap">
                        {record.name || '-'}
                      </td>
                    )}

                    {/* Department */}
                    <td className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {record.department}
                      </span>
                    </td>

                    {/* Month */}
                    <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap font-mono">
                      {record.month}
                    </td>

                    {/* Overtime Hours */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          isOver80
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isOver60
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {record.overtimeHours.toFixed(1)} h
                      </span>
                    </td>

                    {/* Compliance Alert Tag */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      {isOver80 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          達80h極限 (專案核准)
                        </span>
                      ) : isOver60 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          達60h上限 (列管審核)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          一般勤休標準
                        </span>
                      )}
                    </td>

                    {/* Remaining Columns from Uploaded Row (已排除附件二與無效欄位) */}
                    {remainingColumns.map((col) => (
                      <td
                        key={col}
                        className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap max-w-[200px] truncate"
                        title={String(record.rawRow[col] ?? '')}
                      >
                        {String(record.rawRow[col] ?? '') || '-'}
                      </td>
                    ))}

                    {/* Detail Modal Action */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedRecordForDetail(record)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                        title="查看該列完整資料"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={Math.max(originalColumns.length + 5, 6)}
                  className="py-14 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto px-4">
                    {records.length === 0 ? (
                      <>
                        <div className="p-3 bg-slate-100 text-slate-400 rounded-full mb-3">
                          <FileSpreadsheet className="w-8 h-8 text-emerald-600/70" />
                        </div>
                        <p className="text-sm font-bold text-slate-700">
                          請上傳加班時數統計表
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          請由上方上傳三義鄉公所出勤或加班 Excel / CSV 檔案，系統將自動解析時數欄位、識別全數值文字並套用勤休篩選條件。
                        </p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-sm font-medium text-slate-600">
                          目前篩選條件下無符合之差勤紀錄
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          可調降加班時數門檻（例如設為 40 或 0 小時）或清除課室與月份篩選
                        </p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 sm:px-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>每頁顯示：</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-300 rounded px-2 py-1 bg-white text-xs text-slate-700 focus:outline-emerald-500"
          >
            <option value="10">10 筆</option>
            <option value="20">20 筆</option>
            <option value="50">50 筆</option>
            <option value="100">100 筆</option>
            <option value="-1">顯示全部 ({sortedRecords.length})</option>
          </select>
          <span className="text-slate-400 ml-2">
            共 {sortedRecords.length} 筆資料 (第 {currentPage} / {totalPages || 1} 頁)
          </span>
        </div>

        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              title="上一頁"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              title="下一頁"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs text-emerald-700 font-semibold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                  三義鄉公所差勤列管詳細記錄
                </span>
                <h4 className="text-base font-bold text-slate-800 mt-1">
                  {selectedRecordForDetail.name} ({selectedRecordForDetail.employeeId})
                </h4>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-400">服務課室：</span>
                  <span className="font-semibold text-slate-800 ml-1">
                    {selectedRecordForDetail.department}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">統計月份：</span>
                  <span className="font-semibold text-slate-800 ml-1">
                    {selectedRecordForDetail.month}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">加班總時數：</span>
                  <span className="font-bold text-amber-700 ml-1 font-mono text-sm">
                    {selectedRecordForDetail.overtimeHours} 小時
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">勤休列管級距：</span>
                  <span
                    className={`ml-1 font-semibold ${
                      selectedRecordForDetail.overtimeHours >= 80
                        ? 'text-rose-600'
                        : selectedRecordForDetail.overtimeHours >= 60
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {selectedRecordForDetail.overtimeHours >= 80
                      ? '達80小時極限'
                      : selectedRecordForDetail.overtimeHours >= 60
                      ? '達60小時上限'
                      : '正常時數'}
                  </span>
                </div>
              </div>

              <h5 className="font-bold text-slate-700 text-xs pt-2">
                原始上傳檔案該列全部資料：
              </h5>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {Object.entries(selectedRecordForDetail.rawRow).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-1.5 px-3 hover:bg-slate-50">
                    <span className="text-slate-500 font-medium">{key}</span>
                    <span className="text-slate-900 font-mono">{String(val ?? '') || '-'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
