import React from 'react';
import { BookOpen, ShieldAlert, CheckCircle2, FileSpreadsheet, X } from 'lucide-react';

interface RegulationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegulationGuideModal: React.FC<RegulationGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                三義鄉公所勤休制度法規依據與操作說明
              </h3>
              <p className="text-xs text-slate-500">
                公務員服務法及行政院與所屬中央及地方各機關（構）公務員服勤實施辦法
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-700 leading-relaxed">
          {/* Key limits */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-xs mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              公務人員勤休法規核心重點 (112年1月1日修正施行)
            </h4>
            <ul className="space-y-1.5 text-amber-900/90 list-disc list-inside">
              <li>
                <strong>常態上限（60小時）：</strong> 每日延長辦公時數（加班）不得超過4小時；<strong>每月加班總時數不得超過60小時</strong>。
              </li>
              <li>
                <strong>專案上限（80小時）：</strong> 機關因業務特殊需要（如防汛、颱風災害應變、重大藝文專案活動等），經主管機關核定者，每月份延長辦公時數得放寬至80小時。
              </li>
              <li>
                <strong>連續上班限制：</strong> 有急迫必要性，且機關（構）人力臨時調度有困難，不受每日辦公時數上限 14 小時之限制，惟不得連續超過3日
              </li>
              <li>
                <strong>人事列管查核：</strong> 各主管課室及人事室應於每月彙整同仁出勤時數，針對達60小時以上者進行關懷列管與業務分工調整。
              </li>
            </ul>
          </div>

          {/* System usage guide */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              試算表上傳與格式支援說明
            </h4>
            <div className="space-y-2 text-slate-600 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <p className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>檔案格式：</strong>支援 Microsoft Excel (<strong>.xlsx</strong>、<strong>.xls</strong>) 及 <strong>.csv</strong> 格式。
                </span>
              </p>
              <p className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>智慧欄位自動辨識：</strong>系統會自動搜尋「員工編號」、「員工姓名」、「服務課室」、「統計月份」、「加班總時數」等常見欄位名稱。
                </span>
              </p>
              <p className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>全部原始欄位完整保留：</strong>上傳檔案中的所有備註、細項欄位（如平日加班、假日加班、補休時數、公文核准字號等）在篩選及匯出下載時皆會100%原貌保留。
                </span>
              </p>
              <p className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>資訊安全與隱私防護：</strong>所有解析與篩選皆於瀏覽器端完成，不會將鄉公所同仁機敏個資上傳至任何外部未經授權之伺服器。
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition cursor-pointer"
          >
            我瞭解了，開始使用
          </button>
        </div>
      </div>
    </div>
  );
};
