package com.resumeai.controller;

import com.resumeai.model.Job;
import com.resumeai.model.User;
import com.resumeai.repository.JobRepository;
import com.resumeai.repository.ScreeningResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobRepository jobRepo;
    private final ScreeningResultRepository screenRepo;

    @GetMapping
    public List<Job> list() {
        return jobRepo.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> get(@PathVariable Long id) {
        return jobRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Job create(@RequestBody Job job,
                      @AuthenticationPrincipal User user) {
        job.setCreatedBy(user);
        job.setId(null);
        return jobRepo.save(job);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Job> update(@PathVariable Long id, @RequestBody Job updates) {
        return jobRepo.findById(id).map(j -> {
            j.setTitle(updates.getTitle());
            j.setDepartment(updates.getDepartment());
            j.setDescription(updates.getDescription());
            j.setRequiredSkills(updates.getRequiredSkills());
            j.setPreferredSkills(updates.getPreferredSkills());
            j.setMinExperience(updates.getMinExperience());
            j.setEducationLevel(updates.getEducationLevel());
            j.setKeywords(updates.getKeywords());
            j.setShortlistThreshold(updates.getShortlistThreshold());
            j.setRejectionThreshold(updates.getRejectionThreshold());
            j.setStatus(updates.getStatus());
            return ResponseEntity.ok(jobRepo.save(j));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!jobRepo.existsById(id)) return ResponseEntity.notFound().build();
        jobRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<Map<String, Object>> stats(@PathVariable Long id) {
        if (!jobRepo.existsById(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of(
                "total",       screenRepo.countByJobIdAndStatus(id, null),
                "shortlisted", screenRepo.countByJobIdAndStatus(id, com.resumeai.model.ScreeningResult.CandidateStatus.SHORTLISTED),
                "avgScore",    screenRepo.avgScoreByJob(id)
        ));
    }
}
