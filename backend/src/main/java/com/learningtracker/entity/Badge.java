package com.learningtracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Defines an achievement badge with criteria that users can earn.
 * This entity does NOT extend BaseEntity — it uses its own identity
 * management and does not require audit timestamps.
 */
@Entity
@Table(name = "badges")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "display_name", nullable = false, length = 150)
    private String displayName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "icon", length = 100)
    private String icon;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "criteria_type", length = 50)
    private String criteriaType;

    @Column(name = "criteria_value")
    private int criteriaValue;
}
