import { useState, useEffect } from 'react';
import LocationService from '../services/location';
import { Location } from '../types';

/**
 * 使用位置的 Hook
 */
export const useLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  // 請求位置權限
  const requestPermission = async () => {
    try {
      const granted = await LocationService.requestPermissions();
      setHasPermission(granted);
      return granted;
    } catch (err) {
      setError('無法獲取位置權限');
      return false;
    }
  };

  // 獲取當前位置
  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const loc = await LocationService.getCurrentLocation();
      if (loc) {
        setLocation(loc);
      } else {
        setError('無法獲取當前位置');
      }
      return loc;
    } catch (err) {
      setError('獲取位置失敗');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 獲取帶隨機誤差的位置
  const getCurrentLocationWithOffset = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const loc = await LocationService.getCurrentLocationWithOffset();
      if (loc) {
        setLocation(loc);
      } else {
        setError('無法獲取當前位置');
      }
      return loc;
    } catch (err) {
      setError('獲取位置失敗');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 根據坐標獲取地址
  const getAddress = async (lat: number, lng: number) => {
    try {
      return await LocationService.reverseGeocode(lat, lng);
    } catch (err) {
      return null;
    }
  };

  return {
    location,
    loading,
    error,
    hasPermission,
    requestPermission,
    getCurrentLocation,
    getCurrentLocationWithOffset,
    getAddress,
  };
};
