package edu.cit.lagamo.multibiz.service;

import edu.cit.lagamo.multibiz.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Generates and validates JWTs for the SDD auth flow.
 *
 * <ul>
 *   <li>accessToken  – short-lived (15 min), carries userId + role claims</li>
 *   <li>refreshToken – long-lived  (7 days),  carries only userId</li>
 * </ul>
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenMs;
    private final long refreshTokenMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiration-ms}") long accessTokenMs,
            @Value("${jwt.refresh-expiration-ms}") long refreshTokenMs) {

        this.signingKey     = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenMs  = accessTokenMs;
        this.refreshTokenMs = refreshTokenMs;
    }

    // ── Token generation ──────────────────────────────────────────────────────

    /**
     * Short-lived access token (15 min).
     * Carries subject = userId, claim "role".
     */
    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", user.getRole())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenMs)))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Long-lived refresh token (7 days).
     * Carries subject = userId only — opaque string stored in DB.
     */
    public String generateRefreshToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(refreshTokenMs)))
                .signWith(signingKey)
                .compact();
    }

    // ── Token parsing ─────────────────────────────────────────────────────────

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getRefreshTokenMs() { return refreshTokenMs; }
}
