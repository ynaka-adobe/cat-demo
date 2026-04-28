/**
 * UE item block for Cards Category — mirrors Card styling/behavior for authored rows.
 */
import cardInit from '../card/card.js';

export default function init(el) {
  el.classList.add('card');
  return cardInit(el);
}
