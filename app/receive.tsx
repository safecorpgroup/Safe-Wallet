import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, Image, Modal, Share,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useWallet } from './context/WalletContext';
import { useRouter } from 'expo-router';
import QRCode from './components/QRCode';

export default function ReceiveScreen() {
  const { colors } = useTheme();
  const { assets, walletAddress, walletName } = useWallet();
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState(assets.find(a => a.symbol === 'SCAI') || assets[0]);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const copyAddress = () => {
    Alert.alert('Address Copied', walletAddress);
  };

  const shareAddress = async () => {
    try {
      await Share.share({
        message: `My ${selectedAsset.symbol} address on Safe Wallet:\n${walletAddress}`,
      });
    } catch {}
  };

  // Generate QR data string
  const qrData = `safewallet:${walletAddress}?token=${selectedAsset.symbol}&network=${selectedAsset.network}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.cardBorder }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Receive</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', padding: 20, paddingBottom: 40 }}>
        {/* Token Badge */}
        <TouchableOpacity
          style={[styles.tokenBadge, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => setShowAssetPicker(true)}
        >
          <Image source={{ uri: selectedAsset.icon }} style={styles.tokenBadgeIcon} />
          <Text style={[styles.tokenBadgeText, { color: colors.text }]}>{selectedAsset.symbol}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Scan or share your address to get paid
        </Text>

        {/* QR Code Area */}
        <View style={[styles.qrContainer, { borderColor: colors.primary }]}>
          <View style={[styles.qrCornerTL, { borderColor: colors.primary }]} />
          <View style={[styles.qrCornerTR, { borderColor: colors.primary }]} />
          <View style={[styles.qrCornerBL, { borderColor: colors.primary }]} />
          <View style={[styles.qrCornerBR, { borderColor: colors.primary }]} />
          
          <QRCode value={qrData} size={180} color="#000000" backgroundColor="#FFFFFF" />
          
          {/* Center Logo */}
          <View style={styles.qrCenterLogo}>
            <Image
              source={{ uri: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978827102_89b5c4bc.png' }}
              style={{ width: 32, height: 32, borderRadius: 8 }}
            />
          </View>
        </View>

        {/* Network Info */}
        <View style={[styles.networkBadge, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Image source={{ uri: selectedAsset.icon }} style={{ width: 18, height: 18, borderRadius: 9 }} />
          <Text style={[styles.networkText, { color: colors.text }]}>{selectedAsset.network}</Text>
          <View style={[styles.networkDot, { backgroundColor: colors.textMuted }]} />
          <Text style={[styles.networkText, { color: colors.primary }]}>{selectedAsset.symbol}</Text>
        </View>

        {/* Address Card */}
        <View style={[styles.addressCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.addressLabel, { color: colors.textMuted }]}>YOUR ADDRESS</Text>
          <View style={[styles.addressBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Text style={[styles.addressText, { color: colors.text }]} selectable>{walletAddress}</Text>
          </View>
          <View style={styles.addressActions}>
            <TouchableOpacity style={[styles.copyBtn, { backgroundColor: colors.primary }]} onPress={copyAddress}>
              <MaterialCommunityIcons name="content-copy" size={16} color="#000" />
              <Text style={styles.copyBtnText}>Copy Address</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, { borderColor: colors.cardBorder }]} onPress={shareAddress}>
              <Ionicons name="share-outline" size={16} color={colors.text} />
              <Text style={[styles.shareBtnText, { color: colors.text }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Cards */}
        <View style={[styles.infoRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>NETWORK</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{selectedAsset.network}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>TOKEN</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{selectedAsset.symbol}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>WALLET</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{walletName}</Text>
          </View>
        </View>

        {/* Warning */}
        <View style={[styles.warningCard, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B30' }]}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text style={[styles.warningText, { color: '#F59E0B' }]}>
            Only send {selectedAsset.symbol} on {selectedAsset.network} to this address. Sending other tokens may result in permanent loss.
          </Text>
        </View>
      </ScrollView>

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
                  <Image source={{ uri: asset.icon }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{asset.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{asset.network}</Text>
                  </View>
                  {selectedAsset.id === asset.id && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  tokenBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
  tokenBadgeIcon: { width: 20, height: 20, borderRadius: 10 },
  tokenBadgeText: { fontSize: 13, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 12, marginBottom: 20 },
  qrContainer: { width: 220, height: 220, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 20, backgroundColor: '#FFFFFF' },
  qrCornerTL: { position: 'absolute', top: -2, left: -2, width: 30, height: 30, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 20 },
  qrCornerTR: { position: 'absolute', top: -2, right: -2, width: 30, height: 30, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 20 },
  qrCornerBL: { position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 20 },
  qrCornerBR: { position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 20 },
  qrCenterLogo: { position: 'absolute', backgroundColor: '#FFF', padding: 4, borderRadius: 10 },
  networkBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6, marginBottom: 20 },
  networkText: { fontSize: 13, fontWeight: '600' },
  networkDot: { width: 4, height: 4, borderRadius: 2 },
  addressCard: { width: '100%', padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  addressLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  addressBox: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  addressText: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
  addressActions: { flexDirection: 'row', gap: 10 },
  copyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  copyBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 6 },
  shareBtnText: { fontSize: 14, fontWeight: '600' },
  infoRow: { flexDirection: 'row', width: '100%', padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  infoValue: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  infoDivider: { width: 1, marginVertical: 4 },
  warningCard: { flexDirection: 'row', width: '100%', padding: 14, borderRadius: 12, borderWidth: 1, gap: 10 },
  warningText: { fontSize: 12, flex: 1, lineHeight: 18 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  assetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5 },
});
