const {TFile}=require('obsidian');
function ioFor(app){const v=app.vault,a=v.adapter;return {
 async list(){async function walk(folder=''){const items=await a.list(folder),out=[];for(const p of items.files){if(p.split('/').some(x=>x.startsWith('.')))continue;const stat=await a.stat(p);if(stat)out.push({path:p,size:stat.size,mtime:stat.mtime});}for(const p of items.folders){if(p.split('/').some(x=>x.startsWith('.')))continue;out.push(...await walk(p));}return out;}return walk();},
 exists:p=>a.exists(p),
 async mkdir(p){let current='';for(const part of p.split('/')){current=current?current+'/'+part:part;if(!await a.exists(current)){try{await v.createFolder(current)}catch(e){if(!await a.exists(current))throw e;}}}},
 async read(p){const f=v.getAbstractFileByPath(p);return f instanceof TFile?v.read(f):a.read(p)},
 async create(p,data){if(typeof data==='string')await v.create(p,data);else await v.createBinary(p,data)},
 async update(p,expected,text){const f=v.getAbstractFileByPath(p);if(!(f instanceof TFile))throw new Error('文件已移动或不存在');await v.process(f,old=>{if(old!==expected)throw new Error('文件已被修改，请重新打开后保存');return text})},
 async move(from,to){if(await a.exists(to))throw new Error('目标已存在，未覆盖');const f=v.getAbstractFileByPath(from);if(f)await v.rename(f,to);else await a.rename(from,to)}
};}
module.exports={ioFor};
