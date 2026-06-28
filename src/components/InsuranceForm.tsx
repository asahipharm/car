"use client";

import { useState, useEffect, useRef } from "react";
import {
  PlusCircle, Zap, ShieldCheck, Car, Wrench, FileText,
  ExternalLink, Pencil, X, Tag, Star, Check, Upload,
} from "lucide-react";
import AccordionSection from "./AccordionSection";
import type { InsurancePlan, SharedInfo } from "@/types/insurance";
import { DEFAULT_PLAN, INSURANCE_COMPANIES } from "@/types/insurance";

const CUSTOM_DEFAULT_KEY = "car-custom-default-plan-v1";
const FREE_INPUT = "自由入力";

type DefaultFields = Omit<typeof DEFAULT_PLAN, never>;

function loadCustomDefault(): DefaultFields {
  try {
    const saved = localStorage.getItem(CUSTOM_DEFAULT_KEY);
    if (saved) return { ...DEFAULT_PLAN, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return DEFAULT_PLAN;
}

function saveCustomDefault(form: FormState): void {
  const { company: _c, premium: _p, memo: _m, ...rest } = form;
  localStorage.setItem(CUSTOM_DEFAULT_KEY, JSON.stringify(rest));
}

type FormState = Omit<InsurancePlan, "id" | "sharedInfoSnapshot">;

const emptyForm = (grade = 6): FormState => ({
  company: "",
  premium: 0,
  grade,
  ageCondition: "26歳以上",
  drivingScope: "限定しない",
  accidentCoeffPeriod: "0年",
  liabilityPerson: "無制限",
  liabilityProperty: "無制限",
  propertyDeductible: "なし",
  propertyExcessRepair: false,
  personalInjury: "3000万円",
  passengerInjury: "なし",
  singleCarAccident: false,
  vehicleInsurance: false,
  vehicleType: "一般",
  vehicleAmount: "",
  vehicleDeductible: "5-10万円",
  vehicleNewCar: false,
  vehicleTotalLoss: false,
  vehicleTheftRental: false,
  vehicleReplacement: false,
  legalSupport: false,
  roadService: false,
  familyBike: false,
  personalLiability: false,
  uninsuredCar: false,
  otherVehicleCoverage: false,
  victimRelief: false,
  homeGarageRepair: false,
  bicycleAccident: false,
  personalBelongings: "なし",
  internetDiscount: false,
  paperlessDiscount: false,
  earlyDiscount: false,
  multiCarDiscount: false,
  telematicsDiscount: false,
  newCarDiscount: false,
  safetySupportDiscount: false,
  memo: "",
});

interface Props {
  onAdd: (plan: InsurancePlan) => void;
  sharedInfo: SharedInfo;
  sharedInfoLocked: boolean;
  editingPlan?: InsurancePlan | null;
  onUpdate?: (plan: InsurancePlan) => void;
  onCancelEdit?: () => void;
}

/* ── CSV parser ───────────────────────────────── */

// Properly parse one CSV line, handling "quoted,fields"
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === "," && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function normalizeScope(scope: string): string {
  if (scope.includes("配偶者"))                               return "本人＋配偶者";
  if (scope.includes("家族"))                                 return "本人＋家族";
  if (scope.includes("本人") && /のみ|限定/.test(scope))     return "本人のみ";
  if (/限定しない|限定なし/.test(scope))                     return "限定しない";
  return scope;
}

function parseCSVToForm(csvText: string): Partial<FormState> {
  // Strip UTF-8 BOM if present
  const text = csvText.replace(/^﻿/, "");
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return {};

  const header = parseCSVLine(lines[0]);
  // 3-column: カテゴリ,項目,内容  /  2-column: 項目,内容
  const threeCol = header.length >= 3;

  const data = new Map<string, string>();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const item  = threeCol ? cols[1] : cols[0];
    const value = threeCol ? cols.slice(2).join(",") : (cols[1] ?? "");
    if (item?.trim()) data.set(item.trim(), value.trim());
  }

  const get  = (...keys: string[]) => { for (const k of keys) { const v = data.get(k); if (v !== undefined) return v; } return ""; };
  const has  = (...keys: string[]) => keys.some((k) => data.has(k));
  // "なし" / 空 → false、それ以外 → true
  const bool = (...keys: string[]): boolean | undefined => {
    if (!has(...keys)) return undefined;
    const v = get(...keys);
    return v !== "なし" && v !== "" && !v.startsWith("なし");
  };
  const num   = (v: string) => parseInt(v.replace(/[^\d]/g, ""), 10) || 0;
  // "1億円（車外危険補償あり）" → "1億円"
  const clean = (v: string) => v.replace(/[（(][^）)]*[）)]/g, "").trim();

  const result: Partial<FormState> = {};

  // ── 基本構成 ──
  const company = get("申込経路", "保険会社");
  if (company) result.company = company;

  const premiumStr = get("年払保険料", "年間保険料");
  if (premiumStr) { const n = num(premiumStr); if (n > 0) result.premium = n; }

  // "15等級" / "15等級（事故有係数適用期間0年）"
  const gradeRaw = get("ノンフリート等級", "等級");
  if (gradeRaw) {
    const g = parseInt(gradeRaw, 10);
    if (g > 0) result.grade = g;
    const accpMatch = gradeRaw.match(/事故有係数適用期間\s*(\d+年)/);
    if (accpMatch) result.accidentCoeffPeriod = accpMatch[1];
  }

  const accp = get("事故有係数適用期間");
  if (accp) result.accidentCoeffPeriod = accp;

  // 年齢条件：「年齢条件」「運転者年齢条件特約」どちらも対応
  const age = get("年齢条件", "運転者年齢条件特約");
  if (age) result.ageCondition = age.replace(/補償$/, "").trim();

  // 運転範囲：各社の表記ゆれに対応
  const scope = get("運転者の範囲", "運転者限定", "運転者限定特約");
  if (scope) result.drivingScope = normalizeScope(scope);

  // ── 補償内容 ──
  const lp = get("対人賠償保険", "対人賠償"); if (lp) result.liabilityPerson = lp;
  const lpr = get("対物賠償保険", "対物賠償"); if (lpr) result.liabilityProperty = lpr;

  const perB = bool(
    "対物超過修理費用特約", "対物差額修理費用補償",
    "対物全損時修理差額費用補償特約",   // AXA
  );
  if (perB !== undefined) result.propertyExcessRepair = perB;

  // 人身傷害：「人身傷害保険金額」「人身傷害」「人身傷害補償特約」
  const piRaw = get("人身傷害保険金額", "人身傷害", "人身傷害補償特約");
  if (piRaw) result.personalInjury = clean(piRaw);

  const passRaw = get("搭乗者傷害保険", "搭乗者傷害"); if (passRaw) result.passengerInjury = passRaw;

  const ucB = bool("無保険車傷害保険", "無保険車傷害"); if (ucB !== undefined) result.uninsuredCar = ucB;

  // 自損：「自損事故傷害保険」「自損傷害」「自損事故保険」（AXA）
  const scaB = bool("自損事故傷害保険", "自損傷害", "自損事故保険");
  if (scaB !== undefined) result.singleCarAccident = scaB;

  // ── 車両保険 ──
  const viRaw = get("車両保険");
  if (data.has("車両保険")) {
    result.vehicleInsurance = viRaw !== "なし" && viRaw !== "";
    if (result.vehicleInsurance && viRaw !== "あり") result.vehicleType = viRaw;
  }
  // 「車両保険の種類」（AXA）→ 種類が書いてあれば車両保険あり
  const viType = get("車両保険の種類");
  if (viType) {
    result.vehicleInsurance = viType !== "なし" && viType !== "";
    if (result.vehicleInsurance) result.vehicleType = viType;
  }

  const va = get("車両保険金額"); if (va) result.vehicleAmount = va;
  // 「車両自己負担額」「車両免責金額」「免責金額/割合」（AXA）
  const vded = get("車両自己負担額", "車両免責金額", "免責金額/割合");
  if (vded) result.vehicleDeductible = vded;

  const vncRaw = get("新車特約");
  if (data.has("新車特約")) result.vehicleNewCar = vncRaw !== "なし" && vncRaw !== "";

  const vtlB = bool("全損時諸費用保険金特約", "全損時諸費用特約"); if (vtlB !== undefined) result.vehicleTotalLoss = vtlB;
  const vtrB = bool("車両盗難時レンタカー費用特約");               if (vtrB !== undefined) result.vehicleTheftRental = vtrB;

  // 「車両新価特約」（数値の場合も truthy）
  const vrepRaw = get("車両新価特約");
  if (data.has("車両新価特約")) result.vehicleReplacement = vrepRaw !== "なし" && vrepRaw !== "";

  // ── その他特約 ──
  // 弁護士：「弁護士費用特約」「弁護士費用等補償特約」（AXA）
  const lsB = bool("弁護士費用特約", "弁護士費用等補償特約");
  if (lsB !== undefined) result.legalSupport = lsB;

  const rsB = bool("ロードサービス特約", "ロードサービス"); if (rsB !== undefined) result.roadService = rsB;
  const fbB = bool("ファミリーバイク特約");                 if (fbB !== undefined) result.familyBike = fbB;

  // 個人賠償：「個人賠償責任危険補償特約」「個人賠償責任特約」「日常生活賠償責任保険特約〜」（AXA）
  const plB = bool(
    "個人賠償責任危険補償特約", "個人賠償責任特約",
    "日常生活賠償責任保険特約（示談交渉付）",
  );
  if (plB !== undefined) result.personalLiability = plB;

  // 他車運転：「他の自動車運転危険補償特約」「他車運転特約」「他車運転危険補償特約」（AXA）
  const ovcB = bool("他の自動車運転危険補償特約", "他車運転特約", "他車運転危険補償特約");
  if (ovcB !== undefined) result.otherVehicleCoverage = ovcB;

  const vrB  = bool("被害者救済費用等補償特約");                             if (vrB  !== undefined) result.victimRelief   = vrB;
  const hgrB = bool("自宅・車庫等修理費用補償特約", "自宅・車庫修理費用");  if (hgrB !== undefined) result.homeGarageRepair = hgrB;
  const baB  = bool("自転車事故補償特約", "自転車事故補償");                 if (baB  !== undefined) result.bicycleAccident = baB;

  // 身の回り品：「車内外身の回り品補償特約」「車内外身の回り品補償」「身の回り品保険」（AXA）
  const pb = get("車内外身の回り品補償特約", "車内外身の回り品補償", "身の回り品保険");
  if (pb) result.personalBelongings = pb;

  // ── 割引 ──
  const idB  = bool("インターネット割引");                                if (idB  !== undefined) result.internetDiscount    = idB;
  // 「証券不発行割引」「ペーパーレス割引」「保険証券不発行特約」（AXA）
  const pdB  = bool("証券不発行割引", "ペーパーレス割引", "保険証券不発行特約");
  if (pdB !== undefined) result.paperlessDiscount = pdB;
  const edB  = bool("早期申込割引", "早期割引");                          if (edB  !== undefined) result.earlyDiscount       = edB;
  const mdB  = bool("複数台割引", "セカンドカー割引");                    if (mdB  !== undefined) result.multiCarDiscount    = mdB;
  const tdB  = bool("テレマティクス割引");                                if (tdB  !== undefined) result.telematicsDiscount  = tdB;
  const ncdB = bool("新車割引");                                          if (ncdB !== undefined) result.newCarDiscount      = ncdB;
  const ssdB = bool("セーフティ・サポートカー割引", "ASV割引");           if (ssdB !== undefined) result.safetySupportDiscount = ssdB;

  return result;
}

/* ── FreeSelect ───────────────────────────────── */
function FreeSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  const isCustom = !options.includes(value);
  return (
    <div>
      <label className="lbl">{label}</label>
      <select
        value={isCustom ? FREE_INPUT : value}
        onChange={(e) => onChange(e.target.value === FREE_INPUT ? "" : e.target.value)}
        className="field"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
        <option>{FREE_INPUT}</option>
      </select>
      {isCustom && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="自由に入力..."
          className="field mt-2"
          style={{ borderColor: "#3B82F6", boxShadow: "0 0 0 3px rgba(59,130,246,0.12)" }}
        />
      )}
    </div>
  );
}

/* ── Toggle ───────────────────────────────────── */
function Toggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-[var(--c-text-1)]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full overflow-hidden transition-colors duration-200 shrink-0 ${
          checked ? "bg-blue-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/* ── Main Component ───────────────────────────── */
export default function InsuranceForm({
  onAdd, sharedInfo, sharedInfoLocked, editingPlan, onUpdate, onCancelEdit,
}: Props) {
  const isEditing = !!editingPlan;
  const formRef    = useRef<HTMLDivElement>(null);
  const csvFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm]                     = useState<FormState>(emptyForm(sharedInfo.currentGrade));
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [customCompany, setCustomCompany]   = useState("");
  const [errors, setErrors]                 = useState<Partial<Record<keyof FormState | "companySelect", string>>>({});
  const [savedDefault, setSavedDefault]     = useState(false);

  useEffect(() => {
    if (!editingPlan) return;
    const { id: _id, sharedInfoSnapshot: _snap, ...rest } = editingPlan;
    setForm(rest);
    const known = INSURANCE_COMPANIES.find((c) => c.name === editingPlan.company && c.name !== "その他");
    if (known) {
      setSelectedCompanyName(known.name);
      setCustomCompany("");
    } else {
      setSelectedCompanyName("その他");
      setCustomCompany(editingPlan.company);
    }
    setErrors({});
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [editingPlan]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const selectedMeta = INSURANCE_COMPANIES.find((c) => c.name === selectedCompanyName);
  const isOther = selectedCompanyName === "その他";

  const handleCompanyChange = (name: string) => {
    setSelectedCompanyName(name);
    setForm((f) => ({ ...f, company: name !== "その他" ? name : customCompany }));
    setErrors((e) => ({ ...e, companySelect: undefined }));
  };

  const handleCustomChange = (val: string) => {
    setCustomCompany(val);
    setForm((f) => ({ ...f, company: val }));
  };

  const applyDefaults = () => {
    const defaults = loadCustomDefault();
    setForm((f) => ({
      ...f, ...defaults,
      grade: sharedInfoLocked ? sharedInfo.currentGrade : defaults.grade,
    }));
  };

  const handleSaveDefault = () => {
    saveCustomDefault(form);
    setSavedDefault(true);
    setTimeout(() => setSavedDefault(false), 2000);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!selectedCompanyName) {
      e.companySelect = "保険会社を選択してください";
    } else if (isOther && !customCompany.trim()) {
      e.companySelect = "保険会社名を入力してください";
    }
    if (!form.premium || form.premium <= 0) e.premium = "正しい金額を入力してください";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setForm(emptyForm(sharedInfoLocked ? sharedInfo.currentGrade : 6));
    setSelectedCompanyName("");
    setCustomCompany("");
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isEditing && onUpdate) {
      onUpdate({ ...form, id: editingPlan!.id, sharedInfoSnapshot: editingPlan!.sharedInfoSnapshot });
    } else {
      onAdd({ ...form, id: crypto.randomUUID(), sharedInfoSnapshot: sharedInfoLocked ? sharedInfo : undefined });
    }
    resetForm();
  };

  const handleCancel = () => { resetForm(); onCancelEdit?.(); };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSVToForm(text);
      setForm((f) => ({ ...f, ...parsed }));
      // Sync company selector state
      if (parsed.company) {
        const known = INSURANCE_COMPANIES.find((c) => c.name === parsed.company && c.name !== "その他");
        if (known) {
          setSelectedCompanyName(known.name);
          setCustomCompany("");
        } else {
          setSelectedCompanyName("その他");
          setCustomCompany(parsed.company);
        }
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  /* grade free-text helpers */
  const gradeOpts = Array.from({ length: 20 }, (_, i) => String(i + 1));
  const isCustomGrade = !gradeOpts.includes(String(form.grade));

  return (
    <div
      ref={formRef}
      className="card p-7 transition-all duration-300"
      style={isEditing ? {
        borderColor: "#F59E0B",
        boxShadow: "0 0 0 3px rgba(245,158,11,0.15), var(--sh-md)",
        background: "#FFFBEB",
      } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-bold text-[var(--c-text-1)] flex items-center gap-2.5">
          {isEditing ? (
            <>
              <Pencil size={18} className="text-amber-500" />
              プランを編集中
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
                {editingPlan!.company}
              </span>
            </>
          ) : (
            <>
              <PlusCircle size={18} className="text-blue-500" />
              プランを追加
            </>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <input
            ref={csvFileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCSVImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => csvFileRef.current?.click()}
            className="btn btn-ghost"
            title="CSVファイルから項目を一括入力"
          >
            <Upload size={13} className="text-blue-500" />
            CSVから取り込む
          </button>
          <button
            type="button"
            onClick={handleSaveDefault}
            className={`btn btn-ghost ${savedDefault ? "!bg-emerald-50 !text-emerald-600 !border-emerald-200" : ""}`}
          >
            {savedDefault ? <Check size={13} /> : <Star size={13} />}
            {savedDefault ? "保存しました" : "標準設定を更新"}
          </button>
          <button type="button" onClick={applyDefaults} className="btn btn-ghost">
            <Zap size={13} className="text-blue-500" />
            標準設定を適用
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* ── 基本構成 ──────────────────────── */}
        <AccordionSection title="基本構成" icon={<ShieldCheck size={15} />} defaultOpen>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* 保険会社 */}
            <div className="sm:col-span-2">
              <label className="lbl">
                保険会社 <span className="text-red-400 font-normal">*</span>
              </label>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <select
                    value={selectedCompanyName}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className={`field ${errors.companySelect ? "!border-red-400" : ""}`}
                  >
                    <option value="">-- 保険会社を選択 --</option>
                    {INSURANCE_COMPANIES.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  {errors.companySelect && (
                    <p className="text-red-500 text-xs mt-1.5">{errors.companySelect}</p>
                  )}
                </div>
                {selectedMeta?.url && !isOther && (
                  <a
                    href={selectedMeta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary h-[50px] text-xs text-blue-600 border-blue-200 hover:border-blue-400"
                    style={{ paddingLeft: 14, paddingRight: 14 }}
                  >
                    <ExternalLink size={13} />
                    公式サイト
                  </a>
                )}
              </div>
              {isOther && (
                <input
                  type="text"
                  value={customCompany}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  placeholder="保険会社名を入力..."
                  className="field mt-2"
                />
              )}
              {selectedMeta && (
                <div className="mt-3 flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: selectedMeta.color }}
                  >
                    {selectedMeta.initial}
                  </div>
                  <span className="text-sm text-[var(--c-text-2)]">
                    {isOther ? customCompany || "その他" : selectedMeta.name}
                  </span>
                </div>
              )}
            </div>

            {/* 年間保険料 */}
            <div>
              <label className="lbl">
                年間保険料（円） <span className="text-red-400 font-normal">*</span>
              </label>
              <input
                type="number"
                value={form.premium || ""}
                onChange={(e) => set("premium", Number(e.target.value))}
                placeholder="例: 80000"
                min={1}
                className={`field ${errors.premium ? "!border-red-400" : ""}`}
              />
              {errors.premium && <p className="text-red-500 text-xs mt-1.5">{errors.premium}</p>}
            </div>

            {/* 等級 */}
            <div>
              <label className="lbl flex items-center gap-2">
                等級
                {sharedInfoLocked && !isEditing && (
                  <span className="text-blue-500 text-[10px] font-semibold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                    共通条件から反映
                  </span>
                )}
              </label>
              <select
                value={isCustomGrade ? FREE_INPUT : String(form.grade)}
                onChange={(e) => {
                  if (e.target.value === FREE_INPUT) set("grade", 0);
                  else set("grade", Number(e.target.value));
                }}
                className="field"
              >
                {gradeOpts.map((o) => <option key={o}>{o}</option>)}
                <option>{FREE_INPUT}</option>
              </select>
              {isCustomGrade && (
                <input
                  type="number"
                  value={form.grade || ""}
                  onChange={(e) => set("grade", Number(e.target.value))}
                  placeholder="等級を入力..."
                  min={1}
                  className="field mt-2"
                  style={{ borderColor: "#3B82F6", boxShadow: "0 0 0 3px rgba(59,130,246,0.12)" }}
                />
              )}
            </div>

            <FreeSelect
              label="年齢条件"
              value={form.ageCondition}
              onChange={(v) => set("ageCondition", v)}
              options={["不担保", "21歳以上", "26歳以上", "30歳以上", "35歳以上"]}
            />
            <FreeSelect
              label="運転範囲"
              value={form.drivingScope}
              onChange={(v) => set("drivingScope", v)}
              options={["本人のみ", "本人＋配偶者", "本人＋家族", "限定しない"]}
            />
            <FreeSelect
              label="事故有係数適用期間"
              value={form.accidentCoeffPeriod}
              onChange={(v) => set("accidentCoeffPeriod", v)}
              options={["0年", "1年", "2年", "3年"]}
            />
          </div>
        </AccordionSection>

        {/* ── 補償内容 ──────────────────────── */}
        <AccordionSection title="補償内容" icon={<ShieldCheck size={15} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FreeSelect label="対人賠償" value={form.liabilityPerson} onChange={(v) => set("liabilityPerson", v)}
              options={["無制限", "1億円", "5000万円", "3000万円", "なし"]} />
            <FreeSelect label="対物賠償" value={form.liabilityProperty} onChange={(v) => set("liabilityProperty", v)}
              options={["無制限", "5000万円", "3000万円", "2000万円", "なし"]} />
            <FreeSelect label="対物免責" value={form.propertyDeductible} onChange={(v) => set("propertyDeductible", v)}
              options={["なし", "5万円", "10万円"]} />
            <FreeSelect label="人身傷害" value={form.personalInjury} onChange={(v) => set("personalInjury", v)}
              options={["なし", "3000万円", "5000万円", "無制限"]} />
            <FreeSelect label="搭乗者傷害" value={form.passengerInjury} onChange={(v) => set("passengerInjury", v)}
              options={["なし", "500万円", "1000万円", "部位症状別払い"]} />
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--c-border)" }}>
            <Toggle label="対物超過修理費用特約" checked={form.propertyExcessRepair} onChange={(v) => set("propertyExcessRepair", v)} />
            <Toggle label="自損事故傷害保険"     checked={form.singleCarAccident}   onChange={(v) => set("singleCarAccident", v)} />
          </div>
        </AccordionSection>

        {/* ── 車両保険 ──────────────────────── */}
        <AccordionSection title="車両保険" icon={<Car size={15} />}>
          <Toggle label="車両保険" checked={form.vehicleInsurance} onChange={(v) => set("vehicleInsurance", v)} />
          {form.vehicleInsurance && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1 pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
              <FreeSelect label="種類" value={form.vehicleType} onChange={(v) => set("vehicleType", v)}
                options={["一般", "エコノミー"]} />
              <div>
                <label className="lbl">車両保険金額（円）</label>
                <input
                  type="number"
                  value={form.vehicleAmount}
                  onChange={(e) => set("vehicleAmount", e.target.value)}
                  placeholder="例: 1500000"
                  className="field"
                />
              </div>
              <FreeSelect label="免責金額" value={form.vehicleDeductible} onChange={(v) => set("vehicleDeductible", v)}
                options={["なし", "5-10万円", "10-10万円", "10-15万円", "15-15万円"]} />
              <div className="sm:col-span-2 pt-2" style={{ borderTop: "1px solid var(--c-border)" }}>
                <Toggle label="新車特約"             checked={form.vehicleNewCar}      onChange={(v) => set("vehicleNewCar", v)} />
                <Toggle label="全損時諸費用保険金特約" checked={form.vehicleTotalLoss}   onChange={(v) => set("vehicleTotalLoss", v)} />
                <Toggle label="盗難時レンタカー費用特約" checked={form.vehicleTheftRental} onChange={(v) => set("vehicleTheftRental", v)} />
                <Toggle label="車両新価特約"         checked={form.vehicleReplacement} onChange={(v) => set("vehicleReplacement", v)} />
              </div>
            </div>
          )}
        </AccordionSection>

        {/* ── その他特約 ────────────────────── */}
        <AccordionSection title="その他の特約" icon={<Wrench size={15} />}>
          <div style={{ borderRadius: 12, border: "1px solid var(--c-border)", overflow: "hidden" }}>
            {[
              { label: "弁護士費用特約",          key: "legalSupport"          as const },
              { label: "ロードサービス",           key: "roadService"           as const },
              { label: "ファミリーバイク特約",     key: "familyBike"            as const },
              { label: "個人賠償責任特約",         key: "personalLiability"     as const },
              { label: "無保険車傷害",             key: "uninsuredCar"          as const },
              { label: "他車運転危険補償特約",     key: "otherVehicleCoverage"  as const },
              { label: "被害者救済費用等補償特約", key: "victimRelief"          as const },
              { label: "自宅・車庫等修理費用特約", key: "homeGarageRepair"      as const },
              { label: "自転車事故補償特約",       key: "bicycleAccident"       as const },
            ].map(({ label, key }, i) => (
              <div key={key} style={i > 0 ? { borderTop: "1px solid var(--c-border)" } : {}}>
                <Toggle label={label} checked={form[key]} onChange={(v) => set(key, v)} />
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--c-border)", padding: "12px 0 4px" }}>
              <FreeSelect
                label="車内外身の回り品補償特約"
                value={form.personalBelongings}
                onChange={(v) => set("personalBelongings", v)}
                options={["なし", "10万円", "20万円", "30万円", "50万円"]}
              />
            </div>
          </div>
        </AccordionSection>

        {/* ── 割引 ──────────────────────────── */}
        <AccordionSection title="割引" icon={<Tag size={15} />}>
          <div style={{ borderRadius: 12, border: "1px solid var(--c-border)", overflow: "hidden" }}>
            {[
              { label: "インターネット割引",             key: "internetDiscount"    as const },
              { label: "証券不発行割引",                 key: "paperlessDiscount"   as const },
              { label: "早期割引",                       key: "earlyDiscount"       as const },
              { label: "複数台割引",                     key: "multiCarDiscount"    as const },
              { label: "テレマティクス割引",             key: "telematicsDiscount"  as const },
              { label: "新車割引",                       key: "newCarDiscount"      as const },
              { label: "セーフティ・サポートカー割引",   key: "safetySupportDiscount" as const },
            ].map(({ label, key }, i) => (
              <div key={key} style={i > 0 ? { borderTop: "1px solid var(--c-border)" } : {}}>
                <Toggle label={label} checked={form[key]} onChange={(v) => set(key, v)} />
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* ── メモ ──────────────────────────── */}
        <AccordionSection title="メモ" icon={<FileText size={15} />}>
          <textarea
            value={form.memo}
            onChange={(e) => set("memo", e.target.value)}
            placeholder="補償内容の特徴など自由に記入..."
            rows={3}
            className="field"
          />
        </AccordionSection>

        {/* ── Actions ───────────────────────── */}
        <div className="flex justify-end gap-3 pt-2">
          {isEditing && (
            <button type="button" onClick={handleCancel} className="btn btn-secondary">
              <X size={14} />
              キャンセル
            </button>
          )}
          <button
            type="submit"
            className={`btn ${isEditing ? "btn-amber" : "btn-primary"}`}
          >
            {isEditing ? <Pencil size={14} /> : <PlusCircle size={15} />}
            {isEditing ? "変更を保存する" : "追加する"}
          </button>
        </div>
      </form>
    </div>
  );
}
