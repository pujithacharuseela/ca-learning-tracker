package com.learningtracker.exception;

import lombok.Getter;

/**
 * Thrown when a requested resource cannot be found in the database.
 */
@Getter
public class ResourceNotFoundException extends RuntimeException {

    private final String resourceName;
    private final String fieldName;
    private final Object fieldValue;

    /**
     * Creates a new ResourceNotFoundException.
     *
     * @param resourceName the name of the resource (e.g., "User")
     * @param fieldName    the field used for lookup (e.g., "id")
     * @param fieldValue   the value that was searched for
     */
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }
}
