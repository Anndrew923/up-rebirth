import { useEffect, useState, useRef } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useUIStore } from '../../stores/uiStore';
import { t } from '../../i18n';
import { auth, storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
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
export const AvatarSection = ({ isGuest = false, variant = 'full', className = '' }) => {
  const userProfile = useUserStore((state) => state.userProfile);
  const stats = useUserStore((state) => state.stats);
  const updateUserStats = useUserStore((state) => state.updateUserStats);
  const setLoadingMessage = useUIStore((state) => state.setLoadingMessage);
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  
  const [isUploading, setIsUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_AVATAR_MB = 20;
  const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024;

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

      const avatarVersion = Date.now();

      // Upload to Storage
      const avatarRef = ref(storage, `users/${userId}/avatar.jpg`);

      const metadata = {
        contentType: 'image/jpeg',
        // Firebase Storage may cache aggressively; we bust cache by versioned URL query.
        customMetadata: {
          'uploaded-by': userId,
          'upload-time': new Date().toISOString(),
        },
      };

      await uploadBytes(avatarRef, blob, metadata);
      const url = await getDownloadURL(avatarRef);

      // Best-effort: sync Firebase Auth profile photoURL for cross-device persistence.
      // Non-blocking: rules/network issues should not break the upload flow.
      try {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { photoURL: url });
        }
      } catch {
        // Intentionally silent
      }

      // Update Firestore immediately (no debounce for avatar)
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        avatarUrl: url,
        photoURL: url,
        avatarVersion,
        updatedAt: Timestamp.now(),
      });

      // Update userStore
      await updateUserStats({ avatarUrl: url, photoURL: url, avatarVersion });

      // Update local profile state
      setUserProfile({
        ...userProfile,
        photoURL: url,
        avatarUrl: url,
        avatarVersion,
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

    // Validate file size (max 20MB)
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(`圖片大小不能超過 ${MAX_AVATAR_MB}MB`);
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
  
  // IMPORTANT: userProfile.photoURL comes from Firebase Auth and may be stale on some devices.
  // stats.avatarUrl is loaded from Firestore and is the canonical source after login.
  const rawAvatarUrl = isGuest
    ? '/guest-avatar.svg'
    : (stats?.avatarUrl || userProfile?.photoURL || userProfile?.avatarUrl);
  const versionForCache = userProfile?.avatarVersion ?? stats?.avatarVersion;

  const withCacheBuster = (u, v) => {
    if (!u || !v) return u;
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      const parsed = new URL(u, base);
      parsed.searchParams.set('v', String(v));
      return parsed.toString();
    } catch {
      const s = String(u);
      const join = s.includes('?') ? '&' : '?';
      return `${s}${join}v=${encodeURIComponent(String(v))}`;
    }
  };

  const avatarUrl = withCacheBuster(rawAvatarUrl, versionForCache);

  useEffect(() => {
    // Reset failure state when URL changes
    setImgFailed(false);
    setAvatarError(null);
  }, [avatarUrl]);

  const isHud = variant === 'hud';

  const rootClassName = isHud
    ? `${styles.hudRoot} ${className}`.trim()
    : `${styles.avatarSection} ${className}`.trim();

  return (
    <div className={rootClassName}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label={t('profile.form.changePhoto', '更換大頭照')}
      />
      
      <div 
        className={isHud ? styles.hudContainer : styles.avatarContainer}
        onClick={handleAvatarClick}
        role={!isGuest && auth.currentUser ? "button" : undefined}
        tabIndex={!isGuest && auth.currentUser ? 0 : undefined}
        aria-label={!isGuest && auth.currentUser ? "點擊上傳頭像" : undefined}
        style={{ cursor: !isGuest && auth.currentUser ? 'pointer' : 'default' }}
      >
        {avatarUrl && !imgFailed ? (
          <img 
            src={avatarUrl} 
            alt={displayName}
            className={isHud ? styles.hudImage : styles.avatar}
            loading={variant === 'hud' ? 'eager' : 'lazy'}
            key={avatarUrl}
            onError={(e) => {
              // Surface as visible error (especially important for HUD variant where errors were hidden)
              const msg = '頭像載入失敗（可能是快取或權限問題）';
              console.warn(msg, e);
              setAvatarError(msg);
              setImgFailed(true);
            }}
          />
        ) : (
          <div className={isHud ? styles.hudPlaceholder : styles.avatarPlaceholder}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        {isUploading && (
          <div className={styles.uploadOverlay}>
            <div className={styles.spinner}></div>
          </div>
        )}
        {!isGuest && auth.currentUser && (
          <div
            className={isHud ? styles.hudBadge : styles.uploadHint}
            role="button"
            tabIndex={0}
            aria-label={t('profile.form.changePhoto', '更換大頭照')}
            title={t('profile.form.changePhoto', '更換大頭照')}
            onClick={(e) => {
              e.stopPropagation();
              handleAvatarClick();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleAvatarClick();
              }
            }}
          >
            <span className={isHud ? styles.hudBadgeIcon : styles.uploadIcon}>📷</span>
          </div>
        )}
      </div>
      
      {avatarError && (
        <div className={styles.errorMessage} role="alert">
          {avatarError}
        </div>
      )}
      
      {variant !== 'hud' && (
        <>
          <h2 className={styles.userName}>{displayName}</h2>
          {userProfile?.emailVerified && (
            <span className={styles.verifiedBadge} title="榮譽認證">
              🏅 已認證
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default AvatarSection;
