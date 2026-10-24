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
  Switch,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { verificationApi } from '../api/verification';
import { adminApi } from '../api/admin';
import { userApi } from '../api/user';
import { UserResponse, VerificationItemResponse } from '../api/types';

export default function HomeScreen() {
  const router = useRouter();
  const { user, fullProfile, refreshProfile, logout } = useAuth();

  // Tab State: default to 'HOME'
  const [currentTab, setCurrentTab] = useState<'HOME' | 'MENTORS' | 'REQUESTS' | 'MY_ASKS' | 'ALUMNI' | 'SESSIONS' | 'CHAT' | 'PROFILE' | 'USERS' | 'REPORTS'>('HOME');

  // Sub-tab Segmented States
  const [studentSessionSubTab, setStudentSessionSubTab] = useState<'REQUESTS' | 'SESSIONS'>('REQUESTS');
  const [alumnusRequestSubTab, setAlumnusRequestSubTab] = useState<'STUDENTS' | 'JNV_ASKS'>('STUDENTS');

  // Filter & Search mock states
  const [searchMentorQuery, setSearchMentorQuery] = useState('');
  const [selectedFieldChip, setSelectedFieldChip] = useState('All');
  const [selectedModeFilter, setSelectedModeFilter] = useState('All Modes');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState('All');

  // Notifications Modal State
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Common verification & admin states
  const [verification, setVerification] = useState<VerificationItemResponse | null>(null);
  const [adminRequests, setAdminRequests] = useState<VerificationItemResponse[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserResponse[]>([]);
  const [adminTab, setAdminTab] = useState<'VERIFICATIONS' | 'USERS'>('VERIFICATIONS');
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [adminNote, setAdminNote] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const activeReq = adminRequests[activeReviewIndex];

  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';
  const isJnvAdmin = user?.role === 'JNV_ADMIN';
  const isAlumnus = user?.role === 'ALUMNUS';
  const isStudent = user?.role === 'STUDENT';

  // An alumnus or staff member is pending if status is PENDING_VERIFICATION (or verification request is not yet approved)
  const isAccountPending =
    (isAlumnus || isJnvAdmin) &&
    (user?.status === 'PENDING_VERIFICATION' || (verification && verification.status !== 'APPROVED'));

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (isAlumnus || isJnvAdmin) {
      await fetchMyVerification();
    }
    if (isPlatformAdmin) {
      await Promise.all([fetchAdminVerifications(), fetchAdminPendingUsers()]);
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
      const data = await verificationApi.getMyVerification();
      setVerification(data);
      if (data?.remarks) {
        setAdminNote(data.remarks);
      }
    } catch (e: any) {
      console.warn('Failed to fetch verification status:', e?.response?.data || e.message);
    }
  };

  const fetchAdminVerifications = async () => {
    try {
      const data = await adminApi.getPendingVerifications();
      setAdminRequests(data);
    } catch (e: any) {
      console.warn('Failed to fetch admin verifications:', e?.response?.data || e.message);
    }
  };

  const fetchAdminPendingUsers = async () => {
    try {
      const data = await adminApi.getPendingUsers();
      setPendingUsers(data);
    } catch (e: any) {
      console.warn('Failed to fetch pending users:', e?.response?.data || e.message);
    }
  };

  const handleSubmitVerification = async () => {
    setSubmittingVerification(true);
    try {
      const res = await verificationApi.submitVerification(adminNote);
      setVerification(res);
      Alert.alert(
        'Request Submitted! 🎉',
        'Your verification request has been queued for administrative review.'
      );
      await refreshProfile();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to submit verification.';
      Alert.alert('Submission Error', msg);
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleReviewVerification = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(requestId);
    try {
      await adminApi.reviewVerification(requestId, {
        status,
        remarks: status === 'APPROVED' ? 'Approved by Platform Admin' : 'Information could not be verified',
      });
      Alert.alert('Review Complete', `Applicant verification has been ${status.toLowerCase()} successfully.`);
      await Promise.all([fetchAdminVerifications(), fetchAdminPendingUsers()]);
      if (activeReviewIndex >= adminRequests.length - 1 && activeReviewIndex > 0) {
        setActiveReviewIndex(activeReviewIndex - 1);
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to review request.';
      Alert.alert('Review Error', msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateUserStatus = async (
    targetUserId: string,
    newStatus: 'ACTIVE' | 'SUSPENDED'
  ) => {
    setProcessingId(targetUserId);
    try {
      await adminApi.updateUserStatus(targetUserId, {
        status: newStatus,
        remarks: `Status set to ${newStatus} by Platform Admin`,
      });
      Alert.alert('User Updated', `Account status changed to ${newStatus}.`);
      await Promise.all([fetchAdminVerifications(), fetchAdminPendingUsers()]);
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to update user status.';
      Alert.alert('Update Error', msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleMentorAvailability = async (value: boolean) => {
    if (!fullProfile?.alumniDetails) return;
    try {
      await userApi.updateAlumniProfile({
        joinBatchYear: fullProfile.alumniDetails.joinBatchYear,
        currentOrg: fullProfile.alumniDetails.currentOrg,
        designation: fullProfile.alumniDetails.designation,
        currentCity: fullProfile.alumniDetails.currentCity,
        bio: fullProfile.alumniDetails.bio,
        provideMentorshipsOn: fullProfile.alumniDetails.provideMentorshipsOn,
        willingModes: fullProfile.alumniDetails.willingModes,
        openToHelp: value,
      });
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update mentorship availability.');
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
  // ROLE NAVIGATION DEFINITIONS
  // =========================================================================
  let tabs: Array<{
    key: 'HOME' | 'MENTORS' | 'REQUESTS' | 'MY_ASKS' | 'ALUMNI' | 'SESSIONS' | 'CHAT' | 'PROFILE' | 'USERS' | 'REPORTS';
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
    badge?: string;
    hasDot?: boolean;
  }> = [];

  if (isPlatformAdmin) {
    tabs = [
      {
        key: 'HOME',
        label: 'Verifications',
        icon: 'shield-checkmark-outline',
        activeIcon: 'shield-checkmark',
        badge: adminRequests.length > 0 ? String(adminRequests.length) : undefined,
      },
      {
        key: 'USERS',
        label: 'Users',
        icon: 'people-outline',
        activeIcon: 'people',
        badge: pendingUsers.length > 0 ? String(pendingUsers.length) : undefined,
      },
      {
        key: 'REPORTS',
        label: 'Reports',
        icon: 'bar-chart-outline',
        activeIcon: 'bar-chart',
      },
      {
        key: 'PROFILE',
        label: 'Profile',
        icon: 'person-circle-outline',
        activeIcon: 'person-circle',
      },
    ];
  } else if (isAccountPending) {
    tabs = [
      { key: 'HOME', label: 'Home', icon: 'shield-outline', activeIcon: 'shield' },
      { key: 'PROFILE', label: 'Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
    ];
  } else if (isStudent) {
    tabs = [
      { key: 'HOME', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
      { key: 'MENTORS', label: 'Mentors', icon: 'people-outline', activeIcon: 'people' },
      { key: 'SESSIONS', label: 'Sessions', icon: 'calendar-outline', activeIcon: 'calendar', hasDot: true },
      { key: 'CHAT', label: 'Chat', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', badge: '3' },
      { key: 'PROFILE', label: 'Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
    ];
  } else if (isAlumnus) {
    tabs = [
      { key: 'HOME', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
      { key: 'REQUESTS', label: 'Requests', icon: 'git-pull-request-outline', activeIcon: 'git-pull-request', hasDot: true },
      { key: 'SESSIONS', label: 'Sessions', icon: 'calendar-outline', activeIcon: 'calendar' },
      { key: 'CHAT', label: 'Chat', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', badge: '2' },
      { key: 'PROFILE', label: 'Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
    ];
  } else if (isJnvAdmin) {
    tabs = [
      { key: 'HOME', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
      { key: 'MY_ASKS', label: 'My Asks', icon: 'megaphone-outline', activeIcon: 'megaphone', badge: '1' },
      { key: 'ALUMNI', label: 'Alumni', icon: 'school-outline', activeIcon: 'school' },
      { key: 'CHAT', label: 'Chat', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', badge: '1' },
      { key: 'PROFILE', label: 'Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
    ];
  }

  // Ensure currentTab is valid for current role
  const isCurrentTabValid = tabs.some((t) => t.key === currentTab);
  const activeTabKey = isCurrentTabValid ? currentTab : 'HOME';

  // =========================================================================
  // RENDER CONTENT BASED ON ROLE AND ACTIVE TAB
  // =========================================================================

  // Development phase badge helper
  const renderDevBadge = (featureName: string) => (
    <View style={styles.devBanner}>
      <View style={styles.devIconBox}>
        <Ionicons name="construct-outline" size={16} color={AppColors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.devBannerTitle}>{featureName} • In Active Development</Text>
        <Text style={styles.devBannerSub}>
          Interactive prototype preview connected to Navodisha Mentorship Engine.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Universal Top Bar with Role / JNV & Notification Bell */}
      <View style={styles.topBar}>
        <View style={styles.navTitleRow}>
          <View style={styles.navLogo}>
            <Ionicons
              name={
                isPlatformAdmin
                  ? 'shield-checkmark'
                  : isAccountPending
                  ? 'shield-outline'
                  : isStudent
                  ? 'school'
                  : isAlumnus
                  ? 'ribbon'
                  : 'business'
              }
              size={18}
              color={isAccountPending ? '#D97706' : AppColors.primary}
            />
          </View>
          <View>
            <Text style={styles.navTitle}>
              {tabs.find((t) => t.key === activeTabKey)?.label || 'Navodisha Connect'}
            </Text>
            <Text style={styles.navSubtitle} numberOfLines={1}>
              {isPlatformAdmin
                ? 'Samiti Verification & Compliance'
                : `${user?.jnvName || 'Navodaya Vidyalaya'} • ${user?.role?.replace('_', ' ')}`}
            </Text>
          </View>
        </View>

        {/* Right actions: Notifications Bell with Badge & Quick Sign Out in Profile */}
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.notificationBellBtn}
            onPress={() => setShowNotificationsModal(true)}
            activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color="#1E293B" />
            {!notificationsRead && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>2</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Modal Sheet */}
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotificationsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="notifications" size={20} color={AppColors.primary} />
                <Text style={styles.modalTitle}>Notifications</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, paddingVertical: 8 }}>
              <View style={styles.notificationItem}>
                <View style={[styles.notifDot, { backgroundColor: AppColors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Welcome to Navodisha Connect! 🌟</Text>
                  <Text style={styles.notifBody}>
                    Your academic profile is successfully registered under {user?.jnvName}.
                  </Text>
                  <Text style={styles.notifTime}>Just now</Text>
                </View>
              </View>

              <View style={styles.notificationItem}>
                <View style={[styles.notifDot, { backgroundColor: '#059669' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Alumni Mentorship Network Active</Text>
                  <Text style={styles.notifBody}>
                    Over 500+ verified JNV alumni across IITs, AIIMS, and top industries are ready to guide you.
                  </Text>
                  <Text style={styles.notifTime}>2 hours ago</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.markReadBtn}
              onPress={() => {
                setNotificationsRead(true);
                setShowNotificationsModal(false);
              }}>
              <Text style={styles.markReadBtnText}>Mark All as Read</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Tab Screen Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* =========================================================================
            PROFILE TAB (For all roles: shifts existing profile details here)
           ========================================================================= */}
        {activeTabKey === 'PROFILE' && (
          <>
            {/* Student Profile Content */}
            {isStudent && (
              <>
                <View style={styles.card}>
                  <View style={styles.studentHeaderRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{user?.fullName?.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={styles.studentInfoCol}>
                      <View style={styles.nameTagRow}>
                        <Text style={styles.studentName}>{user?.fullName}</Text>
                        <View style={styles.activeStudentPill}>
                          <Text style={styles.activeStudentPillText}>Active Student</Text>
                        </View>
                      </View>
                      <Text style={styles.studentSubText}>
                        {user?.jnvName} • {user?.phoneNumber}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailRow}>
                    <Ionicons name="book-outline" size={16} color={AppColors.primary} />
                    <Text style={styles.detailLabel}>Class & Stream:</Text>
                    <Text style={styles.detailValue}>
                      {fullProfile?.studentDetails?.classLevel || 'Class 12'} {fullProfile?.studentDetails?.stream ? `• ${fullProfile.studentDetails.stream}` : ''}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="home-outline" size={16} color={AppColors.primary} />
                    <Text style={styles.detailLabel}>JNV House:</Text>
                    <Text style={styles.detailValue}>
                      {fullProfile?.studentDetails?.house ? `${fullProfile.studentDetails.house} House` : 'Not Set'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={AppColors.primary} />
                    <Text style={styles.detailLabel}>Admission Batch:</Text>
                    <Text style={styles.detailValue}>
                      {fullProfile?.studentDetails?.joinBatchYear ? `Class of ${fullProfile.studentDetails.joinBatchYear}` : 'Not Set'}
                    </Text>
                  </View>
                </View>

                {/* Target Goals */}
                <View style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="flag-outline" size={18} color="#D97706" />
                    <Text style={styles.cardTitle}>Preparing For / Target Exams</Text>
                  </View>
                  <View style={styles.tagsContainer}>
                    {fullProfile?.studentDetails?.preparingFor && fullProfile.studentDetails.preparingFor.length > 0 ? (
                      fullProfile.studentDetails.preparingFor.map((goal) => (
                        <View key={goal} style={styles.goalTag}>
                          <Ionicons name="checkmark-circle" size={14} color="#D97706" />
                          <Text style={styles.goalTagText}>{goal}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.mutedText}>No target exams specified yet.</Text>
                    )}
                  </View>
                </View>

                {/* Settings & Language Options */}
                <View style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="settings-outline" size={18} color={AppColors.primary} />
                    <Text style={styles.cardTitle}>App Settings & Preferences</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="language-outline" size={16} color="#64748B" />
                    <Text style={styles.detailLabel}>App Language:</Text>
                    <Text style={styles.detailValue}>English (Default)</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="notifications-outline" size={16} color="#64748B" />
                    <Text style={styles.detailLabel}>Session Reminders:</Text>
                    <Text style={styles.detailValue}>SMS & In-App</Text>
                  </View>
                </View>

                {/* Actions */}
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => router.push('/register/student')}
                  activeOpacity={0.85}>
                  <View style={styles.btnContent}>
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Update Academic Profile</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                  <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Active Alumnus Profile Content */}
            {isAlumnus && !isAccountPending && (
              <>
                <View style={styles.card}>
                  <View style={styles.mentorHeaderRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{user?.fullName?.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={styles.mentorInfoCol}>
                      <View style={styles.nameTagRow}>
                        <Text style={styles.mentorName}>{user?.fullName}</Text>
                        <View style={styles.verifiedTag}>
                          <Ionicons name="checkmark-circle" size={14} color="#059669" />
                          <Text style={styles.verifiedTagText}>Verified Mentor</Text>
                        </View>
                      </View>
                      <Text style={styles.mentorOrgText}>
                        {fullProfile?.alumniDetails?.designation || 'Alumnus'} • {fullProfile?.alumniDetails?.currentOrg || 'Industry Professional'}
                      </Text>
                      <Text style={styles.mentorSubText}>
                        {user?.jnvName} • Class of {fullProfile?.alumniDetails?.joinBatchYear || '2014'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.toggleRow}>
                    <View style={styles.toggleTextCol}>
                      <Text style={styles.toggleLabel}>Open to Guide Students</Text>
                      <Text style={styles.toggleSub}>
                        Allow junior scholars from JNV to discover and contact you
                      </Text>
                    </View>
                    <Switch
                      value={fullProfile?.alumniDetails?.openToHelp ?? true}
                      onValueChange={handleToggleMentorAvailability}
                      trackColor={{ false: '#CBD5E1', true: AppColors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Mentorship Focus */}
                <View style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="book-outline" size={18} color={AppColors.primary} />
                    <Text style={styles.cardTitle}>Mentorship Domains</Text>
                  </View>
                  <View style={styles.tagsContainer}>
                    {fullProfile?.alumniDetails?.provideMentorshipsOn && fullProfile.alumniDetails.provideMentorshipsOn.length > 0 ? (
                      fullProfile.alumniDetails.provideMentorshipsOn.map((topic) => (
                        <View key={topic} style={styles.tagItem}>
                          <Text style={styles.tagItemText}>{topic}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.mutedText}>No domains selected yet.</Text>
                    )}
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.cardTitleRow}>
                    <Ionicons name="videocam-outline" size={18} color={AppColors.primary} />
                    <Text style={styles.cardTitle}>Preferred Guidance Modes</Text>
                  </View>
                  <View style={styles.tagsContainer}>
                    {fullProfile?.alumniDetails?.willingModes && fullProfile.alumniDetails.willingModes.length > 0 ? (
                      fullProfile.alumniDetails.willingModes.map((mode) => (
                        <View key={mode} style={styles.modeItem}>
                          <Ionicons name="checkmark-sharp" size={12} color="#059669" />
                          <Text style={styles.modeItemText}>{mode}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.mutedText}>No modes selected yet.</Text>
                    )}
                  </View>
                </View>

                {/* Bio */}
                {fullProfile?.alumniDetails?.bio && (
                  <View style={styles.card}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons name="document-text-outline" size={18} color={AppColors.primary} />
                      <Text style={styles.cardTitle}>About / Guidance Philosophy</Text>
                    </View>
                    <Text style={styles.bioText}>{fullProfile.alumniDetails.bio}</Text>
                  </View>
                )}

                {/* Actions */}
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => router.push('/register/alumni')}
                  activeOpacity={0.85}>
                  <View style={styles.btnContent}>
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Update Mentorship Profile</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                  <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Active JNV Admin / Staff Profile Content */}
            {isJnvAdmin && !isAccountPending && (
              <>
                <View style={styles.card}>
                  <View style={styles.mentorHeaderRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{user?.fullName?.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={styles.mentorInfoCol}>
                      <View style={styles.nameTagRow}>
                        <Text style={styles.mentorName}>{user?.fullName}</Text>
                        <View style={styles.verifiedTag}>
                          <Ionicons name="checkmark-circle" size={14} color="#059669" />
                          <Text style={styles.verifiedTagText}>Active Faculty</Text>
                        </View>
                      </View>
                      <Text style={styles.mentorOrgText}>
                        {fullProfile?.jnvAdminDetails?.designation || 'Staff'} • {user?.jnvName}
                      </Text>
                      <Text style={styles.mentorSubText}>
                        Coordinator Status:{' '}
                        {fullProfile?.jnvAdminDetails?.isAlumniCoordinator ? 'Designated Alumni Coordinator' : 'Faculty Member'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={AppColors.primary} />
                    <Text style={styles.cardTitle}>Vidyalaya Faculty Privileges</Text>
                  </View>
                  <View style={styles.complianceItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.complianceText}>
                      Authorized JNV Faculty member for {user?.jnvName}
                    </Text>
                  </View>
                  {fullProfile?.jnvAdminDetails?.isAlumniCoordinator && (
                    <View style={styles.complianceItem}>
                      <Ionicons name="ribbon" size={16} color="#B45309" />
                      <Text style={styles.complianceText}>
                        Designated Alumni Coordinator privileges assigned
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => router.push('/register/staff')}
                  activeOpacity={0.85}>
                  <View style={styles.btnContent}>
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Update Staff Designation</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                  <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Pending Verification Profile Content (for Alumnus or JNV Admin waiting approval) */}
            {isAccountPending && (
              <>
                <View style={styles.card}>
                  <View style={styles.studentHeaderRow}>
                    <View style={[styles.avatarCircle, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.avatarText, { color: '#B45309' }]}>
                        {user?.fullName?.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.studentInfoCol}>
                      <Text style={styles.studentName}>{user?.fullName}</Text>
                      <Text style={styles.studentSubText}>
                        {user?.role?.replace('_', ' ')} • {user?.jnvName}
                      </Text>
                      <View style={[styles.statusBadgeWarning, { alignSelf: 'flex-start', marginTop: 4 }]}>
                        <Text style={styles.statusBadgeWarningText}>Verification Pending</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={AppColors.primary} />
                    <Text style={styles.detailLabel}>Registered Phone:</Text>
                    <Text style={styles.detailValue}>{user?.phoneNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="business-outline" size={16} color={AppColors.primary} />
                    <Text style={styles.detailLabel}>Navodaya School:</Text>
                    <Text style={styles.detailValue}>{user?.jnvName}</Text>
                  </View>

                  {isAlumnus && fullProfile?.alumniDetails && (
                    <>
                      <View style={styles.detailRow}>
                        <Ionicons name="briefcase-outline" size={16} color={AppColors.primary} />
                        <Text style={styles.detailLabel}>Organization:</Text>
                        <Text style={styles.detailValue}>
                          {fullProfile.alumniDetails.currentOrg || 'Not specified'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color={AppColors.primary} />
                        <Text style={styles.detailLabel}>Passout Batch:</Text>
                        <Text style={styles.detailValue}>
                          Class of {fullProfile.alumniDetails.joinBatchYear}
                        </Text>
                      </View>
                    </>
                  )}

                  {isJnvAdmin && fullProfile?.jnvAdminDetails && (
                    <View style={styles.detailRow}>
                      <Ionicons name="school-outline" size={16} color={AppColors.primary} />
                      <Text style={styles.detailLabel}>Designation:</Text>
                      <Text style={styles.detailValue}>
                        {fullProfile.jnvAdminDetails.designation}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.editProfileBtn}
                    onPress={() => router.push(isAlumnus ? '/register/alumni' : '/register/staff')}
                    activeOpacity={0.8}>
                    <Ionicons name="create-outline" size={16} color={AppColors.primary} />
                    <Text style={styles.editProfileBtnText}>Edit Profile Details</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                  <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Platform Admin Profile Content */}
            {isPlatformAdmin && (
              <>
                <View style={styles.card}>
                  <View style={styles.studentHeaderRow}>
                    <View style={[styles.avatarCircle, { backgroundColor: '#EEF2FF' }]}>
                      <Ionicons name="shield-checkmark" size={24} color={AppColors.primary} />
                    </View>
                    <View style={styles.studentInfoCol}>
                      <Text style={styles.studentName}>{user?.fullName || 'Platform Administrator'}</Text>
                      <Text style={styles.studentSubText}>Navodaya Vidyalaya Samiti HQ</Text>
                      <View style={[styles.statusBadgeSuccess, { alignSelf: 'flex-start', marginTop: 4 }]}>
                        <Text style={styles.statusBadgeSuccessText}>Superadmin Access Active</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={AppColors.primary} />
                    <Text style={styles.detailLabel}>Registered Phone:</Text>
                    <Text style={styles.detailValue}>{user?.phoneNumber || '+91 9999999999'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="shield-outline" size={16} color={AppColors.primary} />
                    <Text style={styles.detailLabel}>Authority Role:</Text>
                    <Text style={styles.detailValue}>Platform Admin (Samiti HQ)</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="key-outline" size={16} color={AppColors.primary} />
                    <Text style={styles.detailLabel}>Audit Level:</Text>
                    <Text style={styles.detailValue}>Full Verification & Compliance</Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="lock-closed-outline" size={18} color={AppColors.primary} />
                    <Text style={styles.cardTitle}>System Security & Privileges</Text>
                  </View>
                  <Text style={styles.cardHelperText}>
                    Platform Administrator session protected with 2FA token authentication and role-based access control.
                  </Text>
                  <View style={styles.complianceItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.complianceText}>
                      Authorized to approve/reject alumni & staff verification requests
                    </Text>
                  </View>
                  <View style={styles.complianceItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.complianceText}>
                      Authorized to suspend or activate platform user accounts
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                  <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                  <Text style={styles.logoutButtonText}>Sign Out of Admin Console</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* =========================================================================
            PENDING VERIFICATION HOME TAB (Only 2 tabs visible: Home & Profile)
           ========================================================================= */}
        {isAccountPending && activeTabKey === 'HOME' && (
          <>
            <View style={[styles.statusHeroCard, verification?.status === 'REJECTED' && styles.statusHeroCardRejected]}>
              <View style={[styles.statusIconCircle, verification?.status === 'REJECTED' && styles.statusIconCircleRejected]}>
                <Ionicons
                  name={verification?.status === 'REJECTED' ? 'close-circle' : 'hourglass-outline'}
                  size={36}
                  color={verification?.status === 'REJECTED' ? '#DC2626' : '#D97706'}
                />
              </View>

              <View style={[styles.statusBadge, verification?.status === 'REJECTED' && styles.statusBadgeRejected]}>
                <Text style={[styles.statusBadgeText, verification?.status === 'REJECTED' && styles.statusBadgeTextRejected]}>
                  Status: {verification?.status || user?.status}
                </Text>
              </View>

              <Text style={styles.statusGreeting}>
                Welcome to Navodisha, {user?.fullName?.split(' ')[0] || 'Member'}!
              </Text>

              <Text style={styles.statusDescription}>
                {verification?.status === 'REJECTED'
                  ? 'Your verification was reviewed and requires updated information. Please update your remarks or contact your regional office.'
                  : 'To ensure student safety, accounts with mentorship or administrative privileges are verified by Samiti administrators before access is granted.'}
              </Text>

              {verification?.remarks && (
                <View style={styles.adminFeedbackBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#1E3A8A" />
                  <Text style={styles.adminFeedbackText}>
                    Recorded Note: "{verification.remarks}"
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="create-outline" size={18} color={AppColors.primary} />
                <Text style={styles.cardTitle}>Note for Platform Admin (Optional)</Text>
              </View>
              <Text style={styles.cardHelperText}>
                Reference your batch, House, or known faculty to expedite verification.
              </Text>

              <TextInput
                style={styles.remarksInput}
                value={adminNote}
                onChangeText={setAdminNote}
                placeholder="e.g. Class of 2014, Aravali House. Verified with Principal Sir."
                placeholderTextColor={AppColors.textMuted}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSubmitVerification}
                disabled={submittingVerification}
                activeOpacity={0.85}>
                {submittingVerification ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.btnContent}>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>
                      {verification ? 'Update Verification Note' : 'Submit Verification Request'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.85}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.refreshBtnText}>Check Status / Refresh</Text>
            </TouchableOpacity>
          </>
        )}

        {/* =========================================================================
            PLATFORM ADMIN TAB 1: VERIFICATIONS (HOME)
           ========================================================================= */}
        {isPlatformAdmin && activeTabKey === 'HOME' && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{adminRequests.length}</Text>
                <Text style={styles.statLabel}>Pending Queue</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{pendingUsers.length}</Text>
                <Text style={styles.statLabel}>Pending Users</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>650+</Text>
                <Text style={styles.statLabel}>Active JNVs</Text>
              </View>
            </View>

            {adminRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color="#059669" />
                <Text style={styles.emptyTitle}>Verification Queue Clear!</Text>
                <Text style={styles.emptySubtitle}>
                  All submitted alumnus and staff verification requests have been processed.
                </Text>
              </View>
            ) : (
              activeReq && (
                <View style={styles.card}>
                  <View style={styles.badgeRow}>
                    <View style={styles.statusBadgeWarning}>
                      <Text style={styles.statusBadgeWarningText}>Awaiting Review</Text>
                    </View>
                    <Text style={styles.queueCounter}>
                      {activeReviewIndex + 1} of {adminRequests.length}
                    </Text>
                  </View>

                  <Text style={styles.applicantName}>{activeReq.userName}</Text>
                  <Text style={styles.applicantSub}>{activeReq.userRole} • {activeReq.jnvName}</Text>

                  {activeReq.remarks && (
                    <View style={styles.adminFeedbackBox}>
                      <Text style={styles.adminFeedbackLabel}>Applicant Affiliation Note:</Text>
                      <Text style={styles.adminFeedbackText}>"{activeReq.remarks}"</Text>
                    </View>
                  )}

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleReviewVerification(activeReq.id, 'APPROVED')}
                      disabled={processingId === activeReq.id}
                      activeOpacity={0.8}>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Approve Member</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReviewVerification(activeReq.id, 'REJECTED')}
                      disabled={processingId === activeReq.id}
                      activeOpacity={0.8}>
                      <Ionicons name="close-circle" size={18} color="#DC2626" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>

                  {adminRequests.length > 1 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                      <TouchableOpacity
                        style={[styles.smallFilterPill, activeReviewIndex === 0 && { opacity: 0.4 }]}
                        disabled={activeReviewIndex === 0}
                        onPress={() => setActiveReviewIndex((prev) => Math.max(0, prev - 1))}>
                        <Text style={styles.smallFilterPillText}>‹ Previous Applicant</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.smallFilterPill, activeReviewIndex >= adminRequests.length - 1 && { opacity: 0.4 }]}
                        disabled={activeReviewIndex >= adminRequests.length - 1}
                        onPress={() => setActiveReviewIndex((prev) => Math.min(adminRequests.length - 1, prev + 1))}>
                        <Text style={styles.smallFilterPillText}>Next Applicant ›</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            )}

            {renderDevBadge('Samiti Verification Console')}
          </>
        )}

        {/* =========================================================================
            PLATFORM ADMIN TAB 2: USERS
           ========================================================================= */}
        {isPlatformAdmin && activeTabKey === 'USERS' && (
          <>
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Ionicons name="people" size={18} color={AppColors.primary} />
                  <Text style={styles.sectionTitle}>User Access Management</Text>
                </View>
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{pendingUsers.length} Users</Text>
                </View>
              </View>
              <Text style={styles.cardHelperText}>
                Review registered accounts across all JNVs. Activate or suspend user privileges.
              </Text>
            </View>

            {pendingUsers.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={48} color="#64748B" />
                <Text style={styles.emptyTitle}>No Pending Accounts</Text>
                <Text style={styles.emptySubtitle}>All registered platform users have active status.</Text>
              </View>
            ) : (
              pendingUsers.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.applicantName}>{item.fullName}</Text>
                  <Text style={styles.applicantSub}>{item.role} • {item.jnvName}</Text>
                  <View style={styles.userActionRow}>
                    <TouchableOpacity
                      style={styles.activateSmallBtn}
                      onPress={() => handleUpdateUserStatus(item.id, 'ACTIVE')}
                      disabled={processingId === item.id}
                      activeOpacity={0.8}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      <Text style={styles.activateSmallBtnText}>Activate User</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.suspendSmallBtn}
                      onPress={() => handleUpdateUserStatus(item.id, 'SUSPENDED')}
                      disabled={processingId === item.id}
                      activeOpacity={0.8}>
                      <Ionicons name="ban" size={14} color="#DC2626" />
                      <Text style={styles.suspendSmallBtnText}>Suspend</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {renderDevBadge('User Directory & Access Control')}
          </>
        )}

        {/* =========================================================================
            PLATFORM ADMIN TAB 3: REPORTS
           ========================================================================= */}
        {isPlatformAdmin && activeTabKey === 'REPORTS' && (
          <>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="analytics" size={18} color={AppColors.primary} />
                <Text style={styles.cardTitle}>Navodisha System Compliance Report</Text>
              </View>
              <Text style={styles.cardHelperText}>
                National verification metrics and mentorship engagement statistics across all regions.
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>98.4%</Text>
                <Text style={styles.statLabel}>Compliance Rate</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>4.2k</Text>
                <Text style={styles.statLabel}>Verified Alumni</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>18.5k</Text>
                <Text style={styles.statLabel}>Active Scholars</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#059669" />
                <Text style={styles.cardTitle}>Regional Samiti Coverage</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bhopal Region:</Text>
                <Text style={styles.detailValue}>84 Vidyalayas (100% verified)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Chandigarh Region:</Text>
                <Text style={styles.detailValue}>61 Vidyalayas (98% verified)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hyderabad Region:</Text>
                <Text style={styles.detailValue}>77 Vidyalayas (99% verified)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Patna Region:</Text>
                <Text style={styles.detailValue}>82 Vidyalayas (97% verified)</Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 8 }]}
                onPress={() => Alert.alert('Report Export', 'Compliance audit log dispatched to platform administrator email.')}>
                <View style={styles.btnContent}>
                  <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Download Full Compliance Audit (PDF)</Text>
                </View>
              </TouchableOpacity>
            </View>

            {renderDevBadge('Platform Analytics & Verification Reports')}
          </>
        )}

        {/* =========================================================================
            STUDENT TABS (Home, Mentors, Sessions, Chat)
           ========================================================================= */}
        {isStudent && activeTabKey === 'HOME' && (
          <>
            {/* Student Home Header & Greeting */}
            <View style={styles.welcomeBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.welcomeGreeting}>Hello, {user?.fullName?.split(' ')[0]}! 👋</Text>
                <Text style={styles.welcomeSub}>
                  Find verified Navodaya alumni to guide your exams, college & career goals.
                </Text>
              </View>
              <View style={styles.welcomeIconCircle}>
                <Ionicons name="sparkles" size={24} color="#D97706" />
              </View>
            </View>

            {/* Ask for Help Big Action Card */}
            <TouchableOpacity
              style={styles.askHelpCard}
              onPress={() => {
                Alert.alert(
                  'Ask for Help Form',
                  'Select a subject or career field where you need guidance. A matching Navodaya alumnus will be connected.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go to Sessions', onPress: () => setCurrentTab('SESSIONS') },
                  ]
                );
              }}
              activeOpacity={0.9}>
              <View style={styles.askHelpContent}>
                <View style={styles.askHelpIcon}>
                  <Ionicons name="help-buoy" size={26} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.askHelpTitle}>Need Help or Guidance?</Text>
                  <Text style={styles.askHelpSub}>
                    Ask questions on JEE, NEET, CUET, or career roadmaps.
                  </Text>
                </View>
                <View style={styles.askHelpArrow}>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Field Exploration Chips */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="compass-outline" size={18} color={AppColors.primary} />
                <Text style={styles.cardTitle}>Explore Mentorship Fields</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChipsRow}>
                {['Engineering & IITs', 'Medical & AIIMS', 'Civil Services (UPSC)', 'Law & CLAT', 'Defense (NDA/CDS)', 'Software & IT', 'Design & NID'].map((field) => (
                  <TouchableOpacity
                    key={field}
                    style={[styles.fieldChip, selectedFieldChip === field && styles.fieldChipActive]}
                    onPress={() => setSelectedFieldChip(field)}
                    activeOpacity={0.7}>
                    <Text style={[styles.fieldChipText, selectedFieldChip === field && styles.fieldChipTextActive]}>
                      {field}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Alumni Available Now Horizontal Carousel */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Ionicons name="flash" size={18} color="#10B981" />
                  <Text style={styles.sectionTitle}>Alumni Available Now</Text>
                </View>
                <TouchableOpacity onPress={() => setCurrentTab('MENTORS')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.alumniCarousel}>
                <View style={styles.alumniMiniCard}>
                  <View style={styles.onlineBadge} />
                  <View style={styles.miniAvatar}>
                    <Text style={styles.miniAvatarText}>AS</Text>
                  </View>
                  <Text style={styles.miniName}>Amit Sharma</Text>
                  <Text style={styles.miniRole}>IIT Kharagpur '18</Text>
                  <Text style={styles.miniCompany}>Google • SDE II</Text>
                  <TouchableOpacity
                    style={styles.miniConnectBtn}
                    onPress={() => Alert.alert('Connect', 'Mentorship session requested with Amit Sharma!')}>
                    <Text style={styles.miniConnectBtnText}>Connect</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.alumniMiniCard}>
                  <View style={styles.onlineBadge} />
                  <View style={[styles.miniAvatar, { backgroundColor: '#FDF2F8' }]}>
                    <Text style={[styles.miniAvatarText, { color: '#DB2777' }]}>PR</Text>
                  </View>
                  <Text style={styles.miniName}>Pooja Rao</Text>
                  <Text style={styles.miniRole}>AIIMS Delhi '20</Text>
                  <Text style={styles.miniCompany}>Resident Doctor</Text>
                  <TouchableOpacity
                    style={styles.miniConnectBtn}
                    onPress={() => Alert.alert('Connect', 'Mentorship session requested with Pooja Rao!')}>
                    <Text style={styles.miniConnectBtnText}>Connect</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.alumniMiniCard}>
                  <View style={styles.onlineBadge} />
                  <View style={[styles.miniAvatar, { backgroundColor: '#F0FDF4' }]}>
                    <Text style={[styles.miniAvatarText, { color: '#059669' }]}>RK</Text>
                  </View>
                  <Text style={styles.miniName}>Rohan Kumar</Text>
                  <Text style={styles.miniRole}>NLSIU Bangalore</Text>
                  <Text style={styles.miniCompany}>Corporate Counsel</Text>
                  <TouchableOpacity
                    style={styles.miniConnectBtn}
                    onPress={() => Alert.alert('Connect', 'Mentorship session requested with Rohan Kumar!')}>
                    <Text style={styles.miniConnectBtnText}>Connect</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

            {/* Upcoming Session Card */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="calendar-outline" size={18} color={AppColors.primary} />
                <Text style={styles.cardTitle}>Your Upcoming Session</Text>
              </View>
              <View style={styles.sessionCardContent}>
                <View style={styles.sessionDateBadge}>
                  <Text style={styles.sessionDateMonth}>OCT</Text>
                  <Text style={styles.sessionDateDay}>28</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.sessionTopic}>JEE Physics Mechanics Masterclass</Text>
                  <Text style={styles.sessionWith}>with Mentor Amit Sharma (IIT KGP)</Text>
                  <Text style={styles.sessionTime}>Tuesday • 6:00 PM - 7:00 PM (Google Meet)</Text>
                </View>
              </View>
            </View>

            {renderDevBadge('Student Home Dashboard')}
          </>
        )}

        {isStudent && activeTabKey === 'MENTORS' && (
          <>
            {/* Mentors Directory Search & Filters */}
            <View style={styles.card}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search mentors by name, company, college, city..."
                  value={searchMentorQuery}
                  onChangeText={setSearchMentorQuery}
                  placeholderTextColor="#94A3B8"
                />
                {searchMentorQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchMentorQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Mode Filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.horizontalChipsRow, { marginTop: 10 }]}>
                {['All Modes', 'Video Call', 'Voice Call', 'Chat'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.smallFilterPill, selectedModeFilter === m && styles.smallFilterPillActive]}
                    onPress={() => setSelectedModeFilter(m)}>
                    <Text style={[styles.smallFilterPillText, selectedModeFilter === m && styles.smallFilterPillTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Mentor Cards List */}
            <View style={styles.card}>
              <View style={styles.mentorHeaderRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>AS</Text>
                </View>
                <View style={styles.mentorInfoCol}>
                  <View style={styles.nameTagRow}>
                    <Text style={styles.mentorName}>Amit Sharma</Text>
                    <View style={styles.verifiedTag}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.verifiedTagText}>Verified Alumnus</Text>
                    </View>
                  </View>
                  <Text style={styles.mentorOrgText}>Senior Software Engineer • Google</Text>
                  <Text style={styles.mentorSubText}>JNV Varanasi • Class of 2018 (IIT KGP)</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.tagsContainer}>
                <View style={styles.tagItem}><Text style={styles.tagItemText}>JEE Advanced</Text></View>
                <View style={styles.tagItem}><Text style={styles.tagItemText}>Computer Science</Text></View>
                <View style={styles.tagItem}><Text style={styles.tagItemText}>Coding & DSA</Text></View>
              </View>

              <View style={styles.mentorCardActions}>
                <TouchableOpacity
                  style={styles.requestGuidanceBtn}
                  onPress={() => Alert.alert('Request Sent', 'Guidance request submitted to Amit Sharma!')}>
                  <Ionicons name="paper-plane" size={14} color="#FFFFFF" />
                  <Text style={styles.requestGuidanceBtnText}>Request 1-on-1 Guidance</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.mentorHeaderRow}>
                <View style={[styles.avatarCircle, { backgroundColor: '#FDF2F8' }]}>
                  <Text style={[styles.avatarText, { color: '#DB2777' }]}>PR</Text>
                </View>
                <View style={styles.mentorInfoCol}>
                  <View style={styles.nameTagRow}>
                    <Text style={styles.mentorName}>Dr. Pooja Rao</Text>
                    <View style={styles.verifiedTag}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.verifiedTagText}>Verified Alumnus</Text>
                    </View>
                  </View>
                  <Text style={styles.mentorOrgText}>Resident Physician • AIIMS New Delhi</Text>
                  <Text style={styles.mentorSubText}>JNV Ernakulam • Class of 2017</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.tagsContainer}>
                <View style={styles.tagItem}><Text style={styles.tagItemText}>NEET UG</Text></View>
                <View style={styles.tagItem}><Text style={styles.tagItemText}>Medical Sciences</Text></View>
                <View style={styles.tagItem}><Text style={styles.tagItemText}>Biology Strategy</Text></View>
              </View>

              <View style={styles.mentorCardActions}>
                <TouchableOpacity
                  style={styles.requestGuidanceBtn}
                  onPress={() => Alert.alert('Request Sent', 'Guidance request submitted to Dr. Pooja Rao!')}>
                  <Ionicons name="paper-plane" size={14} color="#FFFFFF" />
                  <Text style={styles.requestGuidanceBtnText}>Request 1-on-1 Guidance</Text>
                </TouchableOpacity>
              </View>
            </View>

            {renderDevBadge('Alumni Directory & Search Engine')}
          </>
        )}

        {isStudent && activeTabKey === 'SESSIONS' && (
          <>
            {/* Segmented Control: Requests vs Sessions */}
            <View style={styles.segmentedRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, studentSessionSubTab === 'REQUESTS' && styles.segmentBtnActive]}
                onPress={() => setStudentSessionSubTab('REQUESTS')}>
                <Text style={[styles.segmentBtnText, studentSessionSubTab === 'REQUESTS' && styles.segmentBtnTextActive]}>
                  My Requests (1)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, studentSessionSubTab === 'SESSIONS' && styles.segmentBtnActive]}
                onPress={() => setStudentSessionSubTab('SESSIONS')}>
                <Text style={[styles.segmentBtnText, studentSessionSubTab === 'SESSIONS' && styles.segmentBtnTextActive]}>
                  Sessions (Upcoming & Past)
                </Text>
              </TouchableOpacity>
            </View>

            {studentSessionSubTab === 'REQUESTS' ? (
              <View style={styles.card}>
                <View style={styles.badgeRow}>
                  <View style={styles.statusBadgeWarning}>
                    <Text style={styles.statusBadgeWarningText}>Matched with Mentor</Text>
                  </View>
                  <Text style={styles.queueCounter}>Submitted 2 days ago</Text>
                </View>
                <Text style={styles.applicantName}>JEE Physics: Rotational Dynamics Doubt Solving</Text>
                <Text style={styles.applicantSub}>Matched Mentor: Amit Sharma (Google / IIT KGP)</Text>
                <Text style={styles.cardHelperText}>
                  Scheduled for Oct 28 at 6:00 PM. Video call link has been dispatched to your chat.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.card}>
                  <View style={styles.badgeRow}>
                    <View style={styles.statusBadgeSuccess}>
                      <Text style={styles.statusBadgeSuccessText}>Upcoming</Text>
                    </View>
                    <Text style={styles.queueCounter}>Oct 28, 6:00 PM</Text>
                  </View>
                  <Text style={styles.applicantName}>Rotational Motion & Mechanics</Text>
                  <Text style={styles.applicantSub}>1-on-1 Video Session with Amit Sharma</Text>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { marginTop: 12 }]}
                    onPress={() => Alert.alert('Join Call', 'Meeting room opens 5 minutes before scheduled start time.')}>
                    <Text style={styles.primaryBtnText}>Join Meeting (Google Meet)</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  <View style={styles.badgeRow}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>Completed</Text>
                    </View>
                    <Text style={styles.queueCounter}>Oct 14, 2026</Text>
                  </View>
                  <Text style={styles.applicantName}>NEET Strategy & Book Recommendations</Text>
                  <Text style={styles.applicantSub}>Mentor: Dr. Pooja Rao (AIIMS Delhi)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>Your Rating:</Text>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Ionicons name="star" size={16} color="#F59E0B" />
                  </View>
                </View>
              </>
            )}

            {renderDevBadge('Student Sessions & Help Requests')}
          </>
        )}

        {isStudent && activeTabKey === 'CHAT' && (
          <>
            <View style={styles.card}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search conversations..."
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.chatConversationCard}
              onPress={() => Alert.alert('Chat Thread', 'Opening chat thread with Amit Sharma...')}
              activeOpacity={0.8}>
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>AS</Text>
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.chatName}>Amit Sharma</Text>
                  <Text style={styles.chatTime}>12:30 PM</Text>
                </View>
                <Text style={styles.chatLastMessage} numberOfLines={1}>
                  I've shared the physics mechanics formula sheet. See you tomorrow at 6!
                </Text>
              </View>
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>2</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chatConversationCard}
              onPress={() => Alert.alert('Chat Thread', 'Opening chat thread with Navodisha Alumni Cell...')}
              activeOpacity={0.8}>
              <View style={[styles.chatAvatar, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="school" size={20} color={AppColors.primary} />
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.chatName}>JNV Alumni Cell</Text>
                  <Text style={styles.chatTime}>Yesterday</Text>
                </View>
                <Text style={styles.chatLastMessage} numberOfLines={1}>
                  Reminder: Virtual Alumni Career Talk on Defence is scheduled this weekend.
                </Text>
              </View>
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>1</Text>
              </View>
            </TouchableOpacity>

            {renderDevBadge('Real-time Mentorship Messaging')}
          </>
        )}

        {/* =========================================================================
            ALUMNUS TABS (Home, Requests, Sessions, Chat)
           ========================================================================= */}
        {isAlumnus && !isAccountPending && activeTabKey === 'HOME' && (
          <>
            {/* Open to help toggle banner at the top */}
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleLabel}>Open to Help Students</Text>
                  <Text style={styles.toggleSub}>
                    Toggle your availability to receive mentorship requests from junior Navodayans.
                  </Text>
                </View>
                <Switch
                  value={fullProfile?.alumniDetails?.openToHelp ?? true}
                  onValueChange={handleToggleMentorAvailability}
                  trackColor={{ false: '#CBD5E1', true: AppColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Mentor Impact Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>14</Text>
                <Text style={styles.statLabel}>Students Helped</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>28h</Text>
                <Text style={styles.statLabel}>Mentored</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>4.9 ★</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>

            {/* New Requests for Me Card */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Ionicons name="notifications" size={18} color="#D97706" />
                  <Text style={styles.sectionTitle}>New Requests for You</Text>
                </View>
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>1 New</Text>
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: '#F8FAFC', marginTop: 10 }]}>
                <Text style={styles.applicantName}>Aarav Sen (Class 12, Science)</Text>
                <Text style={styles.applicantSub}>{user?.jnvName} • Aravali House</Text>
                <Text style={styles.cardHelperText}>
                  "Need guidance on choosing between CSE and ECE in JEE counseling and preparing for JEE Advanced."
                </Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => Alert.alert('Request Accepted', 'Aarav has been notified. You can now schedule a session.')}>
                    <Text style={styles.approveBtnText}>Accept Request</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => Alert.alert('Request Declined', 'Request declined.')}>
                    <Text style={styles.rejectBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Upcoming Sessions Card */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="calendar-outline" size={18} color={AppColors.primary} />
                <Text style={styles.cardTitle}>Upcoming Mentorship Sessions</Text>
              </View>
              <View style={styles.sessionCardContent}>
                <View style={styles.sessionDateBadge}>
                  <Text style={styles.sessionDateMonth}>OCT</Text>
                  <Text style={styles.sessionDateDay}>29</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTopic}>1-on-1 Career Strategy Session</Text>
                  <Text style={styles.sessionWith}>Student: Priya Sharma (Class 11)</Text>
                  <Text style={styles.sessionTime}>Wednesday • 7:00 PM</Text>
                </View>
              </View>
            </View>

            {renderDevBadge('Alumni Mentor Hub')}
          </>
        )}

        {isAlumnus && !isAccountPending && activeTabKey === 'REQUESTS' && (
          <>
            <View style={styles.segmentedRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, alumnusRequestSubTab === 'STUDENTS' && styles.segmentBtnActive]}
                onPress={() => setAlumnusRequestSubTab('STUDENTS')}>
                <Text style={[styles.segmentBtnText, alumnusRequestSubTab === 'STUDENTS' && styles.segmentBtnTextActive]}>
                  Student Requests (2)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, alumnusRequestSubTab === 'JNV_ASKS' && styles.segmentBtnActive]}
                onPress={() => setAlumnusRequestSubTab('JNV_ASKS')}>
                <Text style={[styles.segmentBtnText, alumnusRequestSubTab === 'JNV_ASKS' && styles.segmentBtnTextActive]}>
                  JNV Asks (1)
                </Text>
              </TouchableOpacity>
            </View>

            {alumnusRequestSubTab === 'STUDENTS' ? (
              <View style={styles.card}>
                <Text style={styles.applicantName}>Rahul Verma (Class 12)</Text>
                <Text style={styles.applicantSub}>Topic: JEE Physics Mechanics & Mock Analysis</Text>
                <Text style={styles.cardHelperText}>
                  "Looking for tips on time management during mock tests and key topics to revise in 12th standard."
                </Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => Alert.alert('Accepted', 'Student request accepted!')}>
                    <Text style={styles.approveBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => Alert.alert('Declined', 'Request declined.')}>
                    <Text style={styles.rejectBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.badgeRow}>
                  <View style={styles.statusBadgeSuccess}>
                    <Text style={styles.statusBadgeSuccessText}>Principal's Invitation</Text>
                  </View>
                  <Text style={styles.queueCounter}>{user?.jnvName}</Text>
                </View>
                <Text style={styles.applicantName}>Career Orientation for Class 10 & 12 Batch</Text>
                <Text style={styles.cardHelperText}>
                  "The Vidyalaya is organizing an online career awareness seminar on careers in Technology, Research and Civil Services. We invite our distinguished alumni to address the students."
                </Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 12 }]}
                  onPress={() => Alert.alert('Interest Recorded', 'The school principal has been notified of your willingness to speak!')}>
                  <Text style={styles.primaryBtnText}>Express Interest / Volunteer</Text>
                </TouchableOpacity>
              </View>
            )}

            {renderDevBadge('Help Requests & JNV Invitations')}
          </>
        )}

        {isAlumnus && !isAccountPending && activeTabKey === 'SESSIONS' && (
          <>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="time-outline" size={18} color={AppColors.primary} />
                <Text style={styles.cardTitle}>Mentorship Availability Slots</Text>
              </View>
              <Text style={styles.cardHelperText}>
                Define weekly time windows when students can book guidance calls with you.
              </Text>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => Alert.alert('Availability', 'Slot management interface opening...')}>
                <Ionicons name="add-circle-outline" size={16} color={AppColors.primary} />
                <Text style={styles.editProfileBtnText}>Set Weekend Availability Slots</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="calendar-outline" size={18} color={AppColors.primary} />
                <Text style={styles.cardTitle}>Upcoming & Past Sessions</Text>
              </View>
              <View style={styles.sessionCardContent}>
                <View style={styles.sessionDateBadge}>
                  <Text style={styles.sessionDateMonth}>OCT</Text>
                  <Text style={styles.sessionDateDay}>29</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTopic}>JEE Exam Strategy & Doubts</Text>
                  <Text style={styles.sessionWith}>Student: Aarav Sen</Text>
                  <Text style={styles.sessionTime}>7:00 PM • Google Meet</Text>
                </View>
              </View>
            </View>

            {renderDevBadge('Mentorship Slots & Calendar Management')}
          </>
        )}

        {isAlumnus && !isAccountPending && activeTabKey === 'CHAT' && (
          <>
            <TouchableOpacity
              style={styles.chatConversationCard}
              onPress={() => Alert.alert('Chat Thread', 'Opening conversation with Aarav Sen...')}
              activeOpacity={0.8}>
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>AS</Text>
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.chatName}>Aarav Sen (Student)</Text>
                  <Text style={styles.chatTime}>11:15 AM</Text>
                </View>
                <Text style={styles.chatLastMessage} numberOfLines={1}>
                  Thank you sir! Looking forward to Wednesday's discussion.
                </Text>
              </View>
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>1</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chatConversationCard}
              onPress={() => Alert.alert('Chat Thread', 'Opening conversation with JNV Alumni Coordinator...')}
              activeOpacity={0.8}>
              <View style={[styles.chatAvatar, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="school" size={20} color="#059669" />
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.chatName}>JNV School Coordinator</Text>
                  <Text style={styles.chatTime}>Yesterday</Text>
                </View>
                <Text style={styles.chatLastMessage} numberOfLines={1}>
                  Sir, could you please confirm your availability for Saturday's talk?
                </Text>
              </View>
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>1</Text>
              </View>
            </TouchableOpacity>

            {renderDevBadge('Alumni Messaging Network')}
          </>
        )}

        {/* =========================================================================
            JNV ADMIN TABS (Home, My Asks, Alumni, Chat)
           ========================================================================= */}
        {isJnvAdmin && !isAccountPending && activeTabKey === 'HOME' && (
          <>
            {/* Summary of Open Asks and New Responses */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Open Asks</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>7</Text>
                <Text style={styles.statLabel}>Responses</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            </View>

            {/* Quick Action: Create Ask */}
            <TouchableOpacity
              style={styles.askHelpCard}
              onPress={() => setCurrentTab('MY_ASKS')}
              activeOpacity={0.85}>
              <View style={styles.askHelpContent}>
                <View style={styles.askHelpIcon}>
                  <Ionicons name="megaphone" size={26} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.askHelpTitle}>Post Guidance Ask for JNV</Text>
                  <Text style={styles.askHelpSub}>
                    Request alumni speakers for career talks, workshops, or exam guidance.
                  </Text>
                </View>
                <View style={styles.askHelpArrow}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Responding Alumni awaiting confirmation */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="people-outline" size={18} color={AppColors.primary} />
                <Text style={styles.cardTitle}>Recent Alumni Responses</Text>
              </View>
              <View style={styles.mentorHeaderRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>AS</Text>
                </View>
                <View style={styles.mentorInfoCol}>
                  <Text style={styles.mentorName}>Amit Sharma (Google • IIT KGP)</Text>
                  <Text style={styles.mentorSubText}>Responded to: "Career Talk on Technology"</Text>
                </View>
                <TouchableOpacity
                  style={styles.selectAlumniBtn}
                  onPress={() => Alert.alert('Selected', 'Alumnus selected for session.')}>
                  <Text style={styles.selectAlumniBtnText}>Select</Text>
                </TouchableOpacity>
              </View>
            </View>

            {renderDevBadge('JNV School Administration Portal')}
          </>
        )}

        {isJnvAdmin && !isAccountPending && activeTabKey === 'MY_ASKS' && (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => Alert.alert('Create Ask', 'Opening school guidance request creator...')}
              activeOpacity={0.85}>
              <View style={styles.btnContent}>
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Create New School Request</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.card}>
              <View style={styles.badgeRow}>
                <View style={styles.statusBadgeSuccess}>
                  <Text style={styles.statusBadgeSuccessText}>3 Responded</Text>
                </View>
                <Text style={styles.queueCounter}>Open Ask</Text>
              </View>
              <Text style={styles.applicantName}>NEET 2027 Strategy Workshop</Text>
              <Text style={styles.applicantSub}>Target: Class 11 & 12 PCB Stream</Text>
              <Text style={styles.cardHelperText}>
                Invited alumni doctors and medical students to share routine, study techniques, and mock test tips.
              </Text>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => Alert.alert('Alumni Responses', 'Listing 3 responding alumni for review...')}>
                <Text style={styles.editProfileBtnText}>View Responding Alumni (3) & Select</Text>
              </TouchableOpacity>
            </View>

            {renderDevBadge('Vidyalaya Guidance Requests')}
          </>
        )}

        {isJnvAdmin && !isAccountPending && activeTabKey === 'ALUMNI' && (
          <>
            <View style={styles.card}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search verified alumni from ${user?.jnvName || 'your JNV'}...`}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.mentorHeaderRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>AS</Text>
                </View>
                <View style={styles.mentorInfoCol}>
                  <Text style={styles.mentorName}>Amit Sharma</Text>
                  <Text style={styles.mentorOrgText}>Senior Software Engineer • Google</Text>
                  <Text style={styles.mentorSubText}>Batch of 2018 (IIT Kharagpur)</Text>
                </View>
                <TouchableOpacity
                  style={styles.inviteAlumniBtn}
                  onPress={() => Alert.alert('Invitation Sent', 'Invitation dispatched to alumnus.')}>
                  <Text style={styles.inviteAlumniBtnText}>Invite</Text>
                </TouchableOpacity>
              </View>
            </View>

            {renderDevBadge('JNV Alumni Roster & Engagement')}
          </>
        )}

        {isJnvAdmin && !isAccountPending && activeTabKey === 'CHAT' && (
          <>
            <View style={styles.complianceNoticeBox}>
              <Ionicons name="information-circle-outline" size={18} color="#1E3A8A" />
              <Text style={styles.complianceNoticeText}>
                Faculty Chat Channel: Faculty communications are enabled exclusively with verified alumni and school administration. Student direct messages are restricted for child safety.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.chatConversationCard}
              onPress={() => Alert.alert('Chat Thread', 'Opening conversation with Amit Sharma (Alumnus)...')}
              activeOpacity={0.8}>
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>AS</Text>
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.chatName}>Amit Sharma (Alumnus)</Text>
                  <Text style={styles.chatTime}>10:45 AM</Text>
                </View>
                <Text style={styles.chatLastMessage} numberOfLines={1}>
                  Sir, I would be honored to conduct the seminar next Saturday.
                </Text>
              </View>
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>1</Text>
              </View>
            </TouchableOpacity>

            {renderDevBadge('Faculty-Alumni Coordination Channel')}
          </>
        )}

      </ScrollView>

      {/* =========================================================================
          PERSISTENT ROLE-BASED BOTTOM NAVIGATION BAR
         ========================================================================= */}
      <View style={styles.bottomTabBar}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTabKey;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.bottomTabItem}
              onPress={() => setCurrentTab(tab.key)}
              activeOpacity={0.7}>
              <View style={styles.tabIconWrapper}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={22}
                  color={isActive ? AppColors.primary : '#64748B'}
                />
                {tab.badge && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                  </View>
                )}
                {tab.hasDot && <View style={styles.tabDot} />}
              </View>
              <Text
                style={[
                  styles.bottomTabLabel,
                  isActive && styles.bottomTabLabelActive,
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBellBtn: {
    padding: 6,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  navLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  navSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  tabSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: AppColors.primary,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardHelperText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    minWidth: 110,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  statusBadgeWarning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeWarningText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  statusBadgeSuccess: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  queueCounter: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  applicantSub: {
    fontSize: 13,
    color: '#64748B',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  userActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  activateSmallBtn: {
    flex: 1,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activateSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  suspendSmallBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 6,
  },
  suspendSmallBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Pending verification styles
  statusHeroCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  statusHeroCardRejected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconCircleRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusGreeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  adminFeedbackBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 4,
    width: '100%',
  },
  adminFeedbackLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  adminFeedbackText: {
    fontSize: 12,
    color: '#1E40AF',
    fontStyle: 'italic',
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    minHeight: 70,
  },
  primaryBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#475569',
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    marginTop: 4,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 6,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  // Profile Cards Styles
  studentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primary,
  },
  studentInfoCol: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentSubText: {
    fontSize: 12,
    color: '#64748B',
  },
  activeStudentPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeStudentPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  goalTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  mutedText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  mentorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mentorInfoCol: {
    flex: 1,
    gap: 2,
  },
  nameTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mentorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  mentorOrgText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  mentorSubText: {
    fontSize: 12,
    color: '#64748B',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleSub: {
    fontSize: 12,
    color: '#64748B',
  },
  tagItem: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tagItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modeItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  bioText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  complianceText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  // Dev prototype banner
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  devIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  devBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  devBannerSub: {
    fontSize: 11,
    color: '#64748B',
  },
  // Student Home Tab Components
  welcomeBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  welcomeGreeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  welcomeSub: {
    fontSize: 12,
    color: '#3730A3',
    marginTop: 4,
    lineHeight: 16,
  },
  welcomeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  askHelpCard: {
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  askHelpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  askHelpIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  askHelpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  askHelpSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  askHelpArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  fieldChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: AppColors.primary,
  },
  fieldChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  fieldChipTextActive: {
    color: AppColors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.primary,
  },
  alumniCarousel: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  alumniMiniCard: {
    width: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    gap: 3,
  },
  onlineBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  miniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primary,
  },
  miniName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  miniRole: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  miniCompany: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  miniConnectBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 6,
  },
  miniConnectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sessionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionDateBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  sessionDateMonth: {
    fontSize: 10,
    fontWeight: '800',
    color: AppColors.primary,
  },
  sessionDateDay: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.primary,
  },
  sessionTopic: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sessionWith: {
    fontSize: 12,
    color: '#475569',
  },
  sessionTime: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  // Mentors Search tab
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  smallFilterPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smallFilterPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: AppColors.primary,
  },
  smallFilterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  smallFilterPillTextActive: {
    color: AppColors.primary,
  },
  mentorCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  requestGuidanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestGuidanceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Segmented control
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  // Chat Tab
  chatConversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.primary,
  },
  chatInfo: {
    flex: 1,
    gap: 2,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  chatTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  chatLastMessage: {
    fontSize: 12,
    color: '#64748B',
  },
  chatBadge: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  chatBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Alumnus & JNV Admin Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  badgeCount: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  selectAlumniBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectAlumniBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inviteAlumniBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inviteAlumniBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  complianceNoticeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'flex-start',
  },
  complianceNoticeText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
    flex: 1,
  },
  // Bottom Navigation Bar
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIconWrapper: {
    position: 'relative',
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  bottomTabLabelActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  notifBody: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  markReadBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  markReadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.primary,
  },
});
