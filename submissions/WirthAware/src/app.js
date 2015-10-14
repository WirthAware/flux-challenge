import Cycle from '@cycle/core';
import {makeDOMDriver, h} from '@cycle/dom';
const { div, span, h1, h2, h3, h6, section, ul, li } = require('hyperscript-helpers')(h);

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
  { name: 'Jorak Uln', homeworld: 'Korriban' },
  { name: 'Skere Kaan', homeworld: 'Coruscant' },
  { name: 'Na\'daz', homeworld: 'Ryloth' },
  { name: 'Kas\'im', homeworld: 'Nal Hutta' },
  { name: 'Darth Bane', homeworld: 'Apatros' },
];

function main({DOM}) {
  var array = mock;
  const items$ = Cycle.Rx.Observable.of(array);
  var model$ = data$.startWith({ name: '?' });

  return {
    DOM: model$.map(data =>
      div({ className: 'app-container'}, [
        div({className: 'css-root'}, [
          h1({ className: 'css-planet-monitor' }, 'Obi-Wan currently on ' + data.name),

          section({ className: 'css-scrollable-list' }, [
            ul({ className: 'css-slots' }, array.map(item =>
              li({ className: 'css-slot' }, [
                  h3(item.name),
                  h6(item.homeworld)
              ])
            ))
          ])

        ])
      ])
    )
  };
}

let drivers = {
  DOM: makeDOMDriver('#app')
};

Cycle.run(main, drivers);
