import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import './ImageCropModal.css';

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageCropModalProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
}

// 創建裁切後的圖片
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('無法創建 canvas context');
  }

  // 設置 canvas 大小為裁切區域大小
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // 繪製裁切後的圖片
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // 轉換為 Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas 轉換 Blob 失敗'));
      }
    }, 'image/jpeg', 0.95);
  });
}

// 創建圖片元素
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  image,
  isOpen,
  onClose,
  onCropComplete,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 使用 ref 來暫存 zoom 值，避免頻繁更新 state
  const zoomRef = useRef(1);
  const rafRef = useRef<number | null>(null);

  // 清理函數
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const onCropChange = useCallback((crop: Point) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    // 立即更新 ref，用於 slider 顯示
    zoomRef.current = newZoom;
    
    // 取消之前的 RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // 使用 RAF 批次更新，提升流暢度
    rafRef.current = requestAnimationFrame(() => {
      setZoom(newZoom);
      rafRef.current = null;
    });
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error('裁切圖片失敗:', error);
      alert('裁切圖片失敗，請重試');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="crop-modal-overlay" onClick={onClose}>
      <div className="crop-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="crop-modal-header">
          <h3>調整頭像</h3>
          <button className="close-btn" onClick={onClose} disabled={isProcessing}>
            ✕
          </button>
        </div>

        <div className="crop-container">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="crop-controls">
          <div className="zoom-control">
            <span className="zoom-label">縮放</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="zoom-slider"
            />
          </div>

          <div className="crop-instructions">
            💡 拖動圖片調整位置，使用滑桿縮放
          </div>
        </div>

        <div className="crop-modal-footer">
          <button
            className="cancel-btn"
            onClick={onClose}
            disabled={isProcessing}
          >
            取消
          </button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isProcessing ? '處理中...' : '完成'}
          </button>
        </div>
      </div>
    </div>
  );
};
