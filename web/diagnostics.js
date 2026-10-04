export const DIAGNOSTIC_STAGES=Object.freeze(['startup','init','infer','capture','rules','render','save','worker','health']);
export const DIAGNOSTIC_CODES=Object.freeze(['eye_geometry','observation_invalid','init_timeout','infer_timeout','worker_exit','capture_failed','storage_failed','consent_denied','frame_invalid','runtime_failed','ui_startup_failed','unknown']);
// Error text is classified in memory only. Never send messages, stacks or inputs to disk.
export function diagnosticCode(error,stage){
 const message=typeof error?.message==='string'?error.message:'';
 if(/Invalid eye [xy]$/.test(message))return 'eye_geometry';
 if(/Invalid (faces|face count|face box|phones|phone box|observation|quality|yaw|pitch|roll|brightness|sharpness)$/.test(message))return 'observation_invalid';
 if(/Model initialization timeout|CV host readiness timeout/.test(message))return 'init_timeout';
 if(/CV response timeout/.test(message))return 'infer_timeout';
 if(/Isolated CV renderer exited|CV host closed/.test(message))return 'worker_exit';
 if(error?.name==='NotAllowedError')return 'consent_denied';
 if(/Invalid frame$|Unsupported frame dimensions$|Nonmonotonic timestamp$/.test(message))return 'frame_invalid';
 return stage==='save'?'storage_failed':stage==='capture'?'capture_failed':['init','infer'].includes(stage)?'runtime_failed':'unknown';
}
export function validDiagnostic(input){
 return Boolean(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).length===2&&DIAGNOSTIC_STAGES.includes(input.stage)&&DIAGNOSTIC_CODES.includes(input.code));
}
