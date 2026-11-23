'use strict';
const {randomUUID}=require('node:crypto');
const {safeName}=require('./store');

const states=['待整理','待提交','待到账','已到账'];
const looseId=name=>'file:'+name;
function amountInCents(input){
 const value=String(input??'').trim();
 if(!value)return null;
 if(!/^\d{1,9}(\.\d{1,2})?$/.test(value)||Number(value)<=0)throw new Error('金额须大于零，最多两位小数');
 return Math.round(Number(value)*100);
}
function validateLedger(rows){
 if(!Array.isArray(rows))throw new Error('报销台账格式无效');
 const ids=new Set(),files=new Set();
 for(const row of rows){
  if(!row||typeof row.id!=='string'||!row.id||row.id.startsWith('file:')||ids.has(row.id)||typeof row.title!=='string'||!Array.isArray(row.files)||!row.files.length||!states.includes(row.status))throw new Error('报销台账记录无效');
  if(row.status==='待整理'?row.cents!==null:!Number.isSafeInteger(row.cents)||row.cents<=0)throw new Error('金额与报销状态不一致');
  ids.add(row.id);
  for(const name of row.files){
   if(safeName(name)!==name||files.has(name))throw new Error('单据文件名无效或已被重复关联');
   files.add(name);
  }
 }
}
async function snapshot(store,project,month){
 const folder=await store.receiptFolder(project,month),path=folder+'.报销.json';
 const raw=await store.io.exists(path)?await store.io.read(path):null;
 const rows=raw===null?[]:JSON.parse(raw);
 validateLedger(rows);
 return {folder,path,raw,rows};
}
async function readExpenses(store,project,month){
 const {raw,rows}=await snapshot(store,project,month);
 return {raw,rows};
}
function expenseRows(records,receipts){
 const found=new Map(receipts.map(r=>[r.file.name,r])),linked=new Set(records.flatMap(r=>r.files));
 const loose=receipts.filter(r=>!linked.has(r.file.name)).map(r=>({id:looseId(r.file.name),title:r.file.name,files:[r.file.name],status:'待整理',cents:null}));
 return [...records,...loose].map(r=>({...r,_mtime:Math.max(...r.files.map(n=>found.get(n)?._mtime||0))}));
}
function writeExpense(store,project,month,expected,change){
 return store.queue(async()=>{
  const {folder,path,raw,rows}=await snapshot(store,project,month);
  if(raw!==expected)throw new Error('台账已变化，请关闭弹窗并刷新后重试');
  const receipts=await store.listReceipts(project,month),all=expenseRows(rows,receipts);
  const uploads=change.uploads||[];
  if(change.action==='advance'){
   const ids=new Set(change.ids),source=change.target==='待到账'?'待提交':change.target==='已到账'?'待到账':null;
   const picked=rows.filter(r=>ids.has(r.id));
   if(!source||!ids.size||picked.length!==ids.size||picked.some(r=>r.status!==source))throw new Error('请选择同一报销状态的费用');
   for(const row of picked)row.status=change.target;
  }else{
   const old=change.id?all.find(r=>r.id===change.id):null;
   if(change.id&&!old)throw new Error('费用已变更，请刷新');
   const cents=amountInCents(change.amount);
   if(old&&states.indexOf(old.status)>=2&&cents!==old.cents)throw new Error('已提交费用的金额不可更改');
   const files=[...(old?.files||[])],linked=new Set(rows.flatMap(r=>r.files));
   for(const name of change.attach||[]){
    if(linked.has(name)||!receipts.some(r=>r.file.name===name))throw new Error('所选单据已变更');
    if(!files.includes(name))files.push(name);
   }
   for(const upload of uploads){
    const name=safeName(upload.name,'文件名');
    if(/\.(md|markdown)$/i.test(name)||files.includes(name)||linked.has(name)||await store.io.exists(folder+'/'+name))throw new Error('文件名重复或格式无效：'+name);
    files.push(name);
   }
   if(!files.length)throw new Error('请至少选择一份单据');
   const row={id:old&&!old.id.startsWith('file:')?old.id:randomUUID(),title:String(change.title||'').trim()||files[0],files,cents,status:cents===null?'待整理':old&&states.indexOf(old.status)>=2?old.status:'待提交'};
   const index=rows.findIndex(r=>r.id===row.id);
   if(index<0)rows.push(row);else rows[index]=row;
  }
  validateLedger(rows);
  await store.io.mkdir(folder);
  // Originals are written first. If the index write fails they remain discoverable as loose receipts.
  const written=[];
  try{
   for(const upload of uploads){
    await store.io.create(folder+'/'+safeName(upload.name),upload.data);
    written.push(upload.name);
   }
   const next=JSON.stringify(rows,null,2)+'\n';
   if(raw===null)await store.io.create(path,next);else await store.io.update(path,raw,next);
  }catch(error){
   if(!written.length)throw error;
   throw new Error('台账未保存。已归档的原件：'+written.join('、')+'。请关闭弹窗并重新进入本月，从待整理单据中选择。原因：'+error.message);
  }
 });
}
module.exports={states,expenseRows,readExpenses,writeExpense};
