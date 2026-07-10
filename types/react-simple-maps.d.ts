declare module 'react-simple-maps' {
  import { FC, ReactNode, SVGProps } from 'react';

  interface GeographyStyle {
    default?: React.CSSProperties;
    hover?: React.CSSProperties;
    pressed?: React.CSSProperties;
  }

  interface GeoFeature {
    rsmKey: string;
    id: string | number;
    svgPath: string;
    type: string;
    properties: Record<string, unknown>;
    geometry: { type: string; coordinates: unknown[] };
  }

  interface GeographiesChildrenArgs {
    geographies: GeoFeature[];
    outline: GeoFeature;
    borders: GeoFeature;
  }

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    style?: React.CSSProperties;
    className?: string;
    children?: ReactNode;
    width?: number;
    height?: number;
  }

  interface GeographiesProps {
    geography: string | Record<string, unknown>;
    parseGeographies?: (features: unknown[]) => unknown[];
    children: (args: GeographiesChildrenArgs) => ReactNode;
    className?: string;
  }

  // Extends SVGProps so onMouseMove, onClick, etc. are valid
  interface GeographyProps extends Omit<SVGProps<SVGPathElement>, 'style'> {
    geography: GeoFeature;
    style?: GeographyStyle;
    className?: string;
  }

  export const ComposableMap: FC<ComposableMapProps>;
  export const Geographies: FC<GeographiesProps>;
  export const Geography: FC<GeographyProps>;
  export const ZoomableGroup: FC<Record<string, unknown>>;
  export const Marker: FC<Record<string, unknown>>;
  export const Graticule: FC<Record<string, unknown>>;
  export const Sphere: FC<Record<string, unknown>>;
}
