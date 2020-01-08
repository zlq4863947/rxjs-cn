import { Operator } from '../Operator';
import { Subscriber } from '../Subscriber';
import { Observable } from '../Observable';
import { OperatorFunction } from '../types';

/**
 * 每次源可观察对象发出值时，将值映射成常量。
 *
 * <span class="informal">类似 {@link map}, 但每次都会将每个源值映射为相同的输出值。</span>
 *
 * ![](mapTo.png)
 *
 * 以常量`值`作为参数，并在源可观测对象发出值时映射为此常量。也就是说，忽略实际的源值，只使用发射时机来发射指定的`值`。
 *
 * ## Example
 * 将每次点击都映射为字符串“Hi”
 * ```ts
 * import { fromEvent } from 'rxjs';
 * import { mapTo } from 'rxjs/operators';
 *
 * const clicks = fromEvent(document, 'click');
 * const greetings = clicks.pipe(mapTo('Hi'));
 * greetings.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link map}
 *
 * @param {any} value 将每个源值映射成常量。
 * @return {Observable} 每次源可观察对象发出值时，都会映射成`指定的值`。
 * @method mapTo
 * @owner Observable
 */
export function mapTo<T, R>(value: R): OperatorFunction<T, R> {
  return (source: Observable<T>) => source.lift(new MapToOperator(value));
}

class MapToOperator<T, R> implements Operator<T, R> {

  value: R;

  constructor(value: R) {
    this.value = value;
  }

  call(subscriber: Subscriber<R>, source: any): any {
    return source.subscribe(new MapToSubscriber(subscriber, this.value));
  }
}

/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
class MapToSubscriber<T, R> extends Subscriber<T> {

  value: R;

  constructor(destination: Subscriber<R>, value: R) {
    super(destination);
    this.value = value;
  }

  protected _next(x: T) {
    this.destination.next(this.value);
  }
}
