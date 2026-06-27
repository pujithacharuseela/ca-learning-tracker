package com.learningtracker.exception;

/**
 * Thrown when a requested operation violates business rules or is not allowed
 * in the current state.
 */
public class InvalidOperationException extends RuntimeException {

    /**
     * Creates a new InvalidOperationException.
     *
     * @param message description of why the operation is invalid
     */
    public InvalidOperationException(String message) {
        super(message);
    }
}
