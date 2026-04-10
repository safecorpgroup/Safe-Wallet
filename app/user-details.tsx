import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, Modal, TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from './context/ThemeContext';
import { useWallet } from './context/WalletContext';
import { useRouter, useLocalSearchParams } from 'expo-router';


export default function UserDetailsScreen() {
  const { colors } = useTheme();
  const { transactions } = useWallet();
  const router = useRouter();
  const params = useLocalSearchParams<{ userId: string; userName: string }>();
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const userName = params.userName || 'Unknown User';
  const userId = params.userId || 'unknown';

  const userAddress = '0x' + userId.padEnd(40, '0').slice(0, 40);
  const userPhone = '+234 801 234 5678';
  const userGender = userId === 'support' ? 'N/A' : 'Male';

  const userTx = transactions.filter(t => t.to === userName || t.from === userName).slice(0, 5);

  const copyAddress = () => {
    Alert.alert('Wallet Address', userAddress);
  };


  const handleReport = () => {
    if (!reportReason.trim()) {
      Alert.alert('Error', 'Please describe the issue');
      return;
    }
    Alert.alert('Reported', 'Your report has been submitted. We will review it shortly.');
    setShowReport(false);
    setReportReason('');
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.cardBorder }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>User Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* User Profile */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{getInitials(userName)}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
          <Text style={[styles.userId, { color: colors.textMuted }]}>ID: {userId}</Text>

          {/* User Info */}
          <View style={styles.infoGrid}>
            <View style={[styles.infoItem, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Ionicons name="call" size={16} color={colors.primary} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{userPhone}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.infoItem, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
              onPress={copyAddress}
            >
              <Ionicons name="wallet" size={16} color={colors.primary} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Wallet</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                  {userAddress.slice(0, 10)}...{userAddress.slice(-6)}
                </Text>
              </View>
              <Ionicons name="copy" size={14} color={colors.primary} />
            </TouchableOpacity>
            <View style={[styles.infoItem, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Ionicons name="person" size={16} color={colors.primary} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Gender</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{userGender}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/send')}
          >
            <Ionicons name="send" size={20} color="#000" />
            <Text style={styles.actionBtnText}>Pay Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
            onPress={() => router.push({ pathname: '/chat-window', params: { contactId: userId, contactName: userName } })}
          >
            <Ionicons name="chatbubble" size={20} color="#FFF" />
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
            onPress={() => setShowReport(true)}
          >
            <Ionicons name="flag" size={20} color="#FFF" />
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaction History</Text>
        {userTx.length > 0 ? userTx.map(tx => (
          <View key={tx.id} style={[styles.txItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.txIcon, { backgroundColor: (tx.type === 'receive' ? '#22C55E' : '#3B82F6') + '20' }]}>
              <Ionicons name={tx.type === 'receive' ? 'arrow-down' : 'arrow-up'} size={16} color={tx.type === 'receive' ? '#22C55E' : '#3B82F6'} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.txDesc, { color: colors.text }]}>{tx.description}</Text>
              <Text style={[styles.txTime, { color: colors.textMuted }]}>{new Date(tx.timestamp).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.type === 'receive' ? '#22C55E' : colors.text }]}>
              {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.currency}
            </Text>
          </View>
        )) : (
          <View style={[styles.emptyTx, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons name="history" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions with this user</Text>
          </View>
        )}
      </ScrollView>

      {/* Report Modal */}
      <Modal visible={showReport} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Report User</Text>
              <TouchableOpacity onPress={() => setShowReport(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.reportLabel, { color: colors.textSecondary }]}>Describe the issue</Text>
            <TextInput
              style={[styles.reportInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="What happened?"
              placeholderTextColor={colors.textMuted}
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#EF4444' }]} onPress={handleReport}>
              <Text style={[styles.submitText, { color: '#FFF' }]}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  profileCard: { alignItems: 'center', padding: 24, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800' },
  userName: { fontSize: 20, fontWeight: '800' },
  userId: { fontSize: 12, marginTop: 4, marginBottom: 16 },
  infoGrid: { width: '100%', gap: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  infoLabel: { fontSize: 10, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  actionGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#000' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  txIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  txDesc: { fontSize: 13, fontWeight: '600' },
  txTime: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 13, fontWeight: '700' },
  emptyTx: { alignItems: 'center', padding: 32, borderRadius: 16, borderWidth: 1 },
  emptyText: { fontSize: 13, marginTop: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  reportLabel: { fontSize: 13, marginBottom: 8 },
  reportInput: { borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 14, minHeight: 100 },
  submitBtn: { marginTop: 16, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700' },
});
