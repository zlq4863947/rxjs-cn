# 决策树生成

## 目的
在YAML中管理决策树，以选择一个操作符并生成JSON供docs web应用使用。

## 目标
- 将决策树小部件的第一个版本移植到Angular中
- 扁平化JSON结构，使其易于在docs web应用程序中使用
- 通过Dgeni使用来自文档生成任务的URI路径和其他相关路径
- 通过保持YAML树中的链表结构，使决策树的工作可伸缩且易于使用

## 现有技术
版本1在旧文档站点中，使用了YAML、snabbdom、RxJS和hyperscript-helpers。版本1的YAML通过一些小的调整被移植到新版本中。

## 技术
- Node
- TypeScript
- TS-Node
- Jest
- YAML

## 依赖关系
生成JSON需要：
- 决策树YAML，位于`/src`
- 生成的`api-list.json`，可以通过在`docs_app`的根路径运行`npm run docs` 生成

## 安装 & 生成
```shell
npm i && npm run build
```

## 开发
对YAML树或TypeScript脚本的任何更改都将生成一个新的JSON树

```shell
npm run watch
```

## 发布
在 `npm run build` 之后，JSON输出到`docs_app/src/generated/app/decision-tree-data.json`，供web应用程序使用。

在 `docs_app`  的根目录还有一个npm脚本，用于生成JSON树：`docs-decision-tree`。

## 测试
编写测试时运行监视任务
```shell
npm run test:watch
```

全部测试
```shell
npm run test
```

运行覆盖率测试
```shell
npm run test:coverage
npm run test:watch:coverage
```

## TODO
- 考虑将此工作移动到Dgeni包中，以便以生成其他文档信息的相同方式生成它