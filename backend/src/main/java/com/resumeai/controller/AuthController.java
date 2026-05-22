package com.resumeai.controller;

import com.resumeai.dto.AuthDtos.*;
import com.resumeai.model.User;
import com.resumeai.repository.UserRepository;
import com.resumeai.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return userRepo.findByEmail(req.getEmail())
                .filter(u -> passwordEncoder.matches(req.getPassword(), u.getPassword()))
                .map(u -> ResponseEntity.ok(
                        new LoginResponse(
                                jwtUtils.generateToken(u.getEmail()),
                                u.getEmail(), u.getFullName(), u.getRole().name(),
                                u.getProfilePicture(), u.getCompanyName(), u.getContactNumber()
                        )
                ))
                .orElse(ResponseEntity.status(401).build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body("Email already in use");
        }

        User newUser = new User();
        newUser.setEmail(req.getEmail());
        newUser.setPassword(passwordEncoder.encode(req.getPassword()));
        newUser.setFullName(req.getFullName());
        newUser.setCompanyName(req.getCompanyName());
        newUser.setContactNumber(req.getContactNumber());
        newUser.setRole(User.Role.RECRUITER);
        
        userRepo.save(newUser);

        return ResponseEntity.ok(
                new LoginResponse(
                        jwtUtils.generateToken(newUser.getEmail()),
                        newUser.getEmail(), newUser.getFullName(), newUser.getRole().name(),
                        newUser.getProfilePicture(), newUser.getCompanyName(), newUser.getContactNumber()
                )
        );
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(
            @RequestAttribute(name = "currentUser", required = false) User user) {
        // user is set by the filter if JWT is valid
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(new LoginResponse(null, user.getEmail(),
                user.getFullName(), user.getRole().name(),
                user.getProfilePicture(), user.getCompanyName(), user.getContactNumber()));
    }
}
