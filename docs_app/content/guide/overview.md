# 介绍

RxJS是一个用于通过使用可观察的序列，来组成异步和基于事件的程序的技术库。它提供了核心对象[Observable](./guide/observable)，附属对象**(Observer、Scheduler、Subject)**和受[Array#extras](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/New_in_JavaScript/1.6)启发的运算符**(map, filter, reduce, every等)**，以将异步事件作为集合来处理。

<span class="informal">可以把**RxJS**看作是处理事件的**lodash**</span>

ReactiveX 结合了 [观察者模式](https://baike.baidu.com/item/%E8%A7%82%E5%AF%9F%E8%80%85%E6%A8%A1%E5%BC%8F)、[迭代器模式](https://baike.baidu.com/item/%E8%BF%AD%E4%BB%A3%E5%99%A8%E6%A8%A1%E5%BC%8F) 和 使用集合的函数式编程，以满足编写理想的管理事件序列方法的需要。

RXJS中解决异步事件管理的基本概念:

- **Observable(可观察对象):** 一个可调用的未来值或者事件的集合。
- **Observer(观察者):** 一组回调函数的集合,每个回调函数对应一种Observable发送的通知类型:next,error,complete。
- **Subscription(订阅):** 可清理资源的对象,通常是 Observable(可观察对象) 的执行对象,可取消 Observable(可观察对象) 的执行。
- **Operators(操作符):** 纯函数(pure function)，它支持函数式编程风格，可使用诸如`map`、`filter`、`concat`、`reduce`等，操作符的处理集合。
- **Subject(主题):** 一种特殊类型的Observable，允许将值多播到多个观察者Observer。虽然普通的Observable是单播的（每个订阅的Observer都拥有Observable的独立执行），但Subject是多播的。
- **Schedulers(调度器):** 调度Observable、Observer，以控制事件发出的顺序和速度的。例如： `setTimeout` 或 `requestAnimationFrame` 等等。

## 第一个例子

监听事件的通常写法：

```ts
document.addEventListener('click', () => console.log('Clicked!'));
```

用**RxJS**时，可以用**observable(可观察对象)**代替：

```ts
import { fromEvent } from 'rxjs';

fromEvent(document, 'click').subscribe(() => console.log('Clicked!'));
```

### 纯粹性(Purity)

RxJS强大的原因是它使用纯函数来生成值。这意味着代码不太容易出错。

通常你会创建一个非纯函数，使用全局变量，如此一来使用此非纯函数会改变全局变量的值，在不知不觉间影响程序的关联状态。

```ts
let count = 0;
document.addEventListener('click', () => console.log(`Clicked ${++count} times`));
```

使用rxjs可以隔离状态。

```ts
import { fromEvent } from 'rxjs';
import { scan } from 'rxjs/operators';

fromEvent(document, 'click')
  .pipe(scan(count => count + 1, 0))
  .subscribe(count => console.log(`Clicked ${count} times`));
```

**scan操作符**与数组的reduce方法类似。它接收一个回调函数作为累加器。回调函数会返回一个值，作为下次调用此回调的参数。

### 流(Flow)

rxjs有一套完整的操作符，可以帮助您控制事件如何通过你的可观察对象。

使用普通的javascript，您将允许每秒最多单击一次：

```ts
let count = 0;
let rate = 1000;
let lastClick = Date.now() - rate;
document.addEventListener('click', () => {
  if (Date.now() - lastClick >= rate) {
    console.log(`Clicked ${++count} times`);
    lastClick = Date.now();
  }
});
```

使用RxJS:

```ts
import { fromEvent } from 'rxjs';
import { throttleTime, scan } from 'rxjs/operators';

fromEvent(document, 'click')
  .pipe(
    throttleTime(1000),
    scan(count => count + 1, 0)
  )
  .subscribe(count => console.log(`Clicked ${count} times`));
```

其他流控制操作符有：[**filter**](../api/operators/filter), [**delay**](../api/operators/delay), [**debounceTime**](../api/operators/debounceTime), [**take**](../api/operators/take), [**takeUntil**](../api/operators/takeUntil), [**distinct**](../api/operators/distinct), [**distinctUntilChanged**](../api/operators/distinctUntilChanged) 等。

### 值(Values)

您可以转换流经可观察者对象的值。

下面是如何用普通javascript，为每次单击累加当前鼠标x坐标的方法：

```ts
let count = 0;
const rate = 1000;
let lastClick = Date.now() - rate;
document.addEventListener('click', event => {
  if (Date.now() - lastClick >= rate) {
    count += event.clientX;
    console.log(count);
    lastClick = Date.now();
  }
});
```

使用RxJS:

```ts
import { fromEvent } from 'rxjs';
import { throttleTime, map, scan } from 'rxjs/operators';

fromEvent(document, 'click')
  .pipe(
    throttleTime(1000),
    map(event => event.clientX),
    scan((count, clientX) => count + clientX, 0)
  )
  .subscribe(count => console.log(count));
```

其他产生值的操作符：[**pluck**](../api/operators/pluck), [**pairwise**](../api/operators/pairwise), [**sample**](../api/operators/sample) 等。
