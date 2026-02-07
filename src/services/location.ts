import * as ExpoLocation from 'expo-location';
import { Location } from '../types';
import { addLocationRandomOffset } from '../utils/locationRandomizer';

class LocationService {
  /**
   * 請求位置權限
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('請求位置權限失敗:', error);
      return false;
    }
  }

  /**
   * 獲取當前位置
   */
  async getCurrentLocation(): Promise<Location | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('沒有位置權限');
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('獲取當前位置失敗:', error);
      return null;
    }
  }

  /**
   * 獲取帶隨機誤差的當前位置（用於貼文）
   */
  async getCurrentLocationWithOffset(): Promise<Location | null> {
    const location = await this.getCurrentLocation();
    if (!location) return null;

    return addLocationRandomOffset(location);
  }

  /**
   * 根據坐標獲取地址
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const addresses = await ExpoLocation.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const addr = addresses[0];
        const parts = [
          addr.city || addr.subregion,
          addr.district,
          addr.street,
        ].filter(Boolean);
        
        return parts.join(', ') || '未知位置';
      }

      return '未知位置';
    } catch (error) {
      console.error('反向地理編碼失敗:', error);
      return null;
    }
  }

  /**
   * 監聽位置變化
   */
  async watchPosition(
    callback: (location: Location) => void
  ): Promise<{ remove: () => void } | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('沒有位置權限');
      }

      const subscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.Balanced,
          distanceInterval: 100, // 每移動100米更新一次
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error('監聽位置失敗:', error);
      return null;
    }
  }
}

export default new LocationService();
