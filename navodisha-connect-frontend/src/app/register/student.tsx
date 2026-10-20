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
import { userApi } from '../../api/user';
import { ClassLevelType, HouseType, StreamType } from '../../api/types';

const STREAMS: StreamType[] = [
  'Science (PCM)',
  'Science (PCB)',
  'Science (PCMB)',
  'Commerce',
  'Arts',
];

const EXAMS = [
  'JEE Advanced',
  'NEET',
  'NDA',
  'CUET-UG',
  'Commerce Foundation',
  'Olympiads',
];

export default function StudentProfileScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [admissionYear, setAdmissionYear] = useState('2020');
  const [currentClass, setCurrentClass] = useState<ClassLevelType>('Class 12');
  const [stream, setStream] = useState<StreamType>('Science (PCM)');
  const [selectedHouse, setSelectedHouse] = useState<HouseType>('ARAVALI');
  const [selectedExams, setSelectedExams] = useState<string[]>(['JEE Advanced', 'NDA']);
  const [isStreamOpen, setIsStreamOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleExam = (exam: string) => {
    if (selectedExams.includes(exam)) {
      setSelectedExams(selectedExams.filter((e) => e !== exam));
    } else {
      setSelectedExams([...selectedExams, exam]);
    }
  };

  const handleFinish = async () => {
    const year = parseInt(admissionYear, 10);
    if (isNaN(year) || year < 1986 || year > 2035) {
      Alert.alert('Invalid Year', 'Please enter a valid admission year (e.g. 2020).');
      return;
    }

    setLoading(true);
    try {
      await userApi.updateStudentProfile({
        joinBatchYear: year,
        classLevel: currentClass,
        stream,
        house: selectedHouse,
        preparingFor: selectedExams,
      });

      await refreshProfile();
      Alert.alert('Welcome to Navodisha! 🎉', 'Your student mentorship profile has been created successfully.', [
        { text: 'Enter Platform', onPress: () => router.replace('/home') },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to save student profile.';
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
                <Text style={styles.stepBadgeText}>STEP 2 OF 2</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill100} />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.pageTitle}>Student Profile (Classes 10–12)</Text>
          <View style={styles.subTitleRow}>
            <Ionicons name="school-outline" size={14} color="#64748B" />
            <Text style={styles.pageSubTitle}>
              {user?.jnvName || 'JNV Gadchiroli'} • Class 10 to 12 Academic Track
            </Text>
          </View>

          {/* Admission Year Field */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Admission / Joining Year to JNV</Text>
              <Text style={styles.fieldCaption}>Class 6 Entry</Text>
            </View>

            <View style={styles.yearInputBox}>
              <Ionicons name="calendar-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.yearInput}
                value={admissionYear}
                onChangeText={setAdmissionYear}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="2020"
                placeholderTextColor={AppColors.textMuted}
              />
              <View style={styles.navodayanBadge}>
                <Text style={styles.navodayanBadgeText}>Navodayan</Text>
              </View>
            </View>
          </View>

          {/* Current Class Field */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Current Class</Text>

            <View style={styles.classSegmentRow}>
              {(['Class 10', 'Class 11', 'Class 12'] as ClassLevelType[]).map((cls) => {
                const isSelected = currentClass === cls;
                return (
                  <TouchableOpacity
                    key={cls}
                    style={[
                      styles.classSegmentBtn,
                      isSelected ? styles.classSegmentBtnActive : styles.classSegmentBtnDefault,
                    ]}
                    onPress={() => setCurrentClass(cls)}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.classSegmentText,
                        isSelected ? styles.classSegmentTextActive : styles.classSegmentTextDefault,
                      ]}>
                      {cls}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Academic Stream Field */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Academic Stream</Text>
              <View style={styles.seniorWingBadge}>
                <Text style={styles.seniorWingText}>Senior Wing</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setIsStreamOpen(!isStreamOpen)}
              activeOpacity={0.8}>
              <Ionicons name="book-outline" size={18} color={AppColors.primary} style={styles.inputIcon} />
              <Text style={styles.dropdownValueText}>{stream}</Text>
              <Ionicons
                name={isStreamOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>

            {isStreamOpen && (
              <View style={styles.dropdownList}>
                {STREAMS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.dropdownItem, stream === s && styles.dropdownItemActive]}
                    onPress={() => {
                      setStream(s);
                      setIsStreamOpen(false);
                    }}>
                    <Text
                      style={[styles.dropdownItemText, stream === s && styles.dropdownItemTextActive]}>
                      {s}
                    </Text>
                    {stream === s && <Ionicons name="checkmark" size={16} color={AppColors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* JNV House Selection Field */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <View style={styles.houseLabelGroup}>
                <Text style={styles.fieldLabel}>JNV House</Text>
                <Ionicons name="shield-checkmark" size={14} color="#D97706" />
              </View>
              <Text style={styles.fieldCaption}>Signature JNV Identity</Text>
            </View>

            <View style={styles.houseGrid}>
              {/* Aravali */}
              <TouchableOpacity
                style={[
                  styles.houseCard,
                  selectedHouse === 'ARAVALI' ? styles.houseCardSelected : styles.houseCardDefault,
                ]}
                onPress={() => setSelectedHouse('ARAVALI')}
                activeOpacity={0.8}>
                {selectedHouse === 'ARAVALI' && (
                  <View style={[styles.houseCheck, { backgroundColor: '#1E40AF' }]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.houseIconOuter, { backgroundColor: '#EFF6FF' }]}>
                  <View style={[styles.houseIconInner, { backgroundColor: '#1E40AF' }]} />
                </View>
                <View style={styles.houseTextCol}>
                  <Text style={styles.houseName}>Aravali</Text>
                  <Text style={styles.houseMotto}>Courage & Pride</Text>
                </View>
              </TouchableOpacity>

              {/* Nilgiri */}
              <TouchableOpacity
                style={[
                  styles.houseCard,
                  selectedHouse === 'NILGIRI' ? styles.houseCardSelected : styles.houseCardDefault,
                ]}
                onPress={() => setSelectedHouse('NILGIRI')}
                activeOpacity={0.8}>
                {selectedHouse === 'NILGIRI' && (
                  <View style={[styles.houseCheck, { backgroundColor: '#059669' }]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.houseIconOuter, { backgroundColor: '#ECFDF5' }]}>
                  <View style={[styles.houseIconInner, { backgroundColor: '#10B981' }]} />
                </View>
                <View style={styles.houseTextCol}>
                  <Text style={styles.houseName}>Nilgiri</Text>
                  <Text style={styles.houseMotto}>Wisdom & Calm</Text>
                </View>
              </TouchableOpacity>

              {/* Shivalik */}
              <TouchableOpacity
                style={[
                  styles.houseCard,
                  selectedHouse === 'SHIVALIK' ? styles.houseCardSelected : styles.houseCardDefault,
                ]}
                onPress={() => setSelectedHouse('SHIVALIK')}
                activeOpacity={0.8}>
                {selectedHouse === 'SHIVALIK' && (
                  <View style={[styles.houseCheck, { backgroundColor: '#DC2626' }]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.houseIconOuter, { backgroundColor: '#FEF2F2' }]}>
                  <View style={[styles.houseIconInner, { backgroundColor: '#EF4444' }]} />
                </View>
                <View style={styles.houseTextCol}>
                  <Text style={styles.houseName}>Shivalik</Text>
                  <Text style={styles.houseMotto}>Strength & Valor</Text>
                </View>
              </TouchableOpacity>

              {/* Udaygiri */}
              <TouchableOpacity
                style={[
                  styles.houseCard,
                  selectedHouse === 'UDAYGIRI' ? styles.houseCardSelected : styles.houseCardDefault,
                ]}
                onPress={() => setSelectedHouse('UDAYGIRI')}
                activeOpacity={0.8}>
                {selectedHouse === 'UDAYGIRI' && (
                  <View style={[styles.houseCheck, { backgroundColor: '#D97706' }]}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.houseIconOuter, { backgroundColor: '#FFFBEB' }]}>
                  <View style={[styles.houseIconInner, { backgroundColor: '#F59E0B' }]} />
                </View>
                <View style={styles.houseTextCol}>
                  <Text style={styles.houseName}>Udaygiri</Text>
                  <Text style={styles.houseMotto}>Radiance & Hope</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Target Competitive Exams */}
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Target Competitive Exams</Text>
              <Text style={styles.fieldCaption}>Multi-select</Text>
            </View>

            <View style={styles.examsWrap}>
              {EXAMS.map((exam) => {
                const isSelected = selectedExams.includes(exam);
                return (
                  <TouchableOpacity
                    key={exam}
                    style={[styles.examPill, isSelected ? styles.examPillActive : styles.examPillDefault]}
                    onPress={() => toggleExam(exam)}
                    activeOpacity={0.7}>
                    <Ionicons
                      name={isSelected ? 'checkmark' : 'add'}
                      size={14}
                      color={isSelected ? '#B45309' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.examPillText,
                        isSelected ? styles.examPillTextActive : styles.examPillTextDefault,
                      ]}>
                      {exam}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Mentors Available Card */}
          <View style={styles.mentorsBanner}>
            <View style={styles.mentorsIconBox}>
              <Ionicons name="people" size={20} color={AppColors.primary} />
            </View>
            <View style={styles.mentorsTextCol}>
              <Text style={styles.mentorsTitle}>142 Navodisha Mentors Available</Text>
              <Text style={styles.mentorsSub}>
                From IITs, AIIMS, & Civil Services for your Vidyalaya...
              </Text>
            </View>
          </View>

          {/* CTA Finish Button */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleFinish}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.ctaContent}>
                <Text style={styles.ctaText}>Finish Setup & Enter Platform 🚀</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.bottomHelperText}>
            You can update your academic details anytime from your profile
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
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  stepBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBadgeNumber: {
    display: 'none',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.primary,
    letterSpacing: 0.5,
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
    marginBottom: 20,
  },
  pageSubTitle: {
    fontSize: 12,
    color: '#64748B',
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
  houseLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldCaption: {
    fontSize: 12,
    color: '#64748B',
  },
  inputIcon: {
    marginRight: 10,
  },
  yearInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 52,
  },
  yearInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  navodayanBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  navodayanBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.primary,
  },
  classSegmentRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    gap: 6,
  },
  classSegmentBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classSegmentBtnDefault: {
    backgroundColor: 'transparent',
  },
  classSegmentBtnActive: {
    backgroundColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  classSegmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  classSegmentTextDefault: {
    color: '#475569',
  },
  classSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  seniorWingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  seniorWingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 52,
  },
  dropdownValueText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownList: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#334155',
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: AppColors.primary,
  },
  houseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  houseCard: {
    width: '48%',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    position: 'relative',
    gap: 10,
  },
  houseCardDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  houseCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: AppColors.primary,
  },
  houseCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseIconOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseIconInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  houseTextCol: {
    flex: 1,
  },
  houseName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  houseMotto: {
    fontSize: 9,
    color: '#64748B',
  },
  examsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  examPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  examPillDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  examPillActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  examPillText: {
    fontSize: 12,
  },
  examPillTextDefault: {
    color: '#334155',
    fontWeight: '500',
  },
  examPillTextActive: {
    color: '#92400E',
    fontWeight: '700',
  },
  mentorsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  mentorsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorsTextCol: {
    flex: 1,
  },
  mentorsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  mentorsSub: {
    fontSize: 11,
    color: '#475569',
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
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomHelperText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
});
