import React, { memo } from 'react';
import { Post, User } from '../types';

interface FeedPageProps {
  posts: Post[];
  user: User;
  onLike: (postId: string) => void;
  onFavorite: (postId: string) => void;
  onComment: (postId: string) => void;
  onPostClick: (post: Post, index: number) => void;
}

export const FeedPage: React.FC<FeedPageProps> = memo(({
  posts,
  user,
  onLike,
  onFavorite,
  onComment,
  onPostClick,
}) => {
  return (
    <div className="feed-container">
      <div className="feed-content">
        {posts.map((post, index) => (
          <div key={post.id} className="post-card">
            {/* 貼文卡片內容 */}
          </div>
        ))}
      </div>
    </div>
  );
});

FeedPage.displayName = 'FeedPage';
