

## Feature-Module Architecture Cleanup

The project is already well-organized with feature folders under `src/features/`. A few items need to be relocated to fully commit to the pattern.

---

### What Needs to Change

**1. Split `src/types/exam.ts` into feature-specific type files**

This single file currently holds types for 4 different domains. Each set of types moves into the feature that owns it:

| Types | Move to |
|---|---|
| `QuestionType`, `Difficulty`, `BaseQuestion`, `MCQOption`, `MCQQuestion`, `WrittenQuestion`, `TestCase`, `CodingQuestion`, `Question`, `ExamSettings`, `Exam`, `StudentAnswer`, `ExamSubmission`, `ExamResult` | `src/features/exams/types/exam.ts` |
| `Achievement` | `src/features/settings/types/achievement.ts` |
| `AppNotification` | `src/features/social/types/notification.ts` |
| `LeaderboardEntry` | `src/features/results/types/leaderboard.ts` |

Delete `src/types/exam.ts` after migration. The `src/types/` folder can be removed if empty.

**2. Move `NotificationContext.tsx` into `src/features/social/contexts/`**

It is only consumed by social/notification pages and the navbar. It logically belongs to the social feature.

**3. Keep `RoleContext` and `UserContext` global**

These are true app-wide concerns used by 10+ files across all features — they stay in `src/contexts/`.

---

### Files Changed

- **Create** `src/features/exams/types/exam.ts` — move exam-related types
- **Create** `src/features/settings/types/achievement.ts` — move `Achievement`
- **Create** `src/features/social/types/notification.ts` — move `AppNotification`
- **Create** `src/features/results/types/leaderboard.ts` — move `LeaderboardEntry`
- **Delete** `src/types/exam.ts`
- **Move** `src/contexts/NotificationContext.tsx` → `src/features/social/contexts/NotificationContext.tsx`
- **Update imports** in ~16 files to point to new locations

### Import Updates Summary

| File | Old Import | New Import |
|---|---|---|
| All exam feature files (8 files) | `@/types/exam` | `@/features/exams/types/exam` |
| `Profile.tsx` | `Achievement` from `@/types/exam` | `@/features/settings/types/achievement` |
| `Leaderboard.tsx` | `LeaderboardEntry` from `@/types/exam` | `@/features/results/types/leaderboard` |
| `NotificationContext.tsx` | `AppNotification` from `@/types/exam` | `@/features/social/types/notification` |
| `Notifications.tsx`, `FloatingNavbar.tsx`, `App.tsx` | `@/contexts/NotificationContext` | `@/features/social/contexts/NotificationContext` |

No logic changes — purely organizational.

