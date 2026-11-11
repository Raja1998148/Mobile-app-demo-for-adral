import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '@/lib/constants';
import type { Chat } from '@/lib/types';

export default function ChatsScreen() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchChats();
  }, []);

  async function fetchChats() {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        ad:ads(id, title, images),
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (!error && data) {
      const otherUserIds = data.map((chat) =>
        chat.buyer_id === user.id ? chat.seller_id : chat.buyer_id
      );

      if (otherUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', otherUserIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]));

        const chatsWithUsers = data.map((chat) => ({
          ...chat,
          other_user: profileMap.get(
            chat.buyer_id === user.id ? chat.seller_id : chat.buyer_id
          ),
        }));

        setChats(chatsWithUsers);
      }
    }
    setLoading(false);
  }

  function formatTime(dateString: string | null) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  function renderChatItem({ item }: { item: Chat }) {
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          {item.other_user?.avatar_url ? (
            <Image
              source={{ uri: item.other_user.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person" size={24} color={Colors.textLight} />
          )}
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>
              {item.other_user?.username || 'User'}
            </Text>
            <Text style={styles.chatTime}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>
          <Text style={styles.chatMessage} numberOfLines={1}>
            {item.last_message || 'Start a conversation'}
          </Text>
          {item.ad && (
            <View style={styles.adPreview}>
              {item.ad.images && item.ad.images.length > 0 ? (
                <Image
                  source={{ uri: item.ad.images[0] }}
                  style={styles.adImage}
                />
              ) : (
                <View style={styles.adImagePlaceholder}>
                  <Ionicons name="cube-outline" size={14} color={Colors.textLight} />
                </View>
              )}
              <Text style={styles.adTitle} numberOfLines={1}>
                {item.ad.title}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={Colors.textLight} />
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptyText}>
          When you contact a seller about an ad, your conversations will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: Spacing.md,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  chatTime: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  chatMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  adPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    marginTop: 4,
  },
  adImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  adImagePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: Spacing.xs,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adTitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
});
