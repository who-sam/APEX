package database

import "gorm.io/gorm"

// RunMigrations runs explicit, idempotent SQL migrations for schema changes
// on existing tables. Called BEFORE AutoMigrate to ensure correct column
// defaults and backfills. See /ORM_RULES.md for rationale.
func RunMigrations(db *gorm.DB) {
	// --- exams.is_draft ---
	// Added in Phase D. Existing exams are published (is_draft=false).
	// New exams created via ExamBuilder default to draft in application code.
	db.Exec("ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_draft BOOLEAN")
	db.Exec("UPDATE exams SET is_draft = false WHERE is_draft IS NULL")
	db.Exec("ALTER TABLE exams ALTER COLUMN is_draft SET NOT NULL")
	db.Exec("ALTER TABLE exams ALTER COLUMN is_draft SET DEFAULT false")

	// --- exams.is_practice ---
	db.Exec("ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_practice BOOLEAN")
	db.Exec("UPDATE exams SET is_practice = false WHERE is_practice IS NULL")
	db.Exec("ALTER TABLE exams ALTER COLUMN is_practice SET NOT NULL")
	db.Exec("ALTER TABLE exams ALTER COLUMN is_practice SET DEFAULT false")

	// --- exams.shuffle_questions ---
	db.Exec("ALTER TABLE exams ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN")
	db.Exec("UPDATE exams SET shuffle_questions = false WHERE shuffle_questions IS NULL")
	db.Exec("ALTER TABLE exams ALTER COLUMN shuffle_questions SET NOT NULL")
	db.Exec("ALTER TABLE exams ALTER COLUMN shuffle_questions SET DEFAULT false")

	// --- exams.show_results_after ---
	db.Exec("ALTER TABLE exams ADD COLUMN IF NOT EXISTS show_results_after BOOLEAN")
	db.Exec("UPDATE exams SET show_results_after = true WHERE show_results_after IS NULL")
	db.Exec("ALTER TABLE exams ALTER COLUMN show_results_after SET NOT NULL")
	db.Exec("ALTER TABLE exams ALTER COLUMN show_results_after SET DEFAULT true")

	// --- problems.is_bank ---
	// Added in Phase D. Existing problems belong to exams (is_bank=false).
	// Only problems explicitly saved to bank get is_bank=true.
	db.Exec("ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_bank BOOLEAN")
	db.Exec("UPDATE problems SET is_bank = false WHERE is_bank IS NULL")
	db.Exec("ALTER TABLE problems ALTER COLUMN is_bank SET NOT NULL")
	db.Exec("ALTER TABLE problems ALTER COLUMN is_bank SET DEFAULT false")

	// --- problems.teacher_id ---
	db.Exec("ALTER TABLE problems ADD COLUMN IF NOT EXISTS teacher_id BIGINT")
	db.Exec("UPDATE problems SET teacher_id = 0 WHERE teacher_id IS NULL")

	// --- classes.grades_announced ---
	db.Exec("ALTER TABLE classes ADD COLUMN IF NOT EXISTS grades_announced BOOLEAN NOT NULL DEFAULT false")
	// --- classes.passing_threshold ---
	db.Exec("ALTER TABLE classes ADD COLUMN IF NOT EXISTS passing_threshold INTEGER NOT NULL DEFAULT 60")

	// --- problems.exam_id nullable for bank problems ---
	db.Exec("ALTER TABLE problems ALTER COLUMN exam_id DROP NOT NULL")
	db.Exec("ALTER TABLE problems DROP CONSTRAINT IF EXISTS fk_exams_problems")

	// --- problems.tags ---
	db.Exec("ALTER TABLE problems ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'")
	db.Exec("UPDATE problems SET tags = '[]' WHERE tags IS NULL")

	// Fix any exams that were corrupted by the gorm:"default:true" migration
	// Exams with a start_time set were clearly published, not drafts
	db.Exec("UPDATE exams SET is_draft = false WHERE is_draft = true AND start_time IS NOT NULL")

	// --- problems.class_id for bank question course grouping ---
	db.Exec("ALTER TABLE problems ADD COLUMN IF NOT EXISTS class_id BIGINT")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_problems_class_id ON problems(class_id)")

	// --- problems.folder_id for independent bank question folder grouping ---
	db.Exec("ALTER TABLE problems ADD COLUMN IF NOT EXISTS folder_id BIGINT")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_problems_folder_id ON problems(folder_id)")

	// --- exams.start_time backfill ---
	// Policy: every exam must have a start_time. Legacy rows without one
	// are backfilled to created_at so they're immediately startable.
	db.Exec("UPDATE exams SET start_time = created_at WHERE start_time IS NULL")

	// --- exams.reset_at ---
	// Marker used to invalidate cached student sessions/attempts when a
	// teacher destructively edits exam content.
	db.Exec("ALTER TABLE exams ADD COLUMN IF NOT EXISTS reset_at TIMESTAMPTZ")
	db.Exec("CREATE INDEX IF NOT EXISTS idx_exams_reset_at ON exams(reset_at)")

	// --- exam_attempts.score backfill ---
	// Old attempts were aggregated including pending_review submissions
	// (score=0 placeholder), pulling the total below 100% when every
	// auto-graded submission passed. Re-aggregate excluding those rows.
	db.Exec(`
		UPDATE exam_attempts ea SET score = COALESCE((
			SELECT CASE WHEN SUM(COALESCE(NULLIF(p.points, 0), 10)) = 0 THEN 0
				ELSE SUM(s.score / 100.0 * COALESCE(NULLIF(p.points, 0), 10))
					/ SUM(COALESCE(NULLIF(p.points, 0), 10)) * 100.0 END
			FROM submissions s
			JOIN problems p ON p.id = s.problem_id
			WHERE s.exam_attempt_id = ea.id
			  AND s.status <> 'pending_review'
			  AND s.status NOT IN ('pending','running')
		), 0)
		WHERE ea.status = 'submitted'`)
}

// RunPostMigrations runs after AutoMigrate so it can reference tables
// GORM creates (e.g. folders) for FK constraints and data integrity sweeps.
func RunPostMigrations(db *gorm.DB) {
	// Sweep orphaned folder_id refs before enforcing FK.
	db.Exec("UPDATE problems SET folder_id = NULL WHERE folder_id IS NOT NULL AND folder_id NOT IN (SELECT id FROM folders)")
	db.Exec("ALTER TABLE problems DROP CONSTRAINT IF EXISTS fk_problems_folder")
	db.Exec("ALTER TABLE problems ADD CONSTRAINT fk_problems_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL")
}
