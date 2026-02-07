import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PostEditor } from '../components/post/PostEditor';
import { MediaUploader } from '../components/post/MediaUploader';
import { LocationPicker } from '../components/map/LocationPicker';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { usePosts } from '../hooks/usePosts';
import { Media, Location } from '../types';
import { COLORS, SPACING } from '../utils/constants';
import { addLocationRandomOffset } from '../utils/locationRandomizer';

export const PostCreateScreen: React.FC = () => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<Media[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { createPost } = usePosts();

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) {
      Alert.alert('提示', '請輸入內容或上傳媒體');
      return;
    }

    if (!location) {
      Alert.alert('提示', '請選擇位置');
      return;
    }

    setSubmitting(true);

    try {
      // 添加隨機誤差到位置
      const randomizedLocation = addLocationRandomOffset(location);

      const result = await createPost({
        content: content.trim(),
        media,
        location: randomizedLocation,
      });

      if (result) {
        Alert.alert('成功', '發布成功！', [
          {
            text: '確定',
            onPress: () => {
              // 重置表單並返回
              setContent('');
              setMedia([]);
              setLocation(null);
            },
          },
        ]);
      } else {
        Alert.alert('錯誤', '發布失敗，請重試');
      }
    } catch (error) {
      Alert.alert('錯誤', '發布失敗，請重試');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <PostEditor
            initialContent={content}
            onContentChange={setContent}
          />

          <MediaUploader
            media={media}
            onMediaChange={setMedia}
          />

          <Button
            title={location ? '📍 已選擇位置' : '📍 選擇位置'}
            onPress={() => setShowLocationPicker(true)}
            variant="outline"
          />

          <View style={styles.submitContainer}>
            <Button
              title="發布"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || !location}
            />
          </View>
        </ScrollView>

        <Modal
          visible={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          title="選擇位置"
        >
          <LocationPicker
            initialLocation={location || undefined}
            onLocationSelect={(loc) => {
              setLocation(loc);
              setShowLocationPicker(false);
            }}
          />
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  submitContainer: {
    marginTop: SPACING.lg,
  },
});
