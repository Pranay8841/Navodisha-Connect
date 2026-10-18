package com.navodishaConnect.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * 1:0..1 Extension entity capturing administrative and coordination roles for JNV staff/teachers.
 * Shares primary key with the root User entity via JPA @MapsId.
 */
@Entity
@Table(name = "jnv_admin_details")
public class JnvAdminDetails {

    @Id
    @Column(name = "user_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "designation", nullable = false, length = 100)
    private String designation;

    @Column(name = "is_alumni_coordinator", nullable = false)
    private Boolean isAlumniCoordinator = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public JnvAdminDetails() {
        // Required by JPA
    }

    public JnvAdminDetails(User user, String designation, Boolean isAlumniCoordinator) {
        this.user = user;
        this.designation = designation;
        this.isAlumniCoordinator = (isAlumniCoordinator != null) ? isAlumniCoordinator : false;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.isAlumniCoordinator == null) {
            this.isAlumniCoordinator = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public Boolean getIsAlumniCoordinator() {
        return isAlumniCoordinator;
    }

    public void setIsAlumniCoordinator(Boolean alumniCoordinator) {
        isAlumniCoordinator = alumniCoordinator;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        JnvAdminDetails that = (JnvAdminDetails) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
