package database

import "gorm.io/gorm"

// tableExists returns true when the named table is present in the public
// schema. Used to gate ALTER/UPDATE migrations on a fresh DB where
// AutoMigrate hasn't created tables yet.
func tableExists(db *gorm.DB, name string) bool {
	var n int64
	db.Raw("SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ?", name).Scan(&n)
	return n > 0
}

// RunMigrations runs explicit, idempotent SQL migrations for schema changes
// on existing tables. Called BEFORE AutoMigrate to ensure correct column
// defaults and backfills. See /ORM_RULES.md for rationale.
//
// Each block is gated on the underlying table actually existing so that
// first-boot deployments (where AutoMigrate creates the schema) don't
// produce a wall of "relation does not exist" errors in the log.
func RunMigrations(db *gorm.DB) {
	if tableExists(db, "exams") {
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

		// Fix any exams that were corrupted by the gorm:"default:true" migration
		// Exams with a start_time set were clearly published, not drafts
		db.Exec("UPDATE exams SET is_draft = false WHERE is_draft = true AND start_time IS NOT NULL")

		// --- exams.start_time backfill ---
		// Policy: every exam must have a start_time. Legacy rows without one
		// are backfilled to created_at so they're immediately startable.
		db.Exec("UPDATE exams SET start_time = created_at WHERE start_time IS NULL")

		// --- exams.reset_at ---
		// Marker used to invalidate cached student sessions/attempts when a
		// teacher destructively edits exam content.
		db.Exec("ALTER TABLE exams ADD COLUMN IF NOT EXISTS reset_at TIMESTAMPTZ")
		db.Exec("CREATE INDEX IF NOT EXISTS idx_exams_reset_at ON exams(reset_at)")

		// --- exams.reminder_sent_at for upcoming-exam reminder dedup ---
		db.Exec("ALTER TABLE exams ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ")

		// --- exams.email_reminder_1h_sent_at / email_reminder_start_sent_at ---
		db.Exec("ALTER TABLE exams ADD COLUMN IF NOT EXISTS email_reminder1h_sent_at TIMESTAMPTZ")
		db.Exec("ALTER TABLE exams ADD COLUMN IF NOT EXISTS email_reminder_start_sent_at TIMESTAMPTZ")
	}

	if tableExists(db, "problems") {
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

		// --- problems.exam_id nullable for bank problems ---
		db.Exec("ALTER TABLE problems ALTER COLUMN exam_id DROP NOT NULL")
		db.Exec("ALTER TABLE problems DROP CONSTRAINT IF EXISTS fk_exams_problems")

		// --- problems.tags ---
		db.Exec("ALTER TABLE problems ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'")
		db.Exec("UPDATE problems SET tags = '[]' WHERE tags IS NULL")

		// --- problems.class_id for bank question course grouping ---
		db.Exec("ALTER TABLE problems ADD COLUMN IF NOT EXISTS class_id BIGINT")
		db.Exec("CREATE INDEX IF NOT EXISTS idx_problems_class_id ON problems(class_id)")

		// --- problems.folder_id for independent bank question folder grouping ---
		db.Exec("ALTER TABLE problems ADD COLUMN IF NOT EXISTS folder_id BIGINT")
		db.Exec("CREATE INDEX IF NOT EXISTS idx_problems_folder_id ON problems(folder_id)")

		// --- problems.image_url ---
		db.Exec("ALTER TABLE problems ADD COLUMN IF NOT EXISTS image_url TEXT")
	}

	if tableExists(db, "classes") {
		// --- classes.grades_announced ---
		db.Exec("ALTER TABLE classes ADD COLUMN IF NOT EXISTS grades_announced BOOLEAN NOT NULL DEFAULT false")
		// --- classes.passing_threshold ---
		db.Exec("ALTER TABLE classes ADD COLUMN IF NOT EXISTS passing_threshold INTEGER NOT NULL DEFAULT 60")
		// --- classes.block_announce_with_pending ---
		db.Exec("ALTER TABLE classes ADD COLUMN IF NOT EXISTS block_announce_with_pending BOOLEAN NOT NULL DEFAULT true")
	}

	if tableExists(db, "user_profiles") {
		// --- user_profiles.notify_exam_email ---
		db.Exec("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notify_exam_email BOOLEAN NOT NULL DEFAULT false")

		// --- user_profiles.block_announce_with_pending ---
		db.Exec("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS block_announce_with_pending BOOLEAN NOT NULL DEFAULT true")
		db.Exec("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS default_exam_draft BOOLEAN NOT NULL DEFAULT true")
		db.Exec("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS default_passing_threshold INTEGER NOT NULL DEFAULT 60")

		// --- user_profiles.avatar_url widen to TEXT for base64 dataURLs ---
		db.Exec("ALTER TABLE user_profiles ALTER COLUMN avatar_url TYPE TEXT")
	}

	if tableExists(db, "exam_attempts") {
		// --- exam_attempts.graded_notified ---
		db.Exec("ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS graded_notified BOOLEAN NOT NULL DEFAULT false")
	}

	if tableExists(db, "test_cases") {
		// --- test_cases.points ---
		db.Exec("ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0")
	}

	if tableExists(db, "announcements") {
		// --- announcements.attachments ---
		db.Exec("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'")
		db.Exec("UPDATE announcements SET attachments = '[]' WHERE attachments IS NULL")
	}

	if tableExists(db, "users") {
		// --- users.google_id for Google OAuth account linking ---
		db.Exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(64)")
		db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL AND google_id <> ''")
	}

	if tableExists(db, "submissions") {
		// --- submissions.teacher_feedback ---
		db.Exec("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_feedback TEXT")
	}

	if tableExists(db, "exam_attempts") && tableExists(db, "problems") && tableExists(db, "submissions") {
		// --- exam_attempts.score backfill ---
		// Old attempts were aggregated using only existing Submission rows,
		// so skipped questions silently dropped out of the denominator and
		// a student who answered only easy questions could appear at 100%.
		// Re-aggregate over the exam's full problem list with skipped =
		// 0/total. Pending-review submissions still drop out of both
		// numerator and denominator until a teacher grades them.
		db.Exec(`
			UPDATE exam_attempts ea SET score = COALESCE((
				SELECT CASE WHEN SUM(pts) = 0 THEN 0
					ELSE SUM(earned) / SUM(pts) * 100.0 END
				FROM (
					SELECT
						COALESCE(NULLIF(p.points, 0), 10) AS pts,
						CASE WHEN s.id IS NULL THEN 0
							ELSE s.score / 100.0 * COALESCE(NULLIF(p.points, 0), 10) END AS earned,
						s.status AS status
					FROM problems p
					LEFT JOIN submissions s
						ON s.problem_id = p.id
						AND s.exam_attempt_id = ea.id
					WHERE p.exam_id = ea.exam_id
				) q
				WHERE q.status IS DISTINCT FROM 'pending_review'
				  AND (q.status IS NULL OR q.status NOT IN ('pending','running'))
			), 0)
			WHERE ea.status = 'submitted'`)
	}
}

// RunPostMigrations runs after AutoMigrate so it can reference tables
// GORM creates (e.g. folders) for FK constraints and data integrity sweeps.
func RunPostMigrations(db *gorm.DB) {
	// Sweep orphaned folder_id refs before enforcing FK.
	db.Exec("UPDATE problems SET folder_id = NULL WHERE folder_id IS NOT NULL AND folder_id NOT IN (SELECT id FROM folders)")
	db.Exec("ALTER TABLE problems DROP CONSTRAINT IF EXISTS fk_problems_folder")
	db.Exec("ALTER TABLE problems ADD CONSTRAINT fk_problems_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL")
}
