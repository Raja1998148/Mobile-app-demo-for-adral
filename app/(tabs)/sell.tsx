import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '@/lib/constants';
import { CATEGORIES, CONDITIONS, INDIAN_CITIES } from '@/lib/types';

export default function SellScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [city, setCity] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') {
        Alert.alert('Permission needed', 'Please allow access to your photos.');
      } else {
        Alert.alert('Permission needed', 'Please allow access to your photos in settings.');
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setImages([...images, ...result.assets].slice(0, 5));
    }
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  async function uploadImage(uri: string, index: number): Promise<string> {
    const ext = uri.split('.').pop() || 'jpg';
    const path = `${user!.id}/${Date.now()}_${index}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const { error } = await supabase.storage
      .from('ad-images')
      .upload(path, base64.split(',')[1], {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage.from('ad-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit() {
    if (!title || !description || !price || !category || !condition || !city) {
      if (Platform.OS === 'web') {
        window.alert('Please fill in all required fields');
      } else {
        Alert.alert('Error', 'Please fill in all required fields');
      }
      return;
    }

    setLoading(true);
    try {
      let imageUrls: string[] = [];

      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const url = await uploadImage(images[i].uri, i);
          imageUrls.push(url);
        }
      }

      const { data: ad, error } = await supabase
        .from('ads')
        .insert({
          seller_id: user!.id,
          title,
          description,
          price: parseFloat(price),
          category,
          condition,
          city,
          images: imageUrls,
        })
        .select()
        .single();

      if (error) throw error;

      if (Platform.OS === 'web') {
        window.alert('Ad posted successfully!');
      } else {
        Alert.alert('Success', 'Your ad has been posted!');
      }
      router.push(`/ad/${ad.id}`);
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Failed to post ad');
      } else {
        Alert.alert('Error', err.message || 'Failed to post ad');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Photos</Text>
      <View style={styles.photosContainer}>
        <TouchableOpacity style={styles.addPhotoButton} onPress={pickImages}>
          <Ionicons name="camera-outline" size={32} color={Colors.primary} />
          <Text style={styles.addPhotoText}>Add Photos</Text>
          <Text style={styles.addPhotoSubtext}>(Max 5)</Text>
        </TouchableOpacity>
        {images.map((img, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: img.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="What are you selling?"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor={Colors.textLight}
        maxLength={100}
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe your item (condition, features, etc.)"
        value={description}
        onChangeText={setDescription}
        placeholderTextColor={Colors.textLight}
        multiline
        numberOfLines={4}
        maxLength={2000}
      />

      <Text style={styles.label}>Price (INR) *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter price"
        value={price}
        onChangeText={setPrice}
        placeholderTextColor={Colors.textLight}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Category *</Text>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setShowCategoryPicker(!showCategoryPicker)}
      >
        <Text style={category ? styles.pickerText : styles.pickerPlaceholder}>
          {category || 'Select category'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.textLight} />
      </TouchableOpacity>
      {showCategoryPicker && (
        <View style={styles.optionsContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={styles.option}
              onPress={() => {
                setCategory(cat);
                setShowCategoryPicker(false);
              }}
            >
              <Text style={styles.optionText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Condition *</Text>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setShowConditionPicker(!showConditionPicker)}
      >
        <Text style={condition ? styles.pickerText : styles.pickerPlaceholder}>
          {condition || 'Select condition'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.textLight} />
      </TouchableOpacity>
      {showConditionPicker && (
        <View style={styles.optionsContainer}>
          {CONDITIONS.map((cond) => (
            <TouchableOpacity
              key={cond}
              style={styles.option}
              onPress={() => {
                setCondition(cond);
                setShowConditionPicker(false);
              }}
            >
              <Text style={styles.optionText}>{cond}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>City *</Text>
      <TouchableOpacity
        style={styles.picker}
        onPress={() => setShowCityPicker(!showCityPicker)}
      >
        <Text style={city ? styles.pickerText : styles.pickerPlaceholder}>
          {city || 'Select city'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.textLight} />
      </TouchableOpacity>
      {showCityPicker && (
        <View style={styles.optionsContainer}>
          {INDIAN_CITIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={styles.option}
              onPress={() => {
                setCity(c);
                setShowCityPicker(false);
              }}
            >
              <Text style={styles.optionText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Post Ad</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
  },
  addPhotoText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  addPhotoSubtext: {
    fontSize: 10,
    color: Colors.textLight,
  },
  imageWrapper: {
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  picker: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  pickerPlaceholder: {
    fontSize: FontSize.md,
    color: Colors.textLight,
  },
  optionsContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
    maxHeight: 200,
  },
  option: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
