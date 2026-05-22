package com.resumeai.dto;

import lombok.Data;

public class AuthDtos {

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class RegisterRequest {
        private String email;
        private String password;
        private String fullName;
    }

    @Data
    public static class LoginResponse {
        private String token;
        private String email;
        private String fullName;
        private String role;

        public LoginResponse(String token, String email, String fullName, String role) {
            this.token = token;
            this.email = email;
            this.fullName = fullName;
            this.role = role;
        }
    }
}
