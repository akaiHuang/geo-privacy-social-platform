import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Post, Location } from '../../types';
import { MAP_CONFIG } from '../../utils/constants';

interface MapViewComponentProps {
  posts: Post[];
  currentLocation?: Location | null;
  onMarkerPress?: (post: Post) => void;
  onMapPress?: (location: Location) => void;
}

export const MapViewComponent: React.FC<MapViewComponentProps> = ({
  posts,
  currentLocation,
  onMarkerPress,
  onMapPress,
}) => {
  const initialRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : {
        latitude: 25.033, // 台北預設位置
        longitude: 121.5654,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      onPress={(e) => {
        if (onMapPress) {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onMapPress({ latitude, longitude });
        }
      }}
    >
      {/* 當前位置標記 */}
      {currentLocation && (
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          pinColor="blue"
          title="我的位置"
        />
      )}

      {/* 貼文標記 */}
      {posts.map((post) => (
        <Marker
          key={post.id}
          coordinate={{
            latitude: post.location.latitude,
            longitude: post.location.longitude,
          }}
          onPress={() => onMarkerPress && onMarkerPress(post)}
          title={post.user.displayName}
          description={post.content.substring(0, 50)}
        />
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
