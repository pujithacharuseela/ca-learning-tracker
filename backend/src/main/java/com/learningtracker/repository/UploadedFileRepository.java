package com.learningtracker.repository;

import com.learningtracker.entity.UploadedFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link UploadedFile} entity operations.
 */
@Repository
public interface UploadedFileRepository extends JpaRepository<UploadedFile, UUID> {

    /**
     * Retrieves all uploaded files for a user, ordered by most recent upload first.
     *
     * @param userId the user's UUID
     * @return list of uploaded files
     */
    List<UploadedFile> findByUserIdOrderByUploadedAtDesc(UUID userId);
    void deleteByUserId(UUID userId);
}
