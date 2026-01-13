// Google Maps TypeScript declarations
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element | null, opts?: MapOptions);
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      getZoom(): number | undefined;
      addListener(eventName: string, handler: Function): MapsEventListener;
      getCenter(): LatLng | undefined;
      getBounds(): LatLngBounds | undefined;
      fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral, padding?: number | Padding): void;
      panTo(latLng: LatLng | LatLngLiteral): void;
      setOptions(options: MapOptions): void;
      getDiv(): Element;
    }

    interface Padding {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    }

    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: Function): MapsEventListener;
      setPosition(latlng: LatLng | LatLngLiteral): void;
    }

    // Advanced Marker for newer Google Maps
    namespace marker {
      class AdvancedMarkerElement {
        constructor(opts?: AdvancedMarkerElementOptions);
        map: Map | null;
        position: LatLng | LatLngLiteral | null;
        zIndex: number;
        content: Element | null;
        title: string;
        addListener(eventName: string, handler: Function): MapsEventListener;
      }

      interface AdvancedMarkerElementOptions {
        map?: Map;
        position?: LatLng | LatLngLiteral;
        title?: string;
        content?: Element;
        zIndex?: number;
        gmpDraggable?: boolean;
      }
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(map?: Map, anchor?: Marker | marker.AdvancedMarkerElement): void;
      close(): void;
      setContent(content: string | Element): void;
    }

    interface InfoWindowOptions {
      content?: string | Element;
      position?: LatLng | LatLngLiteral;
      maxWidth?: number;
      pixelOffset?: Size;
    }

    interface InfoWindowOpenOptions {
      anchor?: Marker | marker.AdvancedMarkerElement;
      map?: Map;
    }

    class Circle {
      constructor(opts?: CircleOptions);
      setMap(map: Map | null): void;
    }

    interface CircleOptions {
      center?: LatLng | LatLngLiteral;
      radius?: number;
      map?: Map;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }

    class Polygon {
      constructor(opts?: PolygonOptions);
      setMap(map: Map | null): void;
      getPath(): MVCArray<LatLng>;
      getPaths(): MVCArray<MVCArray<LatLng>>;
      setPath(path: Array<LatLng | LatLngLiteral>): void;
    }

    class MVCArray<T> {
      getArray(): T[];
      getAt(i: number): T;
      getLength(): number;
      forEach(callback: (elem: T, i: number) => void): void;
      push(elem: T): number;
    }

    interface PolygonOptions {
      paths?: Array<LatLng | LatLngLiteral> | Array<Array<LatLng | LatLngLiteral>>;
      map?: Map;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      editable?: boolean;
      draggable?: boolean;
      clickable?: boolean;
      geodesic?: boolean;
      visible?: boolean;
      zIndex?: number;
    }

    class Rectangle {
      constructor(opts?: RectangleOptions);
      setMap(map: Map | null): void;
    }

    interface RectangleOptions {
      bounds?: LatLngBounds | LatLngBoundsLiteral;
      map?: Map;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }

    interface MapsEventListener {
      remove(): void;
    }

    namespace event {
      function removeListener(listener: MapsEventListener): void;
      function addListener(instance: object, eventName: string, handler: Function): MapsEventListener;
      function addListenerOnce(instance: object, eventName: string, handler: Function): MapsEventListener;
      function clearListeners(instance: object, eventName: string): void;
      function trigger(instance: object, eventName: string, ...args: any[]): void;
    }

    const ControlPosition: {
      TOP_LEFT: number;
      TOP_CENTER: number;
      TOP_RIGHT: number;
      LEFT_TOP: number;
      LEFT_CENTER: number;
      LEFT_BOTTOM: number;
      RIGHT_TOP: number;
      RIGHT_CENTER: number;
      RIGHT_BOTTOM: number;
      BOTTOM_LEFT: number;
      BOTTOM_CENTER: number;
      BOTTOM_RIGHT: number;
    };

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      extend(point: LatLng | LatLngLiteral): LatLngBounds;
      getCenter(): LatLng;
      contains(latlng: LatLng | LatLngLiteral): boolean;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      isEmpty(): boolean;
      toJSON(): LatLngBoundsLiteral;
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (
          results: GeocoderResult[] | null,
          status: GeocoderStatus
        ) => void
      ): void;
    }

    interface GeocoderRequest {
      address?: string;
      location?: LatLng | LatLngLiteral;
      placeId?: string;
      componentRestrictions?: {
        country?: string | string[];
      };
      bounds?: LatLngBounds | LatLngBoundsLiteral;
    }

    interface LatLngBoundsLiteral {
      east: number;
      north: number;
      south: number;
      west: number;
    }

    interface GeocoderResult {
      geometry: {
        location: LatLng;
        location_type: string;
        viewport: LatLngBounds;
      };
      formatted_address: string;
      address_components: Array<{
        long_name: string;
        short_name: string;
        types: string[];
      }>;
      place_id: string;
    }

    enum GeocoderStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      minZoom?: number;
      maxZoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      zoomControl?: boolean;
      zoomControlOptions?: {
        position?: number;
      };
      styles?: MapTypeStyle[];
      mapId?: string;
      gestureHandling?: 'cooperative' | 'greedy' | 'none' | 'auto';
      scrollwheel?: boolean;
      disableDefaultUI?: boolean;
      keyboardShortcuts?: boolean;
      clickableIcons?: boolean;
      restriction?: MapRestriction;
    }

    interface MapRestriction {
      latLngBounds: LatLngBounds | LatLngBoundsLiteral;
      strictBounds?: boolean;
    }

    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers?: Array<{ [key: string]: any }>;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon;
    }

    interface Icon {
      url: string;
      scaledSize?: Size;
    }

    class Size {
      constructor(width: number, height: number);
    }

    namespace places {
      class AutocompleteService {
        getPlacePredictions(
          request: AutocompletionRequest,
          callback: (
            results: AutocompletePrediction[] | null,
            status: PlacesServiceStatus
          ) => void
        ): void;
      }

      class PlacesService {
        constructor(attrContainer: HTMLDivElement | Map);
        getDetails(
          request: PlaceDetailsRequest,
          callback: (
            place: PlaceResult | null,
            status: PlacesServiceStatus
          ) => void
        ): void;
      }

      class SearchBox {
        constructor(inputField: HTMLInputElement, opts?: SearchBoxOptions);
        addListener(eventName: string, handler: Function): MapsEventListener;
        getPlaces(): PlaceResult[];
        setBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
      }

      interface SearchBoxOptions {
        bounds?: LatLngBounds | LatLngBoundsLiteral;
      }

      interface AutocompletionRequest {
        input: string;
        componentRestrictions?: { country: string };
        types?: string[];
        bounds?: LatLngBounds | LatLngBoundsLiteral;
      }

      interface AutocompletePrediction {
        description: string;
        place_id: string;
        structured_formatting: {
          main_text: string;
          secondary_text: string;
        };
      }

      interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[];
      }

      interface PlaceResult {
        geometry?: {
          location?: LatLng;
        };
        address_components?: Array<{
          long_name: string;
          short_name: string;
          types: string[];
        }>;
        formatted_address?: string;
        name?: string;
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        INVALID_REQUEST = 'INVALID_REQUEST',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      }
    }

    namespace drawing {
      class DrawingManager {
        constructor(options?: DrawingManagerOptions);
        setMap(map: Map | null): void;
        setDrawingMode(drawingMode: OverlayType | null): void;
        getDrawingMode(): OverlayType | null;
      }

      interface DrawingManagerOptions {
        drawingMode?: OverlayType | null;
        drawingControl?: boolean;
        drawingControlOptions?: DrawingControlOptions;
        circleOptions?: CircleOptions;
        markerOptions?: MarkerOptions;
        polygonOptions?: PolygonOptions;
        polylineOptions?: PolylineOptions;
        rectangleOptions?: RectangleOptions;
        map?: Map;
      }

      interface DrawingControlOptions {
        position?: number;
        drawingModes?: OverlayType[];
      }

      interface PolylineOptions {
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
      }

      enum OverlayType {
        CIRCLE = 'circle',
        MARKER = 'marker',
        POLYGON = 'polygon',
        POLYLINE = 'polyline',
        RECTANGLE = 'rectangle',
      }
    }
  }
}
