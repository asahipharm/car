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
  const [accidentFree, setAccidentFree] = useState(
    () => !ACCIDENT_OPTIONS.includes(info.accidentCount)
  );
  const [gradeFree, setGradeFree] = useState(
    () => !GRADE_OPTIONS.includes(info.currentGrade)
  );

  const set = <K extends keyof SharedInfo>(k: K, v: SharedInfo[K]) =>
    onUpdate({ ...info, [k]: v });

  return (
    <div
      className={`sticky top-0 z-30 rounded-2xl border transition-all duration-300 ${
        locked
          ? "border-blue-400/60 bg-white/90 backdrop-blur-md shadow-[0_4px_24px_-4px_rgba(59,130,246,0.25)]"
          : "border-slate-200/80 bg-white/90 backdrop-blur-md shadow-lg"
      }`}
    >
      {/* ── Header bar ─────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
        >
          <Link2
            size={15}
            className={locked ? "text-blue-500" : "text-slate-400"}
          />
          共通見積もり条件
          {locked && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              固定中
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Lock toggle */}
        <button
          type="button"
          onClick={onToggleLock}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
            locked
              ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600"
          }`}
        >
          {locked ? <Lock size={12} /> : <Unlock size={12} />}
          {locked ? "固定を解除する" : "この内容で固定する"}
        </button>
      </div>

      {/* ── Fields ─────────────────────────────── */}
      {open && (
        <div className="px-5 pb-4 border-t border-slate-200">
          {/* 固定中の説明 */}
          {locked && (
            <p className="text-xs text-blue-600 pt-3 pb-2">
              固定中のため編集できません。「固定を解除する」を押すと変更できます。
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3">
            {/* 免許証の色 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                免許証の色
              </label>
              {(() => {
                const isCustom = !LICENSE_COLORS.includes(info.licenseColor);
                return (
                  <>
                    <select
                      value={isCustom ? "自由入力" : info.licenseColor}
                      onChange={(e) => set("licenseColor", e.target.value === "自由入力" ? "" : e.target.value)}
                      disabled={locked}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {LICENSE_COLORS.map((c) => <option key={c}>{c}</option>)}
                      <option>自由入力</option>
                    </select>
                    {isCustom && (
                      <input
                        type="text"
                        value={info.licenseColor}
                        onChange={(e) => set("licenseColor", e.target.value)}
                        disabled={locked}
                        placeholder="自由に入力..."
                        className="mt-1.5 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    )}
                  </>
                );
              })()}
            </div>

            {/* 事故回数 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                事故回数（直近3年）
              </label>
              <select
                value={accidentFree ? "自由入力" : String(info.accidentCount)}
                onChange={(e) => {
                  if (e.target.value === "自由入力") {
                    setAccidentFree(true);
                  } else {
                    setAccidentFree(false);
                    set("accidentCount", Number(e.target.value));
                  }
                }}
                disabled={locked}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="mt-1.5 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}
            </div>

            {/* 現在の等級 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                現在の等級
              </label>
              <select
                value={gradeFree ? "自由入力" : String(info.currentGrade)}
                onChange={(e) => {
                  if (e.target.value === "自由入力") {
                    setGradeFree(true);
                  } else {
                    setGradeFree(false);
                    set("currentGrade", Number(e.target.value));
                  }
                }}
                disabled={locked}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="mt-1.5 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}
            </div>

            {/* 車種/型式 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                車種 / 型式（任意）
              </label>
              <input
                type="text"
                value={info.carModel}
                onChange={(e) => set("carModel", e.target.value)}
                disabled={locked}
                placeholder="例: プリウス / ZVW50"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* 現在の走行距離 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                現在の走行距離
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={info.currentMileage || ""}
                  onChange={(e) => set("currentMileage", Number(e.target.value))}
                  disabled={locked}
                  placeholder="例: 50000"
                  min={0}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">km</span>
              </div>
            </div>

            {/* 1年間の予定走行距離 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                年間予定走行距離
              </label>
              {(() => {
                const isCustom = !ANNUAL_MILEAGES.slice(0, -1).includes(info.annualMileage);
                return (
                  <>
                    <select
                      value={isCustom ? "自由入力" : info.annualMileage}
                      onChange={(e) => {
                        if (e.target.value !== "自由入力") {
                          set("annualMileage", e.target.value);
                        } else {
                          set("annualMileage", "");
                        }
                      }}
                      disabled={locked}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ANNUAL_MILEAGES.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    {isCustom && (
                      <input
                        type="text"
                        value={info.annualMileage}
                        onChange={(e) => set("annualMileage", e.target.value)}
                        disabled={locked}
                        placeholder="例: 12,000km"
                        className="mt-1.5 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* 固定中のサマリー表示 */}
          {locked && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge label="免許" value={info.licenseColor} />
              <Badge label="事故" value={`${info.accidentCount}回`} />
              <Badge label="等級" value={`${info.currentGrade}等級`} />
              {info.carModel && <Badge label="車種" value={info.carModel} />}
              {info.currentMileage > 0 && <Badge label="走行距離" value={`${info.currentMileage.toLocaleString()}km`} />}
              <Badge label="年間走行" value={info.annualMileage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full">
      <span className="font-medium text-blue-400">{label}:</span>
      {value}
    </span>
  );
}
