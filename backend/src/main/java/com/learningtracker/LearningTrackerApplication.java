package com.learningtracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the Personal Learning Tracker application.
 * Enables JPA auditing for automatic timestamp management,
 * scheduling for reminder and notification tasks,
 * and async processing for email delivery.
 */
@SpringBootApplication
@EnableScheduling
@EnableJpaAuditing
@EnableAsync
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class LearningTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(LearningTrackerApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.boot.ApplicationRunner initDatabase(org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("UPDATE learning_classes SET is_active = true WHERE is_active IS NULL OR is_active = false");
                System.out.println("Database startup initialization: Set all learning classes active successfully!");
            } catch (Exception e) {
                System.err.println("Database startup initialization skipped: " + e.getMessage());
            }
        };
    }
}
