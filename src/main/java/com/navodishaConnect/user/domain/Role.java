package com.navodishaConnect.user.domain;

/**
 * System authorization roles for Navodisha Connect.
 * - STUDENT: Class 10-12 JNV students seeking guidance (mentee only).
 * - ALUMNUS: Verified JNV alumni. Has dual-capability: can offer mentorship to students/junior alumni
 *            AND seek mentorship from senior alumni.
 * - JNV_ADMIN: School principals/staff posting institutional guidance requests.
 * - PLATFORM_ADMIN: System administrators managing alumni verification and platform safety.
 */
public enum Role {
    STUDENT,
    ALUMNUS,
    JNV_ADMIN,
    PLATFORM_ADMIN
}
