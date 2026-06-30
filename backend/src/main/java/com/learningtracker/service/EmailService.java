package com.learningtracker.service;

import com.learningtracker.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Async
    public void sendWelcomeEmail(User user) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("firstName", user.getFirstName());
        variables.put("frontendUrl", frontendUrl);

        sendHtmlEmail(user.getEmail(), "Welcome to Personal Learning Tracker!", "mail/welcome", variables);
    }

    @Async
    public void sendOtpEmail(User user, String otp) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("firstName", user.getFirstName());
        variables.put("otp", otp);

        sendHtmlEmail(user.getEmail(), "Your OTP Verification Code", "mail/otp", variables);
    }

    @Async
    public void sendPlanScheduledEmail(User user, String planName, String startDate, String endDate, String subjectName) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("firstName", user.getFirstName());
        variables.put("planName", planName);
        variables.put("startDate", startDate);
        variables.put("endDate", endDate);
        variables.put("subjectName", subjectName != null ? subjectName : "General Study");

        sendHtmlEmail(user.getEmail(), "Study Plan Scheduled Successfully!", "mail/plan_scheduled", variables);
    }

    @Async
    public void sendDeadlineReminderEmail(User user, String topic, String timeLeft, String duration) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("firstName", user.getFirstName());
        variables.put("topic", topic);
        variables.put("timeLeft", timeLeft);
        variables.put("duration", duration);

        sendHtmlEmail(user.getEmail(), "Study Session Reminder: " + topic, "mail/deadline_reminder", variables);
    }

    @Async
    public void sendStreakAlertEmail(User user, String alertType) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("firstName", user.getFirstName());
        variables.put("alertType", alertType);

        String title = "WARNING".equals(alertType) ? "Streak Warning: Keep your streak alive!" : "Streak Missed: Let's start fresh today!";
        sendHtmlEmail(user.getEmail(), title, "mail/streak_alert", variables);
    }

    private void sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process(templateName, context);

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("Email sent successfully to: {} with template: {}", to, templateName);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}, error: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending email to: {}, error: {}", to, e.getMessage(), e);
        }
    }
}
