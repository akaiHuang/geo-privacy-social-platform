import React, { useState } from 'react';
import { TimeSlider } from './TimeSlider';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post } from '../../../src/types';

interface TimeTravelMapProps {
  onPostsFiltered: (posts: Post[]) => void;
  onStatsUpdate?: (stats: { postCount: number; timeSlot: string }) => void;
}

export const TimeTravelMap: React.FC<TimeTravelMapProps> = ({ 
  onPostsFiltered,
  onStatsUpdate 
}) => {
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 根據時間槽加載貼文
  const loadPostsByTimeSlot = async (timeSlot: string) => {
    setLoading(true);
    try {
      const postsRef = collection(db, 'posts');
      
      // 查詢該時間槽的貼文
      const q = query(
        postsRef,
        where('timeSlot', '==', timeSlot)
      );

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          expiresAt: data.expiresAt?.toDate?.() || new Date(),
        } as Post;
      });

      // 過濾掉已過期的貼文（如果需要）
      const validPosts = posts.filter(post => !post.isExpired);

      onPostsFiltered(validPosts);

      // 更新統計信息
      if (onStatsUpdate) {
        onStatsUpdate({
          postCount: validPosts.length,
          timeSlot: timeSlot
        });
      }

    } catch (error) {
      console.error('加載時間槽貼文失敗:', error);
      onPostsFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (timeSlot: string) => {
    loadPostsByTimeSlot(timeSlot);
  };

  const handlePlayingChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  return (
    <div className="time-travel-map">
      {/* 載入指示器 */}
      {loading && (
        <div className="time-travel-loading">
          <div className="loading-spinner"></div>
          <span>載入中...</span>
        </div>
      )}

      {/* 播放中指示器 */}
      {isPlaying && (
        <div className="playback-indicator">
          <div className="playback-pulse"></div>
          <span>時光回溯中...</span>
        </div>
      )}

      {/* 時間滑桿控制器 */}
      <TimeSlider 
        onTimeChange={handleTimeChange}
        onPlayingChange={handlePlayingChange}
        maxHistoryHours={24}
      />
    </div>
  );
};
