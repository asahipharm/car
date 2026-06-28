"use client";

import { useState, useEffect } from "react";
import { Car, ShieldCheck, FileText, Download, GitCompareArrows } from "lucide-react";
import InsuranceForm from "@/components/InsuranceForm";
import ComparisonTable from "@/components/ComparisonTable";
import SharedInfoPanel from "@/components/SharedInfoPanel";
import { useSharedInfo } from "@/hooks/useSharedInfo";
import type { InsurancePlan } from "@/types/insurance";

const STORAGE_KEY = "car-insurance-plans-v2";

const FEATURES = [
  { Icon: GitCompareArrows, label: "複数プラン比較" },
  { Icon: ShieldCheck,      label: "差異ハイライト" },
  { Icon: FileText,         label: "PDF保存" },
  { Icon: Download,         label: "Excel出力" },
] as const;

export default function Home() {
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<InsurancePlan | null>(null);
  const { info, update, locked, toggleLocked } = useSharedInfo();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPlans(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }, [plans]);

  const handleAdd = (plan: InsurancePlan) => setPlans((prev) => [...prev, plan]);

  const handleDelete = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (editingPlan?.id === id) setEditingPlan(null);
  };

  const handleDuplicate = (id: string) => {
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const copy: InsurancePlan = { ...prev[idx], id: crypto.randomUUID() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const handleEdit   = (plan: InsurancePlan) => setEditingPlan(plan);
  const handleUpdate = (plan: InsurancePlan) => {
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
    setEditingPlan(null);
  };
  const handleCancelEdit = () => setEditingPlan(null);

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-8 space-y-7 pb-20">

      {/* ── Hero ─────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[28px] mt-6 print:hidden fade-up"
        style={{
          background: "linear-gradient(135deg, #061228 0%, #0C2240 40%, #1E3A8A 80%, #1E40AF 100%)",
          boxShadow: "0 20px 60px rgba(30,58,138,0.35), 0 8px 24px rgba(0,0,0,0.2)",
        }}
      >
        {/* decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full opacity-[0.07] blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-indigo-300 rounded-full opacity-[0.07] blur-3xl" />
        </div>

        <div className="relative px-8 sm:px-12 py-10">
          <div className="flex items-start gap-6">
            <div className="shrink-0 bg-white/10 backdrop-blur-sm border border-white/15 p-4 rounded-2xl">
              <Car size={36} className="text-white" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 bg-blue-400/20 border border-blue-300/20 rounded-full px-3 py-1 text-blue-200 text-xs font-medium mb-3">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full" />
                データはすべてブラウザ内に保存・外部送信なし
              </span>
              <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
                くるまくらべメモ
              </h1>
              <p className="text-blue-200 text-lg mt-2 font-medium">
                自動車保険をわかりやすく比較するメモ
              </p>
              <p className="text-blue-300/70 text-sm mt-1">
                見積もり内容をまとめて管理できます
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-8">
            {FEATURES.map(({ Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-blue-100 text-xs font-medium"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Icon size={12} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Shared Info Panel ────────────────────── */}
      <div className="print:hidden fade-up d1">
        <SharedInfoPanel
          info={info}
          locked={locked}
          onUpdate={update}
          onToggleLock={toggleLocked}
        />
      </div>

      {/* ── Insurance Form ───────────────────────── */}
      <div className="print:hidden fade-up d2">
        <InsuranceForm
          onAdd={handleAdd}
          sharedInfo={info}
          sharedInfoLocked={locked}
          editingPlan={editingPlan}
          onUpdate={handleUpdate}
          onCancelEdit={handleCancelEdit}
        />
      </div>

      {/* ── Comparison Table ─────────────────────── */}
      <div className="fade-up d3">
        <ComparisonTable
          plans={plans}
          sharedInfo={info}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onEdit={handleEdit}
          editingPlanId={editingPlan?.id}
        />
      </div>

      {plans.length === 0 && (
        <div className="text-center py-20 fade-up d4">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5"
            style={{ background: "var(--c-sky)", boxShadow: "var(--sh-sm)" }}
          >
            <Car size={36} className="text-blue-300" />
          </div>
          <p className="text-[var(--c-text-3)] text-sm leading-relaxed">
            上のフォームから保険プランを追加すると<br />
            ここに比較テーブルが表示されます
          </p>
        </div>
      )}
    </div>
  );
}
