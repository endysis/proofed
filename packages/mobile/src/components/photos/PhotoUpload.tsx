import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Icon, Modal } from '../common';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';
import type { ImageAsset } from '../../api/client';

interface PhotoUploadProps {
  onUpload: (image: ImageAsset) => void;
  isLoading?: boolean;
}

export default function PhotoUpload({ onUpload, isLoading }: PhotoUploadProps) {
  const [showOptions, setShowOptions] = useState(false);

  const requestPermission = async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please allow camera access to take photos.'
        );
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please allow photo library access to select photos.'
        );
        return false;
      }
    }
    return true;
  };

  const handleTakePhoto = async () => {
    setShowOptions(false);
    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onUpload({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
      });
    }
  };

  const handleChoosePhoto = async () => {
    setShowOptions(false);
    const hasPermission = await requestPermission('library');
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onUpload({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
      });
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={() => setShowOptions(true)}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.buttonText}>Uploading...</Text>
          </>
        ) : (
          <>
            <Icon name="add_a_photo" size="sm" color={colors.primary} />
            <Text style={styles.buttonText}>Add Photo</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        title="Add Photo"
      >
        <View style={styles.options}>
          <TouchableOpacity
            style={styles.option}
            onPress={handleTakePhoto}
            activeOpacity={0.7}
          >
            <Icon name="photo_camera" size="md" color={colors.primary} />
            <Text style={styles.optionText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={handleChoosePhoto}
            activeOpacity={0.7}
          >
            <Icon name="photo_library" size="md" color={colors.primary} />
            <Text style={styles.optionText}>Choose from Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelOption}
            onPress={() => setShowOptions(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  options: {
    gap: spacing[2],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.xl,
  },
  optionText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text,
  },
  cancelOption: {
    alignItems: 'center',
    padding: spacing[4],
    marginTop: spacing[2],
  },
  cancelText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.dustyMauve,
  },
});
