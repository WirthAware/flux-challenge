import Cycle from '@cycle/core';
import {makeDOMDriver, h} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

const { div, span, h1, h2, h3, h6, section, ul, li, button } = require('hyperscript-helpers')(h);

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

function renderDashboard(model, siths) {
  return (
    div({ className: 'app-container'}, [
      div({className: 'css-root'}, [
        renderCurrentPlanet(model.name),

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

function renderCurrentPlanet(currentPlanet) {
  return (
    h1({ className: 'css-planet-monitor' }, 'Obi-Wan currently on ' + currentPlanet)
  );
}

function renderJedi(model) {
  return (
    li({ className: 'css-slot' }, [
        h3(model.value.name),
        h6(model.value.homeworld.name)
    ])
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
function getDarkJedis(id, count) {
  return Cycle.Rx.Observable.create(function (observer) {
    requestObserver = observer;
    observer.onNext({id, count});
  }, err => {
    observer.onError(err);
  });
}

function main({DOM, HTTP}) {
  const URL = 'http://localhost:3000/dark-jedis/';

  const emptyJedi = { name: '', homeworld: { name: '' } }  ;

  let siths = [
    Cycle.Rx.Observable.just(emptyJedi),
    Cycle.Rx.Observable.just(emptyJedi),
    Cycle.Rx.Observable.just(emptyJedi),
    Cycle.Rx.Observable.just(emptyJedi),
    Cycle.Rx.Observable.just(emptyJedi),
  ];
  let model$ = data$.startWith({ name: '?' });

  let upAction$ = DOM.select('.up').events('click');
  let downAction$ = DOM.select('.down').events('click');

  let requestJediStream = getDarkJedis(3616); //Cycle.Rx.Observable.return({id: 3616});

  let getDarkJedis$ = requestJediStream
    .map((x) => {
      return {
        url: URL + String(x.id),
        method: 'GET'
      };
    });

    // .flatMap(id => {
    //   return Cycle.Rx.Observable.create(observer => {
    //     observerReq = observer;
    //     observer.onNext(id);
    //   }, err => {
    //     observer.onError(err);
    //   });
    // })

  let responseStream$ = HTTP
              .filter(res$ => res$.request.url.indexOf(URL) === 0)
              // .mergeAll()
              .flatMap(x => x)
              .map(res => res.body);

  const masterRequest$ = upAction$.map(q => {
    return {
      url: URL + String(3616),
      method: 'GET'
    };
  });

  var test = getDarkJedis$.first().combineLatest(responseStream$, function (x, y) {
    return y;
  }).startWith(null);
  test.subscribe(x => {
    console.log(x);
  });

  responseStream$.subscribe(x => {
    console.log(x);

    if (x != null && x.master != null) {
      requestObserver.onNext({id: x.master.id});
    }
  }, err => console.log,
  () => {
    console.log('reg completed');
  });

  const request$ = getDarkJedis$.merge(masterRequest$);

  request$.subscribe(function (x) {
    console.log(x);
  });

  var soudce = responseStream$.take(5).toArray();
  soudce.subscribe(x => {
    console.log(x);
  });

  return {
    DOM: model$.map(data =>
      renderDashboard(data, siths)
    ),
    // DOM: siths$.map(x => {
    //   renderDashboard({name: 'test'}, x)
    // }),
    HTTP: request$
  };
}

let drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
};

Cycle.run(main, drivers);
