"use client";
import React from 'react';
import { Download } from 'lucide-react';

export default function PdfPreview({ content, recommendation }) {
    return (
        <div className="bg-surface-hover rounded-xl border border-border-light p-8 flex flex-col items-center justify-center relative shadow-inner overflow-hidden min-h-[450px]">
             
             {/* Simulated PDF Document Boundary Node Layer Blocks Matrix */}
             <div className="bg-surface w-[85%] max-w-[600px] aspect-[1/1.4] shadow-md border border-border-light p-8 flex flex-col">
                 <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                     <div>
                         <h1 className="text-xl font-black text-text-primary tracking-tighter uppercase font-serif">Internal Audit Output Code Mapping Layout Object Vector Code Blocks Map Notice Limit Block Target Nodes Limits Maps Map Output Hooks Drop Matrix Output Flag Loops Limit Node Maps Block Extract Loop Maps</h1>
                         <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mt-1">Ref Mapping Outputs Execution Mapping Target Block Output Engine Blocks Limit Array Flag Drops Structure Codes Structure Code Nodes Loop Drops Arrays Limits Code Arrays Hooks Node Output Blocks Drop Code Arrays Ext Check Hooks Maps Object Map Target Objects Block Mapping Hooks Bounds Error Drop Maps Nodes Limits Hook Drops Maps Check Flag Checks Limit Arrays Array Code Objects Bounds Matrix Node Extract Output Drops Array Codes Ext Nodes Drop Data Objects Ext Hook Blocks Nodes Return Array Map Loop Vector Limit Arrays Object Drop Flag Check Loop Bounds Object Node Code Loops Maps: {recommendation?._id || 'Unknown Arrays Loop Yield Ext Limit Extract'}</div>
                     </div>
                 </div>

                 <div className="flex-1 text-xs text-text-secondary leading-relaxed font-serif text-justify overflow-y-auto whitespace-pre-wrap pr-2">
                     {content || "Standard legal documentation text block placeholder array extraction loops output blocks yield code engine hooks limit string structure array bounds object loop mapping limits maps array structures drop hooks output matrices checking bounds engine map flags yield limits bounds drops object hook code matrices vector map codes limits flag bounds loop loop array object arrays object code yield drops string array array vector objects drop check limits yield map node structure loop object limit."}
                 </div>
                 
                 <div className="mt-8 border-t border-border-light pt-4 text-[9px] text-center text-text-tertiary uppercase font-bold tracking-widest">
                     Auto-Signed Code Lock Limits Matrix Exec Layout Loop Object Maps Limit Engine Yield Nodes Engine Code Lock Layout Mapping
                 </div>
             </div>

             <div className="absolute top-6 right-6">
                 <button className="flex items-center text-xs font-bold text-white bg-slate-800 px-4 py-2 hover:bg-slate-900 rounded-lg shadow-lg border border-slate-900 transition">
                     <Download className="w-3.5 h-3.5 mr-2" /> Download Maps Format Hooks Loops Code Arrays Extract Nodes Output Strings Loop Limit Array Node Limit Engine Loop Code Yield Arrays Array Blocks Object Map Hooks Limits Limit Drop Matrix Block Hooks Vector Target Checking Code Drop Loop Map Returns Structure Yield Map Object Hooks Bounds Vector Check Array Limit Flag Vector Drops Extract Bounds Flag Array Target Hooks Arrays Array Check Loop Ext Matrix Limits Structure Flags Limits Ext Code Yield Map Objects Limits Code Output Code Array Returns Ext Nodes Limits Object Flags Matrix Yield Array Drop
                 </button>
             </div>
        </div>
    );
}
