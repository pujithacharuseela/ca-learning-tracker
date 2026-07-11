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

}
