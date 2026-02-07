import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Media, MediaType } from '../../types';
import { MEDIA_CONFIG, COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../utils/constants';

interface MediaUploaderProps {
  media: Media[];
  onMediaChange: (media: Media[]) => void;
  maxCount?: number;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  media,
  onMediaChange,
  maxCount = MEDIA_CONFIG.maxMediaCount,
}) => {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要權限', '需要訪問您的相冊才能上傳照片');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (media.length >= maxCount) {
      Alert.alert('已達上限', `最多只能上傳 ${maxCount} 個媒體文件`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: MEDIA_CONFIG.imageQuality,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mediaItem: Media = {
          id: Date.now().toString(),
          type: asset.type === 'video' ? MediaType.VIDEO : MediaType.IMAGE,
          uri: asset.uri,
          duration: asset.duration ?? undefined,
        };

        onMediaChange([...media, mediaItem]);
      }
    } catch (error) {
      Alert.alert('錯誤', '上傳媒體失敗');
      console.error(error);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要權限', '需要訪問您的相機才能拍照');
      return;
    }

    if (media.length >= maxCount) {
      Alert.alert('已達上限', `最多只能上傳 ${maxCount} 個媒體文件`);
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: MEDIA_CONFIG.imageQuality,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newMedia: Media = {
          id: Date.now().toString(),
          type: MediaType.IMAGE,
          uri: asset.uri,
        };

        onMediaChange([...media, newMedia]);
      }
    } catch (error) {
      Alert.alert('錯誤', '拍照失敗');
      console.error(error);
    }
  };

  const removeMedia = (id: string) => {
    onMediaChange(media.filter(m => m.id !== id));
  };

  return (
    <View style={styles.container}>
      {media.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaList}>
          {media.map((item) => (
            <View key={item.id} style={styles.mediaItem}>
              {item.type === MediaType.IMAGE ? (
                <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
              ) : (
                <Video
                  source={{ uri: item.uri }}
                  style={styles.mediaThumbnail}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                />
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeMedia(item.id)}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
              {item.type === MediaType.VIDEO && (
                <View style={styles.videoBadge}>
                  <Text style={styles.videoBadgeText}>▶</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
          <Text style={styles.actionIcon}>🖼️</Text>
          <Text style={styles.actionText}>相冊</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionText}>拍照</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  mediaList: {
    marginBottom: SPACING.md,
  },
  mediaItem: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  mediaThumbnail: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  videoBadge: {
    position: 'absolute',
    bottom: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: FONT_SIZE.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.secondaryBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
});
