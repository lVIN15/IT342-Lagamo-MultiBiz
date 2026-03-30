package edu.cit.lagamo.multibiz.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import edu.cit.lagamo.multibiz.entity.RefreshToken;
import edu.cit.lagamo.multibiz.entity.User;
import edu.cit.lagamo.multibiz.repository.RefreshTokenRepository;
import edu.cit.lagamo.multibiz.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String googleClientId;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       @Value("${google.client.id}") String googleClientId) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleClientId = googleClientId;
    }

    @Transactional
    public Map<String, Object> verifyGoogleTokenAndAuthenticate(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                String email = payload.getEmail();
                String givenName = (String) payload.get("given_name");
                String familyName = (String) payload.get("family_name");

                Optional<User> userOpt = userRepository.findByEmail(email);
                User user;

                if (userOpt.isPresent()) {
                    user = userOpt.get();
                } else {
                    user = new User();
                    user.setEmail(email);
                    user.setFirstname(givenName != null ? givenName : "Google");
                    user.setLastname(familyName != null ? familyName : "User");
                    user.setRole("OWNER");
                    // Assign random password since OAuth will be used.
                    user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
                    userRepository.save(user);
                }

                // Generate our system's JWT tokens
                refreshTokenRepository.deleteByUserId(user.getId());
                String accessToken = jwtService.generateAccessToken(user);
                String refreshToken = jwtService.generateRefreshToken(user);
                
                RefreshToken rt = new RefreshToken();
                rt.setUser(user);
                rt.setToken(refreshToken);
                rt.setExpiresAt(LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenMs() / 1000));
                refreshTokenRepository.save(rt);

                Map<String, Object> userMap = new LinkedHashMap<>();
                userMap.put("id", user.getId().toString());
                userMap.put("email", user.getEmail());
                userMap.put("firstname", user.getFirstname());
                userMap.put("lastname", user.getLastname());
                userMap.put("role", user.getRole());

                Map<String, Object> data = new LinkedHashMap<>();
                data.put("user", userMap);
                data.put("accessToken", accessToken);
                data.put("refreshToken", refreshToken);

                return data;
            } else {
                throw new IllegalArgumentException("Invalid ID token.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Google token verification failed.", e);
        }
    }
}
