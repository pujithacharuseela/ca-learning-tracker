package com.learningtracker.controller;

import com.learningtracker.entity.Subject;
import com.learningtracker.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<List<Subject>> getSubjects() {
        return ResponseEntity.ok(subjectService.getSubjects());
    }

    @PostMapping
    public ResponseEntity<Subject> createSubject(@RequestBody Map<String, String> body) {
        Subject subject = subjectService.createSubject(
                body.get("name"),
                body.get("color"),
                body.get("description")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(subject);
    }

    @PutMapping("/{subjectId}")
    public ResponseEntity<Subject> updateSubject(
            @PathVariable UUID subjectId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(subjectService.updateSubject(
                subjectId,
                body.get("name"),
                body.get("color"),
                body.get("description")
        ));
    }

    @DeleteMapping("/{subjectId}")
    public ResponseEntity<Void> deleteSubject(@PathVariable UUID subjectId) {
        subjectService.deleteSubject(subjectId);
        return ResponseEntity.noContent().build();
    }
}
