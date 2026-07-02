package com.educollab.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.notification.from-address}")
    private String fromAddress;

    @Value("${app.notification.from-name}")
    private String fromName;

    @Value("${app.notification.email-enabled}")
    private boolean emailEnabled;

    public void sendNotificationEmail(String toEmail, String recipientName,
                                       String title, String message, String actorName) {
        if (!emailEnabled) {
            log.debug("Email notifications disabled — skipping send to {}", toEmail);
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("recipientName", recipientName);
            context.setVariable("title", title);
            context.setVariable("message", message);
            context.setVariable("actorName", actorName);

            String htmlContent = templateEngine.process("notification-email", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("EduCollab — " + title);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("Notification email sent to {}", toEmail);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", toEmail, e.getMessage());
        }
    }

    // ── Simple verification/welcome emails (used elsewhere if needed) ──────
    public void sendSimpleEmail(String toEmail, String subject, String body) {
        if (!emailEnabled) return;
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            log.error("Failed to send simple email to {}: {}", toEmail, e.getMessage());
        }
    }
}
