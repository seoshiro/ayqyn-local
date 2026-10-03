import fs from 'node:fs/promises';import path from 'node:path';
const root=path.resolve('web'),out=path.resolve('dist');await fs.mkdir(out,{recursive:true});await fs.cp(root,out,{recursive:true});
console.log('Static output copied to dist. Run redact-demo.py before publication.');
