import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/user';

const DESIGNATIONS = [
  'PGT Computer Science',
  'TGT Mathematics',
  'Vice Principal',
  'Principal',
  'PGT Physics',
  'PGT Chemistry',
  'TGT Science',
  'Staff Warden',
];

export default function StaffRegistrationScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [designation, setDesignation] = useState('PGT Computer Science');
  const [staffId, setStaffId] = useState('NVS-PUN-8492');
  const [isAlumniCoordinator, setIsAlumniCoordinator] = useState(true);
  const [serviceYears, setServiceYears] = useState<'1-3' | '4-7' | '8+'>('8+');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!designation.trim()) {
      Alert.alert('Required', 'Please select or enter your official designation.');
      return;
    }

    setLoading(true);
    try {
      await userApi.updateJnvAdminProfile({
        designation: designation.trim(),
        isAlumniCoordinator,
      });

      await refreshProfile();
      Alert.alert('Staff Profile Saved! 🎓', 'Your details have been submitted for regional verification.', [
        { text: 'Go to Portal', onPress: () => router.replace('/home') },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to save staff profile.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          
          {/* Progress Header */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <View style={styles.stepBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#B45309" />
                <Text style={styles.stepBadgeText}>Step 2 of 2: Staff Role Verification</Text>
              </View>
              <Text style={styles.progressPercent}>80% Completed</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill80} />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.pageTitle}>JNV Staff Details</Text>
          <View style={styles.subTitleRow}>
            <Ionicons name="school-outline" size={14} color="#64748B" />
            <Text style={styles.pageSubTitle}>
              {user?.jnvName || 'JNV Gadchiroli'} • Faculty & Administration Network
            </Text>
          </View>

          {/* School Card */}
          <View style={styles.schoolCard}>
            <View style={styles.schoolIconCircle}>
              <Ionicons name="business" size={24} color={AppColors.primary} />
            </View>
            <View style={styles.schoolInfoCol}>
              <View style={styles.confirmedRow}>
                <View style={styles.confirmedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text style={styles.confirmedText}>Confirmed Vidyalaya</Text>
                </View>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                  <Text style={styles.changeLink}>Change</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.schoolName}>{user?.jnvName || 'JNV Gadchiroli'}</Text>
              <Text style={styles.schoolRegion}>District: Gadchiroli • Maharashtra (Pune Region)</Text>

              <View style={styles.affiliationRow}>
                <Ionicons name="id-card-outline" size={14} color="#64748B" />
                <Text style={styles.affiliationLabel}>NVS Affiliation Code:</Text>
                <Text style={styles.affiliationCode}>1140004</Text>
              </View>
            </View>
          </View>

          {/* Official Designation Field */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>
                Official Designation <Text style={styles.asterisk}>*</Text>
              </Text>
              <Text style={styles.fieldCaption}>Samiti Cadre</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="briefcase-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={designation}
                onChangeText={setDesignation}
                placeholder="PGT Computer Science"
                placeholderTextColor={AppColors.textMuted}
              />
              <Ionicons name="swap-vertical" size={16} color="#64748B" />
            </View>

            <View style={styles.pillsRow}>
              {DESIGNATIONS.slice(0, 3).map((des) => (
                <TouchableOpacity
                  key={des}
                  style={[styles.quickPill, designation === des && styles.quickPillActive]}
                  onPress={() => setDesignation(des)}
                  activeOpacity={0.7}>
                  <Text style={[styles.quickPillText, designation === des && styles.quickPillTextActive]}>
                    {des}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Samiti Staff ID / PRAN */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Samiti Staff ID / PRAN</Text>
              <View style={styles.optionalBadge}>
                <Ionicons name="shield-outline" size={11} color="#64748B" />
                <Text style={styles.optionalText}>Optional Fast-Track</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={staffId}
                onChangeText={setStaffId}
                placeholder="NVS-PUN-8492"
                placeholderTextColor={AppColors.textMuted}
                autoCapitalize="characters"
              />
              {staffId.length > 3 && (
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              )}
            </View>
            <Text style={styles.inputHelperText}>
              Used solely to securely verify administrative privileges and prevent faculty impersonation.
            </Text>
          </View>

          {/* Alumni Coordinator Card */}
          <View style={styles.coordinatorCard}>
            <View style={styles.coordinatorTop}>
              <View style={styles.coordinatorBadge}>
                <Ionicons name="ribbon" size={20} color="#B45309" />
              </View>
              <View style={styles.coordinatorTextCol}>
                <Text style={styles.coordinatorTitle}>Designated Alumni Coordinator</Text>
              </View>
              <Switch
                value={isAlumniCoordinator}
                onValueChange={setIsAlumniCoordinator}
                trackColor={{ false: '#CBD5E1', true: AppColors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Text style={styles.coordinatorSub}>
              Enables you to verify alumni profiles from your Vidyalaya, manage the local batch database, and schedule on-campus guidance workshops.
            </Text>

            <View style={styles.privilegeBadge}>
              <Ionicons name="checkmark-done" size={14} color={AppColors.primary} />
              <Text style={styles.privilegeText}>
                Privilege assigned: Regional JNV Verified Admin Badge
              </Text>
            </View>
          </View>

          {/* Years of Navodaya Service */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Years of Navodaya Service</Text>
              <Text style={styles.fieldCaption}>Across all JNVs</Text>
            </View>

            <View style={styles.serviceRow}>
              <TouchableOpacity
                style={[styles.serviceCard, serviceYears === '1-3' && styles.serviceCardActive]}
                onPress={() => setServiceYears('1-3')}
                activeOpacity={0.8}>
                <Text style={[styles.serviceTitle, serviceYears === '1-3' && styles.serviceTitleActive]}>
                  1–3 Years
                </Text>
                <Text style={[styles.serviceSub, serviceYears === '1-3' && styles.serviceSubActive]}>
                  Novice
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.serviceCard, serviceYears === '4-7' && styles.serviceCardActive]}
                onPress={() => setServiceYears('4-7')}
                activeOpacity={0.8}>
                <Text style={[styles.serviceTitle, serviceYears === '4-7' && styles.serviceTitleActive]}>
                  4–7 Years
                </Text>
                <Text style={[styles.serviceSub, serviceYears === '4-7' && styles.serviceSubActive]}>
                  Experienced
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.serviceCard, serviceYears === '8+' && styles.serviceCardActive]}
                onPress={() => setServiceYears('8+')}
                activeOpacity={0.8}>
                <Text style={[styles.serviceTitle, serviceYears === '8+' && styles.serviceTitleActive]}>
                  8+ Years
                </Text>
                <Text style={[styles.serviceSub, serviceYears === '8+' && styles.serviceSubActive]}>
                  Veteran Faculty
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mentorship Reach Card */}
          <View style={styles.reachBanner}>
            <View style={styles.reachIconBox}>
              <Ionicons name="people" size={20} color={AppColors.primary} />
            </View>
            <View style={styles.reachTextCol}>
              <Text style={styles.reachTitle}>Mentorship Reach: 1,420+ Alumni</Text>
              <Text style={styles.reachSub}>Connected to IIT, AIIMS, UPSC & Industry...</Text>
            </View>
          </View>

          {/* Submit CTA */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleFinish}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.ctaContent}>
                <Text style={styles.ctaText}>Save Details & Submit for Review</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.reviewNoteText}>
            Review usually completes within 24 hours via JNV Pune Regional Office.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  keyboardView: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    padding: 6,
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill80: {
    width: '80%',
    height: '100%',
    backgroundColor: AppColors.primary,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  pageSubTitle: {
    fontSize: 12,
    color: '#64748B',
  },
  schoolCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 12,
  },
  schoolIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolInfoCol: {
    flex: 1,
  },
  confirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  confirmedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  changeLink: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  schoolRegion: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  affiliationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  affiliationLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  affiliationCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldSection: {
    marginBottom: 18,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  asterisk: {
    color: '#EF4444',
  },
  fieldCaption: {
    fontSize: 12,
    color: '#64748B',
  },
  optionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionalText: {
    fontSize: 11,
    color: '#64748B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickPillActive: {
    backgroundColor: AppColors.primary,
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.primary,
  },
  quickPillTextActive: {
    color: '#FFFFFF',
  },
  inputHelperText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 6,
  },
  coordinatorCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 20,
  },
  coordinatorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  coordinatorBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordinatorTextCol: {
    flex: 1,
  },
  coordinatorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  coordinatorSub: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 12,
  },
  privilegeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  privilegeText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.primary,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  serviceCardActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  serviceTitleActive: {
    color: '#FFFFFF',
  },
  serviceSub: {
    fontSize: 10,
    color: '#64748B',
  },
  serviceSubActive: {
    color: '#93C5FD',
  },
  reachBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  reachIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reachTextCol: {
    flex: 1,
  },
  reachTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reachSub: {
    fontSize: 11,
    color: '#475569',
  },
  ctaButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewNoteText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
});
