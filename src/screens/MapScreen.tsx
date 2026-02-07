import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { MapViewComponent } from '../components/map/MapView';
import { useLocation } from '../hooks/useLocation';
import { useNearbyPosts } from '../hooks/usePosts';
import { COLORS } from '../utils/constants';

export const MapScreen: React.FC = () => {
  const { location } = useLocation();
  const { posts } = useNearbyPosts(location?.latitude, location?.longitude);

  return (
    <SafeAreaView style={styles.container}>
      <MapViewComponent
        posts={posts}
        currentLocation={location}
        onMarkerPress={(post) => {
          // 導航到貼文詳情
          console.log('Post pressed:', post.id);
        }}
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
