import * as XLSX from 'xlsx';
import { AttendanceRecord, ColumnMapping } from '../types';

export interface ParseResult {
  records: AttendanceRecord[];
  columns: string[];
  mapping: ColumnMapping;
  fileName: string;
  sheetNames: string[];
  totalRows: number;
}

/**
 * 將任何看似數字的文字或數值，一律嚴謹且包容地解析為數字 (小時數)
 * 涵蓋全形數字、時間格式 (HH:MM)、中文時分單位、千分位、帶文字描述之數字等
 */
export function parseAnyNumericText(raw: any): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') {
    return isNaN(raw) || !isFinite(raw) ? 0 : raw;
  }

  let str = String(raw).trim();
  if (!str) return 0;

  // 1. 全形字元轉半形字元
  // ０-９ -> 0-9
  str = str.replace(/[\uFF10-\uFF19]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  str = str.replace(/[\uFF0E\u3002]/g, '.'); // 全形小數點與句點
  str = str.replace(/[\uFF1A]/g, ':'); // 全形冒號
  str = str.replace(/[\uFF0C]/g, ','); // 全形逗號
  str = str.replace(/[\uFF0B]/g, '+');
  str = str.replace(/[\uFF0D\u2010-\u2015\u2500]/g, '-');
  str = str.replace(/[\u00A0\u3000\s]+/g, ' '); // 替換全形空格/不換行空格為半形空格
  str = str.trim();

  // 2. 去除 Excel 公式引號或字串封裝：例如 ="60"、"60"、'60'
  if (str.startsWith('=')) {
    str = str.substring(1).trim();
  }
  str = str.replace(/^["']+|["']+$/g, '');

  // 3. 處理「時:分」或「時:分:秒」格式 (例如 60:30 表示 60.5 小時；60:00 表示 60 小時)
  const timeColonMatch = str.match(/^([+-]?\d+)\s*:\s*(\d+)(?:\s*:\s*\d+)?$/);
  if (timeColonMatch) {
    const hours = parseFloat(timeColonMatch[1]);
    const minutes = parseFloat(timeColonMatch[2]);
    const sign = hours < 0 ? -1 : 1;
    const result = hours + sign * (minutes / 60);
    return isNaN(result) ? 0 : Math.round(result * 100) / 100;
  }

  // 4. 處理中文「X小時Y分」或「X時Y分」或「X小時」或「Y分鐘」
  const chineseTimeMatch = str.match(/([+-]?\d+(?:\.\d+)?)\s*(?:小時|個小時|小時整|時)\s*(?:(\d+(?:\.\d+)?)\s*(?:分鐘|分))?/);
  if (chineseTimeMatch) {
    const hours = parseFloat(chineseTimeMatch[1]);
    const minutes = chineseTimeMatch[2] ? parseFloat(chineseTimeMatch[2]) : 0;
    const result = (isNaN(hours) ? 0 : hours) + (isNaN(minutes) ? 0 : minutes / 60);
    return isNaN(result) ? 0 : Math.round(result * 100) / 100;
  }

  const chineseMinutesOnlyMatch = str.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:分鐘|分)$/);
  if (chineseMinutesOnlyMatch) {
    const minutes = parseFloat(chineseMinutesOnlyMatch[1]);
    const result = isNaN(minutes) ? 0 : minutes / 60;
    return Math.round(result * 100) / 100;
  }

  // 5. 處理千分位逗號或逗點小數 (例如 "1,234.5" 或 "60,5")
  let normalized = str;
  if (/^\d+,\d{1,2}$/.test(normalized)) {
    normalized = normalized.replace(',', '.');
  } else {
    normalized = normalized.replace(/,/g, '');
  }

  // 6. 提取字串中出現的浮點數或整數 (例如 "60 小時", "專案60", "共計60.0h", "(60)")
  const numMatch = normalized.match(/[+-]?\d+(?:\.\d+)?/);
  if (numMatch) {
    const parsed = parseFloat(numMatch[0]);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }

  // 7. 中文大寫/小寫數字輔助轉換 (例如「六十」、「零」)
  const chineseNumberMap: Record<string, number> = {
    '零': 0, '一': 1, '二': 2, '兩': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '百': 100,
  };
  if (/^[零一二兩三四五六七八九十百]+$/.test(str)) {
    let total = 0;
    let temp = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const val = chineseNumberMap[char];
      if (val !== undefined) {
        if (val === 10) {
          total += (temp === 0 ? 1 : temp) * 10;
          temp = 0;
        } else if (val === 100) {
          total += (temp === 0 ? 1 : temp) * 100;
          temp = 0;
        } else {
          temp = val;
        }
      }
    }
    total += temp;
    return total;
  }

  return 0;
}

export function guessColumnMapping(columns: string[]): ColumnMapping {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[\s_\-（）\(\)]/g, '');

  let employeeIdCol = '';
  let nameCol = '';
  let departmentCol = '';
  let monthCol = '';
  let overtimeHoursCol = '';
  let titleCol: string | undefined = undefined;
  let notesCol: string | undefined = undefined;

  // 1. Employee ID (優先匹配「員工代號」、「員工編號」等公務差勤欄位)
  const idKeywords = [
    '員工代號', '員工編號', '代號', '工號', '人員代碼', '人員編號',
    '員工代碼', '編號', '代碼', 'employeeid', 'empid', 'id'
  ];
  for (const col of columns) {
    const n = norm(col);
    if (idKeywords.some(k => n === k || n.includes(k))) {
      employeeIdCol = col;
      break;
    }
  }
  if (!employeeIdCol && columns.length > 0) employeeIdCol = columns[0];

  // 2. Name (若無符合姓名之欄位，則維持空白，不可誤將職稱等欄位當作姓名)
  const nameKeywords = [
    '員工姓名', '姓名', '人員姓名', '職員姓名', '同仁姓名', '同仁', '職員',
    'name', 'empname', 'employee_name', 'employeename'
  ];
  for (const col of columns) {
    const n = norm(col);
    if (nameKeywords.some(k => n === k || n.includes(k))) {
      nameCol = col;
      break;
    }
  }

  // 3. Department
  const deptKeywords = ['服務課室', '課室', '單位', '服務單位', '部門', '科室', '組室', '局處', '所屬單位', 'department', 'dept'];
  for (const col of columns) {
    const n = norm(col);
    if (deptKeywords.some(k => n === k || n.includes(k))) {
      departmentCol = col;
      break;
    }
  }

  // 4. Overtime Hours (依使用者要求：優先自動以上傳檔案之「總時分數」為欄位對應設定)
  // Step 4.1: 最高優先級 - 嚴格匹配「總時分數」
  for (const col of columns) {
    const n = norm(col);
    if (n === '總時分數' || n.includes('總時分數') || n.includes('時分數')) {
      overtimeHoursCol = col;
      break;
    }
  }

  // Step 4.2: 次優先級 - 常見加班時數關鍵字
  if (!overtimeHoursCol) {
    const otPriorityKeywords = [
      '加班總時數', '總加班時數', '本月加班時數', '加班時數', '累計加班時數',
      '總時數', '合計時數', '時數合計', '時數總計', '加班數', '加班小時',
      '超時時數', '核定加班時數', '申請加班時數', '一般加班時數', '專案加班時數',
      'overtimehours', 'overtime', 'totalhours', 'othours', 'ot_hours',
    ];
    for (const col of columns) {
      const n = norm(col);
      if (otPriorityKeywords.some(k => n === k || n.includes(k))) {
        overtimeHoursCol = col;
        break;
      }
    }
  }

  // Step 4.3: 包含「加班」或「時數」之欄位模糊比對
  if (!overtimeHoursCol) {
    for (const col of columns) {
      const n = norm(col);
      if (n.includes('加班') && !n.includes('費') && !n.includes('日期')) {
        overtimeHoursCol = col;
        break;
      }
    }
  }
  if (!overtimeHoursCol) {
    for (const col of columns) {
      const n = norm(col);
      if (n.includes('時數') || n.includes('小時')) {
        overtimeHoursCol = col;
        break;
      }
    }
  }

  // 5. Month
  const monthKeywords = ['統計月份', '月份', '年月', '差勤月份', '勤休月份', '計薪年月', '查詢月份', '統計期間', 'month', 'date'];
  for (const col of columns) {
    const n = norm(col);
    if (monthKeywords.some(k => n === k || n.includes(k))) {
      monthCol = col;
      break;
    }
  }

  // 6. Title / Personnel Category (職稱 / 人員別 / 身分別，如：正式人員、約僱人員)
  const titleKeywords = [
    '人員別', '人員類別', '身分別', '身分', '類別', '聘僱別', '職稱', '職等', '官職等', '職務', 'title', 'position'
  ];
  for (const col of columns) {
    const n = norm(col);
    if (titleKeywords.some(k => n === k || n.includes(k))) {
      titleCol = col;
      break;
    }
  }

  // 7. Notes
  const notesKeywords = ['備註', '備註說明', '是否專案核准', '核准說明', '事由', '說明', 'remarks', 'notes'];
  for (const col of columns) {
    const n = norm(col);
    if (notesKeywords.some(k => n === k || n.includes(k))) {
      notesCol = col;
      break;
    }
  }

  return {
    employeeIdCol: employeeIdCol || columns[0] || '員工編號',
    nameCol: nameCol || (columns.length > 1 ? columns[1] : ''),
    departmentCol: departmentCol || (columns.length > 2 ? columns[2] : ''),
    monthCol: monthCol || '',
    overtimeHoursCol: overtimeHoursCol || (columns.length > 3 ? columns[3] : ''),
    titleCol,
    notesCol,
  };
}

/**
 * 智慧偵測工作表中最有可能為「欄位表頭 (Header)」的列索引
 * 避免因公務報表前數列是標題、製表日期或說明而導致欄位名稱錯置
 */
function findHeaderRowIndex(rows: any[][]): number {
  if (rows.length === 0) return 0;

  const headerKeywords = [
    '總時分數', '時分數', '編號', '工號', '員工', '姓名', '課室', '單位', '部門',
    '時數', '加班', '月份', '職稱', '備註', '合計', '申請',
    'id', 'name', 'dept', 'hours', 'overtime',
  ];

  let bestIndex = 0;
  let maxScore = -1;

  const scanLimit = Math.min(rows.length, 15);

  for (let i = 0; i < scanLimit; i++) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    let score = 0;
    const stringCells = row.map(cell => String(cell ?? '').trim()).filter(Boolean);

    if (stringCells.length === 0) continue;

    for (const cell of stringCells) {
      const lower = cell.toLowerCase();
      for (const kw of headerKeywords) {
        if (lower.includes(kw)) {
          score += 10;
          if (lower.includes('加班') || lower.includes('時數')) score += 10;
          if (lower.includes('員工編號') || lower.includes('工號')) score += 10;
          break;
        }
      }
    }

    // 獎勵具有多個非空標題文字的列 (一般資料表表頭至少有 3 個以上欄位)
    if (stringCells.length >= 3) {
      score += stringCells.length * 2;
    }

    if (score > maxScore && score >= 15) {
      maxScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function parseSpreadsheetBuffer(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string,
  selectedSheetName?: string,
  customMapping?: Partial<ColumnMapping>
): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const sheetToUse = selectedSheetName && sheetNames.includes(selectedSheetName) ? selectedSheetName : sheetNames[0];
  const worksheet = workbook.Sheets[sheetToUse];

  if (!worksheet) {
    throw new Error('未能在檔案中讀取到工作表資料');
  }

  // 取得完整二維陣列以便智慧偵測 Header Row
  const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawMatrix || rawMatrix.length === 0) {
    return {
      records: [],
      columns: [],
      mapping: {
        employeeIdCol: '',
        nameCol: '',
        departmentCol: '',
        monthCol: '',
        overtimeHoursCol: '',
      },
      fileName,
      sheetNames,
      totalRows: 0,
    };
  }

  const headerRowIndex = findHeaderRowIndex(rawMatrix);
  const headerRow = rawMatrix[headerRowIndex] || [];
  
  // 檢查是否具有次級表頭 (例如附件一截圖：第一層為「總時分數」，第二層為「時」與「分」)
  const nextRow = rawMatrix[headerRowIndex + 1] || [];
  const nextRowTexts = Array.isArray(nextRow) ? nextRow.map(c => String(c ?? '').trim()) : [];
  const isSubheaderRow = nextRowTexts.some(t => t === '時' || t === '分');

  // 清洗並建立不重複的 columns 清單
  const columns: string[] = [];
  const colCountMap = new Map<string, number>();

  const maxCols = Math.max(headerRow.length, isSubheaderRow ? nextRow.length : 0);

  let currentParent = '';
  for (let c = 0; c < maxCols; c++) {
    const parentName = String(headerRow[c] ?? '').trim();
    if (parentName) {
      currentParent = parentName;
    }
    const subName = isSubheaderRow ? String(nextRow[c] ?? '').trim() : '';

    let colName = '';
    if (subName === '時' || subName === '分') {
      // 依指示 2："下載篩選清冊"內之"時"及"分"只要如附件二內之"總時分數"即可,其他"未請領"、"已請休"、"已請領"均刪除,不要呈現
      if (currentParent.includes('未請領')) {
        colName = `未請領_${subName}`;
      } else if (currentParent.includes('已請休') || currentParent.includes('請休')) {
        colName = `已請休_${subName}`;
      } else if (currentParent.includes('已請領')) {
        colName = `已請領_${subName}`;
      } else {
        // 屬於「總時分數」之時與分，命名為標準的 "時" 與 "分"
        colName = subName;
      }
    } else if (subName && !parentName) {
      colName = subName;
    } else if (parentName && subName && parentName !== subName) {
      colName = `${parentName}_${subName}`;
    } else if (parentName) {
      colName = parentName;
    } else if (subName) {
      colName = subName;
    } else {
      colName = `未命名欄位_${c + 1}`;
    }

    const count = (colCountMap.get(colName) || 0) + 1;
    colCountMap.set(colName, count);
    if (count > 1) {
      colName = `${colName}_${count}`;
    }
    columns.push(colName);
  }

  // 將 headerRow (及 subHeader) 之後的列轉為物件資料列
  const startRowIndex = isSubheaderRow ? headerRowIndex + 2 : headerRowIndex + 1;
  const rawRows: Record<string, any>[] = [];
  for (let r = startRowIndex; r < rawMatrix.length; r++) {
    const rowCells = rawMatrix[r];
    if (!Array.isArray(rowCells)) continue;

    // 檢查是否整列為空，忽略空列
    const hasValue = rowCells.some(cell => String(cell ?? '').trim() !== '');
    if (!hasValue) continue;

    const rowObj: Record<string, any> = {};
    for (let c = 0; c < columns.length; c++) {
      rowObj[columns[c]] = rowCells[c] ?? '';
    }
    rawRows.push(rowObj);
  }

  if (rawRows.length === 0) {
    return {
      records: [],
      columns,
      mapping: {
        employeeIdCol: '',
        nameCol: '',
        departmentCol: '',
        monthCol: '',
        overtimeHoursCol: '',
      },
      fileName,
      sheetNames,
      totalRows: 0,
    };
  }

  const autoMapping = guessColumnMapping(columns);
  const mapping: ColumnMapping = {
    ...autoMapping,
    ...(customMapping || {}),
  };

  const records: AttendanceRecord[] = rawRows.map((row, index) => {
    const empId = String(row[mapping.employeeIdCol] ?? '').trim();
    const name = String(row[mapping.nameCol] ?? '').trim();
    const dept = mapping.departmentCol ? String(row[mapping.departmentCol] ?? '').trim() : '未指定單位';
    const month = mapping.monthCol ? String(row[mapping.monthCol] ?? '').trim() : '未標明月份';
    
    // 依據使用者指示：時數欄位如有看似數字之文字，一律當成數字來篩選
    let otHours = parseAnyNumericText(row[mapping.overtimeHoursCol]);
    // 依指示 1：若表格具有獨立「時」與「分」欄位，且主欄位為0或即為「時」，精確計算時數
    if (row['時'] !== undefined) {
      const h = parseAnyNumericText(row['時']);
      const m = row['分'] !== undefined ? parseAnyNumericText(row['分']) : 0;
      const combined = h + (m > 0 ? m / 60 : 0);
      if (combined > 0 || otHours === 0) {
        otHours = Math.round(combined * 100) / 100;
      }
    }

    // 同步嘗試解析常見子項目時數 (若試算表有細分平日、例假、補休、加班費等)
    let weekdayOt: number | undefined = undefined;
    let holidayOt: number | undefined = undefined;
    let compHours: number | undefined = undefined;
    let paidHours: number | undefined = undefined;

    for (const k of Object.keys(row)) {
      const val = parseAnyNumericText(row[k]);
      if (val > 0) {
        if (k.includes('平日') && k.includes('加班')) weekdayOt = val;
        if ((k.includes('假日') || k.includes('例假') || k.includes('休假')) && k.includes('加班')) holidayOt = val;
        if (k.includes('補休')) compHours = val;
        if (k.includes('費') && (k.includes('加班') || k.includes('請領'))) paidHours = val;
      }
    }

    let title = mapping.titleCol ? String(row[mapping.titleCol] ?? '').trim() : undefined;
    if (!title) {
      // 依指示 2：自動識別各類人員 (如「正式人員」、「約僱人員」、「臨時人員」等)
      for (const k of Object.keys(row)) {
        const val = String(row[k] ?? '').trim();
        if (['正式人員', '約僱人員', '約聘人員', '臨時人員', '工友', '技工', '駕駛', '約用人員'].includes(val)) {
          title = val;
          break;
        }
      }
    }
    const notes = mapping.notesCol ? String(row[mapping.notesCol] ?? '').trim() : undefined;

    return {
      id: `row-${index}-${empId || index}`,
      employeeId: empId,
      name: name,
      department: dept || '一般人員',
      title,
      month: month || '全期',
      overtimeHours: otHours,
      weekdayOvertime: weekdayOt,
      holidayOvertime: holidayOt,
      compensatoryHours: compHours,
      paidOvertimeHours: paidHours,
      notes,
      rawRow: row,
    };
  });

  return {
    records,
    columns,
    mapping,
    fileName,
    sheetNames,
    totalRows: records.length,
  };
}
