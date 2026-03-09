package edu.cit.lagamo.multibiz.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "business_staff")
public class BusinessStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt = LocalDateTime.now();

    // ── Constructors ─────────────────────────────────────────────────────────

    public BusinessStaff() {}

    // ── Getters & Setters ────────────────────────────────────────────────────

    public UUID getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
}
