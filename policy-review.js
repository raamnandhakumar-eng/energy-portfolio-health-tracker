(() => {
  'use strict';
  const unknownState = a => !a.state || /TBD|Multi-state/i.test(a.state);
  function relation(policy, asset) {
    if (policy.match === 'generator') {
      if (/^Operating\b/i.test(asset.status || '') || asset.market === 'ERCOT') return null;
      if (!asset.market || /TBD|ERCOT\s*\//i.test(asset.market)) return 'Unresolved jurisdiction';
      return 'Candidate queue review';
    }
    if (unknownState(asset)) return 'Unresolved geography';
    if (!asset.state.split('/').includes(policy.jurisdiction)) return null;
    return policy.match === 'load' ? 'Supply context only' : 'Geographic context';
  }
  function exposure(policies, assets) {
    return assets.filter(a => policies.some(p => relation(p, a) === 'Candidate queue review'))
      .filter(a => a.count_in_normalized_capacity && Number.isFinite(a.capacity_mw_ac))
      .reduce((sum, a) => sum + a.capacity_mw_ac, 0);
  }
  if (typeof module !== 'undefined' && module.exports) {module.exports = {relation, exposure}; return;}
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key = 'energy-policy-review-v1';
  let app, policies = [], records = {}, storageOK = true, loaded = false;
  try {const value = JSON.parse(localStorage.getItem(key) || '{}'); if (value && typeof value === 'object' && !Array.isArray(value)) records = value;} catch {storageOK = false;}
  function save() {
    try {localStorage.setItem(key, JSON.stringify(records)); storageOK = true;} catch {storageOK = false;}
    $('#policyStorage').textContent = storageOK ? 'Actions are saved in this browser only. Download the brief to share them.' : 'Browser storage unavailable. Download your brief before leaving.';
  }
  const selected = () => policies.filter(p => $('#policyJurisdiction').value === 'all' || p.jurisdiction === $('#policyJurisdiction').value);
  function associations(p) {return app.filterAssets().map(a => ({asset:a, basis:relation(p,a)})).filter(x => x.basis);}
  function render() {
    if (!loaded) return;
    const ps = selected(), assets = app.filterAssets();
    const candidates = assets.filter(a => ps.some(p => relation(p,a) === 'Candidate queue review'));
    const unresolved = assets.filter(a => ps.some(p => /Unresolved/.test(relation(p,a) || '')));
    $('#policyMetrics').innerHTML = [[ps.length,'Policy records'],[candidates.length,'Candidate queue reviews'],[new Intl.NumberFormat('en-US').format(exposure(ps,assets))+' MWac','Candidate capacity, counted once'],[unresolved.length,'Assets with unresolved mapping']].map(([n,t]) => `<div><strong>${esc(n)}</strong><span>${esc(t)}</span></div>`).join('');
    $('#policySummary').textContent = `${assets.length} assets in applied portfolio view. State matches show context, not confirmed obligations. No policy adjustment is applied to the health score.`;
    $('#policyList').innerHTML = ps.map(p => {
      const r = records[p.id] || {}, links = associations(p), today = new Date().toISOString().slice(0,10);
      const stale = (Date.now() - Date.parse(p.last_checked+'T00:00:00Z')) / 86400000 > 30;
      return `<details class="policy-record"><summary><span><strong>${esc(p.title)}</strong><small>${esc(p.jurisdiction)} · ${esc(p.topic)} · ${esc(p.status)}</small></span><span>${links.length} linked / unresolved · ${esc(r.status || 'Open')}${r.due && r.due < today && r.status !== 'Reviewed' ? ' · Overdue' : ''}</span></summary>
        <div class="policy-body"><p><strong>Documented fact:</strong> ${esc(p.fact)}</p><p><strong>Potential impact:</strong> ${esc(p.impact)}</p><p><strong>Applicability:</strong> ${esc(p.scope_note)}</p>
        <p><a href="${esc(p.source_url)}" target="_blank" rel="noreferrer">${esc(p.source_label)} ↗</a> · Source checked ${esc(p.last_checked)}${stale ? ' · Refresh needed (over 30 days)' : ''}</p><p class="policy-note">${esc(p.verification)} Effective date: ${esc(p.effective_date || 'Not assigned')}. ${esc(p.date_note)}</p>
        <h3>Portfolio links</h3>${links.length ? `<ul>${links.map(({asset:a,basis}) => `<li><button class="inline-action" type="button" data-policy-asset="${esc(a.id)}">${esc(a.asset_name)}</button> <span>${esc(basis)}</span></li>`).join('')}</ul>` : '<p>No geographic or candidate match in the selected portfolio. This is a coverage gap, not proof of no exposure.</p>'}
        <h3>Review action</h3><p>${esc(p.action)}</p><form class="review-form" data-policy="${esc(p.id)}"><label>Owner / function<input name="owner" maxlength="120" value="${esc(r.owner || p.owner)}" required></label><label>Review due<input type="date" name="due" value="${esc(r.due || '')}"></label><label>Review status<select name="status">${['Open','In progress','Blocked','Reviewed'].map(s => `<option${s === (r.status || 'Open') ? ' selected' : ''}>${s}</option>`).join('')}</select></label><label class="review-wide">Evidence / decision<textarea name="evidence" maxlength="2000" rows="2">${esc(r.evidence || '')}</textarea></label><button class="button" type="submit">Save review</button><span class="policy-note">Suggested functional owner. Review status does not alter legal status.</span></form></div></details>`;
    }).join('');
    save();
  }
  function exportBrief() {
    const lines = ['# Policy & regulatory portfolio review', `Exported: ${new Date().toISOString()}`,`Portfolio filters: ${JSON.stringify(app.state && Object.fromEntries(['scope','market','tech','risk','scenario'].map(k=>[k,app.state[k]])))}`,`Policy geography filter: ${$('#policyJurisdiction').value}`, 'Screening only. Source snapshot is manually maintained. Geographic links are not confirmed legal applicability. No quantified cost or COD change is inferred.', ...selected().flatMap(p => {const r=records[p.id]||{}; return ['',`## ${p.title}`,`Jurisdiction: ${p.jurisdiction}; source status: ${p.status}`,`Checked: ${p.last_checked}; effective date: ${p.effective_date || 'Not assigned'}`,p.date_note,p.verification,`Fact: ${p.fact}`,`Potential impact: ${p.impact}`,`Applicability: ${p.scope_note}`,`Source: ${p.source_url}`,`Next: ${p.action}`,`Owner: ${r.owner||p.owner}; due: ${r.due||'Not set'}; review status: ${r.status||'Open'}`,`Evidence: ${r.evidence||'Not recorded'}`, ...associations(p).map(x=>`- ${x.asset.asset_name}: ${x.basis}`)];})];
    const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/markdown'})), a=document.createElement('a'); a.href=url;a.download='energy-policy-review.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function load() {
    $('#policyList').textContent='Loading policy sources…';
    try {const response=await fetch('/data/policies.json');if(!response.ok)throw new Error('Load failed');const data=await response.json();if(!Array.isArray(data.policies))throw new Error('Invalid data');policies=data.policies;loaded=true;$('#exportPolicy').disabled=false;render();}
    catch {$('#policyList').innerHTML='<p role="alert">Policy sources could not load. Your portfolio is still available.</p><button id="retryPolicy" class="button">Retry policy data</button>';$('#retryPolicy').onclick=load;}
  }
  function boot() {
    if(app || !window.PortfolioApp)return;
    app=window.PortfolioApp;
    const section=document.createElement('section');section.id='policy';section.className='ops-section policy-review';
    section.innerHTML=`<div class="section-heading"><div><span class="card-kicker">Federal · Virginia · Texas · California</span><h2>Policy &amp; regulatory risk</h2><p>Connect policy evidence to portfolio review actions.</p></div><button id="exportPolicy" class="button secondary" disabled>Download policy brief</button></div><div class="card review-panel"><div class="review-controls"><label>Policy jurisdiction<select id="policyJurisdiction"><option value="all">All jurisdictions</option><option value="Federal">Federal</option><option value="VA">Virginia</option><option value="TX">Texas</option><option value="CA">California</option></select></label><a href="/docs/POLICY_MODEL.md" target="_blank" rel="noreferrer">Coverage &amp; methodology</a></div><p id="policySummary"></p><div id="policyMetrics" class="policy-metrics" aria-live="polite"></div><p class="policy-note">Four manually curated source records. No automatic policy feed. Utility-specific tariffs, permitting and other states remain outside this first release.</p></div><div id="policyList"></div><p id="policyStorage" role="status"></p>`;
    $('#assets').before(section);
    const nav=document.createElement('a');nav.href='#policy';nav.className='nav-item';nav.textContent='Policy & Regulatory Risk';$('.side-nav').append(nav);
    const overview=document.createElement('p');overview.className='policy-overview';overview.innerHTML='<a href="#policy">Policy review →</a> Federal and state source checks, asset context and review actions.';$('#overview').append(overview);
    $('#policyJurisdiction').addEventListener('change',render);$('#exportPolicy').addEventListener('click',exportBrief);
    section.addEventListener('submit',e=>{const form=e.target.closest('[data-policy]');if(!form)return;e.preventDefault();const r=Object.fromEntries(new FormData(form));form.elements.evidence.setCustomValidity(r.status==='Reviewed'&&!r.evidence.trim()?'Add evidence before marking reviewed.':'');if(!form.reportValidity())return;records[form.dataset.policy]={...r,updated:new Date().toISOString()};save();const id=form.dataset.policy;render();const next=section.querySelector(`[data-policy="${id}"]`);next.closest('details').open=true;next.querySelector('button').focus();});
    section.addEventListener('input',e=>{const form=e.target.closest('form');if(form)form.elements.evidence.setCustomValidity('');});
    section.addEventListener('click',e=>{const b=e.target.closest('[data-policy-asset]');if(b)window.PortfolioApp.openAsset(b.dataset.policyAsset);});
    window.PolicyReview={assetHTML(a){const matches=policies.map(p=>({p,basis:relation(p,a)})).filter(x=>x.basis);return `<h3>Policy &amp; regulatory context</h3>${!loaded?'<p>Policy sources are not loaded.</p>':matches.length?`<ul>${matches.map(({p,basis})=>`<li>${esc(p.title)}: ${esc(basis)}</li>`).join('')}</ul>`:'<p>No match in the four-record policy catalog. Coverage is incomplete.</p>'}<p>Screening context only. See Policy &amp; Regulatory Risk for sources and review actions.</p>`;}};
    load();
  }
  document.addEventListener('portfolio:updated',()=>{boot();if(app){app=window.PortfolioApp;render();}});boot();
})();
