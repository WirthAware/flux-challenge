import Rx from 'rx';
import { h } from '@cycle/dom';
const { div, span, h1, h2, h3, h6, section, ul, li, button } = require('hyperscript-helpers')(h);

// no intent
function intent(DOM) {

}

function model() {
  const ws = new WebSocket("ws://localhost:4000");
  return Rx.Observable.create(observer => {
    ws.onmessage = (event) => {
      var d = JSON.parse(event.data);
      observer.onNext(d);
      console.log(d);
    };
  }).startWith(null);
}

function view(state$) {
  return (
    state$.map(planet =>
      h1({ className: 'css-planet-monitor' }, 'Obi-Wan currently on ' + ((planet != null) ? planet.name : '. . .') )
    )
  );
}

export function planet () {
  return view(model());
}
