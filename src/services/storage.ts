import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../config/firebase';

class StorageService {
  /**
   * 上傳文件到 Firebase Storage
   */
  async uploadFile(
    file: Blob | Uint8Array | ArrayBuffer,
    path: string,
    contentType?: string
  ): Promise<string> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('用戶未登入');

      const storageRef = ref(storage, `${userId}/${path}`);
      const metadata = contentType ? { contentType } : undefined;
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('上傳文件失敗:', error);
      throw error;
    }
  }

  /**
   * 上傳圖片
   */
  async uploadImage(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `images/${Date.now()}.jpg`;
      
      return await this.uploadFile(blob, filename, 'image/jpeg');
    } catch (error) {
      console.error('上傳圖片失敗:', error);
      throw error;
    }
  }

  /**
   * 上傳影片
   */
  async uploadVideo(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `videos/${Date.now()}.mp4`;
      
      return await this.uploadFile(blob, filename, 'video/mp4');
    } catch (error) {
      console.error('上傳影片失敗:', error);
      throw error;
    }
  }

  /**
   * 刪除文件
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('刪除文件失敗:', error);
      throw error;
    }
  }

  // ===== 本地存儲方法 =====
  /**
   * 保存數據
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('保存數據失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取數據
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('獲取數據失敗:', error);
      return null;
    }
  }

  /**
   * 刪除數據
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('刪除數據失敗:', error);
      throw error;
    }
  }

  /**
   * 清空所有數據
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('清空數據失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取所有鍵
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch (error) {
      console.error('獲取所有鍵失敗:', error);
      return [];
    }
  }

  // 特定業務邏輯的存儲方法
  
  /**
   * 保存認證令牌
   */
  async saveAuthToken(token: string): Promise<void> {
    await this.setItem('authToken', token);
  }

  /**
   * 獲取認證令牌
   */
  async getAuthToken(): Promise<string | null> {
    return await this.getItem<string>('authToken');
  }

  /**
   * 刪除認證令牌（登出）
   */
  async removeAuthToken(): Promise<void> {
    await this.removeItem('authToken');
  }

  /**
   * 保存用戶信息
   */
  async saveUserInfo(user: any): Promise<void> {
    await this.setItem('userInfo', user);
  }

  /**
   * 獲取用戶信息
   */
  async getUserInfo(): Promise<any> {
    return await this.getItem('userInfo');
  }

  /**
   * 保存草稿
   */
  async saveDraft(draft: any): Promise<void> {
    await this.setItem('postDraft', draft);
  }

  /**
   * 獲取草稿
   */
  async getDraft(): Promise<any> {
    return await this.getItem('postDraft');
  }

  /**
   * 清除草稿
   */
  async clearDraft(): Promise<void> {
    await this.removeItem('postDraft');
  }
}

export default new StorageService();
