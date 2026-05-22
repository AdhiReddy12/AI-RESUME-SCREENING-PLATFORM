package com.resumeai.repository;

import com.resumeai.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByJobId(Long jobId);
    long countByJobId(Long jobId);
}
