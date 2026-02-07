import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './TimelineSlider.css';

interface TimelineSliderProps {
  // 回調函數：傳遞 0-1 的百分比（1 = 最新頂部，0 = 最舊底部）
  onPositionChange: (percentage: number) => void;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  onPositionChange
}) => {
  // 固定 49 個視覺刻度（24小時 × 2 + 1）
  const visualMarks = useMemo(() => 
    Array.from({ length: 49 }, (_, i) => i),
    []
  );
  
  const [selectedPercentage, setSelectedPercentage] = useState(1); // 1 = 最新（頂部），0 = 最舊（底部）
  const [isDragging, setIsDragging] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 每次組件掛載時重置為最新（percentage = 1，在頂部）
  useEffect(() => {
    // 延遲一點讓 DOM 完全渲染
    const timer = setTimeout(() => {
      setSelectedPercentage(1);
      onPositionChange(1);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 當百分比改變時通知父組件
  useEffect(() => {
    console.log(`[TimelineSlider] 位置改變: ${(selectedPercentage * 100).toFixed(1)}%`);
    onPositionChange(selectedPercentage);
  }, [selectedPercentage, onPositionChange]);

  // 重置精靈效果
  const resetGenieEffect = useCallback(() => {
    const marks = wrapperRef.current?.querySelectorAll('.time-mark') || [];
    marks.forEach((mark) => {
      (mark as HTMLElement).style.transform = 'scaleX(1)';
    });
  }, []);

  // 計算位置並更新百分比
  const updatePosition = useCallback((clientY: number) => {
    if (!wrapperRef.current) return;
    
    const rect = wrapperRef.current.getBoundingClientRect();
    const offsetY = clientY - rect.top;
    const rawPercentage = Math.max(0, Math.min(1, offsetY / rect.height));
    // 上面（0% offsetY）= 最新（1.0），下面（100% offsetY）= 最舊（0.0）
    const percentage = 1 - rawPercentage;
    
    setSelectedPercentage(percentage);
    
    // 立即更新精靈效果
    if (isDragging) {
      const marks = wrapperRef.current?.querySelectorAll('.time-mark') || [];
      const targetIndex = Math.round(rawPercentage * (visualMarks.length - 1));
      
      marks.forEach((mark, index) => {
        const distance = Math.abs(targetIndex - index);
        
        let scale = 1;
        if (distance === 0) scale = 3.0;
        else if (distance <= 1) scale = 2.4;
        else if (distance <= 2) scale = 2.0;
        else if (distance <= 3) scale = 1.6;
        else if (distance <= 5) scale = 1.3;
        else if (distance <= 8) scale = 1.1;
        
        (mark as HTMLElement).style.transform = `scaleX(${scale})`;
      });
    }
  }, [isDragging, visualMarks.length]);

  // 滑鼠按下
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e.clientY);
  };

  // 觸控按下
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      setIsDragging(true);
      updatePosition(e.touches[0].clientY);
    }
  };

  // 滑鼠移動和放開
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        updatePosition(e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      resetGenieEffect();
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      resetGenieEffect();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, updatePosition, resetGenieEffect]);

  // 計算指示器位置（percentage = 1 在頂部，percentage = 0 在底部）
  const indicatorTop = (1 - selectedPercentage) * (wrapperRef.current?.offsetHeight || 0);

  return (
    <div className="time-slider-container">
      <div 
        className="slider-controls" 
        ref={wrapperRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* 時間刻度（純視覺，49個固定刻度）*/}
        <div className="time-marks">
          {visualMarks.map((index) => {
            const isThick = index % 4 === 0;
            return (
              <div
                key={index}
                className={`time-mark ${isThick ? 'thick' : 'thin'}`}
                data-index={index}
              />
            );
          })}
        </div>

        {/* 當前位置指示器 */}
        <div 
          className="current-position-indicator"
          style={{ top: `${indicatorTop}px` }}
        />
      </div>

      {/* 時間泡泡 - 已移除，不再顯示 */}
    </div>
  );
};
