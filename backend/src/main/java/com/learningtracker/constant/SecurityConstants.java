package com.learningtracker.constant;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Security-related constants including token configuration and public URL patterns.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class SecurityConstants {

    /** Bearer token prefix used in Authorization header. */
    public static final String TOKEN_PREFIX = "Bearer ";

    /** HTTP header name for authorization. */
    public static final String HEADER_STRING = "Authorization";

    /** URL patterns that do not require authentication. */
    public static final String[] PUBLIC_URLS = {
            "/api/auth/**",
            "/api/docs/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/actuator/health",
            "/actuator/info"
    };
}
