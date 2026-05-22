package com.resumeai.controller;

import com.resumeai.model.*;
import com.resumeai.repository.*;
import com.resumeai.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final ScreeningResultRepository screenRepo;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
                                    @RequestParam("jobId") Long jobId,
                                    @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(resumeService.uploadAndScreen(file, jobId, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/upload/bulk")
    public ResponseEntity<?> bulkUpload(@RequestParam("files") MultipartFile[] files,
                                        @RequestParam("jobId") Long jobId,
                                        @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(resumeService.bulkUploadAndScreen(files, jobId, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/job/{jobId}/results")
    public List<ScreeningResult> resultsByJob(@PathVariable Long jobId) {
        return screenRepo.findByJobIdOrderByOverallScoreDesc(jobId);
    }

    @GetMapping("/results")
    public List<ScreeningResult> allResults() {
        return screenRepo.findAllByOrderByOverallScoreDesc();
    }

    @GetMapping("/result/{id}")
    public ResponseEntity<ScreeningResult> result(@PathVariable Long id) {
        return screenRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/result/{id}/status")
    public ResponseEntity<ScreeningResult> updateStatus(@PathVariable Long id,
                                                        @RequestBody Map<String, String> body) {
        return screenRepo.findById(id).map(sr -> {
            sr.setStatus(ScreeningResult.CandidateStatus.valueOf(body.get("status")));
            return ResponseEntity.ok(screenRepo.save(sr));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/result/{id}")
    public ResponseEntity<?> deleteCandidate(@PathVariable Long id) {
        resumeService.deleteCandidate(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/results")
    public ResponseEntity<?> deleteAllCandidates(@RequestParam(required = false) Long jobId) {
        resumeService.deleteAllCandidates(jobId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        long total       = screenRepo.countTotal();
        long shortlisted = screenRepo.countByStatus(ScreeningResult.CandidateStatus.SHORTLISTED);
        long hired       = screenRepo.countByStatus(ScreeningResult.CandidateStatus.HIRED);
        long rejected    = screenRepo.countByStatus(ScreeningResult.CandidateStatus.REJECTED);
        return Map.of(
                "total", total,
                "shortlisted", shortlisted,
                "hired", hired,
                "rejected", rejected
        );
    }
}
