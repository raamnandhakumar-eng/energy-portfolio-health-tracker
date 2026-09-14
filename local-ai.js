const $=s=>document.querySelector(s);
let engine,worker,ready=false,busy=false,installed=false,resultContext=null,model='',lastText='';
const timeout=(promise,ms)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('timeout')),ms);})]).finally(()=>clearTimeout(timer));};
function status(text){$('#aiStatus').textContent=text;}
function destroy(){worker?.terminate();worker=null;engine=null;ready=false;}
function controls(){ $('#loadAI').disabled=busy||ready;$('#runAI').disabled=busy||!ready||!window.PortfolioApp?.filterAssets().length;$('#stopAI').disabled=!busy||!ready;$('#unloadAI').disabled=busy||!ready;$('#downloadAI').disabled=busy||!lastText; }
function placeAnalystLast(){queueMicrotask(()=>{const panel=$('#ai'),link=$('.side-nav a[href="#ai"]');if(panel&&panel.nextElementSibling!==$('.workspace > footer'))$('.workspace > footer').before(panel);if(link&&link.nextElementSibling)$('.side-nav').append(link);});}
function changed(){if(!installed)return;placeAnalystLast();controls();if(resultContext){const stale=resultContext.key!==window.EnergyAIContext.context(window.PortfolioApp).key;$('#aiStale').hidden=!stale;}}
function shell(){if(installed||!window.PortfolioApp)return;installed=true;
  const panel=document.createElement('section');panel.id='ai';panel.className='ops-section';panel.innerHTML=`<div class="section-heading"><div><h2>AI portfolio analyst</h2><p>Free, on-device drafts for the current portfolio view.</p></div><span class="section-meta">Local inference</span></div><div class="card local-ai"><p>No API key or per-request charge. Loading downloads a small language model, which can take several minutes and substantial browser storage and GPU memory. Prompts stay on this device; model files come from external hosts.</p><div class="ai-buttons"><button id="loadAI" class="button">Load free AI</button><button id="unloadAI" class="button secondary" disabled>Release GPU memory</button></div><p id="aiStatus" role="status">Not loaded. The standard portfolio and rule-based briefs remain available.</p><progress id="aiProgress" max="1" value="0" hidden aria-label="Model loading progress"></progress><form id="aiForm"><label for="aiTask">Review task</label><select id="aiTask"><option value="brief">Draft leadership brief</option><option value="risks">Explain priority risks</option><option value="handoffs">Suggest team handoffs</option></select><button class="button" id="runAI" disabled>Generate draft</button><button type="button" class="button secondary" id="stopAI" disabled>Stop</button></form><p id="aiStale" class="ai-warning" hidden>Portfolio view changed. This draft belongs to the earlier view. Generate a new draft before using it.</p><div id="aiFacts"></div><p class="monitor-note">A compact local model can make errors. Verify every claim against the source assets. It cannot change portfolio data, close actions or approve procurement.</p><div id="aiOutput" class="ai-output" aria-label="AI draft">Your AI draft will appear here.</div><div id="aiSources"></div><button class="button secondary" id="downloadAI" disabled>Download AI draft</button></div>`;
  $('.workspace > footer').before(panel);const link=document.createElement('a');link.className='nav-item';link.href='#ai';link.textContent='AI analyst';$('.side-nav').append(link);placeAnalystLast();
  $('#loadAI').addEventListener('click',load);$('#unloadAI').addEventListener('click',()=>{destroy();status('GPU memory released. Downloaded files may remain cached for next time.');controls();});
  $('#aiForm').addEventListener('submit',e=>{e.preventDefault();generate();});$('#stopAI').addEventListener('click',()=>{engine?.interruptGenerate();status('Stopping generation…');});
  $('#downloadAI').addEventListener('click',()=>{const text=['AI DRAFT — HUMAN REVIEW REQUIRED',`Model: ${model}`,`View: ${JSON.stringify(resultContext.facts.scope)}`,`Portfolio facts: ${JSON.stringify({...resultContext.facts,assets:undefined})}`,lastText,'Sources supplied:',...resultContext.sources.map(s=>`[${s.ref}] ${s.name}: ${s.url}`)].join('\n\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download='energy-ai-draft.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});controls();
}
async function load(){if(busy||ready)return;busy=true;controls();
  try{if(!navigator.gpu)throw new Error('unsupported');const adapter=await navigator.gpu.requestAdapter();if(!adapter)throw new Error('unsupported');
    model=adapter.features.has('shader-f16')?'Qwen2.5-1.5B-Instruct-q4f16_1-MLC':'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';
    status('Downloading AI runtime and model. Keep this tab open.');$('#aiProgress').hidden=false;
    const lib=await timeout(import('https://esm.run/@mlc-ai/web-llm@0.2.85'),60000);
    worker=new Worker('/ai-worker.js',{type:'module'});engine=new lib.WebWorkerMLCEngine(worker,{initProgressCallback:p=>{status(p.text);$('#aiProgress').value=p.progress;}});
    await timeout(engine.reload(model,{context_window_size:4096}),600000);ready=true;status('Free AI ready. '+model+'. Inference runs on this device.');
  }catch(error){destroy();status(error.message==='unsupported'?'This browser/device does not provide WebGPU. Use a WebGPU-enabled browser or the standard rule-based briefs.':'AI could not load. Check your connection, browser GPU support and available memory, then retry. Standard briefs still work.');}
  finally{busy=false;$('#aiProgress').hidden=true;controls();}
}
async function generate(){if(busy||!ready)return;const data=window.EnergyAIContext.context(window.PortfolioApp);if(!data.facts.rows)return;
  resultContext=data;lastText='';busy=true;controls();$('#aiStale').hidden=true;$('#aiOutput').textContent='';$('#aiSources').replaceChildren();
  $('#aiFacts').textContent=`Model-calculated facts · ${data.facts.rows} rows · ${Math.round(data.facts.normalized_mw_ac).toLocaleString()} MWac · Health ${data.facts.health==null?'N/A':data.facts.health+'/100'} · ${data.facts.scope.scenario} firmness. AI context: up to six priority assets.`;
  const title=document.createElement('h3');title.textContent='Source assets supplied to AI';$('#aiSources').append(title);
  data.sources.forEach(s=>{const p=document.createElement('p'),a=document.createElement('a');a.textContent=`[${s.ref}] ${s.name}`;if(/^https?:\/\//.test(s.url)){a.href=s.url;a.target='_blank';a.rel='noreferrer';}p.append(a);$('#aiSources').append(p);});
  status('Drafting from the selected public-data snapshot…');
  try{const result=await timeout(engine.chat.completions.create({messages:window.EnergyAIContext.messages(data,$('#aiTask').value),temperature:0.2,max_tokens:450,stream:false}),120000);
    lastText=result.choices[0]?.message?.content||'';$('#aiOutput').textContent=lastText||'No draft returned. Try again.';
    const invalid=[...lastText.matchAll(/\[S(\d+)\]/g)].some(m=>Number(m[1])<1||Number(m[1])>data.sources.length);
    status(invalid?'Draft contains an unknown source reference. Do not rely on it; regenerate and check the source assets.':'AI draft complete. Check its claims against the supplied sources before sharing.');
  }catch{destroy();$('#aiOutput').textContent='Generation did not finish. Load the model again or use the standard brief.';status('AI stopped after an error or timeout. Portfolio data is unchanged.');}
  finally{busy=false;controls();changed();}
}
document.addEventListener('portfolio:updated',()=>{shell();changed();});shell();
