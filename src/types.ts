export interface AttendanceRecord {
  id: string; // internal unique key
  employeeId: string; // 員工編號
  name: string; // 員工姓名
  department: string; // 課室/單位
  title?: string; // 職稱
  month: string; // 月份 (e.g., "113年05月", "2024-05")
  overtimeHours: number; // 加班時數
  weekdayOvertime?: number; // 平日加班
  holidayOvertime?: number; // 假日/休假日加班
  compensatoryHours?: number; // 補休時數
  paidOvertimeHours?: number; // 支領加班費時數
  notes?: string; // 備註 (專案核准等)
  rawRow: Record<string, any>; // 所有原始欄位資料
  originalIndex?: number; // 原始試算表中出現之順序 (1-based)，用於「按原來排序」
}

export type FilterOperator = '>=' | '>' | '<=' | '<' | '==' | 'between';

export interface FilterConfig {
  thresholdHours: number;
  operator: FilterOperator;
  thresholdMaxHours?: number; // used if operator is 'between'
  selectedMonth: string; // 'all' or specific month
  selectedDepartment: string; // 'all' or specific department
  keyword: string; // search in employee ID or Name
}

export interface ColumnMapping {
  employeeIdCol: string;
  nameCol: string;
  departmentCol: string;
  monthCol: string;
  overtimeHoursCol: string;
  titleCol?: string;
  notesCol?: string;
}

export interface DepartmentStat {
  department: string;
  totalEmployees: number;
  filteredCount: number;
  totalOvertimeHours: number;
  avgOvertimeHours: number;
  maxOvertimeHours: number;
}
