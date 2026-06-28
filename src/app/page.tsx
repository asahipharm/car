"use client";

import { useState, useEffect } from "react";
import { Car } from "lucide-react";
import InsuranceForm from "@/components/InsuranceForm";
import ComparisonTable from "@/components/ComparisonTable";
import SharedInfoPanel from "@/components/SharedInfoPanel";
import { useSharedInfo } from "@/hooks/useSharedInfo";
import type { InsurancePlan } from "@/types/insurance";

const STORAGE_KEY = "car-insurance-plans-v2";

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

  const handleAdd = (plan: InsurancePlan) => {
    setPlans((prev) => [...prev, plan]);
  };

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

  const handleEdit = (plan: InsurancePlan) => {
    setEditingPlan(plan);
  };

  const handleUpdate = (plan: InsurancePlan) => {
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
    setEditingPlan(null);
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-5 pb-16">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 px-8 py-7 mt-6 shadow-xl print:hidden">
        {/* 背景の光彩 */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-56 h-56 bg-indigo-400 rounded-full opacity-10 blur-3xl" />

        <div className="relative flex items-center gap-5">
          <div className="shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 p-3.5 rounded-2xl shadow-inner">
            <Car size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              くるまくらべメモ
            </h1>
            <p className="text-blue-200 text-sm mt-0.5">
              自動車保険をわかりやすく比較するメモ
            </p>
            <p className="text-blue-300 text-xs mt-1">
              比較結果をPDFやエクセル形式で保存できます
            </p>
          </div>
        </div>
      </div>

      {/* Sticky shared info panel */}
      <div className="print:hidden">
        <SharedInfoPanel
          info={info}
          locked={locked}
          onUpdate={update}
          onToggleLock={toggleLocked}
        />
      </div>

      {/* Plan form */}
      <div className="print:hidden">
      <InsuranceForm
        onAdd={handleAdd}
        sharedInfo={info}
        sharedInfoLocked={locked}
        editingPlan={editingPlan}
        onUpdate={handleUpdate}
        onCancelEdit={handleCancelEdit}
      />
      </div>

      {/* Comparison table */}
      <ComparisonTable
        plans={plans}
        sharedInfo={info}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onEdit={handleEdit}
        editingPlanId={editingPlan?.id}
      />

      {plans.length === 0 && (
        <div className="text-center py-16 text-slate-400 pb-12">
          <Car size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">上のフォームから保険プランを追加すると<br />ここに比較テーブルが表示されます</p>
        </div>
      )}
    </div>
  );
}
