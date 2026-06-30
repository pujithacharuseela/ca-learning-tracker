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

    @Value("${app.brevo.api-key:}")
    private String brevoApiKey;

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
            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process(templateName, context);

            // Use SMTP as primary, fall back to Brevo if BREVO_API_KEY is configured and SMTP fails
            String apiKey = System.getenv("BREVO_API_KEY");
            if (apiKey == null || apiKey.trim().isEmpty()) {
                apiKey = brevoApiKey;
            }

            if (apiKey != null && !apiKey.trim().isEmpty()) {
                try {
                    log.info("Attempting primary email delivery via SMTP...");
                    sendViaSmtp(to, subject, htmlContent);
                } catch (Exception e) {
                    log.warn("SMTP email delivery failed, falling back to Brevo. Error: {}", e.getMessage());
                    sendViaBrevo(to, subject, htmlContent, apiKey);
                }
            } else {
                sendViaSmtp(to, subject, htmlContent);
            }
        } catch (Exception e) {
            log.error("Unexpected error preparing email to: {}, error: {}", to, e.getMessage(), e);
        }
    }

    private void sendViaBrevo(String to, String subject, String htmlContent, String apiKey) throws Exception {
        java.net.URL url = new java.net.URL("https://api.brevo.com/v3/smtp/email");
        java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("api-key", apiKey);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Accept", "application/json");
        conn.setDoOutput(true);

        String jsonPayload = String.format(
            "{\"sender\":{\"name\":\"Learning Tracker\",\"email\":\"%s\"}," +
            "\"to\":[{\"email\":\"%s\"}]," +
            "\"subject\":\"%s\"," +
            "\"htmlContent\":\"%s\"}",
            fromEmail, to, escapeJson(subject), escapeJson(htmlContent)
        );

        try (java.io.OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonPayload.getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        int responseCode = conn.getResponseCode();
        if (responseCode >= 200 && responseCode < 300) {
            log.info("Email sent successfully via Brevo HTTP API to: {}", to);
        } else {
            try (java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getErrorStream(), "utf-8"))) {
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                log.error("Failed to send email via Brevo HTTP API. Response Code: {}, Response: {}", responseCode, response.toString());
            }
        }
    }

    private void sendViaSmtp(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        mailSender.send(mimeMessage);
        log.info("Email sent successfully via SMTP fallback to: {}", to);
    }

    private String escapeJson(String input) {
        if (input == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < input.length(); i++) {
            char ch = input.charAt(i);
            switch (ch) {
                case '"':
                    sb.append("\\\"");
                    break;
                case '\\':
                    sb.append("\\\\");
                    break;
                case '\b':
                    sb.append("\\b");
                    break;
                case '\f':
                    sb.append("\\f");
                    break;
                case '\n':
                    sb.append("\\n");
                    break;
                case '\r':
                    sb.append("\\r");
                    break;
                case '\t':
                    sb.append("\\t");
                    break;
                default:
                    if (ch < ' ') {
                        String t = "000" + Integer.toHexString(ch);
                        sb.append("\\u" + t.substring(t.length() - 4));
                    } else {
                        sb.append(ch);
                    }
            }
        }
        return sb.toString();
    }
}
