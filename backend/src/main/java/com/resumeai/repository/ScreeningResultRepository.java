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
}
