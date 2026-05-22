package com.resumeai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AiServiceClient {

    @Value("${app.ai-service.url}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> screen(String filePath, Map<String, Object> jobDetails) {
        var body = Map.of("file_path", filePath, "job", jobDetails);
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        var entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                aiServiceUrl + "/screen",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {}
        );
        return response.getBody();
    }

    public Map<String, Object> bulkScreen(java.util.List<String> filePaths, Map<String, Object> jobDetails) {
        var body = Map.of("file_paths", filePaths, "job", jobDetails);
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        var entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                aiServiceUrl + "/bulk-screen",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {}
        );
        return response.getBody();
    }
}
