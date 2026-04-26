package email

import (
	"apex/internal/config"
	"fmt"
	"log"
	"net/smtp"
	"strings"
)

var cfg config.Config

func Init(c config.Config) {
	cfg = c
}

// Send delivers a plaintext+HTML email. If SMTP is not configured, it logs
// the message instead so dev environments still function.
func Send(to, subject, htmlBody, textBody string) error {
	if cfg.SMTPHost == "" {
		log.Printf("[email:dev] to=%s subject=%q\n%s\n", to, subject, textBody)
		return nil
	}

	from := cfg.SMTPFrom
	if from == "" {
		from = cfg.SMTPUser
	}

	headers := map[string]string{
		"From":         from,
		"To":           to,
		"Subject":      subject,
		"MIME-Version": "1.0",
		"Content-Type": `multipart/alternative; boundary="apex-boundary"`,
	}
	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")
	msg.WriteString("--apex-boundary\r\n")
	msg.WriteString("Content-Type: text/plain; charset=\"utf-8\"\r\n\r\n")
	msg.WriteString(textBody + "\r\n")
	msg.WriteString("--apex-boundary\r\n")
	msg.WriteString("Content-Type: text/html; charset=\"utf-8\"\r\n\r\n")
	msg.WriteString(htmlBody + "\r\n")
	msg.WriteString("--apex-boundary--\r\n")

	addr := cfg.SMTPHost + ":" + cfg.SMTPPort
	auth := smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPHost)
	return smtp.SendMail(addr, auth, from, []string{to}, []byte(msg.String()))
}
