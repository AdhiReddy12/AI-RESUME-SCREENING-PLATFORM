package com.resumeai.dto;

import lombok.Data;

public class UserDtos {

    @Data
    public static class UserProfileUpdateDto {
        private String fullName;
        private String companyName;
        private String contactNumber;
    }
}
