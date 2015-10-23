import Cycle from '@cycle/core';
import {makeDOMDriver, h} from '@cycle/dom';
import { makeFetchDriver } from '@cycle/fetch';

const { div, span, h1, h2, h3, h6, section, ul, li, button } = require('hyperscript-helpers')(h);
const DARK_JEDIS_URL = 'http://localhost:3000/dark-jedis/';
const emptyJedi = { name: '', homeworld: { name: '' } }  ;

const ws = new WebSocket("ws://localhost:4000");
var data$ = Cycle.Rx.Observable.create(observer => {
  ws.onmessage = (event) => {
    var d = JSON.parse(event.data);
    observer.onNext(d);
    console.log(d);
  };
});

var mock =
[
  { name: 'Jorak Uln', homeworld: { name: 'Korriban'} },
  { name: 'Skere Kaan', homeworld: {name: 'Coruscant'} },
  { name: 'Na\'daz', homeworld: {name: 'Ryloth'} },
  { name: 'Kas\'im', homeworld: {name: 'Nal Hutta'} },
  { name: 'Darth Bane', homeworld: {name: 'Apatros'} },
];

function renderDashboard(plant$, cursor$, siths$) {
  return (

      div({ className: 'app-container'}, [
        div({className: 'css-root'}, [
          renderCurrentPlanet(plant$),

          siths$.map(siths =>
            section({ className: 'css-scrollable-list' }, [
              ul({ className: 'css-slots' }, siths.map(jedi =>
                renderJedi(jedi)
              )),

              renderNavigation()
            ])
          )

        ])
      ])
  );
}

function renderCurrentPlanet(plant$) {
  return (
    plant$.map(x =>
      h1({ className: 'css-planet-monitor' }, 'Obi-Wan currently on ' + x.name)
    )
  );
}

function renderJedi(model) {
  return (
    model.map(jedi =>
    li({ className: 'css-slot' }, [
        h3(jedi.name),
        h6(jedi.homeworld.name)
    ]))
  );
}

function renderNavigation() {
  return (
    div({ className: 'css-scroll-buttons' }, [
      button('.up', { className: 'css-button-up' }),
      button('.down', { className: 'css-button-down' })
    ])
  );
}

let requestObserver;
function createDarkJedisStream({id, cursor}) {
  let requestStream$ = Cycle.Rx.Observable.create(function (observer) {
    requestObserver = observer;
    observer.onNext({id, cursor});
  }, err => {
    observer.onError(err);
  })

  return requestStream$
    .map((x) => {
      return {
        url: DARK_JEDIS_URL + String(x.id),
        method: 'GET',
        cursor: x.cursor,
        key: x.cursor
      };
    });
}

function createDarkJediResponse(Fetch, slot) {
  var response$ = Fetch
    .byKey(slot)
    .mergeAll()
    .flatMap(res => res.json())
    .startWith(emptyJedi);

  return Cycle.Rx.Observable.create(o => {
    response$.subscribe(x => {
      o.onNext(x);
    }, err => {

    }, () => {
      console.log('fetch completed');
    });
  });
}

function createDarkJediStream(slot$) {
  return slot$.startWith('3616')
    .combineLatest(responseStream$,
    function (x,y) {
      return y;
    })
    .startWith(emptyJedi);
}

const scrollSize = 2;
const numberOfSlots = 5;

function makeDashboard(cursor$, planet$, siths$) {
  return Cycle.Rx.Observable.return('startup').map(x =>
    renderDashboard(planet$, cursor$, siths$)
  );
}

function main({DOM, Fetch}) {
  let model$ = data$.startWith({ name: '?' });
  let upAction$ = DOM.select('.up').events('click');
  let downAction$ = DOM.select('.down').events('click');
  let refreshAction$ = DOM.select('.down').events('click').startWith('start up');

  let action$ = Cycle.Rx.Observable.merge(
    DOM.select('.down').events('click').map(ev => -scrollSize),
    DOM.select('.up').events('click').map(ev => +scrollSize)
  );
  let cursor$ = action$.startWith(0).scan((x,y) => x+y);

  // start-up requests
  let requestStream$ = refreshAction$.startWith('3616')
  .map(function (id) {
    return DARK_JEDIS_URL + String(id);
  });
  let responseStream$ = requestStream$
  .flatMap(function (requestUrl) {
    return {
      url: requestUrl,
      key: id
    };
  });

  // let responseSlot1$ = upAction$
  //   .startWith('startup click')
  //   .combineLatest(createDarkJediResponse(HTTP, 1)
  //                 .do(x => {
  //                   requestObserver.onNext({id: x.master.id, cursor: 2});
  //                 }),
  //                 function (click, jedi) {
  //                   return jedi;
  //                 })
  //   .startWith(emptyJedi);
    let responseSlot1$ = createDarkJediResponse(Fetch, 1);
    // .do(x => {
    //   requestObserver.onNext({id: x.master.id, cursor: 2});
    // })
    // .merge(upAction$.map(function () {
    //   return emptyJedi;
    // }));
    let responseSlot2$ = createDarkJediResponse(Fetch, 2);
    // .do(x => {
    //   requestObserver.onNext({id: x.master.id, cursor: 3});
    // })
    // .merge(upAction$.map(function () {
    //   return emptyJedi;
    // }));
    let responseSlot3$ = createDarkJediResponse(Fetch, 3);
    // .do(x => {
    //   requestObserver.onNext({id: x.master.id, cursor: 4});
    // })
    let responseSlot4$ = createDarkJediResponse(Fetch, 4);
    // .do(x => {
    //   requestObserver.onNext({id: x.master.id, cursor: 5});
    // });
    let responseSlot5$ = createDarkJediResponse(Fetch, 5);

  const requestStartUp$ = createDarkJedisStream({id: 3616, cursor: 1});
  // .merge(refreshAction$.combineLatest(responseSlot1$, function (x, y) {
  //   return {
  //     url: y.master.url,
  //     method: 'GET',
  //     cursor: 2,
  //   };
  // }))
  // .merge(refreshAction$.combineLatest(responseSlot2$, function (x, y) {
  //   return {
  //     url: y.master.url,
  //     method: 'GET',
  //     cursor: 3,
  //   };
  // }))
  // .merge(refreshAction$.combineLatest(responseSlot3$, function (x, y) {
  //   return {
  //     url: y.master.url,
  //     method: 'GET',
  //     cursor: 4,
  //   };
  // }))
  // .merge(refreshAction$.combineLatest(responseSlot4$, function (x, y) {
  //   return {
  //     url: y.master.url,
  //     method: 'GET',
  //     cursor: 5,
  //   };
  // }))
  // .merge(upAction$.combineLatest(responseSlot4$, function (x, y) {
  //   return {
  //     url: y.apprentice.url,
  //     method: 'GET',
  //     cursor: 2,
  //   };
  // }))
  // .merge(upAction$.combineLatest(responseSlot3$, function (x, y) {
  //   return {
  //     url: y.apprentice.url,
  //     method: 'GET',
  //     cursor: 1,
  //   };
  // }));

  // master-request (click up)

  // const masterRequest$ = upAction$.combineLatest(
  //   responseSlot2$, function (x, y) {
  //     return y;
  //   }
  // )
  // .map(q => {
  //   return {
  //     url: q.apprentice.url,
  //     method: 'GET',
  //     cursor: 2,
  //   };
  // });

  let siths = [
    responseSlot1$.startWith(emptyJedi),
    responseSlot2$.startWith(emptyJedi),
    responseSlot3$.startWith(emptyJedi),
    responseSlot4$.startWith(emptyJedi),
    responseSlot5$.startWith(emptyJedi),
  ];

  var x$ = cursor$.combineLatest(
    responseSlot1$,
    responseSlot2$,
    responseSlot3$,
    responseSlot4$,
    responseSlot5$,
    function (cursor, s1, s2, s3, s4, s5) {
      return [
        Cycle.Rx.Observable.return(s1),
        Cycle.Rx.Observable.return(emptyJedi),
        Cycle.Rx.Observable.return(emptyJedi),
        Cycle.Rx.Observable.return(emptyJedi),
        Cycle.Rx.Observable.return(emptyJedi)
      ];
    });

  const request$ = requestStartUp$; //.merge(masterRequest$);

  return {
    DOM: makeDashboard(cursor$, model$, x$),
    Fetch: request$
  };
}

let drivers = {
  DOM: makeDOMDriver('#app'),
  Fetch: makeFetchDriver()
};

Cycle.run(main, drivers);
