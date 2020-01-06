# 安装说明

以下是安装RxJS的不同方法：

## 通过npm的ES6

```js
npm install rxjs
```

导入整个核心功能集：

```js
import * as rxjs from 'rxjs';

rxjs.of(1, 2, 3);
```

只导入您需要使用的管道操作符：

```js
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

of(1,2,3).pipe(map(x => x + '!!!')); // etc
```
* 有关管道操作符的详细信息，请参阅[管道操作符文档](https://github.com/zlq4863947/rxjs-cn/blob/master/doc/pipeable-operators.md) 

要与全局导入的捆绑包一起使用：

```js
const { of } = rxjs;
const { map } = rxjs.operators;

of(1,2,3).pipe(map(x => x + '!!!')); // etc
```

## 通过npm的CommonJS

如果在使用RxJS时收到： error TS2304:Cannot find name'Promise'或error TS2304:Cannot find name'Iterable'，则可能需要安装一组接口类型。

1.  对于typings用户：

```js
typings install es6-shim --ambient
```

2.  如果您不使用`typings`，则可以从/es6-shim/es6-shim.d.ts复制接口。

3.  添加tsconfig.json或CLI参数中包含的类型定义文件。


## 通过npm的所有模块类型(CJS/ES6/AMD/TypeScript)

要通过npm的version 3安装此库，请使用以下命令：

```js
npm install @reactivex/rxjs
```

如果在此库达到稳定版本之前使用的是npm的version 2，则需要显式指定库版本：

```js
npm install @reactivex/rxjs@5.0.0-beta.1
```

## CDN

对于CDN，您可以使用 [unpkg](https://unpkg.com/)。只需在下面的链接中将版本替换为当前版本：

对于RxJS 5.0.0.beta.1到beta.11： [https://unpkg.com/@reactivex/rxjs@version/dist/global/Rx.umd.js](https://unpkg.com/@reactivex/rxjs@version/dist/global/Rx.umd.js)

对于RxJS 5.0.0-beta.12及更高版本：[https://unpkg.com/@reactivex/rxjs@version/dist/global/Rx.js](https://unpkg.com/@reactivex/rxjs@version/dist/global/Rx.js)

对于RxJS 6.0.0及更高版本：[https://unpkg.com/@reactivex/rxjs@version/dist/global/rxjs.umd.js](https://unpkg.com/@reactivex/rxjs@version/dist/global/rxjs.umd.js)
