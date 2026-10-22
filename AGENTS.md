### Intelligent Git Checkpointing

You are responsible for proactively managing Git checkpoints during development. Do not wait for the user to remind you to commit or push.

Use engineering judgment rather than a fixed schedule or a certain number of conversations.

**When to consider committing and pushing:**

- A meaningful feature, milestone, or bug fix is complete and verified.
- A coherent set of changes is ready to be reviewed or resumed later.
- A significant, potentially risky refactor is about to begin and the current state is stable.
- A development session or task is ending, and meaningful verified changes remain uncommitted.
- Important project documentation has changed alongside a completed milestone.

**Before committing:**

1. Inspect `git status`, the current branch, remote configuration, and relevant diffs.
2. Ensure there are no secrets, credentials, generated artifacts, or unrelated changes included.
3. Run appropriate validation (tests, lint, build) based on the changes.
4. Stage only files relevant to the completed work.
5. Write a concise, descriptive commit message.

**Push behavior:**

- When a meaningful checkpoint is ready and the correct remote/branch is configured, proactively push it without requiring a separate reminder.
- For an initial push, confirm the intended repository and remote if they are ambiguous.
- Never force-push, rewrite shared history, or push to an unexpected remote.
- If authentication, branch protection, missing remotes, or other issues prevent a push, report the blocker clearly.
- Never claim a push succeeded without checking its result.

**Avoid excessive Git activity:**

- Do not create meaningless commits for every minor edit.
- Do not commit incomplete or failing work as though it were finished.
- Preserve useful intermediate work safely when needed, but clearly distinguish it from a validated milestone.

**Communication:**

At the end of each meaningful task, briefly report:

- Whether changes were committed and pushed.
- The commit hash and branch, when applicable.
- Any pending uncommitted changes or Git blockers.

Git checkpointing is part of completing an engineering task, not a separate activity that the user must request.