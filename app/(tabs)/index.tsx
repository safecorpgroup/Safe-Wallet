import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, RefreshControl,
  StyleSheet, Dimensions, TextInput, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWallet, Asset } from '../context/WalletContext';

const { width } = Dimensions.get('window');

function MiniChart({ positive, color }: { positive: boolean; color: string }) {
  const bars = [3, 5, 4, 7, 6, 8, positive ? 9 : 3, positive ? 7 : 2];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 20, gap: 1.5 }}>
      {bars.map((h, i) => (
        <View
          key={i}
          style={{
            width: 3,
            height: h * 2,
            borderRadius: 1,
            backgroundColor: positive ? '#22C55E' : '#EF4444',
            opacity: 0.4 + (i / bars.length) * 0.6,
          }}
        />
      ))}
    </View>
  );
}

function AssetItem({ asset, onPress }: { asset: Asset; onPress: () => void }) {
  const { colors } = useTheme();
  const positive = asset.change24h >= 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.assetItem, {
        backgroundColor: colors.card,
        borderColor: colors.cardBorder,
        borderLeftColor: positive ? '#22C55E' : '#EF4444',
        borderLeftWidth: 3,
      }]}
      activeOpacity={0.7}
    >
      <Image source={{ uri: asset.icon }} style={styles.assetIcon} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.assetName, { color: colors.text }]}>{asset.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <Text style={[styles.assetPrice, { color: colors.textSecondary }]}>
            ${asset.price < 1 ? asset.price.toFixed(4) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={[styles.changeBadge, { backgroundColor: positive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }]}>
            <Ionicons name={positive ? 'caret-up' : 'caret-down'} size={8} color={positive ? '#22C55E' : '#EF4444'} />
            <Text style={{ color: positive ? '#22C55E' : '#EF4444', fontSize: 10, fontWeight: '600', marginLeft: 2 }}>
              {Math.abs(asset.change24h).toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.assetValue, { color: colors.text }]}>
          ${asset.value.toFixed(2)}
        </Text>
        <Text style={[styles.assetBalance, { color: colors.textSecondary }]}>
          {asset.balance.toFixed(4)} {asset.symbol}
        </Text>
        <MiniChart positive={positive} color={asset.color} />
      </View>
    </TouchableOpacity>
  );
}

export default function AssetsScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const { assets, totalBalance, ngnRate, refreshPrices, loading, walletName, ngnBalance } = useWallet();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const visibleAssets = assets.filter(a => a.visible);
  const filteredAssets = searchQuery
    ? visibleAssets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
    : visibleAssets;

  const totalNGN = totalBalance * ngnRate + ngnBalance;
  const change24h = visibleAssets.length > 0
    ? visibleAssets.reduce((sum, a) => sum + a.change24h, 0) / visibleAssets.length
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshPrices} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{ uri: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978827102_89b5c4bc.png' }}
              style={styles.logoIcon}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.walletLabel, { color: colors.textMuted }]}>WALLET</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.walletName, { color: colors.text }]}>{walletName}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} style={{ marginLeft: 4 }} />
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme} style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile')} style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name="settings-sharp" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Search assets..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Portfolio Card */}
        <View style={[styles.portfolioCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.portfolioLabel, { color: colors.primary }]}>TOTAL PORTFOLIO</Text>
          <View style={styles.portfolioRow}>
            <View>
              <Text style={[styles.portfolioValue, { color: colors.text }]}>
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.portfolioNGN, { color: colors.textSecondary }]}>
                ~NGN {totalNGN.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.changePercent, { color: change24h >= 0 ? '#22C55E' : '#EF4444' }]}>
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
              </Text>
              <Text style={[styles.changeLabel, { color: colors.textMuted }]}>24h</Text>
            </View>
          </View>
          <View style={styles.portfolioMeta}>
            <View style={[styles.metaBadge, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="chart-line-variant" size={12} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.primary }]}>24h change</Text>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="circle-multiple" size={12} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.primary }]}>{visibleAssets.length} assets</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/send')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="arrow-up-right" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/receive')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#22C55E20' }]}>
              <Feather name="arrow-down-left" size={18} color="#22C55E" />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/swap')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#7C4DFF20' }]}>
              <MaterialCommunityIcons name="swap-horizontal" size={18} color="#7C4DFF" />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>Swap</Text>
          </TouchableOpacity>
        </View>

        {/* Assets Header */}
        <View style={styles.assetsHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="wallet" size={16} color={colors.primary} />
            <Text style={[styles.assetsTitle, { color: colors.text }]}>Assets</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/add-asset')}
            style={[styles.addAssetBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
          >
            <Ionicons name="add" size={14} color={colors.primary} />
            <Text style={[styles.addAssetText, { color: colors.primary }]}>New Asset</Text>
          </TouchableOpacity>
        </View>

        {/* Asset List */}
        {filteredAssets.map(asset => (
          <AssetItem
            key={asset.id}
            asset={asset}
            onPress={() => {}}
          />
        ))}

        {filteredAssets.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No assets found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  logoIcon: { width: 36, height: 36, borderRadius: 18 },
  walletLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  walletName: { fontSize: 16, fontWeight: '700' },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  portfolioCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  portfolioLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  portfolioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  portfolioValue: { fontSize: 28, fontWeight: '800' },
  portfolioNGN: { fontSize: 13, marginTop: 2 },
  changePercent: { fontSize: 22, fontWeight: '700' },
  changeLabel: { fontSize: 11, marginTop: 2 },
  portfolioMeta: { flexDirection: 'row', marginTop: 12, gap: 8 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  metaText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  actionIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '700' },
  assetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  assetsTitle: { fontSize: 16, fontWeight: '700', marginLeft: 6 },
  addAssetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  addAssetText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  assetIcon: { width: 36, height: 36, borderRadius: 18 },
  assetName: { fontSize: 14, fontWeight: '700' },
  assetPrice: { fontSize: 12 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 6 },
  assetValue: { fontSize: 14, fontWeight: '700' },
  assetBalance: { fontSize: 11, marginTop: 2, marginBottom: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, marginTop: 8 },
});
