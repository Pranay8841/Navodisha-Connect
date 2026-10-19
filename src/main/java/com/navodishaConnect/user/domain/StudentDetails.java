package com.navodishaConnect.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * 1:0..1 Extension entity capturing academic and mentorship profile details for JNV students.
 * Shares primary key with the root User entity via JPA @MapsId.
 */
@Entity
@Table(name = "student_details")
public class StudentDetails {

    @Id
    @Column(name = "user_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "join_batch_year", nullable = false)
    private Integer joinBatchYear;

    @Column(name = "class_level", nullable = false, length = 20)
    private ClassLevel classLevel;

    @Column(name = "stream", length = 50)
    private Stream stream;

    @Enumerated(EnumType.STRING)
    @Column(name = "house", length = 30)
    private House house;

    @Column(name = "preparing_for", columnDefinition = "text[]")
    private List<String> preparingFor = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public StudentDetails() {
        // Required by JPA
    }

    public StudentDetails(User user, Integer joinBatchYear, ClassLevel classLevel, Stream stream, House house, List<String> preparingFor) {
        this.user = user;
        this.joinBatchYear = joinBatchYear;
        this.classLevel = classLevel;
        this.stream = stream;
        this.house = house;
        this.preparingFor = (preparingFor != null) ? preparingFor : new ArrayList<>();
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
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

    public ClassLevel getClassLevel() {
        return classLevel;
    }

    public void setClassLevel(ClassLevel classLevel) {
        this.classLevel = classLevel;
    }

    public Stream getStream() {
        return stream;
    }

    public void setStream(Stream stream) {
        this.stream = stream;
    }

    public House getHouse() {
        return house;
    }

    public void setHouse(House house) {
        this.house = house;
    }

    public List<String> getPreparingFor() {
        return preparingFor;
    }

    public void setPreparingFor(List<String> preparingFor) {
        this.preparingFor = preparingFor;
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
        StudentDetails that = (StudentDetails) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
