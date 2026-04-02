# 透明代理

## 开发规则

1. 使用 TypeScript；禁止编写纯 JavaScript 代码（.js、.jsx）文件。
2. 必须使用 `tsx` 来运行 TypeScript 脚本（package.json 中已安装）。
3. 仅使用 `pnpm` 包管理器；不在当前项目中运行任何 `npm` 命令（例如禁止运行 `npm install`）。
4. 在修改任何代码文件之后，必须使用 `pnpm run check` 来检查代码。
5. 所有的「注释」和「给用户看的字符串内容」必须使用简体中文。
