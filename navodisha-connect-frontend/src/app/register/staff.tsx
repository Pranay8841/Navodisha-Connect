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

const COMMON_DESIGNATIONS = [
  'PGT Computer Science',
  'PGT Mathematics',
  'PGT Physics',
  'PGT Chemistry',
  'TGT Science',
  'Vice Principal',
  'Principal',
];

export default function StaffRegistrationScreen() {
  const router = useRouter();
  const { user, fullProfile, refreshProfile } = useAuth();

  // Exactly matching backend UpdateJnvAdminProfileRequest: designation & isAlumniCoordinator
  const [designation, setDesignation] = useState(
    fullProfile?.jnvAdminDetails?.designation || 'PGT Computer Science'
  );
  const [isAlumniCoordinator, setIsAlumniCoordinator] = useState(
    fullProfile?.jnvAdminDetails?.isAlumniCoordinator ?? true
  );
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!designation.trim()) {
      Alert.alert('Required', 'Please enter your official designation.');
      return;
    }

    setLoading(true);
    try {
      await userApi.updateJnvAdminProfile({
        designation: designation.trim(),
        isAlumniCoordinator,
      });

      await refreshProfile();
      Alert.alert('Staff Profile Saved! 🎓', 'Your faculty details have been updated.', [
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
            <Text style={styles.navTitle}>Staff Profile</Text>
          </View>

          <View style={styles.navAvatar}>
            <Ionicons name="person" size={18} color="#FFFFFF" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerBlock}>
            <Text style={styles.pageTitle}>JNV Faculty & Staff Details</Text>
            <Text style={styles.pageSubTitle}>
              Update your administrative profile for {user?.jnvName || 'your Vidyalaya'}
            </Text>
          </View>

          {/* Vidyalaya Card */}
          <View style={styles.schoolCard}>
            <View style={styles.schoolIconCircle}>
              <Ionicons name="business" size={22} color={AppColors.primary} />
            </View>
            <View style={styles.schoolInfoCol}>
              <Text style={styles.schoolLabel}>Confirmed Vidyalaya</Text>
              <Text style={styles.schoolName}>{user?.jnvName || 'JNV Vidyalaya'}</Text>
            </View>
          </View>

          {/* Official Designation (Backend: designation) */}
          <View style={styles.card}>
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
                placeholder="e.g. PGT Computer Science"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>

            {/* Quick Suggestions */}
            <View style={styles.pillsRow}>
              {COMMON_DESIGNATIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.quickPill, designation === item && styles.quickPillActive]}
                  onPress={() => setDesignation(item)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.quickPillText,
                      designation === item && styles.quickPillTextActive,
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Alumni Coordinator Toggle (Backend: isAlumniCoordinator) */}
          <View style={styles.card}>
            <View style={styles.coordinatorRow}>
              <View style={styles.coordinatorIconBox}>
                <Ionicons name="ribbon-outline" size={22} color="#B45309" />
              </View>
              <View style={styles.coordinatorTextCol}>
                <Text style={styles.coordinatorTitle}>Designated Alumni Coordinator</Text>
                <Text style={styles.coordinatorSub}>
                  Enables you to verify alumni profiles and coordinate mentorship guidance for students.
                </Text>
              </View>
              <Switch
                value={isAlumniCoordinator}
                onValueChange={setIsAlumniCoordinator}
                trackColor={{ false: '#CBD5E1', true: AppColors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Submit Action */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleFinish}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.ctaContent}>
                <Text style={styles.ctaText}>Save Details</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navButton: {
    padding: 4,
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  headerBlock: {
    gap: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubTitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  schoolIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolInfoCol: {
    flex: 1,
    gap: 2,
  },
  schoolLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    textTransform: 'uppercase',
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 14,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  quickPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickPillActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  quickPillText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  quickPillTextActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  coordinatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coordinatorIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coordinatorTextCol: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  coordinatorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  coordinatorSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  ctaButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
});
