import { getIsAborted } from '../state.js';
import { t } from '../i18n.js';

export async function asyncPool(iterable, iteratorFn, concurrencyLimit) {
  const result = [];
  const executing = new Set();

  for (const item of iterable) {
    if (getIsAborted()) throw new Error(t('abortedByUser'));

    const p = Promise.resolve().then(() => iteratorFn(item));
    result.push(p);
    executing.add(p);

    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);

    if (executing.size >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(result);
}
