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

const TOPICS = [
  'JEE Prep',
  'Computer Science',
  'Medical Careers',
  'Soft Skills & Interviews',
  'Civil Services / UPSC',
  'Overseas Studies',
  'Entrepreneurship',
];

export default function AlumniProfileScreen() {
  const router = useRouter();
  const { user, fullProfile, refreshProfile } = useAuth();

  const [batchYear, setBatchYear] = useState(
    fullProfile?.alumniDetails?.joinBatchYear?.toString() || '2014'
  );
  const [currentOrg, setCurrentOrg] = useState(
    fullProfile?.alumniDetails?.currentOrg || 'Google India'
  );
  const [designation, setDesignation] = useState(
    fullProfile?.alumniDetails?.designation || 'Senior Software Engineer'
  );
  const [currentCity, setCurrentCity] = useState(
    fullProfile?.alumniDetails?.currentCity || 'Bengaluru, Karnataka'
  );
  const [bio, setBio] = useState(
    fullProfile?.alumniDetails?.bio ||
      'Navodaya Pune region alumnus (2014). Passionate about helping rural students crack JEE & enter top tier tech. Happy to guide on software engineering, open source & college roadmaps.'
  );

  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    fullProfile?.alumniDetails?.provideMentorshipsOn || [
      'JEE Prep',
      'Computer Science',
      'Soft Skills & Interviews',
    ]
  );

  const [onlineVideo, setOnlineVideo] = useState(
    fullProfile?.alumniDetails?.willingModes?.includes('Online Video / Chat') ?? true
  );
  const [schoolVisits, setSchoolVisits] = useState(
    fullProfile?.alumniDetails?.willingModes?.includes('In-Person at JNV School Visits') ?? true
  );
  const [openToHelp, setOpenToHelp] = useState(fullProfile?.alumniDetails?.openToHelp ?? true);

  const [loading, setLoading] = useState(false);

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleFinish = async () => {
    const year = parseInt(batchYear, 10);
    if (isNaN(year) || year < 1980 || year > 2035) {
      Alert.alert('Invalid Year', 'Please enter a valid passing batch year (e.g. 2014).');
      return;
    }

    if (!currentOrg.trim() || !designation.trim() || !currentCity.trim()) {
      Alert.alert('Incomplete Fields', 'Please fill in your organization, designation, and city.');
      return;
    }

    const willingModes: string[] = [];
    if (onlineVideo) willingModes.push('Online Video / Chat');
    if (schoolVisits) willingModes.push('In-Person at JNV School Visits');

    setLoading(true);
    try {
      await userApi.updateAlumniProfile({
        joinBatchYear: year,
        currentOrg: currentOrg.trim(),
        designation: designation.trim(),
        currentCity: currentCity.trim(),
        bio: bio.trim().slice(0, 250),
        provideMentorshipsOn: selectedTopics,
        willingModes,
        openToHelp,
      });

      await refreshProfile();
      Alert.alert('Welcome, Mentor! 🎉', 'Your alumni mentorship profile has been published successfully.', [
        { text: 'Go to Dashboard', onPress: () => router.replace('/home') },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to save alumni profile.';
      Alert.alert('Profile Error', msg);
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
                <Text style={styles.stepBadgeNumber}>2</Text>
                <Text style={styles.stepBadgeText}>Step 2 of 2: Alumni Career & Mentorship</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill100} />
            </View>
          </View>

          {/* Banner */}
          <View style={styles.bannerCard}>
            <Text style={styles.bannerTitle}>Alumni Details</Text>
            <Text style={styles.bannerSub}>
              Help current JNV students learn from your real-world journey
            </Text>
          </View>

          {/* Passing Batch Field */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>
                JNV Passing Batch (Class 12) <Text style={styles.asterisk}>*</Text>
              </Text>
              <Text style={styles.fieldCaption}>Passed out year</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="school-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={batchYear}
                onChangeText={setBatchYear}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="2014"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>
          </View>

          {/* Organization Field */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>
              Current Organization / College <Text style={styles.asterisk}>*</Text>
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={currentOrg}
                onChangeText={setCurrentOrg}
                placeholder="Google India"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>
          </View>

          {/* Designation Field */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>
              Designation <Text style={styles.asterisk}>*</Text>
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="id-card-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={designation}
                onChangeText={setDesignation}
                placeholder="Senior Software Engineer"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>
          </View>

          {/* Current City Field */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>
              Current City <Text style={styles.asterisk}>*</Text>
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={18} color="#B45309" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={currentCity}
                onChangeText={setCurrentCity}
                placeholder="Bengaluru, Karnataka"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>
          </View>

          {/* Bio Field */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Short Bio</Text>
              <Text style={styles.fieldCaption}>{bio.length} / 250</Text>
            </View>

            <View style={styles.bioContainer}>
              <TextInput
                style={styles.bioInput}
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={250}
                placeholder="Share a brief overview of your journey and what advice you can share..."
                placeholderTextColor={AppColors.textMuted}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Mentorship Topics */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Mentorship Topics (Select what you can mentor)</Text>
              <Text style={styles.fieldCaption}>{selectedTopics.length} selected</Text>
            </View>

            <View style={styles.topicsWrap}>
              {TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <TouchableOpacity
                    key={topic}
                    style={[
                      styles.topicPill,
                      isSelected ? styles.topicPillActive : styles.topicPillDefault,
                    ]}
                    onPress={() => toggleTopic(topic)}
                    activeOpacity={0.7}>
                    <Ionicons
                      name={isSelected ? 'checkmark' : 'add'}
                      size={14}
                      color={isSelected ? AppColors.primary : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.topicPillText,
                        isSelected ? styles.topicPillTextActive : styles.topicPillTextDefault,
                      ]}>
                      {topic}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Preferred Modes of Interaction */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Preferred Modes of Interaction</Text>

            {/* Online Video / Chat */}
            <TouchableOpacity
              style={styles.modeCard}
              onPress={() => setOnlineVideo(!onlineVideo)}
              activeOpacity={0.8}>
              <View style={styles.modeIconCircle}>
                <Ionicons name="videocam-outline" size={18} color={AppColors.primary} />
              </View>
              <View style={styles.modeTextCol}>
                <Text style={styles.modeTitle}>Online Video / Chat</Text>
                <Text style={styles.modeSub}>1:1 virtual guidance sessions & query resolution</Text>
              </View>
              <View style={[styles.checkbox, onlineVideo && styles.checkboxActive]}>
                {onlineVideo && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>

            {/* In-Person Visits */}
            <TouchableOpacity
              style={styles.modeCard}
              onPress={() => setSchoolVisits(!schoolVisits)}
              activeOpacity={0.8}>
              <View style={styles.modeIconCircle}>
                <Ionicons name="people-outline" size={18} color="#B45309" />
              </View>
              <View style={styles.modeTextCol}>
                <View style={styles.modeTitleRow}>
                  <Text style={styles.modeTitle}>In-Person at JNV School Visits</Text>
                  <View style={styles.alumniMeetBadge}>
                    <Text style={styles.alumniMeetBadgeText}>ALUMNI MEET</Text>
                  </View>
                </View>
                <Text style={styles.modeSub}>Campus guest talks and summer mentorship camps</Text>
              </View>
              <View style={[styles.checkbox, schoolVisits && styles.checkboxActive]}>
                {schoolVisits && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Available to guide toggle */}
          <View style={styles.availableToggleCard}>
            <View style={styles.availableIconCircle}>
              <Ionicons name="heart-circle-outline" size={24} color="#059669" />
            </View>
            <View style={styles.availableTextCol}>
              <Text style={styles.availableTitle}>Available to guide juniors</Text>
              <Text style={styles.availableSub}>
                You can pause mentorship requests anytime from settings.
              </Text>
            </View>
            <Switch
              value={openToHelp}
              onValueChange={setOpenToHelp}
              trackColor={{ false: '#CBD5E1', true: AppColors.primary }}
              thumbColor="#FFFFFF"
            />
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
                <Text style={styles.ctaText}>Submit Alumni Profile</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.safetyCharterText}>
            By submitting, you agree to uphold Navodisha's student safety charter.
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
    gap: 6,
  },
  stepBadgeNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#B45309',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill100: {
    width: '100%',
    height: '100%',
    backgroundColor: AppColors.primary,
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
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
    marginBottom: 8,
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
  bioContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    minHeight: 90,
  },
  bioInput: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 19,
  },
  topicsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  topicPillDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  topicPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  topicPillText: {
    fontSize: 12,
  },
  topicPillTextDefault: {
    color: '#334155',
    fontWeight: '500',
  },
  topicPillTextActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 12,
  },
  modeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTextCol: {
    flex: 1,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  alumniMeetBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alumniMeetBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modeSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  availableToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  availableIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableTextCol: {
    flex: 1,
  },
  availableTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  availableSub: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 15,
  },
  ctaButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  safetyCharterText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
});
