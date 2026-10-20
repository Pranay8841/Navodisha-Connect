import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { VerificationItemResponse } from '../api/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user, fullProfile, refreshProfile, logout } = useAuth();

  const [verification, setVerification] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<VerificationItemResponse[]>([]);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';
  const isJnvAdmin = user?.role === 'JNV_ADMIN';
  const isAlumnus = user?.role === 'ALUMNUS';
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (isAlumnus || isJnvAdmin) {
      await fetchMyVerification();
    }
    if (isPlatformAdmin) {
      await fetchAdminPendingVerifications();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await loadData();
    setRefreshing(false);
  };

  const fetchMyVerification = async () => {
    try {
      const res = await apiClient.get('/api/v1/verifications/my');
      setVerification(res.data);
    } catch (e: any) {
      if (e.response?.status !== 404) {
        console.warn('Failed to fetch verification:', e);
      }
    }
  };

  const fetchAdminPendingVerifications = async () => {
    try {
      const res = await apiClient.get<VerificationItemResponse[]>('/api/v1/admin/verifications');
      setPendingRequests(res.data || []);
    } catch (e: any) {
      console.warn('Failed to fetch admin pending verifications:', e);
    }
  };

  const handleSubmitVerification = async () => {
    setSubmittingVerification(true);
    try {
      const res = await apiClient.post('/api/v1/verifications', {
        remarks: 'Navodisha Alumni Verification Request',
      });
      setVerification(res.data);
      Alert.alert('Verification Submitted! 🎉', 'Your verification request has been sent for administrative review.');
      await refreshProfile();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to submit verification.';
      Alert.alert('Submission Error', msg);
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleReviewVerification = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setReviewingId(requestId);
    try {
      await apiClient.patch(`/api/v1/admin/verifications/${requestId}/review`, {
        status,
        remarks: status === 'APPROVED' ? 'Verified by Platform Admin' : 'Information could not be verified',
      });
      Alert.alert('Review Submitted', `Applicant has been ${status.toLowerCase()} successfully.`);
      await fetchAdminPendingVerifications();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to review request.';
      Alert.alert('Review Error', msg);
    } finally {
      setReviewingId(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const isVerified = isStudent || user?.isVerified || verification?.status === 'APPROVED' || user?.status === 'ACTIVE';
  const isPending = !isStudent && (verification?.status === 'PENDING' || user?.status === 'PENDING');

  const getRoleLabel = () => {
    if (isPlatformAdmin) return 'Platform Administrator';
    if (isJnvAdmin) return 'JNV Administrator';
    if (isAlumnus) return 'JNV Alumnus';
    return 'Student Scholar';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoGroup}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={18} color={AppColors.primary} />
          </View>
          <Text style={styles.logoTitle}>Navodisha Connect</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        
        {/* User Identity Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'NC'}
              </Text>
            </View>

            <View style={styles.profileMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.fullName}>{user?.fullName || 'Navodisha Member'}</Text>
                {isVerified && (
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                )}
              </View>
              <Text style={styles.phoneText}>{user?.phoneNumber}</Text>
              
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{getRoleLabel()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.schoolInfoRow}>
            <Ionicons name="business-outline" size={16} color="#64748B" />
            <Text style={styles.schoolText}>{user?.jnvName || 'Jawahar Navodaya Vidyalaya'}</Text>
          </View>
        </View>

        {/* ============================================================== */}
        {/* PLATFORM ADMIN VIEW: PENDING VERIFICATION REQUESTS MANAGEMENT */}
        {/* ============================================================== */}
        {isPlatformAdmin && (
          <View style={styles.adminSection}>
            <View style={styles.adminHeaderRow}>
              <View style={styles.adminHeaderLeft}>
                <Ionicons name="shield-checkmark" size={18} color={AppColors.primary} />
                <Text style={styles.adminSectionTitle}>Pending Verifications</Text>
              </View>
              <View style={styles.pendingCountBadge}>
                <Text style={styles.pendingCountText}>{pendingRequests.length} Pending</Text>
              </View>
            </View>

            {pendingRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-done-circle-outline" size={40} color="#059669" />
                <Text style={styles.emptyTitle}>All Caught Up!</Text>
                <Text style={styles.emptySub}>No pending verification requests awaiting review.</Text>
              </View>
            ) : (
              pendingRequests.map((req) => (
                <View key={req.id} style={styles.applicantCard}>
                  <View style={styles.applicantHeader}>
                    <View style={styles.applicantAvatar}>
                      <Text style={styles.applicantAvatarText}>
                        {req.userFullName?.slice(0, 2).toUpperCase() || 'AL'}
                      </Text>
                    </View>
                    <View style={styles.applicantMeta}>
                      <Text style={styles.applicantName}>{req.userFullName}</Text>
                      <Text style={styles.applicantSub}>
                        {req.userRole} • {req.jnvName}
                      </Text>
                      <Text style={styles.applicantPhone}>{req.userPhone}</Text>
                    </View>
                  </View>

                  {req.remarks && (
                    <View style={styles.remarksBox}>
                      <Text style={styles.remarksLabel}>Note:</Text>
                      <Text style={styles.remarksText}>{req.remarks}</Text>
                    </View>
                  )}

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.reviewBtn, styles.approveBtn]}
                      onPress={() => handleReviewVerification(req.id, 'APPROVED')}
                      disabled={reviewingId === req.id}
                      activeOpacity={0.8}>
                      {reviewingId === req.id ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <View style={styles.btnContent}>
                          <Ionicons name="checkmark-sharp" size={16} color="#FFFFFF" />
                          <Text style={styles.approveBtnText}>Approve</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.reviewBtn, styles.rejectBtn]}
                      onPress={() => handleReviewVerification(req.id, 'REJECTED')}
                      disabled={reviewingId === req.id}
                      activeOpacity={0.8}>
                      <View style={styles.btnContent}>
                        <Ionicons name="close-sharp" size={16} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* ALUMNUS & JNV STAFF: VERIFICATION CARD */}
        {/* ============================================================== */}
        {(isAlumnus || isJnvAdmin) && (
          <View style={styles.verificationCard}>
            {isVerified ? (
              <View style={styles.verifRow}>
                <View style={[styles.verifIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="shield-checkmark" size={22} color="#059669" />
                </View>
                <View style={styles.verifTextCol}>
                  <Text style={styles.verifTitleSuccess}>Account 100% Verified</Text>
                  <Text style={styles.verifSub}>
                    You are verified by Navodisha. You can now mentor students and connect across VIDYALAYAS.
                  </Text>
                </View>
              </View>
            ) : isPending ? (
              <View style={styles.verifRow}>
                <View style={[styles.verifIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="time" size={22} color="#D97706" />
                </View>
                <View style={styles.verifTextCol}>
                  <Text style={styles.verifTitlePending}>Verification Pending Review</Text>
                  <Text style={styles.verifSub}>
                    Your verification request has been submitted and is under review by Platform Administrators.
                  </Text>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.verifRow}>
                  <View style={[styles.verifIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="shield-outline" size={22} color={AppColors.primary} />
                  </View>
                  <View style={styles.verifTextCol}>
                    <Text style={styles.verifTitle}>Get Verified by JNV Admin</Text>
                    <Text style={styles.verifSub}>
                      Zero friction verification. Request approval from your Vidyalaya staff with 1 tap.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={handleSubmitVerification}
                  disabled={submittingVerification}
                  activeOpacity={0.85}>
                  {submittingVerification ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.verifyBtnText}>Submit Verification Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* ALUMNUS CAREER & MENTORSHIP PROFILE */}
        {/* ============================================================== */}
        {fullProfile?.alumniDetails && (
          <View style={styles.detailsCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.detailsCardTitle}>Career & Mentorship Profile</Text>
              <View style={styles.mentorActiveBadge}>
                <Ionicons name="radio-button-on" size={10} color="#059669" />
                <Text style={styles.mentorActiveText}>Available to Guide</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Current Organization</Text>
              <Text style={styles.detailValue}>{fullProfile.alumniDetails.currentOrg || 'Not specified'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Designation</Text>
              <Text style={styles.detailValue}>{fullProfile.alumniDetails.designation || 'Not specified'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{fullProfile.alumniDetails.currentCity || 'Not specified'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Passed Out Batch</Text>
              <Text style={styles.detailValue}>{fullProfile.alumniDetails.joinBatchYear}</Text>
            </View>

            {fullProfile.alumniDetails.bio ? (
              <View style={styles.bioBox}>
                <Text style={styles.bioLabel}>Short Bio</Text>
                <Text style={styles.bioText}>{fullProfile.alumniDetails.bio}</Text>
              </View>
            ) : null}

            {fullProfile.alumniDetails.provideMentorshipsOn?.length > 0 && (
              <View style={styles.topicsSection}>
                <Text style={styles.topicsLabel}>Mentoring Topics</Text>
                <View style={styles.topicsRow}>
                  {fullProfile.alumniDetails.provideMentorshipsOn.map((t: string) => (
                    <View key={t} style={styles.topicBadge}>
                      <Text style={styles.topicBadgeText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* STUDENT SCHOLAR PROFILE */}
        {/* ============================================================== */}
        {fullProfile?.studentDetails && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsCardTitle}>Academic Details</Text>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Current Class</Text>
              <Text style={styles.detailValue}>{fullProfile.studentDetails.classLevel}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Academic Stream</Text>
              <Text style={styles.detailValue}>{fullProfile.studentDetails.stream || 'N/A'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>JNV House</Text>
              <Text style={styles.detailValue}>{fullProfile.studentDetails.house || 'N/A'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Admission Batch</Text>
              <Text style={styles.detailValue}>{fullProfile.studentDetails.joinBatchYear}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  logoutBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  fullName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  phoneText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  schoolInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  schoolText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  adminSection: {
    marginBottom: 16,
  },
  adminHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  adminHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  pendingCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pendingCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 2,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
  },
  applicantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  applicantHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  applicantAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicantAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primary,
  },
  applicantMeta: {
    flex: 1,
  },
  applicantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  applicantSub: {
    fontSize: 12,
    color: '#64748B',
  },
  applicantPhone: {
    fontSize: 11,
    color: '#94A3B8',
  },
  remarksBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  remarksLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 12,
    color: '#334155',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reviewBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: '#059669',
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  verifRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  verifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifTextCol: {
    flex: 1,
  },
  verifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  verifTitleSuccess: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  verifTitlePending: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 2,
  },
  verifSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  verifyBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  verifyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  mentorActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mentorActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  bioBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  bioLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  bioText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  topicsSection: {
    marginTop: 12,
  },
  topicsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.primary,
  },
});
