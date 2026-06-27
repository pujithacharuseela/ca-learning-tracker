package com.learningtracker.repository;

import com.learningtracker.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, UUID> {
    List<Subject> findByUserIdOrderByNameAsc(UUID userId);
    boolean existsByUserIdAndName(UUID userId, String name);

    @Modifying
    @Query("DELETE FROM Subject s WHERE s.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
