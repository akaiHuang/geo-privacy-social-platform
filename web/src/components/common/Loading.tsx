import './Loading.css';

interface LoadingProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

export function Loading({ 
  text = 'Loading...', 
  size = 'medium',
  fullScreen = false 
}: LoadingProps) {
  const containerClass = fullScreen ? 'loading-container fullscreen' : 'loading-container';
  
  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${size}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}
