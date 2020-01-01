# 调度器(Scheduler)

**调度器是什么?** 调度器控制着何时启动订阅以及何时发送通知。它由三个部分组成。

- **调度器是一种数据结构** 它知道如何根据优先级或其他条件进行存储和排序任务。
- **调度器是一个执行上下文。** 它表示执行任务的时间、地点（如：立即执行或在其他回调函数中执行，例如setTimeout或process.nextTick或动画帧中）。
- **调度器具有（虚拟）时钟。** 它通过调度器的getter方法`now()`提供"时间"的概念。在特定的调度器上调度的任务将仅遵守该时钟指示的时间。

<span class="informal">调度器使您可以定义可观察对象将在哪些执行上下文中向其观察者传递通知。</span>

在下面的示例中，我们采用普通的可观察对象来同步发出值`1`、`2`、`3`，并使用操作符`observeOn`指定用于传递这些值的`async`调度器。

[在Stackblitz上查看](https://stackblitz.com/edit/typescript-jbhzfe)
```ts
import { Observable, asyncScheduler } from 'rxjs';
import { observeOn } from 'rxjs/operators';

const observable = new Observable((observer) => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.complete();
}).pipe(
  observeOn(asyncScheduler)
);

console.log('订阅之前');
observable.subscribe({
  next(x) {
    console.log('获得值：' + x)
  },
  error(err) {
    console.error('发生错误：' + err);
  },
  complete() {
     console.log('完成');
  }
});
console.log('订阅之后');
```

输出结果：

```none
订阅之前
订阅之后
获得值： 1
获得值： 2
获得值： 3
完成
```

请注意，通知`获得值：...`是在`订阅之后`之后才发送，这与到目前为止我们看到的默认行为不同。这是因为`observeOn(asyncScheduler)`在新的可观察对象和最终的观察者之间引入了代理观察者。

让我们重命名一些标识符，以使该区别在示例代码中显而易见：

```ts
import { Observable, asyncScheduler } from 'rxjs';
import { observeOn } from 'rxjs/operators';

var observable = new Observable((proxyObserver) => {
  proxyObserver.next(1);
  proxyObserver.next(2);
  proxyObserver.next(3);
  proxyObserver.complete();
}).pipe(
  observeOn(asyncScheduler)
);

var finalObserver = {
  next(x) {
    console.log('获得值：' + x)
  },
  error(err) {
    console.error('发生错误：' + err);
  },
  complete() {
     console.log('完成');
  }
};

console.log('订阅之前');
observable.subscribe(finalObserver);
console.log('订阅之后');
```

`proxyObserver`是在`observeOn(asyncScheduler)`中创建的，其`next(val)`函数大致如下：

```ts
const proxyObserver = {
  next(val) {
    asyncScheduler.schedule(
      (x) => finalObserver.next(x),
      0 /* 延迟时间 */,
      val /* 将为上面函数的x */
    );
  },

  // ...
}
```

即使指定的`delay`为0，异步调度器也可以使用`setTimeout`或`setInterval`进行操作。像往常一样，在JavaScript中，已知`setTimeout(fn, 0)` 最早在下一次事件循环迭代时运行函数fn。这解释了为什么在`订阅之后`将值`1`传递给`finalObserver`的原因。

调度器的`schedule()`方法采用`delay`参数，它是指相对于调度器自己的内部时钟的时间单位。调度器的时钟与实际的时间没有任何关系。这就是像`delay` 时间操作符，它不是在实际时间上运行，而是在调度器的时钟所指定的时间上运行。这在测试中特别有用，在测试中，虚拟时间调度器可用于伪造时间，而实际上却是同步执行调度的任务。

## 调度器类型

`async` 调度器是RxJS提供的内置调度器之一。 可以使用`Scheduler`对象的静态属性创建并返回每种类型的调度器。

| 调度器 | 用途 |
| --- | --- |
| `null` | 通过不传递任何调度器，可以同步和递归传递通知。 将此用于定时操作或尾递归操作。 |
| `queueScheduler` | 当前事件帧中的队列上进行调度(蹦床调度器)。用于迭代操作。 |
| `asapScheduler` | 微任务的队列调度，与`promises`的队列相同。基本上在当前工作之后，但是在下一个工作之前。使用它进行异步转换。 |
| `asyncScheduler` | 使用`setInterval`调度，用于基于时间的操作。 |
| `animationFrameScheduler` | 调度计划将在下一次浏览器内容重新绘制之前发生的任务。可用于创建流畅的浏览器动画。|


## 使用调度器

您可能已经在RxJS代码中使用了调度器，而没有明确指定要使用的调度器类型。这是因为所有处理并发性的可观察对象操作符都有可选的调度器。如果不指定调度程序，则RxJS将按最小并发原则选择默认调度器。这意味着将选择调度程序，该调度器将引入最少的并发量以满足操作符的需求。例如，对于返回有限且少量消息的可观察对象的操作符，RxJS不使用Scheduler，即`null`或`undefined`。对于返回大量或无限数量消息的操作符，使用`queueScheduler`。对于使用计时器的操作符，将使用`asyncScheduler`。

由于RxJS使用最少的并发调度器，因此如果您出于性能目的引入并发，则可以选择其他调度器。要指定特定的调度器，您可以使用采用此调度器的操作符方法，例如，`from([10, 20, 30], asyncScheduler)`。

**静态创建操作符通常将调度器作为参数。** 例如： `from(array, scheduler)` 让您指定在传递从 `array` 转换的每个通知时要使用的调度器。它通常是操作符的最后一个参数。以下静态创建运算符都会传递一个调度器参数：

- `bindCallback`
- `bindNodeCallback`
- `combineLatest`
- `concat`
- `empty`
- `from`
- `fromPromise`
- `interval`
- `merge`
- `of`
- `range`
- `throw`
- `timer`

**使用`subscribeOn`用来指定在什么上下文中调用`subscribe()`。** 默认情况下，对可观察对象的`subscribe()`调用将立即同步执行。您可以延迟或日程安排在指定调度器上发生的实际订阅，使用实例操作符 `subscribeOn(scheduler)`，其中`scheduler`是您要提供的参数。

**使用`observeOn`来调度发送通知的的上下文。** 正如我们在上面的例子中看到的，实例操作符`observeOn(scheduler)`在源可观测者和目标可观测者之间引入了一个中介观察者，中介观察者使用指定的`scheduler`调度对目标观察者的调用。

**实例运算符可以将调度器作为参数传递。**

与时间相关的操作符，例如：`bufferTime`、`debounceTime`、`delay`、`auditTime`、`sampleTime`、`throttleTime`、`timeInterval`、`timeout`、`timeoutWith`、`windowTime` 等，都将调度器作为最后一个参数，当不传递调度器时，默认使用`asyncScheduler`。

其他以调度器为参数的实例运算符：`cache`、`combineLatest`、`concat`、`expand`、`merge`、`publishReplay`、`startWith`。

注意，`cache`和`publishReplay`都接受调度器，因为它们使用`ReplaySubject`。`ReplaySubjecs`的构造函数将可选的调度器作为最后一个参数，因为`ReplaySubject`可能处理时间，这只在调度器的上下文中才有意义。默认情况下，`ReplaySubject`使用`queueScheduler`提供时钟。
