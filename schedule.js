'use strict';
const {schemas}=require('./schema');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(act,label,value='',cls='la-button')=>`<button type="button" class="${cls}" data-act="${act}" data-value="${esc(value)}">${label}</button>`;
const options=(items,value)=>items.map(([v,label])=>`<option value="${esc(v)}"${v===value?' selected':''}>${esc(label)}</option>`).join('');
function requirementOptions(rows,requirements){const items=requirements.map(r=>[r.id,r.title]);for(const r of rows)if(r.requirement&&!items.some(([id])=>id===r.requirement))items.push([r.requirement,'原需求已移除']);return items;}
function table(rows,requirements,filters){
 const reqs=requirementOptions(rows,requirements),owners=[...new Set(rows.map(r=>r.owner).filter(Boolean))].sort();
 if(filters.owner&&!owners.includes(filters.owner))owners.push(filters.owner);
 if(filters.requirement&&!reqs.some(([id])=>id===filters.requirement))reqs.push([filters.requirement,'原需求已移除']);
 const visible=rows.filter(r=>(!filters.requirement||r.requirement===filters.requirement)&&(!filters.owner||r.owner===filters.owner)&&(!filters.status||r.status===filters.status));
 const filter=(id,label,items,value)=>`<label>${label}<select class="la-input" id="schedule-${id}">${options([['','全部'],...items],value)}</select></label>`;
 return `<div class="finance-toolbar"><div class="finance-filters">${filter('requirement','关联需求',reqs,filters.requirement)}${filter('owner','负责人',owners.map(x=>[x,x]),filters.owner)}${filter('status','状态',schemas.schedule.fields.find(f=>f.key==='status').options.map(x=>[x,x]),filters.status)}</div>${button('new','＋ 新增任务','schedule')}</div>
 <section class="la-box"><div class="la-box-head"><h2>排期与分工</h2><span class="la-small la-muted">显示 ${visible.length} / ${rows.length} 项任务</span></div><div class="ledger-scroll"><table class="ledger-table la-schedule-table"><thead><tr>${['任务 / 关联需求','负责人 / 协作人','计划开始','计划结束','预计工时','状态','备注','操作'].map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${visible.length?visible.map(r=>`<tr data-schedule-row="${esc(r.id)}"><td><strong>${esc(r.title)}</strong><div class="la-small la-muted">${esc(r.requirement?(reqs.find(([id])=>id===r.requirement)?.[1]||'原需求已移除'):'未关联需求')}</div></td><td>${esc(r.owner||'待分配')}<div class="la-small la-muted">${r.collaborators?'协作：'+esc(r.collaborators):'—'}</div></td><td>${esc(r.start||'待排期')}</td><td>${esc(r.end||'待排期')}</td><td>${r.hours!==''&&r.hours!=null?esc(r.hours)+' 小时':'—'}</td><td><span class="la-tag">${esc(r.status)}</span></td><td class="la-schedule-note">${esc(r.note||'—')}</td><td><div class="ledger-actions">${button('edit','编辑',r.id,'la-link')}${button('delete','删除',r.id,'la-link')}</div></td></tr>`).join(''):`<tr><td colspan="8">${rows.length?'没有符合筛选条件的任务。':'还没有排期任务，点击「新增任务」开始拆分需求。'}</td></tr>`}</tbody></table></div></section><p class="la-caption">可先拆任务，再填写负责人和排期。预计工时按小时记录；任务独立于今日行动安排。</p>`;
}
function editor(data,requirements,message){
 const reqs=requirementOptions([data],requirements);
 const fields=schemas.schedule.fields.map(f=>{
  const val=data[f.key]??'';let control;
  if(f.key==='requirement')control=`<select class="la-input" data-field="requirement">${options([['','暂不关联'],...reqs],val)}</select>`;
  else if(f.type==='select')control=`<select class="la-input" data-field="${f.key}">${options(f.options.map(x=>[x,x]),val)}</select>`;
  else if(f.type==='textarea')control=`<textarea class="la-input" data-field="${f.key}" rows="4">${esc(val)}</textarea>`;
  else control=`<input class="la-input" data-field="${f.key}" type="${f.type==='decimal'?'text':f.type}"${f.type==='decimal'?' inputmode="decimal"':''} value="${esc(val)}"${f.required?' required':''}>`;
  return `<label class="${['title','requirement','note'].includes(f.key)?'field-wide':''}">${f.label}${f.required?' *':''}${control}</label>`;
 }).join('');
 const title=data.id?'编辑排期任务':'新增排期任务';
 return `<dialog class="la-schedule-dialog" aria-label="${title}"><div class="la-box-head"><h2>${title}</h2>${button('cancel','取消','','la-button secondary')}</div><div class="edit-grid">${fields}</div><p class="la-caption">任务名称必填；负责人和日期可以稍后补充。</p><p class="la-feedback" role="alert">${esc(message)}</p><div class="edit-actions">${button('save','保存任务')}</div></dialog>`;
}
module.exports={table,editor};
