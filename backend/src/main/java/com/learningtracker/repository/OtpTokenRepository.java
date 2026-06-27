package com.learningtracker.repository;

import com.learningtracker.constant.enums.OtpPurpose;
import com.learningtracker.entity.OtpToken;
import com.learningtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link OtpToken} entity operations.
 */
@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, UUID> {

    /**
     * Finds all unused OTP tokens for a user and purpose, ordered by most recent first.
     *
     * @param user    the user entity
     * @param purpose the OTP purpose
     * @return list of unused OTP tokens
     */
    List<OtpToken> findByUserAndPurposeAndUsedFalseOrderByCreatedAtDesc(User user, OtpPurpose purpose);

    /**
     * Deletes all OTP tokens that have expired before the given timestamp.
     *
     * @param now the current timestamp
     * @return the number of deleted records
     */
    @Modifying
    @Query("DELETE FROM OtpToken o WHERE o.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
}
