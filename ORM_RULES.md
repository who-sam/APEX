# ORM & Schema Change Rules

## The Incident
Adding `gorm:"default:true"` on `IsDraft` caused AutoMigrate to set ALL existing exam rows to `is_draft=true`. Student queries filter `WHERE is_draft = false`, so every exam disappeared. Silent data corruption.

---

## Rules — No Exceptions

### 1. Never use `gorm:"default:X"` on existing tables
GORM AutoMigrate only ADDs columns. It does not manage defaults safely on populated tables. Existing rows may get the default applied unexpectedly.

**Do this instead:**
```go
// Step 1: add column nullable
db.Exec("ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_draft BOOLEAN")
// Step 2: backfill existing rows with the CORRECT value
db.Exec("UPDATE exams SET is_draft = false WHERE is_draft IS NULL")
// Step 3: add constraints
db.Exec("ALTER TABLE exams ALTER COLUMN is_draft SET NOT NULL")
db.Exec("ALTER TABLE exams ALTER COLUMN is_draft SET DEFAULT false")
```

### 2. Audit every query when adding a filter column
When adding a column used as a filter (`is_draft`, `is_bank`, `is_active`), immediately grep every handler that queries that table.
- Student-facing: add `WHERE new_col = safe_value`
- Teacher-facing: decide explicitly — filter or show all
- Never assume existing queries are safe after schema change

### 3. Define zero-value behavior for every boolean
For every new boolean column, explicitly document:
- What does `false` mean? What does `true` mean?
- What should existing rows be set to?
- Which queries filter on it, which don't?

Current booleans:
| Column | `false` | `true` | Existing rows should be | Filtered in |
|--------|---------|--------|------------------------|-------------|
| `exams.is_draft` | Published | Draft (hidden from students) | `false` | student GetExams, student GetClass |
| `exams.is_practice` | Regular exam | Practice mode | `false` | (none — column unused, kept for schema compat) |
| `problems.is_bank` | Exam-bound question | Reusable bank question | `false` | teacher GetAllProblems (bank view) |

### 4. Test schema changes against existing data
After any migration that adds/modifies columns, run:
```sql
SELECT COUNT(*) FROM <table>;
SELECT COUNT(*) FROM <table> WHERE new_col = true;
SELECT COUNT(*) FROM <table> WHERE new_col = false;
SELECT COUNT(*) FROM <table> WHERE new_col IS NULL;
```
If counts look wrong, rollback before touching application code.

### 5. Write migrations as explicit SQL, not just AutoMigrate
AutoMigrate is fine for **new tables only**. For changes to existing tables, write explicit idempotent SQL in `internal/database/migrations.go` and call it BEFORE AutoMigrate.

```go
func RunMigrations(db *gorm.DB) {
    // Always idempotent — safe to run multiple times
    db.Exec("ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false")
}
```

### 6. GORM tag `default:X` is only for application-level INSERT defaults
Keep `gorm:"default:false"` in struct tags — it tells GORM what value to use on INSERT when the field is zero-valued. But never rely on it for DDL migration of existing data. The explicit SQL migration handles that.

---

## File Locations
- Migrations: `internal/database/migrations.go`
- Database init: `internal/database/database.go` (calls `RunMigrations` then `AutoMigrate`)
- Models: `internal/models/*.go`
