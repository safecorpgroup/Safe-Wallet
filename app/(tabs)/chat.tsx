import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, TextInput, Image, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/app/lib/supabase';

interface Conversation {
  partner_id: string;
  partner_name: string;
  partner_avatar: string | null;
  partner_wallet: string | null;
  last_message: string;
  last_message_at: string;
  is_mine: boolean;
  unread_count: number;
  delivery_status?: string;
}

interface SearchUser {
  id: string;
  username: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const { chatContacts } = useWallet();
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Load conversations from database
  useEffect(() => {
    if (user?.id) {
      loadConversations();
      
      // Subscribe to new messages for real-time updates
      const channel = supabase
        .channel(`chat-list-${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        }, () => {
          // Reload conversations when new message arrives
          loadConversations();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const loadConversations = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-engine', {
        body: { action: 'get_conversations', user_id: user.id },
      });
      if (data?.success && data?.conversations) {
        setConversations(data.conversations);
      }
    } catch (e) {
      console.error('Load conversations error:', e);
    }
    setLoading(false);
  };

  const handleSearchUsers = useCallback(async (query: string) => {
    setUserSearchQuery(query);
    if (!query || query.length < 2 || !user?.id) {
      setSearchUsers([]);
      return;
    }
    setSearchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-engine', {
        body: { action: 'search_chat_users', user_id: user.id, query },
      });
      if (data?.success && data?.users) {
        setSearchUsers(data.users);
      }
    } catch (e) {
      console.error('Search users error:', e);
    }
    setSearchLoading(false);
  }, [user?.id]);

  const startChat = (targetUser: SearchUser) => {
    setShowNewChat(false);
    setUserSearchQuery('');
    setSearchUsers([]);
    router.push({
      pathname: '/chat-window',
      params: {
        contactId: targetUser.id,
        contactName: targetUser.username || targetUser.phone || targetUser.email || 'User',
      },
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0]?.[0] || '?';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Combine local contacts with DB conversations
  const allChats = [
    // Local contacts (support, etc.)
    ...chatContacts.filter(c => !conversations.find(conv => conv.partner_id === c.id)).map(c => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      lastMessage: c.lastMessage,
      lastTime: c.lastTime,
      unread: c.unread,
      online: c.online,
      isLocal: true,
    })),
    // DB conversations
    ...conversations.map(conv => ({
      id: conv.partner_id,
      name: conv.partner_name,
      avatar: conv.partner_avatar || '',
      lastMessage: conv.last_message,
      lastTime: formatTime(conv.last_message_at),
      unread: conv.unread_count,
      online: false,
      isLocal: false,
    })),
  ];

  const filteredChats = searchQuery
    ? allChats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allChats;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 44 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => setShowNewChat(true)}
          >
            <Ionicons name="create" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={loadConversations}
          >
            <Ionicons name="refresh" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          placeholder="Search conversations..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {/* Online Users */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.onlineRow} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
        {chatContacts.filter(c => c.online).map(contact => (
          <TouchableOpacity
            key={contact.id}
            style={styles.onlineUser}
            onPress={() => router.push({ pathname: '/chat-window', params: { contactId: contact.id, contactName: contact.name } })}
          >
            <View style={[styles.onlineAvatar, { backgroundColor: colors.primary + '30' }]}>
              {contact.avatar ? (
                <Image source={{ uri: contact.avatar }} style={styles.onlineAvatarImg} />
              ) : (
                <Text style={[styles.onlineAvatarText, { color: colors.primary }]}>{getInitials(contact.name)}</Text>
              )}
              <View style={styles.onlineBadge} />
            </View>
            <Text style={[styles.onlineName, { color: colors.textSecondary }]} numberOfLines={1}>
              {contact.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading */}
      {loading && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {/* Chat List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {filteredChats.map(chat => (
          <TouchableOpacity
            key={chat.id}
            style={[styles.chatItem, { borderBottomColor: colors.divider }]}
            onPress={() => router.push({ pathname: '/chat-window', params: { contactId: chat.id, contactName: chat.name } })}
            activeOpacity={0.7}
          >
            <View style={[styles.chatAvatar, { backgroundColor: chat.id === 'support' ? colors.primary + '30' : colors.card }]}>
              {chat.avatar ? (
                <Image source={{ uri: chat.avatar }} style={styles.chatAvatarImg} />
              ) : (
                <Text style={[styles.chatAvatarText, { color: colors.primary }]}>{getInitials(chat.name)}</Text>
              )}
              {chat.online && <View style={styles.chatOnlineDot} />}
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.chatNameRow}>
                <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>{chat.name}</Text>
                <Text style={[styles.chatTime, { color: colors.textMuted }]}>{chat.lastTime}</Text>
              </View>
              <View style={styles.chatMsgRow}>
                <Text style={[styles.chatMsg, { color: colors.textSecondary }]} numberOfLines={1}>
                  {chat.lastMessage}
                </Text>
                {chat.unread > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.unreadText}>{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredChats.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No conversations found</Text>
            <TouchableOpacity
              style={[styles.newChatBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowNewChat(true)}
            >
              <Ionicons name="add" size={18} color="#000" />
              <Text style={styles.newChatBtnText}>Start New Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* New Chat Modal */}
      <Modal visible={showNewChat} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Chat</Text>
              <TouchableOpacity onPress={() => { setShowNewChat(false); setSearchUsers([]); setUserSearchQuery(''); }}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, marginHorizontal: 0 }]}>
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                placeholder="Search by username, phone, or email..."
                placeholderTextColor={colors.textMuted}
                value={userSearchQuery}
                onChangeText={handleSearchUsers}
                style={[styles.searchInput, { color: colors.text }]}
                autoFocus
              />
            </View>

            {searchLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}

            <ScrollView style={{ marginTop: 12 }}>
              {searchUsers.map(u => (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.userItem, { borderBottomColor: colors.divider }]}
                  onPress={() => startChat(u)}
                >
                  <View style={[styles.userAvatar, { backgroundColor: colors.primary + '30' }]}>
                    {u.avatar_url ? (
                      <Image source={{ uri: u.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    ) : (
                      <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                        {getInitials(u.username || u.phone || '?')}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {u.username ? `@${u.username}` : u.phone || u.email || 'User'}
                    </Text>
                    {u.wallet_address && (
                      <Text style={[styles.userWallet, { color: colors.textMuted }]} numberOfLines={1}>
                        {u.wallet_address.slice(0, 10)}...{u.wallet_address.slice(-6)}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chatbubble" size={20} color={colors.primary} />
                </TouchableOpacity>
              ))}

              {userSearchQuery.length >= 2 && searchUsers.length === 0 && !searchLoading && (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Ionicons name="person-outline" size={40} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No users found</Text>
                </View>
              )}
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
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  onlineRow: { marginBottom: 12, maxHeight: 80 },
  onlineUser: { alignItems: 'center', width: 56 },
  onlineAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  onlineAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  onlineAvatarText: { fontSize: 16, fontWeight: '700' },
  onlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#0A0A0A' },
  onlineName: { fontSize: 10, marginTop: 4, fontWeight: '600' },
  chatItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  chatAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  chatAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  chatAvatarText: { fontSize: 16, fontWeight: '700' },
  chatOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#0A0A0A' },
  chatNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 15, fontWeight: '700', flex: 1 },
  chatTime: { fontSize: 11, marginLeft: 8 },
  chatMsgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  chatMsg: { fontSize: 13, flex: 1 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginLeft: 8 },
  unreadText: { color: '#000', fontSize: 10, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, marginTop: 12 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 6, marginTop: 16 },
  newChatBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 14, fontWeight: '700' },
  userName: { fontSize: 14, fontWeight: '700' },
  userWallet: { fontSize: 11, marginTop: 2 },
});
