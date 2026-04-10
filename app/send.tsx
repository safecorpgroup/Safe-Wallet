import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Platform, Alert, Image, Modal,
  Animated, Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useWallet } from './context/WalletContext';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SendScreen() {
  const { colors } = useTheme();
  const { assets, addTransaction, ngnRate } = useWallet();
  const router = useRouter();

  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [recipientType, setRecipientType] = useState<'address' | 'username' | 'email'>('address');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Animate scan line
  useEffect(() => {
    if (showScanner) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [showScanner]);

  const handleContinue = () => {
    if (!recipient) { Alert.alert('Error', 'Enter a recipient'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    if (amt > selectedAsset.balance) { Alert.alert('Error', 'Insufficient balance'); return; }
    setShowConfirm(true);
  };

  const handleSend = () => {
    const amt = parseFloat(amount);
    addTransaction({
      id: Date.now().toString(),
      type: 'send',
      amount: amt,
      currency: selectedAsset.symbol,
      to: recipient,
      status: 'completed',
      timestamp: Date.now(),
      description: `Sent ${amt} ${selectedAsset.symbol}`,
    });
    setShowConfirm(false);
    Alert.alert('Success', `${amt} ${selectedAsset.symbol} sent successfully!`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleScanResult = (address: string) => {
    setRecipient(address);
    setShowScanner(false);
    setRecipientType('address');
    try {
      const Haptics = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  // Simulate scan with demo addresses
  const simulateScan = () => {
    const demoAddresses = [
      '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38',
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
    ];
    const randomAddr = demoAddresses[Math.floor(Math.random() * demoAddresses.length)];
    handleScanResult(randomAddr);
  };

  const recipientTabs = [
    { key: 'address', label: 'Address', icon: 'hash' },
    { key: 'username', label: 'Username', icon: 'at-sign' },
    { key: 'email', label: 'Email', icon: 'mail' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.cardBorder }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Send</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Network Badge */}
        <View style={styles.networkRow}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Send</Text>
          <View style={[styles.networkBadge, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.networkDot, { backgroundColor: selectedAsset.color }]} />
            <Text style={[styles.networkText, { color: colors.text }]}>{selectedAsset.network}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </View>
        </View>

        {/* Token Selector */}
        <Text style={[styles.label, { color: colors.textMuted }]}>TOKEN</Text>
        <TouchableOpacity
          style={[styles.tokenSelector, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => setShowAssetPicker(true)}
        >
          <Image source={{ uri: selectedAsset.icon }} style={styles.tokenIcon} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.tokenName, { color: colors.text }]}>{selectedAsset.symbol}</Text>
            <Text style={[styles.tokenBalance, { color: colors.textMuted }]}>
              {selectedAsset.balance.toFixed(4)} available
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Recipient */}
        <View style={styles.recipientHeader}>
          <Text style={[styles.label, { color: colors.textMuted }]}>RECIPIENT</Text>
          <TouchableOpacity
            style={[styles.scanBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}
            onPress={() => setShowScanner(true)}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.recipientTabs, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {recipientTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.recipientTab, recipientType === tab.key && { backgroundColor: colors.primary }]}
              onPress={() => setRecipientType(tab.key as any)}
            >
              <Feather name={tab.icon as any} size={14} color={recipientType === tab.key ? '#000' : colors.textSecondary} />
              <Text style={[styles.recipientTabText, { color: recipientType === tab.key ? '#000' : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder={recipientType === 'address' ? '0x... or wallet address' : recipientType === 'username' ? '@username' : 'email@example.com'}
          placeholderTextColor={colors.textMuted}
          value={recipient}
          onChangeText={setRecipient}
          autoCapitalize="none"
        />

        {/* Amount */}
        <View style={styles.amountHeader}>
          <Text style={[styles.label, { color: colors.textMuted }]}>AMOUNT</Text>
          <TouchableOpacity onPress={() => setAmount(selectedAsset.balance.toString())}>
            <Text style={[styles.maxBtn, { color: colors.primary }]}>MAX</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.amountInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <TextInput
            style={[styles.amountField, { color: colors.text }]}
            placeholder="0.0"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <Text style={[styles.amountCurrency, { color: colors.primary }]}>{selectedAsset.symbol}</Text>
        </View>

        {amount ? (
          <Text style={[styles.amountUSD, { color: colors.textSecondary }]}>
            ~${(parseFloat(amount || '0') * selectedAsset.price).toFixed(2)} USD | ~NGN {(parseFloat(amount || '0') * selectedAsset.price * ngnRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
        ) : null}

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: colors.primary, opacity: recipient && amount ? 1 : 0.5 }]}
          onPress={handleContinue}
          disabled={!recipient || !amount}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal visible={showScanner} transparent animationType="slide">
        <View style={[styles.scannerOverlay, { backgroundColor: '#000' }]}>
          <View style={[styles.scannerHeader, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
            <TouchableOpacity onPress={() => setShowScanner(false)} style={styles.scannerClose}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan QR Code</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.scannerBody}>
            <Text style={styles.scannerSubtitle}>
              Point your camera at a wallet QR code
            </Text>
            
            {/* Scanner Frame */}
            <View style={styles.scannerFrame}>
              <View style={[styles.scanCornerTL, { borderColor: colors.primary }]} />
              <View style={[styles.scanCornerTR, { borderColor: colors.primary }]} />
              <View style={[styles.scanCornerBL, { borderColor: colors.primary }]} />
              <View style={[styles.scanCornerBR, { borderColor: colors.primary }]} />
              
              {/* Animated scan line */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    backgroundColor: colors.primary,
                    transform: [{
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 220],
                      }),
                    }],
                  },
                ]}
              />

              {/* Camera placeholder */}
              <View style={styles.cameraPlaceholder}>
                <Ionicons name="camera" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.cameraText}>Camera access required</Text>
              </View>
            </View>

            {/* Manual entry option */}
            <View style={styles.scannerActions}>
              <TouchableOpacity
                style={[styles.scanDemoBtn, { backgroundColor: colors.primary }]}
                onPress={simulateScan}
              >
                <MaterialCommunityIcons name="qrcode" size={20} color="#000" />
                <Text style={styles.scanDemoBtnText}>Simulate Scan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.manualBtn, { borderColor: 'rgba(255,255,255,0.3)' }]}
                onPress={() => setShowScanner(false)}
              >
                <Feather name="edit-3" size={16} color="#FFF" />
                <Text style={styles.manualBtnText}>Enter Manually</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.scannerHint}>
              Supported: Safe Wallet, Ethereum, Bitcoin, Secure Chain addresses
            </Text>
          </View>
        </View>
      </Modal>

      {/* Asset Picker Modal */}
      <Modal visible={showAssetPicker} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Token</Text>
              <TouchableOpacity onPress={() => setShowAssetPicker(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {assets.filter(a => a.visible).map(asset => (
                <TouchableOpacity
                  key={asset.id}
                  style={[styles.assetOption, { borderBottomColor: colors.divider }]}
                  onPress={() => { setSelectedAsset(asset); setShowAssetPicker(false); }}
                >
                  <Image source={{ uri: asset.icon }} style={styles.assetOptionIcon} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.assetOptionName, { color: colors.text }]}>{asset.name}</Text>
                    <Text style={[styles.assetOptionBalance, { color: colors.textMuted }]}>{asset.balance.toFixed(4)} {asset.symbol}</Text>
                  </View>
                  {selectedAsset.id === asset.id && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirm Modal */}
      <Modal visible={showConfirm} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Send</Text>
              <TouchableOpacity onPress={() => setShowConfirm(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={[styles.confirmCard, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>To</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]} numberOfLines={1}>{recipient}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>Amount</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>{amount} {selectedAsset.symbol}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>Network</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>{selectedAsset.network}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmLabel, { color: colors.textMuted }]}>Network Fee</Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>~$0.50</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.continueBtn, { backgroundColor: colors.primary }]} onPress={handleSend}>
              <Text style={styles.continueBtnText}>Confirm & Send</Text>
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
  networkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 22, fontWeight: '800' },
  networkBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
  networkDot: { width: 8, height: 8, borderRadius: 4 },
  networkText: { fontSize: 12, fontWeight: '600' },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  tokenSelector: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  tokenIcon: { width: 36, height: 36, borderRadius: 18 },
  tokenName: { fontSize: 16, fontWeight: '700' },
  tokenBalance: { fontSize: 12, marginTop: 2 },
  recipientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scanBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  recipientTabs: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 12 },
  recipientTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 4 },
  recipientTabText: { fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 15, marginBottom: 20 },
  amountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  maxBtn: { fontSize: 13, fontWeight: '800' },
  amountInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16 },
  amountField: { flex: 1, fontSize: 20, fontWeight: '700' },
  amountCurrency: { fontSize: 16, fontWeight: '700' },
  amountUSD: { fontSize: 12, marginTop: 8, marginBottom: 20 },
  continueBtn: { paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  continueBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
  // Scanner styles
  scannerOverlay: { flex: 1 },
  scannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  scannerClose: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scannerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  scannerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  scannerSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginBottom: 30 },
  scannerFrame: { width: 250, height: 250, position: 'relative', marginBottom: 30 },
  scanCornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  scanCornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  scanCornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  scanCornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  scanLine: { position: 'absolute', left: 10, right: 10, height: 2, borderRadius: 1 },
  cameraPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8 },
  scannerActions: { gap: 12, width: '100%' },
  scanDemoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, gap: 8 },
  scanDemoBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  manualBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, gap: 8 },
  manualBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  scannerHint: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 20 },
  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  assetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5 },
  assetOptionIcon: { width: 36, height: 36, borderRadius: 18 },
  assetOptionName: { fontSize: 14, fontWeight: '700' },
  assetOptionBalance: { fontSize: 12, marginTop: 2 },
  confirmCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 8 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  confirmLabel: { fontSize: 13 },
  confirmValue: { fontSize: 13, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
});
