package com.resumeai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.resumeai.model.User;
import com.resumeai.model.User.Role;
import com.resumeai.repository.UserRepository;
import com.resumeai.model.Job;
import com.resumeai.repository.JobRepository;

@SpringBootApplication
public class ResumeAiApplication {
    public static void main(String[] args) {
        SpringApplication.run(ResumeAiApplication.class, args);
    }

    @Bean
    public CommandLineRunner dataSeeder(UserRepository userRepo, JobRepository jobRepo, PasswordEncoder encoder) {
        return args -> {
            if (userRepo.count() == 0) {
                User hr = User.builder().email("hr@resumeai.com").password(encoder.encode("password")).fullName("HR Admin").role(Role.ADMIN).build();
                User recruiter = User.builder().email("recruiter@resumeai.com").password(encoder.encode("password")).fullName("Jane Recruiter").role(Role.RECRUITER).build();
                User manager = User.builder().email("manager@resumeai.com").password(encoder.encode("password")).fullName("Bob Hiring Manager").role(Role.HIRING_MANAGER).build();
                userRepo.save(hr);
                userRepo.save(recruiter);
                userRepo.save(manager);
                
                Job j1 = Job.builder().title("Senior Java Developer").department("Engineering").description("We are looking for an experienced Java developer to join our backend team.").requiredSkills("Java,Spring Boot,PostgreSQL,REST API").preferredSkills("Docker,Kubernetes,Redis,Kafka").minExperience(4).educationLevel("BACHELORS").keywords("microservices,agile,ci/cd,junit,maven").shortlistThreshold(70).status(Job.Status.OPEN).createdBy(hr).build();
                jobRepo.save(j1);
            }
        };
    }
}
