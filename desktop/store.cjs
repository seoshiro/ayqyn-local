const fs=require('node:fs/promises'),path=require('node:path');
class SessionStore{
 constructor(directory,validate,expired){this.directory=directory;this.file=path.join(directory,'current.json');this.validate=validate;this.expired=expired;this.queue=Promise.resolve();}
 run(operation){const next=this.queue.then(operation);this.queue=next.catch(()=>{});return next;}
 async initialize(){await fs.mkdir(this.directory,{recursive:true});await fs.rm(this.file+'.tmp',{force:true});}
 save(input){const data=structuredClone(input);this.validate(data);const text=JSON.stringify(data);if(Buffer.byteLength(text)>12_000_000)throw Error('Session exceeds storage budget');return this.run(async()=>{await fs.mkdir(this.directory,{recursive:true});await fs.writeFile(this.file+'.tmp',text,{mode:0o600});await fs.rename(this.file+'.tmp',this.file);return true;});}
 load(){return this.run(async()=>{let raw;try{raw=await fs.readFile(this.file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}let data;try{data=JSON.parse(raw);this.validate(data);}catch{await fs.rm(this.file,{force:true});throw Error('Повреждённая сессия удалена. Создайте новую.');}if(this.expired(data)){await fs.rm(this.file,{force:true});await fs.rm(this.file+'.tmp',{force:true});return null;}return data;});}
 delete(){return this.run(async()=>{await fs.rm(this.file,{force:true});await fs.rm(this.file+'.tmp',{force:true});return true;});}
}
module.exports={SessionStore};
