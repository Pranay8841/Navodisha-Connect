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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { AppColors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { sendOtp, setPendingPhone } = useAuth();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const fullPhoneNumber = `+91${cleaned}`;
    setLoading(true);

    try {
      await sendOtp(fullPhoneNumber);
      router.push('/otp');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to send OTP code. Please verify backend is running.';
      Alert.alert('OTP Request Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          
          {/* Top Logo & Branding */}
          <View style={styles.headerSection}>
            <View style={styles.logoCard}>
              <View style={styles.logoCircle}>
                <Ionicons name="school" size={32} color={AppColors.primary} />
                <View style={styles.starBadge}>
                  <Ionicons name="sparkles" size={10} color={AppColors.gold} />
                </View>
              </View>
            </View>

            {/* Pill Badge */}
            <View style={styles.networkBadge}>
              <Ionicons name="star" size={12} color={AppColors.goldDark} />
              <Text style={styles.networkBadgeText}>JNV Mentorship Network</Text>
            </View>

            <Text style={styles.title}>Navodisha Connect</Text>
            <Text style={styles.subtitle}>Empowering Navodayans across generations</Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In or Register</Text>
            <Text style={styles.cardSubtitle}>Enter your mobile number to get started</Text>

            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.inputRow}>
              {/* Country Code Pill */}
              <View style={styles.countryCodeBox}>
                <Text style={styles.flagText}>🇮🇳</Text>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>

              {/* Number Input */}
              <TextInput
                style={styles.phoneInput}
                placeholder="98765 43210"
                placeholderTextColor={AppColors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
                editable={!loading}
              />
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={[
                styles.ctaButton,
                phone.length === 10 ? styles.ctaButtonActive : styles.ctaButtonDisabled,
              ]}
              onPress={handleSendOtp}
              disabled={phone.length !== 10 || loading}
              activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.ctaContent}>
                  <Text style={styles.ctaText}>Get OTP Code</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Terms text */}
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>student safety guidelines</Text> &{' '}
              <Text style={styles.termsLink}>alumni code of conduct</Text>.
            </Text>
          </View>

          {/* Bottom Trust Card */}
          <View style={styles.trustCard}>
            <View style={styles.trustItem}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="business" size={18} color="#B45309" />
              </View>
              <Text style={styles.trustTitle}>661+ JNVs</Text>
              <Text style={styles.trustSub}>Connected</Text>
            </View>

            <View style={styles.trustDivider} />

            <View style={styles.trustItem}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#059669" />
              </View>
              <Text style={styles.trustTitle}>100% Verified</Text>
              <Text style={styles.trustSub}>Navodaya Clan</Text>
            </View>

            <View style={styles.trustDivider} />

            <View style={styles.trustItem}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="school" size={18} color="#D97706" />
              </View>
              <Text style={styles.trustTitle}>Zero Cost</Text>
              <Text style={styles.trustSub}>Free Mentorship</Text>
            </View>
          </View>

          {/* Bottom Signature */}
          <View style={styles.footerSignature}>
            <Ionicons name="heart-outline" size={14} color="#94A3B8" />
            <Text style={styles.footerSignatureText}>Built with pride by the JNV Alumni Network</Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCard: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  starBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  networkBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  flagText: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  phoneInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ctaButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  termsText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  trustCard: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
  },
  trustIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  trustSub: {
    fontSize: 10,
    color: '#64748B',
  },
  trustDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#CBD5E1',
  },
  footerSignature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerSignatureText: {
    fontSize: 12,
    color: '#64748B',
  },
});
