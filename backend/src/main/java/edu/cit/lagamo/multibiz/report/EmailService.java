package edu.cit.lagamo.multibiz.report;

import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private final JavaMailSender javaMailSender;
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    public EmailService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String firstName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Welcome to MultiBiz! \uD83D\uDE80");
            message.setText("Hello " + firstName + ",\n\n"
                    + "Welcome to MultiBiz! Your account has been successfully created. You can now log in to access your financial dashboard and start managing your operations.\n\n"
                    + "If you did not create this account, please ignore this email.\n\n"
                    + "Best regards,\n"
                    + "The MultiBiz System");

            javaMailSender.send(message);
            logger.info("Welcome email successfully dispatched to: {}", toEmail);
        } catch (Exception e) {
            e.printStackTrace(); // For Debugging
            logger.error("Failed to send welcome email to: {}", toEmail, e);
        }
    }

    @Async
    public void sendStaffAssignmentNotification(String toEmail, String staffName, String businessName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("System Alert: New Business Assignment \uD83C\uDFE2"); // 🏢
            message.setText("Hello " + staffName + ",\n\n"
                    + "You have a new system notification.\n\n"
                    + "You have just been assigned as STAFF to the business: " + businessName + ".\n\n"
                    + "Please log in to your MultiBiz dashboard to view this business, log income, and manage daily transactions.\n\n"
                    + "Best regards,\n"
                    + "The MultiBiz System");

            javaMailSender.send(message);
            logger.info("Staff assignment notification email successfully dispatched to: {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send staff assignment notification to: {}", toEmail, e);
        }
    }

    /**
     * Sends an email with a CSV file attached.
     */
    public void sendEmailWithCsvAttachment(String toEmail, String subject, String body,
                                           String csvContent, String filename) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body);

            byte[] csvBytes = csvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            helper.addAttachment(filename, new ByteArrayResource(csvBytes), "text/csv");

            javaMailSender.send(mimeMessage);
            logger.info("CSV report email successfully dispatched to: {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send CSV report email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send report email: " + e.getMessage(), e);
        }
    }
}
