/** Browser replay cache only. The shipping desktop journal is unchanged. */
export class BrowserSessionStore {
  constructor({storage=()=>globalThis.navigator?.locks?globalThis.localStorage:globalThis.sessionStorage,locks=globalThis.navigator?.locks}={}) {
    this.storage=storage;
    this.locks=locks;
    this.scope=locks?'device':'tab';
    this.expected=undefined;
  }
  load() {
    this.expected=this.storage().getItem('ayqyn-session');
    return JSON.parse(this.expected||'null');
  }
  async commit(operation) {
    const write=()=>{
      const storage=this.storage();
      if(this.expected===undefined||storage.getItem('ayqyn-session')!==this.expected) {
        const error=Error('Сессия изменена в другой вкладке. Ваши изменения не сохранены. Обновите страницу перед продолжением.');
        error.code='browser_storage_conflict';
        throw error;
      }
      return operation(storage);
    };
    return this.locks?this.locks.request('ayqyn-replay-session',write):write();
  }
  save(session) {
    const text=JSON.stringify(session);
    return this.commit(storage=>{
      storage.setItem('ayqyn-session',text);
      this.expected=text;
    });
  }
  delete() {
    return this.commit(storage=>{
      storage.removeItem('ayqyn-session');
      this.expected=null;
    });
  }
}
