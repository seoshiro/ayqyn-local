const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const languages=new Set(['ru','kk','en']);
/** Separate app preference: never add locale fields to session/report schema. */
class Preferences{
 constructor(directory,io=fs){this.file=path.join(directory,'preferences.json');this.io=io;this.language='ru';this.found=false;this.fallback=false;this.chain=Promise.resolve();}
 async initialize(){try{const bytes=await this.io.readFile(this.file);if(bytes.length>1024)throw Error('Preference budget');const value=JSON.parse(bytes.toString('utf8'));if(!value||value.schema!==1||Object.keys(value).some(k=>!['schema','language'].includes(k))||!languages.has(value.language))throw Error('Invalid preference');this.language=value.language;this.found=true;}catch(error){this.fallback=error.code!=='ENOENT';}return this.read();}
 read(){return {language:this.language,found:this.found,fallback:this.fallback};}
 set(value){if(!languages.has(value))return Promise.reject(Error('Invalid language'));this.language=value;const operation=this.chain.then(async()=>{const temporary=this.file+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';try{await this.io.mkdir(path.dirname(this.file),{recursive:true});await this.io.writeFile(temporary,JSON.stringify({schema:1,language:value})+'\n',{flag:'wx',mode:0o600});await this.io.rename(temporary,this.file);this.found=true;this.fallback=false;return {language:value,saved:true};}catch{await this.io.rm(temporary,{force:true}).catch(()=>{});return {language:value,saved:false};}});this.chain=operation.then(()=>{},()=>{});return operation;}
}
module.exports={Preferences};
