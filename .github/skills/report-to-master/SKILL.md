---
name: report-to-master
description: Reports progress back to the master repository (octocat-supply-platform). Use this when creating PRs for issues that reference octocat-supply-platform, or when completing tasks spawned from the master repo.
---

# Report to Master Repository

When working on issues that were spawned from `octocat-supply-platform`, follow this process to maintain traceability:

## Detecting Master Issue Reference

Look for issue titles or bodies containing:
- `[octocat-supply-platform#<NUMBER>]`
- `your-org/octocat-supply-platform#<NUMBER>`
- `Spawned from octocat-supply-platform`

Extract the master issue number from these references.

## Creating PRs with Proper Linking

When creating a PR, use this title format:
```
[octocat-supply-platform#<ISSUE_NUMBER>] <Descriptive title>
```

In the PR body, include:
```markdown
## Related Issues
- Master: your-org/octocat-supply-platform#<ISSUE_NUMBER>
- This repo: #<LOCAL_ISSUE_NUMBER>

## Changes
<Description of changes — Express routes, repository classes, migrations, Swagger docs, etc.>

## Cross-Repo Dependencies
- Depends on: <list any cross-repo PRs this depends on>
- Required by: <list any PRs in octocat-supply-web that depend on this>
```

## Notifying Master Repository

After creating the PR, use the `add_issue_comment` tool to comment on the master issue:

```markdown
## 🔗 PR Created in octocat-supply-api

**PR:** your-org/octocat-supply-api#<PR_NUMBER>
**Status:** Ready for review
**CI:** Pending

### Summary
<Brief description of API / backend changes>

### Integration Notes
<Any notes about new endpoints, migration requirements, or shared type dependencies>
```

## On PR Merge

When your PR is merged, update the master issue:

```markdown
## ✅ PR Merged in octocat-supply-api

**PR:** your-org/octocat-supply-api#<PR_NUMBER> has been merged.

API component is now complete for this feature.
```
