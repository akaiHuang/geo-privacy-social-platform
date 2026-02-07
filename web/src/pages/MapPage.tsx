import React, { memo } from 'react';
import { Post } from '../types';

interface MapPageProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

export const MapPage: React.FC<MapPageProps> = memo(({ posts, onPostClick }) => {
  return (
    <div className="map-container">
      {/* 地圖內容 */}
    </div>
  );
});

MapPage.displayName = 'MapPage';
