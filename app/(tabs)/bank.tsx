import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, TextInput, Alert, Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { useRouter } from 'expo-router';

export default function BankScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const { ngnBalance, setNgnBalance, ngnRate, transactions, addTransaction } = useWallet();
  const router = useRouter();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showUtilityModal, setShowUtilityModal] = useState(false);
  const [utilityType, setUtilityType] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [utilityAmount, setUtilityAmount] = useState('');
  const [utilityNumber, setUtilityNumber] = useState('');

  const handleTransfer = () => {
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0 || amt > ngnBalance) {
      Alert.alert('Error', 'Invalid amount or insufficient balance');
      return;
    }
    setNgnBalance(ngnBalance - amt);
    addTransaction({
      id: Date.now().toString(),
      type: 'transfer',
      amount: amt,
      currency: 'NGN',
      to: transferTo,
      status: 'completed',
      timestamp: Date.now(),
      description: `Transfer to ${transferTo}`,
    });
    setShowTransferModal(false);
    setTransferAmount('');
    setTransferTo('');
    Alert.alert('Success', `NGN ${amt.toLocaleString()} transferred successfully`);
  };

  const handleDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    setNgnBalance(ngnBalance + amt);
    addTransaction({
      id: Date.now().toString(),
      type: 'deposit',
      amount: amt,
      currency: 'NGN',
      status: 'completed',
      timestamp: Date.now(),
      description: 'Bank Deposit',
    });
    setShowDepositModal(false);
    setDepositAmount('');
    Alert.alert('Success', `NGN ${amt.toLocaleString()} deposited successfully`);
  };

  const handleUtility = () => {
    const amt = parseFloat(utilityAmount);
    if (!amt || amt <= 0 || amt > ngnBalance) {
      Alert.alert('Error', 'Invalid amount or insufficient balance');
      return;
    }
    setNgnBalance(ngnBalance - amt);
    addTransaction({
      id: Date.now().toString(),
      type: utilityType as any,
      amount: amt,
      currency: 'NGN',
      status: 'completed',
      timestamp: Date.now(),
      description: `${utilityType.charAt(0).toUpperCase() + utilityType.slice(1)} - ${utilityNumber}`,
    });
    setShowUtilityModal(false);
    setUtilityAmount('');
    setUtilityNumber('');
    Alert.alert('Success', `${utilityType} payment of NGN ${amt.toLocaleString()} successful`);
  };

  const utilities = [
    { id: 'airtime', icon: 'phone-portrait', label: 'Airtime', color: '#22C55E' },
    { id: 'data', icon: 'wifi', label: 'Data', color: '#3B82F6' },
    { id: 'electricity', icon: 'flash', label: 'Electricity', color: '#F59E0B' },
    { id: 'tv', icon: 'tv', label: 'TV', color: '#8B5CF6' },
  ];

  const recentTx = transactions.filter(t => ['transfer', 'deposit', 'airtime', 'data', 'electricity', 'tv'].includes(t.type)).slice(0, 6);

  const txIcon = (type: string) => {
    switch (type) {
      case 'transfer': return 'arrow-forward-circle';
      case 'deposit': return 'arrow-down-circle';
      case 'airtime': return 'phone-portrait';
      case 'data': return 'wifi';
      case 'electricity': return 'flash';
      case 'tv': return 'tv';
      default: return 'swap-horizontal';
    }
  };

  const renderModal = (visible: boolean, onClose: () => void, title: string, content: React.ReactNode) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {content}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Bank</Text>
          <TouchableOpacity onPress={toggleTheme} style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.balanceLabel, { color: colors.primary }]}>NGN BALANCE</Text>
          <Text style={[styles.balanceValue, { color: colors.text }]}>
            NGN {ngnBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.balanceUSD, { color: colors.textSecondary }]}>
            ~${(ngnBalance / ngnRate).toFixed(2)} USD
          </Text>
          <View style={[styles.sessionBadge, { backgroundColor: colors.primary + '15' }]}>
            <View style={[styles.sessionDot, { backgroundColor: '#22C55E' }]} />
            <Text style={[styles.sessionText, { color: colors.primary }]}>Session Active</Text>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.mainActions}>
          <TouchableOpacity
            style={[styles.mainActionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setShowTransferModal(true)}
          >
            <View style={[styles.mainActionIcon, { backgroundColor: '#3B82F620' }]}>
              <Feather name="send" size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.mainActionText, { color: colors.text }]}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainActionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setShowDepositModal(true)}
          >
            <View style={[styles.mainActionIcon, { backgroundColor: '#22C55E20' }]}>
              <Feather name="download" size={18} color="#22C55E" />
            </View>
            <Text style={[styles.mainActionText, { color: colors.text }]}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainActionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/swap')}
          >
            <View style={[styles.mainActionIcon, { backgroundColor: '#7C4DFF20' }]}>
              <MaterialCommunityIcons name="swap-horizontal" size={18} color="#7C4DFF" />
            </View>
            <Text style={[styles.mainActionText, { color: colors.text }]}>Swap</Text>
          </TouchableOpacity>
        </View>

        {/* Utilities */}
        <View style={styles.utilitiesRow}>
          {utilities.map(u => (
            <TouchableOpacity
              key={u.id}
              style={[styles.utilityBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => { setUtilityType(u.id); setShowUtilityModal(true); }}
            >
              <View style={[styles.utilityIcon, { backgroundColor: u.color + '20' }]}>
                <Ionicons name={u.icon as any} size={18} color={u.color} />
              </View>
              <Text style={[styles.utilityText, { color: colors.text }]}>{u.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTx.map(tx => (
          <View key={tx.id} style={[styles.txItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.txIcon, { backgroundColor: (tx.type === 'deposit' ? '#22C55E' : tx.type === 'transfer' ? '#3B82F6' : '#F59E0B') + '20' }]}>
              <Ionicons name={txIcon(tx.type) as any} size={18} color={tx.type === 'deposit' ? '#22C55E' : tx.type === 'transfer' ? '#3B82F6' : '#F59E0B'} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.txDesc, { color: colors.text }]}>{tx.description}</Text>
              <Text style={[styles.txTime, { color: colors.textMuted }]}>
                {new Date(tx.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.txAmount, { color: tx.type === 'deposit' ? '#22C55E' : colors.text }]}>
                {tx.type === 'deposit' ? '+' : '-'}{tx.currency} {tx.amount.toLocaleString()}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: tx.status === 'completed' ? '#22C55E20' : '#F59E0B20' }]}>
                <Text style={{ fontSize: 9, color: tx.status === 'completed' ? '#22C55E' : '#F59E0B', fontWeight: '600' }}>
                  {tx.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {recentTx.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bank-off" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Transfer Modal */}
      {renderModal(showTransferModal, () => setShowTransferModal(false), 'Transfer', (
        <View>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Recipient Account</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Account number or username"
            placeholderTextColor={colors.textMuted}
            value={transferTo}
            onChangeText={setTransferTo}
          />
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount (NGN)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={transferAmount}
            onChangeText={setTransferAmount}
          />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleTransfer}>
            <Text style={styles.submitText}>Transfer</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Deposit Modal */}
      {renderModal(showDepositModal, () => setShowDepositModal(false), 'Deposit', (
        <View>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount (NGN)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={depositAmount}
            onChangeText={setDepositAmount}
          />
          <View style={[styles.bankInfo, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Text style={[styles.bankInfoLabel, { color: colors.textMuted }]}>Bank: Safe Wallet Bank</Text>
            <Text style={[styles.bankInfoLabel, { color: colors.textMuted }]}>Account: 0123456789</Text>
            <Text style={[styles.bankInfoLabel, { color: colors.textMuted }]}>Name: Safe Wallet User</Text>
          </View>
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleDeposit}>
            <Text style={styles.submitText}>Confirm Deposit</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Utility Modal */}
      {renderModal(showUtilityModal, () => setShowUtilityModal(false), utilityType.charAt(0).toUpperCase() + utilityType.slice(1), (
        <View>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            {utilityType === 'airtime' || utilityType === 'data' ? 'Phone Number' : utilityType === 'electricity' ? 'Meter Number' : 'Smart Card Number'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Enter number"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={utilityNumber}
            onChangeText={setUtilityNumber}
          />
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount (NGN)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={utilityAmount}
            onChangeText={setUtilityAmount}
          />
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleUtility}>
            <Text style={styles.submitText}>Pay</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  balanceCard: { marginHorizontal: 20, padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  balanceLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  balanceValue: { fontSize: 28, fontWeight: '800' },
  balanceUSD: { fontSize: 13, marginTop: 2 },
  sessionBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 10 },
  sessionDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  sessionText: { fontSize: 11, fontWeight: '600' },
  mainActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  mainActionBtn: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14, borderWidth: 1 },
  mainActionIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  mainActionText: { fontSize: 12, fontWeight: '700' },
  utilitiesRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  utilityBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  utilityIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  utilityText: { fontSize: 10, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { fontSize: 12, fontWeight: '600' },
  txItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  txIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  txDesc: { fontSize: 13, fontWeight: '600' },
  txTime: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 13, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, marginTop: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  submitBtn: { marginTop: 20, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitText: { color: '#000', fontSize: 16, fontWeight: '700' },
  bankInfo: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 12 },
  bankInfoLabel: { fontSize: 13, marginBottom: 4 },
});
