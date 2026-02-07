import { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import firebaseService from '../services/firebase';
import { ImageCropModal } from './ImageCropModal';
import './EditProfileModal.css';

// 預設標籤選項
const BADGE_OPTIONS = [
  { value: '', label: '無標籤' },
  { value: '探索者', label: '🧭 探索者' },
  { value: '攝影師', label: '📸 攝影師' },
  { value: '旅行家', label: '✈️ 旅行家' },
  { value: '美食家', label: '🍜 美食家' },
  { value: '創作者', label: '🎨 創作者' },
  { value: '運動達人', label: '⚽ 運動達人' },
  { value: '咖啡愛好者', label: '☕ 咖啡愛好者' },
  { value: '書蟲', label: '📚 書蟲' },
  { value: '音樂人', label: '🎵 音樂人' },
  { value: '科技宅', label: '💻 科技宅' },
];

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: Partial<User>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | ''>(user.gender || '');
  const [badge, setBadge] = useState(user.badge || '');
  const [website, setWebsite] = useState(user.website || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.avatar);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 圖片裁切相關狀態
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.displayName);
      setBio(user.bio || '');
      setBirthday(user.birthday || '');
      setGender(user.gender || '');
      setBadge(user.badge || '');
      setWebsite(user.website || '');
      setAvatarPreview(user.avatar);
      setAvatarFile(null);
      setError(null);
      setShowCropModal(false);
      setImageToCrop(null);
    }
  }, [isOpen, user]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 檢查檔案大小（限制 5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過 5MB');
        return;
      }

      // 檢查檔案類型
      if (!file.type.startsWith('image/')) {
        setError('請選擇圖片檔案');
        return;
      }

      setError(null);

      // 讀取圖片並顯示裁切彈窗
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    // 將 Blob 轉換為 File
    const croppedFile = new File([croppedImageBlob], 'avatar.jpg', {
      type: 'image/jpeg',
    });
    
    setAvatarFile(croppedFile);

    // 創建預覽 URL
    const previewUrl = URL.createObjectURL(croppedImageBlob);
    setAvatarPreview(previewUrl);
    
    setShowCropModal(false);
    setImageToCrop(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const updates: {
        displayName?: string;
        bio?: string;
        avatar?: string;
        birthday?: string;
        gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
        badge?: string;
        website?: string;
      } = {};

      // 驗證顯示名稱
      if (displayName.trim().length === 0) {
        setError('顯示名稱不能為空');
        setIsLoading(false);
        return;
      }

      if (displayName.trim().length > 50) {
        setError('顯示名稱不能超過 50 字');
        setIsLoading(false);
        return;
      }

      // 驗證簡介長度
      if (bio.length > 150) {
        setError('簡介不能超過 150 字');
        setIsLoading(false);
        return;
      }

      // 驗證網站 URL
      if (website && website.trim()) {
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        if (!urlPattern.test(website.trim())) {
          setError('請輸入有效的網站連結');
          setIsLoading(false);
          return;
        }
      }

      // 如果有新頭像，先上傳
      if (avatarFile) {
        const avatarUrl = await firebaseService.uploadAvatar(avatarFile);
        updates.avatar = avatarUrl;
      }

      // 只在有變更時才更新
      if (displayName !== user.displayName) {
        updates.displayName = displayName.trim();
      }

      if (bio !== (user.bio || '')) {
        updates.bio = bio.trim();
      }

      if (birthday !== (user.birthday || '')) {
        updates.birthday = birthday;
      }

      if (gender !== (user.gender || '')) {
        updates.gender = gender as 'male' | 'female' | 'other' | 'prefer_not_to_say';
      }

      if (badge !== (user.badge || '')) {
        updates.badge = badge;
      }

      if (website !== (user.website || '')) {
        updates.website = website.trim();
      }

      // 如果有任何更新
      if (Object.keys(updates).length > 0) {
        const result = await firebaseService.updateUserProfile(updates);
        
        if (result.success) {
          onSuccess(updates);
          onClose();
        } else {
          setError(result.error || '更新失敗');
        }
      } else {
        // 沒有變更，直接關閉
        onClose();
      }
    } catch (err: any) {
      console.error('更新個人資料失敗:', err);
      setError(err.message || '更新失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-profile-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>編輯個人資料</h2>
          <button className="close-button" onClick={onClose} disabled={isLoading}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {/* 頭像區域 */}
          <div className="avatar-section">
            <div className="avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="頭像預覽" />
              ) : (
                <div className="avatar-placeholder">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="avatar-actions">
              <button
                type="button"
                className="change-avatar-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                更換頭像
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  className="remove-avatar-button"
                  onClick={() => {
                    setAvatarPreview(undefined);
                    setAvatarFile(null);
                  }}
                  disabled={isLoading}
                >
                  移除
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* 顯示名稱 */}
          <div className="form-group">
            <label htmlFor="displayName">顯示名稱</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              disabled={isLoading}
              required
            />
            <span className="char-count">{displayName.length}/50</span>
          </div>

          {/* 使用者名稱（不可編輯） */}
          <div className="form-group">
            <label htmlFor="username">使用者名稱</label>
            <input
              id="username"
              type="text"
              value={user.username}
              disabled
              className="disabled-input"
            />
            <span className="help-text">使用者名稱無法更改</span>
          </div>

          {/* 個人簡介 */}
          <div className="form-group">
            <label htmlFor="bio">個人簡介</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
              rows={4}
              placeholder="介紹一下自己..."
              disabled={isLoading}
            />
            <span className="char-count">{bio.length}/150</span>
          </div>

          {/* 生日 */}
          <div className="form-group">
            <label htmlFor="birthday">生日</label>
            <input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              disabled={isLoading}
              max={new Date().toISOString().split('T')[0]}
            />
            <span className="help-text">生日僅自己可見</span>
          </div>

          {/* 性別 */}
          <div className="form-group">
            <label htmlFor="gender">性別</label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              disabled={isLoading}
            >
              <option value="">選擇性別</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
              <option value="other">其他</option>
              <option value="prefer_not_to_say">不透露</option>
            </select>
            <span className="help-text">性別僅自己可見</span>
          </div>

          {/* 成就標籤 */}
          <div className="form-group">
            <label htmlFor="badge">成就標籤</label>
            <select
              id="badge"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              disabled={isLoading}
            >
              {BADGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="help-text">標籤會顯示在你的名字旁邊</span>
          </div>

          {/* 個人網站 */}
          <div className="form-group">
            <label htmlFor="website">個人網站</label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://your-website.com"
              disabled={isLoading}
            />
            <span className="help-text">分享你的個人網站或社交媒體</span>
          </div>

          {/* 按鈕 */}
          <div className="modal-footer">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>

      {/* 圖片裁切彈窗 */}
      {imageToCrop && (
        <ImageCropModal
          image={imageToCrop}
          isOpen={showCropModal}
          onClose={() => {
            setShowCropModal(false);
            setImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
