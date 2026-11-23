'use strict';
const {states,expenseRows}=require('./expenses');

module.exports=function expenseDesk({root,api,esc,btn,box,money,listView,render,operation,reload,scope}){
 let loaded=null,version=null,records=[],receipts=[],archive=false,dialog=null;
 const selected=new Set();
 const key=(p,m)=>JSON.stringify([p,m]);
 const current=()=>key(...scope())===loaded;
 const rows=()=>current()?expenseRows(records,receipts):[];
 const button=(action,label,id='',style='la-button secondary')=>btn('expense-'+action,label,id,style);
 function set(project,month,ledger,files){
  if(key(project,month)!==key(...scope()))return;
  if(loaded!==key(project,month)||ledger.raw!==version)selected.clear();
  loaded=key(project,month);version=ledger.raw;records=ledger.rows;receipts=files;
 }
 function page(){
  const all=rows(),filters=[{key:'status',label:'报销状态',options:states.map(s=>[s,s])}];
  const v=listView('expenses:'+loaded,all,{filters,search:r=>[r.title,...r.files].join(' '),searchLabel:'费用说明或文件名'});
  const visibleIds=new Set(v.items.map(r=>r.id));
  for(const id of selected)if(!visibleIds.has(id))selected.delete(id);
  const picked=all.filter(r=>selected.has(r.id));
  const advance=(from,to,label)=>'<button type="button" class="la-button secondary" data-act="expense-advance" data-value="'+to+'" '+(picked.length&&picked.every(r=>r.status===from)?'':'disabled')+'>'+label+'</button>';
  const summary=states.slice(1).map(state=>box(state,'<strong>'+money(all.filter(r=>r.status===state).reduce((n,r)=>n+r.cents,0))+'</strong>')).join('');
  const table=v.items.map(r=>`<tr><td><input type="checkbox" aria-label="选择 ${esc(r.title)}" data-expense-select="${esc(r.id)}" ${selected.has(r.id)?'checked':''}></td><td>${button('edit',esc(r.title),r.id,'la-link')}<div class="la-small la-muted">${r.files.length} 份单据 · ${esc(r.files[0])}</div></td><td>${r.cents===null?'待补金额':money(r.cents)}</td><td>${esc(r.status)}</td></tr>`).join('');
  const actions='<div class="edit-actions">已选 '+selected.size+' 笔 '+advance('待提交','待到账','标记已提交')+advance('待到账','已到账','确认到账')+'</div>';
  return '<div class="finance-summary">'+summary+'</div>'+box('费用明细',v.controls+actions+'<div class="ledger-scroll"><table class="ledger-table"><thead><tr><th>选择</th><th>费用 / 单据</th><th>报销金额</th><th>状态</th></tr></thead><tbody>'+table+'</tbody></table></div>'+(table?'':'<p class="la-empty">当前没有符合条件的费用。</p>')+v.pager,button('add','＋ 收单据','','la-button'));
 }
 function close(){dialog?.remove();dialog=null}
 function form(row,initialFiles=[]){
  const [project,month]=scope(),expected=version;
  const files=new Map(),assigned=new Set(records.flatMap(r=>r.files));
  const candidates=receipts.filter(r=>!assigned.has(r.file.name)&&!row?.files.includes(r.file.name));
  const originals=(row?.files||[]).map(name=>{
   const f=receipts.find(r=>r.file.name===name);
   return f?'<button type="button" class="la-link" data-original="'+esc(f._path)+'">'+esc(name)+'</button>':esc(name)+'（文件缺失）';
  });
  dialog=root.ownerDocument.createElement('dialog');dialog.className='la-editor-dialog';dialog.setAttribute('aria-label',row?'编辑报销费用':'收单据');
  dialog.innerHTML=box(row?'编辑报销费用':'收单据',`<form class="expense-form"><p class="la-caption">${esc(month)} · 同一笔费用可附多份单据</p>${originals.join(' · ')}
  <label>添加原始单据<input type="file" multiple></label><div class="expense-pending"></div>
  ${candidates.length?'<details><summary>从本月待整理单据中选择（'+candidates.length+'）</summary>'+candidates.map(r=>'<label><input type="checkbox" value="'+esc(r.file.name)+'"> '+esc(r.file.name)+'</label>').join('')+'</details>':''}
  <label>费用说明<input class="la-input" name="title" maxlength="160" value="${esc(row?.title||'')}" placeholder="可稍后填写"></label>
  <label>报销金额（元）<input class="la-input" name="amount" type="number" min="0.01" step="0.01" value="${row?.cents!=null?(row.cents/100).toFixed(2):''}" ${row&&states.indexOf(row.status)>=2?'readonly':''} placeholder="可稍后填写"></label>
  <p role="alert" class="la-feedback"></p><div class="edit-actions"><button type="button" class="la-button secondary" data-dismiss>取消</button><button type="submit" class="la-button">保存</button></div></form>`);
  root.append(dialog);
  const field=s=>dialog.querySelector(s),feedback=field('[role=alert]'),picker=field('[type=file]');
  let saving=false;
  function add(picks){
   const skipped=[];
   for(const f of picks){if(/\.(md|markdown)$/i.test(f.name)||files.has(f.name)||receipts.some(r=>r.file.name===f.name))skipped.push(f.name);else files.set(f.name,f);}
   field('.expense-pending').textContent=[...files.keys()].join(' · ');
   feedback.textContent=skipped.length?'已跳过同名文件或 Markdown：'+skipped.join('、'):'';
  }
  add(initialFiles);
  picker.onchange=()=>{add(picker.files);picker.value=''};
  dialog.ondragover=e=>e.preventDefault();dialog.ondrop=e=>{e.preventDefault();if(!saving)add(e.dataTransfer.files)};
  dialog.querySelectorAll('[data-original]').forEach(b=>b.onclick=()=>api.open(b.dataset.original).catch(e=>feedback.textContent=e.message));
  field('[data-dismiss]').onclick=()=>{if(!saving)close()};
  dialog.oncancel=e=>{e.preventDefault();if(!saving)close()};
  field('form').onsubmit=async e=>{
   e.preventDefault();if(saving)return;saving=true;
   const controls=[...dialog.querySelectorAll('button,input')];controls.forEach(c=>c.disabled=true);
   try{
    const uploads=await Promise.all([...files.values()].map(async f=>({name:f.name,data:await f.arrayBuffer()})));
    const attach=[...dialog.querySelectorAll('[type=checkbox]:checked')].map(c=>c.value);
    await api.writeExpense(project,month,expected,{id:row?.id,title:field('[name=title]').value,amount:field('[name=amount]').value,attach,uploads});
   }catch(err){feedback.textContent=err.message;controls.forEach(c=>c.disabled=false);saving=false;return}
   close();await operation(reload);
  };
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
 }
 root.addEventListener('change',e=>{const id=e.target.dataset.expenseSelect;if(id){if(e.target.checked)selected.add(id);else selected.delete(id);render()}});
 async function handle(act,value){
  if(act==='expense-view'){archive=value==='archive';selected.clear();render();return}
  if(!current())return;
  if(act==='expense-add')form(null);
  if(act==='expense-edit'){const row=rows().find(r=>r.id===value);if(row)form(row)}
  if(act==='expense-advance'){
   const ids=[...selected];await operation(async()=>{await api.writeExpense(...scope(),version,{action:'advance',target:value,ids});await reload()});
  }
 }
 return {set,page,handle,close,editing:()=>!!dialog,archive:()=>archive,linked:name=>current()&&records.some(r=>r.files.includes(name)),
  tabs:()=>'<div class="la-pills">'+button('view','费用明细','ledger','la-pill '+(!archive?'active':''))+button('view','原始文件','archive','la-pill '+(archive?'active':''))+'</div>'};
};
