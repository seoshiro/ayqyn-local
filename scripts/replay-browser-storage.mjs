/** Deterministic browser-only adaptation; never rewrite packaged authoring sources. */
export function adaptReplayRenderer(source) {
  const replace=(before,after,count=1)=>{
    if(source.split(before).length-1!==count)throw Error('Replay storage adaptation source changed: '+before);
    source=source.replaceAll(before,after);
  };
  replace("const $=s=>document.querySelector(s),api=window.ayqyn;", "const $=s=>document.querySelector(s),api=window.ayqyn;const browserStore=api?null:new BrowserSessionStore();let browserPendingSave=null;");
  replace('saveTimer=setTimeout(()=>{const data=structuredClone(session);','const flush=()=>{saveTimer=null;browserPendingSave=null;const data=structuredClone(session);');
  replace('});},150);}', '});};browserPendingSave=flush;saveTimer=setTimeout(flush,150);}');
  replace("localStorage.setItem('ayqyn-session',JSON.stringify(data))",'browserStore.save(data)');
  replace("then(()=>storageStatus('Сохранено на этом устройстве'))", "then(()=>storageStatus(!api&&browserStore.scope==='tab'?'Сохранено в этой вкладке; после её закрытия пример нужно открыть заново.':'Сохранено на этом устройстве'))");
  replace("JSON.parse(localStorage.getItem('ayqyn-session')||'null')",'browserStore.load()');
  replace("localStorage.removeItem('ayqyn-session')",'await browserStore.delete()',2);
  replace('Решение сохранено ','Решение принято ');
  replace('node.textContent=text;node.hidden=false;}',"node.textContent=text;node.hidden=false;node.scrollIntoView({block:'center',behavior:'instant'});}");
  replace("storageStatus('Не сохранено. Код: '+code);toast('Не удалось сохранить данные. Оставьте окно открытым. Код: '+code);});", "storageStatus('Не сохранено. Код: '+code);toast(e.code==='browser_storage_conflict'?e.message:'Не удалось сохранить данные. Оставьте окно открытым. Код: '+code);});");
  replace("const data=JSON.stringify(report(session),null,2),url=", "let exportSession;try{if(browserPendingSave){clearTimeout(saveTimer);browserPendingSave();}await saveChain;exportSession=await browserStore.snapshot(session);}catch(e){reportStatus='Отчёт не создан. Обновите страницу или повторите сохранение.';if(view==='review')render();if(['browser_storage_conflict','browser_export_unsaved'].includes(e.code))throw e;throw Error('Отчёт не создан: хранилище недоступно. Оставьте страницу открытой и повторите попытку.');}const data=JSON.stringify(report(exportSession),null,2),url=");
  replace("link.download='ayqyn-report-'+session.id.slice(0,8)+'.json';link.click();", "link.download='ayqyn-report-'+exportSession.id.slice(0,8)+'.json';link.click();reportStatus='Файл отчёта подготовлен. Сохранение проверьте в загрузках браузера.';if(view==='review')render();");
  return "import {BrowserSessionStore} from './browser-storage.js';\n"+source;
}
