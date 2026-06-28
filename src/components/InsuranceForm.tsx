"use client";

import { useState, useEffect, useRef } from "react";
import {
  PlusCircle, Zap, ShieldCheck, Car, Wrench, FileText,
  ExternalLink, Pencil, X, Tag, Star, Check,
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
  liabilityPerson: "無制限",
  liabilityProperty: "無制限",
  propertyDeductible: "なし",
  personalInjury: "3000万円",
  passengerInjury: "なし",
  vehicleInsurance: false,
  vehicleType: "一般",
  vehicleAmount: "",
  vehicleDeductible: "5-10万円",
  legalSupport: false,
  roadService: false,
  familyBike: false,
  personalLiability: false,
  uninsuredCar: false,
  internetDiscount: false,
  paperlessDiscount: false,
  earlyDiscount: false,
  multiCarDiscount: false,
  telematicsDiscount: false,
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
  const formRef = useRef<HTMLDivElement>(null);

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
            </div>
          )}
        </AccordionSection>

        {/* ── その他特約 ────────────────────── */}
        <AccordionSection title="その他の特約" icon={<Wrench size={15} />}>
          <div style={{ borderRadius: 12, border: "1px solid var(--c-border)", overflow: "hidden" }}>
            {[
              { label: "弁護士費用特約",      key: "legalSupport"      as const },
              { label: "ロードサービス",       key: "roadService"       as const },
              { label: "ファミリーバイク特約", key: "familyBike"        as const },
              { label: "個人賠償責任特約",     key: "personalLiability" as const },
              { label: "無保険車傷害",         key: "uninsuredCar"      as const },
            ].map(({ label, key }, i) => (
              <div key={key} style={i > 0 ? { borderTop: "1px solid var(--c-border)" } : {}}>
                <Toggle label={label} checked={form[key]} onChange={(v) => set(key, v)} />
              </div>
            ))}
          </div>
        </AccordionSection>

        {/* ── 割引 ──────────────────────────── */}
        <AccordionSection title="割引" icon={<Tag size={15} />}>
          <div style={{ borderRadius: 12, border: "1px solid var(--c-border)", overflow: "hidden" }}>
            {[
              { label: "インターネット割引",   key: "internetDiscount"   as const },
              { label: "証券不発行割引",       key: "paperlessDiscount"  as const },
              { label: "早期割引",             key: "earlyDiscount"      as const },
              { label: "複数台割引",           key: "multiCarDiscount"   as const },
              { label: "テレマティクス割引",   key: "telematicsDiscount" as const },
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
