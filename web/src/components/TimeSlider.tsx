import React, { useState, useEffect } from 'react';
import './TimeSlider.css';
import { generateTimeSlots, formatTimeSlotDisplay, getHoursAgo } from '../../../src/utils/timeSlot';

interface TimeSliderProps {
  onTimeChange: (timeSlot: string) => void;
  maxHistoryHours?: number;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({ 
  onTimeChange, 
  maxHistoryHours = 24,
  onPlayingChange 
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 播放速度倍數

  // 生成時間槽（每30分鐘一個）
  useEffect(() => {
    const slots = generateTimeSlots(maxHistoryHours);
    setTimeSlots(slots);
    setSelectedIndex(slots.length - 1); // 預設最新時間
  }, [maxHistoryHours]);

  // 自動播放功能
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSelectedIndex(prev => {
        if (prev >= timeSlots.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed); // 根據速度調整間隔

    return () => clearInterval(interval);
  }, [isPlaying, timeSlots.length, playbackSpeed]);

  // 通知父組件時間變化
  useEffect(() => {
    if (timeSlots[selectedIndex]) {
      onTimeChange(timeSlots[selectedIndex]);
    }
  }, [selectedIndex, timeSlots, onTimeChange]);

  // 通知父組件播放狀態變化
  useEffect(() => {
    if (onPlayingChange) {
      onPlayingChange(isPlaying);
    }
  }, [isPlaying, onPlayingChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIndex(parseInt(e.target.value));
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    setSelectedIndex(prev => Math.max(0, prev - 1));
    setIsPlaying(false);
  };

  const handleNext = () => {
    setSelectedIndex(prev => Math.min(timeSlots.length - 1, prev + 1));
    setIsPlaying(false);
  };

  const jumpToNow = () => {
    setSelectedIndex(timeSlots.length - 1);
    setIsPlaying(false);
  };

  const cyclePlaybackSpeed = () => {
    setPlaybackSpeed(prev => {
      if (prev === 1) return 2;
      if (prev === 2) return 4;
      return 1;
    });
  };

  if (timeSlots.length === 0) return null;

  const hoursAgo = getHoursAgo(timeSlots[selectedIndex]);
  const isCurrentTime = selectedIndex === timeSlots.length - 1;

  return (
    <div className="time-slider-container">
      <div className="time-display">
        <span className="current-time">
          {formatTimeSlotDisplay(timeSlots[selectedIndex])}
        </span>
        {!isCurrentTime && (
          <span className="time-ago">
            ({hoursAgo < 1 ? `${Math.round(hoursAgo * 60)} 分鐘前` : `${hoursAgo.toFixed(1)} 小時前`})
          </span>
        )}
        {isCurrentTime && (
          <span className="time-ago current-badge">
            ● 即時
          </span>
        )}
      </div>

      <div className="slider-controls">
        <button 
          className="control-btn" 
          onClick={handlePrevious}
          disabled={selectedIndex === 0}
          title="上一個時段"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        <button 
          className="control-btn play-btn" 
          onClick={handlePlayPause}
          title={isPlaying ? '暫停' : '播放'}
        >
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <button 
          className="control-btn" 
          onClick={handleNext}
          disabled={isCurrentTime}
          title="下一個時段"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>

        <input
          type="range"
          min="0"
          max={timeSlots.length - 1}
          value={selectedIndex}
          onChange={handleSliderChange}
          className="time-slider"
        />

        {isPlaying && (
          <button 
            className="control-btn speed-btn" 
            onClick={cyclePlaybackSpeed}
            title={`播放速度: ${playbackSpeed}x`}
          >
            {playbackSpeed}x
          </button>
        )}

        <button 
          className="control-btn now-btn" 
          onClick={jumpToNow}
          disabled={isCurrentTime}
          title="跳到現在"
        >
          現在
        </button>
      </div>

      {/* 時間軸刻度 */}
      <div className="time-marks">
        {timeSlots
          .filter((_, i) => i % 4 === 0 || i === timeSlots.length - 1)
          .map((slot, i) => (
            <span key={i} className="time-mark">
              {formatTimeSlotDisplay(slot).split(' ')[1]}
            </span>
          ))}
      </div>

      {/* 進度指示器 */}
      <div className="progress-indicator">
        <div className="progress-text">
          {selectedIndex + 1} / {timeSlots.length}
        </div>
      </div>
    </div>
  );
};
