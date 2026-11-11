import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '@/lib/constants';
import type { Ad } from '@/lib/types';

const { width } = Dimensions.get('window');
const cardWidth = (width - Spacing.md * 3) / 2;

interface AdCardProps {
  ad: Ad;
}

export default function AdCard({ ad }: AdCardProps) {
  const router = useRouter();

  function formatPrice(price: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/ad/${ad.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {ad.images && ad.images.length > 0 ? (
          <Image source={{ uri: ad.images[0] }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={40} color={Colors.textLight} />
          </View>
        )}
        {ad.is_favorite && (
          <View style={styles.favoriteBadge}>
            <Ionicons name="heart" size={14} color={Colors.error} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {ad.title}
        </Text>
        <Text style={styles.price}>{formatPrice(ad.price)}</Text>
        <View style={styles.meta}>
          <Ionicons name="location-outline" size={12} color={Colors.textLight} />
          <Text style={styles.city} numberOfLines={1}>
            {ad.city}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: cardWidth,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  city: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginLeft: 4,
  },
});
