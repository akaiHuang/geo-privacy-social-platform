import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button } from '../common/Button';
import { useLocation } from '../../hooks/useLocation';
import { Location } from '../../types';
import { COLORS, SPACING, FONT_SIZE } from '../../utils/constants';

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
}) => {
  const { getCurrentLocation, loading } = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(
    initialLocation
  );

  useEffect(() => {
    if (!initialLocation) {
      loadCurrentLocation();
    }
  }, []);

  const loadCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setSelectedLocation(location);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>獲取位置中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>選擇位置</Text>
      <Text style={styles.subtitle}>點擊地圖選擇發文位置</Text>
      
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={
          selectedLocation
            ? {
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined
        }
        onPress={handleMapPress}
      >
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            pinColor="red"
          />
        )}
      </MapView>

      <View style={styles.actions}>
        <Button
          title="使用當前位置"
          onPress={loadCurrentLocation}
          variant="outline"
          size="small"
        />
        <Button
          title="確認"
          onPress={handleConfirm}
          disabled={!selectedLocation}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.secondaryText,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.secondaryText,
    marginBottom: SPACING.md,
  },
  map: {
    flex: 1,
    marginVertical: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});
