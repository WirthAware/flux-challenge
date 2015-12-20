import {Observable} from 'rx'
import {h} from '@cycle/dom';
const { div, span, h1, h2, h3, h6, section, ul, li, button } = require('hyperscript-helpers')(h);

function renderSlots(state) {
  return (
      section({ className: 'css-scrollable-list' }, [
        ul({ className: 'css-slots' }, state.slots.map(jedi =>
          renderJedi(jedi)
        )),

        renderNavigation()
      ])
  );
}

function renderJedi(jedi) {
  return (
    li({ className: 'css-slot' }, [
      jedi == null ? null :
        h3( jedi.name),
      jedi == null ? null :
        h6(jedi.homeworld.name)
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

function renderPlanet($state) {
  return h1({ className: 'css-planet-monitor' },
    $state.planet ? `Obi-Wan currently on ${$state.planet.name}` : ''
  )
}

export function view(state$) {
  return state$.map(state =>
    div({ className: 'app-container'}, [
      div({className: 'css-root'}, [
        renderPlanet(state),
        renderSlots(state)
      ])
    ])
  )
}
