import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

interface GeospatialMapChartProps {
  data: {
    labels: string[]; // e.g., Location names
    datasets: {
      label: string; // e.g., 'Coordinates' or 'Value'
      data: Array<[number, number] | number>; // Array of [lat, lng] pairs or values
    }[];
  };
  initialPosition?: [number, number];
  initialZoom?: number;
  // Add other necessary config props here
}

const DynamicMapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
);

const DynamicTileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false },
);

const DynamicMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false },
);

const DynamicPopup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false },
);

const GeospatialMapChart: React.FC<GeospatialMapChartProps> = ({
  data,
  initialPosition,
  initialZoom,
}) => {
  const [leaflet, setLeaflet] = useState<typeof import('leaflet') | null>(null);

  useEffect(() => {
    // Dynamically import Leaflet on the client side
    import('leaflet').then((L) => {
      setLeaflet(L);
      // Fix for default marker icon issue with Webpack, only on client
      L.Icon.Default.imagePath = '../node_modules/leaflet/dist/images/';
    });
  }, []);

  // Assuming the first dataset contains coordinate pairs [lat, lng]
  const coordinateDataset = data.datasets.find((dataset) =>
    Array.isArray(dataset.data[0]),
  );

  if (!coordinateDataset || coordinateDataset.data.length === 0) {
    return (
      <div className="text-gray-500">
        No geospatial data available. Please ensure that the data includes a
        dataset with coordinate pairs (latitude and longitude).
      </div>
    );
  }

  // Assuming data.labels correspond to the points in coordinateDataset.data
  const points: Array<{ coords: [number, number]; label: string }> =
    coordinateDataset.data
      .map((coords, index) => {
        const [lat, lng] = coords as [number, number]; // Assert type
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.error(
            `Invalid coordinates: Latitude ${lat}, Longitude ${lng} at index ${index}`,
          );
          return null; // Skip invalid points
        }
        return {
          coords: [lat, lng],
          label: data.labels[index],
          // You might want to include other data from other datasets here
        };
      })
      .filter(Boolean) as Array<{ coords: [number, number]; label: string }>;

  // Determine initial map center and zoom, use props if available
  const defaultPosition: [number, number] =
    points.length > 0 ? points[0].coords : [0, 0];
  const defaultZoom = 2; // Adjust zoom level as needed

  const mapCenter: [number, number] = initialPosition || defaultPosition;
  const mapZoom: number = initialZoom || defaultZoom;

  if (!leaflet) {
    return <div className="text-gray-500">Loading map...</div>;
  }

  return (
    <DynamicMapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ height: '100%', width: '100%' }}
    >
      <DynamicTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      {points.map((point, index) => (
        <DynamicMarker key={index} position={point.coords}>
          <DynamicPopup>
            {point.label}
            {/* Add more info from other datasets if available */}
          </DynamicPopup>
        </DynamicMarker>
      ))}
    </DynamicMapContainer>
  );
};

export default GeospatialMapChart;
