import { useState, useRef } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useUIStore } from '../../stores/uiStore';
import { auth, storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import styles from '../../styles/modules/AvatarSection.module.css';

/**
 * Avatar Section Component
 * Handles user avatar display and upload
 * Part of the Rebirth Manifesto: Component Slimming
 * 
 * Ported from legacy UserInfo AvatarSection with Firebase Storage integration
 */
export const AvatarSection = ({ isGuest = false }) => {
  const userProfile = useUserStore((state) => state.userProfile);
  const updateUserStats = useUserStore((state) => state.updateUserStats);
  const setLoadingMessage = useUIStore((state) => state.setLoadingMessage);
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  
  const [isUploading, setIsUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null);

  // Compress image before upload
  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('圖片壓縮失敗'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle avatar upload
  const handleAvatarChange = async (blob) => {
    setAvatarError(null);
    setIsUploading(true);
    setLoadingMessage('正在上傳頭像...');

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('未登入，無法上傳頭像');
      }

      // Upload to Storage
      const avatarRef = ref(storage, `avatars/${userId}/avatar.jpg`);
      const metadata = {
        contentType: 'image/jpeg',
        customMetadata: {
          'uploaded-by': userId,
          'upload-time': new Date().toISOString(),
        },
      };

      await uploadBytes(avatarRef, blob, metadata);
      const url = await getDownloadURL(avatarRef);

      // Update Firestore immediately (no debounce for avatar)
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        avatarUrl: url,
        updatedAt: Timestamp.now(),
      });

      // Update userStore
      await updateUserStats({ avatarUrl: url, photoURL: url });

      // Update local profile state
      setUserProfile({
        ...userProfile,
        photoURL: url,
        avatarUrl: url
      });

      setLoadingMessage(null);
      
      // Show success (could use UI store modal here)
      console.log('✅ 頭像上傳成功');
    } catch (err) {
      console.error('頭像上傳失敗:', err);
      setAvatarError('頭像上傳失敗: ' + err.message);
      setLoadingMessage(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAvatarError('請選擇圖片文件');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('圖片大小不能超過 5MB');
      return;
    }

    try {
      // Compress image
      const compressedBlob = await compressImage(file);
      await handleAvatarChange(compressedBlob);
    } catch (err) {
      console.error('圖片處理失敗:', err);
      setAvatarError('圖片處理失敗: ' + err.message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarClick = () => {
    if (isGuest || !auth.currentUser) {
      return;
    }
    fileInputRef.current?.click();
  };

  const displayName = userProfile?.displayName || 
                     userProfile?.nickname || 
                     userProfile?.email?.split('@')[0] || 
                     '未命名用戶';
  
  const avatarUrl = isGuest ? '/guest-avatar.svg' : (userProfile?.photoURL || userProfile?.avatarUrl);

  return (
    <div className={styles.avatarSection}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="上傳頭像"
      />
      
      <div 
        className={styles.avatarContainer}
        onClick={handleAvatarClick}
        role={!isGuest && auth.currentUser ? "button" : undefined}
        tabIndex={!isGuest && auth.currentUser ? 0 : undefined}
        aria-label={!isGuest && auth.currentUser ? "點擊上傳頭像" : undefined}
        style={{ cursor: !isGuest && auth.currentUser ? 'pointer' : 'default' }}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={displayName}
            className={styles.avatar}
            loading="lazy"
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        {isUploading && (
          <div className={styles.uploadOverlay}>
            <div className={styles.spinner}></div>
          </div>
        )}
        {!isGuest && auth.currentUser && (
          <div className={styles.uploadHint}>
            <span className={styles.uploadIcon}>📷</span>
          </div>
        )}
      </div>
      
      {avatarError && (
        <div className={styles.errorMessage} role="alert">
          {avatarError}
        </div>
      )}
      
      <h2 className={styles.userName}>{displayName}</h2>
      
      {userProfile?.emailVerified && (
        <span className={styles.verifiedBadge} title="榮譽認證">
          🏅 已認證
        </span>
      )}
    </div>
  );
};

export default AvatarSection;
