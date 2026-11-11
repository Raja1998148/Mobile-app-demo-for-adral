import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '@/lib/constants';
import type { Ad } from '@/lib/types';

export default function MyAdsScreen() {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchMyAds();
    }, [])
  );

  function formatPrice(price: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  }

  async function fetchMyAds() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAds(data);
    }
    setLoading(false);
  }

  async function deleteAd(adId: string) {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this ad?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert('Delete Ad', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });

    if (!confirmed) return;

    const { error } = await supabase.from('ads').delete().eq('id', adId);
    if (!error) {
      setAds(ads.filter((ad) => ad.id !== adId));
    }
  }

  function renderAdItem({ item }: { item: Ad }) {
    return (
      <TouchableOpacity
        style={styles.adItem}
        onPress={() => router.push(`/ad/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={Colors.textLight} />
            </View>
          )}
        </View>
        <View style={styles.adContent}>
          <Text style={styles.adTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.adPrice}>{formatPrice(item.price)}</Text>
          <View style={styles.adMeta}>
            <Text style={styles.adCategory}>{item.category}</Text>
            <Text style={styles.adDot}> &bull; </Text>
            <Text style={styles.adCity}>{item.city}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteAd(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
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

  if (ads.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={64} color={Colors.textLight} />
        <Text style={styles.emptyTitle}>No ads yet</Text>
        <Text style={styles.emptyText}>
          Tap the Sell tab to post your first ad
        </Text>
        <TouchableOpacity
          style={styles.sellButton}
          onPress={() => router.push('/(tabs)/sell')}
        >
          <Text style={styles.sellButtonText}>Post an Ad</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ads}
        keyExtractor={(item) => item.id}
        renderItem={renderAdItem}
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
    marginBottom: Spacing.lg,
  },
  sellButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  sellButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.md,
  },
  adItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  image: {
    width: 72,
    height: 72,
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adContent: {
    flex: 1,
  },
  adTitle: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  adPrice: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  adMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adCategory: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  adDot: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  adCity: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
});
