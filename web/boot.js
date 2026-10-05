// Independent fallback: recovery must still work when application modules fail to load.
const root=document.querySelector('#app');
const words={
 ru:['Открываем AYQYN','Загружается локальный интерфейс. Камера выключена.','Не удалось открыть интерфейс','Повторите открытие интерфейса. Это действие не изменяет сохранённую сессию. Камера не включается автоматически.','Повторить открытие','Язык интерфейса'],
 kk:['AYQYN ашылуда','Жергілікті интерфейс жүктелуде. Камера өшірулі.','Интерфейсті ашу мүмкін болмады','Интерфейсті қайта ашыңыз. Бұл сақталған сессияны өзгертпейді. Камера автоматты қосылмайды.','Қайта ашу','Интерфейс тілі'],
 en:['Opening AYQYN','Loading the local interface. Camera off.','Could not open the interface','Try opening the interface again. This does not change the saved session. The camera does not start automatically.','Retry opening','Interface language']
};
let language='ru',completed=false,failed=false;
try{const saved=localStorage.getItem('ayqyn-language');if(Object.hasOwn(words,saved))language=saved;}catch{}
function update(){root.querySelector('.boot-panel')?.setAttribute('data-l10n-ignore','');document.documentElement.lang=language;const copy=words[language];const title=root.querySelector('h1'),text=root.querySelector('p'),button=root.querySelector('button'),select=root.querySelector('select');if(title)title.textContent=copy[failed?2:0];if(text)text.textContent=copy[failed?3:1];if(button)button.textContent=copy[4];if(select){select.value=language;select.setAttribute('aria-label',copy[5]);}}
update();
window.ayqyn?.getLanguage?.().then(preference=>{if(!completed&&Object.hasOwn(words,preference.language)){language=preference.language;update();}}).catch(()=>{});
const present=()=>window.ayqyn?.present?.().catch(()=>{});
function unavailable(){
 if(completed)return;failed=true;
 root.replaceChildren();const panel=document.createElement('main');panel.className='boot-panel';
 const title=document.createElement('h1'),text=document.createElement('p'),retry=document.createElement('button');retry.className='primary';retry.addEventListener('click',()=>{if(window.ayqyn?.retryUi)window.ayqyn.retryUi().catch(()=>{});else location.reload();});
 const select=document.createElement('select');select.id='boot-language';for(const [code,name] of [['ru','Русский'],['kk','Қазақша'],['en','English']]){const option=document.createElement('option');option.value=code;option.textContent=name;select.append(option);}select.addEventListener('change',()=>{language=select.value;update();try{localStorage.setItem('ayqyn-language',language);}catch{}window.ayqyn?.setLanguage?.(language).catch(()=>{});});
 panel.append(title,text,retry,select);panel.setAttribute('role','alert');root.append(panel);update();
 present();
 window.ayqyn?.diagnostic?.({stage:'startup',code:'ui_startup_failed'}).catch(()=>{});
}
const timeout=setTimeout(unavailable,8000);
import('./app.js').then(()=>{completed=true;clearTimeout(timeout);present();}).catch(()=>{clearTimeout(timeout);unavailable();});
