package com.resumeai.repository;

import com.resumeai.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByStatusOrderByCreatedAtDesc(Job.Status status);
    List<Job> findAllByOrderByCreatedAtDesc();
}
