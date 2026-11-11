import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Colors, Spacing, FontSize, BorderRadius } from '@/lib/constants';
import { INDIAN_CITIES } from '@/lib/types';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'search-outline' as const,
    title: 'Find great deals near you',
    description: 'Browse thousands of ads in your city. From electronics to cars, find exactly what you need.',
  },
  {
    id: '2',
    icon: 'camera-outline' as const,
    title: 'Sell anything in 60 seconds',
    description: 'Snap a photo, add a price, and your ad is live. Reach millions of buyers instantly.',
  },
  {
    id: '3',
    icon: 'chatbubbles-outline' as const,
    title: 'Chat safely, meet locally',
    description: 'Connect with sellers and buyers through secure in-app chat. No phone numbers shared.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  async function handleUseCurrentLocation() {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('Location permission denied. Please choose a city manually.');
        } else {
          Alert.alert('Permission Denied', 'Location permission is required. Please choose a city manually.');
        }
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync(location.coords);
      
      let city = 'Mumbai';
      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        if (address.city) {
          city = address.city;
        } else if (address.subregion) {
          city = address.subregion;
        }
      }

      await AsyncStorage.setItem('user_city', city);
      await AsyncStorage.setItem('has_completed_onboarding', 'true');
      router.replace('/(auth)/login');
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Could not get location. Please choose a city manually.');
      } else {
        Alert.alert('Error', 'Could not get location. Please choose a city manually.');
      }
    } finally {
      setLoadingLocation(false);
    }
  }

  async function handleChooseCityManually() {
    setShowCityPicker(true);
  }

  async function handleSelectCity(city: string) {
    await AsyncStorage.setItem('user_city', city);
    await AsyncStorage.setItem('has_completed_onboarding', 'true');
    router.replace('/(auth)/login');
  }

  function renderSlide({ item }: { item: typeof slides[0] }) {
    const isLastSlide = item.id === '3';

    return (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={80} color={Colors.primary} />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>

        {isLastSlide && (
          <View style={styles.locationSection}>
            <Text style={styles.locationTitle}>Where are you located?</Text>
            
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleUseCurrentLocation}
              disabled={loadingLocation}
            >
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.locationButtonText}>
                {loadingLocation ? 'Getting location...' : 'Use my current location'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.locationButton, styles.manualButton]}
              onPress={handleChooseCityManually}
            >
              <Ionicons name="list" size={20} color={Colors.text} />
              <Text style={[styles.locationButtonText, styles.manualButtonText]}>
                Choose city manually
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (showCityPicker) {
    return (
      <View style={styles.container}>
        <View style={styles.cityPickerHeader}>
          <TouchableOpacity onPress={() => setShowCityPicker(false)}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.cityPickerTitle}>Select your city</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.cityList}>
          {INDIAN_CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              style={styles.cityItem}
              onPress={() => handleSelectCity(city)}
            >
              <Text style={styles.cityItemText}>{city}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentSlide(slideIndex);
        }}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  slide: {
    width,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  slideTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 32,
  },
  slideDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  locationSection: {
    marginTop: Spacing.xl,
    width: '100%',
  },
  locationTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  locationButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  manualButton: {
    backgroundColor: Colors.background,
  },
  manualButtonText: {
    color: Colors.text,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  cityPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg,
    paddingBottom: Spacing.md,
  },
  cityPickerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  cityList: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
});
