## 0. 安装依赖

- [x] 0.1 安装 fast-glob 依赖：`pnpm add fast-glob`
- [x] 0.2 验证 fast-glob 类型定义是否正确加载
- [x] 0.3 更新 package.json 和 pnpm-lock.yaml

## 1. FileSearchTool 实现

- [x] 1.1 创建 FileSearchTool 类，继承 SimpleTool
- [x] 1.2 定义工具参数（path、pattern、caseSensitive、maxMatches）
- [x] 1.3 实现正则表达式搜索逻辑
- [x] 1.4 添加文件大小限制检查（10MB）
- [x] 1.5 实现错误处理（文件不存在、权限不足）
- [x] 1.6 添加 JSDoc 注释

## 2. FileMoveTool 实现

- [x] 2.1 创建 FileMoveTool 类，继承 SimpleTool
- [x] 2.2 定义工具参数（source、dest）
- [x] 2.3 实现路径解析和验证
- [x] 2.4 实现文件移动逻辑（自动创建目标目录）
- [x] 2.5 添加错误处理（源文件不存在、跨设备移动）
- [x] 2.6 添加 JSDoc 注释

## 3. FileCopyTool 实现

- [x] 3.1 创建 FileCopyTool 类，继承 SimpleTool
- [x] 3.2 定义工具参数（source、dest）
- [x] 3.3 实现路径解析和验证
- [x] 3.4 实现文件复制逻辑（自动创建目标目录）
- [x] 3.5 添加错误处理（源文件不存在）
- [x] 3.6 添加 JSDoc 注释

## 4. FileDeleteTool 实现

- [x] 4.1 创建 FileDeleteTool 类，继承 SimpleTool
- [x] 4.2 定义工具参数（path、confirm）
- [x] 4.3 实现 confirm 参数验证（必须为 true）
- [x] 4.4 实现文件删除逻辑
- [x] 4.5 添加错误处理（文件不存在、路径是目录、权限不足）
- [x] 4.6 添加 JSDoc 注释

## 5. FileInfoTool 实现

- [x] 5.1 创建 FileInfoTool 类，继承 SimpleTool
- [x] 5.2 定义工具参数（path）
- [x] 5.3 实现文件信息获取逻辑
- [x] 5.4 返回详细信息（size、mtime、atime、ctime、mode、isFile、isDirectory）
- [x] 5.5 添加错误处理（路径不存在）
- [x] 5.6 添加 JSDoc 注释

## 6. DirCreateTool 实现

- [x] 6.1 创建 DirCreateTool 类，继承 SimpleTool
- [x] 6.2 定义工具参数（path、recursive）
- [x] 6.3 实现目录创建逻辑（支持递归）
- [x] 6.4 添加错误处理（权限不足）
- [x] 6.5 处理目录已存在的情况（不抛出错误）
- [x] 6.6 添加 JSDoc 注释

## 7. DirDeleteTool 实现

- [x] 7.1 创建 DirDeleteTool 类，继承 SimpleTool
- [x] 7.2 定义工具参数（path、recursive、confirm）
- [x] 7.3 实现 confirm 参数验证（必须为 true）
- [x] 7.4 实现目录删除逻辑（支持递归）
- [x] 7.5 添加错误处理（目录不存在、路径是文件、目录不为空）
- [x] 7.6 添加 JSDoc 注释

## 8. 工具注册

- [x] 8.1 在 filesystem.ts 文件中导出所有新工具
- [x] 8.2 验证工具是否自动注册到注册表
- [x] 8.3 运行工具注册测试

## 9. 单元测试

- [x] 9.1 为 FileSearchTool 编写测试用例（正常、错误场景）
- [x] 9.2 为 FileMoveTool 编写测试用例（正常、错误场景）
- [x] 9.3 为 FileCopyTool 编写测试用例（正常、错误场景）
- [x] 9.4 为 FileDeleteTool 编写测试用例（正常、错误场景）
- [x] 9.5 为 FileInfoTool 编写测试用例（正常、错误场景）
- [x] 9.6 为 DirCreateTool 编写测试用例（正常、错误场景）
- [x] 9.7 为 DirDeleteTool 编写测试用例（正常、错误场景）
- [x] 9.8 运行所有测试，确保 100% 通过

## 10. 代码审查

- [x] 10.1 使用 code-reviewer 进行代码审查
- [x] 10.2 修复审查发现的问题
- [x] 10.3 运行类型检查（pnpm type-check）
- [x] 10.4 运行代码检查（pnpm lint）

## 11. 构建和验证

- [x] 11.1 运行构建（pnpm build）
- [x] 11.2 验证构建产物
- [x] 11.3 手动测试每个工具的功能