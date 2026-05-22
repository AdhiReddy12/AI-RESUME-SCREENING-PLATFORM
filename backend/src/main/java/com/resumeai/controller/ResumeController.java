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
    public List<ScreeningResult> resultsByJob(@PathVariable Long jobId, @AuthenticationPrincipal User user) {
        if (user == null) {
            return List.of();
        }
        return screenRepo.findByJobIdAndUploadedByOrderByOverallScoreDesc(jobId, user.getId());
    }

    @GetMapping("/results")
    public List<ScreeningResult> allResults(@AuthenticationPrincipal User user) {
        if (user == null) {
            return List.of();
        }
        return screenRepo.findAllByUploadedByOrderByOverallScoreDesc(user.getId());
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
    public Map<String, Object> stats(@AuthenticationPrincipal User user) {
        if (user == null) {
            return Map.of(
                    "total", 0L,
                    "shortlisted", 0L,
                    "hired", 0L,
                    "rejected", 0L,
                    "scoreDistribution", List.of(0, 0, 0, 0, 0)
            );
        }
        long total       = screenRepo.countTotalByUser(user.getId());
        long shortlisted = screenRepo.countByStatusAndUser(user.getId(), ScreeningResult.CandidateStatus.SHORTLISTED);
        long hired       = screenRepo.countByStatusAndUser(user.getId(), ScreeningResult.CandidateStatus.HIRED);
        long rejected    = screenRepo.countByStatusAndUser(user.getId(), ScreeningResult.CandidateStatus.REJECTED);

        List<java.math.BigDecimal> scores = screenRepo.findOverallScoresByUserId(user.getId());
        int c1 = 0; // < 40
        int c2 = 0; // 40-59
        int c3 = 0; // 60-74
        int c4 = 0; // 75-89
        int c5 = 0; // 90+
        for (java.math.BigDecimal score : scores) {
            if (score == null) continue;
            double val = score.doubleValue();
            if (val < 40) {
                c1++;
            } else if (val < 60) {
                c2++;
            } else if (val < 75) {
                c3++;
            } else if (val < 90) {
                c4++;
            } else {
                c5++;
            }
        }
        List<Integer> distribution = List.of(c1, c2, c3, c4, c5);

        return Map.of(
                "total", total,
                "shortlisted", shortlisted,
                "hired", hired,
                "rejected", rejected,
                "scoreDistribution", distribution
        );
    }
}
