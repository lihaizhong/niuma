/**
 * 文件系统工具测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { readFileTool, writeFileTool, editFileTool, listDirTool } from '../agent/tools/filesystem'
import { ToolExecutionError } from '../types/error'

describe('ReadFileTool', () => {
  const testDir = '/tmp/niuma-test-readfile'
  const testFile = join(testDir, 'test.txt')
  const testContent = 'Hello, World!\nLine 2\nLine 3'

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
    await writeFile(testFile, testContent, 'utf-8')
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('应该成功读取完整文件', async () => {
    const result = await readFileTool.execute({ path: testFile })
    expect(result).toBe(testContent)
  })

  it('应该成功读取指定行号范围', async () => {
    const result = await readFileTool.execute({ path: testFile, offset: 1, limit: 2 })
    const lines = result.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe('Line 2')
    expect(lines[1]).toBe('Line 3')
  })

  it('应该抛出错误当文件不存在', async () => {
    await expect(readFileTool.execute({ path: '/nonexistent/file.txt' })).rejects.toThrow(
      ToolExecutionError
    )
  })

  it('应该处理空文件', async () => {
    const emptyFile = join(testDir, 'empty.txt')
    await writeFile(emptyFile, '', 'utf-8')
    const result = await readFileTool.execute({ path: emptyFile })
    expect(result).toBe('')
  })
})

describe('WriteFileTool', () => {
  const testDir = '/tmp/niuma-test-writefile'
  const testFile = join(testDir, 'test.txt')

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('应该成功写入新文件', async () => {
    const content = 'Test content'
    const result = await writeFileTool.execute({ path: testFile, content })
    expect(result).toContain('成功写入文件')
  })

  it('应该成功覆盖现有文件', async () => {
    await writeFile(testFile, 'Old content', 'utf-8')
    const newContent = 'New content'
    await writeFileTool.execute({ path: testFile, content: newContent })
    const result = await readFileTool.execute({ path: testFile })
    expect(result).toBe(newContent)
  })

  it('应该自动创建目录', async () => {
    const nestedFile = join(testDir, 'nested', 'dir', 'test.txt')
    const result = await writeFileTool.execute({ path: nestedFile, content: 'test' })
    expect(result).toContain('成功写入文件')
  })
})

describe('EditFileTool', () => {
  const testDir = '/tmp/niuma-test-editfile'
  const testFile = join(testDir, 'test.txt')
  const testContent = 'Hello, World!\nThis is a test.\nGoodbye!'

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
    await writeFile(testFile, testContent, 'utf-8')
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('应该成功替换指定内容', async () => {
    await editFileTool.execute({
      path: testFile,
      old_string: 'Hello, World!',
      new_string: 'Hi, World!',
    })
    const result = await readFileTool.execute({ path: testFile })
    expect(result).toContain('Hi, World!')
    expect(result).not.toContain('Hello, World!')
  })

  it('应该抛出错误当内容未找到', async () => {
    await expect(
      editFileTool.execute({
        path: testFile,
        old_string: 'Nonexistent content',
        new_string: 'Replacement',
      })
    ).rejects.toThrow(ToolExecutionError)
  })

  it('应该支持多行替换', async () => {
    await editFileTool.execute({
      path: testFile,
      old_string: 'This is a test.',
      new_string: 'This is an updated test.',
    })
    const result = await readFileTool.execute({ path: testFile })
    expect(result).toContain('This is an updated test.')
  })
})

describe('ListDirTool', () => {
  const testDir = '/tmp/niuma-test-listdir'

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true })
    await writeFile(join(testDir, 'file1.txt'), 'content1', 'utf-8')
    await writeFile(join(testDir, 'file2.txt'), 'content2', 'utf-8')
    await mkdir(join(testDir, 'subdir'), { recursive: true })
    await writeFile(join(testDir, 'subdir', 'file3.txt'), 'content3', 'utf-8')
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('应该成功列出目录内容', async () => {
    const result = await listDirTool.execute({ path: testDir })
    expect(result).toContain('file1.txt')
    expect(result).toContain('file2.txt')
    expect(result).toContain('subdir')
  })

  it('应该支持递归列出', async () => {
    const result = await listDirTool.execute({ path: testDir, recursive: true })
    expect(result).toContain('file1.txt')
    expect(result).toContain('file2.txt')
    expect(result).toContain('subdir')
    expect(result).toContain('file3.txt')
  })

  it('应该支持模式过滤', async () => {
    const result = await listDirTool.execute({ path: testDir, pattern: '*.txt' })
    expect(result).toContain('file1.txt')
    expect(result).toContain('file2.txt')
  })

  it('应该抛出错误当目录不存在', async () => {
    await expect(listDirTool.execute({ path: '/nonexistent/dir' })).rejects.toThrow(
      ToolExecutionError
    )
  })
})