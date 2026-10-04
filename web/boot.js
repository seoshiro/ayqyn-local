// A failed module/bridge startup must leave a visible retry path, never an empty app.
const root=document.querySelector('#app');
let completed=false;
const present=()=>window.ayqyn?.present?.().catch(()=>{});
function unavailable(){
 if(completed)return;
 root.replaceChildren();const panel=document.createElement('main');panel.className='boot-panel';
 const title=document.createElement('h1');title.textContent='Не удалось открыть интерфейс';
 const text=document.createElement('p');text.textContent='Повторите открытие интерфейса. Это действие не изменяет сохранённую сессию. Камера не включается автоматически.';
 const retry=document.createElement('button');retry.className='primary';retry.textContent='Повторить открытие';retry.addEventListener('click',()=>location.reload());
 panel.append(title,text,retry);panel.setAttribute('role','alert');root.append(panel);
 present();
 window.ayqyn?.diagnostic?.({stage:'startup',code:'ui_startup_failed'}).catch(()=>{});
}
const timeout=setTimeout(unavailable,8000);
import('./app.js').then(()=>{completed=true;clearTimeout(timeout);present();}).catch(()=>{clearTimeout(timeout);unavailable();});
