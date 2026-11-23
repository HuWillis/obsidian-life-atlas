'use strict';

function monthOffset(month, offset) {
 const [year, number] = month.split('-').map(Number);
 const index = year * 12 + number - 1 + offset;
 return Math.floor(index / 12) + '-' + String((index % 12) + 1).padStart(2, '0');
}

module.exports = function expenseDesk({root, api, esc, btn, box, money, listView, render, operation, reload, scope}) {
 let loaded, version, records = [], receipts = [], archive = false, dialog;
 // Store exceptions so newly received files are selected without losing manual choices on refresh.
 const excluded = new Set();
 const scopeKey = () => JSON.stringify(scope());
 const action = (name, label, value = '', css = 'la-button secondary') => btn('expense-' + name, label, value, css);
 const current = () => loaded === scopeKey();
 function reset() {
  archive = false;
  excluded.clear();
  loaded = null;
 }
 function set(project, month, ledger, files) {
  const key = JSON.stringify([project, month]);
  if (key !== scopeKey()) return;
  if (loaded !== key) excluded.clear();
  loaded = key;
  version = ledger.raw;
  records = ledger.rows;
  receipts = files;
  const available = new Set(pending().map(r => r.file.name));
  for (const name of excluded) if (!available.has(name)) excluded.delete(name);
 }
 function pending() {
  if (!current()) return [];
  const linked = new Set(records.flatMap(r => r.files));
  return receipts.filter(r => !linked.has(r.file.name));
 }
 function monthRail(month) {
  const now = new Date(), thisMonth = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  const periods = [...new Set([thisMonth, monthOffset(thisMonth,-1), monthOffset(thisMonth,-2), month])].sort().reverse();
  const buttons = periods.map(value => {
   return btn('receipt-period', (value.slice(0,4) === thisMonth.slice(0,4) ? '' : value.slice(0,4) + ' 年 ') + Number(value.slice(5)) + ' 月', value, 'la-pill' + (value === month ? ' active' : ''));
  });
  return '<nav class="expense-months" aria-label="切换报销月份">' + buttons.join('') + '</nav>';
 }
 function claims(month) {
  const v = listView('claims:' + scopeKey(), current() ? records : []);
  const rows = v.items.map(row => {
   const status = row.status === '待整理' ? '待补金额' : row.status;
   const next = row.status === '待提交' ? '标记已提交' : row.status === '待到账' ? '确认到账' : '';
   return '<tr><td>' + action('edit',esc(row.title),row.id,'la-link') + '</td><td>' + row.files.length +
    ' 份附件</td><td>' + (row.cents === null ? '—' : money(row.cents)) + '</td><td>' + esc(status) +
    '</td><td>' + (next ? action('advance',next,row.id) : '') + '</td></tr>';
  });
  const table = '<div class="ledger-scroll"><table class="ledger-table"><thead><tr><th>报销单</th><th>附件</th><th>金额</th><th>状态</th><th>操作</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  return box('本月报销单', rows.length ? table + (v.pages > 1 ? v.pager : '') : '<p class="la-empty">本月还没有报销单。</p>',
   btn('receipt-period','查看上月',monthOffset(month,-1),'la-link'));
 }
 function page(feedback = '') {
  const month = scope()[1], files = pending(), count = files.filter(r => !excluded.has(r.file.name)).length;
  const v = listView('pending:' + scopeKey(), files);
  const drop = '<section class="receipt-drop expense-drop"><label class="receipt-picker">拖入本月单据，或选择文件<input id="receipt-files" type="file" multiple aria-label="选择本月单据"></label></section>';
  const items = v.items.map(r => '<div class="expense-file"><input type="checkbox" data-pick="' + esc(r.file.name) +
   '" aria-label="选择 ' + esc(r.file.name) + '"' + (excluded.has(r.file.name) ? '' : ' checked') + '>' +
   btn('receipt-open',esc(r.file.name),r.id,'la-link') + '</div>');
  const head = files.length ? '<label class="expense-file"><input type="checkbox" data-pick-all ' +
   (count === files.length ? 'checked' : '') + ' aria-checked="' + (count && count < files.length ? 'mixed' : String(count > 0)) + '">全选本月待报单据（' + files.length + ' 份）</label>' : '';
  const footer = '<div class="expense-selection"><span aria-live="polite">已选 ' + count + ' 份</span><button type="button" data-act="expense-generate" class="la-button"' +
   (count ? '' : ' disabled') + '>生成本月报销单</button></div>';
  const body = drop + feedback + head + (items.join('') || '<p class="la-empty">本月没有待报单据。</p>') + (v.pages > 1 ? v.pager : '') + footer;
  return '<div class="expense-layout">' + monthRail(month) + '<div class="expense-main">' + box(Number(month.slice(5)) + ' 月待报单据',body) + claims(month) + '</div></div>';
 }
 function close() { dialog?.remove(); dialog = null; }
 function form(row, names) {
  const [project, month] = scope(), expected = version;
  const defaultTitle = Number(month.slice(5)) + ' 月报销单';
  const locked = row && ['待到账','已到账'].includes(row.status);
  const originals = new Map(receipts.map(r => [r.file.name,r]));
  const links = names.map(name => originals.has(name)
   ? '<button type="button" class="la-link" data-original="' + esc(originals.get(name)._path) + '">' + esc(name) + '</button>'
   : '<span>' + esc(name) + '（文件缺失）</span>');
  const heading = row ? '报销单详情' : '生成本月报销单';
  dialog = root.ownerDocument.createElement('dialog');
  dialog.className = 'la-editor-dialog';
  dialog.setAttribute('aria-label', heading);
  dialog.innerHTML = box(heading,'<form class="expense-form"><p class="la-caption">' + esc(month) + ' · ' + names.length + ' 份原始单据</p><details><summary>查看附件</summary><div class="expense-originals">' + links.join('') +
   '</div></details><label>报销单名称<input name="title" class="la-input" maxlength="160" required value="' + esc(row?.title || defaultTitle) +
   '"></label><label>报销总额（元）<input type="number" name="amount" class="la-input" min="0.01" max="999999999.99" step="0.01" placeholder="可稍后填写" value="' +
   (row?.cents != null ? (row.cents/100).toFixed(2) : '') + '"' + (locked ? ' readonly' : '') + '></label><p class="la-feedback" role="alert"></p><div class="edit-actions"><button type="button" data-dismiss class="la-button secondary">取消</button><button type="submit" class="la-button">' +
   (row ? '保存' : '生成报销单') + '</button></div></form>');
  root.append(dialog);
  const field = selector => dialog.querySelector(selector), feedback = field('[role=alert]');
  let saving = false;
  dialog.querySelectorAll('[data-original]').forEach(b => b.onclick = () => api.open(b.dataset.original).catch(e => feedback.textContent = e.message));
  field('[data-dismiss]').onclick = () => { if (!saving) close(); };
  dialog.oncancel = e => { e.preventDefault(); if (!saving) close(); };
  field('form').onsubmit = async e => {
   e.preventDefault();
   if (saving) return;
   const title = field('[name=title]').value.trim();
   if (!title) { feedback.textContent = '请填写报销单名称'; return; }
   saving = true;
   const controls = [...dialog.querySelectorAll('button,input')];
   controls.forEach(c => c.disabled = true);
   try {
    await api.writeExpense(project,month,expected,{id:row?.id,title,amount:field('[name=amount]').value,attach:row ? [] : names});
   } catch (err) {
    feedback.textContent = err.message;
    controls.forEach(c => c.disabled = false);
    saving = false;
    return;
   }
   close();
   await operation(reload);
  };
  if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open','');
 }
 root.addEventListener('change',e => {
  if (e.target.hasAttribute('data-pick-all')) {
   excluded.clear();
   if (!e.target.checked) for (const file of pending()) excluded.add(file.file.name);
  } else if (e.target.hasAttribute('data-pick')) {
   const name = e.target.dataset.pick;
   if (e.target.checked) excluded.delete(name); else excluded.add(name);
  } else return;
  render();
 });
 async function handle(act,value) {
  if (act === 'expense-view') { archive = value === 'archive'; render(); return; }
  if (!current()) return;
  if (act === 'expense-generate') {
   const names = pending().map(r => r.file.name).filter(n => !excluded.has(n));
   if (names.length) form(null,names);
   return;
  }
  const row = records.find(r => r.id === value);
  if (!row) return;
  if (act === 'expense-edit') form(row,row.files);
  if (act === 'expense-advance') {
   const target = row.status === '待提交' ? '待到账' : row.status === '待到账' ? '已到账' : null;
   if (target) await operation(async () => { await api.writeExpense(...scope(),version,{action:'advance',target,ids:[row.id]}); await reload(); });
  }
 }
 return {set,page,reset,handle,close,editing:()=>!!dialog,archive:()=>archive,linked:name=>current()&&records.some(r=>r.files.includes(name)),
  tabs:()=>'<div class="la-pills">'+action('view','月度报销夹','ledger','la-pill '+(!archive?'active':''))+action('view','原始文件','archive','la-pill '+(archive?'active':''))+'</div>'};
};
