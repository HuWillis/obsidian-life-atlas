const fs=require('node:fs/promises'),path=require('node:path');
function diskIO(root){const resolve=p=>path.join(root,p);return {
 async list(){async function walk(d=''){const out=[];for(const e of await fs.readdir(resolve(d),{withFileTypes:true})){if(e.name.startsWith('.'))continue;const p=[d,e.name].filter(Boolean).join('/');if(e.isDirectory())out.push(...await walk(p));else out.push({path:p,size:(await fs.stat(resolve(p))).size,mtime:(await fs.stat(resolve(p))).mtimeMs});}return out;}return walk();},
 async exists(p){try{await fs.access(resolve(p));return true}catch(e){if(e.code==='ENOENT')return false;throw e}},
 async mkdir(p){await fs.mkdir(resolve(p),{recursive:true})},
 async read(p){return fs.readFile(resolve(p),'utf8')},
 async readBinary(p){return fs.readFile(resolve(p))},
 async create(p,data){await fs.writeFile(resolve(p),typeof data==='string'?data:Buffer.from(data),{flag:'wx'})},
 async update(p,expected,text){const old=await fs.readFile(resolve(p),'utf8');if(old!==expected)throw new Error('文件已被修改，请重新打开后保存');await fs.writeFile(resolve(p),text)},
 async move(a,b){if(await this.exists(b))throw new Error('目标已存在');await fs.rename(resolve(a),resolve(b))}
};}module.exports={diskIO};
