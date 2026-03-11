/**
 * 环境变量解析器单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  loadEnvFile,
  resolveEnvVars,
  loadEnvFromFile,
  resolveEnvVarsWithEnvFile
} from '../config/env-resolver'

describe('环境变量解析器', () => {
  let testDir: string
  let envPath: string

  beforeEach(() => {
    testDir = join(tmpdir(), 'niuma-env-test-' + Date.now())
    mkdirSync(testDir, { recursive: true })
    envPath = join(testDir, '.env')
  })

  afterEach(() => {
    if (existsSync(envPath)) {
      unlinkSync(envPath)
    }
  })

  describe('loadEnvFile()', () => {
    it('应该加载 .env 文件中的环境变量', () => {
      const content = `
OPENAI_API_KEY=sk-test123
OPENAI_BASE_URL=https://api.openai.com/v1
DEBUG=true
`
      writeFileSync(envPath, content, 'utf-8')
      const env = loadEnvFile(envPath)
      expect(env.OPENAI_API_KEY).toBe('sk-test123')
      expect(env.OPENAI_BASE_URL).toBe('https://api.openai.com/v1')
      expect(env.DEBUG).toBe('true')
    })

    it('应该跳过注释行', () => {
      const content = `
# 这是注释
OPENAI_API_KEY=sk-test123
# 另一个注释
OPENAI_BASE_URL=https://api.openai.com/v1
`
      writeFileSync(envPath, content, 'utf-8')
      const env = loadEnvFile(envPath)
      expect(env.OPENAI_API_KEY).toBe('sk-test123')
      expect(env.OPENAI_BASE_URL).toBe('https://api.openai.com/v1')
      expect(env['#']).toBeUndefined()
    })

    it('应该处理带引号的值', () => {
      const content = `
STRING1="value with spaces"
STRING2='value with single quotes'
STRING3=value_without_quotes
`
      writeFileSync(envPath, content, 'utf-8')
      const env = loadEnvFile(envPath)
      expect(env.STRING1).toBe('value with spaces')
      expect(env.STRING2).toBe('value with single quotes')
      expect(env.STRING3).toBe('value_without_quotes')
    })

    it('应该返回空对象当文件不存在时', () => {
      const env = loadEnvFile('/nonexistent/.env')
      expect(env).toEqual({})
    })
  })

  describe('resolveEnvVars()', () => {
    beforeEach(() => {
      process.env.TEST_VAR = 'test-value'
    })

    afterEach(() => {
      delete process.env.TEST_VAR
    })

    it('应该替换环境变量引用 ${VAR}', () => {
      const config = {
        apiKey: '${TEST_VAR}',
        url: 'https://api.example.com'
      }
      const result = resolveEnvVars(config, { strict: false, env: {} })
      expect(result.apiKey).toBe('test-value')
      expect(result.url).toBe('https://api.example.com')
    })

    it('应该替换环境变量引用 ${VAR:default}', () => {
      const config = {
        apiKey: '${NONEXISTENT_VAR:default-value}',
        url: 'https://api.example.com'
      }
      const result = resolveEnvVars(config, { strict: false, env: {} })
      expect(result.apiKey).toBe('default-value')
      expect(result.url).toBe('https://api.example.com')
    })

    it('应该使用自定义环境变量优先于系统环境变量', () => {
      const config = {
        apiKey: '${TEST_VAR}'
      }
      const result = resolveEnvVars(config, { strict: false, env: { TEST_VAR: 'custom-value' } })
      expect(result.apiKey).toBe('custom-value')
    })

    it('应该递归处理嵌套对象', () => {
      const config = {
        providers: {
          openai: {
            apiKey: '${TEST_VAR}',
            apiBase: 'https://api.openai.com/v1'
          }
        }
      }
      const result = resolveEnvVars(config, { strict: false, env: {} })
      expect(result.providers.openai.apiKey).toBe('test-value')
      expect(result.providers.openai.apiBase).toBe('https://api.openai.com/v1')
    })

    it('应该递归处理数组', () => {
      const config = {
        list: [
          '${TEST_VAR}',
          'static-value',
          {
            nested: '${TEST_VAR}'
          } as { nested: string }
        ]
      }
      const result = resolveEnvVars(config, { strict: false, env: {} })
      expect(result.list[0]).toBe('test-value')
      expect(result.list[1]).toBe('static-value')
      expect((result.list[2] as { nested: string }).nested).toBe('test-value')
    })

    it('应该在严格模式下抛出错误当环境变量不存在', () => {
      const config = {
        apiKey: '${NONEXISTENT_VAR}'
      }
      expect(() => resolveEnvVars(config, { strict: true, env: {} })).toThrow('环境变量 NONEXISTENT_VAR 未定义')
    })

    it('应该在非严格模式下保持原样当环境变量不存在', () => {
      const config = {
        apiKey: '${NONEXISTENT_VAR}'
      }
      const result = resolveEnvVars(config, { strict: false, env: {} })
      expect(result.apiKey).toBe('${NONEXISTENT_VAR}')
    })

    it('应该处理多个环境变量引用', () => {
      const config = {
        url: 'https://${TEST_VAR}.example.com/${TEST_VAR}/api'
      }
      const result = resolveEnvVars(config, { strict: false, env: {} })
      expect(result.url).toBe('https://test-value.example.com/test-value/api')
    })
  })

  describe('loadEnvFromFile()', () => {
    it('应该从配置文件同目录加载 .env 文件', () => {
      const configPath = join(testDir, 'config.json')
      const envContent = 'CUSTOM_VAR=custom-value'
      writeFileSync(envPath, envContent, 'utf-8')

      const env = loadEnvFromFile(configPath)
      expect(env.CUSTOM_VAR).toBe('custom-value')
    })

    it('应该返回空对象当 .env 文件不存在时', () => {
      const configPath = join(testDir, 'config.json')
      const env = loadEnvFromFile(configPath)
      expect(env).toEqual({})
    })
  })

  describe('resolveEnvVarsWithEnvFile()', () => {
    it('应该自动加载 .env 文件并解析环境变量', () => {
      const configPath = join(testDir, 'config.json')
      const envContent = 'FILE_VAR=file-value'
      writeFileSync(envPath, envContent, 'utf-8')

      const config = {
        apiKey: '${FILE_VAR}',
        url: 'https://api.example.com'
      }
      const result = resolveEnvVarsWithEnvFile(config, configPath, false)
      expect(result.apiKey).toBe('file-value')
    })

    it('应该在严格模式下处理环境变量不存在的情况', () => {
      const configPath = join(testDir, 'config.json')
      const config = {
        apiKey: '${NONEXISTENT_VAR}'
      }
      expect(() => resolveEnvVarsWithEnvFile(config, configPath, true)).toThrow('环境变量 NONEXISTENT_VAR 未定义')
    })
  })
})