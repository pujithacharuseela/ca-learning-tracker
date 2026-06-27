package com.learningtracker.service;

import com.learningtracker.entity.Subject;
import com.learningtracker.entity.User;
import com.learningtracker.exception.InvalidOperationException;
import com.learningtracker.exception.ResourceNotFoundException;
import com.learningtracker.repository.SubjectRepository;
import com.learningtracker.repository.UserRepository;
import com.learningtracker.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Subject> getSubjects() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return subjectRepository.findByUserIdOrderByNameAsc(user.getId());
    }

    @Transactional
    public Subject createSubject(String name, String color, String description) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (subjectRepository.existsByUserIdAndName(user.getId(), name)) {
            throw new InvalidOperationException("Subject with name '" + name + "' already exists.");
        }

        Subject subject = Subject.builder()
                .user(user)
                .name(name)
                .color(color != null ? color : "#8b5cf6")
                .description(description)
                .build();
        return subjectRepository.save(subject);
    }

    @Transactional
    public Subject updateSubject(UUID subjectId, String name, String color, String description) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", subjectId));

        if (!subject.getUser().getId().equals(user.getId())) {
            throw new InvalidOperationException("You do not have permission to update this subject.");
        }

        if (name != null && !name.isBlank()) subject.setName(name);
        if (color != null && !color.isBlank()) subject.setColor(color);
        if (description != null) subject.setDescription(description);
        return subjectRepository.save(subject);
    }

    @Transactional
    public void deleteSubject(UUID subjectId) {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", subjectId));

        if (!subject.getUser().getId().equals(user.getId())) {
            throw new InvalidOperationException("You do not have permission to delete this subject.");
        }
        subjectRepository.delete(subject);
    }
}
