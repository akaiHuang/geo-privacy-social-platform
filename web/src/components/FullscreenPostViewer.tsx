import { useState, useEffect } from 'react';
import { Post } from '../types';
import FirebaseService from '../services/firebase';
import './FullscreenPostViewer.css';

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return '剛剛';
  if (diffInMinutes < 60) return `${diffInMinutes} 分鐘前`;
  if (diffInHours < 24) return `${diffInHours} 小時前`;
  if (diffInDays < 7) return `${diffInDays} 天前`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} 週前`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} 個月前`;
  return `${Math.floor(diffInDays / 365)} 年前`;
}

export interface FullscreenPostViewerProps {
  posts: Post[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onLike: (postId: string) => void;
  onFavorite: (postId: string) => void;
  onCommentAdded: (postId: string) => void;
}

export function FullscreenPostViewer({
  posts,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onLike,
  onFavorite,
  onCommentAdded
}: FullscreenPostViewerProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | null>(null);
  const [prevIndex, setPrevIndex] = useState(currentIndex);

  // 監控 currentIndex 變化來設定動畫方向
  useEffect(() => {
    if (prevIndex !== currentIndex) {
      if (currentIndex > prevIndex) {
        setSlideDirection('up');
      } else if (currentIndex < prevIndex) {
        setSlideDirection('down');
      }
      setPrevIndex(currentIndex);
    }
  }, [currentIndex, prevIndex]);

  // 鍵盤事件處理
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComments) return; // 留言面板開啟時不處理
      
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < posts.length - 1) {
        e.preventDefault();
        onNavigate(currentIndex + 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, posts.length, showComments, onNavigate, onClose]);

  // 安全檢查
  if (!posts[currentIndex]) return null;
  
  const post = posts[currentIndex];

  const loadComments = async () => {
    const result = await FirebaseService.getComments(post.id);
    setComments(result);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await FirebaseService.addComment(post.id, commentText.trim());
    setCommentText('');
    await loadComments();
    onCommentAdded(post.id);
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    await FirebaseService.addComment(post.id, replyText.trim(), parentId);
    setReplyText('');
    setReplyingTo(null);
    await loadComments();
    onCommentAdded(post.id);
  };

  return (
    <div 
      className="fullscreen-post-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onWheel={(e) => {
        if (showComments) return;
        if (e.deltaY < 0 && currentIndex > 0) {
          onNavigate(currentIndex - 1);
        }
        if (e.deltaY > 0 && currentIndex < posts.length - 1) {
          onNavigate(currentIndex + 1);
        }
      }}
    >
      <button className="close-fullscreen-btn" onClick={onClose}>✕</button>

      <div 
        key={currentIndex}
        className={`fullscreen-post-container ${slideDirection ? `slide-${slideDirection}` : ''}`}
        onAnimationEnd={() => setSlideDirection(null)}
      >
        <div className="fullscreen-post-content">
          {/* 頭部 */}
          <div className="fullscreen-post-header">
            <div className="fullscreen-user-info">
              <div className="user-avatar">
                {post.user.avatar ? (
                  <img src={post.user.avatar} alt={post.user.displayName} />
                ) : (
                  <div className="avatar-placeholder">{post.user.displayName[0]}</div>
                )}
              </div>
              <div>
                <div className="user-name">{post.user.displayName}</div>
                <div className="user-username">@{post.user.username}</div>
              </div>
            </div>
            <div className="post-time">{getRelativeTime(new Date(post.createdAt))}</div>
          </div>

          {/* 圖片 */}
          {post.media[0] && (
            <div className="fullscreen-post-image">
              <img src={post.media[0].uri} alt="Post" />
            </div>
          )}

          {/* 內容 */}
          <div className="fullscreen-post-text">
            <p className={`post-content-text ${expanded[post.id] ? 'expanded' : ''}`}>
              {post.content}
            </p>
            {post.content.length > 100 && !expanded[post.id] && (
              <button 
                className="expand-text-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded({ ...expanded, [post.id]: true });
                }}
              >
                ... 閱讀更多
              </button>
            )}
            {expanded[post.id] && post.content.length > 100 && (
              <button 
                className="collapse-text-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded({ ...expanded, [post.id]: false });
                }}
              >
                收起
              </button>
            )}
            <div className="post-location">
              📍 {post.location.latitude.toFixed(4)}, {post.location.longitude.toFixed(4)}
            </div>
          </div>

          {/* 按鈕 */}
          <div className="fullscreen-post-actions">
            <button
              className={`action-btn ${post.isLiked ? 'liked' : ''}`}
              onClick={() => onLike(post.id)}
            >
              {post.isLiked ? '❤️' : '🤍'} {post.likes}
            </button>
            <button
              className="action-btn"
              onClick={async () => {
                setShowComments(true);
                await loadComments();
              }}
            >
              💬 {post.comments}
            </button>
            <button
              className={`action-btn ${post.isFavorited ? 'favorited' : ''}`}
              onClick={() => onFavorite(post.id)}
            >
              <span className="star-icon">{post.isFavorited ? '⭐' : '☆'}</span>
            </button>
          </div>

          {/* 留言面板 */}
          {showComments && (
            <div className="fullscreen-comments-panel">
              <div className="comments-panel-header">
                <h3>💬 留言</h3>
                <button className="close-comments-btn" onClick={() => setShowComments(false)}>✕</button>
              </div>

              <div className="comments-panel-list">
                {comments.filter(c => !c.parentCommentId).map(comment => (
                  <div key={comment.id}>
                    <div className="comment-item-fullscreen">
                      <div className="comment-avatar">{comment.user.displayName[0]}</div>
                      <div className="comment-content-fullscreen">
                        <div className="comment-user-fullscreen">
                          <span className="comment-name">{comment.user.displayName}</span>
                          <span className="comment-time">{getRelativeTime(new Date(comment.createdAt))}</span>
                        </div>
                        <p>{comment.content}</p>
                        <button 
                          className="reply-btn-fullscreen"
                          onClick={() => setReplyingTo(comment.id)}
                        >
                          回覆
                        </button>
                      </div>
                    </div>

                    {/* 回覆 */}
                    {comments.filter(r => r.parentCommentId === comment.id).map(reply => (
                      <div key={reply.id} className="comment-item-fullscreen reply-comment">
                        <div className="comment-avatar small">{reply.user.displayName[0]}</div>
                        <div className="comment-content-fullscreen">
                          <div className="comment-user-fullscreen">
                            <span className="comment-name">{reply.user.displayName}</span>
                            <span className="comment-time">{getRelativeTime(new Date(reply.createdAt))}</span>
                          </div>
                          <p>{reply.content}</p>
                        </div>
                      </div>
                    ))}

                    {replyingTo === comment.id && (
                      <div className="reply-input-box">
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`回覆 ${comment.user.displayName}...`}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                        />
                        <button className="send-reply-btn" onClick={() => handleAddReply(comment.id)}>送出</button>
                        <button className="cancel-reply-btn" onClick={() => setReplyingTo(null)}>取消</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="comments-panel-input">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="寫下你的留言..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button className="send-comment-btn" onClick={handleAddComment}>送出</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="scroll-indicator">
        {currentIndex + 1} / {posts.length}
      </div>
    </div>
  );
}
