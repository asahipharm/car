"use client";

import { useState, useEffect } from "react";
import type { SharedInfo } from "@/types/insurance";
import { DEFAULT_SHARED_INFO } from "@/types/insurance";

const INFO_KEY   = "car-shared-info-v1";
const LOCKED_KEY = "car-shared-info-locked-v1";

export function useSharedInfo() {
  const [info,   setInfo]   = useState<SharedInfo>(DEFAULT_SHARED_INFO);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    try {
      const savedInfo = localStorage.getItem(INFO_KEY);
      if (savedInfo) setInfo(JSON.parse(savedInfo));
      const savedLocked = localStorage.getItem(LOCKED_KEY);
      if (savedLocked) setLocked(JSON.parse(savedLocked));
    } catch { /* ignore */ }
  }, []);

  const update = (next: SharedInfo) => {
    setInfo(next);
    localStorage.setItem(INFO_KEY, JSON.stringify(next));
  };

  const toggleLocked = () => {
    const next = !locked;
    setLocked(next);
    localStorage.setItem(LOCKED_KEY, JSON.stringify(next));
  };

  return { info, update, locked, toggleLocked };
}
