import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, Modal, TextInput, Switch, Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const { walletAddress, walletName, username } = useWallet();
  const { user, logout, setPasscode, updateUser } = useAuth();
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [passcode, setPasscodeInput] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [mnemonicRevealed, setMnemonicRevealed] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.two_factor_enabled || false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [txNotifications, setTxNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editGender, setEditGender] = useState(user?.gender || 'Not specified');

  const mnemonicWords = ['shield', 'wallet', 'crypto', 'secure', 'chain', 'block', 'token', 'asset', 'trade', 'safe', 'guard', 'trust'];

  const copyAddress = () => {
    Alert.alert('Copied', 'Wallet address copied to clipboard');
  };

  const truncateAddress = (addr: string) => addr.slice(0, 8) + '...' + addr.slice(-6);

  const handlePasscodeChange = async () => {
    if (passcode.length !== 6) {
      Alert.alert('Error', 'Passcode must be 6 digits');
      return;
    }
    if (passcode !== confirmPasscode) {
      Alert.alert('Error', 'Passcodes do not match');
      return;
    }
    const success = await setPasscode(passcode);
    if (success) {
      Alert.alert('Success', 'Passcode updated successfully');
      setShowPasscode(false);
      setPasscodeInput('');
      setConfirmPasscode('');
    } else {
      Alert.alert('Error', 'Failed to update passcode');
    }
  };

  const handleProfileUpdate = async () => {
    const success = await updateUser({
      username: editUsername || undefined,
      email: editEmail || undefined,
      gender: editGender,
    } as any);
    if (success) {
      Alert.alert('Success', 'Profile updated');
      setShowEditProfile(false);
    } else {
      Alert.alert('Error', 'Failed to update profile. Username may be taken.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const settingsSections = [
    {
      title: 'WALLET',
      color: colors.primary,
      items: [
        { icon: 'wallet', label: 'Manage Wallets', subtitle: `Active: Main Wallet`, onPress: () => Alert.alert('Wallets', 'Multi-wallet support coming soon') },
        { icon: 'key', label: 'Recovery Phrase', subtitle: 'View your 12-word backup', onPress: () => setShowMnemonic(true) },
        { icon: 'person', label: 'Edit Profile', subtitle: `@${user?.username || 'not set'}`, onPress: () => setShowEditProfile(true) },
      ],
    },
    {
      title: 'SECURITY',
      color: '#EF4444',
      items: [
        { icon: 'lock-closed', label: 'Change Passcode', subtitle: user?.passcode_hash ? 'Active' : 'Not set', onPress: () => setShowPasscode(true) },
        { icon: 'shield-checkmark', label: 'Google Authenticator', subtitle: twoFAEnabled ? 'Enabled' : 'Not configured', onPress: () => setShow2FA(true) },
        { icon: 'finger-print', label: 'Biometric Unlock', subtitle: biometricEnabled ? 'Enabled' : 'Disabled', toggle: true, value: biometricEnabled, onToggle: setBiometricEnabled },
      ],
    },
    {
      title: 'NOTIFICATIONS',
      color: '#3B82F6',
      items: [
        { icon: 'notifications', label: 'Push Notifications', subtitle: 'Enable/disable all', toggle: true, value: notificationsEnabled, onToggle: setNotificationsEnabled },
        { icon: 'swap-horizontal', label: 'Transaction Alerts', subtitle: 'Send, receive, swap', toggle: true, value: txNotifications, onToggle: setTxNotifications },
        { icon: 'chatbubble', label: 'Chat Notifications', subtitle: 'Messages & reports', toggle: true, value: chatNotifications, onToggle: setChatNotifications },
      ],
    },
    {
      title: 'GENERAL',
      color: colors.textSecondary,
      items: [
        { icon: mode === 'dark' ? 'sunny' : 'moon', label: 'Theme', subtitle: mode === 'dark' ? 'Dark Mode' : 'Light Mode', onPress: toggleTheme },
        { icon: 'globe', label: 'Language', subtitle: 'English', onPress: () => {} },
        { icon: 'cash', label: 'Default Currency', subtitle: 'NGN', onPress: () => {} },
        { icon: 'document-text', label: 'Terms of Service', subtitle: '', onPress: () => {} },
        { icon: 'help-circle', label: 'Help & Support', subtitle: '', onPress: () => {} },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <TouchableOpacity onPress={toggleTheme} style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.profileAvatar, { backgroundColor: colors.primary + '20' }]}>
            <Image
              source={{ uri: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978827102_89b5c4bc.png' }}
              style={{ width: 56, height: 56, borderRadius: 28 }}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.username || 'Safe Wallet User'}</Text>
            <Text style={[styles.profileUsername, { color: colors.primary }]}>
              {user?.phone || ''}
            </Text>
            {user?.email ? <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user.email}</Text> : null}
            <View style={[styles.genderBadge, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name={user?.gender === 'Male' ? 'male' : user?.gender === 'Female' ? 'female' : 'person'} size={10} color={colors.primary} />
              <Text style={[styles.genderBadgeText, { color: colors.primary }]}>{user?.gender || 'Not specified'}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.editBtn, { borderColor: colors.primary }]} onPress={() => setShowEditProfile(true)}>
            <Feather name="edit-2" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Address Card */}
        <View style={[styles.addressCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="wallet" size={14} color={colors.primary} />
            <Text style={[styles.addressLabel, { color: colors.primary }]}>YOUR WALLET ADDRESS</Text>
          </View>
          <TouchableOpacity onPress={copyAddress} style={[styles.addressRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.addressText, { color: colors.text }]}>{truncateAddress(walletAddress)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="copy" size={14} color={colors.primary} />
              <Text style={[styles.copyText, { color: colors.primary }]}>Copy</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, si) => (
          <View key={si} style={{ marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {section.items.map((item: any, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[styles.settingItem, ii < section.items.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.divider }]}
                  onPress={item.onPress}
                  activeOpacity={item.toggle ? 1 : 0.7}
                >
                  <View style={[styles.settingIcon, { backgroundColor: section.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={18} color={section.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
                    {item.subtitle ? <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{item.subtitle}</Text> : null}
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: colors.divider, true: colors.primary + '60' }}
                      thumbColor={item.value ? colors.primary : colors.textMuted}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#EF4444' }]} onPress={handleLogout}>
          <Ionicons name="log-out" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textMuted }]}>Safe Wallet v1.0.0</Text>
      </ScrollView>

      {/* Mnemonic Modal */}
      <Modal visible={showMnemonic} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Recovery Phrase</Text>
              <TouchableOpacity onPress={() => { setShowMnemonic(false); setMnemonicRevealed(false); }}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={[styles.warningBox, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}>
              <Ionicons name="warning" size={16} color="#EF4444" />
              <Text style={[styles.warningText, { color: '#EF4444' }]}>
                Never share your recovery phrase. Anyone with it can access your wallet.
              </Text>
            </View>
            {mnemonicRevealed ? (
              <View style={styles.mnemonicGrid}>
                {mnemonicWords.map((word, i) => (
                  <View key={i} style={[styles.mnemonicWord, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                    <Text style={[styles.mnemonicNum, { color: colors.textMuted }]}>{i + 1}</Text>
                    <Text style={[styles.mnemonicText, { color: colors.text }]}>{word}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.revealBtn, { backgroundColor: colors.primary }]}
                onPress={() => setMnemonicRevealed(true)}
              >
                <Ionicons name="eye" size={18} color="#000" />
                <Text style={styles.revealText}>Reveal Phrase</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Passcode Modal */}
      <Modal visible={showPasscode} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change Passcode</Text>
              <TouchableOpacity onPress={() => { setShowPasscode(false); setPasscodeInput(''); setConfirmPasscode(''); }}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.inputLabelM, { color: colors.textSecondary }]}>New 6-digit Passcode</Text>
            <TextInput
              style={[styles.inputM, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, textAlign: 'center', fontSize: 24, letterSpacing: 12 }]}
              placeholder="------"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
              value={passcode}
              onChangeText={setPasscodeInput}
            />
            <Text style={[styles.inputLabelM, { color: colors.textSecondary, marginTop: 12 }]}>Confirm Passcode</Text>
            <TextInput
              style={[styles.inputM, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text, textAlign: 'center', fontSize: 24, letterSpacing: 12 }]}
              placeholder="------"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
              value={confirmPasscode}
              onChangeText={setConfirmPasscode}
            />
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: passcode.length === 6 && confirmPasscode.length === 6 ? 1 : 0.5 }]}
              onPress={handlePasscodeChange}
              disabled={passcode.length !== 6 || confirmPasscode.length !== 6}
            >
              <Text style={styles.submitText}>Update Passcode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2FA Modal */}
      <Modal visible={show2FA} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Google Authenticator</Text>
              <TouchableOpacity onPress={() => setShow2FA(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={[styles.qrPlaceholder, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <MaterialCommunityIcons name="qrcode" size={120} color={colors.text} />
              <Text style={[styles.qrLabel, { color: colors.textMuted }]}>Scan with Google Authenticator</Text>
            </View>
            <View style={[styles.secretBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Text style={[styles.secretLabel, { color: colors.textMuted }]}>Secret Key</Text>
              <Text style={[styles.secretText, { color: colors.text }]}>JBSWY3DPEHPK3PXP</Text>
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: twoFAEnabled ? '#EF4444' : colors.primary }]}
              onPress={() => { setTwoFAEnabled(!twoFAEnabled); setShow2FA(false); Alert.alert('2FA', twoFAEnabled ? 'Disabled' : 'Enabled'); }}
            >
              <Text style={[styles.submitText, { color: twoFAEnabled ? '#FFF' : '#000' }]}>
                {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.inputLabelM, { color: colors.textSecondary }]}>Username</Text>
            <TextInput
              style={[styles.inputM, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="@username"
              placeholderTextColor={colors.textMuted}
              value={editUsername}
              onChangeText={setEditUsername}
              autoCapitalize="none"
            />
            <Text style={[styles.inputLabelM, { color: colors.textSecondary, marginTop: 12 }]}>Email</Text>
            <TextInput
              style={[styles.inputM, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="email@example.com"
              placeholderTextColor={colors.textMuted}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={[styles.inputLabelM, { color: colors.textSecondary, marginTop: 12 }]}>Gender</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              {['Male', 'Female', 'Not specified'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtnM, {
                    backgroundColor: editGender === g ? colors.primary : colors.card,
                    borderColor: editGender === g ? colors.primary : colors.cardBorder,
                  }]}
                  onPress={() => setEditGender(g)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: editGender === g ? '#000' : colors.text }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleProfileUpdate}
            >
              <Text style={styles.submitText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  profileCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 18, fontWeight: '800' },
  profileUsername: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  profileEmail: { fontSize: 11, marginTop: 1 },
  genderBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4, gap: 4 },
  genderBadgeText: { fontSize: 10, fontWeight: '600' },
  editBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  addressCard: { marginHorizontal: 20, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  addressLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginLeft: 6 },
  addressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  addressText: { fontSize: 13, fontWeight: '600' },
  copyText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, paddingHorizontal: 20, marginBottom: 8 },
  sectionCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  settingSubtitle: { fontSize: 11, marginTop: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, marginTop: 8 },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700', marginLeft: 8 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  warningBox: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  warningText: { fontSize: 12, marginLeft: 10, flex: 1 },
  mnemonicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mnemonicWord: { width: '30%', flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1 },
  mnemonicNum: { fontSize: 10, fontWeight: '700', marginRight: 6, width: 16 },
  mnemonicText: { fontSize: 13, fontWeight: '600' },
  revealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 8 },
  revealText: { color: '#000', fontSize: 16, fontWeight: '700' },
  inputLabelM: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  inputM: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  genderBtnM: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  submitBtn: { marginTop: 20, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitText: { color: '#000', fontSize: 16, fontWeight: '700' },
  qrPlaceholder: { alignItems: 'center', padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  qrLabel: { fontSize: 12, marginTop: 12 },
  secretBox: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  secretLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  secretText: { fontSize: 16, fontWeight: '700', marginTop: 4, letterSpacing: 2 },
});
