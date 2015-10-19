import Cycle from '@cycle/core';
import {makeDOMDriver, h} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

const { div, span, h1, h2, h3, h6, section, ul, li, button } = require('hyperscript-helpers')(h);
const DARK_JEDIS_URL = 'http://localhost:3000/dark-jedis/';

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

function renderDashboard(plant$, siths) {
  return (
    div({ className: 'app-container'}, [
      div({className: 'css-root'}, [
        renderCurrentPlanet(plant$),

        section({ className: 'css-scrollable-list' }, [
          ul({ className: 'css-slots' }, siths.map(jedi =>
            renderJedi(jedi)
          )),

          renderNavigation()
        ])

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
      };
    });
}

function createDarkJediResponse(HTTP, slot) {
  return HTTP
    .filter(res$ => res$.request.url.indexOf(DARK_JEDIS_URL) === 0 && res$.request.cursor === slot)
    .flatMap(x => x)
    .map(res => res.body);
}

function main({DOM, HTTP}) {
  const emptyJedi = { name: '', homeworld: { name: '' } }  ;

  let model$ = data$.startWith({ name: '?' });
  let upAction$ = DOM.select('.up').events('click');
  let downAction$ = DOM.select('.down').events('click');

  // start-up requests
  const requestStartUp$ = createDarkJedisStream({id: 3616, cursor: 1});
  let responseSlot1$ = createDarkJediResponse(HTTP, 1)
  .do(x => {
    requestObserver.onNext({id: x.master.id, cursor: 2});
  });
  let responseSlot2$ = createDarkJediResponse(HTTP, 2)
  .do(x => {
    requestObserver.onNext({id: x.master.id, cursor: 3});
  });
  let responseSlot3$ = createDarkJediResponse(HTTP, 3)
  .do(x => {
    requestObserver.onNext({id: x.master.id, cursor: 4});
  });
  let responseSlot4$ = createDarkJediResponse(HTTP, 4)
  .do(x => {
    requestObserver.onNext({id: x.master.id, cursor: 5});
  });
  let responseSlot5$ = createDarkJediResponse(HTTP, 5);

  // master-request (click up)
  upAction$.subscribe(function (e) {
    responseSlot1$ = Cycle.Rx.Observable.return(emptyJedi);
  });

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

  const request$ = requestStartUp$; //.merge(masterRequest$);

  return {
    DOM: Cycle.Rx.Observable.return('').map(x =>
      renderDashboard(model$, siths)
    ),
    HTTP: request$
  };
}

let drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
};

Cycle.run(main, drivers);
