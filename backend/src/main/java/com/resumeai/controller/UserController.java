package com.resumeai.controller;

import com.resumeai.dto.UserDtos.UserProfileUpdateDto;
import com.resumeai.model.User;
import com.resumeai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepo;
    private final String UPLOAD_DIR = "uploads/profiles/";

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestAttribute("currentUser") User user,
            @RequestBody UserProfileUpdateDto dto) {
        
        user.setFullName(dto.getFullName());
        user.setCompanyName(dto.getCompanyName());
        user.setContactNumber(dto.getContactNumber());
        
        userRepo.save(user);
        
        return ResponseEntity.ok(user);
    }

    @PostMapping("/profile/picture")
    public ResponseEntity<?> uploadProfilePicture(
            @RequestAttribute("currentUser") User user,
            @RequestParam("file") MultipartFile file) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String newFilename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(newFilename);
            
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            String fileUrl = "/api/users/profile/picture/" + newFilename;
            user.setProfilePicture(fileUrl);
            userRepo.save(user);
            
            return ResponseEntity.ok().body("{\"url\":\"" + fileUrl + "\"}");
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to store file");
        }
    }

    @GetMapping("/profile/picture/{filename}")
    public ResponseEntity<Resource> getProfilePicture(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
