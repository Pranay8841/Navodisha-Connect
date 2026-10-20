import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function HomeScreen() {
  const router = useRouter();
  const { user, fullProfile, refreshProfile, logout } = useAuth();

  const [verification, setVerification] = useState<any>(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const res = await apiClient.get('/api/v1/verifications/me');
      setVerification(res.data);
    } catch (e: any) {
      // 404 means no request submitted yet (UNVERIFIED)
      if (e.response?.status !== 404) {
        console.warn('Failed to fetch verification:', e);
      }
    }
  };

  const handleSubmitVerification = async () => {
    setSubmittingVerification(true);
    try {
      const res = await apiClient.post('/api/v1/verifications');
      setVerification(res.data);
      Alert.alert('Verification Submitted! 🎉', 'Your verification request has been sent to your JNV Admin for review.');
      await refreshProfile();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to submit verification.';
      Alert.alert('Submission Error', msg);
    } finally {
      setSubmittingVerification(false);
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

  const isVerified = user?.isVerified || verification?.status === 'APPROVED';
  const isPending = verification?.status === 'PENDING';

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'NV'}
              </Text>
            </View>

            <View style={styles.profileMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.fullName}>{user?.fullName || 'Navodayan Scholar'}</Text>
                {isVerified && (
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                )}
              </View>
              <Text style={styles.phoneText}>{user?.phoneNumber}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {user?.role === 'STUDENT'
                    ? 'Student (Class 10-12)'
                    : user?.role === 'ALUMNUS'
                    ? 'Verified Alumnus'
                    : 'JNV Administrator'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.schoolInfoRow}>
            <Ionicons name="business-outline" size={16} color="#64748B" />
            <Text style={styles.schoolText}>{user?.jnvName || 'Jawahar Navodaya Vidyalaya'}</Text>
          </View>
        </View>

        {/* Verification Status Banner */}
        <View style={styles.verificationCard}>
          {isVerified ? (
            <View style={styles.verifRow}>
              <View style={[styles.verifIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark" size={22} color="#059669" />
              </View>
              <View style={styles.verifTextCol}>
                <Text style={styles.verifTitleSuccess}>Account 100% Verified</Text>
                <Text style={styles.verifSub}>
                  You have full access to 1:1 mentorship sessions and community channels.
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
                  Your verification request has been submitted and is under review by your school administrator.
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

        {/* Role Specific Details Card */}
        {fullProfile?.studentDetails && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsCardTitle}>Academic Details</Text>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Class Level</Text>
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

        {fullProfile?.alumniDetails && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsCardTitle}>Career & Mentorship Profile</Text>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Organization</Text>
              <Text style={styles.detailValue}>{fullProfile.alumniDetails.currentOrg || 'N/A'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Designation</Text>
              <Text style={styles.detailValue}>{fullProfile.alumniDetails.designation || 'N/A'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Current City</Text>
              <Text style={styles.detailValue}>{fullProfile.alumniDetails.currentCity || 'N/A'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Passing Batch</Text>
              <Text style={styles.detailValue}>{fullProfile.alumniDetails.joinBatchYear}</Text>
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
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
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
  detailsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
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
});
