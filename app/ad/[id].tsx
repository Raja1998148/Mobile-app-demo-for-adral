import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '@/lib/constants';
import type { Ad, Profile } from '@/lib/types';

const { width } = Dimensions.get('window');

export default function AdDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [ad, setAd] = useState<(Ad & { seller: Profile }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchAd();
  }, [id]);

  async function fetchAd() {
    const { data, error } = await supabase
      .from('ads')
      .select(`
        *,
        seller:profiles(id, username, avatar_url, phone, city)
      `)
      .eq('id', id)
      .single();

    if (!error && data) {
      setAd(data);
      if (user) {
        const { data: favData } = await supabase
          .from('favorites')
          .select('id')
          .eq('ad_id', data.id)
          .eq('user_id', user.id)
          .single();
        setIsFavorite(!!favData);
      }
    }
    setLoading(false);
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  }

  async function toggleFavorite() {
    if (!user) return;
    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('ad_id', id)
        .eq('user_id', user.id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({
        ad_id: id,
        user_id: user.id,
      });
      setIsFavorite(true);
    }
  }

  async function startChat() {
    if (!user || !ad) return;
    if (user.id === ad.seller_id) {
      if (Platform.OS === 'web') {
        window.alert("You can't chat with yourself");
      } else {
        Alert.alert("You can't message yourself");
      }
      return;
    }

    const { data: existingChat } = await supabase
      .from('chats')
      .select('id')
      .eq('ad_id', ad.id)
      .eq('buyer_id', user.id)
      .eq('seller_id', ad.seller_id)
      .single();

    let chatId: string;

    if (existingChat) {
      chatId = existingChat.id;
    } else {
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          ad_id: ad.id,
          buyer_id: user.id,
          seller_id: ad.seller_id,
        })
        .select()
        .single();

      if (error) {
        if (Platform.OS === 'web') {
          window.alert('Failed to start chat');
        } else {
          Alert.alert('Error', 'Failed to start chat');
        }
        return;
      }
      chatId = newChat.id;
    }

    router.push(`/chat/${chatId}`);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!ad) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Ad not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          {ad.images && ad.images.length > 0 ? (
            <>
              <Image
                source={{ uri: ad.images[currentImageIndex] }}
                style={styles.mainImage}
              />
              {ad.images.length > 1 && (
                <View style={styles.imageDots}>
                  {ad.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === currentImageIndex && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImage}>
              <Ionicons name="image-outline" size={64} color={Colors.textLight} />
              <Text style={styles.noImageText}>No photos</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={toggleFavorite}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? Colors.error : Colors.white}
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.price}>{formatPrice(ad.price)}</Text>
          <Text style={styles.title}>{ad.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={Colors.textLight} />
              <Text style={styles.metaText}>{ad.city}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textLight} />
              <Text style={styles.metaText}>
                {new Date(ad.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{ad.category}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{ad.condition}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{ad.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                {ad.seller?.avatar_url ? (
                  <Image
                    source={{ uri: ad.seller.avatar_url }}
                    style={styles.sellerAvatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={24} color={Colors.textLight} />
                )}
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>
                  {ad.seller?.username || 'User'}
                </Text>
                {ad.seller?.city && (
                  <Text style={styles.sellerCity}>{ad.seller.city}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatButton} onPress={startChat}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButton} onPress={startChat}>
          <Ionicons name="call-outline" size={20} color={Colors.white} />
          <Text style={styles.callButtonText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textLight,
  },
  imageSection: {
    width: '100%',
    height: width,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: FontSize.md,
    color: Colors.textLight,
    marginTop: Spacing.sm,
  },
  imageDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: Colors.white,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  price: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: 48,
    height: 48,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  sellerCity: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: Spacing.sm,
  },
  chatButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  callButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
  },
  callButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
});
