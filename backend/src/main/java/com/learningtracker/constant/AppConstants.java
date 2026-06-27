package com.learningtracker.constant;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Application-wide constants for pagination, OTP configuration, and general settings.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class AppConstants {

    /** Default number of items per page for paginated queries. */
    public static final int DEFAULT_PAGE_SIZE = 20;

    /** Maximum allowed page size to prevent excessive data retrieval. */
    public static final int MAX_PAGE_SIZE = 100;

    /** Length of OTP codes generated for email verification and password reset. */
    public static final int OTP_LENGTH = 6;

    /** Number of minutes before an OTP code expires. */
    public static final int OTP_EXPIRY_MINUTES = 10;
}
