import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Modal as RNModal,
  Image,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-expect-error - LinearGradient works at runtime but has React 19 type issues
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Icon } from '../common';
import { usePhotoUrl } from '../../hooks/usePhotos';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';

interface LuxuryPhotoGalleryProps {
  photoKeys: string[];
  onClose: () => void;
  onSetMain?: (photoKey: string) => void;
  onDelete?: (photoKey: string) => void;
  onRebake?: () => void;
  title: string;
  date: string;
  mainPhotoKey?: string;
  initialIndex?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.7;

function formatBakeDate(dateString: string): string {
  const date = new Date(dateString);
  return date
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}

// Smooth gradient fade to white using expo-linear-gradient
function FadeGradient() {
  return (
    <LinearGradient
      colors={[
        'transparent',
        'rgba(255,255,255,0.15)',
        'rgba(255,255,255,0.4)',
        'rgba(255,255,255,0.7)',
        '#ffffff',
      ]}
      locations={[0, 0.3, 0.5, 0.7, 1]}
      style={styles.gradient}
      pointerEvents="none"
    />
  );
}

export default function LuxuryPhotoGallery({
  photoKeys,
  onClose,
  onSetMain,
  onDelete,
  onRebake,
  title,
  date,
  mainPhotoKey,
  initialIndex = 0,
}: LuxuryPhotoGalleryProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const safeIndex = Math.min(currentIndex, photoKeys.length - 1);
  const currentPhotoKey = photoKeys[safeIndex];
  const isCurrentMain = currentPhotoKey === mainPhotoKey;

  // Update index if photos are deleted
  React.useEffect(() => {
    if (currentIndex >= photoKeys.length && photoKeys.length > 0) {
      setCurrentIndex(photoKeys.length - 1);
    }
  }, [photoKeys.length, currentIndex]);

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(slideIndex);
  };

  const handleOptionsPress = () => {
    const options: string[] = ['Cancel'];
    const actions: (() => void)[] = [];

    // Add Set as Main option if available and not already main
    if (onSetMain && !isCurrentMain) {
      options.push('Set as Main Photo');
      actions.push(() => onSetMain(currentPhotoKey));
    }

    // Add Share option
    options.push('Share Photo');
    actions.push(handleShare);

    // Add Delete option if available
    if (onDelete) {
      options.push('Delete Photo');
      actions.push(() => onDelete(currentPhotoKey));
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: onDelete ? options.length - 1 : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex > 0 && buttonIndex <= actions.length) {
            actions[buttonIndex - 1]();
          }
        }
      );
    } else {
      const alertOptions = actions.map((action, index) => ({
        text: options[index + 1],
        onPress: action,
        style: (onDelete && index === actions.length - 1 ? 'destructive' : 'default') as 'destructive' | 'default',
      }));
      alertOptions.push({ text: 'Cancel', onPress: () => {}, style: 'default' });
      Alert.alert('Options', undefined, alertOptions);
    }
  };

  const handleShare = async () => {
    const photoUrl = await getPhotoUrl(currentPhotoKey);
    if (!photoUrl) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
        return;
      }

      // Download the photo to a temporary file
      const fileUri = FileSystem.cacheDirectory + `share_photo_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(photoUrl, fileUri);

      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Photo',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share photo');
    }
  };

  // Helper to get photo URL - we'll store URLs as they're loaded
  const photoUrlsRef = useRef<Map<string, string>>(new Map());

  const getPhotoUrl = async (key: string): Promise<string | null> => {
    return photoUrlsRef.current.get(key) || null;
  };

  const onPhotoUrlLoaded = (key: string, url: string) => {
    photoUrlsRef.current.set(key, url);
  };

  return (
    <RNModal visible={true} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {/* Image Section - 60% */}
        <View style={styles.imageSection}>
          {/* Photo Slider */}
          <FlatList
            ref={flatListRef}
            data={photoKeys}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={handleScroll}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <GalleryImage
                photoKey={item}
                width={SCREEN_WIDTH}
                height={IMAGE_HEIGHT}
                onUrlLoaded={(url) => onPhotoUrlLoaded(item, url)}
              />
            )}
          />

          {/* Gradient fade at bottom */}
          <FadeGradient />

          {/* Header overlay - absolute positioned */}
          <View style={[styles.headerOverlay, { paddingTop: insets.top + spacing[2] }]}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Icon name="close" size="md" color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.counter}>
              {currentIndex + 1} / {photoKeys.length}
            </Text>
            <TouchableOpacity onPress={handleOptionsPress} style={styles.headerButton}>
              <Icon name="more_horiz" size="md" color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.dateLabel}>BAKED ON {formatBakeDate(date)}</Text>
        </View>

        {/* Bottom Buttons */}
        <View style={[styles.bottomButtonsRow, { paddingBottom: insets.bottom + spacing[4] }]}>
          <TouchableOpacity style={styles.saveExitButton} onPress={onClose}>
            <Icon name="save" color={colors.primary} size="md" />
            <Text style={styles.saveExitButtonText}>Save & Exit</Text>
          </TouchableOpacity>
          {onRebake && (
            <TouchableOpacity style={styles.rebakeButton} onPress={onRebake}>
              <Icon name="replay" color={colors.white} size="md" />
              <Text style={styles.rebakeButtonText}>Rebake</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </RNModal>
  );
}

function GalleryImage({
  photoKey,
  width,
  height,
  onUrlLoaded,
}: {
  photoKey: string;
  width: number;
  height: number;
  onUrlLoaded?: (url: string) => void;
}) {
  const { data: url, isLoading } = usePhotoUrl(photoKey);

  React.useEffect(() => {
    if (url && onUrlLoaded) {
      onUrlLoaded(url);
    }
  }, [url, onUrlLoaded]);

  if (isLoading || !url) {
    return (
      <View style={[styles.galleryImageContainer, { width, height }]}>
        <Icon name="image" size="xl" color={colors.dustyMauve} />
      </View>
    );
  }

  return (
    <View style={[styles.galleryImageContainer, { width, height }]}>
      <Image source={{ uri: url }} style={styles.galleryImage} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  imageSection: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  contentSection: {
    paddingHorizontal: spacing[6],
    marginTop: -30,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.text,
  },
  dateLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.primary,
    letterSpacing: 1.4,
    marginTop: spacing[2],
  },
  galleryImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  bottomButtonsRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.white,
  },
  saveExitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  saveExitButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.primary,
  },
  rebakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
  },
  rebakeButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.white,
  },
});
