import React from 'react'
import ReactDOM from 'react-dom/client'
import TinkChannelUI from './components/TinkChannelUI.jsx'
import TinkQuadCompUI from './components/TinkQuadCompUI.jsx'

const params = {}
function setParam(id,v){ console.log('set',id,v) }

ReactDOM.createRoot(document.getElementById('root')).render(
  <div style={{padding:20, background:'#000'}}>
    <h1 style={{color:'#fff'}}>Tink Plugins - Local Dev</h1>
    <TinkChannelUI params={params} setParam={setParam} waveform={Array(800).fill(0).map(()=>Math.random()*0.5)} />
    <div style={{height:40}}/>
    <TinkQuadCompUI params={params} setParam={setParam} />
  </div>
)
