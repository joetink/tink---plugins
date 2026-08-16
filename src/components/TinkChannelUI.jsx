import React, { useRef, useEffect, useState, useCallback } from 'react';

// Tink Channel Strip - React Wrapper for JSFX
// Props: params object with all slider values, setParam(id, value), meters
// Compatible with ReaJS WASM build compiled via GitHub Actions

const SYNC_NOTES = ["1/64","1/32T","1/32","1/16T","1/16","1/8T","1/8","1/8.","1/4","1/4.","1/2","1/2."];
const CLIP_TYPES = ["Hard","Quintic","Cubic","Tangent","Algebraic","Arctangent"];

export default function TinkChannelUI({ params, setParam, meters, waveform }) {
  const eqRef = useRef(null);
  const clipRef = useRef(null);
  const [dragBand, setDragBand] = useState(-1);
  const [hoverBand, setHoverBand] = useState(-1);

  // Helpers to read params with defaults
  const p = (id, def=0) => params[id] ?? def;
  const isLA2A = p(50)===1, isLA3A = p(50)===2, isSSL = p(50)===3;
  const isProgramComp = isLA2A || isLA3A;
  const isRendering = p(94)===1;

  // EQ bands config
  const bands = [
    {freqId:20, gainId:21, qId:22, typeId:23, label:"B1"},
    {freqId:24, gainId:25, qId:26, typeId:27, label:"B2"},
    {freqId:28, gainId:29, qId:30, typeId:31, label:"B3"},
    {freqId:32, gainId:33, qId:34, typeId:35, label:"B4"},
    {freqId:36, gainId:37, qId:38, typeId:39, label:"B5"},
    {freqId:40, gainId:41, qId:42, typeId:43, label:"B6"},
  ];

  const freqToX = (freq, width) => Math.log(freq/20)/Math.log(20000/20)*width;
  const xToFreq = (x, width) => Math.exp(x/width*Math.log(20000/20)+Math.log(20));
  const gainToY = (gain, height) => height/2 - gain*8;
  const yToGain = (y, height) => (height/2 - y)/8;

  // EQ Canvas
  useEffect(()=>{
    const c = eqRef.current; if(!c) return;
    const ctx = c.getContext('2d');
    const w=c.width, h=c.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle="#1a1a1a"; ctx.fillRect(0,0,w,h);
    // grid
    ctx.strokeStyle="#2a2a2a"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.stroke();
    [20,100,500,2000,10000].forEach(f=>{
      const x=freqToX(f,w); ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
    });
    // bands
    bands.forEach((b,i)=>{
      const freq=p(b.freqId,1000), gain=p(b.gainId,0), q=p(b.qId,1);
      const x=freqToX(freq,w), y=gainToY(gain,h);
      const isDrag = dragBand===i, isHover = hoverBand===i;
      ctx.beginPath();
      ctx.arc(x,y,isDrag?10:6,0,Math.PI*2);
      ctx.fillStyle = isDrag ? "#00ff88" : isHover ? "#66aaff" : "#3399ff";
      ctx.fill();
      ctx.fillStyle="#fff"; ctx.font="10px monospace"; ctx.fillText(`${b.label} ${Math.round(freq)}Hz ${gain.toFixed(1)}dB Q${q.toFixed(1)}`, x+12, y-8);
    });
  }, [params, dragBand, hoverBand]);

  // Clip Waveform - Peakeater view
  useEffect(()=>{
    const c=clipRef.current; if(!c||!waveform) return;
    const ctx=c.getContext('2d'); const w=c.width,h=c.height;
    ctx.clearRect(0,0,w,h); ctx.fillStyle="#0a0a0a"; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle="#00ff66"; ctx.lineWidth=1.5; ctx.beginPath();
    waveform.forEach((v,i)=>{
      const x=i/waveform.length*w, y=h - v*h;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }); ctx.stroke();
    ctx.fillStyle="#666"; ctx.font="10px monospace"; ctx.fillText(`PEAKEATER ${CLIP_TYPES[p(82,0)]} - HardSoft ${Math.round(p(83,0.5)*100)}% - Ceiling 0dB`,10,14);
  }, [waveform, params]);

  const handleEqMouseDown = (e)=>{
    const rect=eqRef.current.getBoundingClientRect();
    const x=e.clientX-rect.left, y=e.clientY-rect.top;
    const w=rect.width;
    let best=-1, bd=1e9;
    bands.forEach((b,i)=>{
      const fx=freqToX(p(b.freqId,1000), w);
      const d=Math.abs(x-fx);
      if(d<bd){bd=d; best=i;}
    });
    if(bd<30) setDragBand(best);
  };
  const handleEqMouseMove = (e)=>{
    if(dragBand===-1){
      const rect=eqRef.current.getBoundingClientRect();
      const x=e.clientX-rect.left; const w=rect.width;
      let best=-1,bd=1e9;
      bands.forEach((b,i)=>{
        const fx=freqToX(p(b.freqId,1000),w);
        const d=Math.abs(x-fx); if(d<bd){bd=d; best=i;}
      });
      setHoverBand(bd<30?best:-1);
      return;
    }
    const rect=eqRef.current.getBoundingClientRect();
    const x=e.clientX-rect.left, y=e.clientY-rect.top;
    const w=rect.width,h=rect.height;
    const newFreq = xToFreq(x,w);
    const newGain = yToGain(y,h);
    const b=bands[dragBand];
    setParam(b.freqId, Math.max(20,Math.min(20000,newFreq)));
    setParam(b.gainId, Math.max(-15,Math.min(15,newGain)));
  };
  const handleWheel = (e)=>{
    if(dragBand===-1&&hoverBand===-1) return;
    const idx = dragBand!==-1?dragBand:hoverBand;
    const b=bands[idx];
    const delta = e.deltaY>0?-0.1:0.1;
    const newQ = Math.max(0.1,Math.min(10,p(b.qId,1)+delta));
    setParam(b.qId,newQ);
  };

  return (
    <div className="tink-channel" style={{background:"#111", color:"#eee", fontFamily:"Inter, sans-serif", padding:16, borderRadius:12}}>
      {isRendering && <div style={{background:"#ffaa00", color:"#000", padding:4, borderRadius:4, marginBottom:8, fontSize:12}}>● 4x OVERSAMPLING ACTIVE - OFFLINE RENDER</div>}
      
      <div style={{display:"grid", gridTemplateColumns:"180px 1fr 180px", gap:16}}>
        {/* Left - Input, Gate, LoFi, Preamp */}
        <div>
          <h4 style={{margin:"8px 0"}}>INPUT / GATE</h4>
          <Knob label="Input" value={p(1)} min={-24} max={24} onChange={v=>setParam(1,v)} />
          <Knob label="Gate Thr" value={p(2)} min={-90} max={-20} onChange={v=>setParam(2,v)} />
          <Knob label="Hyst" value={p(3)} min={0} max={12} onChange={v=>setParam(3,v)} />
          <Knob label="Attack" value={p(4)} min={0.1} max={100} onChange={v=>setParam(4,v)} />
          <Knob label="Release" value={p(5)} min={10} max={1000} onChange={v=>setParam(5,v)} />
          <Knob label="Range" value={p(6)} min={-120} max={0} onChange={v=>setParam(6,v)} />
          <Toggle label="Gate Bypass" value={p(7)} onChange={v=>setParam(7,v)} />
          <h4>LOFI - JST Style</h4>
          <Toggle label="LoFi On" value={p(8)} onChange={v=>setParam(8,v)} />
          <Knob label="LoFi Amt" value={p(9)} min={0} max={100} onChange={v=>setParam(9,v)} />
          <h4>PREAMP - d-sat + ADAA</h4>
          <Knob label="Drive" value={p(10)} min={0} max={1} step={0.01} onChange={v=>setParam(10,v)} />
          <Select label="Focus" value={p(11)} options={["Neutral - All","Keep Low - Sat High Only","Keep High - Sat Low Only"]} onChange={v=>setParam(11,v)} />
        </div>

        {/* Center - EQ + Clipper View */}
        <div>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <h4>6-BAND VISUAL EQ - Drag node = Freq/Gain, Wheel = Q</h4>
            <Toggle label="EQ Bypass" value={p(44)} onChange={v=>setParam(44,v)} />
          </div>
          <canvas ref={eqRef} width={700} height={260} onMouseDown={handleEqMouseDown} onMouseMove={handleEqMouseMove} onMouseUp={()=>setDragBand(-1)} onWheel={handleWheel} style={{width:"100%", height:260, background:"#1a1a1a", borderRadius:8, cursor:"grab"}} />
          <div style={{display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginTop:8}}>
            {bands.map(b=>(
              <div key={b.label} style={{background:"#222", padding:6, borderRadius:6, fontSize:11}}>
                <div>{b.label}</div>
                <Select small value={p(b.typeId)} options={["Peak","Shelf/Notch","High/Notch"]} onChange={v=>setParam(b.typeId,v)} />
                <div>Q {p(b.qId,1).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <h4 style={{marginTop:16}}>OUTPUT CLIPPER - Peakeater 6 types + ADAA</h4>
          <canvas ref={clipRef} width={700} height={140} style={{width:"100%", height:140, background:"#0a0a0a", borderRadius:8}} />
          <div style={{display:"flex", gap:12, marginTop:8}}>
            <Knob label="Drive" value={p(80)} min={-24} max={24} onChange={v=>setParam(80,v)} />
            <Knob label="Trim" value={p(81)} min={-24} max={24} onChange={v=>setParam(81,v)} />
            <Select label="Clip Type" value={p(82)} options={CLIP_TYPES} onChange={v=>setParam(82,v)} />
            <Knob label="Hard-Soft" value={p(83)} min={0} max={1} step={0.01} onChange={v=>setParam(83,v)} />
          </div>
        </div>

        {/* Right - Comp, DeEss, Delay */}
        <div>
          <h4>COMP - 4 MODEL SELECTOR</h4>
          <Select label="Model" value={p(50)} options={["1176 FB 1-sample","LA2A FB Dual","LA3A FF","SSL G Auto"]} onChange={v=>setParam(50,v)} />
          <Toggle label="Turbo 100:1 +6dB" value={p(56)} onChange={v=>setParam(56,v)} />
          <Knob label="Thr" value={p(51)} min={-40} max={0} onChange={v=>setParam(51,v)} />
          <Knob label="Ratio" value={p(52)} min={1} max={20} disabled={isProgramComp} onChange={v=>setParam(52,v)} />
          <Knob label={isLA2A||isLA3A?"Attack (Prog)": p(50)===0?"Attack us (0.02-0.8ms)":"Attack ms"} value={p(53)} min={0.02} max={30} disabled={isProgramComp} onChange={v=>setParam(53,v)} />
          <Knob label={isProgramComp?"Release (Prog Dual)": isSSL?"Release Auto<50":"Release ms"} value={p(54)} min={10} max={3000} disabled={isProgramComp} onChange={v=>setParam(54,v)} />
          <Knob label="Makeup" value={p(55)} min={-12} max={24} onChange={v=>setParam(55,v)} />
          <GRMeter current={p(90,0)} max={p(91,0)} label="COMP" />
          
          <h4 style={{marginTop:12}}>DE-ESSER - Wideband SC</h4>
          <Knob label="Freq" value={p(60)} min={1000} max={12000} onChange={v=>setParam(60,v)} />
          <Knob label="Thr Deep" value={p(61)} min={-45} max={0} onChange={v=>setParam(61,v)} />
          <Toggle label="Listen SC" value={p(62)} onChange={v=>setParam(62,v)} />
          <GRMeter current={p(92,0)} max={p(93,0)} label="DE-ESS" color="#cc66ff" />

          <h4 style={{marginTop:12}}>DELAY - Sync Host</h4>
          <Select label="Sync" value={p(71)} options={["Free","Sync Host"]} onChange={v=>setParam(71,v)} />
          {p(71)===0 ? <Knob label="Time ms" value={p(72)} min={1} max={2000} onChange={v=>setParam(72,v)} /> : <Select label="Note" value={p(73)} options={SYNC_NOTES} onChange={v=>setParam(73,v)} />}
          <Knob label="Feedback" value={p(74)} min={0} max={95} onChange={v=>setParam(74,v)} />
          <Knob label="Spread" value={p(75)} min={0} max={100} onChange={v=>setParam(75,v)} />
          <Knob label="Mix" value={p(76)} min={0} max={100} onChange={v=>setParam(76,v)} />
        </div>
      </div>
    </div>
  );
}

function Knob({label, value, min, max, step=0.1, onChange, disabled}){
  return (
    <div style={{opacity:disabled?0.35:1, marginBottom:8}}>
      <div style={{fontSize:11, color:disabled?"#888":"#aaa"}}>{label} {disabled?"(Prog)":""}</div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={e=>onChange(parseFloat(e.target.value))} style={{width:"100%"}} />
      <div style={{fontSize:11, textAlign:"right"}}>{typeof value==="number"?value.toFixed(2):value}</div>
    </div>
  );
}
function Select({label, value, options, onChange, small}){
  return (
    <div style={{marginBottom: small?4:8}}>
      {!small&&<div style={{fontSize:11, color:"#aaa"}}>{label}</div>}
      <select value={value} onChange={e=>onChange(parseInt(e.target.value))} style={{width:"100%", background:"#222", color:"#eee", border:"1px solid #333", borderRadius:4, fontSize: small?10:12}}>
        {options.map((o,i)=><option key={i} value={i}>{o}</option>)}
      </select>
    </div>
  );
}
function Toggle({label, value, onChange}){
  return (
    <label style={{display:"flex", alignItems:"center", gap:6, fontSize:12, margin:"6px 0"}}>
      <input type="checkbox" checked={!!value} onChange={e=>onChange(e.target.checked?1:0)} /> {label}
    </label>
  );
}
function GRMeter({current, max, label, color="#ff4444"}){
  const h = Math.min(60, Math.max(0, -current*2));
  const hMax = Math.min(60, Math.max(0, -max*2));
  return (
    <div style={{background:"#222", padding:6, borderRadius:6, marginTop:6}}>
      <div style={{fontSize:10}}>{label} GR {current.toFixed(1)}dB / Max {max.toFixed(1)}dB (2s)</div>
      <div style={{display:"flex", gap:4, alignItems:"end", height:64, marginTop:4}}>
        <div style={{width:18, height:60, background:"#111", position:"relative"}}>
          <div style={{position:"absolute", bottom:0, width:"100%", height:h, background:color}} />
        </div>
        <div style={{width:6, height:60, background:"#111", position:"relative"}}>
          <div style={{position:"absolute", bottom:hMax, width:"100%", height:3, background:"#ff0"}} />
        </div>
      </div>
    </div>
  );
}
