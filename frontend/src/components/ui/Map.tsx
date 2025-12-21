import React from 'react';
import { Map as GoogleMap, MapProps } from '@vis.gl/react-google-maps';

interface CustomMapProps extends MapProps {
  className?: string;
}

export const Map = ({ className, children, ...props }: CustomMapProps) => {
  return (
    <div className={`w-full h-full ${className || ''}`}>
      <GoogleMap
        {...props}
        mapId="DEMO_MAP_ID" // Required for Advanced Markers
        defaultCenter={props.defaultCenter || { lat: 37.7749, lng: -122.4194 }}
        defaultZoom={props.defaultZoom || 12}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
      >
        {children}
      </GoogleMap>
    </div>
  );
};