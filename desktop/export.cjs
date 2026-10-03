const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
/** The renderer supplies a session, never a destination or serialized file. */
class ReportExporter{
 constructor({formatReport,chooseFile,directory,testMode=false,io=fs}){this.formatReport=formatReport;this.chooseFile=chooseFile;this.directory=directory;this.testMode=testMode;this.io=io;this.pending=null;}
 export(input){
  if(this.pending)return this.pending;
  let report,text;try{report=this.formatReport(input);text=JSON.stringify(report,null,2)+'\n';if(Buffer.byteLength(text)>12_000_000)throw Error('Report exceeds export budget');}catch(e){return Promise.reject(e);}
  const filename='ayqyn-report-'+report.id.slice(0,8)+'.json';
  const operation=(async()=>{
   let destination;if(this.testMode){await this.io.mkdir(this.directory,{recursive:true});destination=path.join(this.directory,filename);}else{const chosen=await this.chooseFile(filename);if(chosen.canceled||!chosen.filePath)return {saved:false,cancelled:true};destination=chosen.filePath;}
   const temporary=destination+'.ayqyn-'+crypto.randomBytes(6).toString('hex')+'.tmp';
   try{await this.io.writeFile(temporary,text,{flag:'wx',mode:0o600});await this.io.rename(temporary,destination);}catch(e){await this.io.rm(temporary,{force:true}).catch(()=>{});throw e;}
   return {saved:true,filename:path.basename(destination),bytes:Buffer.byteLength(text),sha256:crypto.createHash('sha256').update(text).digest('hex'),...(this.testMode?{testPath:destination}:{})};
  })();this.pending=operation;operation.finally(()=>{if(this.pending===operation)this.pending=null;}).catch(()=>{});return operation;
 }
}
module.exports={ReportExporter};
