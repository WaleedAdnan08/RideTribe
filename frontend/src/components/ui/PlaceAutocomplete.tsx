import React, { useRef, useEffect, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from "@/components/ui/input";

interface PlaceAutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

export const PlaceAutocomplete = ({ onPlaceSelect, className, ...props }: PlaceAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'name', 'formatted_address', 'place_id'],
    };

    // Initialize Autocomplete only once
    if (!autocompleteRef.current) {
      autocompleteRef.current = new places.Autocomplete(inputRef.current, options);
    }

    // Bind the listener
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place) {
        onPlaceSelect(place);
      }
    });

    // Cleanup listener on unmount or when dependencies change
    return () => {
      listener.remove();
    };
  }, [places, onPlaceSelect]);

  return (
    <Input
      ref={inputRef}
      className={className}
      autoComplete="off"
      {...props}
    />
  );
};