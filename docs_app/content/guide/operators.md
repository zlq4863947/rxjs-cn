# 操作符(Operators)

RxJS 的**操作符**非常有用。它是使复杂的异步代码易于以声明的方式编写的基本组成部分。

## 操作符是什么?

操作符是**方法的集合**。它有两种类型：

### 1、管道操作符
**管道操作符(Pipeable Operators)** 是一种可以通过管道传递可观察对象的操作符，使用的语法是: `observableInstance.pipe(operator())`。属于管道操作符的有: [`filter(...)`](/api/operators/filter) 和 [`mergeMap(...)`](/api/operators/mergeMap)。当调用时，它们不会改变现有的**可观察对象实例**。而是返回一个新的可观察对象，其订阅逻辑基于前一个可观察对象。

<span class="informal">管道操作符是一个函数，它的输入参数为一个可观察对象，然后返回另一个可观察对象。这是一种纯函数的操作：先前的可观测数据保持不变。</span>

管道操作符本质上是一种纯函数，它以一个可观察对象作为输入参数，生成另一个可观察对象作为返回值。订阅其输出的可观察对象的同时，也会订阅其输入的可观察对象。

### 2、创建操作符
**创建操作符(Creation Operators)** 是一种可以创建可观察对象的操作符。使用示例： `of(1, 2, 3)` 创建一个可观察对象，然后发送： 1、 2、3, 创建操作符将在后面的部分中进行更加详细的讨论。

例如：[`map`操作符](/api/operators/map) 类似于同名的数组方法。 就像 `[1, 2, 3].map(x => x * x)` 将输出 `[1, 4, 9]`一样, 创建的可观察对象也是如此:

```ts
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

map(x => x * x)(of(1, 2, 3)).subscribe((v) => console.log(`value: ${v}`));

// 输出:
// value: 1 
// value: 4
// value: 9 

```

将发出`1`、`4`、`9`。另一个比较有用的操作符是[`first`](/api/operators/first)：

```ts
import { of } from 'rxjs';
import { first } from 'rxjs/operators';

first()(of(1, 2, 3).subscribe((v) => console.log(`value: ${v}`));

// 输出:
// value: 1 
```

注意，`map`逻辑上必须动态构建，因此必须为其提供映射方法。相比之下，`first`可以是一个常数，但仍然是动态构建的。通常，无论是否需要使用参数，都会构造所有的操作符。

## 管道

管道操作符是方法的集合，因此它们可以像普通函数一样被使用：`op()(obs)`
- 但实际上，它们往往被堆积在一起，并变得不易理解：`op4()(op3()(op2()(op1()(obs))))`。 所以，可观察对象具有方法: `.pipe()`，该方法可以实现相同的操作，但更易于阅读：

```ts
obs.pipe(
  op1(),
  op2(),
  op3(),
  op3(),
)
```

从风格上讲，即使只有一个操作符，也不要使用`op()(obs)`。 一般建议使用 `obs.pipe(op())` 。

## 创建操作符

**操作符是什么?** 与管道操作符不同，创建操作符是用于创建具有某些常见预定义行为或通过加入其他可观察的对象的函数。

创建操作符的典型示例是`interval`方法。 它以数字（不是可观察对象）作为输入参数，并输出可观察对象：

```ts
import { interval } from 'rxjs';

const observable = interval(1000 /* 毫秒 */);
```

请参阅[全部静态创建操作符](#creation-operators)的列表。


## 高阶可观察对象

可观察对象一般是有顺序的发送值（数字或字符串），但是也有例外，通常需要有可以处理`可观察对象`的可观察对象，叫做高阶可观察对象。例如，假设您有一个可观察对象发送字符串，这些字符串是您要查看的文件的URL。代码如下：

```ts
const fileObservable = urlObservable.pipe(
   map(url => http.get(url)),
);
```

`http.get()` 为每个URL返回一个可观察对象（可能是字符串或字符串数组）。 现在，您有一个可观察对象的可观察对象，即高阶可观察对象。

但是如何处理高阶可观察对象? 通常，通过 _flattening_：（以某种方式）将高阶可观察对象转换为普通可观察对象。 例如：

```ts
const fileObservable = urlObservable.pipe(
   map(url => http.get(url)),
   concatAll(),
);
```

[`concatAll()`](/api/operators/concatAll)操作符订阅可以将全部的"内部"可观察对象打平，并发出所有的值。

其他有用的扁平化操作符（称为[*组合操作符*](#join-operators)）有：

* [`mergeAll()`](/api/operators/mergeAll) — 订阅每个内部可观察对象,当值到达时立即发出。
* [`switchAll()`](/api/operators/switchAll) — 当第一个内部可观察对象到达时订阅它，并在它到达时发出每个值，但是当下一个内部可观察对象到达时，取消订阅前一个，并订阅新的。
* [`exhaust()`](/api/operators/exhaust) — 订阅到达的第一个内部可观察对象，并在到达时发出每个值，丢弃所有新到达的内部可观察对象，直到第一个完成，然后等待下一个内部可观察对象。

就像许多数组库将 [`map()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/map) 和 [`flat()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/flat) (或 `flatten()`) 合并为一个 [`flatMap()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap)一样, 

所有的RxJS打平操作符[`concatMap()`](/api/operators/concatMap)、[`mergeMap()`](/api/operators/mergeMap)、[`switchMap()`](/api/operators/switchMap)、[`exhaustMap()`](/api/operators/exhaustMap)都有对应的映射。


## 弹珠图(Marble diagrams)

为了解释操作符是如何工作的，文本描述通常是不够的。许多操作符都与时间有关，但途式不同，例如延迟(delay)、采样(sample)、节流(throttle)或去抖动值(debonce)。图表的表示会更加清晰。

*弹珠图* 是操作符工作方式的可视化表述，包括输入可观察对象、操作符及其参数和输出可观察对象。

<span class="informal">在弹珠图中, 时间从左向右流动, 并且描述了如何在可观察对象执行过程中发出值("弹珠")。</span>

您可以在下面看到弹珠图的解剖图。

<img src="assets/images/guide/marble-diagram-anatomy.svg">

在整个文档站点中，我们广泛使用弹珠图来说明操作符的工作方式。它们在其他环境中也非常有用，例如在白板上，甚至在我们的单元测试中（如ASCII图）。

## 操作符类别

有很多用于不同目的的运算符，它们可以归类为：创建，转换，过滤，组合，多播，错误处理，工具等。在下面的列表中，您将找到按类别分类的所有运算符。

有关完整的概述，请查看[参考页面](/api)。

### 创建操作符

- [`ajax`](/api/ajax/ajax)
- [`bindCallback`](/api/index/function/bindCallback)
- [`bindNodeCallback`](/api/index/function/bindNodeCallback)
- [`defer`](/api/index/function/defer)
- [`empty`](/api/index/function/empty)
- [`from`](/api/index/function/from)
- [`fromEvent`](/api/index/function/fromEvent)
- [`fromEventPattern`](/api/index/function/fromEventPattern)
- [`generate`](/api/index/function/generate)
- [`interval`](/api/index/function/interval)
- [`of`](/api/index/function/of)
- [`range`](/api/index/function/range)
- [`throwError`](/api/index/function/throwError)
- [`timer`](/api/index/function/timer)
- [`iif`](/api/index/function/iif)

### 创建组合操作符
这些虽然是创建运算符，也具有组合功能-发出多个源的可观察对象的值。

- [`combineLatest`](/api/index/function/combineLatest)
- [`concat`](/api/index/function/concat)
- [`forkJoin`](/api/index/function/forkJoin)
- [`merge`](/api/index/function/merge)
- [`race`](/api/index/function/race)
- [`zip`](/api/index/function/zip)

### 转换操作符

- [`buffer`](/api/operators/buffer)
- [`bufferCount`](/api/operators/bufferCount)
- [`bufferTime`](/api/operators/bufferTime)
- [`bufferToggle`](/api/operators/bufferToggle)
- [`bufferWhen`](/api/operators/bufferWhen)
- [`concatMap`](/api/operators/concatMap)
- [`concatMapTo`](/api/operators/concatMapTo)
- [`exhaust`](/api/operators/exhaust)
- [`exhaustMap`](/api/operators/exhaustMap)
- [`expand`](/api/operators/expand)
- [`groupBy`](/api/operators/groupBy)
- [`map`](/api/operators/map)
- [`mapTo`](/api/operators/mapTo)
- [`mergeMap`](/api/operators/mergeMap)
- [`mergeMapTo`](/api/operators/mergeMapTo)
- [`mergeScan`](/api/operators/mergeScan)
- [`pairwise`](/api/operators/pairwise)
- [`partition`](/api/operators/partition)
- [`pluck`](/api/operators/pluck)
- [`scan`](/api/operators/scan)
- [`switchMap`](/api/operators/switchMap)
- [`switchMapTo`](/api/operators/switchMapTo)
- [`window`](/api/operators/window)
- [`windowCount`](/api/operators/windowCount)
- [`windowTime`](/api/operators/windowTime)
- [`windowToggle`](/api/operators/windowToggle)
- [`windowWhen`](/api/operators/windowWhen)

### 过滤操作符

- [`audit`](/api/operators/audit)
- [`auditTime`](/api/operators/auditTime)
- [`debounce`](/api/operators/debounce)
- [`debounceTime`](/api/operators/debounceTime)
- [`distinct`](/api/operators/distinct)
- [`distinctKey`](../class/es6/Observable.js~Observable.html#instance-method-distinctKey)
- [`distinctUntilChanged`](/api/operators/distinctUntilChanged)
- [`distinctUntilKeyChanged`](/api/operators/distinctUntilKeyChanged)
- [`elementAt`](/api/operators/elementAt)
- [`filter`](/api/operators/filter)
- [`first`](/api/operators/first)
- [`ignoreElements`](/api/operators/ignoreElements)
- [`last`](/api/operators/last)
- [`sample`](/api/operators/sample)
- [`sampleTime`](/api/operators/sampleTime)
- [`single`](/api/operators/single)
- [`skip`](/api/operators/skip)
- [`skipLast`](/api/operators/skipLast)
- [`skipUntil`](/api/operators/skipUntil)
- [`skipWhile`](/api/operators/skipWhile)
- [`take`](/api/operators/take)
- [`takeLast`](/api/operators/takeLast)
- [`takeUntil`](/api/operators/takeUntil)
- [`takeWhile`](/api/operators/takeWhile)
- [`throttle`](/api/operators/throttle)
- [`throttleTime`](/api/operators/throttleTime)

### 组合操作符
另请参见上面的[创建组合操作符](#join-creation-operators)。

- [`combineAll`](/api/operators/combineAll)
- [`concatAll`](/api/operators/concatAll)
- [`exhaust`](/api/operators/exhaust)
- [`mergeAll`](/api/operators/mergeAll)
- [`startWith`](/api/operators/startWith)
- [`withLatestFrom`](/api/operators/withLatestFrom)

### 多播操作符

- [`multicast`](/api/operators/multicast)
- [`publish`](/api/operators/publish)
- [`publishBehavior`](/api/operators/publishBehavior)
- [`publishLast`](/api/operators/publishLast)
- [`publishReplay`](/api/operators/publishReplay)
- [`share`](/api/operators/share)

### 错误处理操作符

- [`catchError`](/api/operators/catchError)
- [`retry`](/api/operators/retry)
- [`retryWhen`](/api/operators/retryWhen)

### 工具操作符

- [`tap`](/api/operators/tap)
- [`delay`](/api/operators/delay)
- [`delayWhen`](/api/operators/delayWhen)
- [`dematerialize`](/api/operators/dematerialize)
- [`materialize`](/api/operators/materialize)
- [`observeOn`](/api/operators/observeOn)
- [`subscribeOn`](/api/operators/subscribeOn)
- [`timeInterval`](/api/operators/timeInterval)
- [`timestamp`](/api/operators/timestamp)
- [`timeout`](/api/operators/timeout)
- [`timeoutWith`](/api/operators/timeoutWith)
- [`toArray`](/api/operators/toArray)

### 条件操作符

- [`defaultIfEmpty`](/api/operators/defaultIfEmpty)
- [`every`](/api/operators/every)
- [`find`](/api/operators/find)
- [`findIndex`](/api/operators/findIndex)
- [`isEmpty`](/api/operators/isEmpty)

### 运算与聚合操作符

- [`count`](/api/operators/count)
- [`max`](/api/operators/max)
- [`min`](/api/operators/min)
- [`reduce`](/api/operators/reduce)



## 创建自定义可观察对象

### 使用 `pipe()` 函数创建新的操作符

If there is a commonly used sequence of operators in your code, use the `pipe()` function to extract the sequence into a new operator. Even if a sequence is not that common, breaking it out into a single operator can improve readability.
如果您的代码中有一个常用的操作符序列，请使用`pipe()` 函数将该序列提取到新的操作符中。就算此序列不常用，也可以将其分解为单个操作符，以提高可读性。

例如，您可以创建一个函数，将奇数值过滤掉，并将偶数值加倍，如下所示：

```ts
import { pipe } from 'rxjs';
import { filter, map } from 'rxjs';

function discardOddDoubleEven() {
  return pipe(
    filter(v => !(v % 2)),
    map(v => v + v),
  );
}
```

( `pipe()` 函数类似但不同于, 可观察对象的 `.pipe()` 方法。)

### 从头开始创建新的操作符

它更复杂，但是如果您必须编写不能由现有操作符的组合构成的操作符（很少出现），则可以使用可观察镀锡的构造函数从头开始编写操作符，如下所示：

```ts
import { Observable } from 'rxjs';

function delay(delayInMillis) {
  return (observable) => new Observable(observer => {
    // 此函数将在每次订阅此可观察对象时调用。
    const allTimerIDs = new Set();
    const subscription = observable.subscribe({
      next(value) {
        const timerID = setTimeout(() => {
          observer.next(value);
          allTimerIDs.delete(timerID);
        }, delayInMillis);
        allTimerIDs.add(timerID);
      },
      error(err) {
        observer.error(err);
      },
      complete() {
        observer.complete();
      }
    });
    // 返回值是卸载函数，当取消订阅此可观察对象时将调用该函数。
    return () => {
      subscription.unsubscribe();
      allTimerIDs.forEach(timerID => {
        clearTimeout(timerID);
      });
    }
  });
}
```

请注意，您必须

1. 实现此3个可观察对象的方法, `next()`, `error()`, 和 `complete()` 当订阅输入的可观察对象时。
2. 实现"teardown"函数，该方法将在可观察对象完成时进行清理（在本例中，通过取消订阅并清除全部挂起的超时处理）。
3. 从传递给可观察构造函数的函数返回该teardown函数。

当然，本例只是一个例子:`delay()`操作符[已存在](/api/operators/delay)。
