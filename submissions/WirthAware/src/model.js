import Immutable from 'immutable'
import {Observable} from 'rx'

const slots = new Map();
let initialState = Immutable.fromJS({
  planet: null,
  slots: [null, null, null, null, null]
});

const newSith = newSith => list => {
  const indexAsMaster = list
      .findIndex(sith => sith && sith.get('master').get('id') === newSith.get('id')) - 1

  const indexAsApprentice = list
      .findIndex(sith => sith && sith.get('apprentice').get('id') === newSith.get('id')) + 1

  if (indexAsMaster >= 0 && indexAsMaster < list.size - 1) {
    return list.set(indexAsMaster, newSith)
  }
  if (indexAsApprentice >= 1 && indexAsApprentice < list.size) {
    return list.set(indexAsApprentice, newSith)
  }


  if (list.every(x => x === null)) {
    return list.set(Math.floor(list.size / 2), newSith)
  }

  return list;
};

function firstSithHasMaster(state) {
  const values = state.slots.filter(s => s !== null)
  const first = values[0];
  return first && first.master.id !== null;
}
function lastSithHasApprentice(state) {
  const values = state.slots.filter(s => s !== null)
  const last = values[state.slots.length - 1];
  return last && last.apprentice.id !== null;
}

function update (planet$, sithResponse$, actions) {
  const updatePlanet$ = planet$
    .map( x => Immutable.fromJS(x))
    .map(planet => (oldState) => {
      return oldState
        .set('planet', planet)
    });

  const updateStateWithResponse$ = sithResponse$
    .map(x => Immutable.fromJS(x))
    .map(sith => (oldState) => {
      return oldState
        .update('slots', newSith(sith))
    });

  const updateStateWhenScrolled$ = actions.navigation$
    .map(delta => (oldState) => {
      const amount = Math.abs(delta);
      if (delta > 0 && firstSithHasMaster(oldState.toJS())) {
        return oldState.update('slots', slots =>
         slots.unshift(...Array(amount)).skipLast(amount).map(x => x ? x : null)
        )
      }
      if (delta < 0 && lastSithHasApprentice(oldState.toJS())) {
        return oldState.update('slots', slots =>
          slots.push(...Array(amount)).skip(amount).map(x => x ? x : null)
        )
      }

      return oldState;
    });

  return Observable.merge(
    updatePlanet$,
    updateStateWithResponse$,
    updateStateWhenScrolled$
  );
}

export function model(planet$, sithResponse$, actions) {
  const $update = update(planet$, sithResponse$, actions);
  return $update
    .startWith(initialState)
    .scan((state, update) => update(state))
    .map(x => {
      return x.toJS()
    })
    .shareReplay(1);
}


/*
function model(actions) {
  const fetcher$ = new Rx.Subject();
  const requestStream$ = fetcher$.startWith({id: DARTH_SIDIOUS_ID, slot: 1})
    .map(function({id, slot}) {
        return {
          url: DARK_JEDIS_URL + `${id}`,
          method: 'GET',
          key: slot
        }
    });

  const request$ = requestStream$;

  const cursor$ = actions.navigation$.startWith(0).scan((x,y) => x+y);
  return {
      state$: cursor$.combineLatest(
      actions.slot1$,
      actions.slot2$,
      actions.slot3$,
      actions.slot4$,
      actions.slot5$,
      (cursor, slot1, slot2, slot3, slot4, slot5) => {
        // startup, fetch empty slots
        if (slot1 != null) {
          let response = [slot1, slot2, slot3, slot4, slot5];
          let slot = response[slots.size];
          // slots.set(slot, slot1);
          initialState.get('slots').set(slot, slot1);
          // if (slots.size < 5) {
          if (initialState.get('slots').every(x => x == null)) {
            fetcher$.onNext({id: slot.master.id, slot: slots.size + 1});
          }
        }

        initialState = Immutable.fromJS({
          slots: [slot1, slot2, slot3, slot4, slot5]
        });
        return initialState.get('slots').unshift(...Array(2)).skipLast(2).toJS();

        // return [
        //   slot1,
        //   slot2,
        //   slot3,
        //   slot4,
        //   slot5
        // ];
      }
    ),
    request$: request$
  };
}
*/
