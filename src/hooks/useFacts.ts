import { useEffect, useState } from "react";
import type { CharFacts } from "@/types";
import { buildStrokeFacts, getStrokeData } from "@/utils/strokes";

/** 加载某字的可查证笔顺事实（几何推导，不含大模型内容） */
export function useFacts(char: string | undefined): CharFacts | null {
  const [facts, setFacts] = useState<CharFacts | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!char) {
      setFacts(null);
      return;
    }
    getStrokeData(char)
      .then((data) => {
        if (cancelled) return;
        setFacts(data ? buildStrokeFacts(char, data) : null);
      })
      .catch(() => {
        if (!cancelled) setFacts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [char]);

  return facts;
}
