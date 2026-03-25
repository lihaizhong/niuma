/**
 * Human-in-the-Loop 审批系统测试
 */

import { describe, it, expect, beforeEach } from "vitest";

import { HumanInTheLoop } from "../agent/approval";

describe("HumanInTheLoop", () => {
  describe("配置", () => {
    it("应该默认禁用", () => {
      const hitl = new HumanInTheLoop();
      expect(hitl.isEnabled()).toBe(false);
    });

    it("应该能够启用和禁用", () => {
      const hitl = new HumanInTheLoop();
      hitl.enable();
      expect(hitl.isEnabled()).toBe(true);
      hitl.disable();
      expect(hitl.isEnabled()).toBe(false);
    });
  });

  describe("敏感操作检测", () => {
    let hitl: HumanInTheLoop;

    beforeEach(() => {
      hitl = new HumanInTheLoop({
        config: {
          enabled: true,
          autoApproveBelowSeverity: "low",
        },
      });
    });

    it("应该检测删除敏感文件的操作", () => {
      const result = hitl.detectSensitiveOperation("exec", {
        command: "rm -rf /project/.git",
      });

      expect(result.shouldBlock).toBe(true);
      expect(result.operation?.type).toBe("file_delete");
    });

    it("应该检测部署操作", () => {
      const result = hitl.detectSensitiveOperation("exec", {
        command: "kubectl apply -f production.yaml",
      });

      expect(result.shouldBlock).toBe(true);
      expect(result.operation?.type).toBe("deploy");
    });

    it("应该不阻止非敏感操作", () => {
      const result = hitl.detectSensitiveOperation("exec", {
        command: "echo hello",
      });

      expect(result.shouldBlock).toBe(false);
    });

    it("应该自动批准低严重性操作", () => {
      hitl = new HumanInTheLoop({
        config: {
          enabled: true,
          autoApproveBelowSeverity: "medium",
        },
      });

      const result = hitl.detectSensitiveOperation("read_file", {
        path: "/project/README.md",
      });

      expect(result.shouldBlock).toBe(false);
    });
  });

  describe("审批流程", () => {
    let hitl: HumanInTheLoop;

    beforeEach(() => {
      hitl = new HumanInTheLoop({
        config: {
          enabled: true,
        },
      });

      hitl.setApprovalCallback(async (request) => {
        return {
          requestId: request.id,
          approved: true,
          comment: "Test approval",
          respondedAt: new Date().toISOString(),
        };
      });
    });

    it("应该能够请求审批", async () => {
      const response = await hitl.requestApproval(
        {
          type: "file_delete",
          target: "/project/test.txt",
          severity: "high",
        },
        "Deleting test file"
      );

      expect(response.approved).toBe(true);
      expect(response.comment).toBe("Test approval");
    });

    it("应该能够手动批准", async () => {
      const request = await hitl.requestApproval(
        { type: "file_delete", target: "/project/test.txt", severity: "high" },
        "Test deletion"
      );
      
      const response = hitl.approve(request.requestId, "Manual approval");
      expect(response.approved).toBe(true);
    });

    it("应该能够手动拒绝", () => {
      const response = hitl.deny("test-id", "Manual denial");
      expect(response.approved).toBe(false);
    });
  });

  describe("审计日志", () => {
    it("应该记录审批决策", async () => {
      const hitl = new HumanInTheLoop({
        config: {
          enabled: true,
        },
      });

      hitl.setApprovalCallback(async (request) => {
        return {
          requestId: request.id,
          approved: true,
          respondedAt: new Date().toISOString(),
        };
      });

      const response = await hitl.requestApproval(
        {
          type: "deploy",
          target: "production",
          severity: "critical",
        },
        "Deploying to production"
      );

      const logs = hitl.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].decision).toBe("approved");
    });

    it("应该能够清空日志", async () => {
      const hitl = new HumanInTheLoop({
        config: {
          enabled: true,
        },
      });

      hitl.setApprovalCallback(async (request) => ({
        requestId: request.id,
        approved: true,
        respondedAt: new Date().toISOString(),
      }));

      await hitl.requestApproval(
        { type: "file_delete", target: "test", severity: "high" },
        "Test"
      );

      hitl.clearLogs();
      expect(hitl.getLogs()).toHaveLength(0);
    });
  });
});
