package com.example.backendpos.dto.response;
import lombok.*;
import java.util.Set;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private Long userId;
    private String fullName;
    private String email;
    private String token;
    private Set<String> roles;
}
