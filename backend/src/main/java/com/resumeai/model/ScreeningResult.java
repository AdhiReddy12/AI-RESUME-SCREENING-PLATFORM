package com.resumeai.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "screening_results")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ScreeningResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", unique = true)
    private Resume resume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    @Column(name = "candidate_name")
    private String candidateName;

    @Column(name = "candidate_email")
    private String candidateEmail;

    @Column(name = "candidate_phone")
    private String candidatePhone;

    @Column(name = "candidate_linkedin")
    private String candidateLinkedin;

    @Column(name = "skills_score", precision = 5, scale = 2)
    private BigDecimal skillsScore;

    @Column(name = "experience_score", precision = 5, scale = 2)
    private BigDecimal experienceScore;

    @Column(name = "education_score", precision = 5, scale = 2)
    private BigDecimal educationScore;

    @Column(name = "keyword_score", precision = 5, scale = 2)
    private BigDecimal keywordScore;

    @Column(name = "overall_score", precision = 5, scale = 2)
    private BigDecimal overallScore;

    @Column(name = "matched_skills", columnDefinition = "TEXT")
    private String matchedSkills;   // JSON array

    @Column(name = "years_experience", precision = 4, scale = 1)
    private BigDecimal yearsExperience;

    @Column(name = "education_level")
    private String educationLevel;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CandidateStatus status = CandidateStatus.SCREENED;

    @Column(name = "screened_at")
    private LocalDateTime screenedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { screenedAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum CandidateStatus {
        SCREENED, SHORTLISTED, INTERVIEWED, OFFERED, HIRED, REJECTED
    }
}
