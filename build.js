const fs=require('node:fs'),path=require('node:path');
const names=['schema','store','io','shell','schedule','ui','plugin'];
const modules=names.map(n=>JSON.stringify('./'+n)+':function(module,exports,require){\n'+fs.readFileSync(path.join(__dirname,n+'.js'),'utf8')+'\n}').join(',\n');
fs.writeFileSync(path.join(__dirname,'main.js'),`// Life Atlas: self-contained Obsidian plugin. Sources are shipped alongside this file.\n(function(externalRequire){\nconst modules={${modules}};\nconst cache={};\nfunction localRequire(id){if(!modules[id])return externalRequire(id);if(!cache[id]){const m={exports:{}};cache[id]=m;modules[id](m,m.exports,localRequire);}return cache[id].exports;}\nmodule.exports=localRequire('./plugin');\n})(require);\n`);
