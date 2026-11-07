'use strict';
const SIZE=20;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=v=>String(v??'').normalize('NFKC').toLocaleLowerCase();
const date=r=>r.date||r.start||(r.month?r.month+'-01':'');
const end=r=>r.end||r.date||(r.month?r.month+'-31':date(r));
const identity=r=>String(r._path||r.id||r.title||r.file?.name||'');
function compare(sort='modified'){
 return (a,b)=>{
  let n=0;
  if(sort==='date-desc')n=date(b).localeCompare(date(a));
  else if(sort==='date-asc')n=(date(a)+(a.time||'99')).localeCompare(date(b)+(b.time||'99'));
  else if(sort==='time')n=(a.time||'99').localeCompare(b.time||'99');
  else n=(Number(b._mtime)||0)-(Number(a._mtime)||0);
  return n||identity(a).localeCompare(identity(b));
 };
}
function select(rows,state,options={}){
 const q=text(state.query).trim();let error='',from='',to='';
 if(options.dates&&state.period==='month'&&state.month){from=state.month+'-01';to=state.month+'-31';}
 if(options.dates&&state.period==='range'){from=state.from||'';to=state.to||'';if(from&&to&&from>to)error='开始日期不能晚于结束日期。';}
 const matched=rows.filter(r=>!error&&(!q||text(options.search?options.search(r):r.title||r.text||r.file?.name).includes(q))&&(!from||end(r)>=from)&&(!to||date(r)&&date(r)<=to)&&(options.filters||[]).every(f=>{const value=state[f.key];if(!value)return true;const actual=f.value?f.value(r):r[f.key];return f.key==='status'&&value==='__unfinished'?actual!=='已完成':String(actual??'')===value;})).slice().sort(options.compare||compare(options.sort));
 const pages=Math.max(1,Math.ceil(matched.length/SIZE));state.page=Math.min(pages,Math.max(1,Math.trunc(Number(state.page)||1)));
 return {items:matched.slice((state.page-1)*SIZE,state.page*SIZE),matched,total:matched.length,page:state.page,pages,error};
}
function controls(key,state,options={}){
 const attrs=field=>`data-list-key="${esc(key)}" data-list-filter="${field}"`;
 const input=(field,label,type='text')=>`<label>${label}<input class="la-input" type="${type}" ${attrs(field)} value="${esc(state[field])}"${field==='query'?' placeholder="'+esc(options.searchLabel||'搜索标题')+'"':''}></label>`;
 const selectField=(field,label,items)=>{const choices=items.slice();if(state[field]&&!choices.some(([v])=>v===state[field]))choices.push([state[field],state[field]]);return `<label>${label}<select class="la-input" ${attrs(field)}>${choices.map(([v,t])=>`<option value="${esc(v)}"${String(state[field]||'')===v?' selected':''}>${esc(t)}</option>`).join('')}</select></label>`;};
 return `<div class="la-list-controls" data-list-controls="${esc(key)}">${input('query','搜索')}${options.dates?selectField('period','时间范围',[['all','全部时间'],['month','按月'],['range','自定日期']])+(state.period==='month'?input('month','月份','month'):state.period==='range'?input('from','开始日期','date')+input('to','结束日期','date'):''):''}${(options.filters||[]).map(f=>selectField(f.key,f.label,[['','全部'],...f.options])).join('')}<button type="button" class="la-button secondary" data-act="list-clear" data-list-key="${esc(key)}">清除筛选</button></div>`;
}
function pager(key,result){
 const button=(label,p,disabled)=>`<button type="button" class="la-button secondary" data-act="list-page" data-list-key="${esc(key)}" data-value="${p}"${disabled?' disabled':''}>${label}</button>`;
 return `${result.error?`<p class="la-feedback" role="alert">${esc(result.error)}</p>`:''}<div class="la-pagination" data-pagination="${esc(key)}"><span class="la-small la-muted" aria-live="polite">共 ${result.total} 条 · 第 ${result.page} / ${result.pages} 页 · 每页 ${SIZE} 条</span><div>${button('上一页',result.page-1,result.page<=1)}${button('下一页',result.page+1,result.page>=result.pages)}</div></div>`;
}
module.exports={select,controls,pager,compare};
