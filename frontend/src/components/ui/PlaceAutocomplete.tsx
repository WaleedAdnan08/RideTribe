import React, { useRef, useEffect, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from "@/components/ui/input";

interface PlaceAutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

export const PlaceAutocomplete = ({ onPlaceSelect, className, onKeyDown, ...props }: PlaceAutocompleteProps) => {
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
      console.log("DEBUG: place_changed fired");
      console.log("DEBUG: Place result:", place);
      console.log("DEBUG: Input value ref:", inputRef.current?.value);
      
      if (place) {
        // 1. Prioritize formatted address, fallback to name, then input value
        const address = place.formatted_address || place.name || inputRef.current?.value;
        console.log("DEBUG: Determined address:", address);
        
        // 2. Manually sync the parent state if onChange is provided.
        // This prevents the "flash and revert" issue where React state
        // overwrites the Google-inserted value with the old partial search term.
        if (props.onChange && address) {
            console.log("DEBUG: Triggering manual onChange with:", address);
            // Create a synthetic event to update the parent's state
            const event = {
                target: {
                    name: props.name,
                    value: address
                }
            } as React.ChangeEvent<HTMLInputElement>;
            
            props.onChange(event);
        }

        // 3. Pass the full place object to the specific handler
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
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
        onKeyDown?.(e);
      }}
      {...props}
    />
  );
};