import {LANGUAGES,LANGUAGE_NAMES,normalizeLanguage,translateText,validLanguage,hasTranslation} from './messages.js';
const KEY='ayqyn-language';
let language='ru',started=false,observer,pendingAnnouncement='';
const textState=new WeakMap(),attributeState=new WeakMap(),untranslated=new Set();
const skip=element=>!element||Boolean(element.closest('[data-l10n-ignore],script,style,textarea,input,option,pre,code'));
const skipAttributes=element=>!element||Boolean(element.closest('[data-l10n-ignore],script,style,option,pre,code'));
export function getLanguage(){return language;}
export function untranslatedMessages(){return [...untranslated];}
export function languageControl(){return '<label class="language-control" for="language-select"><span>Язык</span><select id="language-select" aria-label="Язык интерфейса">'+LANGUAGES.map(code=>'<option value="'+code+'"'+(language===code?' selected':'')+'>'+LANGUAGE_NAMES[code]+'</option>').join('')+'</select></label><span id="language-status" class="sr-only" role="status" aria-live="polite"></span>';}
function translate(source){
 const before=source.match(/^\s*/)?.[0]||'',after=source.match(/\s*$/)?.[0]||'',key=source.trim(),result=translateText(key,language);
 if(!key)return source;
 if(language!=='ru'&&!hasTranslation(key)&&/[А-Яа-яЁё]/.test(key))untranslated.add(key);
 return before+result+after;
}
function translateNode(node){
 if(skip(node.parentElement))return;
 const state=textState.get(node),current=node.nodeValue||'',source=state&&current===state.output?state.source:current,output=translate(source);
 textState.set(node,{source,output});if(current!==output)node.nodeValue=output;
}
function translateAttributes(element){
 if(skipAttributes(element))return;let states=attributeState.get(element);if(!states){states=new Map();attributeState.set(element,states);}
 for(const attr of ['title','aria-label','placeholder','alt','content']){if(!element.hasAttribute(attr))continue;if(attr==='content'&&!element.matches('meta[name=description]'))continue;const current=element.getAttribute(attr)||'',state=states.get(attr),source=state&&current===state.output?state.source:current,output=translate(source);states.set(attr,{source,output});if(current!==output)element.setAttribute(attr,output);}
}
/** @param {Node} [root] */
export function translateDOM(root=document.documentElement){
 if(root.nodeType===3){translateNode(root);return;}
 if(root instanceof Element)translateAttributes(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))translateNode(node);
 if(root instanceof Element)for(const element of root.querySelectorAll('[title],[aria-label],[placeholder],[alt],meta[name=description]'))translateAttributes(element);
 document.documentElement.lang=language;const control=document.getElementById('language-select');if(control instanceof HTMLSelectElement)control.value=language;
 for(const field of document.querySelectorAll('[data-l10n-validity]'))if(field instanceof HTMLInputElement)field.setCustomValidity(translateText(field.getAttribute('data-l10n-validity')||'',language));
 for(const element of document.querySelectorAll('[data-l10n-date]')){const value=element.getAttribute('data-l10n-date');if(value&&Number.isFinite(Date.parse(value))){const output=new Date(value).toLocaleDateString(language==='kk'?'kk-KZ':language==='en'?'en-GB':'ru-RU');if(element.textContent!==output)element.textContent=output;}}
 const status=document.getElementById('language-status'),notice=language!=='ru'&&untranslated.size?'Часть текста показана на русском: перевод пока недоступен.':pendingAnnouncement;if(status){status.setAttribute('data-l10n-ignore','');if(notice){const output=translateText(notice,language);if(status.textContent!==output)status.textContent=output;}}
}
function announce(source){pendingAnnouncement=source;const status=document.getElementById('language-status');if(status){status.textContent=source;translateDOM(status);}}
export async function setLanguage(value,{persist=true,announceChange=true}={}){
 const accepted=validLanguage(value);language=normalizeLanguage(value);untranslated.clear();translateDOM();
 let browserSaved=false,nativeSaved=false;if(persist){try{localStorage.setItem(KEY,language);browserSaved=true;}catch{}try{if(window.ayqyn?.setLanguage){const result=await window.ayqyn.setLanguage(language);nativeSaved=result.saved===true;}}catch{}}
 if(!accepted)announce('Неизвестный язык. Используется русский.');else if(announceChange)announce(!persist||browserSaved||nativeSaved?'Язык изменён.':'Язык изменён для этого окна. Сохранить настройку не удалось.');
 return {language,saved:browserSaved||nativeSaved,accepted};
}
export async function startLocalization(){
 if(started)return;started=true;let stored=null,fallback=false;try{stored=localStorage.getItem(KEY);fallback=stored!==null&&!validLanguage(stored);}catch{}
 try{const native=await window.ayqyn?.getLanguage?.();if(native?.fallback)fallback=true;if(native?.found){stored=native.language;fallback=native.fallback===true||!validLanguage(stored);}}catch{}
 language=normalizeLanguage(stored);translateDOM();
 observer=new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')translateNode(record.target);else if(record.type==='attributes')translateAttributes(record.target);else for(const added of record.addedNodes)translateDOM(added);}});
 observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','alt','content']});
 document.addEventListener('change',event=>{if(event.target instanceof HTMLSelectElement&&event.target.id==='language-select')setLanguage(event.target.value).catch(()=>announce('Язык изменён для этого окна. Сохранить настройку не удалось.'));});
 addEventListener('storage',event=>{if(event.key===KEY)setLanguage(event.newValue,{persist:false,announceChange:false}).catch(()=>{});});
 if(fallback)announce('Неизвестный язык. Используется русский.');
}
