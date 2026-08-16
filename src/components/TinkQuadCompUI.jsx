import React from 'react';
export default function TinkQuadCompUI({params={}, setParam=()=>{}}){
  const p=(id,d=0)=>params[id]??d;
  const isProg=p(10)===1||p(10)===2;
  const models=["1176 FB 1-sample","LA2A FB Dual","LA3A FF","SSL G Auto"];
  return (
    <div style={{background:"#111", color:"#eee", padding:16, borderRadius:12, fontFamily:"Inter", width:500}}>
      <h3>QUAD COMPRESSOR - 1176 / LA2A / LA3A / SSL</h3>
      <div style={{background:p(22)?"#ffaa00":"#222", color:p(22)?"#000":"#aaa", padding:4, borderRadius:4, fontSize:11, marginBottom:8}}>{p(22)?"● 4x OS ACTIVE RENDER":"Realtime 1x - Zero Latency"}</div>
      <label>Model</label>
      <select value={p(10)} onChange={e=>setParam(10,parseInt(e.target.value))} style={{width:"100%", background:"#222", color:"#fff", padding:8, borderRadius:6}}>
        {models.map((m,i)=><option key={i} value={i}>{m}</option>)}
      </select>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12}}>
        <div><label>Input dB</label><input type="range" min={-24} max={24} step={0.1} value={p(1)} onChange={e=>setParam(1,parseFloat(e.target.value))} style={{width:"100%"}}/><div>{p(1).toFixed(1)}dB</div></div>
        <div><label>Threshold dB</label><input type="range" min={-40} max={0} step={0.1} value={p(11)} onChange={e=>setParam(11,parseFloat(e.target.value))} style={{width:"100%"}}/><div>{p(11).toFixed(1)}dB</div></div>
        <div style={{opacity:isProg?0.35:1}}><label>Ratio {isProg?"(Prog)":""}</label><input disabled={isProg} type="range" min={1} max={20} step={0.1} value={p(12)} onChange={e=>setParam(12,parseFloat(e.target.value))} style={{width:"100%"}}/><div>{p(12).toFixed(1)}:1</div></div>
        <div style={{opacity:isProg?0.35:1}}><label>Attack {p(10)===0?"us 20-800":"ms"} {isProg?"(Prog)":""}</label><input disabled={isProg} type="range" min={0.02} max={30} step={0.01} value={p(13)} onChange={e=>setParam(13,parseFloat(e.target.value))} style={{width:"100%"}}/><div>{p(13)}ms</div></div>
        <div style={{opacity:isProg?0.35:1}}><label>Release {isProg?"(Prog Dual)":""}</label><input disabled={isProg} type="range" min={10} max={3000} step={1} value={p(14)} onChange={e=>setParam(14,parseFloat(e.target.value))} style={{width:"100%"}}/><div>{p(14)}ms</div></div>
        <div><label>Makeup dB</label><input type="range" min={-12} max={24} step={0.1} value={p(15)} onChange={e=>setParam(15,parseFloat(e.target.value))} style={{width:"100%"}}/><div>{p(15).toFixed(1)}dB</div></div>
        <div><label>Mix %</label><input type="range" min={0} max={100} step={1} value={p(18)} onChange={e=>setParam(18,parseFloat(e.target.value))} style={{width:"100%"}}/><div>{p(18)}%</div></div>
      </div>
      <label style={{display:"flex", gap:6, marginTop:12}}><input type="checkbox" checked={!!p(16)} onChange={e=>setParam(16,e.target.checked?1:0)}/> Turbo 100:1 +6dB</label>
      <div style={{background:"#222", padding:8, borderRadius:8, marginTop:12}}>
        <div style={{fontSize:11}}>GR Current {p(20).toFixed(1)}dB / Max 2s {p(21).toFixed(1)}dB</div>
        <div style={{height:60, background:"#111", position:"relative", marginTop:6}}>
          <div style={{position:"absolute", bottom:0, width:"100%", height:Math.min(60,-p(20)*2), background:"#ff4444"}}/>
          <div style={{position:"absolute", bottom:Math.min(60,-p(21)*2), width:"100%", height:3, background:"#ff0"}}/>
        </div>
      </div>
    </div>
  );
}
