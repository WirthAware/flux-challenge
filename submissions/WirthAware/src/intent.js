import {Observable} from 'rx'
import {scrollSize, numberOfSlots} from './const';

export function intent(responses) {
  const action$ = Observable.merge(
    responses.DOM.select('.down').events('click').map(ev => -scrollSize),
    responses.DOM.select('.up').events('click').map(ev => +scrollSize)
  );

  return {
    navigation$: action$
  };
}
