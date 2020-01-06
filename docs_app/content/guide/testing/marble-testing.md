# 用弹珠图测试 RxJS 代码

<div class="alert is-helpful">
  <span>本指南介绍在使用new `testScheduler.run(callback)`时，弹珠图的用法。此处的某些详细信息不适用于在不使用`run()`帮助程序的情况下手动使用TestScheduler。</span>
</div>

我们可以通过使用 TestScheduler 虚拟化时间来同步和准确地测试异步 RxJS 代码。ASCII **弹珠图** 为我们提供了一种可视化的方式来表示可观察对象的行为。我们可以使用它们来断言某个特定的可观察对象的行为是否符合预期，也可以创建我们可以用作模拟的[冷热可观察对象](https://segmentfault.com/a/1190000011052037)。

> 目前，TestScheduler 仅可用于测试使用计时器的代码，例如 delay/debounceTime/等（即，它使用 AsyncScheduler 且延迟>1）。如果代码使用 Promise 或使用 AsapScheduler/AnimationFrameScheduler/等进行调度，则无法使用 TestScheduler 对其进行可靠的测试，而应采用更传统的方式进行测试。有关更多详细信息，请参见[已知问题](#known-issues)部分。

```ts
import { TestScheduler } from "rxjs/testing";

const scheduler = new TestScheduler((actual, expected) => {
  // 断言两个对象相等
  // 例如 使用chai.
  expect(actual).deep.equal(expected);
});

// 该测试实际上将*同步*运行
it("generate the stream correctly", () => {
  scheduler.run(helpers => {
    const { cold, expectObservable, expectSubscriptions } = helpers;
    const e1 = cold("-a--b--c---|");
    const subs = "^----------!";
    const expected = "-a-----c---|";

    expectObservable(e1.pipe(throttleTime(3, scheduler))).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(subs);
  });
});
```

## API

您提供给`testScheduler.run(callback)`的回调函数将传递`helpers`对象，该对象包含将用于编写测试的函数。

<div class="alert is-helpful">
  <span>
    当执行此回调中的代码时，任何使用计时器/AsyncScheduler的操作符（例如，delay、debounceTime等）都将**自动**使用TestScheduler，以便我们拥有"虚拟时间"。您不需要像过去一样将TestScheduler传递给他们。
  </span>
</div>

```ts
testScheduler.run(helpers => {
  const { cold, hot, expectObservable, expectSubscriptions, flush } = helpers;
  // 使用他们
});
```

尽管 `run()` 完全同步执行，但回调函数内部的 helper 数却不同步！这些函数 **调度断言**，这些断言将在回调完成或显式调用`flush()`时执行。警惕在回调内调用同步断言，例如，从您选择的测试库中调用`expect`。

- `hot(marbleDiagram: string, values?: object, error?: any)` - 创建一个["热"的可观察对象](https://segmentfault.com/a/1190000011052037)（类似 Subject），当测试开始时其行为就好像已经在"流动中"。一个有趣的区别是，热弹珠允许^字符表示在"零帧"的位置。这就是订阅要测试的可观察对象的地方。
- `cold(marbleDiagram: string, values?: object, error?: any)` - 创建一个["冷"的可观察对象](https://segmentfault.com/a/1190000011052037) 当测试开始时它便开始订阅。
- `expectObservable(actual: Observable<T>, subscriptionMarbles?: string).toBe(marbleDiagram: string, values?: object, error?: any)` - 调度 TestScheduler 刷新时的断言。将`subscriptionMarbles`作为参数来更改订阅和取消订阅的调度。如果不提供`subscriptionMarbles`参数，它将在开始时订阅，并且永远不会取消订阅。请阅读下面关于订阅弹珠图的内容。
- `expectSubscriptions(actualSubscriptionLogs: SubscriptionLog[]).toBe(subscriptionMarbles: string)` - 与`expectObservable`一样，在 testScheduler 刷新时调度断言。`cold()` `hot()` 都返回一个可观察对象，其属性`subscriptions`的类型为`SubscriptionLog[]`。将`subscriptions`作为`expectSubscriptions`的参数，以断言它是否与`toBe()`中指定的`subscriptionsMarbles`弹珠图匹配。订阅的弹珠图与可观察对象的弹珠图略有不同。请阅读下面的内容。
- `flush()` - 立即开始虚拟时间。不经常使用，因为`run()`会在您的回调返回时自动为您刷新，但在某些情况下，您可能希望刷新多次或拥有更多控制权。

## 弹珠语法

在 TestScheduler 的上下文中，弹珠图是一个字符串，其中包含表示虚拟时间发生的事件的特殊语法。 时间按*帧*前进。任何弹珠字符串的第一个字符始终代表*零帧*或时间的开始。 在`testScheduler.run(callback)`内部，frameTimeFactor 设置为 1，这意味着一帧等于一个虚拟毫秒。

一帧表示多少个虚拟毫秒取决于`TestScheduler.frameTimeFactor的值`。由于历史原因，仅当您运行 `testScheduler.run(callback)`回调中的代码时，`frameTimeFactor`的值为 1。 外部设置为 10。在以后的 RxJS 版本中可能会更改，因此始终为 1。

> IMPORTANT: 重要说明：本语法指南涉及使用`testScheduler.run(callback)`时弹珠图的用法。当手动使用 TestScheduler 时，弹珠图的语义是不同的，并且不支持某些功能，例如 new time progression 语法。

- `' '` 空白：水平空白将被忽略，可用于帮助垂直对齐多个弹珠图。
- `'-'` 帧：虚拟时间传递的 1 个"帧"（请参见帧的上述说明）。
- `[0-9]+[ms|s|m]` 时间推进：时间推进语法允许您使用指定数量的推进虚拟时间。它是一个数字，后跟时间单位`ms`（毫秒）、`s`（秒）或 `m`（分钟），它们之间没有任何间隔，例如：`a 10ms b`。有关详细信息，请参见[时间推进语法](#time-progression-syntax)。
- `'|'` 完成：成功地完成一个可观察的事物。这是可观察对象发送的信号`complete()`。
- `'#'` 错误：终止可观察对象值的错误。这是可观察对象发送的信号`error()`。
- `[a-z0-9]` 例如： `'a'` 是任何字母数字字符：表示生产者发送的`next()`信号时发出的值。还可以考虑将其映射到如下对象或数组：

```ts
const expected = "400ms (a-b|)";
const values = {
  a: "发出的值",
  b: "另一个发射器的值"
};

expectObservable(someStreamForTesting).toBe(expected, values);
// 也可以这样
const expected = "400ms (0-1|)";
const values = ["发出的值", "另一个发射器的值"];

expectObservable(someStreamForTesting).toBe(expected, values);
```

- `'()'` 同步分组：当多个事件需要同步在同一帧中时，使用括号将这些事件分组。您可以通过这种方式将`next`的值，完成或错误分组。初始位置（决定了其值发出的时间。起初它并不直观，但是在所有值同步发出之后，时间将经过的帧数等于该组中ASCII字符的数量，包括括号，例如：'(abc)' 将在同一帧中同步发出a，b和c的值，然后将虚拟时间推进5帧，即'(abc)'。length === 5。它通常可以帮助您垂直对齐弹珠图，但在实际测试中，这是一个已知的痛点。了解有关已知问题的[更多信息](#known-issues)。
- `'^'` 订阅点：（仅限热可观察对象）显示测试可观测值订阅热可观测值的点。这是观察到的"零帧"，在^之前的每一帧都是负数。负数的时间可能看起来毫无意义，但事实上，在一些复杂的情况下，这是必要的，通常涉及到ReplaySubjects。

### 时间推进语法

新的时间推进语法从CSS duration语法中获得灵感。它是一个数字（int或float），紧接着是一个单位；ms（毫秒）、s（秒）、m（分钟）。例如 `100ms`、`1.4s`、`5.25m`。

当它不是图的第一个字符时，必须在它之前/之后填充一个空格，以便从一系列弹珠中区分它。例如：`a1msb` 需要空格，因为`a1msb`将被解释为`['a', '1', 'm', 's', 'b']，其中每个字符都是一个next()的值。

**注意**：您可能需要从要进行的时间中减去1毫秒，因为字母数字弹珠（表示实际发射的值）在发射后已经_推进了一个虚拟时间帧_。这可能是非常不直观和令人沮丧的，但现在它确实是正确的。

```ts
const input = " -a-b-c|";
const expected = "-- 9ms a 9ms b 9ms (c|)";
/*

// 根据您的个人喜好，您还可以
// 使用破折号使输入保持垂直对齐
const input = ' -a-b-c|';
const expected = '------- 4ms a 9ms b 9ms (c|)';
// 或
const expected = '-----------a 9ms b 9ms (c|)';

*/

const result = cold(input).pipe(concatMap(d => of(d).pipe(delay(10))));

expectObservable(result).toBe(expected);
```

### 示例

`'-'` 或 `'------'`: 等同于`never()`，或者是一个从不发射或完成的可观察对象

`|`: 等同于 `empty()`

`#`: 等同于 `throwError()`

`'--a--'`: 等待2个"帧"的可观察对象，发出值`a`，然后永远不发出`complete`。

`'--a--b--|'`: 在第2帧发出`a`，在第5帧发出`b`，在第8帧发出`complete`。

`'--a--b--#'`: 在第2帧发出`a`，在第5帧发出`b`，在第8帧发出`error`。

`'-a-^-b--|'`: 在一个热可观察对象中，在第-2帧上发出 `a`，然后在第2帧上发出 `b`，在第5帧上发出`complete`。

`'--(abc)-|'`: 在第2帧同时发出`a`、 `b`、 和 `c`，在第8帧发出`complete`。

`'-----(a|)'`: 在第5帧同时发出`a` 和 `complete`。

`'a 9ms b 9s c|'`: 在第0帧上发出 `a`，在第10帧上发出 `b`，在第10,012帧上发出 `c`，然后在第10,013帧上发出`complete`。

`'--a 2.5m b'`: 在第2帧上发出`a`，在第150,003帧上发出`b`且永远不发出`complete`。

## 订阅弹珠

`expectSubscriptions`帮助函数允许您断言您创建的 `cold()` 或 `hot()`可观察对象是在正确的时间点订阅/取消订阅的。`expectobservate`的`subscriptionMarbles`参数允许测试将订阅推迟到以后的虚拟时间，和（或）取消订阅，即使正在测试的可观察对象尚未完成。

订阅弹珠语法与普通弹珠语法略有不同。

- `'-'` 时间：经过1帧时间。
- `[0-9]+[ms|s|m]` 时间推进：时间推进语法允许您使用指定数量的推进虚拟时间。它是一个数字，后跟时间单位`ms`（毫秒）、`s`（秒）或 `m`（分钟），它们之间没有任何间隔，例如：`a 10ms b`。有关详细信息，请参见[时间推进语法](#time-progression-syntax)。
- `'^'` 订阅点：显示订阅发生的时间点。
- `'!'` 取消订阅点：显示取消订阅的时间点。

订制弹珠图中**最多**有一个`^`点，**最多**有一个`!`点。除此之外，`-`字符是订阅弹珠图中唯一允许的字符。

### 例子

`'-'` 或 `'------'`: 没有订阅发生。

`'--^--'`: 在第2帧发生订阅，并且该订阅并未取消订阅。

`'--^--!-'`: 在第2帧发生订阅，而在第5帧取消订阅。

`'500ms ^ 1s !'`: 在第500帧发生了订阅，而在第1,501帧未进行订阅。

指定热源，测试多个在不同时间订阅的订阅者：

```js
testScheduler.run(({ hot, expectObservable }) => {
  const source = hot("--a--a--a--a--a--a--a--");
  const sub1 = "      --^-----------!";
  const sub2 = "      ---------^--------!";
  const expect1 = "   --a--a--a--a--";
  const expect2 = "   -----------a--a--a-";
  expectObservable(source, sub1).toBe(expect1);
  expectObservable(source, sub2).toBe(expect2);
});
```

手动取消想要将永远无法完成：

```js
it("should repeat forever", () => {
  const scheduler = createScheduler();

  scheduler.run(({ expectObservable }) => {
    const foreverStream$ = interval(1).pipe(mapTo("a"));

    // 忽略此参数可能会使测试套件崩溃。
    const unsub = "------ !";

    expectObservable(foreverStream$, unsub).toBe("-aaaaa");
  });
});
```

---

## 已知的问题

### 您无法直接测试使用Promise或使用其他任何调度器的RxJS代码（例如AsapScheduler）

如果您有使用AsyncScheduler以外的其他任何形式的异步调度的RxJS代码，例如 Promise、AsapScheduler等，对于该特定代码，您不能可靠地使用弹珠图。这是因为TestScheduler不会虚拟化或知道其他那些调度方法。

解决方案是使用测试框架的普通异步测试方法来隔离测试该代码。具体细节取决于您选择的测试框架，但这是一个伪代码示例：

```ts
// 一些RxJS代码也会使用Promise，因此TestScheduler将无法
// 为了正确地虚拟化，测试将始终是异步的
const myAsyncCode = () => from(Promise.resolve("something"));

it("has async code", done => {
  myAsyncCode().subscribe(d => {
    assertEqual(d, "something");
    done();
  });
});
```

与此相关的是，即使使用AsyncScheduler，您目前也无法断言零延迟。例如，`delay(0)`就像说`setTimeout(work, 0)`。这会调度一个新的["task"的 macrotask”](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/)，因此它是异步的，但没有明确的时间流逝。

### `testScheduler.run(callback)`之外的不同行为

TestScheduler从v5开始就存在了，但实际上是由维护人员测试RxJS本身，而不是为普通用户用于应用程序中。正因为如此，TestScheduler的某些默认行为和功能无法正常运行（或根本无法运行）。在v6中，我们引入了`testScheduler.run(callback)`方法，该方法允许我们以非中断的方式提供新的默认值和特性，但是仍然可以[在外部使用TestScheduler](./guide/testing/internal-marble-tests)。重要的是要注意，如果你这样做，它的行为会有一些重大的差异。

- TestScheduler辅助方法具有更详细的名称，如`testScheduler.createColdObservable()`而不是`cold()`。
- 使用AsyncScheduler的操作符不会自动使用testScheduler实例，例如：delay，debounceTime等，因此您必须将其明确地传递给他们。
- 不支持时间推进语法，例如 `-a 100ms b- |`
- 默认情况下，一帧是10个虚拟毫秒。 即`TestScheduler.frameTimeFactor = 10`
- 每个空格``等于1帧，与连字符 `-` 相同。
- 最大帧数设置为750，即`maxFrames = 750`。 750之后，它们将被静默忽略。
- 您必须显式刷新调度器。

虽然目前还没有正式反对使用 `testScheduler.run(callback)` 之外的TestScheduler，但不鼓励使用它，因为它可能会引起混乱。
