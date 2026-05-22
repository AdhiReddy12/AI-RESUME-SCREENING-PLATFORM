package com.resumeai.service;

import com.resumeai.model.*;
import com.resumeai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private final ResumeRepository resumeRepo;
    private final ScreeningResultRepository screenRepo;
    private final JobRepository jobRepo;
    private final AiServiceClient aiClient;

    public ScreeningResult uploadAndScreen(MultipartFile file, Long jobId, User uploader) throws IOException {
        Job job = jobRepo.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Save file
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path stored = dir.resolve(filename);
        file.transferTo(stored);

        // Persist resume record
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toUpperCase();
        Resume resume = resumeRepo.save(Resume.builder()
                .job(job)
                .originalName(file.getOriginalFilename())
                .storedPath(stored.toString())
                .fileType(ext)
                .fileSize(file.getSize())
                .uploadedBy(uploader)
                .build());

        // Call AI service
        Map<String, Object> jobDetails = buildJobDetails(job);
        Map<String, Object> aiResult = aiClient.screen(stored.toString(), jobDetails);

        return persistResult(resume, job, aiResult);
    }

    public List<ScreeningResult> bulkUploadAndScreen(MultipartFile[] files, Long jobId, User uploader) throws IOException {
        Job job = jobRepo.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);

        List<String> paths = new ArrayList<>();
        List<Resume> resumes = new ArrayList<>();

        for (MultipartFile file : files) {
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path stored = dir.resolve(filename);
            file.transferTo(stored);
            paths.add(stored.toString());

            String ext = filename.substring(filename.lastIndexOf('.') + 1).toUpperCase();
            resumes.add(resumeRepo.save(Resume.builder()
                    .job(job).originalName(file.getOriginalFilename())
                    .storedPath(stored.toString()).fileType(ext)
                    .fileSize(file.getSize()).uploadedBy(uploader).build()));
        }

        Map<String, Object> jobDetails = buildJobDetails(job);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> aiResults =
                (List<Map<String, Object>>) aiClient.bulkScreen(paths, jobDetails).get("results");

        List<ScreeningResult> results = new ArrayList<>();
        for (int i = 0; i < resumes.size() && i < aiResults.size(); i++) {
            results.add(persistResult(resumes.get(i), job, aiResults.get(i)));
        }
        return results;
    }

    private Map<String, Object> buildJobDetails(Job job) {
        return Map.of(
                "title",               job.getTitle(),
                "required_skills",     Optional.ofNullable(job.getRequiredSkills()).orElse(""),
                "preferred_skills",    Optional.ofNullable(job.getPreferredSkills()).orElse(""),
                "min_experience",      Optional.ofNullable(job.getMinExperience()).orElse(0),
                "education_level",     Optional.ofNullable(job.getEducationLevel()).orElse("BACHELORS"),
                "keywords",            Optional.ofNullable(job.getKeywords()).orElse(""),
                "shortlist_threshold", Optional.ofNullable(job.getShortlistThreshold()).orElse(70)
        );
    }

    private ScreeningResult persistResult(Resume resume, Job job,
                                          Map<String, Object> ai) {
        double overall = toDouble(ai.get("overall_score"));
        
        ScreeningResult.CandidateStatus status;
        int shortlistThreshold = job.getShortlistThreshold() != null ? job.getShortlistThreshold() : 70;
        int rejectionThreshold = job.getRejectionThreshold() != null ? job.getRejectionThreshold() : 40;
        
        if (overall >= shortlistThreshold) {
            status = ScreeningResult.CandidateStatus.SHORTLISTED;
        } else if (overall < rejectionThreshold) {
            status = ScreeningResult.CandidateStatus.REJECTED;
        } else {
            status = ScreeningResult.CandidateStatus.SCREENED;
        }

        ScreeningResult sr = ScreeningResult.builder()
                .resume(resume).job(job)
                .candidateName(str(ai.get("candidate_name")))
                .candidateEmail(str(ai.get("candidate_email")))
                .candidatePhone(str(ai.get("candidate_phone")))
                .candidateLinkedin(str(ai.get("candidate_linkedin")))
                .skillsScore(bd(ai.get("skills_score")))
                .experienceScore(bd(ai.get("experience_score")))
                .educationScore(bd(ai.get("education_score")))
                .keywordScore(bd(ai.get("keyword_score")))
                .overallScore(bd(ai.get("overall_score")))
                .matchedSkills(str(ai.get("matched_skills")))
                .yearsExperience(bd(ai.get("years_experience")))
                .educationLevel(str(ai.get("education_level")))
                .aiSummary(str(ai.get("ai_summary")))
                .status(status)
                .build();

        return screenRepo.save(sr);
    }

    private double toDouble(Object v) {
        if (v == null) return 0;
        if (v instanceof Number) return ((Number) v).doubleValue();
        return Double.parseDouble(v.toString());
    }

    private BigDecimal bd(Object v) { return BigDecimal.valueOf(toDouble(v)); }

    private String str(Object v) { return v == null ? "" : v.toString(); }

    public void deleteCandidate(Long id) {
        ScreeningResult result = screenRepo.findById(id).orElse(null);
        if (result != null) {
            Resume resume = result.getResume();
            screenRepo.delete(result);
            if (resume != null) {
                resumeRepo.delete(resume);
                try {
                    Files.deleteIfExists(Paths.get(resume.getStoredPath()));
                } catch (IOException e) {
                    log.warn("Could not delete file: " + resume.getStoredPath());
                }
            }
        }
    }
}
