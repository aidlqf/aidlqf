import { workbook } from './workbook-data.js';

const chapters = [
  { id:'setup', title:'Set up & constants', short:'Setup', description:'Configure Excel and enter every fixed input.' },
  { id:'forward', title:'Initial forward pass', short:'Forward pass', description:'Calculate hidden activations, output activations, and predictions.' },
  { id:'error', title:'Initial total error', short:'Total error', description:'Measure each output error and add them together.' },
  { id:'output', title:'Output-layer backward pass', short:'Output gradients', description:'Differentiate through o1 and o2, then update w5–w8.' },
  { id:'hidden', title:'Hidden-layer backward pass', short:'Hidden gradients', description:'Send error back to h1 and h2, then update w1–w4.' },
  { id:'rounds', title:'Training rounds 1–3', short:'Rounds 1–3', description:'Copy the updated weights from the previous round and check the results.' },
  { id:'compare', title:'Build Sheet1 comparison', short:'Comparison', description:'Collect the weights and calculate both rounds of differences.' },
  { id:'finish', title:'Final checks & submission', short:'Finish', description:'Check the learning trend, optionally inspect round4, and save.' }
];

const steps = [];
const chapterById = Object.fromEntries(chapters.map(c => [c.id,c]));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = value => typeof value === 'number' ? value.toFixed(9) : String(value ?? '—');
const data = (sheet,cell) => workbook[sheet]?.[cell] || {};

function add(chapter,title,options={}){
  steps.push({ id:steps.length, chapter, title, ...options });
}
function formula(chapter,sheet,cell,title,instruction,note='',tip=''){
  const d=data(sheet,cell);
  add(chapter,title,{sheet,cell,instruction,formula:String(d.formula),expected:fmt(d.value),note,tip});
}
function input(chapter,sheet,cell,title,instruction,note=''){
  const d=data(sheet,cell);
  add(chapter,title,{sheet,cell,instruction,formula:String(d.formula),expected:`Entered value: ${d.formula}`,note});
}
function action(chapter,title,instruction,actionText,expected,note='',sheet='',cell=''){
  add(chapter,title,{sheet,cell,instruction,formula:actionText,expected,copyable:false,note});
}

// 01 — Setup and fixed values
add('setup','Open Excel and enable calculation',{instruction:'Open your copy in desktop Excel. If a yellow banner appears, choose <strong>Enable Editing</strong>. Then go to <strong>Formulas → Calculation Options → Automatic</strong>.',expected:'Workbook tabs are editable and formulas recalculate automatically.',tip:'If results do not refresh later, press F9.'});
add('setup','Learn the workbook map',{instruction:'Find the tabs <strong>initial, round1, round2, round3, round4, Sheet1</strong>. Open <strong>initial</strong>. Practice selecting cell <strong>Q17</strong> by typing Q17 into the Name Box left of the formula bar and pressing Enter.',sheet:'initial',cell:'Q17',expected:'Q17 is selected; its formula is visible in the formula bar.',note:'In this manual, a reference such as initial!Q17 means “cell Q17 on the initial sheet.”'});

const constants = [
  ['M5','Learning rate η','Set the learning rate used by every weight update.'],
  ['I8','Input i1','Enter the first training input.'],['I10','Input i2','Enter the second training input.'],
  ['K8','Initial weight w1','w1 connects i1 to h1.'],['K9','Initial weight w2','w2 connects i2 to h1.'],
  ['K10','Initial weight w3','w3 connects i1 to h2.'],['K11','Initial weight w4','w4 connects i2 to h2.'],
  ['N8','Initial weight w5','w5 connects h1 to o1.'],['N9','Initial weight w6','w6 connects h2 to o1.'],
  ['N10','Initial weight w7','w7 connects h1 to o2.'],['N11','Initial weight w8','w8 connects h2 to o2.'],
  ['K14','Hidden-layer bias b1','The same bias b1 is used in both hidden-neuron net inputs.'],
  ['N14','Output-layer bias b2','The same bias b2 is used in both output-neuron net inputs.'],
  ['P8','Target for o1','Enter target_o1.'],['P10','Target for o2','Enter target_o2.']
];
constants.forEach(([cell,title,note])=>input('setup','initial',cell,title,`Select <strong>initial!${cell}</strong>. Type the value shown below and press <strong>Enter</strong>.`,note));

// 02 — Initial forward pass
const forwardSteps = [
 ['I16','Multiply w1 × i1','This is the first weighted input to h1.'],
 ['I17','Multiply w2 × i2','This is the second weighted input to h1.'],
 ['J17','Calculate net_h1','Add both weighted inputs and bias b1. The multiplication by 1 makes the bias input explicit.'],
 ['K17','Carry net_h1 forward','This helper cell stores the value that enters the sigmoid.'],
 ['L17','Activate h1 with sigmoid','Excel’s EXP(-K17) calculates e raised to −net_h1.'],
 ['I18','Multiply w3 × i1','This is the first weighted input to h2.'],
 ['I19','Multiply w4 × i2','This is the second weighted input to h2.'],
 ['J19','Calculate net_h2','Add both weighted inputs and the same hidden bias b1.'],
 ['K19','Carry net_h2 forward','This helper cell stores the value that enters the sigmoid.'],
 ['L19','Activate h2 with sigmoid','The result out_h2 should be close to, but not equal to, out_h1.'],
 ['N16','Multiply out_h1 × w5','This is h1’s contribution to o1.'],
 ['N17','Multiply out_h2 × w6','This is h2’s contribution to o1.'],
 ['O17','Calculate net_o1','Add the two hidden contributions and output bias b2.'],
 ['P17','Carry net_o1 forward','This helper cell stores the value that enters the output sigmoid.'],
 ['Q17','Predict out_o1','This is the network prediction for output 1.'],
 ['N19','Multiply out_h1 × w7','This is h1’s contribution to o2.'],
 ['N20','Multiply out_h2 × w8','This is h2’s contribution to o2.'],
 ['O20','Calculate net_o2','Add the two hidden contributions and output bias b2.'],
 ['P20','Carry net_o2 forward','This helper cell stores the value that enters the output sigmoid.'],
 ['Q20','Predict out_o2','This is the network prediction for output 2.']
];
forwardSteps.forEach(([cell,title,note])=>formula('forward','initial',cell,title,`On <strong>initial</strong>, select <strong>${cell}</strong>. Enter the formula exactly and press <strong>Enter</strong>.`,note));

// 03 — Error
formula('error','initial','S8','Calculate error E_o1','Select <strong>initial!S8</strong>. Enter the squared-error formula and press <strong>Enter</strong>.','The factor 1/2 simplifies the derivative during backpropagation.');
formula('error','initial','S10','Calculate error E_o2','Select <strong>initial!S10</strong>. Enter the squared-error formula and press <strong>Enter</strong>.','This compares out_o2 with target_o2 = 0.99.');
formula('error','initial','U8','Calculate total error','Select <strong>initial!U8</strong>. Add the two output errors and press <strong>Enter</strong>.','Checkpoint: this should match the PDF’s initial total error, allowing for display rounding.');

// 04 — Output-layer backward pass
const outputSteps = [
 ['Q23','Find ∂E_total/∂out_o1','This is −(target_o1 − out_o1). The positive sign means out_o1 is above its target.'],
 ['P23','Find sigmoid derivative for o1','Use out_o1 × (1 − out_o1).'],
 ['O23','Bring out_h1 into the w5 chain','For w5, ∂net_o1/∂w5 = out_h1.'],
 ['N23','Calculate gradient ∂E_total/∂w5','Multiply the three links in the chain rule.'],
 ['M23','Update weight w5','Subtract learning rate × gradient from the old w5 in N8.'],
 ['O24','Bring out_h2 into the w6 chain','For w6, ∂net_o1/∂w6 = out_h2.'],
 ['N24','Calculate gradient ∂E_total/∂w6','Reuse the o1 derivatives in Q23 and P23.'],
 ['M24','Update weight w6','Subtract learning rate × gradient from the old w6 in N9.'],
 ['Q25','Find ∂E_total/∂out_o2','This is −(target_o2 − out_o2). The negative sign means out_o2 is below its target.'],
 ['P25','Find sigmoid derivative for o2','Use out_o2 × (1 − out_o2).'],
 ['O25','Bring out_h1 into the w7 chain','For w7, ∂net_o2/∂w7 = out_h1.'],
 ['N25','Calculate gradient ∂E_total/∂w7','Multiply the three links in the o2 chain.'],
 ['M25','Update weight w7','A negative gradient makes the updated weight larger than old w7.'],
 ['O26','Bring out_h2 into the w8 chain','For w8, ∂net_o2/∂w8 = out_h2.'],
 ['N26','Calculate gradient ∂E_total/∂w8','Reuse the o2 derivatives in Q25 and P25.'],
 ['M26','Update weight w8','A negative gradient makes the updated weight larger than old w8.']
];
outputSteps.forEach(([cell,title,note])=>formula('output','initial',cell,title,`On <strong>initial</strong>, select <strong>${cell}</strong>. Enter the formula exactly and press <strong>Enter</strong>.`,note));

// 05 — Hidden-layer backward pass
const hiddenSteps = [
 ['J24','Calculate δo1','This product is ∂E_total/∂net_o1, often called delta o1.'],
 ['J25','Calculate δo2','This product is ∂E_total/∂net_o2, often called delta o2.'],
 ['I23','Send o1 error to h1 via w5','Use the old forward-pass weight in N8.'],
 ['I24','Send o1 error to h2 via w6','Use the old forward-pass weight in N9.'],
 ['I25','Send o2 error to h1 via w7','Use the old forward-pass weight in N10.'],
 ['I26','Send o2 error to h2 via w8','Use the old forward-pass weight in N11.'],
 ['H23','Total error reaching out_h1','Add the contribution arriving from o1 and the contribution arriving from o2.'],
 ['H25','Total error reaching out_h2','Add both output-neuron contributions for h2.'],
 ['G23','Find sigmoid derivative for h1','Use out_h1 × (1 − out_h1). O23 contains out_h1.'],
 ['G25','Find sigmoid derivative for h2','Use out_h2 × (1 − out_h2). O24 contains out_h2.'],
 ['F23','Calculate gradient ∂E_total/∂w1','Multiply hidden error, hidden sigmoid derivative, and input i1.'],
 ['F24','Calculate gradient ∂E_total/∂w2','Use the same h1 derivatives, but multiply by input i2.'],
 ['F25','Calculate gradient ∂E_total/∂w3','Multiply h2 error, h2 sigmoid derivative, and input i1.'],
 ['F26','Calculate gradient ∂E_total/∂w4','Use the same h2 derivatives, but multiply by input i2.'],
 ['E23','Update weight w1','$M$5 is an absolute reference to the learning rate.'],
 ['E24','Update weight w2','The new value becomes round1!K9.'],
 ['E25','Update weight w3','The new value becomes round1!K10.'],
 ['E26','Update weight w4','The new value becomes round1!K11.']
];
hiddenSteps.forEach(([cell,title,note])=>formula('hidden','initial',cell,title,`On <strong>initial</strong>, select <strong>${cell}</strong>. Enter the formula exactly and press <strong>Enter</strong>.`,note));

// 06 — Repeat for rounds 1–3
const linkCells = ['K8','K9','K10','K11','N8','N9','N10','N11'];
const weightNames = ['w1','w2','w3','w4','w5','w6','w7','w8'];
for(let round=1;round<=3;round++){
  const sheet=`round${round}`, previous=round===1?'initial':`round${round-1}`;
  add('rounds',`Open ${sheet} and check fixed values`,{sheet,instruction:`Open <strong>${sheet}</strong>. Confirm <strong>M5 = 0.5</strong>, <strong>I8 = 0.05</strong>, <strong>I10 = 0.10</strong>, <strong>P8 = 0.01</strong>, <strong>P10 = 0.99</strong>, <strong>K14 = 0.35</strong>, and <strong>N14 = 0.60</strong>. Do not link or change these constants.`,expected:'Learning rate, inputs, targets, and biases are unchanged from the initial sheet.',note:`Only the eight weights arrive from ${previous}.`});
  linkCells.forEach((cell,i)=>formula('rounds',sheet,cell,`${sheet}: link updated ${weightNames[i]}`,`Select <strong>${sheet}!${cell}</strong>. Enter the cross-sheet formula and press <strong>Enter</strong>.`,`This carries ${weightNames[i]} from the previous round’s update cells into ${sheet}’s forward pass.`));
  const d=workbook[sheet];
  action('rounds',`${sheet}: checkpoint`,`Press <strong>F9</strong> if needed. Check <strong>Q17</strong>, <strong>Q20</strong>, and <strong>U8</strong>. Then confirm all eight updated weights in <strong>E23:E26</strong> and <strong>M23:M26</strong> contain numbers, not errors.`,`${sheet}!Q17 / Q20 / U8`,`Q17 = ${fmt(d.Q17.value)} · Q20 = ${fmt(d.Q20.value)} · E_total = ${fmt(d.U8.value)}`,`Total error should be lower than ${previous}. Keep every formula; do not type these answers over cells.`,sheet,'U8');
}

// 07 — Sheet1 comparison
input('compare','Sheet1','N6','Label the first comparison','On <strong>Sheet1</strong>, select <strong>N6</strong>. Type the label shown and press <strong>Enter</strong>.','N6:Q6 is merged in the supplied workbook. This comparison is round1 minus initial.');
input('compare','Sheet1','S6','Label the second comparison','Select <strong>Sheet1!S6</strong>. Type the label shown and press <strong>Enter</strong>.','S6:V6 is merged. This comparison is round2 minus round1.');
const comparisonCols = [
 ['E','initial!E23','new w1–w4 from initial'],['F','initial!M23','new w5–w8 from initial'],
 ['H','round1!E23','new w1–w4 from round1'],['I','round1!M23','new w5–w8 from round1'],
 ['K','round2!E23','new w1–w4 from round2'],['L','round2!M23','new w5–w8 from round2'],
 ['N','H7-E7','first-round change in w1–w4'],['O','I7-F7','first-round change in w5–w8'],
 ['S','K7-H7','second-round change in w1–w4'],['T','L7-I7','second-round change in w5–w8']
];
comparisonCols.forEach(([col,,purpose])=>{
  formula('compare','Sheet1',`${col}7`,`Sheet1: enter ${col}7`,`Select <strong>Sheet1!${col}7</strong>. Enter the formula and press <strong>Enter</strong>.`,`Purpose: ${purpose}.`);
  const vals=[8,9,10].map(r=>fmt(data('Sheet1',`${col}${r}`).value)).join(' · ');
  action('compare',`Sheet1: fill ${col}7 down`,`Select <strong>${col}7:${col}10</strong>, including the formula already in ${col}7. Press <strong>Ctrl + D</strong> (or choose <strong>Home → Fill → Down</strong>).`,`Fill ${col}7  →  ${col}8:${col}10`,`Row 8 = ${vals.split(' · ')[0]} · Row 9 = ${vals.split(' · ')[1]} · Row 10 = ${vals.split(' · ')[2]}`,'Relative row references adjust automatically. On a Mac, Command + D also fills down.','Sheet1',`${col}7:${col}10`);
});

// 08 — Finish
const r4=workbook.round4;
action('finish','Optional: inspect round4','Open <strong>round4</strong>. Confirm its eight weight cells link to <strong>round3</strong>. Compare its total error with round3. This sheet is an extra continuation beyond the assessed initial + rounds 1–3 route.','round4!U8',`round4 E_total = ${fmt(r4.U8.value)}`,'Do not accidentally make round4 link to initial; the chain must remain consecutive.','round4','U8');
action('finish','Verify that learning is reducing error','Open each calculation tab and read <strong>U8</strong> in order: initial, round1, round2, round3. Also verify Q17 moves downward toward 0.01 while Q20 moves upward toward 0.99.','initial → round1 → round2 → round3',`${fmt(workbook.initial.U8.value)} → ${fmt(workbook.round1.U8.value)} → ${fmt(workbook.round2.U8.value)} → ${fmt(workbook.round3.U8.value)}`,'The total error should strictly decrease across these four checkpoints.');
action('finish','Save your completed assessment','Press <strong>Ctrl + S</strong>. Use the <strong>Answer key</strong> to record the requested initial round and rounds 1–3 calculations. Check the formula bar on several answers to ensure you retained formulas rather than typed values.','Save YourName_Backpropagation_Lab.xlsx','Workbook saved with formulas, updated weights, error values, and Sheet1 comparisons intact.','Keep the original source workbook as a separate backup.');

// UI state
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let currentView='overview';
let currentStep=0;
let completed=new Set();
try{
  const saved=JSON.parse(localStorage.getItem('bp-manual-progress') || '{}');
  completed=new Set(Array.isArray(saved.completed)?saved.completed:[]);
  currentStep=Number.isInteger(saved.currentStep)?Math.max(0,Math.min(steps.length-1,saved.currentStep)):0;
}catch(e){ console.warn('Progress could not be restored.'); }
function saveProgress(){
  try{ localStorage.setItem('bp-manual-progress',JSON.stringify({completed:[...completed],currentStep})); }
  catch(e){ console.warn('Progress could not be saved.'); }
}
let toastTimer;
function toast(message){
  const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),1800);
}
function copyText(text){
  if(navigator.clipboard?.writeText){ navigator.clipboard.writeText(text).then(()=>toast('Copied to clipboard')).catch(()=>fallbackCopy(text)); }
  else fallbackCopy(text);
}
function fallbackCopy(text){
  const area=document.createElement('textarea'); area.value=text; area.style.position='fixed'; area.style.opacity='0'; document.body.appendChild(area); area.select();
  try{ document.execCommand('copy'); toast('Copied to clipboard'); }catch(e){ toast('Select and copy the text manually'); }
  area.remove();
}
function updateProgress(){
  const valid=[...completed].filter(id=>id>=0&&id<steps.length).length;
  const percent=Math.round(valid/steps.length*100);
  $('#progress-percent').textContent=`${percent}%`; $('#progress-bar').style.width=`${percent}%`;
  $('#progress-detail').textContent=valid?`${valid} of ${steps.length} operations completed`:'No steps completed yet';
  $('#nav-step-count').textContent=`${valid} / ${steps.length}`;
  renderChapters();
}
function renderChapters(){
  $('#chapter-nav').innerHTML=chapters.map((c,i)=>{
    const items=steps.filter(s=>s.chapter===c.id), done=items.filter(s=>completed.has(s.id)).length;
    return `<button class="chapter-button" data-chapter="${c.id}"><span class="chapter-number">${String(i+1).padStart(2,'0')}</span><span>${esc(c.short)}</span><span class="chapter-check">${done===items.length?'✓':done?`${done}/${items.length}`:''}</span></button>`;
  }).join('');
  $$('.chapter-button').forEach(b=>b.addEventListener('click',()=>{ const first=steps.find(s=>s.chapter===b.dataset.chapter); goToStep(first.id); closeMenu(); }));
}
function renderOverview(){
  $('#total-steps-meta').textContent=`${steps.length} guided operations`;
  $('#overview-chapters').innerHTML=chapters.map((c,i)=>{
    const count=steps.filter(s=>s.chapter===c.id).length;
    return `<button class="route-row" data-route="${c.id}"><span class="route-number">${String(i+1).padStart(2,'0')}</span><strong>${esc(c.title)}</strong><span>${esc(c.description)}</span><span class="route-count">${count} steps →</span></button>`;
  }).join('');
  $$('.route-row').forEach(b=>b.addEventListener('click',()=>goToStep(steps.find(s=>s.chapter===b.dataset.route).id)));
}
function showView(name,updateHash=true){
  currentView=name;
  $$('.view').forEach(v=>v.classList.toggle('active-view',v.id===`view-${name}`));
  $$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===name));
  if(updateHash) history.replaceState(null,'',`#${name}${name==='guide'?`/${currentStep+1}`:''}`);
  window.scrollTo({top:0,behavior:'auto'});
  if(name==='guide') renderStep();
  if(name==='formulas') renderFormulaLibrary();
  closeMenu();
}
function goToStep(index){
  currentStep=Math.max(0,Math.min(steps.length-1,index)); saveProgress(); showView('guide'); renderStep();
}
function renderStepIndex(filter=''){
  const query=filter.trim().toLowerCase();
  const matching=steps.filter(s=>!query||`${s.id+1} ${s.title} ${s.sheet} ${s.cell} ${s.formula||''} ${chapterById[s.chapter].title}`.toLowerCase().includes(query));
  if(!matching.length){ $('#step-index').innerHTML='<p class="empty-state">No matching steps. Try a cell such as Q17 or a word such as error.</p>'; return; }
  let html='',lastChapter='';
  matching.forEach(s=>{
    if(s.chapter!==lastChapter){ html+=`<div class="index-group">${esc(chapterById[s.chapter].short).toUpperCase()}</div>`; lastChapter=s.chapter; }
    html+=`<button class="index-step ${s.id===currentStep?'active':''}" data-step="${s.id}"><span class="index-number">${String(s.id+1).padStart(3,'0')}</span><span>${esc(s.title)}</span><span class="index-check">${completed.has(s.id)?'✓':''}</span></button>`;
  });
  $('#step-index').innerHTML=html;
  $$('.index-step').forEach(b=>b.addEventListener('click',()=>goToStep(Number(b.dataset.step))));
  const active=$('.index-step.active'); if(active&&!query) active.scrollIntoView({block:'nearest'});
}
function stepMarkup(s,compact=false){
  const chapter=chapterById[s.chapter];
  const formulaBlock=s.formula?`<div class="formula-block"><div class="formula-block-top"><span>${s.copyable===false?'ACTION / RANGE':'ENTER IN EXCEL'}</span>${s.copyable===false?'':`<button class="copy-button" data-copy="${s.id}">Copy formula</button>`}</div><code class="formula">${esc(s.formula)}</code></div>`:'';
  return `<div class="step-card-header"><div class="step-breadcrumb"><span>${esc(chapter.title).toUpperCase()}</span><span>STEP ${s.id+1} OF ${steps.length}</span></div><h2>${esc(s.title)}</h2>${s.sheet||s.cell?`<div class="step-tags">${s.sheet?`<span class="sheet-chip">${esc(s.sheet)}</span>`:''}${s.cell?`<span class="cell-chip">${esc(s.cell)}</span>`:''}</div>`:''}</div><div class="step-card-body"><p class="step-instruction">${s.instruction}</p>${formulaBlock}${s.expected?`<div class="expected-box"><span>EXPECTED RESULT</span><div class="expected-text">${esc(s.expected)}</div></div>`:''}${s.note?`<p class="step-note">${s.note}</p>`:''}${s.tip?`<div class="step-tip">${esc(s.tip)}</div>`:''}${compact?'':`<label class="step-done-label"><input id="step-complete-checkbox" type="checkbox" ${completed.has(s.id)?'checked':''}><span>I entered or verified this operation in Excel.</span></label>`}</div>`;
}
function bindCopyButtons(root=document){
  root.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>copyText(steps[Number(b.dataset.copy)].formula)));
}
function renderStep(){
  const s=steps[currentStep];
  $('#step-card').innerHTML=stepMarkup(s);
  bindCopyButtons($('#step-card'));
  $('#previous-step').disabled=currentStep===0;
  const done=completed.has(s.id);
  $('#complete-step').textContent=currentStep===steps.length-1?(done?'Completed — open answer key':'Mark complete & open answer key'):(done?'Completed · Continue →':'Mark complete & continue →');
  $('#step-complete-checkbox').addEventListener('change',e=>{ if(e.target.checked) completed.add(s.id); else completed.delete(s.id); saveProgress(); updateProgress(); renderStepIndex($('#step-search').value); renderStep(); });
  history.replaceState(null,'',`#guide/${currentStep+1}`);
  renderStepIndex($('#step-search').value);
}
function completeAndContinue(){
  const s=steps[currentStep]; completed.add(s.id); saveProgress(); updateProgress();
  if(currentStep===steps.length-1){ showView('answers'); toast('Manual completed — final answer key opened'); }
  else { currentStep++; saveProgress(); renderStep(); $('#step-card').scrollIntoView({block:'start',behavior:'smooth'}); }
}
function renderAllSteps(){
  $('#all-steps').innerHTML=chapters.map(c=>`<section class="all-steps-chapter"><h3>${esc(c.title)}</h3>${steps.filter(s=>s.chapter===c.id).map(s=>`<article class="all-step-row"><span class="all-step-number">${String(s.id+1).padStart(3,'0')}</span><div><h4>${esc(s.title)} ${s.sheet?`<code>${esc(s.sheet)}!${esc(s.cell||'')}</code>`:''}</h4><p>${s.instruction}</p>${s.formula?`<code>${esc(s.formula)}</code>`:''}${s.expected?`<p><strong>Expected:</strong> ${esc(s.expected)}</p>`:''}</div></article>`).join('')}</section>`).join('');
}
function renderFormulaLibrary(){
  const query=$('#formula-search').value.trim().toLowerCase(), sheet=$('#formula-sheet').value;
  const items=steps.filter(s=>s.formula?.startsWith('=')).filter(s=>(sheet==='all'||s.sheet===sheet)&&(!query||`${s.sheet} ${s.cell} ${s.formula} ${s.title}`.toLowerCase().includes(query)));
  $('#formula-results').innerHTML=items.length?items.map(s=>`<button class="formula-row" data-formula-step="${s.id}"><span class="formula-sheet">${esc(s.sheet)}</span><span class="formula-cell">${esc(s.cell)}</span><code class="formula-code">${esc(s.formula)}</code><span class="formula-purpose">${esc(s.title)}</span><span class="row-arrow">→</span></button>`).join(''):'<p class="empty-state">No formulas match this filter.</p>';
  $$('.formula-row').forEach(b=>b.addEventListener('click',()=>goToStep(Number(b.dataset.formulaStep))));
}
function table(headers,rows){
  return `<div class="table-scroll"><table class="answer-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function renderAnswers(){
  const sheets=['initial','round1','round2','round3','round4'];
  const trendRows=sheets.map(s=>[s,fmt(workbook[s].Q17.value),fmt(workbook[s].Q20.value),fmt(workbook[s].S8.value),fmt(workbook[s].S10.value),fmt(workbook[s].U8.value)]);
  const hiddenRows=['E23','E24','E25','E26'].map((c,i)=>[`w${i+1} / ${c}`,...sheets.map(s=>fmt(workbook[s][c].value))]);
  const outputRows=['M23','M24','M25','M26'].map((c,i)=>[`w${i+5} / ${c}`,...sheets.map(s=>fmt(workbook[s][c].value))]);
  const comparisonRows=[7,8,9,10].map((r,i)=>[`Row ${r} / w${i+1} & w${i+5}`,...['N','O','S','T'].map(c=>fmt(workbook.Sheet1[`${c}${r}`].value))]);
  $('#answer-content').innerHTML=`
    <section class="answer-block"><h2>Predictions and error</h2><p>Required scope ends at round3. Round4 is included as an optional extra check.</p>${table(['Sheet','Q17 · out_o1','Q20 · out_o2','S8 · E_o1','S10 · E_o2','U8 · E_total'],trendRows)}</section>
    <section class="answer-block"><h2>Updated hidden-layer weights</h2><p>Read these from E23:E26 on each sheet.</p>${table(['Weight / cell',...sheets],hiddenRows)}</section>
    <section class="answer-block"><h2>Updated output-layer weights</h2><p>Read these from M23:M26 on each sheet.</p>${table(['Weight / cell',...sheets],outputRows)}</section>
    <section class="answer-block"><h2>Sheet1 differences</h2><p>N/O = round1 − initial. S/T = round2 − round1.</p>${table(['Compared weights','N · hidden Δ1','O · output Δ1','S · hidden Δ2','T · output Δ2'],comparisonRows)}</section>`;
}
function printCurrent(){
  renderAllSteps();
  $$('.view').forEach(v=>v.classList.remove('print-target'));
  $(`#view-${currentView}`).classList.add('print-target');
  window.print();
}
function openMenu(){ $('#sidebar').classList.add('open'); $('#menu-backdrop').hidden=false; $('#menu-open').setAttribute('aria-expanded','true'); $('#menu-close').focus(); }
function closeMenu(){ $('#sidebar').classList.remove('open'); $('#menu-backdrop').hidden=true; $('#menu-open').setAttribute('aria-expanded','false'); }

// Events
$$('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
$('#start-guide').addEventListener('click',()=>goToStep(completed.size?currentStep:0));
$('#previous-step').addEventListener('click',()=>goToStep(currentStep-1));
$('#complete-step').addEventListener('click',completeAndContinue);
$('#step-search').addEventListener('input',e=>renderStepIndex(e.target.value));
$('#formula-search').addEventListener('input',renderFormulaLibrary);
$('#formula-sheet').addEventListener('change',renderFormulaLibrary);
$('#toggle-all-steps').addEventListener('click',()=>{
  const panel=$('#all-steps'), expand=panel.hidden; if(expand) renderAllSteps(); panel.hidden=!expand;
  $('#toggle-all-steps').setAttribute('aria-expanded',String(expand)); $('#toggle-all-steps').innerHTML=expand?'Hide all steps <span>↑</span>':'Show all steps on one page <span>↓</span>';
});
$('#reset-progress').addEventListener('click',()=>{ if(confirm('Reset all completed checkmarks in this browser?')){ completed.clear(); currentStep=0; saveProgress(); updateProgress(); if(currentView==='guide')renderStep(); toast('Progress reset'); } });
['overview-print','mobile-print','guide-print','answers-print'].forEach(id=>$(`#${id}`).addEventListener('click',printCurrent));
$('#menu-open').addEventListener('click',openMenu); $('#menu-close').addEventListener('click',closeMenu); $('#menu-backdrop').addEventListener('click',closeMenu);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeMenu();
  if(currentView==='guide'&&e.altKey&&e.key==='ArrowRight'){e.preventDefault();goToStep(currentStep+1);}
  if(currentView==='guide'&&e.altKey&&e.key==='ArrowLeft'){e.preventDefault();goToStep(currentStep-1);}
});
window.addEventListener('afterprint',()=>$$('.view').forEach(v=>v.classList.remove('print-target')));

// Initial render
renderOverview(); updateProgress(); renderAllSteps(); renderAnswers();
function navigateFromHash(){
  const hash=location.hash.match(/^#(overview|guide|formulas|answers|help)(?:\/(\d+))?/);
  if(hash){ if(hash[2])currentStep=Math.max(0,Math.min(steps.length-1,Number(hash[2])-1)); showView(hash[1],false); }
  else showView('overview',false);
}
window.addEventListener('hashchange',navigateFromHash);
navigateFromHash();
console.info(`Manual ready: ${steps.length} operations across ${chapters.length} chapters.`);
