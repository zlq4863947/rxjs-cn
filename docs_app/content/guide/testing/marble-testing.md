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

一帧表示多少个虚拟毫秒取决于`TestScheduler.frameTimeFactor的值`。由于历史原因，仅当您运行 testScheduler.run(callback)回调中的代码时，`frameTimeFactor`的值为 1。 外部设置为 10。在以后的 RxJS 版本中可能会更改，因此始终为 1。

> IMPORTANT: 重要说明：本语法指南涉及使用新的`testScheduler.run(callback)`时弹珠图的用法。当手动使用 TestScheduler 时，弹珠图的语义是不同的，并且不支持某些功能，例如 new time progression 语法。

- `' '` 空白：水平空白将被忽略，可用于帮助垂直对齐多个弹珠图。
- `'-'` 帧：虚拟时间传递的 1 个"帧"（请参见帧的上述说明）。
- `[0-9]+[ms|s|m]` time progression: the time progression syntax lets you progress virtual time by a specific amount. It's a number, followed by a time unit of `ms` (milliseconds), `s` (seconds), or `m` (minutes) without any space between them, e.g. `a 10ms b`. See [Time progression syntax](#time-progression-syntax) for more details.
- `'|'` complete: The successful completion of an observable. This is the observable producer signaling `complete()`.
- `'#'` error: An error terminating the observable. This is the observable producer signaling `error()`.
- `[a-z0-9]` e.g. `'a'` any alphanumeric character: Represents a value being emitted by the producer signaling `next()`. Also consider that you could map this into an object or an array like this:

```ts
const expected = "400ms (a-b|)";
const values = {
  a: "value emitted",
  b: "another value emitter"
};

expectObservable(someStreamForTesting).toBe(expected, values);
// This would work also
const expected = "400ms (0-1|)";
const values = ["value emitted", "another value emitted"];

expectObservable(someStreamForTesting).toBe(expected, values);
```

- `'()'` sync groupings: When multiple events need to be in the same frame synchronously, parentheses are used to group those events. You can group next'd values, a completion, or an error in this manner. The position of the initial `(` determines the time at which its values are emitted. While it can be unintuitive at first, after all the values have synchronously emitted time will progress a number of frames equal to the number of ASCII characters in the group, including the parentheses. e.g. `'(abc)'` will emit the values of a, b, and c synchronously in the same frame and then advance virtual time by 5 frames, `'(abc)'.length === 5`. This is done because it often helps you vertically align your marble diagrams, but it's a known pain point in real-world testing. [Learn more about known issues](#known-issues).
- `'^'` subscription point: (hot observables only) shows the point at which the tested observables will be subscribed to the hot observable. This is the "zero frame" for that observable, every frame before the `^` will be negative. Negative time might seem pointless, but there are in fact advanced cases where this is necessary, usually involving ReplaySubjects.

### Time progression syntax

The new time progression syntax takes inspiration from the CSS duration syntax. It's a number (int or float) immediately followed by a unit; ms (milliseconds), s (seconds), m (minutes). e.g. `100ms`, `1.4s`, `5.25m`.

When it's not the first character of the diagram it must be padded a space before/after to disambiguate it from a series of marbles. e.g. `a 1ms b` needs the spaces because `a1msb` will be interpreted as `['a', '1', 'm', 's', 'b']` where each of these characters is a value that will be next()'d as-is.

**NOTE**: You may have to subtract 1 millisecond from the time you want to progress because the alphanumeric marbles (representing an actual emitted value) _advance time 1 virtual frame_ themselves already, after they emit. This can be very unintuitive and frustrating, but for now it is indeed correct.

```ts
const input = " -a-b-c|";
const expected = "-- 9ms a 9ms b 9ms (c|)";
/*

// Depending on your personal preferences you could also
// use frame dashes to keep vertical aligment with the input
const input = ' -a-b-c|';
const expected = '------- 4ms a 9ms b 9ms (c|)';
// or
const expected = '-----------a 9ms b 9ms (c|)';

*/

const result = cold(input).pipe(concatMap(d => of(d).pipe(delay(10))));

expectObservable(result).toBe(expected);
```

### Examples

`'-'` or `'------'`: Equivalent to `never()`, or an observable that never emits or completes

`|`: Equivalent to `empty()`

`#`: Equivalent to `throwError()`

`'--a--'`: An observable that waits 2 "frames", emits value `a` and then never completes.

`'--a--b--|'`: On frame 2 emit `a`, on frame 5 emit `b`, and on frame 8, `complete`

`'--a--b--#'`: On frame 2 emit `a`, on frame 5 emit `b`, and on frame 8, `error`

`'-a-^-b--|'`: In a hot observable, on frame -2 emit `a`, then on frame 2 emit `b`, and on frame 5, `complete`.

`'--(abc)-|'`: on frame 2 emit `a`, `b`, and `c`, then on frame 8 `complete`

`'-----(a|)'`: on frame 5 emit `a` and `complete`.

`'a 9ms b 9s c|'`: on frame 0 emit `a`, on frame 10 emit `b`, on frame 10,012 emit `c`, then on on frame 10,013 `complete`.

`'--a 2.5m b'`: on frame 2 emit `a`, on frame 150,003 emit `b` and never complete.

## Subscription Marbles

The `expectSubscriptions` helper allows you to assert that a `cold()` or `hot()` Observable you created was subscribed/unsubscribed to at the correct point in time. The `subscriptionMarbles` parameter to `expectObservable` allows your test to defer subscription to a later virtual time, and/or unsubscribe even if the observable being tested has not yet completed.

The subscription marble syntax is slightly different to conventional marble syntax.

- `'-'` time: 1 frame time passing.
- `[0-9]+[ms|s|m]` time progression: the time progression syntax lets you progress virtual time by a specific amount. It's a number, followed by a time unit of `ms` (milliseconds), `s` (seconds), or `m` (minutes) without any space between them, e.g. `a 10ms b`. See [Time progression syntax](#time-progression-syntax) for more details.
- `'^'` subscription point: shows the point in time at which a subscription happen.
- `'!'` unsubscription point: shows the point in time at which a subscription is unsubscribed.

There should be **at most one** `^` point in a subscription marble diagram, and **at most one** `!` point. Other than that, the `-` character is the only one allowed in a subscription marble diagram.

### Examples

`'-'` or `'------'`: no subscription ever happened.

`'--^--'`: a subscription happened after 2 "frames" of time passed, and the subscription was not unsubscribed.

`'--^--!-'`: on frame 2 a subscription happened, and on frame 5 was unsubscribed.

`'500ms ^ 1s !'`: on frame 500 a subscription happened, and on frame 1,501 was unsubscribed.

Given a hot source, test multiple subscribers that subscribe at different times:

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

Manually unsubscribe from a source that will never complete:

```js
it("should repeat forever", () => {
  const scheduler = createScheduler();

  scheduler.run(({ expectObservable }) => {
    const foreverStream$ = interval(1).pipe(mapTo("a"));

    // Omitting this arg may crash the test suite.
    const unsub = "------ !";

    expectObservable(foreverStream$, unsub).toBe("-aaaaa");
  });
});
```

---

## Known Issues

### You can't directly test RxJS code that consumes Promises or uses any of the other schedulers (e.g. AsapScheduler)

If you have RxJS code that uses any other form of async scheduling other than AsyncScheduler, e.g. Promises, AsapScheduler, etc. you can't reliably use marble diagrams _for that particular code_. This is because those other scheduling methods won't be virtualized or known to TestScheduler.

The solution is to test that code in isolation, with the traditional async testing methods of your testing framework. The specifics depend on your testing framework of choice, but here's a pseudo-code example:

```ts
// Some RxJS code that also consumes a Promise, so TestScheduler won't be able
// to correctly virtualize and the test will always be really async
const myAsyncCode = () => from(Promise.resolve("something"));

it("has async code", done => {
  myAsyncCode().subscribe(d => {
    assertEqual(d, "something");
    done();
  });
});
```

On a related note, you also can't currently assert delays of zero, even with AsyncScheduler, e.g. `delay(0)` is like saying `setTimeout(work, 0)`. This schedules a new ["task" aka "macrotask"](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/), so it's async, but without an explicit passage of time.

### Behavior is different outside of `testScheduler.run(callback)`

The TestScheduler has been around since v5, but was actually intended for testing RxJS itself by the maintainers, rather than for use in regular user apps. Because of this, some of the default behaviors and features of the TestScheduler didn't work well (or at all) for users. In v6 we introduced the `testScheduler.run(callback)` method which allowed us to provide new defaults and features in a non-breaking way, but it's still possible to [use the TestScheduler outside](./guide/testing/internal-marble-tests) of `testScheduler.run(callback)`. It's important to note that if you do so, there are some major differences in how it will behave.

- TestScheduler helper methods have more verbose names, like `testScheduler.createColdObservable()` instead of `cold()`
- The testScheduler instance is NOT automatically be used by operators that uses AsyncScheduler, e.g. delay, debounceTime, etc so you have to explicitly pass it to them.
- There is NO support for time progression syntax e.g. `-a 100ms b-|`
- 1 frame is 10 virtual milliseconds by default. i.e. `TestScheduler.frameTimeFactor = 10`
- Each space `` equals 1 frame, same as a hyphen `-`.
- There is a hard maximum number of frames set at 750 i.e. `maxFrames = 750`. After 750 they are silently ignored.
- You must explicitly flush the scheduler

While at this time usage of the TestScheduler outside of `testScheduler.run(callback)` has not been officially deprecated, it is discouraged because it is likely to cause confusion.
