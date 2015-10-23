import Rx from 'rx';
import Cycle from '@cycle/core';
import {makeDOMDriver, h} from '@cycle/dom';
import { makeFetchDriver } from '@cycle/fetch';

import { planet } from './planet';

import {scrollSize, numberOfSlots} from './const';

const { div, span, h1, h2, h3, h6, section, ul, li, button } = require('hyperscript-helpers')(h);

const DARK_JEDIS_URL = 'http://localhost:3000/dark-jedis/';
const emptyJedi = { name: '', homeworld: { name: '' } }  ;

function renderNavigation() {
  return (
    div({ className: 'css-scroll-buttons' }, [
      button('.up', { className: 'css-button-up' }),
      button('.down', { className: 'css-button-down' })
    ])
  );
}

function renderJedi(jedi) {
  return (
    li({ className: 'css-slot' }, [
      jedi === null ? null :
        h3( jedi.name),
      jedi === null ? null :
        h6(jedi.homeworld.name)
    ])
  );
}

function createResponseStream(responses, slot) {
  return responses.Fetch
                  .byKey(slot)
                  .mergeAll()
                  .flatMap(res => res.json())
                  .startWith(null);
}

function intent(responses) {
  const action$ = Rx.Observable.merge(
    responses.DOM.select('.down').events('click').map(ev => -scrollSize),
    responses.DOM.select('.up').events('click').map(ev => +scrollSize)
  );

  const response1$ = createResponseStream(responses, 1);
  const response2$ = createResponseStream(responses, 2);
  const response3$ = createResponseStream(responses, 3);
  const response4$ = createResponseStream(responses, 4);
  const response5$ = createResponseStream(responses, 5);

  return {
    navigation$: action$,
    slot1$ : response1$,
    slot2$ : response2$,
    slot3$ : response3$,
    slot4$ : response4$,
    slot5$ : response5$,
  };
}

let slots = new Map();

function model(actions) {
  const fetcher$ = new Rx.Subject();
  const requestStream$ = fetcher$.startWith({id: 3616, slot: 1})
    .map(function({id, slot}) {
        return {
          url: DARK_JEDIS_URL + String(id),
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
          slots.set(slot, slot1);
          if (slots.size < 5) {
            fetcher$.onNext({id: slot.master.id, slot: slots.size + 1});
          }
        }

        return [
          slot1,
          slot2,
          slot3,
          slot4,
          slot5
        ];
      }
    ),
    request$: request$
  };
}

function renderSlots(state$) {
  return (
    state$.map(siths =>
      section({ className: 'css-scrollable-list' }, [
        ul({ className: 'css-slots' }, siths.map(jedi =>
          renderJedi(jedi)
        )),

        renderNavigation()
      ])
    )
  );
}

function view({state$, request$}) {
  const vtree$ = Rx.Observable.return('start').map(x =>
    div({ className: 'app-container'}, [
      div({className: 'css-root'}, [
        planet(),
        renderSlots(state$)
      ])
    ])
  );

  return {
    DOM: vtree$,
    Fetch: request$
  };
}

function main(responses) {
  return view(model(intent(responses)));
}

let drivers = {
  DOM: makeDOMDriver('#app'),
  Fetch: makeFetchDriver()
};

Cycle.run(main, drivers);
