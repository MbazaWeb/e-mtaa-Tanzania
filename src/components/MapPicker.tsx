import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '1rem'
};

const center = {
  lat: -6.7924, // Dar es Salaam
  lng: 39.2083
};

interface MapPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    addressComponents: {
      region?: string;
      district?: string;
      ward?: string;
      street?: string;
    }
  }) => void;
}

export const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  const [markerPosition, setMarkerPosition] = useState(center);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        const components = response.results[0].address_components;
        let region = "";
        let district = "";
        let ward = "";
        let street = "";

        // Mapping Google address components to Tanzanian administrative levels
        // This is an approximation and might need adjustment based on Google's data for TZ
        components.forEach(comp => {
          if (comp.types.includes('administrative_area_level_1')) {
            region = comp.long_name;
          }
          if (comp.types.includes('administrative_area_level_2')) {
            district = comp.long_name;
          }
          if (comp.types.includes('administrative_area_level_3') || comp.types.includes('locality')) {
            ward = comp.long_name;
          }
          if (comp.types.includes('route') || comp.types.includes('neighborhood')) {
            street = comp.long_name;
          }
        });

        onLocationSelect({
          lat,
          lng,
          addressComponents: { region, district, ward, street }
        });
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    }
  }, [onLocationSelect]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPosition(newPos);
      reverseGeocode(newPos.lat, newPos.lng);
    }
  }, [reverseGeocode]);

  return isLoaded ? (
    <div className="space-y-2">
      <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Gusa ramani kuchagua eneo lako</p>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onClick={onMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        }}
      >
        <Marker position={markerPosition} />
      </GoogleMap>
    </div>
  ) : (
    <div className="h-[300px] w-full bg-stone-100 animate-pulse rounded-2xl flex items-center justify-center">
      <span className="text-stone-400 text-sm font-medium">Inapakia Ramani...</span>
    </div>
  );
};
