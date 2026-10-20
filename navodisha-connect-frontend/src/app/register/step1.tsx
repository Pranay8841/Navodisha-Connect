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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../api/types';

const JNV_SCHOOLS = [
  { name: 'JNV Gadchiroli', state: 'Maharashtra', region: 'Pune Region', district: 'Gadchiroli', code: '1140004' },
  { name: 'JNV Cuttack', state: 'Odisha', region: 'Bhopal Region', district: 'Cuttack', code: '1150012' },
  { name: 'JNV Pune', state: 'Maharashtra', region: 'Pune Region', district: 'Pune', code: '1140023' },
  { name: 'JNV Khordha', state: 'Odisha', region: 'Bhopal Region', district: 'Khordha', code: '1150034' },
  { name: 'JNV Sambalpur', state: 'Odisha', region: 'Bhopal Region', district: 'Sambalpur', code: '1150045' },
  { name: 'JNV Nagpur', state: 'Maharashtra', region: 'Pune Region', district: 'Nagpur', code: '1140056' },
];

export default function Step1RegistrationScreen() {
  const router = useRouter();
  const { registerUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('STUDENT');
  const [jnvSearch, setJnvSearch] = useState('JNV Gadchiroli, Maharashtra (Pune Region)');
  const [selectedSchool, setSelectedSchool] = useState(JNV_SCHOOLS[0]);
  const [loading, setLoading] = useState(false);

  const isFormValid = fullName.trim().length >= 2 && selectedSchool;

  const handleContinue = async () => {
    if (!isFormValid) {
      Alert.alert('Incomplete Profile', 'Please enter your full name and select your JNV school.');
      return;
    }

    setLoading(true);
    try {
      await registerUser(fullName.trim(), selectedRole, selectedSchool.name);

      // Route to Step 2 based on chosen role
      if (selectedRole === 'STUDENT') {
        router.push('/register/student');
      } else if (selectedRole === 'ALUMNUS') {
        router.push('/register/alumni');
      } else {
        router.push('/register/staff');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const ctaButtonText =
    selectedRole === 'STUDENT'
      ? 'Continue to Academic Details'
      : selectedRole === 'ALUMNUS'
      ? 'Continue to Career Details'
      : 'Continue to Staff Profile';

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
                <Text style={styles.stepBadgeNumber}>1</Text>
                <Text style={styles.stepBadgeText}>Step 1 of 2</Text>
              </View>
              <Text style={styles.stepLabel}>Identity & JNV Affiliation</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill50} />
            </View>
          </View>

          {/* Banner Card */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#B45309" />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>Complete Your Profile</Text>
              <Text style={styles.bannerSub}>
                Tell us who you are to personalize your mentorship experience.
              </Text>
            </View>
          </View>

          {/* Full Name Field */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>
                Full Name <Text style={styles.asterisk}>*</Text>
              </Text>
              <Text style={styles.fieldHelperCaption}>Official record</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Aarav Sharma"
                placeholderTextColor={AppColors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              {fullName.trim().length >= 2 && (
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              )}
            </View>
          </View>

          {/* Role Selection Field */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>
                I am joining as: <Text style={styles.asterisk}>*</Text>
              </Text>
              <Text style={styles.fieldHelperCaption}>Select one</Text>
            </View>

            <View style={styles.roleCardsRow}>
              {/* Student Card */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'STUDENT' ? styles.roleCardSelected : styles.roleCardDefault,
                ]}
                onPress={() => setSelectedRole('STUDENT')}
                activeOpacity={0.8}>
                {selectedRole === 'STUDENT' && (
                  <View style={styles.roleCheckBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.roleIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="school" size={20} color={AppColors.primary} />
                </View>
                <Text style={styles.roleTitle}>Student</Text>
                <Text style={styles.roleSub}>Class 10-12</Text>
                <View style={styles.rolePillInstant}>
                  <Text style={styles.rolePillInstantText}>Instant Access</Text>
                </View>
              </TouchableOpacity>

              {/* Alumnus Card */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'ALUMNUS' ? styles.roleCardSelected : styles.roleCardDefault,
                ]}
                onPress={() => setSelectedRole('ALUMNUS')}
                activeOpacity={0.8}>
                {selectedRole === 'ALUMNUS' && (
                  <View style={styles.roleCheckBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.roleIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="briefcase" size={20} color="#B45309" />
                </View>
                <Text style={styles.roleTitle}>Alumnus</Text>
                <Text style={styles.roleSub}>College/Grad</Text>
                <View style={styles.rolePillNeutral}>
                  <Text style={styles.rolePillNeutralText}>Mentor Path</Text>
                </View>
              </TouchableOpacity>

              {/* JNV Staff Card */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  selectedRole === 'JNV_ADMIN' ? styles.roleCardSelected : styles.roleCardDefault,
                ]}
                onPress={() => setSelectedRole('JNV_ADMIN')}
                activeOpacity={0.8}>
                {selectedRole === 'JNV_ADMIN' && (
                  <View style={styles.roleCheckBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.roleIconCircle, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="business" size={20} color="#475569" />
                </View>
                <Text style={styles.roleTitle}>JNV Staff</Text>
                <Text style={styles.roleSub}>Teacher/Admin</Text>
                <View style={styles.rolePillNeutral}>
                  <Text style={styles.rolePillNeutralText}>Institutional</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* JNV School Selection Field */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>
                Your JNV School <Text style={styles.asterisk}>*</Text>
              </Text>
              <TouchableOpacity style={styles.gpsButton} activeOpacity={0.7}>
                <Ionicons name="locate" size={13} color={AppColors.primary} />
                <Text style={styles.gpsButtonText}>GPS Suggest</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input Box */}
            <View style={styles.schoolSearchBox}>
              <Ionicons name="search" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.schoolSearchInput}
                value={jnvSearch}
                onChangeText={setJnvSearch}
                placeholder="Search your JNV School..."
                placeholderTextColor={AppColors.textMuted}
              />
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </View>

            {/* Selected School Card */}
            <View style={styles.selectedSchoolCard}>
              <View style={styles.schoolIconBox}>
                <Ionicons name="business-outline" size={20} color={AppColors.primary} />
              </View>

              <View style={styles.schoolDetailsCol}>
                <View style={styles.schoolTitleRow}>
                  <Text style={styles.schoolName}>{selectedSchool.name}</Text>
                  <View style={styles.regionBadge}>
                    <Text style={styles.regionBadgeText}>{selectedSchool.region}</Text>
                  </View>
                </View>
                <Text style={styles.schoolSubText}>
                  District: {selectedSchool.district} • Affiliation No: {selectedSchool.code}
                </Text>
              </View>

              <Ionicons name="checkmark-circle" size={20} color="#059669" />
            </View>

            <View style={styles.schoolHelperRow}>
              <Ionicons name="information-circle-outline" size={14} color="#64748B" />
              <Text style={styles.schoolHelperText}>
                Verify with your school record for community trust.
              </Text>
            </View>
          </View>

          {/* Community Trust Pill */}
          <View style={styles.communityTrustCard}>
            <View style={styles.avatarStack}>
              <View style={[styles.avatarCircle, { backgroundColor: '#1E3A8A' }]}>
                <Text style={styles.avatarText}>VK</Text>
              </View>
              <View style={[styles.avatarCircle, { backgroundColor: '#B45309', marginLeft: -8 }]}>
                <Text style={styles.avatarText}>AP</Text>
              </View>
              <View style={[styles.avatarCircle, { backgroundColor: '#059669', marginLeft: -8 }]}>
                <Text style={styles.avatarText}>SN</Text>
              </View>
            </View>

            <Text style={styles.communityTrustText}>
              Over <Text style={styles.communityBold}>1,240+ JNVians</Text> connected from Maharashtra & Odisha regions this week.
            </Text>
          </View>

          {/* Continue CTA */}
          <TouchableOpacity
            style={[
              styles.ctaButton,
              isFormValid ? styles.ctaButtonActive : styles.ctaButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isFormValid || loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.ctaContent}>
                <Text style={styles.ctaText}>{ctaButtonText}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.securityRow}>
            <Ionicons name="lock-closed-outline" size={13} color="#64748B" />
            <Text style={styles.securityText}>
              Encrypted Navodaya Vidyalaya Samiti verification
            </Text>
          </View>
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
    gap: 6,
  },
  stepBadgeNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AppColors.primary,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
  },
  stepLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill50: {
    width: '50%',
    height: '100%',
    backgroundColor: AppColors.primary,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 12,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  bannerSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  asterisk: {
    color: '#EF4444',
  },
  fieldHelperCaption: {
    fontSize: 12,
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
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  roleCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1.5,
  },
  roleCardDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  roleCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: AppColors.primary,
  },
  roleCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  roleSub: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 6,
  },
  rolePillInstant: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rolePillInstantText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  rolePillNeutral: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rolePillNeutralText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#475569',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
  },
  schoolSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 10,
  },
  schoolSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  selectedSchoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 10,
  },
  schoolIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolDetailsCol: {
    flex: 1,
  },
  schoolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  schoolName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  regionBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  regionBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: AppColors.primary,
  },
  schoolSubText: {
    fontSize: 10,
    color: '#64748B',
  },
  schoolHelperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  schoolHelperText: {
    fontSize: 11,
    color: '#64748B',
  },
  communityTrustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  communityTrustText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  communityBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  ctaButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaButtonActive: {
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  securityText: {
    fontSize: 11,
    color: '#64748B',
  },
});
