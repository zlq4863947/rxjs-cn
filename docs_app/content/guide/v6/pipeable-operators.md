# 管道操作符(Pipeable Operators)

从5.5版开始，我们提供了"管道操作符"，可以在`rxjs/operators`中访问（注意复数的"operators"）。与`rxjs-compat`包中的"patch" 操作符相比，这是一种更好的方法，只引入所需的操作符。

**注意**：使用`rxjs`或`rxjs/operators`而不更改您的构建过程可能会导致更大的捆绑包。请参阅下面的[已知问题](#known-issues)部分。

**重命名的操作符**

由于有独立于可观察对象的可用操作符，操作符名称不能与JavaScript关键字限制冲突。因此，某些操作符的管道版本名称已更改。这些操作符是：

1. `do` -> `tap`
2. `catch` -> `catchError`
3. `switch` -> `switchAll`
4. `finally` -> `finalize`

`let`操作符现在以改为 `Observable`的`pipe`，因此无法导入。

`source$.let(myOperator) -> source$.pipe(myOperator)`

请参见下面的"[构建自己的操作符](#轻松建立自己的操作符)"。

先前的`toPromise()`“操作符”已被删除
因为操作符返回的是一个`Observable`，而不是一个`Promise`。
现在有一个`Observable.toPromise()`实例方法代替。

## 为什么?

用于链式操作的修补操作符有以下问题：

1. 任何导入修补操作符的库都将为该库的所有使用者增加`Observable.prototype`，从而产生盲目依赖。如果库取消了它们的使用，它们将在不知不觉中破坏其他所有。对于管道，必须将所需的操作符导入使用它们的每个文件中。

2. 直接修补到原型上的操作符没有诸如rollup或webpack之类的工具的[["Tree-Shaking"](https://developer.mozilla.org/zh-CN/docs/Glossary/Tree_shaking)功能。可管道操作符就像是直接从模块中引入的函数一样。

3. 任何类型的生成工具或lint规则都无法可靠地检测正在应用程序中导入的未使用的修补操作符。这意味着您可以导入`scan`，但停止使用它，它仍将添加到输出包中。使用管道操作符时，如果它未被使用，则可以通过lint规则为您找到它。

4. 功能的构建是令人惊叹的。使您建立自己的自定义操作符变得更加容易，现在它们运行起来，就像rxjs中的所有其他操作符一样。您不再需要扩展`Observable`或覆盖`lift`了。

## 是什么?

管道操作符是什么？ 简而言之，该函数可以与当前的`let`运算符一起使用。它曾经是名称（'lettable'）的由来，但这令人困惑，因此我们现在将它们称为"pipeable"，因为它们旨在与`pipe`一起使用。管道操作符基本上是任何返回带有签名的函数的函数：`<T, R>(source: Observable<T>) => Observable<R>`。

现在，在`Observable.prototype.pipe`中的`Observable`中内置了`pipe`方法，可以用来组合操作符，其方式与您使用链式操作时所用的方式相似（如下所示）。

还有一个`pipe`工具函数，可以从`import { pipe } from 'rxjs';`中导入。`pipe`函数可用于从其他管道操作符生成可重用的管道运算符。例如：

```ts
import { pipe } from 'rxjs';
import { map } from 'rxjs/operators';

const mapTwice = <T,R>(fn: (value: T, index: number) => R) => pipe(map(fn), map(fn));
```

## 使用

您可以从`'rxjs/operators'`（**复数！**）下的任意位置导出所需的任何操作符。还建议使用`range`直接引入所需的Observable创建方法，如下所示：

```ts
import { range } from 'rxjs';
import { map, filter, scan } from 'rxjs/operators';

const source$ = range(0, 10);

source$.pipe(
  filter(x => x % 2 === 0),
  map(x => x + x),
  scan((acc, x) => acc + x, 0)
)
.subscribe(x => console.log(x))

// Logs:
// 0
// 4
// 12
// 24
// 40
```

## 轻松建立自己的操作符

实际上，您可以经常用`let` ...来做到这一点，但是，现在构建自己的操作符就像编写函数一样简单。请注意，您可以将自定义操作符与其他rxjs操作算符无缝组合在一起。

```ts
import { Observable, interval } from 'rxjs';
import { filter, map, take, toArray } from 'rxjs/operators';

/**
 * 一个取第N个值的的操作符
 */
const takeEveryNth = (n: number) => <T>(source: Observable<T>) =>
  new Observable<T>(observer => {
    let count = 0;
    return source.subscribe({
      next(x) {
        if (count++ % n === 0) observer.next(x);
      },
      error(err) { observer.error(err); },
      complete() { observer.complete(); }
    })
  });

/**
 * 您也可以像这样使用现有的操作符
 */
const takeEveryNthSimple = (n: number) => <T>(source: Observable<T>) =>
  source.pipe(filter((value, index) => index % n === 0 ))

/**
 * 由于管道操作符返回函数，因此您可以像这样进一步简化
 */
const takeEveryNthSimplest = (n: number) => filter((value, index) => index % n === 0);

interval(1000).pipe(
  takeEveryNth(2),
  map(x => x + x),
  takeEveryNthSimple(3),
  map(x => x * x),
  takeEveryNthSimplest(4),
  take(3),
  toArray()
)
.subscribe(x => console.log(x));
// Logs:
// [0, 2304, 9216]
```

## 已知的问题

### TypeScript < 2.4
在TypeScript 2.3及更低版本中，由于无法在TypeScript 2.4之前推断类型，因此需要将类型添加到传递给操作符的函数中。在TypeScript 2.4中，类型将通过组合正确推断。

**TS 2.3及以下版本**

```ts
range(0, 10).pipe(
  map((n: number) => n + '!'),
  map((s: string) => 'Hello, ' + s),
).subscribe(x => console.log(x))
```

**TS 2.4及以上版本**

```ts
range(0, 10).pipe(
  map(n => n + '!'),
  map(s => 'Hello, ' + s),
).subscribe(x => console.log(x))
```

### 构建和Treeshaking

从清单文件（或重新导出）导入时，应用程序捆绑有时可能会增长。 现在可从`rxjs/operators`中导入管道操作符，但如果不更改构建过程，则通常会导致应用程序包变大。这是因为默认情况下，`rxjs/operators`将解析为rxjs的CommonJS输出。

为了使用新的管道操作符而不增加捆绑包的大小，您将需要更改Webpack配置。这仅适用于Webpack 3+，因为它依赖于Webpack 3中的新模块`ModuleConcatenationPlugin`。

**path-mapping**

与RxJS5.5一起发布的是使用ES5和ES2015语言级别的ECMAScript模块格式（导入和导出）构建的rxjs。您可以在`node_modules/rxjs/_esm5`和`node_modules/rxjs/_esm2015`中找到这些发行版（“esm”代表ECMAScript模块，数字“5”或“2015”代表ES语言级别）。在应用程序源代码中，应该从`rxjs/operators`导入，但在Webpack配置文件中，需要将导入重新映射到ESM5（或ESM5010）版本。

如果您使用`require('rxjs/_esm5/path-mapping')`，将收到一个函数，该函数返回一个键值对对象，将每个输入映射到其在磁盘上的文件位置。使用此映射，如下所示：

**webpack.config.js**

配置简单：

<!-- skip-example -->
```js
const rxPaths = require('rxjs/_esm5/path-mapping');
const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: 'index.js',
  output: 'bundle.js',
  resolve: {
    // 使用"alias"键解析为ESM发行版
    alias: rxPaths()
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin()
  ]
};
```

更完整的配置（更接近实际场景）：

<!-- skip-example -->
```js
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const DashboardPlugin = require('webpack-dashboard/plugin');
const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const rxPaths = require('rxjs/_esm5/path-mapping');

var config = {
    devtool: isProd ? 'hidden-source-map' : 'cheap-eval-source-map',
    context: path.resolve('./src'),
    entry: {
        app: './index.ts',
        vendor: './vendor.ts'
    },
    output: {
        path: path.resolve('./dist'),
        filename: '[name].bundle.js',
        sourceMapFilename: '[name].map',
        devtoolModuleFilenameTemplate: function (info) {
            return "file:///" + info.absoluteResourcePath;
        }
    },
    module: {
        rules: [
            { enforce: 'pre', test: /\.ts$|\.tsx$/, exclude: ["node_modules"], loader: 'ts-loader' },
            { test: /\.html$/, loader: "html" },
            { test: /\.css$/, loaders: ['style', 'css'] }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"],
        modules: [path.resolve('./src'), 'node_modules'],
        alias: rxPaths()
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': { // eslint-disable-line quote-props
                NODE_ENV: JSON.stringify(nodeEnv)
            }
        }),
        new webpack.HashedModuleIdsPlugin(),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new HtmlWebpackPlugin({
            title: 'Typescript Webpack Starter',
            template: '!!ejs-loader!src/index.html'
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: Infinity,
            filename: 'vendor.bundle.js'
        }),
        new webpack.optimize.UglifyJsPlugin({
            mangle: false,
            compress: { warnings: false, pure_getters: true, passes: 3, screw_ie8: true, sequences: false },
            output: { comments: false, beautify: true },
            sourceMap: false
        }),
        new DashboardPlugin(),
        new webpack.LoaderOptionsPlugin({
            options: {
                tslint: {
                    emitErrors: true,
                    failOnHint: true
                }
            }
        })
    ]
};

module.exports = config;
```
