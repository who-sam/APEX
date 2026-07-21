package judge0

import "testing"

func TestNormalizeOutput(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want string
	}{
		{"crlf becomes lf", "a\r\nb", "a\nb"},
		{"crlf equals lf", "a\r\nb", normalizeOutput("a\nb")},
		{"bare cr becomes lf", "a\rb", "a\nb"},
		{"trailing spaces and tabs stripped per line", "hi   \nyo\t", "hi\nyo"},
		{"leading and trailing blank lines trimmed", "\n\nhello\n\n", "hello"},
		{"surrounding whitespace trimmed", "   \n  hello  \n   ", "hello"},
		{"internal blank line preserved", "a\n\nb", "a\n\nb"},
		{"multiple internal blank lines preserved", "a\n\n\nb", "a\n\n\nb"},
		{"empty string", "", ""},
		{"whitespace only", "   \t  \n\t \n", ""},
		{"trailing newline dropped", "line\n", "line"},
		{"mixed crlf with trailing whitespace", "foo  \r\nbar\t\r\n", "foo\nbar"},
		{"no trailing newline unchanged", "single", "single"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := normalizeOutput(tt.in); got != tt.want {
				t.Errorf("normalizeOutput(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}

func TestNormalizeOutputIdempotent(t *testing.T) {
	inputs := []string{
		"a\r\nb",
		"  hi   \nyo\t  ",
		"a\n\nb",
		"",
		"   \t  \n\t \n",
		"foo  \r\nbar\t\r\n",
	}
	for _, in := range inputs {
		once := normalizeOutput(in)
		twice := normalizeOutput(once)
		if once != twice {
			t.Errorf("normalizeOutput not idempotent for %q: once=%q twice=%q", in, once, twice)
		}
	}
}

func TestDeref(t *testing.T) {
	empty := ""
	val := "x"
	tests := []struct {
		name string
		in   *string
		want string
	}{
		{"nil pointer", nil, ""},
		{"pointer to empty", &empty, ""},
		{"pointer to value", &val, "x"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := deref(tt.in); got != tt.want {
				t.Errorf("deref(%v) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}
