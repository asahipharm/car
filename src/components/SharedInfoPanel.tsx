"use client";

import { useState } from "react";
import { ChevronDown, Lock, Unlock, Link2 } from "lucide-react";
import type { SharedInfo } from "@/types/insurance";

interface Props {
  info: SharedInfo;
  locked: boolean;
  onUpdate: (info: SharedInfo) => void;
  onToggleLock: () => void;
}

const LICENSE_COLORS   = ["ゴールド", "ブルー", "グリーン"];
const ACCIDENT_OPTIONS = [0, 1, 2, 3, 4, 5];
const GRADE_OPTIONS    = Array.from({ length: 20 }, (_, i) => i + 1);
const MONTHS           = Array.from({ length: 12 }, (_, i) => i + 1);

function toWareki(year: number): string {
  if (year >= 2019) {
    const n = year - 2018;
    return `令和${n === 1 ? "元" : n}年 (${year})`;
  }
  if (year >= 1989) return `平成${year - 1988}年 (${year})`;
  return `昭和${year - 1925}年 (${year})`;
}

const CURRENT_YEAR = new Date().getFullYear();
const REGISTRATION_YEARS = Array.from(
  { length: CURRENT_YEAR - 1990 + 1 },
  (_, i) => CURRENT_YEAR - i,
);

const ANNUAL_MILEAGES  = [
  "5,000km未満",
  "5,000〜10,000km",
  "10,000〜15,000km",
  "15,000〜20,000km",
  "20,000km以上",
  "自由入力",
];

export default function SharedInfoPanel({ info, locked, onUpdate, onToggleLock }: Props) {
  const [open, setOpen] = useState(true);
  const [accidentFree, setAccidentFree] = useState(() => !ACCIDENT_OPTIONS.includes(info.accidentCount));
  const [gradeFree,    setGradeFree]    = useState(() => !GRADE_OPTIONS.includes(info.currentGrade));

  const set = <K extends keyof SharedInfo>(k: K, v: SharedInfo[K]) =>
    onUpdate({ ...info, [k]: v });

  const isLicenseCustom = !LICENSE_COLORS.includes(info.licenseColor);
  const isCustomMileage = !ANNUAL_MILEAGES.slice(0, -1).includes(info.annualMileage);

  return (
    <div
      className="sticky top-0 z-30 rounded-[20px] border transition-all duration-300"
      style={{
        background: "var(--c-surface)",
        borderColor: locked ? "rgba(59,130,246,0.4)" : "var(--c-border)",
        boxShadow: locked
          ? "0 4px 24px rgba(59,130,246,0.18), var(--sh-md)"
          : "var(--sh-md)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* ── Header ─────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 text-sm font-semibold text-[var(--c-text-1)] hover:text-[var(--c-blue)] transition-colors"
        >
          <Link2 size={15} className={locked ? "text-blue-500" : "text-[var(--c-text-3)]"} />
          共通見積もり条件
          {locked && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold">
              固定中
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-[var(--c-text-3)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        <button
          type="button"
          onClick={onToggleLock}
          className={`btn ${locked ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "8px 16px", fontSize: 13 }}
        >
          {locked ? <Lock size={13} /> : <Unlock size={13} />}
          {locked ? "固定を解除する" : "この内容で固定する"}
        </button>
      </div>

      {/* ── Fields ─────────────────────────── */}
      {open && (
        <div style={{ borderTop: "1px solid var(--c-border)" }} className="px-6 pb-5">
          {locked && (
            <p className="text-xs text-blue-500 pt-3 pb-1">
              固定中のため編集できません。「固定を解除する」を押すと変更できます。
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">

            {/* 免許証の色 */}
            <div>
              <label className="lbl">免許証の色</label>
              <select
                value={isLicenseCustom ? "自由入力" : info.licenseColor}
                onChange={(e) => set("licenseColor", e.target.value === "自由入力" ? "" : e.target.value)}
                disabled={locked}
                className="field"
              >
                {LICENSE_COLORS.map((c) => <option key={c}>{c}</option>)}
                <option>自由入力</option>
              </select>
              {isLicenseCustom && (
                <input
                  type="text"
                  value={info.licenseColor}
                  onChange={(e) => set("licenseColor", e.target.value)}
                  disabled={locked}
                  placeholder="自由に入力..."
                  className="field mt-2"
                />
              )}
            </div>

            {/* 事故回数 */}
            <div>
              <label className="lbl">事故回数（直近3年）</label>
              <select
                value={accidentFree ? "自由入力" : String(info.accidentCount)}
                onChange={(e) => {
                  if (e.target.value === "自由入力") { setAccidentFree(true); }
                  else { setAccidentFree(false); set("accidentCount", Number(e.target.value)); }
                }}
                disabled={locked}
                className="field"
              >
                {ACCIDENT_OPTIONS.map((n) => (
                  <option key={n} value={String(n)}>{n}回</option>
                ))}
                <option value="自由入力">自由入力</option>
              </select>
              {accidentFree && (
                <input
                  type="number"
                  value={info.accidentCount || ""}
                  onChange={(e) => set("accidentCount", Number(e.target.value))}
                  disabled={locked}
                  placeholder="回数を入力..."
                  min={0}
                  className="field mt-2"
                />
              )}
            </div>

            {/* 現在の等級 */}
            <div>
              <label className="lbl">現在の等級</label>
              <select
                value={gradeFree ? "自由入力" : String(info.currentGrade)}
                onChange={(e) => {
                  if (e.target.value === "自由入力") { setGradeFree(true); }
                  else { setGradeFree(false); set("currentGrade", Number(e.target.value)); }
                }}
                disabled={locked}
                className="field"
              >
                {GRADE_OPTIONS.map((n) => (
                  <option key={n} value={String(n)}>{n}等級</option>
                ))}
                <option value="自由入力">自由入力</option>
              </select>
              {gradeFree && (
                <input
                  type="number"
                  value={info.currentGrade || ""}
                  onChange={(e) => set("currentGrade", Number(e.target.value))}
                  disabled={locked}
                  placeholder="等級を入力..."
                  min={1}
                  className="field mt-2"
                />
              )}
            </div>

            {/* 車種 */}
            <div>
              <label className="lbl">車種 / 型式（任意）</label>
              <input
                type="text"
                value={info.carModel}
                onChange={(e) => set("carModel", e.target.value)}
                disabled={locked}
                placeholder="例: プリウス / ZVW50"
                className="field"
              />
            </div>

            {/* 現在の走行距離 */}
            <div>
              <label className="lbl">現在の走行距離</label>
              <div className="relative">
                <input
                  type="number"
                  value={info.currentMileage || ""}
                  onChange={(e) => set("currentMileage", Number(e.target.value))}
                  disabled={locked}
                  placeholder="例: 50000"
                  min={0}
                  className="field"
                  style={{ paddingRight: 40 }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--c-text-3)] pointer-events-none">
                  km
                </span>
              </div>
            </div>

            {/* 初度登録年月 — 年ラベルが長いので常に2カラム幅を確保 */}
            <div className="col-span-2 sm:col-span-2">
              <label className="lbl">初度登録年月</label>
              <div className="flex gap-2">
                <select
                  value={info.registrationYear || ""}
                  onChange={(e) => set("registrationYear", Number(e.target.value))}
                  disabled={locked}
                  className="field flex-1"
                >
                  <option value="">-- 年を選択 --</option>
                  {REGISTRATION_YEARS.map((y) => (
                    <option key={y} value={y}>{toWareki(y)}</option>
                  ))}
                </select>
                <select
                  value={info.registrationMonth || ""}
                  onChange={(e) => set("registrationMonth", Number(e.target.value))}
                  disabled={locked}
                  className="field"
                  style={{ width: 96, flexShrink: 0 }}
                >
                  <option value="">-- 月 --</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 年間予定走行距離 */}
            <div>
              <label className="lbl">年間予定走行距離</label>
              <select
                value={isCustomMileage ? "自由入力" : info.annualMileage}
                onChange={(e) => {
                  if (e.target.value !== "自由入力") set("annualMileage", e.target.value);
                  else set("annualMileage", "");
                }}
                disabled={locked}
                className="field"
              >
                {ANNUAL_MILEAGES.map((m) => <option key={m}>{m}</option>)}
              </select>
              {isCustomMileage && (
                <input
                  type="text"
                  value={info.annualMileage}
                  onChange={(e) => set("annualMileage", e.target.value)}
                  disabled={locked}
                  placeholder="例: 12,000km"
                  className="field mt-2"
                />
              )}
            </div>
          </div>

          {/* Badge summary when locked */}
          {locked && (
            <div className="mt-4 flex flex-wrap gap-2">
              {info.licenseColor  && <Badge label="免許" value={info.licenseColor} />}
              <Badge label="事故" value={`${info.accidentCount}回`} />
              <Badge label="等級" value={`${info.currentGrade}等級`} />
              {info.registrationYear > 0 && (
                <Badge
                  label="初度登録"
                  value={`${toWareki(info.registrationYear).split(" ")[0]}${info.registrationMonth > 0 ? `${info.registrationMonth}月` : ""}`}
                />
              )}
              {info.carModel      && <Badge label="車種" value={info.carModel} />}
              {info.currentMileage > 0 && <Badge label="走行" value={`${info.currentMileage.toLocaleString()}km`} />}
              {info.annualMileage && <Badge label="年間走行" value={info.annualMileage} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs border text-blue-700 px-3 py-1.5 rounded-full font-medium"
      style={{ background: "var(--c-sky)", borderColor: "#BFDBFE" }}>
      <span className="text-blue-400 font-semibold">{label}:</span>
      {value}
    </span>
  );
}
