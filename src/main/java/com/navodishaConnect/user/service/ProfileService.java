package com.navodishaConnect.user.service;

import com.navodishaConnect.user.domain.AlumniDetails;
import com.navodishaConnect.user.domain.JnvAdminDetails;
import com.navodishaConnect.user.domain.Role;
import com.navodishaConnect.user.domain.StudentDetails;
import com.navodishaConnect.user.domain.User;
import com.navodishaConnect.user.dto.AlumniDetailsResponse;
import com.navodishaConnect.user.dto.JnvAdminDetailsResponse;
import com.navodishaConnect.user.dto.StudentDetailsResponse;
import com.navodishaConnect.user.dto.UpdateAlumniProfileRequest;
import com.navodishaConnect.user.dto.UpdateJnvAdminProfileRequest;
import com.navodishaConnect.user.dto.UpdateStudentProfileRequest;
import com.navodishaConnect.user.dto.UserProfileResponse;
import com.navodishaConnect.user.repository.AlumniDetailsRepository;
import com.navodishaConnect.user.repository.JnvAdminDetailsRepository;
import com.navodishaConnect.user.repository.StudentDetailsRepository;
import com.navodishaConnect.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Service managing user profile details across Student, Alumni, and JNV Admin roles.
 */
@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final StudentDetailsRepository studentDetailsRepository;
    private final AlumniDetailsRepository alumniDetailsRepository;
    private final JnvAdminDetailsRepository jnvAdminDetailsRepository;

    public ProfileService(
            UserRepository userRepository,
            StudentDetailsRepository studentDetailsRepository,
            AlumniDetailsRepository alumniDetailsRepository,
            JnvAdminDetailsRepository jnvAdminDetailsRepository
    ) {
        this.userRepository = userRepository;
        this.studentDetailsRepository = studentDetailsRepository;
        this.alumniDetailsRepository = alumniDetailsRepository;
        this.jnvAdminDetailsRepository = jnvAdminDetailsRepository;
    }

    /**
     * Retrieves the unified user profile including their role-specific details.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getFullProfile(UUID userId) {
        User user = getUserOrThrow(userId);

        StudentDetailsResponse studentResponse = null;
        AlumniDetailsResponse alumniResponse = null;
        JnvAdminDetailsResponse jnvAdminResponse = null;

        if (user.getRole() == Role.STUDENT) {
            studentResponse = studentDetailsRepository.findById(userId)
                    .map(StudentDetailsResponse::fromEntity)
                    .orElse(null);
        } else if (user.getRole() == Role.ALUMNUS) {
            alumniResponse = alumniDetailsRepository.findById(userId)
                    .map(AlumniDetailsResponse::fromEntity)
                    .orElse(null);
        } else if (user.getRole() == Role.JNV_ADMIN) {
            jnvAdminResponse = jnvAdminDetailsRepository.findById(userId)
                    .map(JnvAdminDetailsResponse::fromEntity)
                    .orElse(null);
        }

        return UserProfileResponse.of(user, studentResponse, alumniResponse, jnvAdminResponse);
    }

    /**
     * Creates or updates profile details for a Student.
     */
    @Transactional
    public UserProfileResponse updateStudentProfile(UUID userId, UpdateStudentProfileRequest request) {
        User user = getUserOrThrow(userId);
        if (user.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can update a student profile.");
        }

        StudentDetails details = studentDetailsRepository.findById(userId)
                .orElseGet(() -> new StudentDetails(
                        user,
                        request.joinBatchYear(),
                        request.classLevel(),
                        request.stream(),
                        request.house(),
                        request.preparingFor()
                ));

        details.setJoinBatchYear(request.joinBatchYear());
        details.setClassLevel(request.classLevel());
        details.setStream(request.stream());
        details.setHouse(request.house());
        if (request.preparingFor() != null) {
            details.setPreparingFor(request.preparingFor());
        }

        studentDetailsRepository.save(details);
        return getFullProfile(userId);
    }

    /**
     * Creates or updates profile details for an Alumnus.
     */
    @Transactional
    public UserProfileResponse updateAlumniProfile(UUID userId, UpdateAlumniProfileRequest request) {
        User user = getUserOrThrow(userId);
        if (user.getRole() != Role.ALUMNUS) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only alumni can update an alumnus profile.");
        }

        AlumniDetails details = alumniDetailsRepository.findById(userId)
                .orElseGet(() -> new AlumniDetails(
                        user,
                        request.joinBatchYear(),
                        request.currentOrg(),
                        request.designation(),
                        request.currentCity(),
                        request.bio(),
                        request.provideMentorshipsOn(),
                        request.willingModes(),
                        request.openToHelp()
                ));

        details.setJoinBatchYear(request.joinBatchYear());
        details.setCurrentOrg(request.currentOrg());
        details.setDesignation(request.designation());
        details.setCurrentCity(request.currentCity());
        details.setBio(request.bio());
        if (request.provideMentorshipsOn() != null) {
            details.setProvideMentorshipsOn(request.provideMentorshipsOn());
        }
        if (request.willingModes() != null) {
            details.setWillingModes(request.willingModes());
        }
        if (request.openToHelp() != null) {
            details.setOpenToHelp(request.openToHelp());
        }

        alumniDetailsRepository.save(details);
        return getFullProfile(userId);
    }

    /**
     * Creates or updates profile details for a JNV Admin.
     */
    @Transactional
    public UserProfileResponse updateJnvAdminProfile(UUID userId, UpdateJnvAdminProfileRequest request) {
        User user = getUserOrThrow(userId);
        if (user.getRole() != Role.JNV_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only JNV administrators can update a JNV admin profile.");
        }

        JnvAdminDetails details = jnvAdminDetailsRepository.findById(userId)
                .orElseGet(() -> new JnvAdminDetails(
                        user,
                        request.designation(),
                        request.isAlumniCoordinator()
                ));

        details.setDesignation(request.designation());
        if (request.isAlumniCoordinator() != null) {
            details.setIsAlumniCoordinator(request.isAlumniCoordinator());
        }

        jnvAdminDetailsRepository.save(details);
        return getFullProfile(userId);
    }

    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
