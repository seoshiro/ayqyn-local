/** Deterministic browser-only adaptation; never rewrite packaged authoring sources. */
export function adaptReplayRenderer(source) {
  const replace=(before,after,count=1)=>{
    if(source.split(before).length-1!==count)throw Error('Replay storage adaptation source changed: '+before);
    source=source.replaceAll(before,after);
  };
  replace("const $=s=>document.querySelector(s),api=window.ayqyn;", "const $=s=>document.querySelector(s),api=window.ayqyn;const browserStore=api?null:new BrowserSessionStore();");
  replace("localStorage.setItem('ayqyn-session',JSON.stringify(data))",'browserStore.save(data)');
  replace("then(()=>storageStatus('Сохранено на этом устройстве'))", "then(()=>storageStatus(!api&&browserStore.scope==='tab'?'Сохранено в этой вкладке; после её закрытия пример нужно открыть заново.':'Сохранено на этом устройстве'))");
  replace("JSON.parse(localStorage.getItem('ayqyn-session')||'null')",'browserStore.load()');
  replace("localStorage.removeItem('ayqyn-session')",'await browserStore.delete()',2);
  replace('Решение сохранено ','Решение принято ');
  replace('node.textContent=text;node.hidden=false;}',"node.textContent=text;node.hidden=false;node.scrollIntoView({block:'center',behavior:'instant'});}");
  replace("storageStatus('Не сохранено. Код: '+code);toast('Не удалось сохранить данные. Оставьте окно открытым. Код: '+code);});", "storageStatus('Не сохранено. Код: '+code);toast(e.code==='browser_storage_conflict'?e.message:'Не удалось сохранить данные. Оставьте окно открытым. Код: '+code);});");
  return "import {BrowserSessionStore} from './browser-storage.js';\n"+source;
}
