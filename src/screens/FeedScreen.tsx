import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { FeedList } from '../components/feed/FeedList';
import { usePosts } from '../hooks/usePosts';
import { COLORS } from '../utils/constants';

export const FeedScreen: React.FC = () => {
  const { posts, loading, refreshing, refresh, loadMore, toggleLike } = usePosts();

  return (
    <SafeAreaView style={styles.container}>
      <FeedList
        posts={posts}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        onLoadMore={loadMore}
        onPostPress={(post) => {
          console.log('Navigate to post:', post.id);
        }}
        onLike={toggleLike}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
