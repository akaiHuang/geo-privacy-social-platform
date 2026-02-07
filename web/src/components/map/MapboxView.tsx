import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import { MAPBOX_TOKEN, MAPBOX_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM } from '../../config/mapbox';
import { Post } from '../../types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxViewProps {
  posts: Post[];
  onMarkerClick?: (postId: string) => void;
  center?: [number, number];
  zoom?: number;
}

export interface MapboxViewRef {
  flyToPost: (postId: string) => void;
  resize: () => void;
}

export const MapboxView = forwardRef<MapboxViewRef, MapboxViewProps>(({ 
  posts, 
  onMarkerClick,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM 
}, ref) => {
  const mapRef = useRef<any>(null);

  // 暴露方法給父元件
  useImperativeHandle(ref, () => ({
    flyToPost: (postId: string) => {
      const post = posts.find(p => p.id === postId);
      if (post && mapRef.current) {
        mapRef.current.flyTo({
          center: [post.location.longitude, post.location.latitude],
          zoom: 15,
          duration: 1000
        });
      }
    },
    resize: () => {
      if (mapRef.current) {
        // 等待 DOM 更新後再 resize
        setTimeout(() => {
          mapRef.current.resize();
        }, 100);
      }
    }
  }), [posts]);

  const handleMarkerClick = useCallback((post: Post) => {
    if (onMarkerClick) {
      onMarkerClick(post.id);
    }
  }, [onMarkerClick]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: center[0],
        latitude: center[1],
        zoom: zoom
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAPBOX_STYLE}
    >
      <NavigationControl position="top-right" />
      <GeolocateControl
        position="top-right"
        trackUserLocation
        showUserHeading
      />

      {posts.map((post) => (
        <Marker
          key={post.id}
          longitude={post.location.longitude}
          latitude={post.location.latitude}
          anchor="bottom"
          onClick={(e: any) => {
            e.originalEvent.stopPropagation();
            handleMarkerClick(post);
          }}
        >
          <div 
            className="mapbox-marker"
            style={{ cursor: 'pointer' }}
          >
            {post.media.length > 0 ? (
              <div className="marker-image-container">
                <img 
                  src={post.media[0].uri} 
                  alt="Post" 
                  className="marker-photo" 
                />
              </div>
            ) : (
              <div className="marker-placeholder">
                <span>📍</span>
              </div>
            )}
          </div>
        </Marker>
      ))}
    </Map>
  );
});
