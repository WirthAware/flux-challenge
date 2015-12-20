import Rx from 'rx';
import Cycle from '@cycle/core';
import { makeDOMDriver, h } from '@cycle/dom';
import { makeFetchDriver } from '@cycle/fetch';
import {makeWSDriver} from './drivers'

const { div, span, h1, h2, h3, h6, section, ul, li, button } = require('hyperscript-helpers')(h);

import { view } from './view';
import { model } from './model';
import { intent } from './intent';

import darkjedifetcher from './datafetcher';


function main(responses) {
  const $request = Rx.Observable.just('');

  const planet$ = responses.WS.map(msg => JSON.parse(msg.data)).shareReplay(1)
  const actions = intent(responses);
  const proxyState$ = new Rx.ReplaySubject(1);
  const { request$, response$} = darkjedifetcher(responses.Fetch, proxyState$);
  const state$ = model(planet$, response$, actions);
  const vtree$ = view(state$);

  state$.subscribe(proxyState$);

  return {
    DOM: vtree$,
    Fetch: request$
  };
}

let drivers = {
  DOM: makeDOMDriver('#app'),
  Fetch: makeFetchDriver(),
  WS: makeWSDriver('ws://localhost:4000')
};

Cycle.run(main, drivers);
