package com.example.ecommerce.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDto {
    private String token;
    private String tokenType;
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;
}
