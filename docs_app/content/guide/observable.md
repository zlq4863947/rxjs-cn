
# 可观察对象(Observable)

Observables是多值惰性推送集合。它补足了下表缺少的部分:

| | 单值 | 多值 |
| --- | --- | --- |
| **Pull** | [`Function`](https://developer.mozilla.org/en-US/docs/Glossary/Function) | [`Iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) |
| **Push** | [`Promise`](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Promise) | [`Observable`](../class/es6/Observable.js~Observable.html) |

**例子：** 以下是一个可观察对象推送的值，在订阅后立即(同步)推送值 `1`、 `2`、 `3` , 并且在1秒后推送值 `4` ，然后结束流:
```ts
import { Observable } from 'rxjs';

const observable = new Observable(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  setTimeout(() => {
    subscriber.next(4);
    subscriber.complete();
  }, 1000);
});
```

要调用Observable并查看这些值，我们需要使用*subscribe*：

```ts
import { Observable } from 'rxjs';

const observable = new Observable(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  setTimeout(() => {
    subscriber.next(4);
    subscriber.complete();
  }, 1000);
});

console.log('just before subscribe');
observable.subscribe({
  next(x) { console.log('got value ' + x); },
  error(err) { console.error('something wrong occurred: ' + err); },
  complete() { console.log('done'); }
});
console.log('just after subscribe');
```

控制台执行的结果：

```none
just before subscribe
got value 1
got value 2
got value 3
just after subscribe
got value 4
done
```

## 拉取(Pull) vs 推送(Push)

*拉取* 和 *推送* 两种不同的协议，它们描述了数据**生产者** 如何与 数据**消费者**通信。

**拉取是什么?** 由**消费者**来决定何时从**生产者**那接收数据，**生产者**本身不知道数据何时交付到**消费者**手中的。

每个Javascript函数都是一个拉取体系。函数式数据的生产者调用该函数，通过从函数调用中取出单个返回值来对该函数进行消费。

ES2015 引入了 [generator 函数和 iterators](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/function*) (`function*`)，这是另外一种类型的拉取体系。调用 `iterator.next()` 的代码是消费者，它会从 iterator(生产者) 那"拉取"多个值。


| | 生产者 | 消费者 |
| --- | --- | --- |
| **拉取** | **被动:** 在请求时生成数据 | **主动:** 决定何时请求数据 |
| **推送** | **主动:** 按自己的节奏产生数据 | **被动:** 对接收到的数据作出反应 |

**推送是什么?** 在推送体系中，生产者决定何时向消费者发送数据。消费者不知道什么时候会收到这些数据。

Promises是当前javascript中最常见的推送体系类型。一个Promise（生产者）向注册回调（消费者）传递一个已解决的值，但与函数不同的是，由 Promise 来决定何时把值"推送"给回调函数。

RxJS引入了Observables，一个新的JavaScript推送体系。Observable 是多个值的生产者，并将值“推送”给观察者(消费者)。

- **Function** 是一种延迟运算，在调用时同步返回单个值。
- **generator** 是一种延迟运算，在迭代时同步返回零到（如果可能）无限个值。
- **Promise** 是一种最终只会（或可能不会）返回单个值的运算。
- **Observable** 是一种延迟计算，从调用开始，可以同步或异步返回零到（如果可能）无限个值。

## Observables 作为函数的泛化

与流行的说法相反，Observables并不像EventEmitters，也不像多个值的Promises。在某些情况下，例如：当它们使用rxjs的Subjects进行多播时，Observables的行为可能类似于EventEmitters，但通常Observables的行为并不像EventEmitters。

<span class="informal">Observables类似于没有参数的函数，但却可以泛化为多个返回值的函数</span>

例如以下代码：

```ts
function foo() {
  console.log('Hello');
  return 42;
}

const x = foo.call(); // 等同于 foo()
console.log(x);
const y = foo.call(); // 等同于 foo()
console.log(y);
```

我们期望看到输出：

```none
"Hello"
42
"Hello"
42
```

您可以使用 Observables 重写上面的代码：

```ts
import { Observable } from 'rxjs';

const foo = new Observable(subscriber => {
  console.log('Hello');
  subscriber.next(42);
});

foo.subscribe(x => {
  console.log(x);
});
foo.subscribe(y => {
  console.log(y);
});
```

输出是一样的：

```none
"Hello"
42
"Hello"
42
```

这是因为函数和 Observables 都是惰性运算。如果您不调用函数，`console.log('Hello')` 就不会执行。Observables 也是如此，如果您不“调用”它(使用 `subscribe`)，`console.log('Hello')` 也不会执行。此外，“调用”或“订阅”是独立的操作：两个函数调用会触发两个单独的副作用，两个 Observable 订阅同样也是触发两个单独的副作用。EventEmitters 共享副作用并且无论是否存在订阅者都会尽早执行，Observables 与之相反，不会共享副作用并且是延迟执行。

<span class="informal">订阅Observable类似于调用函数</span>

有些人声称Observables是异步的。其实并非如此。如果用日志包围函数的调用，如下所示：

```js
console.log('before');
console.log(foo.call());
console.log('after');
```

会看到这样的输出：

```none
"before"
"Hello"
42
"after"
```

使用 Observables 来做同样的事：

```js
console.log('before');
foo.subscribe(x => {
  console.log(x);
});
console.log('after');
```

输出是：

```none
"before"
"Hello"
42
"after"
```

这证明了 `foo` 的订阅完全是同步的，就像一个普通函数。

<span class="informal">Observables 传递值可以是同步的，也可以是异步的</span>

那么 Observable 和 函数的区别是什么呢？ **Observable 可以随着时间的推移“返回”多个值**，这是函数所做不到的。你无法这样：

```js
function foo() {
  console.log('Hello');
  return 42;
  return 100; // 无意义的代码，永远不会被执行
}
```

函数只能返回一个值。然而，Observable可以做到这一点：

```ts
import { Observable } from 'rxjs';

const foo = new Observable(subscriber => {
  console.log('Hello');
  subscriber.next(42);
  subscriber.next(100); // "return" another value
  subscriber.next(200); // "return" yet another
});

console.log('before');
foo.subscribe(x => {
  console.log(x);
});
console.log('after');
```

同步输出：

```none
"before"
"Hello"
42
100
200
"after"
```

但也可以异步“返回”值：

```ts
import { Observable } from 'rxjs';

const foo = new Observable(subscriber => {
  console.log('Hello');
  subscriber.next(42);
  subscriber.next(100);
  subscriber.next(200);
  setTimeout(() => {
    subscriber.next(300); // 异步执行
  }, 1000);
});

console.log('before');
foo.subscribe(x => {
  console.log(x);
});
console.log('after');
```

输出：

```none
"before"
"Hello"
42
100
200
"after"
300
```

结论:

- `func.call()` 意思是 "*同步地给我一个值*"
- `observable.subscribe()` 意思是 "*给我任意数量的值，无论是同步的还是异步的*"

## 解析可观察对象

Observables 是使用`new Observable`或创建操作符**创建的**，使用Observer来**订阅**，**执行**并传递 `next` / `error` / `complete`回调函数给Observer，然后执行可能会被**清理(disposed)**。

这四个方面都编写在一个可观察对象中，但其中某些方面又与其他概念相关联，比如Observer (观察者) 和 Subscription (订阅)。

可观察对象的核心关注点:
- 可观察对象的**创建** 
- 可观察对象的**订阅**
- 可观察对象的**执行**
- 可观察对象的**清理**

### 可观察对象的创建

`Observable` 构造函数接受一个参数：`subscribe`函数。

下面的示例中，创建了一个可观察对象，并每秒向订阅者发送字符串`"hi"`。

```ts
import { Observable } from 'rxjs';

const observable = new Observable(function subscribe(subscriber) {
  const id = setInterval(() => {
    subscriber.next('hi')
  }, 1000);
});
```

<span class="informal">可观察对象可以通过 `new Observable` 创建。常用做法是, 可观察对象使用创建操作符, 例如： `of`、 `from`、 `interval`等等</span>

在上面的例子中，`subscribe`函数是描述可观察对象的最重要的部分。让我们看看订阅意味着什么。

### 可观察对象的订阅 

示例中的`observable`**可以被订阅**，如下所示：

```ts
observable.subscribe(x => console.log(x));
```

`observable.subscribe` 和 `Observable.create(function subscribe(observer) {...})` 中的 subscribe 有着同样的名字，这并不是一个巧合。在库中，它们是不同的，但从实际来讲，你可以认为在概念上它们是等同的。

这表明 `subscribe` 在调用同一 `可观察对象` 的多个**观察者**之间是**不共享的**。当使用观察者调用`observable.subscribe`时，将为此订阅者执行`subscribe`函数中的代码： `new Observable(function subscribe(subscriber) {...})`。每个对`observable.subscribe`的调用都会为给定的订阅者触发自己的独立设置。


<span class="informal">订阅可观察对象就像调用一个函数，在参数中提供要接收订阅数据的回调函数。</span>

这与`addEventListener` / `removeEventListener`之类的事件处理程序API截然不同。使用`observable.subscribe`，给定的观察者不会注册成为为可观察对象中的侦听器。可观察对象甚至不保留附加的观察者的列表。

`subscribe`调用只是启动"执行 可观察对象"并将值或事件传递给观察者的方法。

### 可观察对象的执行

`new Observable(function subscribe(subscriber) {...})` 可以解释为："可观察对象的执行"，这是一种懒惰的运算，只发生在订阅的每个观察者身上。随着时间的推移，执行会产生多个值，可以是同步的，也可以是异步的。

"可观察对象的执行"可以提供三种类型的值：

- "Next" 通知：发送一个值，如数字、字符串、对象等。
- "Error" 通知：发送一个javascript错误或异常。
- "Complete" 通知：表示不再发送值。

通知是最重要和最常见的类型：它们表示传递给订阅者的实际数据。"Error"和"Complete"通知可能只在"可观察对象的执行"期间发生一次，并且只会发生两者中的一个。

这些约束最好用*可观察对象语法*或*协议*来表达，它是以正则表达式的形式编写的：

```none
next*(error|complete)?
```

<span class="informal">在执行可观察对象中，可以传递零到无限的Next通知。如果传递了Error或Complete通知，则后续再无法传递其他任何内容。</span>

下面是一个可观察对象的执行示例，它将传递三个Next通知，然后complete：

```ts
import { Observable } from 'rxjs';

const observable = new Observable(function subscribe(subscriber) {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
});
```

可观察对象严格遵守可观察对象协议，因此以下代码将不会发送Next通知 `4`：

```ts
import { Observable } from 'rxjs';

const observable = new Observable(function subscribe(subscriber) {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  subscriber.complete();
  subscriber.next(4); // Is not delivered because it would violate the contract
});
```

最好用`try`/`catch` 将subscribe中的代码包含，当它捕获到异常时，将会传递Error通知：

```ts
import { Observable } from 'rxjs';

const observable = new Observable(function subscribe(subscriber) {
  try {
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  } catch (err) {
    subscriber.error(err); // 如果捕捉到异常，则传递错误
  }
});
```

### 可观察对象的执行的清理

因为可观察的执行可能是无限的，而且观察者通常希望在有限的时间内中止执行，所以我们需要一个用于取消执行的api。由于每次执行只对一个观察者独占，一旦观察者接收到值，就必须有一种方法停止执行，以避免浪费计算能力或内存资源。

When `observable.subscribe` is called, the Observer gets attached to the newly created Observable execution. This call also returns an object, the `Subscription`:
当调用 `observable.subscribe` 时，观察者将附加到新创建的 **可观察对象执行** 中。此调用还会返回一个对象，即`Subscription`：

```ts
const subscription = observable.subscribe(x => console.log(x));
```

Subscription表示正在进行的执行，并且有极少的api，允许您取消该执行。想了解更多订阅相关的内容，请参见 [`Subscription` 类型](./guide/subscription)。使用 `subscription.unsubscribe()` 你可以取消进行中的执行：

```ts
import { from } from 'rxjs';

const observable = from([10, 20, 30]);
const subscription = observable.subscribe(x => console.log(x));
// Later:
subscription.unsubscribe();
```

<span class="informal">当你订阅了 Observable，你会得到一个 Subscription ，它表示进行中的执行。只要调用 `unsubscribe()` 方法就可以取消执行。</span>

当我们使用 `create()` 方法创建 Observable 时，Observable 必须定义如何清理执行的资源。你可以通过在 function subscribe() 中返回一个自定义的 `unsubscribe` 函数。

举例来说，这是我们如何清理使用了 `setInterval` 的 interval 执行集合：

```js
const observable = new Observable(function subscribe(subscriber) {
  // Keep track of the interval resource
  const intervalId = setInterval(() => {
    subscriber.next('hi');
  }, 1000);

  // 提供取消和清理 interval 资源的方法
  return function unsubscribe() {
    clearInterval(intervalId);
  };
});
```

正如 `observable.subscribe` 类似于 `new Observable(function subscribe() {...})`，从 `subscribe` 返回的 `unsubscribe` 在概念上也等同于 `subscription.unsubscribe`。事实上，如果我们抛开围绕这些概念的 ReactiveX 类型，保留下来的只是相当简单的 JavaScript 。

```js
function subscribe(subscriber) {
  const intervalId = setInterval(() => {
    subscriber.next('hi');
  }, 1000);

  return function unsubscribe() {
    clearInterval(intervalId);
  };
}

const unsubscribe = subscribe({next: (x) => console.log(x)});

// Later:
unsubscribe(); // dispose the resources
```

我们使用rx类型如 Observable、Observer 和 Subscription的原因是为了保证代码的安全性（如可观察对象协议）和操作符的可组合性。
