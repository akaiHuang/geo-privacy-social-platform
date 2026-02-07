import React from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Post } from '../../types';
import { PostCard } from '../post/PostCard';
import { COLORS, SPACING, FONT_SIZE } from '../../utils/constants';

interface ProfileWallProps {
  posts: Post[];
  loading?: boolean;
  onPostPress?: (post: Post) => void;
  onRefresh?: () => void;
  onLoadMore?: () => void;
}

export const ProfileWall: React.FC<ProfileWallProps> = ({
  posts,
  loading = false,
  onPostPress,
  onRefresh,
  onLoadMore,
}) => {
  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>還沒有貼文</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PostCard post={item} onPress={() => onPostPress && onPostPress(item)} />
      )}
      onRefresh={onRefresh}
      refreshing={loading}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.secondaryText,
  },
});
