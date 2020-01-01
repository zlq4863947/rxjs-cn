# 订阅(Subscription)

**订阅是什么?** 订阅代表一次性资源对象，即可观察对象的执行。 

订阅具有一个重要的方法，即`unsubscribe`，该方法不带任何参数，而只用来清理该订阅所拥有的资源。在以前的RxJS版本中，Subscription 叫做 "Disposable" (一次性资源对象)。

```ts
import { interval } from 'rxjs';

const observable = interval(1000);
const subscription = observable.subscribe(x => console.log(x));
// 稍后:
// 这将取消正在进行的可观察对象的执行
// 该执行是通过调用可观察对象的subscribe开始的。
subscription.unsubscribe(); 
```

<span class="informal">订阅实际上仅具有`unsubscribe()`函数，以释放资源或取消可观察对象的执行。</span>

订阅也可以添加在一起，这样调用一个 `unsubscribe()` 方法，将会取消多个订阅。

您可以通过将一个订阅"添加"到另一个订阅中来做到这一点：

```ts
import { interval } from 'rxjs';

const observable1 = interval(400);
const observable2 = interval(300);

const subscription = observable1.subscribe(x => console.log('first: ' + x));
const childSubscription = observable2.subscribe(x => console.log('second: ' + x));

subscription.add(childSubscription);

setTimeout(() => {
  // 取消订阅和子订阅
  subscription.unsubscribe();
}, 1000);
```

执行后，我们会在控制台中看到：
```none
second: 0
first: 0
second: 1
first: 1
second: 2
```

订阅还具有`remove(otherSubscription)` 方法，以删除子订阅。
