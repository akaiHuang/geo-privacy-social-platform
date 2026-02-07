import { Location } from '../types';

/**
 * 為位置添加隨機誤差（2公里內）
 * 保護用戶隱私，避免暴露真實位置
 */
export const addLocationRandomOffset = (location: Location): Location => {
  // 2公里 = 約0.018度（緯度）
  const maxOffset = 0.018; // 約2公里
  
  // 生成隨機偏移量
  const randomLat = (Math.random() - 0.5) * 2 * maxOffset;
  const randomLng = (Math.random() - 0.5) * 2 * maxOffset;
  
  return {
    latitude: location.latitude + randomLat,
    longitude: location.longitude + randomLng,
    address: location.address,
  };
};

/**
 * 計算兩個位置之間的距離（公里）
 * 使用 Haversine 公式
 */
export const calculateDistance = (
  loc1: Location,
  loc2: Location
): number => {
  const R = 6371; // 地球半徑（公里）
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.latitude)) *
      Math.cos(toRad(loc2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

/**
 * 格式化距離顯示
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};
