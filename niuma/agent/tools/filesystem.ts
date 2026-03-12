/**
 * 文件系统工具
 * 提供文件读写、编辑、目录列出等功能
 */

import { readFile as fsReadFile, writeFile as fsWriteFile, stat, readdir, mkdir } from 'node:fs/promises'
import { join, resolve, isAbsolute } from 'node:path'

import { z } from 'zod'

import { BaseTool } from './base'
import { ToolExecutionError } from '../../types/error'

/**
 * 解析路径：支持绝对路径和相对路径
 */
function resolvePath(path: string, cwd: string = process.cwd()): string {
  if (isAbsolute(path)) {
    return path
  }
  return resolve(cwd, path)
}

/**
 * ReadFile 工具：读取文件内容
 */
export class ReadFileTool extends BaseTool {
  readonly name = 'read_file'
  readonly description = '读取文件内容。支持行号范围读取（offset/limit）和大文件截断（30,000 字符限制）。'
  readonly parameters = z.object({
    path: z.string().describe('文件路径（绝对或相对）'),
    offset: z.number().int().nonnegative().optional().describe('起始行号（0-based）'),
    limit: z.number().int().positive().optional().describe('读取行数限制'),
  })

  async execute(args: { path: string; offset?: number; limit?: number }): Promise<string> {
    const { path, offset, limit } = args
    const resolvedPath = resolvePath(path)

    try {
      const content = await fsReadFile(resolvedPath, 'utf-8')
      const lines = content.split('\n')

      // 处理行号范围
      let resultLines = lines
      if (offset !== undefined || limit !== undefined) {
        const start = offset ?? 0
        const end = limit !== undefined ? start + limit : undefined
        resultLines = lines.slice(start, end)
      }

      let result = resultLines.join('\n')

      // 处理大文件截断
      const MAX_CHARS = 30000
      if (result.length > MAX_CHARS) {
        result = result.slice(0, MAX_CHARS) + '\n\n... (内容已截断，使用 offset/limit 分页读取更多内容)'
      }

      return result
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ToolExecutionError(this.name, `文件不存在: ${resolvedPath}`)
      }
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new ToolExecutionError(this.name, `无权限访问文件: ${resolvedPath}`)
      }
      throw new ToolExecutionError(this.name, `读取文件失败: ${(error as Error).message}`)
    }
  }
}

/**
 * WriteFile 工具：写入文件
 */
export class WriteFileTool extends BaseTool {
  readonly name = 'write_file'
  readonly description = '创建或覆盖文件。自动创建目录。'
  readonly parameters = z.object({
    path: z.string().describe('文件路径'),
    content: z.string().describe('文件内容'),
  })

  async execute(args: { path: string; content: string }): Promise<string> {
    const { path, content } = args
    const resolvedPath = resolvePath(path)

    try {
      // 确保目录存在
      const dir = resolve(resolvedPath, '..')
      await mkdir(dir, { recursive: true })

      // 写入文件
      await fsWriteFile(resolvedPath, content, 'utf-8')
      return `成功写入文件: ${resolvedPath}`
    } catch (error) {
      throw new ToolExecutionError(this.name, `写入文件失败: ${(error as Error).message}`)
    }
  }
}

/**
 * EditFile 工具：精确编辑文件
 */
export class EditFileTool extends BaseTool {
  readonly name = 'edit_file'
  readonly description = '精确修改文件的特定部分。支持字符串替换。'
  readonly parameters = z.object({
    path: z.string().describe('文件路径'),
    old_string: z.string().describe('要替换的旧内容（精确匹配）'),
    new_string: z.string().describe('新内容'),
  })

  async execute(args: { path: string; old_string: string; new_string: string }): Promise<string> {
    const { path, old_string, new_string } = args
    const resolvedPath = resolvePath(path)

    try {
      // 读取文件
      const content = await fsReadFile(resolvedPath, 'utf-8')

      // 检查是否包含旧内容
      if (!content.includes(old_string)) {
        throw new ToolExecutionError(this.name, `文件中未找到指定的内容: ${old_string.slice(0, 50)}...`)
      }

      // 替换内容
      const newContent = content.replace(old_string, new_string)

      // 写入文件
      await fsWriteFile(resolvedPath, newContent, 'utf-8')
      return `成功编辑文件: ${resolvedPath}`
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error
      }
      throw new ToolExecutionError(this.name, `编辑文件失败: ${(error as Error).message}`)
    }
  }
}

/**
 * ListDir 工具：列出目录内容
 */
export class ListDirTool extends BaseTool {
  readonly name = 'list_dir'
  readonly description = '列出目录中的文件和子目录。支持递归列出和 glob 模式过滤。'
  readonly parameters = z.object({
    path: z.string().describe('目录路径'),
    recursive: z.boolean().optional().describe('是否递归列出子目录'),
    pattern: z.string().optional().describe('文件过滤模式（glob 模式）'),
    ignore: z.array(z.string()).optional().describe('忽略的模式'),
  })

  async execute(args: {
    path: string
    recursive?: boolean
    pattern?: string
    ignore?: string[]
  }): Promise<string> {
    const { path, recursive = false, pattern, ignore = [] } = args
    const resolvedPath = resolvePath(path)

    try {
      // 检查路径是否存在
      const stats = await stat(resolvedPath)
      if (!stats.isDirectory()) {
        throw new ToolExecutionError(this.name, `路径不是目录: ${resolvedPath}`)
      }

      const items: Array<{ name: string; type: 'file' | 'directory'; path: string; size?: number }> = []

      // 递归列出目录
      async function listDir(dir: string, relativePath = ''): Promise<void> {
        const entries = await readdir(dir, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = join(dir, entry.name)
          const relPath = join(relativePath, entry.name)

          // 检查忽略模式
          const isIgnored = ignore.some((pattern) => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'))
            return regex.test(entry.name)
          })
          if (isIgnored) continue

          // 检查过滤模式
          if (pattern && !entry.name.match(new RegExp(pattern.replace(/\*/g, '.*')))) {
            if (!entry.isDirectory()) continue
          }

          if (entry.isDirectory()) {
            items.push({
              name: entry.name,
              type: 'directory',
              path: relPath,
            })

            if (recursive) {
              await listDir(fullPath, relPath)
            }
          } else {
            const fileStats = await stat(fullPath)
            items.push({
              name: entry.name,
              type: 'file',
              path: relPath,
              size: fileStats.size,
            })
          }
        }
      }

      await listDir(resolvedPath)

      // 格式化输出
      const output = items
        .map((item) => {
          const typeStr = item.type === 'directory' ? '[DIR]' : '[FILE]'
          const sizeStr = item.size !== undefined ? ` (${item.size} bytes)` : ''
          return `${typeStr} ${item.path}${sizeStr}`
        })
        .join('\n')

      return output || '目录为空'
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error
      }
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ToolExecutionError(this.name, `目录不存在: ${resolvedPath}`)
      }
      throw new ToolExecutionError(this.name, `列出目录失败: ${(error as Error).message}`)
    }
  }
}

// 导出工具实例
export const readFileTool = new ReadFileTool()
export const writeFileTool = new WriteFileTool()
export const editFileTool = new EditFileTool()
export const listDirTool = new ListDirTool()