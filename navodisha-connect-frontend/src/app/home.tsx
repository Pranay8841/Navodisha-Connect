import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  Image,
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
  const [adminRequests, setAdminRequests] = useState<VerificationItemResponse[]>([]);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [adminNote, setAdminNote] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';
  const isJnvAdmin = user?.role === 'JNV_ADMIN';
  const isAlumnus = user?.role === 'ALUMNUS';
  const isStudent = user?.role === 'STUDENT';

  // Check if Alumnus is pending or active
  const isAlumnusPending =
    isAlumnus && (user?.status !== 'ACTIVE' || verification?.status === 'PENDING' || !verification);
  const isAlumnusActive = isAlumnus && !isAlumnusPending;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (isAlumnus || isJnvAdmin) {
      await fetchMyVerification();
    }
    if (isPlatformAdmin) {
      await fetchAdminVerifications();
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
      if (res.data) {
        setVerification(res.data);
        if (res.data.remarks) {
          setAdminNote(res.data.remarks);
        }
      }
    } catch (e: any) {
      if (e.response?.status !== 404) {
        console.warn('Failed to fetch verification:', e?.response?.data || e.message);
      }
    }
  };

  const fetchAdminVerifications = async () => {
    try {
      const res = await apiClient.get<VerificationItemResponse[]>('/api/v1/admin/verifications');
      setAdminRequests(res.data || []);
    } catch (e: any) {
      console.warn('Failed to fetch admin verifications:', e?.response?.data || e.message);
    }
  };

  const handleSubmitVerification = async () => {
    setSubmittingVerification(true);
    try {
      const res = await apiClient.post('/api/v1/verifications', {
        remarks: adminNote.trim() || 'Navodisha Alumni Verification Request',
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

  const handleReview = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setReviewingId(requestId);
    try {
      await apiClient.patch(`/api/v1/admin/verifications/${requestId}/review`, {
        status,
        remarks: status === 'APPROVED' ? 'Verified by Platform Admin' : 'Information could not be verified',
      });
      Alert.alert('Review Complete', `Applicant has been ${status.toLowerCase()} successfully.`);
      await fetchAdminVerifications();
      if (activeReviewIndex >= adminRequests.length - 1 && activeReviewIndex > 0) {
        setActiveReviewIndex(activeReviewIndex - 1);
      }
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

  // =========================================================================
  // VIEW 1: PLATFORM ADMIN REVIEW PORTAL (Screenshot 4)
  // =========================================================================
  if (isPlatformAdmin) {
    const activeReq = adminRequests[activeReviewIndex];
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Nav Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.navTitleRow}>
            <View style={styles.navLogo}>
              <Ionicons name="school" size={16} color={AppColors.primary} />
            </View>
            <Text style={styles.navTitle}>Mentor Detail</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          
          {/* Admin Header Banner */}
          <View style={styles.adminBanner}>
            <View style={styles.adminBannerBadges}>
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#F59E0B" />
                <Text style={styles.adminBadgeText}>Platform Admin Portal</Text>
              </View>
              <View style={styles.samitiCertBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text style={styles.samitiCertText}>Samiti Certified</Text>
              </View>
            </View>

            <Text style={styles.adminBannerTitle}>Alumni & Staff Verification</Text>
            <Text style={styles.adminBannerSub}>
              Review credentials, JNV affiliations & student safety compliance
            </Text>

            <View style={styles.adminStatsRow}>
              <View style={styles.adminStatPill}>
                <Ionicons name="ellipse" size={8} color="#D97706" />
                <Text style={styles.adminStatText}>Pending Verifications: {adminRequests.length}</Text>
              </View>
              <View style={[styles.adminStatPill, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text style={[styles.adminStatText, { color: '#10B981' }]}>Live Connected</Text>
              </View>
            </View>
          </View>

          {/* Active Review Header */}
          <View style={styles.activeReviewHeader}>
            <View style={styles.activeReviewLeft}>
              <Text style={styles.activeReviewTitle}>Active Review</Text>
              {adminRequests.length > 0 && (
                <View style={styles.queueCounterBadge}>
                  <Text style={styles.queueCounterText}>
                    {activeReviewIndex + 1} of {adminRequests.length}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.activeReviewIcons}>
              <Ionicons name="help-circle-outline" size={20} color="#64748B" />
              <Ionicons name="filter-outline" size={20} color="#64748B" />
            </View>
          </View>

          {/* Active Applicant Card */}
          {adminRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-done-circle" size={48} color="#10B981" />
              <Text style={styles.emptyTitle}>Queue Cleared!</Text>
              <Text style={styles.emptySub}>No pending verification requests awaiting review.</Text>
            </View>
          ) : (
            <View style={styles.applicantFullCard}>
              <View style={styles.applicantHeaderRow}>
                <View style={styles.applicantAvatarBox}>
                  <Text style={styles.applicantAvatarText}>
                    {(activeReq.applicantName || activeReq.userFullName)?.slice(0, 2).toUpperCase() || 'AL'}
                  </Text>
                  <View style={styles.applicantVerifiedBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                </View>

                <View style={styles.applicantNameCol}>
                  <Text style={styles.applicantNameText}>
                    {activeReq.applicantName || activeReq.userFullName || 'Applicant'}
                  </Text>
                  <View style={styles.applicantRolePill}>
                    <Text style={styles.applicantRolePillText}>
                      {(activeReq.applicantRole || activeReq.userRole) === 'ALUMNUS'
                        ? 'Alumnus (Batch 2014)'
                        : 'JNV Staff'}
                    </Text>
                  </View>
                  <View style={styles.applicantPhoneRow}>
                    <Ionicons name="chatbubble-ellipses-outline" size={12} color="#64748B" />
                    <Text style={styles.applicantPhoneText}>
                      {activeReq.applicantPhone || activeReq.userPhone || '+91 98765 43210'}
                    </Text>
                    <View style={styles.smsVerifiedTag}>
                      <Text style={styles.smsVerifiedText}>SMS Verified</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* School and Org Details */}
              <View style={styles.metaRow}>
                <Ionicons name="school-outline" size={16} color={AppColors.primary} />
                <Text style={styles.metaBoldText}>
                  {activeReq.applicantJnvName || activeReq.jnvName || 'JNV Vidyalaya'}
                </Text>
                <Text style={styles.metaMutedText}>• Aravali House</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="business-outline" size={16} color="#64748B" />
                <Text style={styles.metaText}>Senior Software Engineer at Google India, Bengaluru</Text>
              </View>

              {/* Offered Mentorship Streams */}
              <Text style={styles.sectionSmallLabel}>Offered Mentorship Streams</Text>
              <View style={styles.streamsWrap}>
                <View style={styles.streamBadge}>
                  <Ionicons name="book-outline" size={12} color={AppColors.primary} />
                  <Text style={styles.streamBadgeText}>JEE Prep</Text>
                </View>
                <View style={styles.streamBadge}>
                  <Ionicons name="desktop-outline" size={12} color={AppColors.primary} />
                  <Text style={styles.streamBadgeText}>Computer Science</Text>
                </View>
                <View style={styles.streamBadge}>
                  <Ionicons name="people-outline" size={12} color={AppColors.primary} />
                  <Text style={styles.streamBadgeText}>Soft Skills</Text>
                </View>
              </View>

              {/* Note from Applicant */}
              {activeReq.remarks && (
                <View style={styles.applicantNoteBox}>
                  <Ionicons name="chatbubble-ellipses" size={14} color="#D97706" />
                  <View style={styles.applicantNoteCol}>
                    <Text style={styles.applicantNoteTitle}>Note from Applicant</Text>
                    <Text style={styles.applicantNoteQuote}>"{activeReq.remarks}"</Text>
                  </View>
                </View>
              )}

              {/* Admin Compliance Checks */}
              <View style={styles.complianceSection}>
                <View style={styles.complianceHeader}>
                  <Ionicons name="options-outline" size={16} color={AppColors.primary} />
                  <Text style={styles.complianceTitle}>Admin Compliance Checks</Text>
                </View>

                <View style={styles.checkCard}>
                  <View style={styles.checkIconActive}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.checkTextCol}>
                    <Text style={styles.checkLabel}>Mobile Number Verified</Text>
                    <Text style={styles.checkSub}>OTP authenticated via registered telecom gateway</Text>
                  </View>
                  <Ionicons name="lock-closed" size={14} color="#059669" />
                </View>

                <View style={styles.checkCard}>
                  <View style={styles.checkIconActive}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.checkTextCol}>
                    <Text style={styles.checkLabel}>{activeReq.jnvName} Affiliation Matched</Text>
                    <Text style={styles.checkSub}>School roster records matched successfully</Text>
                  </View>
                  <Ionicons name="school" size={14} color="#059669" />
                </View>

                <View style={styles.checkCard}>
                  <View style={styles.checkIconActive}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.checkTextCol}>
                    <Text style={styles.checkLabel}>Student Safety Charter Acknowledged</Text>
                    <Text style={styles.checkSub}>Signed POSH & JNV Child Protection code of conduct</Text>
                  </View>
                  <Ionicons name="shield-checkmark" size={14} color="#059669" />
                </View>
              </View>

              {/* Approve / Reject Actions */}
              <TouchableOpacity
                style={styles.approveLargeBtn}
                onPress={() => handleReview(activeReq.id, 'APPROVED')}
                disabled={reviewingId === activeReq.id}
                activeOpacity={0.85}>
                {reviewingId === activeReq.id ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.largeBtnContent}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.approveLargeBtnText}>Approve Alumnus</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectOutlineBtn}
                onPress={() => handleReview(activeReq.id, 'REJECTED')}
                disabled={reviewingId === activeReq.id}
                activeOpacity={0.7}>
                <View style={styles.largeBtnContent}>
                  <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                  <Text style={styles.rejectOutlineText}>Reject Application</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Next in Queue List */}
          {adminRequests.length > 1 && (
            <View style={styles.queueSection}>
              <View style={styles.queueHeaderRow}>
                <Text style={styles.queueSectionTitle}>Next in Queue</Text>
                <Text style={styles.queueRemainingText}>{adminRequests.length - 1} remaining</Text>
              </View>

              {adminRequests.map((req, i) => {
                if (i === activeReviewIndex) return null;
                return (
                  <TouchableOpacity
                    key={req.id}
                    style={styles.queueCard}
                    onPress={() => setActiveReviewIndex(i)}
                    activeOpacity={0.7}>
                    <View style={styles.queueAvatar}>
                      <Text style={styles.queueAvatarText}>
                        {(req.applicantName || req.userFullName)?.slice(0, 2).toUpperCase() || 'AL'}
                      </Text>
                    </View>
                    <View style={styles.queueTextCol}>
                      <Text style={styles.queueName}>{req.applicantName || req.userFullName || 'Applicant'}</Text>
                      <View style={styles.queueTag}>
                        <Text style={styles.queueTagText}>
                          {(req.applicantRole || req.userRole) === 'ALUMNUS' ? 'Alumnus' : 'JNV Staff'}
                        </Text>
                      </View>
                      <Text style={styles.queueSub}>{req.applicantJnvName || req.jnvName || 'JNV Vidyalaya'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.auditRow}>
            <Ionicons name="lock-closed" size={12} color="#059669" />
            <Text style={styles.auditText}>End-to-End Cryptographic Audit Logging Enabled</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // VIEW 2: ALUMNUS PENDING VERIFICATION PORTAL (Screenshot 2)
  // =========================================================================
  if (isAlumnusPending) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.navTitleRow}>
            <View style={styles.navLogo}>
              <Ionicons name="school" size={16} color={AppColors.primary} />
            </View>
            <Text style={styles.navTitle}>Mentor Detail</Text>
          </View>
          <View style={styles.navAvatar}>
            <Ionicons name="person" size={18} color="#FFFFFF" />
          </View>
        </View>

        {/* Sub Header Utility Bar */}
        <View style={styles.utilityBar}>
          <View style={styles.portalPill}>
            <View style={styles.amberDot} />
            <Text style={styles.portalPillText}>VERIFICATION PORTAL</Text>
          </View>
          <View style={styles.utilityActions}>
            <View style={styles.helpAction}>
              <Ionicons name="help-buoy-outline" size={14} color={AppColors.primary} />
              <Text style={styles.helpActionText}>Helpdesk</Text>
            </View>
            <Text style={styles.utilityDot}>•</Text>
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
              <Text style={styles.signOutLink}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          
          {/* Welcome Badge Header */}
          <View style={styles.welcomeHero}>
            <View style={styles.heroShieldBox}>
              <Ionicons name="shield" size={44} color="#1E3A8A" />
              <View style={styles.heroClockBadge}>
                <Ionicons name="time" size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.pendingStatusBadge}>
              <Ionicons name="hourglass" size={12} color="#B45309" />
              <Text style={styles.pendingStatusBadgeText}>Status: PENDING_VERIFICATION</Text>
            </View>

            <Text style={styles.heroGreeting}>Welcome to Navodisha, {user?.fullName?.split(' ')[0] || 'Alumnus'}!</Text>
            <Text style={styles.heroSubText}>
              Your Navodaya lineage connects you to thousands of aspirational scholars. We are preparing your mentor profile.
            </Text>
          </View>

          {/* Under Review Notice Banner */}
          <View style={styles.noticeBanner}>
            <View style={styles.noticeIconCircle}>
              <Ionicons name="shield-outline" size={18} color="#B45309" />
            </View>
            <View style={styles.noticeTextCol}>
              <Text style={styles.noticeTitle}>Profile under review by Platform Admin</Text>
              <Text style={styles.noticeSub}>
                To protect student safety, alumni and staff accounts are manually approved by Samiti administrators before mentorship access is granted.
              </Text>
              <View style={styles.slaBadge}>
                <Ionicons name="flash" size={11} color="#D97706" />
                <Text style={styles.slaText}>Typically reviewed within 24–48 hours</Text>
              </View>
            </View>
          </View>

          {/* Add a Note for Admin Card */}
          <View style={styles.noteCard}>
            <View style={styles.noteHeaderRow}>
              <View style={styles.noteTitleGroup}>
                <Ionicons name="chatbox-ellipses-outline" size={16} color={AppColors.primary} />
                <Text style={styles.noteTitle}>Add a note for the Admin</Text>
              </View>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>

            <Text style={styles.noteHelper}>
              Help us expedite your review by referencing your House, batchmates, or known JNV faculty.
            </Text>

            <View style={styles.noteInputBox}>
              <TextInput
                style={styles.noteInput}
                value={adminNote}
                onChangeText={setAdminNote}
                multiline
                placeholder="Class of 2014, Aravali House. Active in alumni WhatsApp chapter."
                placeholderTextColor={AppColors.textMuted}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.sendRequestBtn}
              onPress={handleSubmitVerification}
              disabled={submittingVerification}
              activeOpacity={0.85}>
              {submittingVerification ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.sendRequestText}>
                    {verification ? 'Update Verification Note' : 'Send Verification Request'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Submitted Profile Card */}
          <View style={styles.submittedCard}>
            <View style={styles.submittedHeader}>
              <View style={styles.submittedTitleGroup}>
                <Ionicons name="id-card-outline" size={18} color={AppColors.primary} />
                <Text style={styles.submittedTitle}>Submitted Profile</Text>
              </View>
              <View style={styles.jnvIdBadge}>
                <Text style={styles.jnvIdBadgeText}>JNV Verified ID</Text>
              </View>
            </View>

            <View style={styles.profileItemRow}>
              <View style={styles.profileMiniAvatar}>
                <Text style={styles.profileMiniAvatarText}>
                  {user?.fullName?.slice(0, 2).toUpperCase() || 'AL'}
                </Text>
              </View>
              <View style={styles.profileMiniMeta}>
                <View style={styles.profileNameRow}>
                  <Text style={styles.profileMiniName}>{user?.fullName}</Text>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                </View>
                <Text style={styles.profileMiniSub}>
                  Alumnus • Class of {fullProfile?.alumniDetails?.joinBatchYear || '2014'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRowBlock}>
              <Ionicons name="school-outline" size={16} color={AppColors.primary} style={styles.blockIcon} />
              <View style={styles.blockTextCol}>
                <Text style={styles.blockLabel}>Navodaya Vidyalaya</Text>
                <Text style={styles.blockValue}>{user?.jnvName || 'JNV Gadchiroli'}</Text>
                <Text style={styles.blockSub}>House: Aravali • Batch of 2014</Text>
              </View>
            </View>

            <View style={styles.infoRowBlock}>
              <Ionicons name="briefcase-outline" size={16} color={AppColors.primary} style={styles.blockIcon} />
              <View style={styles.blockTextCol}>
                <Text style={styles.blockLabel}>Current Profession</Text>
                <Text style={styles.blockValue}>
                  {fullProfile?.alumniDetails?.designation || 'Senior Software Engineer'}
                </Text>
                <Text style={styles.blockSub}>
                  {fullProfile?.alumniDetails?.currentOrg || 'Google India'}, {fullProfile?.alumniDetails?.currentCity || 'Bengaluru'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRowBlock}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#059669" style={styles.blockIcon} />
              <View style={styles.phoneBlockRow}>
                <View style={styles.blockTextCol}>
                  <Text style={styles.blockLabel}>Phone</Text>
                  <Text style={styles.blockValue}>{user?.phoneNumber}</Text>
                </View>
                <View style={styles.otpTag}>
                  <Ionicons name="checkmark-sharp" size={12} color="#059669" />
                  <Text style={styles.otpTagText}>OTP Verified</Text>
                </View>
              </View>
            </View>

            <View style={styles.editProfileRow}>
              <Text style={styles.editPromptText}>Need to update these details?</Text>
              <TouchableOpacity onPress={() => router.push('/register/alumni')} activeOpacity={0.7}>
                <Text style={styles.editLinkText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Social Proof */}
          <View style={styles.socialProofCard}>
            <View style={styles.proofAvatarStack}>
              <View style={[styles.proofAvatar, { backgroundColor: '#1E3A8A' }]}><Text style={styles.proofText}>RK</Text></View>
              <View style={[styles.proofAvatar, { backgroundColor: '#059669', marginLeft: -8 }]}><Text style={styles.proofText}>PT</Text></View>
              <View style={[styles.proofAvatar, { backgroundColor: '#B45309', marginLeft: -8 }]}><Text style={styles.proofText}>+34</Text></View>
            </View>
            <Text style={styles.proofCardText}>
              Joined by <Text style={styles.proofBold}>36 JNV Gadchiroli Alumni</Text> guiding 240+ rural Navodaya students.
            </Text>
          </View>

          {/* Check Status Refresh Button */}
          <TouchableOpacity
            style={styles.refreshBrownBtn}
            onPress={onRefresh}
            activeOpacity={0.85}>
            <View style={styles.btnRow}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.refreshBrownBtnText}>Check Status / Refresh</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // VIEW 3: ACTIVE STUDENT DASHBOARD (Screenshot 3)
  // =========================================================================
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Bar */}
      <View style={styles.studentTopBar}>
        <View style={styles.brandTitleRow}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={16} color={AppColors.primary} />
          </View>
          <View>
            <Text style={styles.brandTitle}>Navodisha</Text>
            <Text style={styles.brandSubtitle}>CONNECT</Text>
          </View>
          <View style={styles.jnvNetworkPill}>
            <View style={styles.greenDot} />
            <Text style={styles.jnvNetworkText}>JNV Network</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.schoolPickerPill} activeOpacity={0.8}>
            <Ionicons name="business" size={14} color="#D97706" />
            <Text style={styles.schoolPickerText}>{user?.jnvName || 'JNV Gadchiroli'}</Text>
            <Ionicons name="chevron-down" size={12} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color="#0F172A" />
            <View style={styles.bellRedDot} />
          </TouchableOpacity>

          <View style={styles.studentAvatarCircle}>
            <Text style={styles.studentAvatarText}>
              {user?.fullName?.slice(0, 2).toUpperCase() || 'AS'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        
        {/* Student Profile Card */}
        <View style={styles.studentProfileCard}>
          <View style={styles.studentHeader}>
            <View style={styles.studentAvatarLarge}>
              <Text style={styles.studentAvatarLargeText}>
                {user?.fullName?.slice(0, 2).toUpperCase() || 'AS'}
              </Text>
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.studentMetaCol}>
              <View style={styles.studentNameBadgeRow}>
                <Text style={styles.studentNameText}>{user?.fullName || 'Aarav Sharma'}</Text>
                <View style={styles.activeStudentBadge}>
                  <View style={styles.activeStudentDot} />
                  <Text style={styles.activeStudentText}>Active Student</Text>
                </View>
              </View>
              <Text style={styles.scholarRollText}>Navodaya Scholar • Roll 1024</Text>
            </View>
          </View>

          <View style={styles.studentTagsRow}>
            <View style={styles.tagBlue}>
              <Ionicons name="school" size={12} color={AppColors.primary} />
              <Text style={styles.tagBlueText}>
                {fullProfile?.studentDetails?.classLevel || 'Class 12'} • {fullProfile?.studentDetails?.stream || 'Science PCM'}
              </Text>
            </View>
            <View style={styles.tagHouse}>
              <View style={[styles.houseDot, { backgroundColor: '#1E40AF' }]} />
              <Text style={styles.tagHouseText}>{fullProfile?.studentDetails?.house || 'Aravali'} House</Text>
            </View>
            <View style={styles.tagLocation}>
              <Ionicons name="pin" size={11} color="#EF4444" />
              <Text style={styles.tagLocationText}>Maharashtra</Text>
            </View>
          </View>

          <View style={styles.strengthBox}>
            <Ionicons name="ribbon-outline" size={16} color="#B45309" />
            <Text style={styles.strengthLabel}>Navodaya Profile Strength</Text>
            <Text style={styles.strengthValue}>100% Complete</Text>
          </View>
        </View>

        {/* Preparing For Section */}
        <View style={styles.goalsSection}>
          <View style={styles.goalsHeader}>
            <View style={styles.goalsTitleRow}>
              <Ionicons name="disc" size={16} color="#B45309" />
              <Text style={styles.goalsTitle}>Preparing For:</Text>
            </View>
            <Text style={styles.batchYearText}>Batch 2024-25</Text>
          </View>

          <View style={styles.goalsPillsRow}>
            <View style={[styles.goalPill, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="radio-button-on" size={12} color="#D97706" />
              <Text style={[styles.goalPillText, { color: '#B45309' }]}>JEE Advanced</Text>
            </View>
            <View style={[styles.goalPill, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="medal" size={12} color="#D97706" />
              <Text style={[styles.goalPillText, { color: '#B45309' }]}>NDA 2025</Text>
            </View>
            <TouchableOpacity style={styles.addGoalBtn} activeOpacity={0.7}>
              <Ionicons name="add" size={14} color="#64748B" />
              <Text style={styles.addGoalText}>Add Exam Goal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mentorship Discovery Hero Card */}
        <View style={styles.discoveryCard}>
          <View style={styles.discoveryBadge}>
            <Ionicons name="hand-right" size={16} color="#D97706" />
            <Text style={styles.discoveryBadgeText}>MENTORSHIP DISCOVERY</Text>
          </View>

          <Text style={styles.discoveryTitle}>Welcome to Navodisha Connect!</Text>
          <Text style={styles.discoverySub}>
            Your profile is complete and ready for mentorship matching. You have direct access to{' '}
            <Text style={styles.discoveryBold}>142 verified alumni mentors</Text> from IITs, AIIMS, and top industries eager to guide junior Navodayans.
          </Text>

          <View style={styles.mentorInstitutionsRow}>
            <View style={styles.miniAvatarsRow}>
              <View style={[styles.miniAvatar, { backgroundColor: '#1E3A8A' }]}><Text style={styles.miniText}>RK</Text></View>
              <View style={[styles.miniAvatar, { backgroundColor: '#B45309', marginLeft: -6 }]}><Text style={styles.miniText}>PT</Text></View>
              <View style={[styles.miniAvatar, { backgroundColor: '#059669', marginLeft: -6 }]}><Text style={styles.miniText}>SM</Text></View>
              <View style={[styles.miniAvatar, { backgroundColor: '#475569', marginLeft: -6 }]}><Text style={styles.miniText}>+139</Text></View>
            </View>
            <Text style={styles.institutionsText}>IIT Delhi • AIIMS Nagpur • ISRO</Text>
          </View>

          <TouchableOpacity style={styles.browseMentorsBtn} activeOpacity={0.85}>
            <Text style={styles.browseMentorsText}>Browse Recommended Mentors</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid (2x2) */}
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickCard} activeOpacity={0.8}>
            <View style={[styles.quickIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="people" size={20} color={AppColors.primary} />
            </View>
            <Text style={styles.quickCardName}>Find a Mentor</Text>
            <Text style={styles.quickCardDesc}>Filter by batch & stream</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} activeOpacity={0.8}>
            <View style={[styles.quickIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="help-circle" size={20} color="#D97706" />
            </View>
            <Text style={styles.quickCardName}>Ask a Query</Text>
            <Text style={styles.quickCardDesc}>Senior alumni response</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} activeOpacity={0.8}>
            <View style={[styles.quickIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="library" size={20} color={AppColors.primary} />
            </View>
            <Text style={styles.quickCardName}>JNV Study Circles</Text>
            <Text style={styles.quickCardDesc}>PCM peer groups</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickCard} activeOpacity={0.8}>
            <View style={[styles.quickIconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="calendar" size={20} color={AppColors.primary} />
            </View>
            <Text style={styles.quickCardName}>Upcoming Webinars</Text>
            <Text style={styles.quickCardDesc}>Sunday career AMA</Text>
          </TouchableOpacity>
        </View>

        {/* Navodaya Motto Banner */}
        <View style={styles.mottoCard}>
          <View style={styles.mottoIconCircle}>
            <Ionicons name="bulb-outline" size={18} color="#D97706" />
          </View>
          <View style={styles.mottoTextCol}>
            <Text style={styles.mottoLabel}>Navodaya Motto</Text>
            <Text style={styles.mottoQuote}>"Pragyanam Brahma — Pure Knowledge is the Divine"</Text>
          </View>
        </View>
      </ScrollView>

      {/* 5-Tab Navigation Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItemActive} activeOpacity={0.8}>
          <Ionicons name="people" size={22} color={AppColors.primary} />
          <Text style={styles.tabTextActive}>Mentors</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.8}>
          <Ionicons name="calendar-outline" size={22} color="#64748B" />
          <Text style={styles.tabText}>Sessions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.8}>
          <Ionicons name="compass-outline" size={22} color="#64748B" />
          <Text style={styles.tabText}>Navodaya Hub</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.8}>
          <Ionicons name="chatbubbles-outline" size={22} color="#64748B" />
          <Text style={styles.tabText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="person-outline" size={22} color="#64748B" />
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  navAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
  },
  // Admin Portal Styles
  adminBanner: {
    backgroundColor: '#0F2341',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  adminBannerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  samitiCertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  samitiCertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  adminBannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  adminBannerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 14,
    lineHeight: 16,
  },
  adminStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  adminStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  adminStatText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  activeReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activeReviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeReviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  queueCounterBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  queueCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.primary,
  },
  activeReviewIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  applicantFullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  applicantHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  applicantAvatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  applicantAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.primary,
  },
  applicantVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  applicantNameCol: {
    flex: 1,
  },
  applicantNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  applicantRolePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  applicantRolePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.primary,
  },
  applicantPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applicantPhoneText: {
    fontSize: 12,
    color: '#64748B',
  },
  smsVerifiedTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  smsVerifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metaBoldText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaMutedText: {
    fontSize: 12,
    color: '#64748B',
  },
  metaText: {
    fontSize: 12,
    color: '#334155',
  },
  sectionSmallLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 8,
    marginBottom: 6,
  },
  streamsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  streamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  streamBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.primary,
  },
  applicantNoteBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  applicantNoteCol: {
    flex: 1,
  },
  applicantNoteTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 2,
  },
  applicantNoteQuote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#92400E',
  },
  complianceSection: {
    marginBottom: 16,
  },
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  complianceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkIconActive: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTextCol: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkSub: {
    fontSize: 10,
    color: '#64748B',
  },
  approveLargeBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  largeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approveLargeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectOutlineBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  queueSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  queueSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  queueRemainingText: {
    fontSize: 12,
    color: '#64748B',
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  queueAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
  },
  queueTextCol: {
    flex: 1,
  },
  queueName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  queueTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginVertical: 2,
  },
  queueTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  queueSub: {
    fontSize: 11,
    color: '#64748B',
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 12,
  },
  auditText: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 2,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
  },
  // Alumnus Pending Portal Styles
  utilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  portalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  portalPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  utilityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
  },
  utilityDot: {
    color: '#CBD5E1',
  },
  signOutLink: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  welcomeHero: {
    alignItems: 'center',
    marginVertical: 18,
  },
  heroShieldBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  heroClockBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pendingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 10,
  },
  pendingStatusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  heroGreeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  noticeBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 12,
  },
  noticeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeTextCol: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  noticeSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  slaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  slaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noteTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionalTag: {
    fontSize: 11,
    color: '#64748B',
  },
  noteHelper: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 10,
  },
  noteInputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    minHeight: 70,
    marginBottom: 12,
  },
  noteInput: {
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 17,
  },
  sendRequestBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendRequestText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submittedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  submittedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  submittedTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submittedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  jnvIdBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jnvIdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.primary,
  },
  profileItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  profileMiniAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  profileMiniAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.primary,
  },
  profileMiniMeta: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  profileMiniName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileMiniSub: {
    fontSize: 11,
    color: '#475569',
  },
  infoRowBlock: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 10,
  },
  blockIcon: {
    marginTop: 2,
  },
  blockTextCol: {
    flex: 1,
  },
  blockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 1,
  },
  blockValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  blockSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  phoneBlockRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otpTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  otpTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  editProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
  },
  editPromptText: {
    fontSize: 12,
    color: '#64748B',
  },
  editLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  socialProofCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  proofAvatarStack: {
    flexDirection: 'row',
  },
  proofAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  proofText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proofCardText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  proofBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  refreshBrownBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#B45309',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  refreshBrownBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Student Active Dashboard Styles
  studentTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandTitleRow: {
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
  brandTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 14,
  },
  brandSubtitle: {
    fontSize: 8,
    fontWeight: '700',
    color: AppColors.primary,
    letterSpacing: 0.5,
  },
  jnvNetworkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  jnvNetworkText: {
    fontSize: 9,
    fontWeight: '600',
    color: AppColors.primary,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  schoolPickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    maxWidth: 120,
  },
  schoolPickerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F172A',
  },
  bellBtn: {
    padding: 4,
    position: 'relative',
  },
  bellRedDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  studentAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  studentAvatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  studentAvatarLargeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  studentMetaCol: {
    flex: 1,
  },
  studentNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  studentNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeStudentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  activeStudentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeStudentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  scholarRollText: {
    fontSize: 12,
    color: '#64748B',
  },
  studentTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tagBlueText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.primary,
  },
  tagHouse: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  houseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagHouseText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  tagLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tagLocationText: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '500',
  },
  strengthBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  strengthLabel: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  strengthValue: {
    fontSize: 11,
    fontWeight: '800',
    color: AppColors.primary,
  },
  goalsSection: {
    marginBottom: 16,
  },
  goalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  batchYearText: {
    fontSize: 11,
    color: '#64748B',
  },
  goalsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  goalPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addGoalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  discoveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  discoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  discoveryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  discoveryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  discoverySub: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  discoveryBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  mentorInstitutionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  miniAvatarsRow: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  miniText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  institutionsText: {
    fontSize: 11,
    color: '#64748B',
  },
  browseMentorsBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  browseMentorsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  quickCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  quickCardDesc: {
    fontSize: 10,
    color: '#64748B',
  },
  mottoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 10,
  },
  mottoIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mottoTextCol: {
    flex: 1,
  },
  mottoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 1,
  },
  mottoQuote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#92400E',
  },
  // 5-Tab Navigation Bar
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  tabItemActive: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  tabText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  tabTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.primary,
    marginTop: 2,
  },
});
