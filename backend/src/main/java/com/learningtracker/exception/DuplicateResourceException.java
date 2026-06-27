package com.learningtracker.exception;

/**
 * Thrown when attempting to create a resource that already exists.
 */
public class DuplicateResourceException extends RuntimeException {

    /**
     * Creates a new DuplicateResourceException.
     *
     * @param message description of the duplicate resource conflict
     */
    public DuplicateResourceException(String message) {
        super(message);
    }
}
