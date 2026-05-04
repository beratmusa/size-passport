import React from 'react';
import { Slider } from "@/components/ui/slider";

const FeedbackSliders = ({
  physicalFeel,
  setPhysicalFeel,
  satisfaction,
  setSatisfaction,
  getFeelLabel,
  getSatisfactionLabel
}) => {
  return (
    <div className="space-y-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-100 flex flex-col justify-center">
      {/* Hissiyat */}
      <div className="space-y-3 pb-2">
          <div className="flex justify-between items-center gap-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-snug">1. How Does It Fit?</label>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 min-w-[80px] text-center shrink-0">{getFeelLabel(physicalFeel)}</span>
          </div>
          <Slider defaultValue={[50]} max={100} step={25} value={[physicalFeel]} onValueChange={(val) => setPhysicalFeel(val[0])} className="py-2" />
          <div className="grid grid-cols-5 text-[9px] text-zinc-400 font-medium uppercase mt-1">
              <span className="text-left leading-tight">Too<br/>Tight</span>
              <span className="text-center leading-tight">A Bit<br/>Tight</span>
              <span className="text-center font-bold text-zinc-600">Perfect</span>
              <span className="text-center leading-tight">A Bit<br/>Loose</span>
              <span className="text-right leading-tight">Too<br/>Loose</span>
          </div>
      </div>

      <div className="w-full border-t border-zinc-200 my-1"></div>

      {/* Memnuniyet */}
      <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center gap-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-snug">2. Are You Satisfied with the Fit?</label>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 min-w-[80px] text-center shrink-0">{getSatisfactionLabel(satisfaction)}</span>
          </div>
          <Slider defaultValue={[50]} max={100} step={50} value={[satisfaction]} onValueChange={(val) => setSatisfaction(val[0])} className="py-2" />
          <div className="flex justify-between text-[9px] text-zinc-400 font-medium uppercase mt-1">
              <span className="text-left w-16 leading-tight">Want<br/>Looser</span>
              <span className="text-center w-auto font-bold text-zinc-800">Perfect</span>
              <span className="text-right w-16 leading-tight">Want<br/>Tighter</span>
          </div>
      </div>
    </div>
  );
};

export default FeedbackSliders;
