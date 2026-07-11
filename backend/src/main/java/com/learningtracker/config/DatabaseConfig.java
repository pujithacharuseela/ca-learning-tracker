package com.learningtracker.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url}")
    private String primaryUrl;

    @Value("${spring.datasource.username}")
    private String primaryUsername;

    @Value("${spring.datasource.password}")
    private String primaryPassword;

    @Value("${spring.datasource.driver-class-name}")
    private String primaryDriver;

    private static boolean useBackup = false;
    private static long lastCheck = 0;
    private static DataSource primaryDS;
    private static DataSource backupDS;
    private static Runnable syncCallback;

    public static void setSyncCallback(Runnable callback) {
        syncCallback = callback;
    }

    public static boolean isUseBackup() {
        return useBackup;
    }

    @Bean
    public DataSource primaryDataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(primaryUrl);
        config.setUsername(primaryUsername);
        config.setPassword(primaryPassword);
        config.setDriverClassName(primaryDriver);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(5000); // 5s timeout to failover quickly
        config.setValidationTimeout(2000);
        config.setPoolName("PrimaryPostgresPool");
        primaryDS = new HikariDataSource(config);
        return primaryDS;
    }

    @Bean
    public DataSource backupDataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:h2:file:./target/learningtracker_backup;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDER=HIGH");
        config.setUsername("sa");
        config.setPassword("");
        config.setDriverClassName("org.h2.Driver");
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(3000);
        config.setPoolName("BackupH2Pool");
        backupDS = new HikariDataSource(config);
        return backupDS;
    }

    @Bean
    @Primary
    public DataSource dataSource(DataSource primaryDataSource, DataSource backupDataSource) {
        DynamicRoutingDataSource routingDataSource = new DynamicRoutingDataSource();
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put("primary", primaryDataSource);
        targetDataSources.put("backup", backupDataSource);
        
        routingDataSource.setTargetDataSources(targetDataSources);
        routingDataSource.setDefaultTargetDataSource(primaryDataSource);
        return routingDataSource;
    }

    private static class DynamicRoutingDataSource extends AbstractRoutingDataSource {
        @Override
        protected Object determineCurrentLookupKey() {
            long now = System.currentTimeMillis();
            if (now - lastCheck > 10000) { // Check database connection every 10 seconds
                lastCheck = now;
                try (java.sql.Connection conn = primaryDS.getConnection()) {
                    if (useBackup) {
                        log.info("PRIMARY DATABASE (SUPABASE) RECOVERED! Failing back from backup...");
                        useBackup = false;
                        if (syncCallback != null) {
                            new Thread(syncCallback).start(); // Async recovery sync
                        }
                    }
                } catch (Exception e) {
                    if (!useBackup) {
                        log.error("PRIMARY DATABASE IS DOWN OR UNREACHABLE! Failing over to backup H2 database.", e);
                        useBackup = true;
                    }
                }
            }
            return useBackup ? "backup" : "primary";
        }
    }
}
