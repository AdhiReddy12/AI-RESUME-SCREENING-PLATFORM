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

        };
    }
}
