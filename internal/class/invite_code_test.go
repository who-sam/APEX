package class

import (
	"strings"
	"testing"
)

// ambiguousChars are the visually confusable characters that must NEVER appear
// in an invite code, because students would mistype them when joining a class.
const ambiguousChars = "IO01"

func TestGenerateInviteCodeLength(t *testing.T) {
	for range 100 {
		code := generateInviteCode()
		if len(code) != 8 {
			t.Fatalf("generateInviteCode() = %q, length = %d, want 8", code, len(code))
		}
	}
}

func TestGenerateInviteCodeAlphabet(t *testing.T) {
	for range 1000 {
		code := generateInviteCode()
		for pos, c := range code {
			if !strings.ContainsRune(inviteCodeChars, c) {
				t.Fatalf("generateInviteCode() = %q, char %q at pos %d not in alphabet %q",
					code, c, pos, inviteCodeChars)
			}
		}
	}
}

func TestGenerateInviteCodeNoAmbiguousChars(t *testing.T) {
	// Guard the alphabet constant itself: a future edit that adds I/O/0/1
	// back into inviteCodeChars must break this test.
	for _, c := range ambiguousChars {
		if strings.ContainsRune(inviteCodeChars, c) {
			t.Fatalf("inviteCodeChars %q must not contain ambiguous char %q",
				inviteCodeChars, c)
		}
	}

	// Guard generated output: no produced code may contain an ambiguous char.
	for range 1000 {
		code := generateInviteCode()
		if idx := strings.IndexAny(code, ambiguousChars); idx >= 0 {
			t.Fatalf("generateInviteCode() = %q contains ambiguous char %q at pos %d",
				code, code[idx], idx)
		}
	}
}

func TestGenerateInviteCodeDistribution(t *testing.T) {
	const iterations = 2000

	seen := make(map[byte]bool)
	distinctCodes := make(map[string]bool)

	for range iterations {
		code := generateInviteCode()
		distinctCodes[code] = true
		for j := 0; j < len(code); j++ {
			seen[code[j]] = true
		}
	}

	// Not all codes identical: catches a stuck-index / non-random bug.
	if len(distinctCodes) < 2 {
		t.Fatalf("over %d generations only %d distinct code(s) produced; generator appears stuck",
			iterations, len(distinctCodes))
	}

	// Full alphabet coverage: with 2000*8 = 16000 draws over a 32-char
	// alphabet, every character should appear. A missing character signals an
	// off-by-one / truncated-range bug (e.g. never hitting the last index).
	if len(seen) != len(inviteCodeChars) {
		var missing []string
		for _, c := range inviteCodeChars {
			if !seen[byte(c)] {
				missing = append(missing, string(c))
			}
		}
		t.Fatalf("expected all %d alphabet chars to appear over %d generations, saw %d; missing: %v",
			len(inviteCodeChars), iterations, len(seen), missing)
	}
}
