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
    <div className="space-y-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-100 flex flex-col justify-center min-w-0">
      {/* Hissiyat */}
      <div className="space-y-3 pb-2">
          <div className="flex justify-between items-center gap-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">1. How Does It Fit?</label>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 min-w-[80px] text-center shrink-0">{getFeelLabel(physicalFeel)}</span>
          </div>
          <div className="px-1">
            <Slider defaultValue={[50]} max={100} step={25} value={[physicalFeel]} onValueChange={(val) => setPhysicalFeel(val[0])} className="py-2" />
            <div className="relative w-full flex justify-between mt-2 px-0">
                <div className="flex flex-col items-start w-0 overflow-visible">
                    <span className="text-[9px] text-zinc-400 font-medium uppercase leading-tight whitespace-nowrap text-left">Too<br/>Tight</span>
                </div>
                <div className="flex flex-col items-center w-0 overflow-visible">
                    <span className="text-[9px] text-zinc-400 font-medium uppercase leading-tight whitespace-nowrap text-center">A Bit<br/>Tight</span>
                </div>
                <div className="flex flex-col items-center w-0 overflow-visible">
                    <span className="text-[9px] text-zinc-600 font-bold uppercase leading-tight whitespace-nowrap text-center">Perfect</span>
                </div>
                <div className="flex flex-col items-center w-0 overflow-visible">
                    <span className="text-[9px] text-zinc-400 font-medium uppercase leading-tight whitespace-nowrap text-center">A Bit<br/>Loose</span>
                </div>
                <div className="flex flex-col items-end w-0 overflow-visible">
                    <span className="text-[9px] text-zinc-400 font-medium uppercase leading-tight whitespace-nowrap text-right">Too<br/>Loose</span>
                </div>
            </div>
          </div>
      </div>

      <div className="w-full border-t border-zinc-200 my-1 opacity-50"></div>

      {/* Memnuniyet */}
      <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center gap-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">2. Satisfaction?</label>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 min-w-[80px] text-center shrink-0">{getSatisfactionLabel(satisfaction)}</span>
          </div>
          <div className="px-1">
            <Slider defaultValue={[50]} max={100} step={50} value={[satisfaction]} onValueChange={(val) => setSatisfaction(val[0])} className="py-2" />
            <div className="relative w-full flex justify-between mt-2 px-0">
                <div className="flex flex-col items-start w-0 overflow-visible">
                    <span className="text-[9px] text-zinc-400 font-medium uppercase leading-tight whitespace-nowrap text-left">Want<br/>Looser</span>
                </div>
                <div className="flex flex-col items-center w-0 overflow-visible">
                    <span className="text-[9px] text-zinc-800 font-bold uppercase leading-tight whitespace-nowrap text-center">Perfect</span>
                </div>
                <div className="flex flex-col items-end w-0 overflow-visible">
                    <span className="text-[9px] text-zinc-400 font-medium uppercase leading-tight whitespace-nowrap text-right">Want<br/>Tighter</span>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default FeedbackSliders;
