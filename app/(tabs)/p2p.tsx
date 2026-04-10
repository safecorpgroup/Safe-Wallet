import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Platform, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { useRouter } from 'expo-router';

interface P2PListing {
  id: string;
  userId: string;
  userName: string;
  type: 'buy' | 'sell';
  coin: string;
  coinIcon: string;
  amount: number;
  price: number;
  currency: string;
  minLimit: number;
  maxLimit: number;
  completedTrades: number;
  completionRate: number;
  online: boolean;
  paymentMethods: string[];
}

const listings: P2PListing[] = [
  { id: '1', userId: 'u1', userName: 'CryptoKing_NG', type: 'sell', coin: 'SDA', coinIcon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978813496_1dae82dc.jpeg', amount: 5000, price: 24.65, currency: 'NGN', minLimit: 500, maxLimit: 50000, completedTrades: 342, completionRate: 98.5, online: true, paymentMethods: ['Bank Transfer', 'Opay'] },
  { id: '2', userId: 'u2', userName: 'MinerPro', type: 'buy', coin: 'SDA', coinIcon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978813496_1dae82dc.jpeg', amount: 10000, price: 24.20, currency: 'NGN', minLimit: 1000, maxLimit: 100000, completedTrades: 156, completionRate: 97.2, online: true, paymentMethods: ['Bank Transfer'] },
  { id: '3', userId: 'u3', userName: 'VChatTrader', type: 'sell', coin: 'VCHAT', coinIcon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978818667_97affa6c.webp', amount: 20000, price: 5.37, currency: 'NGN', minLimit: 200, maxLimit: 30000, completedTrades: 89, completionRate: 99.1, online: false, paymentMethods: ['Bank Transfer', 'Kuda'] },
  { id: '4', userId: 'u4', userName: 'IntlWhale', type: 'sell', coin: 'INTL', coinIcon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978821082_1d429fa9.jpeg', amount: 15000, price: 10.59, currency: 'NGN', minLimit: 500, maxLimit: 80000, completedTrades: 234, completionRate: 96.8, online: true, paymentMethods: ['Bank Transfer', 'Palmpay'] },
  { id: '5', userId: 'u5', userName: 'HotDealer', type: 'buy', coin: 'HOT', coinIcon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978823803_69eb26c0.jpeg', amount: 50000, price: 3.32, currency: 'NGN', minLimit: 100, maxLimit: 20000, completedTrades: 67, completionRate: 95.5, online: true, paymentMethods: ['Bank Transfer'] },
  { id: '6', userId: 'u6', userName: 'NaijaCrypto', type: 'sell', coin: 'HOT', coinIcon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978823803_69eb26c0.jpeg', amount: 30000, price: 3.45, currency: 'NGN', minLimit: 200, maxLimit: 40000, completedTrades: 412, completionRate: 99.3, online: true, paymentMethods: ['Bank Transfer', 'Opay', 'Kuda'] },
];

const miningCoins = [
  { id: 'sda', symbol: 'SDA', name: 'Sidra', icon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978813496_1dae82dc.jpeg', color: '#D4A843' },
  { id: 'vchat', symbol: 'VCHAT', name: 'VeryChat', icon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978818667_97affa6c.webp', color: '#FF4081' },
  { id: 'intl', symbol: 'INTL', name: 'InterLink', icon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978821082_1d429fa9.jpeg', color: '#7C4DFF' },
  { id: 'hot', symbol: 'HOT', name: 'HOT Coin', icon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978823803_69eb26c0.jpeg', color: '#FF6D00' },
];

export default function P2PScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedCoin, setSelectedCoin] = useState('ALL');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'buy' | 'sell'>('sell');
  const [createCoin, setCreateCoin] = useState('SDA');
  const [createAmount, setCreateAmount] = useState('');
  const [createPrice, setCreatePrice] = useState('');

  const filtered = listings.filter(l => {
    if (selectedCoin !== 'ALL' && l.coin !== selectedCoin) return false;
    if (filterType !== 'all' && l.type !== filterType) return false;
    return true;
  });

  const handleCreate = () => {
    if (!createAmount || !createPrice) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    Alert.alert('Success', `Your ${createType} listing for ${createAmount} ${createCoin} has been created!`);
    setShowCreateModal(false);
    setCreateAmount('');
    setCreatePrice('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>P2P Trading</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={16} color="#000" />
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Coin Toggle */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinToggle} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          <TouchableOpacity
            style={[styles.coinChip, { backgroundColor: selectedCoin === 'ALL' ? colors.primary : colors.card, borderColor: selectedCoin === 'ALL' ? colors.primary : colors.cardBorder }]}
            onPress={() => setSelectedCoin('ALL')}
          >
            <Text style={[styles.coinChipText, { color: selectedCoin === 'ALL' ? '#000' : colors.text }]}>All</Text>
          </TouchableOpacity>
          {miningCoins.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.coinChip, { backgroundColor: selectedCoin === c.symbol ? colors.primary : colors.card, borderColor: selectedCoin === c.symbol ? colors.primary : colors.cardBorder }]}
              onPress={() => setSelectedCoin(c.symbol)}
            >
              <Image source={{ uri: c.icon }} style={styles.coinChipIcon} />
              <Text style={[styles.coinChipText, { color: selectedCoin === c.symbol ? '#000' : colors.text }]}>{c.symbol}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Buy/Sell Filter */}
        <View style={styles.filterRow}>
          {(['all', 'buy', 'sell'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, {
                backgroundColor: filterType === f ? (f === 'buy' ? '#22C55E' : f === 'sell' ? '#EF4444' : colors.primary) : colors.card,
                borderColor: filterType === f ? 'transparent' : colors.cardBorder,
              }]}
              onPress={() => setFilterType(f)}
            >
              <Text style={[styles.filterText, { color: filterType === f ? '#000' : colors.text }]}>
                {f === 'all' ? 'All' : f === 'buy' ? 'Buy' : 'Sell'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Listings */}
        {filtered.map(listing => (
          <TouchableOpacity
            key={listing.id}
            style={[styles.listingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push({ pathname: '/user-details', params: { userId: listing.userId, userName: listing.userName } })}
            activeOpacity={0.7}
          >
            <View style={styles.listingHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '30' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{listing.userName[0]}</Text>
                </View>
                <View style={{ marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.listingUser, { color: colors.text }]}>{listing.userName}</Text>
                    {listing.online && <View style={styles.onlineDot} />}
                  </View>
                  <Text style={[styles.listingStats, { color: colors.textMuted }]}>
                    {listing.completedTrades} trades | {listing.completionRate}%
                  </Text>
                </View>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: listing.type === 'buy' ? '#22C55E20' : '#EF444420' }]}>
                <Text style={{ color: listing.type === 'buy' ? '#22C55E' : '#EF4444', fontSize: 11, fontWeight: '700' }}>
                  {listing.type.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.listingBody}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={{ uri: listing.coinIcon }} style={styles.listingCoinIcon} />
                <Text style={[styles.listingCoin, { color: colors.text }]}>{listing.coin}</Text>
              </View>
              <Text style={[styles.listingPrice, { color: colors.primary }]}>
                {listing.currency} {listing.price.toFixed(2)}
              </Text>
            </View>

            <View style={styles.listingFooter}>
              <Text style={[styles.listingLimit, { color: colors.textMuted }]}>
                Limit: {listing.currency} {listing.minLimit.toLocaleString()} - {listing.maxLimit.toLocaleString()}
              </Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {listing.paymentMethods.map((pm, i) => (
                  <View key={i} style={[styles.paymentBadge, { backgroundColor: colors.primary + '10' }]}>
                    <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '600' }}>{pm}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.tradeBtn, { backgroundColor: listing.type === 'sell' ? '#22C55E' : '#EF4444' }]}
              onPress={() => Alert.alert('Trade', `${listing.type === 'sell' ? 'Buy' : 'Sell'} ${listing.coin} from ${listing.userName}?`)}
            >
              <Text style={styles.tradeBtnText}>
                {listing.type === 'sell' ? 'Buy' : 'Sell'} {listing.coin}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create Listing Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Listing</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TouchableOpacity
                style={[styles.typeToggle, { backgroundColor: createType === 'buy' ? '#22C55E' : colors.card, borderColor: colors.cardBorder }]}
                onPress={() => setCreateType('buy')}
              >
                <Text style={{ color: createType === 'buy' ? '#000' : colors.text, fontWeight: '700' }}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeToggle, { backgroundColor: createType === 'sell' ? '#EF4444' : colors.card, borderColor: colors.cardBorder }]}
                onPress={() => setCreateType('sell')}
              >
                <Text style={{ color: createType === 'sell' ? '#FFF' : colors.text, fontWeight: '700' }}>Sell</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Coin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {miningCoins.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.coinOption, { backgroundColor: createCoin === c.symbol ? colors.primary : colors.card, borderColor: colors.cardBorder }]}
                    onPress={() => setCreateCoin(c.symbol)}
                  >
                    <Image source={{ uri: c.icon }} style={{ width: 20, height: 20, borderRadius: 10 }} />
                    <Text style={{ color: createCoin === c.symbol ? '#000' : colors.text, fontSize: 12, fontWeight: '600', marginLeft: 6 }}>{c.symbol}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={createAmount}
              onChangeText={setCreateAmount}
            />
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Price per coin (NGN)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={createPrice}
              onChangeText={setCreatePrice}
            />
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleCreate}>
              <Text style={styles.submitText}>Create Listing</Text>
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
  createBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  createBtnText: { color: '#000', fontSize: 13, fontWeight: '700', marginLeft: 4 },
  coinToggle: { marginBottom: 12 },
  coinChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  coinChipIcon: { width: 18, height: 18, borderRadius: 9, marginRight: 6 },
  coinChipText: { fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '700' },
  listingCard: { marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  listingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  listingUser: { fontSize: 13, fontWeight: '700' },
  listingStats: { fontSize: 10, marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginLeft: 6 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  listingBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listingCoinIcon: { width: 24, height: 24, borderRadius: 12 },
  listingCoin: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  listingPrice: { fontSize: 16, fontWeight: '800' },
  listingFooter: { marginBottom: 12 },
  listingLimit: { fontSize: 11, marginBottom: 6 },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tradeBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  tradeBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  typeToggle: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  coinOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  submitBtn: { marginTop: 20, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
