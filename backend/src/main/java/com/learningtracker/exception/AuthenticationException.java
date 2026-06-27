package com.learningtracker.exception;

/**
 * Custom authentication exception for the application layer.
 * Distinct from Spring Security's AuthenticationException to allow
 * use in non-security contexts (e.g., OTP validation).
 */
public class AuthenticationException extends RuntimeException {

    /**
     * Creates a new AuthenticationException.
     *
     * @param message description of the authentication failure
     */
    public AuthenticationException(String message) {
        super(message);
    }
}
