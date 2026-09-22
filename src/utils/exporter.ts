import * as XLSX from 'xlsx';
import { AttendanceRecord, DepartmentStat, FilterConfig } from '../types';

/**
 * 判斷是否為員工姓名欄位 (依指示：下載篩選清冊不應有員工姓名，需排除刪除)
 */
export function isEmployeeNameColumn(col: string, specifiedNameCol?: string): boolean {
  if (specifiedNameCol && col === specifiedNameCol) return true;
  const n = col.trim().toLowerCase().replace(/[\s_\-（）\(\)]/g, '');
  const nameKeywords = [
    '員工姓名', '姓名', '人員姓名', '職員姓名', '同仁姓名',
    '同仁', '職員', 'name', 'empname', 'employee_name', 'employeename',
  ];
  return nameKeywords.some((k) => n === k || n.includes(k));
}

/**
 * 判斷是否為附件二所載之各項欄位 (依指示：附件二所載之各項欄位請刪除，無須於報表呈現)
 * 附件二包含：「未請領」、「已請休」、「已請領」、「行政獎勵」、「請領金額」及其各自之時、分子欄位
 * 
 * 重要規範 (依指示 2)：
 * "下載篩選清冊"內之"時"及"分"只要如附件二內之"總時分數"即可,其他"未請領"、"已請休"、"已請領"均刪除,不要呈現！
 */
export function isAttachment2Column(col: string): boolean {
  const n = col.trim().toLowerCase().replace(/[\s_\-（）\(\)]/g, '');

  // 附件二明確要求刪除之欄位項目 (含其底下之時、分)：
  if (n.includes('未請領')) return true;
  if (n.includes('已請休') || n.includes('請休')) return true;
  if (n.includes('已請領')) return true;
  if (n.includes('行政獎勵') || n.includes('獎勵')) return true;
  if (n.includes('請領金額') || n.includes('金額')) return true;

  // 雙層表頭可能產生的重複時分欄位 (如 時_2, 分_2, 時_3 等)，均為附件二之未請領/已請休/已請領時數，一律刪除
  if (/^(時|分)[_\d]+$/.test(n)) return true;

  // 雙層表頭展開產生的未命名輔助空欄位
  if (n.startsWith('未命名欄位') || n.startsWith('__empty')) return true;

  return false;
}

/**
 * 判斷該欄位是否應在報表與下載清冊中刪除
 * 注意：
 * 1. 附件三之「勤休系統篩選註記」欄位必須嚴格保留！
 * 2. 只有「總時分數」之「時」與「分」保留呈現，其他「未請領」、「已請休」、「已請領」均刪除不要呈現！
 */
export function shouldOmitColumnFromExport(col: string, specifiedNameCol?: string): boolean {
  // 依要求：附件三之「勤休系統篩選註記」欄位，請保留
  if (col === '勤休系統篩選註記') return false;

  // 刪除姓名欄位 (個資保護規範)
  if (isEmployeeNameColumn(col, specifiedNameCol)) return true;

  // 依指示 2：其他"未請領"、"已請休"、"已請領"均刪除,不要呈現
  if (isAttachment2Column(col)) return true;

  // 依要求："總時分數"之"時"及"分"欄位，請均要呈現及保留
  const clean = col.trim().replace(/[\s_\-（）\(\)]/g, '');
  if (clean === '時' || clean === '分' || clean === '總時' || clean === '總分' || clean.includes('總時分數')) {
    return false;
  }

  return false;
}

/**
 * 判斷員工編號/員工代號是否為空白 (依要求 1：如果員工編號為空白，則該列請刪除不必呈現)
 */
export function isEmployeeIdBlank(record: AttendanceRecord, employeeIdCol?: string): boolean {
  let val = '';
  if (employeeIdCol && record.rawRow && record.rawRow[employeeIdCol] !== undefined) {
    val = String(record.rawRow[employeeIdCol] ?? '').trim();
  }
  if (!val) {
    val = String(record.employeeId ?? '').trim();
  }
  return val === '';
}

export function exportFilteredDataToExcel(
  records: AttendanceRecord[],
  originalColumns: string[],
  filterConfig: FilterConfig,
  nameCol?: string,
  employeeIdCol?: string,
  fileNamePrefix: string = '三義鄉公所勤休加班篩選清冊'
) {
  // 依要求 1：下載之報表內，如果「員工編號」為空白，則該列請刪除，不必呈現
  const validRecords = records.filter((r) => !isEmployeeIdBlank(r, employeeIdCol));

  if (validRecords.length === 0) {
    alert('目前沒有符合篩選條件且具備有效員工編號的資料可供下載');
    return;
  }

  // 依要求 2 & 3：刪除附件二各項欄位與姓名，保留其他原始欄位，並保留「勤休系統篩選註記」
  const rowsToExport = validRecords.map((record) => {
    const row: Record<string, any> = {};

    // 依要求 2 & 3：刪除附件二各項欄位與姓名，保留其他原始欄位，並保留「勤休系統篩選註記」
    for (const col of originalColumns) {
      if (shouldOmitColumnFromExport(col, nameCol)) continue;
      row[col] = record.rawRow[col] ?? '';
    }

    // 依指示 2：確保具備來自「總時分數」之「時」與「分」
    if (row['時'] === undefined) {
      row['時'] = record.rawRow['時'] ?? Math.floor(record.overtimeHours);
    }
    if (row['分'] === undefined) {
      row['分'] = record.rawRow['分'] ?? Math.round((record.overtimeHours - Math.floor(record.overtimeHours)) * 60);
    }

    // 依要求 3：附件三之「勤休系統篩選註記」欄位，請保留
    row['勤休系統篩選註記'] =
      record.overtimeHours >= 80
        ? '達80小時以上 (需專案行政院/縣府核准)'
        : record.overtimeHours >= 60
        ? '達60小時上限 (人事室列管督導)'
        : '符合一般勤休規定';

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rowsToExport);

  // Auto-fit column widths
  const colWidths = Object.keys(rowsToExport[0] || {}).map((key) => {
    const maxLen = Math.max(
      key.length * 2,
      ...rowsToExport.map((r) => String(r[key] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '符合篩選員工名冊');

  // Timestamp
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  const operatorText =
    filterConfig.operator === '>='
      ? `大於等於${filterConfig.thresholdHours}小時`
      : filterConfig.operator === '>'
      ? `大於${filterConfig.thresholdHours}小時`
      : filterConfig.operator === '<='
      ? `小於等於${filterConfig.thresholdHours}小時`
      : filterConfig.operator === '<'
      ? `小於${filterConfig.thresholdHours}小時`
      : filterConfig.operator === 'between'
      ? `介於${filterConfig.thresholdHours}至${filterConfig.thresholdMaxHours}小時`
      : `等於${filterConfig.thresholdHours}小時`;

  const fileName = `${fileNamePrefix}_${operatorText}_共${validRecords.length}員_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportFilteredDataToCsv(
  records: AttendanceRecord[],
  originalColumns: string[],
  filterConfig: FilterConfig,
  nameCol?: string,
  employeeIdCol?: string,
  fileNamePrefix: string = '三義鄉公所勤休加班篩選清冊'
) {
  // 依要求 1：下載之報表內，如果「員工編號」為空白，則該列請刪除，不必呈現
  const validRecords = records.filter((r) => !isEmployeeIdBlank(r, employeeIdCol));

  if (validRecords.length === 0) {
    alert('目前沒有符合篩選條件且具備有效員工編號的資料可供下載');
    return;
  }

  // 依要求 2 & 3：刪除附件二各項欄位與姓名，保留其他原始欄位，並保留「勤休系統篩選註記」
  const rowsToExport = validRecords.map((record) => {
    const row: Record<string, any> = {};
    for (const col of originalColumns) {
      if (shouldOmitColumnFromExport(col, nameCol)) continue;
      row[col] = record.rawRow[col] ?? '';
    }

    // 依指示 2：確保具備來自「總時分數」之「時」與「分」
    if (row['時'] === undefined) {
      row['時'] = record.rawRow['時'] ?? Math.floor(record.overtimeHours);
    }
    if (row['分'] === undefined) {
      row['分'] = record.rawRow['分'] ?? Math.round((record.overtimeHours - Math.floor(record.overtimeHours)) * 60);
    }

    // 依要求 3：附件三之「勤休系統篩選註記」欄位，請保留
    row['勤休系統篩選註記'] =
      record.overtimeHours >= 80
        ? '達80小時以上 (需專案行政院/縣府核准)'
        : record.overtimeHours >= 60
        ? '達60小時上限 (人事室列管督導)'
        : '符合一般勤休規定';
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  // Add UTF-8 BOM so Excel opens Chinese text without garbling
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  a.href = url;
  a.download = `${fileNamePrefix}_篩選結果_共${validRecords.length}人_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDepartmentSummaryExcel(
  deptStats: DepartmentStat[],
  totalRecordsCount: number,
  filteredCount: number,
  filterConfig: FilterConfig
) {
  const summaryRows = deptStats.map((stat) => ({
    '服務課室/單位': stat.department,
    '課室總人次': stat.totalEmployees,
    '超標列管人次': stat.filteredCount,
    '超標列管比例 (%)': ((stat.filteredCount / (stat.totalEmployees || 1)) * 100).toFixed(1) + '%',
    '加班總累計時數': stat.totalOvertimeHours.toFixed(1),
    '平均加班時數': stat.avgOvertimeHours.toFixed(1),
    '該課室最高加班時數': stat.maxOvertimeHours.toFixed(1),
  }));

  const worksheet = XLSX.utils.json_to_sheet(summaryRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '各課室勤休加班統計彙總');

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  XLSX.writeFile(workbook, `三義鄉公所_各課室加班時數統計彙總表_${dateStr}.xlsx`);
}
