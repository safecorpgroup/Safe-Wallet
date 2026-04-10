import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Platform, Alert, Image, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useWallet } from './context/WalletContext';
import { useRouter } from 'expo-router';

const availableTokens = [
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', color: '#627EEA', network: 'Ethereum', contractAddress: '0x0000000000000000000000000000000000000000' },
  { id: 'bnb', symbol: 'BNB', name: 'BNB', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png', color: '#F3BA2F', network: 'BNB Chain', contractAddress: '0x0000000000000000000000000000000000000000' },
  { id: 'sol', symbol: 'SOL', name: 'Solana', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png', color: '#9945FF', network: 'Solana', contractAddress: '' },
  { id: 'matic', symbol: 'MATIC', name: 'Polygon', icon: 'https://cryptologos.cc/logos/polygon-matic-logo.png', color: '#8247E5', network: 'Polygon', contractAddress: '' },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', icon: 'https://cryptologos.cc/logos/avalanche-avax-logo.png', color: '#E84142', network: 'Avalanche', contractAddress: '' },
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', icon: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png', color: '#E6007A', network: 'Polkadot', contractAddress: '' },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', icon: 'https://cryptologos.cc/logos/cardano-ada-logo.png', color: '#0033AD', network: 'Cardano', contractAddress: '' },
  { id: 'xrp', symbol: 'XRP', name: 'XRP', icon: 'https://cryptologos.cc/logos/xrp-xrp-logo.png', color: '#23292F', network: 'XRP Ledger', contractAddress: '' },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', icon: 'https://cryptologos.cc/logos/chainlink-link-logo.png', color: '#2A5ADA', network: 'Ethereum', contractAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA' },
  { id: 'uni', symbol: 'UNI', name: 'Uniswap', icon: 'https://cryptologos.cc/logos/uniswap-uni-logo.png', color: '#FF007A', network: 'Ethereum', contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
];

export default function AddAssetScreen() {
  const { colors } = useTheme();
  const { assets, addAsset, toggleAssetVisibility } = useWallet();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'blockchain' | 'contract'>('name');
  const [customContract, setCustomContract] = useState('');
  const [customName, setCustomName] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');

  const existingIds = assets.map(a => a.id);

  const filteredTokens = availableTokens.filter(t => {
    if (searchType === 'name') return t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    if (searchType === 'blockchain') return t.network.toLowerCase().includes(searchQuery.toLowerCase());
    if (searchType === 'contract') return t.contractAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  const handleAddToken = (token: typeof availableTokens[0]) => {
    if (existingIds.includes(token.id)) {
      Alert.alert('Already Added', `${token.name} is already in your wallet`);
      return;
    }
    addAsset({
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      icon: token.icon,
      color: token.color,
      price: 0,
      change24h: 0,
      balance: 0,
      value: 0,
      network: token.network,
      contractAddress: token.contractAddress,
      visible: true,
    });
    Alert.alert('Added', `${token.name} has been added to your wallet`);
  };

  const handleAddCustom = () => {
    if (!customName || !customSymbol || !customContract) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    addAsset({
      id: `custom_${Date.now()}`,
      symbol: customSymbol.toUpperCase(),
      name: customName,
      icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
      color: '#888888',
      price: 0,
      change24h: 0,
      balance: 0,
      value: 0,
      network: 'Custom',
      contractAddress: customContract,
      visible: true,
    });
    Alert.alert('Added', `${customName} has been added`);
    setCustomName('');
    setCustomSymbol('');
    setCustomContract('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.cardBorder }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Asset</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Search Type Tabs */}
        <View style={[styles.searchTabs, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {(['name', 'blockchain', 'contract'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.searchTab, searchType === type && { backgroundColor: colors.primary }]}
              onPress={() => setSearchType(type)}
            >
              <Text style={[styles.searchTabText, { color: searchType === type ? '#000' : colors.textSecondary }]}>
                {type === 'name' ? 'Name' : type === 'blockchain' ? 'Blockchain' : 'Contract'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Input */}
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            placeholder={searchType === 'contract' ? 'Paste contract address...' : `Search by ${searchType}...`}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
          />
        </View>

        {/* Current Assets - Toggle Visibility */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>YOUR ASSETS</Text>
        {assets.map(asset => (
          <View key={asset.id} style={[styles.assetRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Image source={{ uri: asset.icon }} style={styles.assetIcon} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.assetName, { color: colors.text }]}>{asset.name}</Text>
              <Text style={[styles.assetNetwork, { color: colors.textMuted }]}>{asset.network}</Text>
            </View>
            <Switch
              value={asset.visible}
              onValueChange={() => toggleAssetVisibility(asset.id)}
              trackColor={{ false: colors.divider, true: colors.primary + '60' }}
              thumbColor={asset.visible ? colors.primary : colors.textMuted}
            />
          </View>
        ))}

        {/* Available Tokens */}
        <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 20 }]}>AVAILABLE TOKENS</Text>
        {filteredTokens.map(token => (
          <TouchableOpacity
            key={token.id}
            style={[styles.assetRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => handleAddToken(token)}
          >
            <Image source={{ uri: token.icon }} style={styles.assetIcon} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.assetName, { color: colors.text }]}>{token.name}</Text>
              <Text style={[styles.assetNetwork, { color: colors.textMuted }]}>{token.network}</Text>
            </View>
            {existingIds.includes(token.id) ? (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            ) : (
              <View style={[styles.addBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <Ionicons name="add" size={16} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Custom Token */}
        <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 20 }]}>ADD CUSTOM TOKEN</Text>
        <View style={[styles.customCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Token Name"
            placeholderTextColor={colors.textMuted}
            value={customName}
            onChangeText={setCustomName}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Symbol (e.g. ETH)"
            placeholderTextColor={colors.textMuted}
            value={customSymbol}
            onChangeText={setCustomSymbol}
            autoCapitalize="characters"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Contract Address"
            placeholderTextColor={colors.textMuted}
            value={customContract}
            onChangeText={setCustomContract}
            autoCapitalize="none"
          />
          <TouchableOpacity style={[styles.addCustomBtn, { backgroundColor: colors.primary }]} onPress={handleAddCustom}>
            <Text style={styles.addCustomText}>Add Token</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  searchTabs: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 12 },
  searchTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  searchTabText: { fontSize: 12, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  assetRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  assetIcon: { width: 36, height: 36, borderRadius: 18 },
  assetName: { fontSize: 14, fontWeight: '700' },
  assetNetwork: { fontSize: 11, marginTop: 2 },
  addBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  customCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, marginBottom: 10 },
  addCustomBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  addCustomText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
