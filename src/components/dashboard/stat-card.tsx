"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  delta,
  deltaLabel,
  index = 0,
}: {
  label: string;
  value: string;
  /** Elemen ikon yang sudah dirender (mis. <CalendarCheck2 className="size-5" />) —
   * BUKAN referensi komponen, karena prop ini melewati batas Server -> Client Component. */
  icon: React.ReactNode;
  delta?: string;
  deltaLabel?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-8 -right-8 size-28 rounded-full bg-primary/5" />
        <CardContent className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            {delta && (
              <p
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                  "text-success"
                )}
              >
                <ArrowUpRight className="size-3.5" />
                {delta}
                {deltaLabel && <span className="font-normal text-muted-foreground">{deltaLabel}</span>}
              </p>
            )}
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
        </CardContent>
      </Card>
    </motion.div>
  );
}
