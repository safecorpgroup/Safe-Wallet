import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Platform, Alert, Image, Modal, ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useWallet } from './context/WalletContext';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/app/lib/supabase';

interface SwapToken {
  symbol: string;
  name: string;
  icon: string;
  price: number;
  balance: number;
  isFiat?: boolean;
}

interface SwapQuote {
  id: string | null;
  from_token: string;
  to_token: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  price_impact: number;
  gas_fee_usd: number;
  gas_fee_native: number;
  minimum_received: number;
  slippage: number;
  route: string[];
  from_price_usd: number;
  to_price_usd: number;
  ngn_rate: number;
  expires_at: string;
  timestamp: string;
}

export default function SwapScreen() {
  const { colors } = useTheme();
  const { assets, ngnRate, ngnBalance, setNgnBalance, addTransaction, loadUserAssets } = useWallet();
  const { user } = useAuth();
  const router = useRouter();

  const tokens: SwapToken[] = [
    { symbol: 'NGN', name: 'Nigerian Naira', icon: 'https://flagcdn.com/w80/ng.png', price: 1 / ngnRate, balance: ngnBalance, isFiat: true },
    ...assets.filter(a => a.visible).map(a => ({ symbol: a.symbol, name: a.name, icon: a.icon, price: a.price, balance: a.balance })),
  ];

  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens.find(t => t.symbol === 'USDT') || tokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [slippage, setSlippage] = useState('1.0');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [showTxResult, setShowTxResult] = useState(false);
  const [quoteRefreshTimer, setQuoteRefreshTimer] = useState(10);
  const [livePrices, setLivePrices] = useState<Record<string, { usd: number; usd_24h_change: number }>>({});
  const quoteIntervalRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fetch live prices on mount
  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh quote every 10 seconds
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      fetchQuote();
      
      quoteIntervalRef.current = setInterval(() => {
        fetchQuote();
        setQuoteRefreshTimer(10);
      }, 10000);

      // Countdown timer
      const timerInterval = setInterval(() => {
        setQuoteRefreshTimer(prev => prev > 0 ? prev - 1 : 10);
      }, 1000);

      return () => {
        if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
        clearInterval(timerInterval);
      };
    } else {
      setQuote(null);
      if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
    }
  }, [fromAmount, fromToken.symbol, toToken.symbol, slippage]);

  const fetchLivePrices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('swap-engine', {
        body: { action: 'get_prices', symbols: tokens.map(t => t.symbol) },
      });
      if (data?.success && data?.prices) {
        setLivePrices(data.prices);
      }
    } catch (e) {
      console.error('Fetch prices error:', e);
    }
  };

  const fetchQuote = useCallback(async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    setQuoteLoading(true);
    
    // Pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      const { data, error } = await supabase.functions.invoke('swap-engine', {
        body: {
          action: 'get_quote',
          from_token: fromToken.symbol,
          to_token: toToken.symbol,
          from_amount: fromAmount,
          slippage,
          user_id: user?.id,
        },
      });
      if (data?.success && data?.quote) {
        setQuote(data.quote);
      } else if (data?.error) {
        console.error('Quote error:', data.error);
      }
    } catch (e) {
      console.error('Fetch quote error:', e);
    }
    setQuoteLoading(false);
  }, [fromAmount, fromToken.symbol, toToken.symbol, slippage, user?.id]);

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
    setQuote(null);
  };

  const handleSwap = async () => {
    const amt = parseFloat(fromAmount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    if (amt > fromToken.balance) { Alert.alert('Error', 'Insufficient balance'); return; }
    if (!quote) { Alert.alert('Error', 'Please wait for quote'); return; }

    // Check if quote expired
    if (new Date(quote.expires_at) < new Date()) {
      Alert.alert('Quote Expired', 'The quote has expired. Getting a fresh quote...');
      fetchQuote();
      return;
    }

    setSwapLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('swap-engine', {
        body: {
          action: 'execute_swap',
          from_token: fromToken.symbol,
          to_token: toToken.symbol,
          from_amount: fromAmount,
          slippage,
          user_id: user?.id,
          quote_id: quote.id,
        },
      });

      if (data?.success && data?.swap) {
        setLastTxHash(data.swap.tx_hash);
        setShowTxResult(true);

        // Add to local transactions
        addTransaction({
          id: Date.now().toString(),
          type: 'swap',
          amount: amt,
          currency: fromToken.symbol,
          description: `Swapped ${amt} ${fromToken.symbol} to ${data.swap.to_amount} ${toToken.symbol}`,
          status: 'completed',
          timestamp: Date.now(),
        });

        // Reload assets from DB
        if (loadUserAssets) await loadUserAssets();

        setFromAmount('');
        setQuote(null);
      } else {
        Alert.alert('Swap Failed', data?.error || 'Transaction failed. Please try again.');
      }
    } catch (e: any) {
      console.error('Swap error:', e);
      Alert.alert('Error', e.message || 'Swap failed');
    }
    setSwapLoading(false);
  };

  const getTokenPrice = (symbol: string) => {
    return livePrices[symbol]?.usd || 0;
  };

  const renderTokenPicker = (visible: boolean, onClose: () => void, onSelect: (t: SwapToken) => void, selected: SwapToken) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Token</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {tokens.map(token => {
              const price = getTokenPrice(token.symbol);
              return (
                <TouchableOpacity
                  key={token.symbol}
                  style={[styles.tokenOption, { borderBottomColor: colors.divider }]}
                  onPress={() => { onSelect(token); onClose(); }}
                >
                  <Image source={{ uri: token.icon }} style={styles.tokenOptionIcon} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.tokenOptionName, { color: colors.text }]}>{token.name}</Text>
                    <Text style={[styles.tokenOptionBalance, { color: colors.textMuted }]}>
                      {token.isFiat ? 'NGN ' : ''}{token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {!token.isFiat ? token.symbol : ''}
                    </Text>
                  </View>
                  {price > 0 && (
                    <Text style={[styles.tokenPrice, { color: colors.textSecondary }]}>${price.toFixed(price > 1 ? 2 : 6)}</Text>
                  )}
                  {selected.symbol === token.symbol && <Ionicons name="checkmark-circle" size={22} color={colors.primary} style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.cardBorder }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Swap</Text>
        <TouchableOpacity style={[styles.settingsBtn, { borderColor: colors.cardBorder }]}>
          <Ionicons name="settings-sharp" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* From Card */}
        <Animated.View style={[styles.swapCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.swapCardHeader}>
            <Text style={[styles.swapLabel, { color: colors.primary }]}>YOU PAY</Text>
            <Text style={[styles.balanceText, { color: colors.textMuted }]}>
              Balance: {fromToken.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </Text>
          </View>
          <View style={styles.swapCardBody}>
            <TextInput
              style={[styles.swapAmount, { color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={fromAmount}
              onChangeText={setFromAmount}
            />
            <TouchableOpacity
              style={[styles.tokenSelect, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
              onPress={() => setShowFromPicker(true)}
            >
              <Image source={{ uri: fromToken.icon }} style={styles.tokenSelectIcon} />
              <Text style={[styles.tokenSelectText, { color: colors.text }]}>{fromToken.symbol}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {fromAmount && quote ? (
            <Text style={[styles.usdValue, { color: colors.textMuted }]}>
              ~${(quote.from_price_usd * parseFloat(fromAmount)).toFixed(2)} USD
            </Text>
          ) : null}
        </Animated.View>

        {/* Swap Button */}
        <View style={styles.swapBtnContainer}>
          <TouchableOpacity
            style={[styles.swapBtn, { backgroundColor: colors.primary }]}
            onPress={swapTokens}
          >
            <MaterialCommunityIcons name="swap-vertical" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* To Card */}
        <View style={[styles.swapCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.swapCardHeader}>
            <Text style={[styles.swapLabel, { color: '#22C55E' }]}>YOU RECEIVE</Text>
            <Text style={[styles.balanceText, { color: colors.textMuted }]}>
              Balance: {toToken.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </Text>
          </View>
          <View style={styles.swapCardBody}>
            <View style={{ flex: 1 }}>
              {quoteLoading ? (
                <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} />
              ) : (
                <Text style={[styles.swapAmount, { color: colors.text, opacity: quote ? 1 : 0.3 }]}>
                  {quote ? quote.to_amount.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '0'}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.tokenSelect, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
              onPress={() => setShowToPicker(true)}
            >
              <Image source={{ uri: toToken.icon }} style={styles.tokenSelectIcon} />
              <Text style={[styles.tokenSelectText, { color: colors.text }]}>{toToken.symbol}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quote Details */}
        {quote && (
          <View style={[styles.quoteCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.quoteRow}>
              <Text style={[styles.quoteLabel, { color: colors.textSecondary }]}>Exchange Rate</Text>
              <Text style={[styles.quoteValue, { color: colors.text }]}>
                1 {fromToken.symbol} = {quote.exchange_rate.toFixed(toToken.isFiat ? 2 : 6)} {toToken.symbol}
              </Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={[styles.quoteLabel, { color: colors.textSecondary }]}>Price Impact</Text>
              <Text style={[styles.quoteValue, { color: quote.price_impact > 1 ? '#EF4444' : '#22C55E' }]}>
                {quote.price_impact.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={[styles.quoteLabel, { color: colors.textSecondary }]}>Gas Fee</Text>
              <Text style={[styles.quoteValue, { color: colors.text }]}>
                ~${quote.gas_fee_usd.toFixed(4)}
              </Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={[styles.quoteLabel, { color: colors.textSecondary }]}>Min. Received</Text>
              <Text style={[styles.quoteValue, { color: colors.text }]}>
                {quote.minimum_received.toLocaleString(undefined, { maximumFractionDigits: 6 })} {toToken.symbol}
              </Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={[styles.quoteLabel, { color: colors.textSecondary }]}>Route</Text>
              <Text style={[styles.quoteValue, { color: colors.primary }]}>
                {quote.route.join(' → ')}
              </Text>
            </View>
            <View style={[styles.quoteRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.quoteLabel, { color: colors.textSecondary }]}>Quote Refresh</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="time" size={12} color={colors.primary} />
                <Text style={[styles.quoteValue, { color: colors.primary }]}>{quoteRefreshTimer}s</Text>
              </View>
            </View>
          </View>
        )}

        {/* Slippage Options */}
        <View style={styles.slippageRow}>
          {['0.5', '1.0', '2.0', '3.0'].map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.slippageBtn, { backgroundColor: slippage === s ? colors.primary : colors.card, borderColor: slippage === s ? colors.primary : colors.cardBorder }]}
              onPress={() => setSlippage(s)}
            >
              <Text style={[styles.slippageText, { color: slippage === s ? '#000' : colors.text }]}>{s}%</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Swap Action */}
        <TouchableOpacity
          style={[styles.swapActionBtn, { backgroundColor: colors.primary, opacity: fromAmount && quote && !swapLoading ? 1 : 0.5 }]}
          onPress={handleSwap}
          disabled={!fromAmount || !quote || swapLoading}
        >
          {swapLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Text style={styles.swapActionText}>Swap</Text>
              <Ionicons name="arrow-forward" size={18} color="#000" />
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.poweredBy, { color: colors.textMuted }]}>
          Powered by Safe Wallet DEX | Live quotes via CoinGecko
        </Text>
      </ScrollView>

      {renderTokenPicker(showFromPicker, () => setShowFromPicker(false), setFromToken, fromToken)}
      {renderTokenPicker(showToPicker, () => setShowToPicker(false), setToToken, toToken)}

      {/* Transaction Result Modal */}
      <Modal visible={showTxResult} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.txResultCard, { backgroundColor: colors.modalBg }]}>
            <View style={[styles.txSuccessIcon, { backgroundColor: '#22C55E20' }]}>
              <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
            </View>
            <Text style={[styles.txResultTitle, { color: colors.text }]}>Swap Successful!</Text>
            <Text style={[styles.txResultDesc, { color: colors.textSecondary }]}>
              Swapped {fromAmount} {fromToken.symbol} to {quote?.to_amount} {toToken.symbol}
            </Text>
            
            {lastTxHash && (
              <View style={[styles.txHashCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.txHashLabel, { color: colors.textMuted }]}>TRANSACTION HASH</Text>
                <Text style={[styles.txHashValue, { color: colors.primary }]} selectable numberOfLines={2}>
                  {lastTxHash}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.txResultBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowTxResult(false);
                setLastTxHash(null);
              }}
            >
              <Text style={styles.txResultBtnText}>Done</Text>
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
  settingsBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  swapCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  swapCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  swapLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  balanceText: { fontSize: 11 },
  swapCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  swapAmount: { fontSize: 28, fontWeight: '800', flex: 1 },
  tokenSelect: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
  tokenSelectIcon: { width: 22, height: 22, borderRadius: 11 },
  tokenSelectText: { fontSize: 14, fontWeight: '700' },
  usdValue: { fontSize: 12, marginTop: 8 },
  swapBtnContainer: { alignItems: 'center', marginVertical: -14, zIndex: 10 },
  swapBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  quoteCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 16 },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' },
  quoteLabel: { fontSize: 12 },
  quoteValue: { fontSize: 12, fontWeight: '700' },
  slippageRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  slippageBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  slippageText: { fontSize: 12, fontWeight: '700' },
  swapActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 14, marginTop: 24, gap: 8 },
  swapActionText: { color: '#000', fontSize: 18, fontWeight: '800' },
  poweredBy: { textAlign: 'center', fontSize: 12, marginTop: 16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  tokenOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5 },
  tokenOptionIcon: { width: 36, height: 36, borderRadius: 18 },
  tokenOptionName: { fontSize: 14, fontWeight: '700' },
  tokenOptionBalance: { fontSize: 12, marginTop: 2 },
  tokenPrice: { fontSize: 12, fontWeight: '600' },
  // TX Result
  txResultCard: { margin: 24, borderRadius: 24, padding: 32, alignItems: 'center', position: 'absolute', top: '25%', left: 0, right: 0 },
  txSuccessIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  txResultTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  txResultDesc: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  txHashCard: { width: '100%', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  txHashLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  txHashValue: { fontSize: 12, fontWeight: '500' },
  txResultBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  txResultBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
