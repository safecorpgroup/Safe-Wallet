import { Stack } from "expo-router";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { WalletProvider } from "./context/WalletContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, Alert,
  ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Dimensions,
  Animated, Vibration,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

if (typeof globalThis.fetch === 'undefined') {
  // @ts-ignore
  globalThis.fetch = fetch;
}

const { width } = Dimensions.get('window');

// ============ AUTH SCREENS ============

function WelcomeScreen() {
  const { colors } = useTheme();
  const { setAuthStep } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[s.welcomeContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={[s.logoCircle, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
          <Image
            source={{ uri: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978827102_89b5c4bc.png' }}
            style={{ width: 80, height: 80, borderRadius: 40 }}
          />
        </View>
        <Text style={[s.welcomeTitle, { color: colors.text }]}>Safe Wallet</Text>
        <Text style={[s.welcomeSubtitle, { color: colors.textSecondary }]}>
          Your secure gateway to crypto & fiat
        </Text>
        <View style={s.featureList}>
          {[
            { icon: 'shield-checkmark', text: 'Bank-grade security with 2FA' },
            { icon: 'swap-horizontal', text: 'Swap NGN to crypto instantly' },
            { icon: 'people', text: 'P2P trading marketplace' },
            { icon: 'chatbubbles', text: 'In-app encrypted messaging' },
          ].map((f, i) => (
            <View key={i} style={s.featureRow}>
              <View style={[s.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={f.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={[s.featureText, { color: colors.textSecondary }]}>{f.text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
      <View style={s.welcomeBottom}>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => setAuthStep('phone')}
        >
          <Text style={s.primaryBtnText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </TouchableOpacity>
        <Text style={[s.termsText, { color: colors.textMuted }]}>
          By continuing, you agree to our Terms of Service & Privacy Policy
        </Text>
      </View>
    </View>
  );
}

function PhoneScreen() {
  const { colors } = useTheme();
  const { phoneNumber, setPhoneNumber, setAuthStep, setOtpCode, sendOtp, sendEmailOtp, rateLimitInfo, otpMethod, setOtpMethod, otpEmail, setOtpEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryCode, setCountryCode] = useState('+234');
  const [countryFlag, setCountryFlag] = useState('NG');
  const [localPhone, setLocalPhone] = useState('');

  const countries = [
    { code: '+234', flag: 'NG', name: 'Nigeria' },
    { code: '+1', flag: 'US', name: 'United States' },
    { code: '+44', flag: 'GB', name: 'United Kingdom' },
    { code: '+91', flag: 'IN', name: 'India' },
    { code: '+233', flag: 'GH', name: 'Ghana' },
    { code: '+254', flag: 'KE', name: 'Kenya' },
    { code: '+27', flag: 'ZA', name: 'South Africa' },
    { code: '+971', flag: 'AE', name: 'UAE' },
    { code: '+86', flag: 'CN', name: 'China' },
    { code: '+81', flag: 'JP', name: 'Japan' },
  ];

  const flagEmojis: Record<string, string> = {
    'NG': '\u{1F1F3}\u{1F1EC}', 'US': '\u{1F1FA}\u{1F1F8}', 'GB': '\u{1F1EC}\u{1F1E7}',
    'IN': '\u{1F1EE}\u{1F1F3}', 'GH': '\u{1F1EC}\u{1F1ED}', 'KE': '\u{1F1F0}\u{1F1EA}',
    'ZA': '\u{1F1FF}\u{1F1E6}', 'AE': '\u{1F1E6}\u{1F1EA}', 'CN': '\u{1F1E8}\u{1F1F3}',
    'JP': '\u{1F1EF}\u{1F1F5}',
  };

  const handleSendSMS = async () => {
    if (localPhone.length < 7) { Alert.alert('Error', 'Enter a valid phone number'); return; }
    const full = countryCode + localPhone.replace(/^0/, '');
    setPhoneNumber(full);
    setLoading(true);
    try {
      const { data, error } = await require('@/app/lib/supabase').supabase.functions.invoke('auth-otp', {
        body: { action: 'send_otp', phone: full },
      });
      if (data?.rate_limited) {
        Alert.alert('Rate Limited', 'Too many OTP requests. Please try again in 1 hour.');
        setLoading(false);
        return;
      }
      if (data?.success) {
        setPhoneNumber(full);
        setOtpCode('');
        setOtpMethod('sms');
        setLoading(false);
        setAuthStep('otp');
        return;
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    Alert.alert('Error', 'Failed to send OTP. Please try again.');
  };

  const handleSendEmail = async () => {
    if (!otpEmail || !otpEmail.includes('@')) { Alert.alert('Error', 'Enter a valid email'); return; }
    setLoading(true);
    const success = await sendEmailOtp(otpEmail);
    setLoading(false);
    if (success) {
      setOtpCode('');
      setOtpMethod('email');
      setAuthStep('otp');
    } else if (rateLimitInfo.isLimited) {
      Alert.alert('Rate Limited', 'Too many OTP requests. Please try again in 1 hour.');
    } else {
      Alert.alert('Error', 'Failed to send email OTP. Please try again.');
    }
  };

  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.authHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <TouchableOpacity onPress={() => setAuthStep('welcome')} style={[s.backBtn, { borderColor: colors.cardBorder }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.authContent}>
        <View style={[s.stepBadge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[s.stepText, { color: colors.primary }]}>Step 1 of 4</Text>
        </View>
        <Text style={[s.authTitle, { color: colors.text }]}>
          {authMode === 'phone' ? 'Enter your phone number' : 'Enter your email'}
        </Text>
        <Text style={[s.authSubtitle, { color: colors.textSecondary }]}>
          {authMode === 'phone' 
            ? 'We\'ll send you a 6-digit verification code via SMS'
            : 'We\'ll send you a 6-digit verification code via email'}
        </Text>

        {/* Auth Mode Toggle */}
        <View style={[s.authModeToggle, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[s.authModeBtn, authMode === 'phone' && { backgroundColor: colors.primary }]}
            onPress={() => setAuthMode('phone')}
          >
            <Ionicons name="call" size={16} color={authMode === 'phone' ? '#000' : colors.textMuted} />
            <Text style={[s.authModeBtnText, { color: authMode === 'phone' ? '#000' : colors.textMuted }]}>Phone</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.authModeBtn, authMode === 'email' && { backgroundColor: colors.primary }]}
            onPress={() => setAuthMode('email')}
          >
            <Ionicons name="mail" size={16} color={authMode === 'email' ? '#000' : colors.textMuted} />
            <Text style={[s.authModeBtnText, { color: authMode === 'email' ? '#000' : colors.textMuted }]}>Email</Text>
          </TouchableOpacity>
        </View>

        {authMode === 'phone' ? (
          <>
            <View style={s.phoneRow}>
              <TouchableOpacity
                style={[s.countryCode, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                onPress={() => setShowCountryPicker(!showCountryPicker)}
              >
                <Text style={s.countryFlagText}>{flagEmojis[countryFlag] || countryFlag}</Text>
                <Text style={[s.countryCodeText, { color: colors.text }]}>{countryCode}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
              </TouchableOpacity>
              <TextInput
                style={[s.phoneInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Phone number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={localPhone}
                onChangeText={setLocalPhone}
                maxLength={15}
              />
            </View>

            {showCountryPicker && (
              <View style={[s.countryList, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled>
                  {countries.map(c => (
                    <TouchableOpacity
                      key={c.code}
                      style={[s.countryItem, { borderBottomColor: colors.divider }]}
                      onPress={() => {
                        setCountryCode(c.code);
                        setCountryFlag(c.flag);
                        setShowCountryPicker(false);
                      }}
                    >
                      <Text style={s.countryFlagText}>{flagEmojis[c.flag] || c.flag}</Text>
                      <Text style={[s.countryName, { color: colors.text }]}>{c.name}</Text>
                      <Text style={[s.countryCodeSmall, { color: colors.textMuted }]}>{c.code}</Text>
                      {countryCode === c.code && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        ) : (
          <TextInput
            style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, marginBottom: 12 }]}
            placeholder="email@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={otpEmail}
            onChangeText={setOtpEmail}
          />
        )}

        {/* Rate Limit Warning */}
        {rateLimitInfo.isLimited && (
          <View style={[s.warningCard, { backgroundColor: '#EF444410', borderColor: '#EF444430', marginTop: 12 }]}>
            <Ionicons name="time" size={18} color="#EF4444" />
            <Text style={[s.warningText, { color: '#EF4444' }]}>
              Too many requests. Please wait before requesting another code.
              {rateLimitInfo.resetAt && ` Resets at ${new Date(rateLimitInfo.resetAt).toLocaleTimeString()}`}
            </Text>
          </View>
        )}

        {!rateLimitInfo.isLimited && rateLimitInfo.remaining < 3 && (
          <View style={[s.debugBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30', marginTop: 12 }]}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={[s.debugText, { color: colors.primary }]}>
              {rateLimitInfo.remaining} OTP request{rateLimitInfo.remaining !== 1 ? 's' : ''} remaining this hour
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={s.authBottom}>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: colors.primary, opacity: (authMode === 'phone' ? localPhone.length >= 7 : otpEmail.includes('@')) ? 1 : 0.5 }]}
          onPress={authMode === 'phone' ? handleSendSMS : handleSendEmail}
          disabled={(authMode === 'phone' ? localPhone.length < 7 : !otpEmail.includes('@')) || loading || rateLimitInfo.isLimited}
        >
          {loading ? <ActivityIndicator color="#000" /> : (
            <>
              <Text style={s.primaryBtnText}>Send Code</Text>
              <Ionicons name="arrow-forward" size={18} color="#000" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function OtpScreen() {
  const { colors } = useTheme();
  const { otpCode, setOtpCode, verifyOtp, setAuthStep, phoneNumber, debugOtp, generateWallet, smsDelivered, otpMethod, otpEmail, sendOtp, sendEmailOtp, rateLimitInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleVerify = async () => {
    if (otpCode.length !== 6) { Alert.alert('Error', 'Enter the 6-digit code'); return; }
    setLoading(true);
    const result = await verifyOtp();
    setLoading(false);
    if (result.success) {
      if (result.isNewUser) {
        generateWallet();
        setAuthStep('mnemonic');
      }
    } else {
      Alert.alert('Error', 'Invalid or expired code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    if (rateLimitInfo.isLimited) {
      Alert.alert('Rate Limited', 'Too many requests. Please wait before requesting another code.');
      return;
    }
    if (otpMethod === 'email') {
      await sendEmailOtp(otpEmail);
    } else {
      await sendOtp();
    }
    setTimer(60);
    Alert.alert('Sent', `New code sent to your ${otpMethod === 'email' ? 'email' : 'phone'}`);
  };

  const displayTarget = otpMethod === 'email' ? otpEmail : phoneNumber;

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.authHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <TouchableOpacity onPress={() => setAuthStep('phone')} style={[s.backBtn, { borderColor: colors.cardBorder }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.authContent}>
        <View style={[s.stepBadge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[s.stepText, { color: colors.primary }]}>Step 2 of 4</Text>
        </View>
        <Text style={[s.authTitle, { color: colors.text }]}>Verify your {otpMethod === 'email' ? 'email' : 'number'}</Text>
        <Text style={[s.authSubtitle, { color: colors.textSecondary }]}>
          Enter the 6-digit code sent to {displayTarget}
        </Text>

        {/* Delivery Status */}
        {otpMethod === 'sms' && (
          <View style={[s.deliveryStatus, { backgroundColor: smsDelivered ? '#22C55E10' : '#F5920010', borderColor: smsDelivered ? '#22C55E30' : '#F5920030' }]}>
            <Ionicons name={smsDelivered ? 'checkmark-circle' : 'information-circle'} size={16} color={smsDelivered ? '#22C55E' : '#F59200'} />
            <Text style={[s.deliveryStatusText, { color: smsDelivered ? '#22C55E' : '#F59200' }]}>
              {smsDelivered ? 'SMS delivered successfully' : 'SMS pending - check code below'}
            </Text>
          </View>
        )}

        <TextInput
          style={[s.otpInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="000000"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          value={otpCode}
          onChangeText={setOtpCode}
        />
        {debugOtp ? (
          <View style={[s.debugBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={[s.debugText, { color: colors.primary }]}>Verification code: {debugOtp}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={s.resendRow} onPress={handleResend} disabled={timer > 0}>
          <Text style={[s.resendText, { color: colors.textMuted }]}>Didn't receive code? </Text>
          <Text style={[s.resendLink, { color: timer > 0 ? colors.textMuted : colors.primary }]}>
            {timer > 0 ? `Resend in ${timer}s` : 'Resend'}
          </Text>
        </TouchableOpacity>

        {rateLimitInfo.isLimited && (
          <View style={[s.warningCard, { backgroundColor: '#EF444410', borderColor: '#EF444430', marginTop: 12 }]}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={[s.warningText, { color: '#EF4444' }]}>Rate limited. Please wait before requesting another code.</Text>
          </View>
        )}
      </ScrollView>
      <View style={s.authBottom}>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: colors.primary, opacity: otpCode.length === 6 ? 1 : 0.5 }]}
          onPress={handleVerify}
          disabled={otpCode.length !== 6 || loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : (
            <>
              <Text style={s.primaryBtnText}>Verify</Text>
              <Ionicons name="checkmark" size={18} color="#000" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}


function MnemonicScreen() {
  const { colors } = useTheme();
  const { generatedWallet, setAuthStep } = useAuth();
  const [confirmed, setConfirmed] = useState(false);

  if (!generatedWallet) return null;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.authHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <View style={{ width: 40 }} />
        <Text style={[s.headerTitle, { color: colors.text }]}>Backup Phrase</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.authContent}>
        <View style={[s.warningCard, { backgroundColor: '#EF444410', borderColor: '#EF444430' }]}>
          <Ionicons name="warning" size={18} color="#EF4444" />
          <Text style={[s.warningText, { color: '#EF4444' }]}>
            Write down these 12 words in order. This is the ONLY way to recover your wallet. Never share them.
          </Text>
        </View>

        <View style={s.mnemonicGrid}>
          {generatedWallet.mnemonic.map((word, i) => (
            <View key={i} style={[s.mnemonicWord, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[s.mnemonicNum, { color: colors.primary }]}>{i + 1}</Text>
              <Text style={[s.mnemonicText, { color: colors.text }]}>{word}</Text>
            </View>
          ))}
        </View>

        <View style={[s.addressPreview, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[s.addressLabel, { color: colors.textMuted }]}>YOUR WALLET ADDRESS</Text>
          <Text style={[s.addressValue, { color: colors.text }]} selectable>{generatedWallet.address}</Text>
        </View>

        <TouchableOpacity style={s.confirmRow} onPress={() => setConfirmed(!confirmed)}>
          <View style={[s.checkbox, { borderColor: colors.primary, backgroundColor: confirmed ? colors.primary : 'transparent' }]}>
            {confirmed && <Ionicons name="checkmark" size={14} color="#000" />}
          </View>
          <Text style={[s.confirmText, { color: colors.textSecondary }]}>
            I have written down my recovery phrase safely
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={s.authBottom}>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: colors.primary, opacity: confirmed ? 1 : 0.4 }]}
          onPress={() => setAuthStep('profile')}
          disabled={!confirmed}
        >
          <Text style={s.primaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ProfileSetupScreen() {
  const { colors } = useTheme();
  const { register, generatedWallet, setAuthStep } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('Not specified');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!generatedWallet) return;
    setLoading(true);
    const success = await register({
      email: email || undefined,
      username: username || undefined,
      gender,
      wallet_address: generatedWallet.address,
      mnemonic_hash: generatedWallet.mnemonic.join(' ').slice(0, 10) + '...',
    });
    setLoading(false);
    if (success) {
      setAuthStep('passcode_setup');
    } else {
      Alert.alert('Error', 'Registration failed. Username may be taken.');
    }
  };

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.authHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <TouchableOpacity onPress={() => setAuthStep('mnemonic')} style={[s.backBtn, { borderColor: colors.cardBorder }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.authContent}>
        <View style={[s.stepBadge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[s.stepText, { color: colors.primary }]}>Step 3 of 4</Text>
        </View>
        <Text style={[s.authTitle, { color: colors.text }]}>Complete your profile</Text>
        <Text style={[s.authSubtitle, { color: colors.textSecondary }]}>
          Set up your identity so others can find and pay you
        </Text>

        <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Username</Text>
        <TextInput
          style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="@username"
          placeholderTextColor={colors.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Email (optional)</Text>
        <TextInput
          style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="email@example.com"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Gender</Text>
        <View style={s.genderRow}>
          {['Male', 'Female', 'Not specified'].map(g => (
            <TouchableOpacity
              key={g}
              style={[s.genderBtn, {
                backgroundColor: gender === g ? colors.primary : colors.card,
                borderColor: gender === g ? colors.primary : colors.cardBorder,
              }]}
              onPress={() => setGender(g)}
            >
              <Text style={[s.genderText, { color: gender === g ? '#000' : colors.text }]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <View style={s.authBottom}>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#000" /> : (
            <>
              <Text style={s.primaryBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#000" />
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRegister} style={{ marginTop: 12 }}>
          <Text style={[s.skipText, { color: colors.textMuted }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function PasscodeSetupScreen() {
  const { colors } = useTheme();
  const { setPasscode, setAuthStep } = useAuth();
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    try { Vibration.vibrate(100); } catch {}
  };

  const handleDigit = (digit: string) => {
    if (step === 'create') {
      if (code.length < 6) {
        const newCode = code + digit;
        setCode(newCode);
        if (newCode.length === 6) {
          setTimeout(() => setStep('confirm'), 300);
        }
      }
    } else {
      if (confirmCode.length < 6) {
        const newCode = confirmCode + digit;
        setConfirmCode(newCode);
        if (newCode.length === 6) {
          if (newCode === code) {
            handleSave(newCode);
          } else {
            shake();
            setTimeout(() => {
              setConfirmCode('');
              Alert.alert('Mismatch', 'Passcodes do not match. Try again.');
            }, 300);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setCode(code.slice(0, -1));
    } else {
      setConfirmCode(confirmCode.slice(0, -1));
    }
  };

  const handleSave = async (finalCode: string) => {
    setLoading(true);
    const success = await setPasscode(finalCode);
    setLoading(false);
    if (success) {
      setAuthStep('done');
    } else {
      Alert.alert('Error', 'Failed to set passcode');
    }
  };

  const handleSkip = () => {
    setAuthStep('done');
  };

  const currentCode = step === 'create' ? code : confirmCode;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.authHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <View style={{ width: 40 }} />
        <Text style={[s.headerTitle, { color: colors.text }]}>
          {step === 'create' ? 'Create Passcode' : 'Confirm Passcode'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.passcodeContent}>
        <View style={[s.stepBadge, { backgroundColor: colors.primary + '15', alignSelf: 'center' }]}>
          <Text style={[s.stepText, { color: colors.primary }]}>Step 4 of 4</Text>
        </View>

        <View style={[s.lockIconCircle, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="lock-closed" size={40} color={colors.primary} />
        </View>

        <Text style={[s.passcodeTitle, { color: colors.text }]}>
          {step === 'create' ? 'Set a 6-digit passcode' : 'Re-enter your passcode'}
        </Text>
        <Text style={[s.passcodeSubtitle, { color: colors.textSecondary }]}>
          {step === 'create' ? 'This protects your wallet from unauthorized access' : 'Confirm your passcode to continue'}
        </Text>

        {/* Dots */}
        <Animated.View style={[s.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <View
              key={i}
              style={[
                s.dot,
                {
                  backgroundColor: i < currentCode.length ? colors.primary : 'transparent',
                  borderColor: colors.primary,
                },
              ]}
            />
          ))}
        </Animated.View>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}

        {/* Keypad */}
        <View style={s.keypad}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'del']].map((row, ri) => (
            <View key={ri} style={s.keypadRow}>
              {row.map((key, ki) => (
                <TouchableOpacity
                  key={ki}
                  style={[s.keypadKey, key === '' && { opacity: 0 }]}
                  onPress={() => {
                    if (key === 'del') handleDelete();
                    else if (key !== '') handleDigit(key);
                  }}
                  disabled={key === '' || loading}
                  activeOpacity={0.6}
                >
                  {key === 'del' ? (
                    <Ionicons name="backspace" size={24} color={colors.text} />
                  ) : (
                    <Text style={[s.keypadText, { color: colors.text }]}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={s.authBottom}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[s.skipText, { color: colors.textMuted }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PasscodeVerifyScreen() {
  const { colors } = useTheme();
  const { verifyPasscode, setAuthStep, logout, user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    try { Vibration.vibrate(100); } catch {}
  };

  const handleDigit = (digit: string) => {
    if (code.length < 6) {
      const newCode = code + digit;
      setCode(newCode);
      if (newCode.length === 6) {
        handleVerify(newCode);
      }
    }
  };

  const handleDelete = () => {
    setCode(code.slice(0, -1));
  };

  const handleVerify = async (finalCode: string) => {
    setLoading(true);
    const valid = await verifyPasscode(finalCode);
    setLoading(false);
    if (valid) {
      setAuthStep('done');
    } else {
      shake();
      setCode('');
      setAttempts(prev => prev + 1);
      if (attempts >= 4) {
        Alert.alert('Too Many Attempts', 'Please log in again.', [
          { text: 'OK', onPress: () => logout() },
        ]);
      }
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.authHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <View style={{ width: 40 }} />
        <Text style={[s.headerTitle, { color: colors.text }]}>Unlock Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.passcodeContent}>
        <View style={[s.lockIconCircle, { backgroundColor: colors.primary + '15' }]}>
          <Image
            source={{ uri: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978827102_89b5c4bc.png' }}
            style={{ width: 60, height: 60, borderRadius: 30 }}
          />
        </View>

        <Text style={[s.passcodeTitle, { color: colors.text }]}>
          Welcome back{user?.username ? `, @${user.username}` : ''}
        </Text>
        <Text style={[s.passcodeSubtitle, { color: colors.textSecondary }]}>
          Enter your 6-digit passcode
        </Text>

        <Animated.View style={[s.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <View
              key={i}
              style={[
                s.dot,
                {
                  backgroundColor: i < code.length ? colors.primary : 'transparent',
                  borderColor: colors.primary,
                },
              ]}
            />
          ))}
        </Animated.View>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}

        <View style={s.keypad}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'del']].map((row, ri) => (
            <View key={ri} style={s.keypadRow}>
              {row.map((key, ki) => (
                <TouchableOpacity
                  key={ki}
                  style={[s.keypadKey, key === '' && { opacity: 0 }]}
                  onPress={() => {
                    if (key === 'del') handleDelete();
                    else if (key !== '') handleDigit(key);
                  }}
                  disabled={key === '' || loading}
                  activeOpacity={0.6}
                >
                  {key === 'del' ? (
                    <Ionicons name="backspace" size={24} color={colors.text} />
                  ) : (
                    <Text style={[s.keypadText, { color: colors.text }]}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={s.authBottom}>
        <TouchableOpacity onPress={() => logout()}>
          <Text style={[s.skipText, { color: colors.danger || '#EF4444' }]}>Log out & use different account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AuthFlow() {
  const { authStep } = useAuth();
  switch (authStep) {
    case 'welcome': return <WelcomeScreen />;
    case 'phone': return <PhoneScreen />;
    case 'otp': return <OtpScreen />;
    case 'mnemonic': return <MnemonicScreen />;
    case 'profile': return <ProfileSetupScreen />;
    case 'passcode_setup': return <PasscodeSetupScreen />;
    case 'passcode_verify': return <PasscodeVerifyScreen />;
    default: return null;
  }
}

function InnerLayout() {
  const { colors, mode } = useTheme();
  const { isAuthenticated, isLoading, authStep } = useAuth();

  if (isLoading) {
    return (
      <View style={[s.loadingContainer, { backgroundColor: colors.background }]}>
        <Image
          source={{ uri: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978827102_89b5c4bc.png' }}
          style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 20 }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading Safe Wallet...</Text>
      </View>
    );
  }

  if (!isAuthenticated && authStep !== 'done') {
    return <AuthFlow />;
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="send" options={{ presentation: 'modal' }} />
        <Stack.Screen name="receive" options={{ presentation: 'modal' }} />
        <Stack.Screen name="swap" options={{ presentation: 'modal' }} />
        <Stack.Screen name="chat-window" options={{ presentation: 'card' }} />
        <Stack.Screen name="add-asset" options={{ presentation: 'modal' }} />
        <Stack.Screen name="user-details" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <InnerLayout />
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// ============ STYLES ============
const s = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  welcomeContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 24 },
  welcomeTitle: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 15, textAlign: 'center', marginBottom: 32 },
  featureList: { width: '100%', gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  featureText: { fontSize: 14, flex: 1 },
  welcomeBottom: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 8 },
  primaryBtnText: { color: '#000', fontSize: 17, fontWeight: '800' },
  termsText: { fontSize: 11, textAlign: 'center', marginTop: 14, lineHeight: 16 },
  authHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  authContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  stepBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  stepText: { fontSize: 12, fontWeight: '700' },
  authTitle: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
  authSubtitle: { fontSize: 14, marginBottom: 28, lineHeight: 20 },
  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  countryCode: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  countryFlagText: { fontSize: 20 },
  countryCodeText: { fontSize: 15, fontWeight: '700' },
  phoneInput: { flex: 1, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, fontWeight: '600' },
  countryList: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  countryItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, gap: 10 },
  countryName: { flex: 1, fontSize: 14, fontWeight: '600' },
  countryCodeSmall: { fontSize: 13 },
  orText: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  otpInput: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 20, fontSize: 32, fontWeight: '800', textAlign: 'center', letterSpacing: 16, marginBottom: 16 },
  debugBox: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 8, marginBottom: 16 },
  debugText: { fontSize: 14, fontWeight: '700' },
  resendRow: { flexDirection: 'row', justifyContent: 'center' },
  resendText: { fontSize: 13 },
  resendLink: { fontSize: 13, fontWeight: '700' },
  authBottom: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  warningCard: { flexDirection: 'row', padding: 16, borderRadius: 14, borderWidth: 1, gap: 12, marginBottom: 24 },
  warningText: { fontSize: 13, flex: 1, lineHeight: 20 },
  mnemonicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  mnemonicWord: { width: (width - 72) / 3, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  mnemonicNum: { fontSize: 11, fontWeight: '800', width: 20 },
  mnemonicText: { fontSize: 14, fontWeight: '600' },
  addressPreview: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  addressLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  addressValue: { fontSize: 13, fontWeight: '500' },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  confirmText: { fontSize: 13, flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 15 },
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  genderBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  genderText: { fontSize: 12, fontWeight: '700' },
  skipText: { fontSize: 13, textAlign: 'center' },
  // Passcode styles
  passcodeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  lockIconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  passcodeTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  passcodeSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32 },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  keypad: { width: '100%', maxWidth: 300 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  keypadKey: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  keypadText: { fontSize: 28, fontWeight: '600' },
  // Auth mode toggle
  authModeToggle: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 20 },
  authModeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  authModeBtnText: { fontSize: 14, fontWeight: '700' },
  // Delivery status
  deliveryStatus: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, gap: 8, marginBottom: 16 },
  deliveryStatusText: { fontSize: 13, fontWeight: '600', flex: 1 },
});

