import { OperatorFunction, ObservedValueOf } from '../../internal/types';
import { mergeMap } from './mergeMap';
import { ObservableInput } from '../types';

/* tslint:disable:max-line-length */
export function mergeMapTo<T, O extends ObservableInput<any>>(innerObservable: O, concurrent?: number): OperatorFunction<any, ObservedValueOf<O>>;
/** @deprecated */
export function mergeMapTo<T, R, O extends ObservableInput<any>>(innerObservable: O, resultSelector: (outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R, concurrent?: number): OperatorFunction<T, R>;
/* tslint:enable:max-line-length */

/**
 * 将每个源值映射到同一个可观察对象中，并将其在输出的可观察对象中多次合并。
 *
 * <span class="informal">类似 {@link mergeMap}, 但会将每个值映射到相同的内部可观察对象。</span>
 *
 * ![](mergeMapTo.png)
 *
 * 不管源值如何，都将每个源值映射到指定的<b>可观察对象</b>的<b>内部可观察对象</b>，
 * 然后将结果<b>可观察对象</b>合并为一个<b>可观察对象</b>，即输出的<b>可观察对象</b>。
 *
 * ## Example
 * 以点击事件为源，之后每隔1秒启动一个内部可观察对象
 * ```ts
 * import { fromEvent, interval } from 'rxjs';
 * import { mergeMapTo } from 'rxjs/operators';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(mergeMapTo(interval(1000)));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link concatMapTo}
 * @see {@link merge}
 * @see {@link mergeAll}
 * @see {@link mergeMap}
 * @see {@link mergeScan}
 * @see {@link switchMapTo}
 *
 * @param innerObservable 从源可观察对象中替换每个值的可观察对象
 * @param resultSelector
 * @param {number} [concurrent=Number.POSITIVE_INFINITY] 可同时订阅的输入可观察对象的最大数。
 * @return {Observable} 从指定的<b>内部可观察对象</b>中发发出值的<b>可观察对象</b>
 * @method mergeMapTo
 * @owner Observable
 */
export function mergeMapTo<T, R, O extends ObservableInput<any>>(
  innerObservable: O,
  resultSelector?: ((outerValue: T, innerValue: ObservedValueOf<O>, outerIndex: number, innerIndex: number) => R) | number,
  concurrent: number = Number.POSITIVE_INFINITY
): OperatorFunction<T, ObservedValueOf<O>|R> {
  if (typeof resultSelector === 'function') {
    return mergeMap(() => innerObservable, resultSelector, concurrent);
  }
  if (typeof resultSelector === 'number') {
    concurrent = resultSelector;
  }
  return mergeMap(() => innerObservable, concurrent);
}
