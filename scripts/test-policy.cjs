const assert=require('node:assert/strict');
const {relation,exposure}=require('../policy-review.js');
const {policies}=require('../data/policies.json');
const f=policies.find(p=>p.id==='ferc-2023'),t=policies.find(p=>p.id==='tx-sb6'),v=policies.find(p=>p.jurisdiction==='VA');
const a={state:'TX',market:'ERCOT',status:'Development',capacity_mw_ac:100,count_in_normalized_capacity:true};
assert.equal(relation(f,a),null,'ERCOT supply must not inherit the FERC queue screen');
assert.equal(relation(t,a),'Supply context only','Generation capacity must not imply large-load applicability');
assert.equal(relation(v,a),null);
assert.equal(relation(v,{...a,state:'TBD'}),'Unresolved geography');
assert.equal(relation(f,{...a,market:'ERCOT / SPP / MISO'}),'Unresolved jurisdiction');
assert.equal(relation(f,{...a,market:'PJM',status:'Operating'}),null);
assert.equal(relation(v,{...a,state:'OH/PA'}),null);
const candidate={...a,market:'PJM',state:'OH'};
assert.equal(relation(f,candidate),'Candidate queue review');
assert.equal(exposure([f,f],[candidate]),100,'Multiple matching policies must not double-count capacity');
assert.equal(exposure([f],[{...candidate,capacity_mw_ac:null}]),0);
assert.equal(exposure([t],[a]),0,'Context-only links must not enter candidate capacity');
for(const p of policies){assert.match(p.source_url,/^https:\/\//);assert.match(p.last_checked,/^\d{4}-\d{2}-\d{2}$/);assert.ok(p.fact&&p.impact&&p.scope_note&&p.verification);}
console.log('Policy mapping, capacity and source checks passed.');
