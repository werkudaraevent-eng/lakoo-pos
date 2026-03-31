# Parallel Agent Traceability Design

**Date:** 2026-03-31

**Goal**

Add durable traceability for parallel agent work by introducing per-batch QA reports under `docs/qa/` and converting the project into a git repository that can support branch and worktree isolation in future batches.

**Scope**

- Create a documented reporting location for agent ownership, review outcomes, and verification status.
- Initialize git for the current project.
- Reserve `.worktrees/` as the project-local worktree root and ensure it is ignored.
- Capture the completed `Login + Checkout` batch in a QA report.

**Out of Scope**

- Rewriting existing feature specs or plans.
- Moving prior agent work into separate historical branches.
- Automating report generation.
- Fixing new QA findings in Checkout as part of this change.

**Approach**

Use the smallest workflow upgrade that unlocks better future parallel execution:

1. Add a batch QA report format in `docs/qa/`.
2. Record the already-completed `Login + Checkout` batch as the first report.
3. Initialize git and create an initial baseline commit.
4. Add `.worktrees/` to `.gitignore` so future isolated agent worktrees cannot pollute repository status.

**Reporting Model**

Each batch report should capture:

- Batch name and date
- Coordinator summary
- Worker agents and owned files
- Reviewer agents and findings
- Verification evidence
- Open risks and follow-up tasks

This keeps historical context in the repo even when agents share one workspace.

**Git Workflow**

- Default branch: `main`
- Worktree root: `.worktrees/`
- Future agent branches should use the `codex/` prefix by default
- Coordinator remains responsible for integrating and reviewing worker output

**Success Criteria**

- `docs/qa/` exists and contains a report for the first parallel batch
- `.gitignore` ignores `.worktrees/`
- `git init` succeeds and repository has a usable initial commit
- `git status --short` is clean after commit
