# 主题(Subject)

**主题是什么?** RxJS的主题是一种特殊的可观察对象类型，它允许将值多播到多个观察者(Observer)。普通的可观察对象是单播的（每个订阅的观察者拥有可观察对象的独立执行），而主题是多播的。

<span class="informal">主题类似于可观察对象，但可以多播到多个观察者。主题类似于EventEmitters：它维护着多个侦听器的注册表。</span>

**每个主题都是一个可观察对象。** 指定一个主题，您可以订阅它，提供一个观察者，它将开始正常接收值。 从观察者的角度来看，它无法确定可观察对象的执行是来自纯单播可观察对象还是主题。

在主题内部，`subscribe`不会调用传递值的新执行。它只是在观察者列表中注册一个观察者，类似于`addListener`在其他库和语言中的工作方式。

**每个主题都是一个观察者。** 它是一个具有`next(v)`, `error(e)`, and `complete()`方法的对象。若要将新值传递送给主题，只需调用`next(theValue)`，它将被多播给注册收听此主题的观察者。

在下面的示例中，我们将两个观察者附加到一个主题中，并向该主题提供一些值：

```ts
import { Subject } from 'rxjs';

const subject = new Subject<number>();

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

subject.next(1);
subject.next(2);

// 日志:
// observerA: 1
// observerB: 1
// observerA: 2
// observerB: 2
```

由于主题是观察者，这也意味着您可以提供一个主题作为任何可观察对象`subscribe`的参数，如下例所示：

```ts
import { Subject, from } from 'rxjs';

const subject = new Subject<number>();

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

const observable = from([1, 2, 3]);

observable.subscribe(subject); // 您可以订阅并传递一个主题

// 日志:
// observerA: 1
// observerB: 1
// observerA: 2
// observerB: 2
// observerA: 3
// observerB: 3
```

通过上面的方法，我们基本上只是通过主题将单播可观察对象的执行转换为多播。这说明了主题是如何将任意可观察对象的执行共享给多个观察者的唯一方式。

还有一些特殊的主题：`BehaviorSubject`, `ReplaySubject`, 和 `AsyncSubject`。

## 多播的可观察对象

"多播可观察对象"通过可能有许多订阅的主题来传递通知，而普通的"单播可观察对象"则，仅能将通知发送给单个观察者。

<span class="informal">一个多播的可观察对象在底层，使用Subject来使多个观察者看到相同的可观察对象的执行。</span>

在底层，这就是`multicast`操作符的工作方式：观察者订阅基础的主题，而主题订阅原始的可观察对象。

以下示例与使用`observable.subscribe(subject)`的先前示例相似：

```ts
import { from, Subject } from 'rxjs';
import { multicast } from 'rxjs/operators';

const source = from([1, 2, 3]);
const subject = new Subject();
const multicasted = source.pipe(multicast(subject));

// 在底层使用 `subject.subscribe({...})`:
multicasted.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
multicasted.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

// 在底层使用了 `source.subscribe(subject)`:
multicasted.connect();
```

`multicast` 返回的可观察对象看起来像普通的可观察对象，但是在订阅时却像Subject一样工作。`multicast` 返回一个 `ConnectableObservable`，通过`connect()`方法返回一个可观察对象。

`connect()` 方法对于准确确定共享可观察对象的执行何时开始非常重要。 因为 `connect()` 在底层执行`source.subscribe(subject)`，所以`connect()`返回一个Subscription，您可以取消订阅以取消共享的可观察对象的执行。

### 引用计数

手动调用`connect()`并处理订阅非常麻烦。通常，我们希望在第一个观察者到达时自动连接，并在最后一个观察者取消订阅时自动取消共享执行。

请考虑以下示例，该列表概述了其中发生订阅的情况：

1. 第一个观察者订阅多播的可观察对象
2. **多播的可观察对象已连接**
3. `next` 的值 `0` 被传递给第一个观察者
4. 第而个观察者订阅多播的可观察对象
5. `next` 的值 `1` 被传递给第一个观察者
5. `next` 的值 `1` 被传递给第二个观察者
1. 第一个观察者从多播的可观察对象取消订阅
5. `next` 的值 `2` 被传递给第二个观察者
1. 第二个观察者从多播的可观察对象取消订阅
1. **与多播的可观察对象的连接已取消订阅**

为了通过显式调用`connect()`实现这一点，我们编写以下代码：

```ts
import { interval, Subject } from 'rxjs';
import { multicast } from 'rxjs/operators';

const source = interval(500);
const subject = new Subject();
const multicasted = source.pipe(multicast(subject));
let subscription1, subscription2, subscriptionConnect;

subscription1 = multicasted.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
// 这里我们应该调用 `connect()`，以使 `multicasted` 的第一个
// 订阅者输出`multicasted` 的值
subscriptionConnect = multicasted.connect();

setTimeout(() => {
  subscription2 = multicasted.subscribe({
    next: (v) => console.log(`observerB: ${v}`)
  });
}, 600);

setTimeout(() => {
  subscription1.unsubscribe();
}, 1200);

// 我们在此处取消订阅共享的观察者对象的执行，
// 因此 `multicasted` 将不再有任何订阅者
setTimeout(() => {
  subscription2.unsubscribe();
  subscriptionConnect.unsubscribe(); // 取消订阅共享的观察者对象的执行
}, 2000);
```

如果我们希望避免显式调用`connect()`，则可以使用ConnectableObservable的`refCount()`方法（引用计数），该方法返回一个可观察对象，以跟踪其拥有的订阅者数量。当订阅者数量从0增加到1时，它将为我们调用`connect()`，这将启动共享执行。只有当订阅者数量从1减少到0时，它才会完全取消订阅，从而停止进一步执行。

<span class="informal">`refCount`使多播的可观察对象在第一个订阅者到来时自动开始执行，并在最后一个订阅者离开时停止执行。</span>

下面是一个例子:

```ts
import { interval, Subject } from 'rxjs';
import { multicast, refCount } from 'rxjs/operators';

const source = interval(500);
const subject = new Subject();
const refCounted = source.pipe(multicast(subject), refCount());
let subscription1, subscription2;

// 这里其实调用了 `connect()`，
// 因为 `refCounted` 有了第一个订阅者
console.log('observerA subscribed');
subscription1 = refCounted.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});

setTimeout(() => {
  console.log('observerB subscribed');
  subscription2 = refCounted.subscribe({
    next: (v) => console.log(`observerB: ${v}`)
  });
}, 600);

setTimeout(() => {
  console.log('observerA unsubscribed');
  subscription1.unsubscribe();
}, 1200);

// 这里共享的可观察对象的执行将会停止，
// `refCounted` 将不再有订阅者
setTimeout(() => {
  console.log('observerB unsubscribed');
  subscription2.unsubscribe();
}, 2000);

// 结果
// observerA subscribed
// observerA: 0
// observerB subscribed
// observerA: 1
// observerB: 1
// observerA unsubscribed
// observerB: 2
// observerB unsubscribed
```

`refCount()`方法仅存在于ConnectableObservable上，它返回一个Observable，而不是另一个ConnectableObservable。

## BehaviorSubject

`BehaviorSubject`是主题的一种变体，它的概念是"当前值"。它存储了发给订阅者的最新值，并且每当有新的观察者订阅时，它将立即从`BehaviorSubject`接收"当前值"。

<span class="informal">BehaviorSubjects用于表示"随时间变化的值"。 例如，生日的事件流是一个`Subject`，但对于年龄的事件流是一个`BehaviorSubject`。</span>

在以下示例中，将`BehaviorSubject`初始化为第一个可观察对象订阅时收到的值：`0`。 第二个观察者在发送值：`2`之后进行了订阅，此时会收到值最新值：`2`。

```ts
import { BehaviorSubject } from 'rxjs';
const subject = new BehaviorSubject(0); // 0 为初始值

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});

subject.next(1);
subject.next(2);

subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

subject.next(3);

// 结果
// observerA: 0
// observerA: 1
// observerA: 2
// observerB: 2
// observerA: 3
// observerB: 3
```

## ReplaySubject

`ReplaySubject`与`BehaviorSubject`相似，因为它可以将旧值发送给新订阅者，但是它也可以记录可观察对象执行的一部分。

<span class="informal">一个`ReplaySubject`记录来自可观察对象执行的多个值，并将它们重播给新的订阅者。</span>

创建`ReplaySubject`时，您可以指定要重播多少个值：

```ts
import { ReplaySubject } from 'rxjs';
const subject = new ReplaySubject(3); // 为新订阅者缓冲3个值

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});

subject.next(1);
subject.next(2);
subject.next(3);
subject.next(4);

subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

subject.next(5);

// 结果:
// observerA: 1
// observerA: 2
// observerA: 3
// observerA: 4
// observerB: 2
// observerB: 3
// observerB: 4
// observerA: 5
// observerB: 5
```

除了缓冲数量以外，您还可以指定*窗口时间（以毫秒为单位）* ，以确定记录的值可以使用多长时间。 在下面的示例中，我们使用较大的缓冲区数量：100，但窗口时间参数仅为500毫秒。

<!-- skip-example -->
```ts
import { ReplaySubject } from 'rxjs';
const subject = new ReplaySubject(100, 500 /* 窗口时间 */);

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});

let i = 1;
setInterval(() => subject.next(i++), 200);

setTimeout(() => {
  subject.subscribe({
    next: (v) => console.log(`observerB: ${v}`)
  });
}, 1000);

// 结果
// observerA: 1
// observerA: 2
// observerA: 3
// observerA: 4
// observerA: 5
// observerB: 3
// observerB: 4
// observerB: 5
// observerA: 6
// observerB: 6
// ...
```

## AsyncSubject

`AsyncSubject`是主题的另一个变体，其中只将可观察对象执行的最后一个值发送到其观察者，并且仅在执行`complete`时发送。

```js
import { AsyncSubject } from 'rxjs';
const subject = new AsyncSubject();

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});

subject.next(1);
subject.next(2);
subject.next(3);
subject.next(4);

subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

subject.next(5);
subject.complete();

// 结果:
// observerA: 5
// observerB: 5
```

AsyncSubject与[`last()`](/api/operators/last)操作符相似，他们都是等待`complete`通知后，发送一个值。
