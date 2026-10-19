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
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * 1:0..1 Extension entity capturing professional profile and mentorship willingness for JNV alumni.
 * Shares primary key with the root User entity via JPA @MapsId.
 */
@Entity
@Table(name = "alumni_details")
public class AlumniDetails {

    @Id
    @Column(name = "user_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "join_batch_year", nullable = false)
    private Integer joinBatchYear;

    @Column(name = "current_org", length = 150)
    private String currentOrg;

    @Column(name = "designation", length = 100)
    private String designation;

    @Column(name = "current_city", length = 100)
    private String currentCity;

    @Column(name = "bio", length = 250)
    private String bio;

    @Column(name = "provide_mentorships_on", columnDefinition = "text[]")
    private List<String> provideMentorshipsOn = new ArrayList<>();

    @Column(name = "willing_modes", columnDefinition = "text[]")
    private List<String> willingModes = new ArrayList<>();

    @Column(name = "open_to_help", nullable = false)
    private Boolean openToHelp = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public AlumniDetails() {
        // Required by JPA
    }

    public AlumniDetails(
            User user,
            Integer joinBatchYear,
            String currentOrg,
            String designation,
            String currentCity,
            String bio,
            List<String> provideMentorshipsOn,
            List<String> willingModes,
            Boolean openToHelp
    ) {
        this.user = user;
        this.joinBatchYear = joinBatchYear;
        this.currentOrg = currentOrg;
        this.designation = designation;
        this.currentCity = currentCity;
        this.bio = bio;
        this.provideMentorshipsOn = (provideMentorshipsOn != null) ? provideMentorshipsOn : new ArrayList<>();
        this.willingModes = (willingModes != null) ? willingModes : new ArrayList<>();
        this.openToHelp = (openToHelp != null) ? openToHelp : true;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.openToHelp == null) {
            this.openToHelp = true;
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

    public Integer getJoinBatchYear() {
        return joinBatchYear;
    }

    public void setJoinBatchYear(Integer joinBatchYear) {
        this.joinBatchYear = joinBatchYear;
    }

    public String getCurrentOrg() {
        return currentOrg;
    }

    public void setCurrentOrg(String currentOrg) {
        this.currentOrg = currentOrg;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getCurrentCity() {
        return currentCity;
    }

    public void setCurrentCity(String currentCity) {
        this.currentCity = currentCity;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public List<String> getProvideMentorshipsOn() {
        return provideMentorshipsOn;
    }

    public void setProvideMentorshipsOn(List<String> provideMentorshipsOn) {
        this.provideMentorshipsOn = provideMentorshipsOn;
    }

    public List<String> getWillingModes() {
        return willingModes;
    }

    public void setWillingModes(List<String> willingModes) {
        this.willingModes = willingModes;
    }

    public Boolean getOpenToHelp() {
        return openToHelp;
    }

    public void setOpenToHelp(Boolean openToHelp) {
        this.openToHelp = openToHelp;
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
        AlumniDetails that = (AlumniDetails) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
