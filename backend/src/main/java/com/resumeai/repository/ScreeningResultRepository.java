package com.resumeai.repository;

import com.resumeai.model.ScreeningResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ScreeningResultRepository extends JpaRepository<ScreeningResult, Long> {

    List<ScreeningResult> findByJobIdOrderByOverallScoreDesc(Long jobId);

    List<ScreeningResult> findAllByOrderByOverallScoreDesc();

    Optional<ScreeningResult> findByResumeId(Long resumeId);

    long countByJobIdAndStatus(Long jobId, ScreeningResult.CandidateStatus status);

    long countByStatus(ScreeningResult.CandidateStatus status);

    @Query("SELECT COUNT(r) FROM ScreeningResult r")
    long countTotal();

    @Query("SELECT AVG(r.overallScore) FROM ScreeningResult r WHERE r.job.id = :jobId")
    Double avgScoreByJob(Long jobId);

    @Query("SELECT COUNT(sr) FROM ScreeningResult sr WHERE sr.resume.uploadedBy.id = :userId")
    long countTotalByUser(Long userId);

    @Query("SELECT COUNT(sr) FROM ScreeningResult sr WHERE sr.resume.uploadedBy.id = :userId AND sr.status = :status")
    long countByStatusAndUser(Long userId, ScreeningResult.CandidateStatus status);

    @Query("SELECT sr FROM ScreeningResult sr WHERE sr.resume.uploadedBy.id = :userId ORDER BY sr.overallScore DESC")
    List<ScreeningResult> findAllByUploadedByOrderByOverallScoreDesc(Long userId);

    @Query("SELECT sr FROM ScreeningResult sr WHERE sr.job.id = :jobId AND sr.resume.uploadedBy.id = :userId ORDER BY sr.overallScore DESC")
    List<ScreeningResult> findByJobIdAndUploadedByOrderByOverallScoreDesc(Long jobId, Long userId);

    @Query("SELECT sr.overallScore FROM ScreeningResult sr WHERE sr.resume.uploadedBy.id = :userId")
    List<java.math.BigDecimal> findOverallScoresByUserId(Long userId);
}
