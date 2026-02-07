import React from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import { Post } from '../../types';
import { PostCard } from '../post/PostCard';
import { COLORS, SPACING, FONT_SIZE } from '../../utils/constants';

interface FeedListProps {
  posts: Post[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onPostPress?: (post: Post) => void;
  onLike?: (postId: string) => void;
}

export const FeedList: React.FC<FeedListProps> = ({
  posts,
  loading = false,
  refreshing = false,
  onRefresh,
  onLoadMore,
  onPostPress,
  onLike,
}) => {
  if (posts.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>📭</Text>
        <Text style={styles.emptyTitle}>還沒有貼文</Text>
        <Text style={styles.emptySubtitle}>下拉刷新或開始發文</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => onPostPress && onPostPress(item)}
          onLike={() => onLike && onLike(item.id)}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.secondaryText,
  },
});
