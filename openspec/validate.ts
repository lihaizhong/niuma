#!/usr/bin/env node
/**
 * OpenSpec Validation Script
 *
 * Validates OpenSpec changes for machine acceptance.
 * Run before commit to ensure all changes are complete.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve } from "path";

const OPEN_SPEC_DIR = resolve(process.cwd(), "openspec");
const CHANGES_DIR = join(OPEN_SPEC_DIR, "changes");

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ChangeValidation {
  name: string;
  result: ValidationResult;
}

/**
 * Find all active changes (excluding archive)
 */
function findActiveChanges(): string[] {
  if (!existsSync(CHANGES_DIR)) {
    return [];
  }

  const entries = readdirSync(CHANGES_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== "archive")
    .map((entry) => entry.name);
}

/**
 * Check if required artifacts exist for a change
 */
function validateArtifacts(changeName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const changeDir = join(CHANGES_DIR, changeName);

  const requiredFiles = ["proposal.md", "design.md", "tasks.md"];

  for (const file of requiredFiles) {
    const filePath = join(changeDir, file);
    if (!existsSync(filePath)) {
      errors.push(`Missing required artifact: ${file}`);
    }
  }

  // Check for specs directory
  const specsDir = join(changeDir, "specs");
  if (!existsSync(specsDir)) {
    warnings.push("No specs directory found");
  } else {
    const specFiles = readdirSync(specsDir, { withFileTypes: true }).filter(
      (entry) => entry.isFile() && entry.name.endsWith(".md")
    );
    if (specFiles.length === 0) {
      warnings.push("Specs directory is empty");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if all tasks are completed
 */
function validateTasks(changeName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const tasksFile = join(CHANGES_DIR, changeName, "tasks.md");

  if (!existsSync(tasksFile)) {
    return { valid: false, errors: ["tasks.md not found"], warnings: [] };
  }

  const content = readFileSync(tasksFile, "utf-8");

  // Count incomplete tasks
  const incompleteMatches = content.match(/- \[ \]/g);
  const incompleteCount = incompleteMatches ? incompleteMatches.length : 0;

  if (incompleteCount > 0) {
    errors.push(`${incompleteCount} task(s) not completed`);
  }

  // Count total tasks
  const totalMatches = content.match(/- \[[x ]\]/g);
  const totalCount = totalMatches ? totalMatches.length : 0;

  if (totalCount === 0) {
    warnings.push("No tasks defined in tasks.md");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate proposal format
 */
function validateProposal(changeName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const proposalFile = join(CHANGES_DIR, changeName, "proposal.md");

  if (!existsSync(proposalFile)) {
    return { valid: false, errors: ["proposal.md not found"], warnings: [] };
  }

  const content = readFileSync(proposalFile, "utf-8");

  // Check for Non-goals section
  if (!content.includes("Non-goals") && !content.includes("## Non-goals")) {
    errors.push('Proposal missing "Non-goals" section');
  }

  // Check for acceptance criteria
  if (!content.includes("Acceptance Criteria") && !content.includes("## Acceptance Criteria")) {
    warnings.push('Proposal missing explicit "Acceptance Criteria" section');
  }

  // Check word count (rough estimate)
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 500) {
    warnings.push(`Proposal is ${wordCount} words (recommended: <500)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate specs format
 */
function validateSpecs(changeName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const specsDir = join(CHANGES_DIR, changeName, "specs");

  if (!existsSync(specsDir)) {
    return { valid: true, errors: [], warnings: ["No specs to validate"] };
  }

  const specFiles = readdirSync(specsDir, { withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && entry.name.endsWith(".md") && !entry.name.includes(".test.")
    )
    .map((entry) => entry.name);

  for (const specFile of specFiles) {
    const specPath = join(specsDir, specFile);
    const content = readFileSync(specPath, "utf-8");

    // Check for Purpose section
    if (!content.includes("## Purpose")) {
      errors.push(`${specFile}: Missing "## Purpose" section`);
    }

    // Check for Requirements section
    if (!content.includes("## Requirements")) {
      errors.push(`${specFile}: Missing "## Requirements" section`);
    }

    // Check for SHALL/MUST keywords
    const hasRequirements = /\b(SHALL|MUST)\b/.test(content);
    if (!hasRequirements) {
      errors.push(`${specFile}: No requirements using SHALL/MUST keywords`);
    }

    // Check for scenarios
    const hasScenarios = /## (Scenarios|Scenario)/.test(content);
    if (!hasScenarios) {
      errors.push(`${specFile}: Missing scenarios section`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Run all validations for a change
 */
function validateChange(changeName: string): ChangeValidation {
  console.log(`\n📋 Validating change: ${changeName}`);
  console.log("=".repeat(50));

  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate artifacts
  const artifactResult = validateArtifacts(changeName);
  allErrors.push(...artifactResult.errors);
  allWarnings.push(...artifactResult.warnings);

  // Validate tasks
  const tasksResult = validateTasks(changeName);
  allErrors.push(...tasksResult.errors);
  allWarnings.push(...tasksResult.warnings);

  // Validate proposal
  const proposalResult = validateProposal(changeName);
  allErrors.push(...proposalResult.errors);
  allWarnings.push(...proposalResult.warnings);

  // Validate specs
  const specsResult = validateSpecs(changeName);
  allErrors.push(...specsResult.errors);
  allWarnings.push(...specsResult.warnings);

  // Print results
  if (allWarnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    allWarnings.forEach((w) => console.log(`   - ${w}`));
  }

  if (allErrors.length > 0) {
    console.log("\n❌ Errors:");
    allErrors.forEach((e) => console.log(`   - ${e}`));
  } else {
    console.log("\n✅ All validations passed");
  }

  return {
    name: changeName,
    result: {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    },
  };
}

/**
 * Main validation function
 */
function main(): void {
  const args = process.argv.slice(2);
  const validateAll = args.includes("--all");
  const specificChange = args.find((arg) => !arg.startsWith("--"));

  console.log("🔍 OpenSpec Validation");
  console.log("=".repeat(50));

  let changesToValidate: string[] = [];

  if (specificChange) {
    changesToValidate = [specificChange];
  } else if (validateAll) {
    changesToValidate = findActiveChanges();
  } else {
    changesToValidate = findActiveChanges();
    if (changesToValidate.length === 0) {
      console.log("ℹ️  No active changes found");
      process.exit(0);
    }
  }

  if (changesToValidate.length === 0) {
    console.log("ℹ️  No changes to validate");
    process.exit(0);
  }

  const results: ChangeValidation[] = [];
  for (const change of changesToValidate) {
    results.push(validateChange(change));
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Validation Summary");
  console.log("=".repeat(50));

  const validCount = results.filter((r) => r.result.valid).length;
  const invalidCount = results.length - validCount;

  console.log(`\nTotal changes: ${results.length}`);
  console.log(`✅ Valid: ${validCount}`);
  console.log(`❌ Invalid: ${invalidCount}`);

  if (invalidCount > 0) {
    console.log("\n❌ Validation FAILED");
    process.exit(1);
  } else {
    console.log("\n✅ Validation PASSED");
    process.exit(0);
  }
}

main();
