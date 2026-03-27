/**
 * Vitest 测试环境设置
 * @description 为测试环境提供必要的全局变量和 polyfills
 */

// 使文件成为模块，允许使用 declare global
export {};

// dingtalk-sdk 需要的 window 对象
global.window = {
  location: {} as Location,
  navigator: {
    userAgent: "Node.js",
  } as Navigator,
  document: {} as Document,
  addEventListener: () => {},
  removeEventListener: () => {},
} as unknown as Window & typeof globalThis;

// dingtalk-sdk 需要的 env 对象
declare global {
  var env: {
    platform: string;
    userAgent: string;
    document: object;
    window: Window & typeof globalThis;
    location: object;
    navigator: Navigator;
  };
}

global.env = {
  platform: "node",
  userAgent: "Node.js",
  document: {},
  window: global.window,
  location: {},
  navigator: global.window.navigator,
};

// 提供 process 对象（如果环境中不存在）
if (typeof process === "undefined") {
  (global as any).process = {
    env: {},
    platform: "node",
    nextTick: (fn: () => void) => setTimeout(fn, 0),
  };
}
