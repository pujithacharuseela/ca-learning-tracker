package com.learningtracker.service;

import com.learningtracker.config.DatabaseConfig;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DatabaseSyncService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSyncService.class);

    private final JdbcTemplate primaryJdbcTemplate;
    private final JdbcTemplate backupJdbcTemplate;

    private static final String[] TABLES = {
        "users",
        "user_settings",
        "subjects",
        "uploaded_files",
        "learning_classes",
        "learning_plans",
        "schedules",
        "study_sessions",
        "notes",
        "badges",
        "user_achievements",
        "notifications"
    };

    public DatabaseSyncService(
            @Qualifier("primaryDataSource") DataSource primaryDS,
            @Qualifier("backupDataSource") DataSource backupDS) {
        this.primaryJdbcTemplate = new JdbcTemplate(primaryDS);
        this.backupJdbcTemplate = new JdbcTemplate(backupDS);
    }

    @PostConstruct
    public void init() {
        // Register recovery callback
        DatabaseConfig.setSyncCallback(this::syncBackupToPrimary);
    }

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void onApplicationReady() {
        // Initial setup/sync H2 tables after Hibernate schema generation is complete
        try {
            initializeH2Schema();
            syncPrimaryToBackup();
        } catch (Exception e) {
            log.error("Failed to run initial startup sync", e);
        }
    }

    private void initializeH2Schema() {
        log.info("Checking and initializing H2 backup schema...");
        try {
            // Verify if a table exists, if not run DDL updates
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY, email VARCHAR, first_name VARCHAR, last_name VARCHAR, password VARCHAR, role VARCHAR, email_verified BOOLEAN, verification_otp VARCHAR, otp_expiry TIMESTAMP, profile_picture VARCHAR, created_at TIMESTAMP, updated_at TIMESTAMP)");
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS user_settings (id UUID PRIMARY KEY, user_id UUID, timezone VARCHAR, reminder_time VARCHAR, theme VARCHAR, email_notifications BOOLEAN, daily_reminder BOOLEAN, weekly_summary BOOLEAN, achievement_alerts BOOLEAN, created_at TIMESTAMP, updated_at TIMESTAMP)");
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS subjects (id UUID PRIMARY KEY, user_id UUID, name VARCHAR, color VARCHAR, total_hours INTEGER, created_at TIMESTAMP, updated_at TIMESTAMP)");
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS uploaded_files (id UUID PRIMARY KEY, user_id UUID, file_name VARCHAR, file_size BIGINT, record_count INTEGER, status VARCHAR, error_message VARCHAR, created_at TIMESTAMP, updated_at TIMESTAMP)");
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS learning_classes (id UUID PRIMARY KEY, user_id UUID, uploaded_file_id UUID, subject_id UUID, class_no INTEGER, topic VARCHAR, duration_minutes INTEGER, duration_display VARCHAR, is_active BOOLEAN, created_at TIMESTAMP, updated_at TIMESTAMP)");
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS learning_plans (id UUID PRIMARY KEY, user_id UUID, subject_id UUID, name VARCHAR, description VARCHAR, start_date DATE, end_date DATE, status VARCHAR, created_at TIMESTAMP, updated_at TIMESTAMP)");
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS schedules (id UUID PRIMARY KEY, user_id UUID, plan_id UUID, learning_class_id UUID, scheduled_date DATE, status VARCHAR, completed_at TIMESTAMP, sort_order INTEGER, created_at TIMESTAMP, updated_at TIMESTAMP)");
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS study_sessions (id UUID PRIMARY KEY, user_id UUID, schedule_id UUID, status VARCHAR, actual_duration_minutes INTEGER, difficulty_rating INTEGER, overall_rating INTEGER, started_at TIMESTAMP, completed_at TIMESTAMP, created_at TIMESTAMP, updated_at TIMESTAMP)");
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS notes (id UUID PRIMARY KEY, session_id UUID, content VARCHAR, created_at TIMESTAMP, updated_at TIMESTAMP)");
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS badges (id UUID PRIMARY KEY, name VARCHAR, display_name VARCHAR, description VARCHAR, icon VARCHAR, category VARCHAR, criteria_type VARCHAR, criteria_value INTEGER, created_at TIMESTAMP, updated_at TIMESTAMP)");
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS user_achievements (id UUID PRIMARY KEY, user_id UUID, badge_id UUID, earned_at TIMESTAMP, created_at TIMESTAMP, updated_at TIMESTAMP)");
            backupJdbcTemplate.execute("CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY, user_id UUID, title VARCHAR, message VARCHAR, type VARCHAR, is_read BOOLEAN, is_cleared BOOLEAN, entity_id VARCHAR, created_at TIMESTAMP, updated_at TIMESTAMP)");
            log.info("H2 backup schema verification completed successfully.");
        } catch (Exception e) {
            log.error("Failed to initialize H2 backup schema: " + e.getMessage());
        }
    }

    @Scheduled(cron = "0 */10 * * * *") // Run every 10 minutes
    public void scheduledSync() {
        if (!DatabaseConfig.isUseBackup()) {
            syncPrimaryToBackup();
        }
    }

    public synchronized void syncPrimaryToBackup() {
        log.info("Starting synchronization: Primary (Supabase) -> Backup (H2)...");
        try {
            backupJdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
            for (String table : TABLES) {
                syncTable(table, primaryJdbcTemplate, backupJdbcTemplate);
            }
            backupJdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
            log.info("Synchronization Primary -> Backup complete successfully.");
        } catch (Exception e) {
            log.error("Error during synchronization: " + e.getMessage(), e);
        }
    }

    public synchronized void syncBackupToPrimary() {
        log.info("Starting recovery synchronization: Backup (H2) -> Primary (Supabase)...");
        try {
            primaryJdbcTemplate.execute("SET CONSTRAINTS ALL DEFERRED"); // If supported
            for (String table : TABLES) {
                syncTable(table, backupJdbcTemplate, primaryJdbcTemplate);
            }
            log.info("Recovery synchronization complete! Supabase primary is up to date.");
        } catch (Exception e) {
            log.error("Error during recovery synchronization: " + e.getMessage(), e);
        }
    }

    private void syncTable(String tableName, JdbcTemplate source, JdbcTemplate dest) {
        try {
            List<Map<String, Object>> rows = source.queryForList("SELECT * FROM " + tableName);
            if (rows.isEmpty()) {
                dest.execute("DELETE FROM " + tableName);
                return;
            }

            dest.execute("DELETE FROM " + tableName); // Fresh truncate replica

            for (Map<String, Object> row : rows) {
                StringBuilder columns = new StringBuilder();
                StringBuilder placeholders = new StringBuilder();
                List<Object> values = new ArrayList<>();

                for (Map.Entry<String, Object> entry : row.entrySet()) {
                    if (columns.length() > 0) {
                        columns.append(", ");
                        placeholders.append(", ");
                    }
                    columns.append(entry.getKey());
                    placeholders.append("?");
                    values.add(entry.getValue());
                }

                String sql = "INSERT INTO " + tableName + " (" + columns + ") VALUES (" + placeholders + ")";
                dest.update(sql, values.toArray());
            }
        } catch (Exception e) {
            log.warn("Table sync failed on table " + tableName + ": " + e.getMessage());
        }
    }
}
