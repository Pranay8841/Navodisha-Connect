import React, { useState, useEffect, useRef } from 'react';
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
import { AppColors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

export default function OtpVerificationScreen() {
  const router = useRouter();
  const { pendingPhone, verifyOtp, sendOtp } = useAuth();

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // Pasting full 6-digit code
      const pasted = cleaned.slice(0, 6).split('');
      pasted.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    // Auto advance focus to next box
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(fullCode);
      if (result.userExists) {
        // Existing user directly logged in
        router.replace('/home');
      } else {
        // New user proceeded to Step 1
        router.push('/register/step1');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Invalid or expired OTP code.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const res = await sendOtp(pendingPhone);
      setTimeLeft(res.cooldownSeconds || 60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('OTP Sent', 'A new verification code has been generated.');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to resend code.';
      Alert.alert('Resend Failed', msg);
    } finally {
      setResendLoading(false);
    }
  };

  const isComplete = otpDigits.every((d) => d !== '');

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
          
          {/* Top Verification Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <Ionicons name="mail" size={22} color={AppColors.primary} />
              </View>

              <View style={styles.cardHeaderTextCol}>
                <Text style={styles.cardHeaderTitle}>Verify Phone Number</Text>
                <Text style={styles.cardHeaderSub}>We sent a 6-digit verification code</Text>
              </View>

              <View style={styles.smsBadge}>
                <View style={styles.smsDot} />
                <Text style={styles.smsBadgeText}>SMS Sent</Text>
              </View>
            </View>

            {/* Recipient Number Box */}
            <View style={styles.recipientBox}>
              <View style={styles.phoneIconCircle}>
                <Ionicons name="phone-portrait-outline" size={18} color="#475569" />
              </View>

              <View style={styles.recipientTextCol}>
                <Text style={styles.recipientLabel}>RECIPIENT MOBILE</Text>
                <Text style={styles.recipientNumber}>{pendingPhone || '+91 98765 43210'}</Text>
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.back()}
                activeOpacity={0.7}>
                <Ionicons name="pencil" size={14} color="#1E293B" />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* OTP Entry Card */}
          <View style={styles.card}>
            <View style={styles.otpHeaderRow}>
              <Text style={styles.otpLabel}>Enter 6-digit Code</Text>
              <View style={styles.autoDetectBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#059669" />
                <Text style={styles.autoDetectText}>Auto-detecting SMS OTP</Text>
              </View>
            </View>

            {/* 6 Digit Input Boxes */}
            <View style={styles.otpBoxesRow}>
              {otpDigits.map((digit, index) => {
                const isFocused = otpDigits.findIndex((d) => d === '') === index;
                return (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      isFocused ? styles.otpBoxFocused : null,
                    ]}>
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={styles.otpBoxInput}
                      value={digit}
                      onChangeText={(val) => handleDigitChange(index, val)}
                      onKeyPress={(e) => handleKeyPress(index, e)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      autoFocus={index === 0}
                    />
                    {isFocused && !digit && <View style={styles.activeUnderline} />}
                  </View>
                );
              })}
            </View>

            {/* Local dev helper info banner */}
            <View style={styles.devHintBanner}>
              <View style={styles.devHintIcon}>
                <Ionicons name="chatbox-ellipses" size={16} color="#D97706" />
              </View>
              <Text style={styles.devHintText}>
                OTP code is logged in Spring Boot console: <Text style={styles.devHintBold}>backend log</Text>
              </Text>
            </View>

            {/* Resend Timer Row */}
            <View style={styles.timerRow}>
              <View style={styles.timerLeft}>
                <Ionicons name="time-outline" size={16} color="#64748B" />
                <Text style={styles.timerText}>
                  Resend code in{' '}
                  <Text style={styles.timerBold}>
                    0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                  </Text>
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleResend}
                disabled={timeLeft > 0 || resendLoading}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.resendBtnText,
                    timeLeft === 0 ? styles.resendBtnActive : styles.resendBtnDisabled,
                  ]}>
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Timer Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(0, (1 - timeLeft / 60) * 100))}%` },
                ]}
              />
            </View>
            <Text style={styles.timerHelperText}>
              Resend link activates automatically when timer elapses
            </Text>
          </View>

          {/* WhatsApp / Alternate option */}
          <View style={styles.altChannelCard}>
            <View style={styles.altChannelIcon}>
              <Ionicons name="chatbubbles" size={18} color="#059669" />
            </View>
            <View style={styles.altChannelTextCol}>
              <Text style={styles.altChannelTitle}>Didn't receive SMS?</Text>
              <Text style={styles.altChannelSub}>Get verification code via WhatsApp</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>

          {/* Verify & Continue CTA */}
          <TouchableOpacity
            style={[
              styles.ctaButton,
              isComplete ? styles.ctaButtonActive : styles.ctaButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={!isComplete || loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.ctaContent}>
                <Text style={styles.ctaText}>Verify & Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.securityRow}>
            <Ionicons name="lock-closed" size={13} color="#059669" />
            <Text style={styles.securityText}>
              256-bit encrypted JNV Alumni Network authentication
            </Text>
          </View>

          {/* Navodisha Samiti Footer Card */}
          <View style={styles.samitiCard}>
            <View style={styles.samitiIcon}>
              <Ionicons name="school" size={20} color="#D97706" />
            </View>
            <View style={styles.samitiTextCol}>
              <View style={styles.samitiTitleRow}>
                <Text style={styles.samitiTitle}>Navodisha Samiti</Text>
                <View style={styles.samitiBadge}>
                  <Text style={styles.samitiBadgeText}>JNV Odisha</Text>
                </View>
              </View>
              <Text style={styles.samitiSub}>
                Connecting 30+ Vidyalayas, 12,000+ alumni, and scholars across India.
              </Text>
            </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderTextCol: {
    flex: 1,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardHeaderSub: {
    fontSize: 13,
    color: '#64748B',
  },
  smsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  smsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  smsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.primary,
  },
  recipientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phoneIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recipientTextCol: {
    flex: 1,
  },
  recipientLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  recipientNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  editText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  autoDetectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  autoDetectText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  otpBoxFilled: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  otpBoxFocused: {
    borderColor: AppColors.primary,
    backgroundColor: '#FFFFFF',
  },
  otpBoxInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 8,
    width: 14,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: AppColors.primary,
  },
  devHintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  devHintIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devHintText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },
  devHintBold: {
    fontWeight: '700',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 13,
    color: '#64748B',
  },
  timerBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resendBtnActive: {
    color: AppColors.primary,
  },
  resendBtnDisabled: {
    color: '#94A3B8',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
  },
  timerHelperText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  altChannelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 12,
  },
  altChannelIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  altChannelTextCol: {
    flex: 1,
  },
  altChannelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  altChannelSub: {
    fontSize: 11,
    color: '#64748B',
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
    marginBottom: 20,
  },
  securityText: {
    fontSize: 11,
    color: '#64748B',
  },
  samitiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  samitiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  samitiTextCol: {
    flex: 1,
  },
  samitiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  samitiTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  samitiBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  samitiBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  samitiSub: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
});
