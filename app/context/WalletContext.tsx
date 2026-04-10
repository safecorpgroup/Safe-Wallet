import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from './AuthContext';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  color: string;
  price: number;
  change24h: number;
  balance: number;
  value: number;
  network: string;
  contractAddress?: string;
  visible: boolean;
  isMiningCoin?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'buy' | 'sell' | 'transfer' | 'deposit' | 'airtime' | 'data' | 'electricity' | 'tv';
  amount: number;
  currency: string;
  to?: string;
  from?: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: number;
  description: string;
}

interface WalletContextType {
  assets: Asset[];
  setAssets: (a: Asset[]) => void;
  totalBalance: number;
  ngnRate: number;
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  chatContacts: ChatContact[];
  chatMessages: Record<string, ChatMessage[]>;
  addChatMessage: (contactId: string, msg: ChatMessage) => void;
  walletAddress: string;
  walletName: string;
  username: string;
  toggleAssetVisibility: (id: string) => void;
  addAsset: (asset: Asset) => void;
  refreshPrices: () => Promise<void>;
  loading: boolean;
  ngnBalance: number;
  setNgnBalance: (n: number) => void;
  loadUserAssets: () => Promise<void>;
  loadUserTransactions: () => Promise<void>;
}

const defaultAssets: Asset[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', color: '#F7931A', price: 0, change24h: 0, balance: 0, value: 0, network: 'Bitcoin', visible: true },
  { id: 'usdt', symbol: 'USDT', name: 'Tether USD', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png', color: '#26A17B', price: 1.00, change24h: 0.01, balance: 0, value: 0, network: 'Multi-chain', visible: true },
  { id: 'scai', symbol: 'SCAI', name: 'Secure Chain AI', icon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978743357_84f0977b.png', color: '#00B4D8', price: 0, change24h: 0, balance: 100, value: 0, network: 'Secure Chain', visible: true },
  { id: 'sda', symbol: 'SDA', name: 'Sidra', icon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978813496_1dae82dc.jpeg', color: '#D4A843', price: 0, change24h: 0, balance: 500, value: 0, network: 'Sidra Chain', visible: true, isMiningCoin: true },
  { id: 'vchat', symbol: 'VCHAT', name: 'VeryChat', icon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978818667_97affa6c.webp', color: '#FF4081', price: 0, change24h: 0, balance: 1200, value: 0, network: 'VeryChat', visible: true, isMiningCoin: true },
  { id: 'intl', symbol: 'INTL', name: 'InterLink', icon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978821082_1d429fa9.jpeg', color: '#7C4DFF', price: 0, change24h: 0, balance: 800, value: 0, network: 'InterLink', visible: true, isMiningCoin: true },
  { id: 'hot', symbol: 'HOT', name: 'HOT Coin', icon: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978823803_69eb26c0.jpeg', color: '#FF6D00', price: 0, change24h: 0, balance: 2000, value: 0, network: 'HOT Labs', visible: true, isMiningCoin: true },
];

const defaultContacts: ChatContact[] = [
  { id: 'support', name: 'Safe Wallet Support', avatar: 'https://d64gsuwffb70l.cloudfront.net/69cc045ce678d316171079eb_1774978827102_89b5c4bc.png', lastMessage: 'Welcome to Safe Wallet! How can we help?', lastTime: '2m ago', unread: 1, online: true },
  { id: 'user1', name: 'Ahmed Ibrahim', avatar: '', lastMessage: 'Transaction confirmed', lastTime: '15m ago', unread: 0, online: true },
  { id: 'user2', name: 'Grace Okonkwo', avatar: '', lastMessage: 'Thanks for the trade!', lastTime: '1h ago', unread: 0, online: false },
  { id: 'user3', name: 'David Chen', avatar: '', lastMessage: 'Can you send 50 USDT?', lastTime: '3h ago', unread: 2, online: true },
];

const defaultMessages: Record<string, ChatMessage[]> = {
  'support': [
    { id: '1', senderId: 'support', receiverId: 'me', text: 'Welcome to Safe Wallet! How can we help you today?', timestamp: Date.now() - 120000, read: true },
    { id: '2', senderId: 'support', receiverId: 'me', text: 'Feel free to ask about any features, transactions, or security settings.', timestamp: Date.now() - 60000, read: false },
  ],
  'user1': [
    { id: '1', senderId: 'user1', receiverId: 'me', text: 'Hey, I sent you 100 SCAI', timestamp: Date.now() - 900000, read: true },
    { id: '2', senderId: 'me', receiverId: 'user1', text: 'Received! Thanks', timestamp: Date.now() - 800000, read: true },
    { id: '3', senderId: 'user1', receiverId: 'me', text: 'Transaction confirmed', timestamp: Date.now() - 700000, read: true },
  ],
  'user3': [
    { id: '1', senderId: 'user3', receiverId: 'me', text: 'Hi, are you available for a trade?', timestamp: Date.now() - 20000000, read: true },
    { id: '2', senderId: 'me', receiverId: 'user3', text: 'Yes, what do you need?', timestamp: Date.now() - 19000000, read: true },
    { id: '3', senderId: 'user3', receiverId: 'me', text: 'Can you send 50 USDT?', timestamp: Date.now() - 10800000, read: false },
  ],
};

const defaultTransactions: Transaction[] = [
  { id: '1', type: 'receive', amount: 100, currency: 'SCAI', from: 'Ahmed Ibrahim', status: 'completed', timestamp: Date.now() - 3600000, description: 'Received SCAI' },
  { id: '2', type: 'swap', amount: 50, currency: 'USDT', status: 'completed', timestamp: Date.now() - 7200000, description: 'Swapped NGN to USDT' },
  { id: '3', type: 'send', amount: 0.001, currency: 'BTC', to: 'Grace Okonkwo', status: 'completed', timestamp: Date.now() - 86400000, description: 'Sent Bitcoin' },
  { id: '4', type: 'deposit', amount: 50000, currency: 'NGN', status: 'completed', timestamp: Date.now() - 172800000, description: 'Bank Deposit' },
  { id: '5', type: 'airtime', amount: 1000, currency: 'NGN', status: 'completed', timestamp: Date.now() - 259200000, description: 'Airtime Purchase - MTN' },
];

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>(defaultAssets);
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [chatContacts] = useState<ChatContact[]>(defaultContacts);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(defaultMessages);
  const [loading, setLoading] = useState(false);
  const [ngnRate, setNgnRate] = useState(1580.50);
  const [ngnBalance, setNgnBalance] = useState(150000.00);

  const walletAddress = user?.wallet_address || '0x47bDD74eae82fB8fe166E437f7C3aaD6eDa8c44a';
  const walletName = user?.username ? `@${user.username}` : 'Main Wallet';
  const username = user?.username || 'safewallet_user';

  // Load user assets from database
  const loadUserAssets = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: { action: 'get_assets', user_id: user.id },
      });
      if (data?.success && data?.assets && data.assets.length > 0) {
        const dbAssets: Asset[] = data.assets.map((a: any) => ({
          id: a.symbol.toLowerCase(),
          symbol: a.symbol,
          name: a.name,
          icon: a.icon_url || defaultAssets.find(d => d.symbol === a.symbol)?.icon || '',
          color: a.color || '#888',
          price: 0,
          change24h: 0,
          balance: parseFloat(a.balance) || 0,
          value: 0,
          network: a.network || '',
          contractAddress: a.contract_address,
          visible: a.visible !== false,
          isMiningCoin: a.is_mining_coin || false,
        }));
        setAssets(dbAssets);
      }
    } catch (e) {
      console.error('Load assets error:', e);
    }
  };

  // Load user transactions from database
  const loadUserTransactions = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: { action: 'get_transactions', user_id: user.id },
      });
      if (data?.success && data?.transactions && data.transactions.length > 0) {
        const dbTxns: Transaction[] = data.transactions.map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: parseFloat(t.amount),
          currency: t.currency,
          to: t.to_address || t.to_username,
          from: t.from_address || t.from_username,
          status: t.status,
          timestamp: new Date(t.created_at).getTime(),
          description: t.description || '',
        }));
        setTransactions(prev => [...dbTxns, ...prev.filter(p => !dbTxns.find(d => d.id === p.id))]);
      }
    } catch (e) {
      console.error('Load transactions error:', e);
    }
  };

  const refreshPrices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-crypto-prices', {
        body: { symbols: ['BTC/USD', 'ETH/USD', 'BNB/USD'] },
      });

      if (data && !error) {
        setAssets(prev => prev.map(asset => {
          const priceData = data[asset.symbol];
          if (priceData) {
            return {
              ...asset,
              price: priceData.price,
              change24h: priceData.percent_change,
              value: asset.balance * priceData.price,
            };
          }
          return asset;
        }));
        if (data.NGN_RATE) {
          setNgnRate(data.NGN_RATE.usd_to_ngn);
        }
      }
    } catch (e) {
      console.error('Price fetch error:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      loadUserAssets();
      loadUserTransactions();
    }
  }, [user?.id]);

  useEffect(() => {
    refreshPrices();
    const interval = setInterval(refreshPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalBalance = assets.filter(a => a.visible).reduce((sum, a) => sum + a.value, 0);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
    // Also save to database
    if (user?.id) {
      supabase.from('transactions').insert({
        user_id: user.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        to_address: t.to,
        from_address: t.from,
        status: t.status,
        description: t.description,
      }).then(() => {}).catch(console.error);
    }
  };

  const addChatMessage = (contactId: string, msg: ChatMessage) => {
    setChatMessages(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), msg],
    }));
  };

  const toggleAssetVisibility = (id: string) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, visible: !a.visible } : a));
    // Update in database
    if (user?.id) {
      const asset = assets.find(a => a.id === id);
      if (asset) {
        supabase.from('user_assets')
          .update({ visible: !asset.visible })
          .eq('user_id', user.id)
          .eq('symbol', asset.symbol)
          .then(() => {}).catch(console.error);
      }
    }
  };

  const addAsset = (asset: Asset) => {
    setAssets(prev => [...prev, asset]);
    // Save to database
    if (user?.id) {
      supabase.from('user_assets').insert({
        user_id: user.id,
        symbol: asset.symbol,
        name: asset.name,
        balance: asset.balance,
        visible: true,
        network: asset.network,
        contract_address: asset.contractAddress,
        icon_url: asset.icon,
        color: asset.color,
        is_mining_coin: asset.isMiningCoin || false,
      }).then(() => {}).catch(console.error);
    }
  };

  return (
    <WalletContext.Provider value={{
      assets, setAssets, totalBalance, ngnRate, transactions, addTransaction,
      chatContacts, chatMessages, addChatMessage, walletAddress, walletName,
      username, toggleAssetVisibility, addAsset, refreshPrices, loading,
      ngnBalance, setNgnBalance, loadUserAssets, loadUserTransactions,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
