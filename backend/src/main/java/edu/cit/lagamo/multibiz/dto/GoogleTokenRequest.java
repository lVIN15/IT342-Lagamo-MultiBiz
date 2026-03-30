package edu.cit.lagamo.multibiz.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleTokenRequest {

    @NotBlank(message = "Google ID token must not be blank")
    private String token;

    public GoogleTokenRequest() {}

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
