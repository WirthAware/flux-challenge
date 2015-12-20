import { Observable } from 'rx';

const DARK_JEDIS_URL = 'http://localhost:3000/dark-jedis/';
const DARTH_SIDIOUS_ID = 3616;

function isSithInList(sith, slots) {
  return slots.findIndex(s => s !== null && s.id === sith.id) !== -1;
}

function isSithMissingFromList (sith, slots) {
  const first = slots[0];
  const last = slots[slots.length - 1];
  const isMasterOfFirst = first !== null && first.master.id === sith.id;
  const isApprenticeOfLast  = last !== null && last.apprentice.id === sith.id;
  return !isSithInList(sith, slots) && !isMasterOfFirst && !isApprenticeOfLast;
}

function missingSiths(state) {
  return Observable.from (state.slots)
    .filter(sith => sith !== null)
    .flatMap(sith => [sith.master, sith.apprentice])
    .filter(sith =>
      sith.id !== null
      && isSithMissingFromList(sith, state.slots)
      && !isAMatch(state)
    )
    .do(function (x) { console.log(x); });
}

function fetcherHash(state) {
  const slotsHash = state.slots.map(s => s ? s.id : 'null').join('-');
  return slotsHash;
}

function darkjedifetcher(Fetcher, state$) {
  const request$ = state$
    //.distinctUntilChanged(fetcherHash)
    .flatMap(missingSiths)
    .map(sith => sith.url)
    .startWith(DARK_JEDIS_URL + `${DARTH_SIDIOUS_ID}`);

    const response$ = Fetcher
      .merge(state$.filter(isAMatch).map(() => Observable.just(null)))
      .switch()
      .filter(x => Boolean(x))
      .flatMap(res => res.json())
      .shareReplay(1);

    return { request$, response$ };
}

function isAMatch(state) {
  return !state.slots.every(s => s === null || !s.matched);
}

export default darkjedifetcher;
