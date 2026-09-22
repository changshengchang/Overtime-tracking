/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Header } from './components/Header';
import { FileUploadSection } from './components/FileUploadSection';
import { FilterControls } from './components/FilterControls';
import { EmployeeIdChipBar } from './components/EmployeeIdChipBar';
import { StatisticsOverview } from './components/StatisticsOverview';
import { DataTable } from './components/DataTable';
import { RegulationGuideModal } from './components/RegulationGuideModal';
import { AttendanceRecord, ColumnMapping, DepartmentStat, FilterConfig } from './types';
import { parseSpreadsheetBuffer, guessColumnMapping } from './utils/parser';
import { SANYI_SAMPLE_DATA } from './utils/sampleData';

export default function App() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [originalColumns, setOriginalColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    employeeIdCol: '',
    nameCol: '',
    departmentCol: '',
    monthCol: '',
    overtimeHoursCol: '',
  });
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawBuffer, setRawBuffer] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [highlightedCategory, setHighlightedCategory] = useState<string>('all');

  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    thresholdHours: 60,
    operator: '>=',
    thresholdMaxHours: 80,
    selectedMonth: 'all',
    selectedDepartment: 'all',
    keyword: '',
  });

  // Load Sanyi Township Office sample data
  const loadSampleDataset = () => {
    setIsLoading(true);
    try {
      const ws = XLSX.utils.json_to_sheet(SANYI_SAMPLE_DATA);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '三義鄉公所出勤總表');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const parsed = parseSpreadsheetBuffer(wbout, '三義鄉公所113年差勤與加班時數統計表(示範).xlsx');
      setRecords(parsed.records);
      setOriginalColumns(parsed.columns);
      setMapping(parsed.mapping);
      setFileName(parsed.fileName);
      setSheetNames(parsed.sheetNames);
      setSelectedSheet(parsed.sheetNames[0]);
      setRawBuffer(wbout);
      setSelectedEmpId('');
    } catch (err) {
      console.error('Failed to load sample data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Preload sample data on startup (disabled by default to display clean upload state)
  // Users can click "載入三義公所範例資料" whenever they want to preview sample data.
  // useEffect(() => {
  //   loadSampleDataset();
  // }, []);

  // Handle uploaded file
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      setRawBuffer(buffer);

      const parsed = parseSpreadsheetBuffer(buffer, file.name);
      setRecords(parsed.records);
      setOriginalColumns(parsed.columns);
      setMapping(parsed.mapping);
      setFileName(parsed.fileName);
      setSheetNames(parsed.sheetNames);
      setSelectedSheet(parsed.sheetNames[0] || '');
      setSelectedEmpId('');
    } catch (err: any) {
      console.error('Error parsing file:', err);
      alert('解析檔案失敗：' + (err?.message || '請確認檔案格式是否正確'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sheet switch
  const handleSelectSheet = (sheetName: string) => {
    if (!rawBuffer) return;
    setIsLoading(true);
    try {
      setSelectedSheet(sheetName);
      const parsed = parseSpreadsheetBuffer(rawBuffer, fileName || '差勤表.xlsx', sheetName, mapping);
      setRecords(parsed.records);
      setOriginalColumns(parsed.columns);
      setSelectedEmpId('');
    } catch (err: any) {
      console.error(err);
      alert('切換工作表失敗：' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle column mapping change
  const handleUpdateMapping = (newMapping: ColumnMapping) => {
    setMapping(newMapping);
    if (rawBuffer) {
      const parsed = parseSpreadsheetBuffer(rawBuffer, fileName || '差勤表.xlsx', selectedSheet, newMapping);
      setRecords(parsed.records);
    }
  };

  // Dynamic lists of available months and departments
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.month && r.month !== '未標明月份') set.add(r.month);
    });
    return Array.from(set).sort();
  }, [records]);

  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.department && r.department !== '未指定單位') set.add(r.department);
    });
    return Array.from(set).sort();
  }, [records]);

  // Main Filtering Logic
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 0. 依指示：若「員工編號」為空白（例如總計、小計彙總列），則該列刪除不必呈現
      if (!r.employeeId || r.employeeId.trim() === '') {
        return false;
      }

      // 依指示 2：各類人員（正式人員、約僱人員等）點選時以亮起顏色註記，其他類別全看得見不消失
      // 因此不進行強制遮蔽過濾，保持全體呈現並在 ChipBar 與 Table 進行高亮顯示

      // 2. Month filter
      if (filterConfig.selectedMonth !== 'all' && r.month !== filterConfig.selectedMonth) {
        return false;
      }

      // 3. Department filter
      if (
        filterConfig.selectedDepartment !== 'all' &&
        r.department !== filterConfig.selectedDepartment
      ) {
        return false;
      }

      // 4. Overtime Hours condition
      const hours = r.overtimeHours;
      const target = filterConfig.thresholdHours;
      let matchesHours = false;

      switch (filterConfig.operator) {
        case '>=':
          matchesHours = hours >= target;
          break;
        case '>':
          matchesHours = hours > target;
          break;
        case '<=':
          matchesHours = hours <= target;
          break;
        case '<':
          matchesHours = hours < target;
          break;
        case '==':
          matchesHours = Math.abs(hours - target) < 0.05;
          break;
        case 'between': {
          const max = filterConfig.thresholdMaxHours ?? 80;
          matchesHours = hours >= target && hours <= max;
          break;
        }
        default:
          matchesHours = hours >= target;
      }

      if (!matchesHours) return false;

      // 5. Keyword search in Employee ID or Name
      if (filterConfig.keyword.trim()) {
        const kw = filterConfig.keyword.trim().toLowerCase();
        const matchesId = r.employeeId.toLowerCase().includes(kw);
        const matchesName = r.name.toLowerCase().includes(kw);
        const matchesDept = r.department.toLowerCase().includes(kw);
        if (!matchesId && !matchesName && !matchesDept) {
          return false;
        }
      }

      return true;
    });
  }, [records, filterConfig, selectedEmpId]);

  // Department Statistics
  const deptStats = useMemo<DepartmentStat[]>(() => {
    const map = new Map<string, { totalEmployees: number; filteredCount: number; totalHours: number; maxHours: number }>();

    // Initialize all departments (僅統計具有有效員工代號/編號之人員，排除無代號之總計小計列)
    records.forEach((r) => {
      if (!r.employeeId || r.employeeId.trim() === '') return;
      const d = r.department || '其他';
      if (!map.has(d)) {
        map.set(d, { totalEmployees: 0, filteredCount: 0, totalHours: 0, maxHours: 0 });
      }
      const item = map.get(d)!;
      item.totalEmployees += 1;
      item.totalHours += r.overtimeHours;
      if (r.overtimeHours > item.maxHours) item.maxHours = r.overtimeHours;
    });

    // Count filtered records per department
    filteredRecords.forEach((r) => {
      const d = r.department || '其他';
      if (map.has(d)) {
        map.get(d)!.filteredCount += 1;
      }
    });

    const result: DepartmentStat[] = [];
    map.forEach((val, dept) => {
      result.push({
        department: dept,
        totalEmployees: val.totalEmployees,
        filteredCount: val.filteredCount,
        totalOvertimeHours: val.totalHours,
        avgOvertimeHours: val.totalEmployees > 0 ? val.totalHours / val.totalEmployees : 0,
        maxOvertimeHours: val.maxHours,
      });
    });

    // Sort by filtered count descending, then total hours
    return result.sort((a, b) => b.filteredCount - a.filteredCount || b.totalOvertimeHours - a.totalOvertimeHours);
  }, [records, filteredRecords]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Noto_Sans_TC',sans-serif]">
      {/* Top Header */}
      <Header
        fileName={fileName}
        totalRecordsCount={records.length}
        filteredRecordsCount={filteredRecords.length}
        thresholdHours={filterConfig.thresholdHours}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* File Upload & Template Section */}
        <FileUploadSection
          onFileUpload={handleFileUpload}
          onLoadSampleData={loadSampleDataset}
          isLoading={isLoading}
          fileName={fileName}
          totalRows={records.length}
          columns={originalColumns}
          mapping={mapping}
          onUpdateMapping={handleUpdateMapping}
          sheetNames={sheetNames}
          selectedSheet={selectedSheet}
          onSelectSheet={handleSelectSheet}
        />

        {/* Condition Filter Controls */}
        <FilterControls
          config={filterConfig}
          onChangeConfig={setFilterConfig}
          availableMonths={availableMonths}
          availableDepartments={availableDepartments}
          totalRecords={records.length}
          filteredRecordsCount={filteredRecords.length}
        />

        {/* Prominent Employee ID List & One-Click Copy */}
        <EmployeeIdChipBar
          filteredRecords={filteredRecords}
          onSelectEmployee={(empId) => setSelectedEmpId(empId)}
          selectedEmpId={selectedEmpId}
          highlightedCategory={highlightedCategory}
          onHighlightCategory={setHighlightedCategory}
        />

        {/* Visual & Summary Statistics */}
        <StatisticsOverview
          records={records}
          filteredRecords={filteredRecords}
          deptStats={deptStats}
          thresholdHours={filterConfig.thresholdHours}
          originalColumns={originalColumns}
          filterConfig={filterConfig}
          nameCol={mapping.nameCol}
          employeeIdCol={mapping.employeeIdCol}
        />

        {/* Data Table with Full Rows and Downloads */}
        <DataTable
          records={records}
          filteredRecords={filteredRecords}
          originalColumns={originalColumns}
          filterConfig={filterConfig}
          nameCol={mapping.nameCol}
          employeeIdCol={mapping.employeeIdCol}
          selectedEmpId={selectedEmpId}
          onClearSelectedEmpId={() => setSelectedEmpId('')}
          highlightedCategory={highlightedCategory}
          onClearHighlightedCategory={() => setHighlightedCategory('all')}
        />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-200">
              三義鄉公所勤休制度加班時數篩選系統
            </span>
            <span className="mx-2 text-slate-600">|</span>
            <span>差勤稽核與加班時數管制專用</span>
          </div>
          <div className="text-slate-500">
            遵循行政院及公務員服務法勤休新制規範 · 本地端安全解析不洩漏個資
          </div>
        </div>
      </footer>

      {/* Regulation & Help Modal */}
      <RegulationGuideModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
