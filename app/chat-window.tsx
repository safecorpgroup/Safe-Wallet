import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, FlatList, KeyboardAvoidingView, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useWallet, ChatMessage } from './context/WalletContext';
import { useAuth } from './context/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/app/lib/supabase';

interface DBMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  read: boolean;
  read_at: string | null;
  delivery_status: string;
}

export default function ChatWindowScreen() {
  const { colors } = useTheme();
  const { chatContacts, addChatMessage } = useWallet();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ contactId: string; contactName: string }>();
  const [message, setMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [dbMessages, setDbMessages] = useState<DBMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);

  const contactId = params.contactId || 'support';
  const contactName = params.contactName || 'Support';
  const contact = chatContacts.find(c => c.id === contactId);
  const isRealUser = contactId.length > 10; // UUID-style IDs are real users

  // Load messages from database
  useEffect(() => {
    if (!user?.id || !isRealUser) {
      setLoading(false);
      return;
    }

    loadMessages();
    markMessagesAsRead();

    // Subscribe to new messages via Supabase Realtime
    const channel = supabase
      .channel(`chat-${user.id}-${contactId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload: any) => {
        const newMsg = payload.new as DBMessage;
        if (newMsg.sender_id === contactId) {
          setDbMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Auto mark as read
          markMessagesAsRead();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
      }, (payload: any) => {
        const updated = payload.new as DBMessage;
        setDbMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
      })
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`typing-${user.id}-${contactId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `chat_partner_id=eq.${user.id}`,
      }, (payload: any) => {
        const indicator = payload.new;
        if (indicator?.user_id === contactId) {
          setPartnerTyping(indicator.is_typing);
          // Auto-clear after 5 seconds
          setTimeout(() => setPartnerTyping(false), 5000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(typingChannel);
    };
  }, [user?.id, contactId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-engine', {
        body: { action: 'get_messages', user_id: user?.id, chat_partner_id: contactId },
      });
      if (data?.success && data?.messages) {
        setDbMessages(data.messages);
      }
    } catch (e) {
      console.error('Load messages error:', e);
    }
    setLoading(false);
  };

  const markMessagesAsRead = async () => {
    if (!user?.id) return;
    try {
      await supabase.functions.invoke('chat-engine', {
        body: { action: 'mark_read', user_id: user.id, chat_partner_id: contactId },
      });
    } catch (e) {
      console.error('Mark read error:', e);
    }
  };

  const handleTyping = useCallback((text: string) => {
    setMessage(text);
    if (!isRealUser || !user?.id) return;

    // Send typing indicator
    if (!typing) {
      setTyping(true);
      supabase.functions.invoke('chat-engine', {
        body: { action: 'set_typing', user_id: user.id, chat_partner_id: contactId, is_typing: true },
      }).catch(() => {});
    }

    // Clear typing after 2 seconds of no input
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      supabase.functions.invoke('chat-engine', {
        body: { action: 'set_typing', user_id: user?.id, chat_partner_id: contactId, is_typing: false },
      }).catch(() => {});
    }, 2000);
  }, [typing, user?.id, contactId, isRealUser]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const msgText = message.trim();
    setMessage('');

    // Stop typing indicator
    setTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (isRealUser && user?.id) {
      // Send to database
      setSending(true);
      try {
        const { data, error } = await supabase.functions.invoke('chat-engine', {
          body: { action: 'send_message', user_id: user.id, receiver_id: contactId, text: msgText },
        });
        if (data?.success && data?.message) {
          setDbMessages(prev => [...prev, data.message]);
        }

        // Clear typing
        await supabase.functions.invoke('chat-engine', {
          body: { action: 'set_typing', user_id: user.id, chat_partner_id: contactId, is_typing: false },
        });
      } catch (e) {
        console.error('Send message error:', e);
      }
      setSending(false);
    } else {
      // Local chat (support, etc.)
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'me',
        receiverId: contactId,
        text: msgText,
        timestamp: Date.now(),
        read: true,
      };
      addChatMessage(contactId, newMsg);

      // Simulate reply for support
      if (contactId === 'support') {
        setPartnerTyping(true);
        setTimeout(() => {
          setPartnerTyping(false);
          const reply: ChatMessage = {
            id: (Date.now() + 1).toString(),
            senderId: contactId,
            receiverId: 'me',
            text: getAutoReply(msgText),
            timestamp: Date.now(),
            read: false,
          };
          addChatMessage(contactId, reply);
        }, 1500);
      }
    }
  };

  const getAutoReply = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('help')) return 'I\'d be happy to help! What do you need assistance with?';
    if (lower.includes('send') || lower.includes('transfer')) return 'To send crypto, go to Assets > Send. You can send via address, username, or email.';
    if (lower.includes('swap')) return 'You can swap tokens from the Swap screen. We support NGN to crypto and cross-chain swaps!';
    if (lower.includes('security') || lower.includes('safe')) return 'Your wallet is secured with 6-digit passcode, biometric unlock, and optional Google Authenticator 2FA.';
    if (lower.includes('bank')) return 'Visit the Bank tab for transfers, deposits, and bill payments. Your NGN balance is always ready!';
    return 'Thanks for your message! Our team will get back to you shortly. Is there anything specific I can help with?';
  };

  const formatTime = (ts: number | string) => {
    const d = typeof ts === 'string' ? new Date(ts) : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  };

  // Merge local and DB messages
  const { chatMessages } = useWallet();
  const localMessages = chatMessages[contactId] || [];
  
  const allMessages = isRealUser 
    ? dbMessages.map(m => ({
        id: m.id,
        senderId: m.sender_id === user?.id ? 'me' : m.sender_id,
        receiverId: m.receiver_id,
        text: m.text,
        timestamp: new Date(m.created_at).getTime(),
        read: m.read,
        deliveryStatus: m.delivery_status,
      }))
    : localMessages;

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.senderId === 'me';
    const deliveryStatus = item.deliveryStatus || (item.read ? 'read' : 'delivered');
    
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMine && (
          <View style={[styles.msgAvatar, { backgroundColor: colors.primary + '30' }]}>
            {contact?.avatar ? (
              <Image source={{ uri: contact.avatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
            ) : (
              <Text style={[styles.msgAvatarText, { color: colors.primary }]}>{getInitials(contactName)}</Text>
            )}
          </View>
        )}
        <View style={[
          styles.msgBubble,
          isMine
            ? { backgroundColor: colors.chatBubbleSent, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.chatBubbleReceived, borderBottomLeftRadius: 4 },
        ]}>
          <Text style={[styles.msgText, { color: isMine ? '#000' : colors.text }]}>{item.text}</Text>
          <View style={styles.msgMeta}>
            <Text style={[styles.msgTime, { color: isMine ? 'rgba(0,0,0,0.5)' : colors.textMuted }]}>
              {formatTime(item.timestamp || item.created_at)}
            </Text>
            {isMine && (
              <Ionicons
                name={deliveryStatus === 'read' ? 'checkmark-done' : deliveryStatus === 'delivered' ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={deliveryStatus === 'read' ? '#3B82F6' : 'rgba(0,0,0,0.4)'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider, paddingTop: Platform.OS === 'ios' ? 56 : 40 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.headerAvatar, { backgroundColor: colors.primary + '30' }]}>
          {contact?.avatar ? (
            <Image source={{ uri: contact.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
          ) : (
            <Text style={[styles.headerAvatarText, { color: colors.primary }]}>{getInitials(contactName)}</Text>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.headerName, { color: colors.text }]}>{contactName}</Text>
          <Text style={[styles.headerStatus, { color: partnerTyping ? '#22C55E' : contact?.online ? '#22C55E' : colors.textMuted }]}>
            {partnerTyping ? 'typing...' : contact?.online ? 'online' : 'offline'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerAction, { backgroundColor: colors.background }]}
          onPress={() => router.push({ pathname: '/user-details', params: { userId: contactId, userName: contactName } })}
        >
          <Ionicons name="person-circle" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.headerAction, { backgroundColor: colors.background }]}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>Loading messages...</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={allMessages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing Indicator */}
      {partnerTyping && (
        <View style={[styles.typingRow]}>
          <View style={[styles.typingBubble, { backgroundColor: colors.chatBubbleReceived }]}>
            <View style={styles.typingDots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.typingDot, { backgroundColor: colors.textMuted }]} />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.divider }]}>
        <TouchableOpacity style={styles.inputAction}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity>
            <Ionicons name="happy" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: message.trim() ? colors.primary : colors.card }]}
          onPress={sendMessage}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name="send" size={18} color={message.trim() ? '#000' : colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 8 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { fontSize: 14, fontWeight: '700' },
  headerName: { fontSize: 15, fontWeight: '700' },
  headerStatus: { fontSize: 11, marginTop: 1 },
  headerAction: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  messageList: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 8, flexDirection: 'row', alignItems: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  msgAvatarText: { fontSize: 10, fontWeight: '700' },
  msgBubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  msgTime: { fontSize: 10 },
  typingRow: { paddingHorizontal: 16, paddingBottom: 4 },
  typingBubble: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, borderBottomLeftRadius: 4 },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 8, borderTopWidth: 0.5, paddingBottom: Platform.OS === 'ios' ? 28 : 8 },
  inputAction: { padding: 6 },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 6, maxHeight: 100 },
  textInput: { flex: 1, fontSize: 15, maxHeight: 80, marginRight: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
