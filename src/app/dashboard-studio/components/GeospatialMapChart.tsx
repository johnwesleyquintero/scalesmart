import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue with Webpack
L.Icon.Default.imagePath = '../node_modules/leaflet/dist/images/';

interface GeospatialMapChartProps {
  data: {
    labels: string[]; // e.g., Location names
    datasets: {
      label: string; // e.g., 'Coordinates' or 'Value'
      data: Array<[number, number] | number>; // Array of [lat, lng] pairs or values
    }[];
  };
  // Add other necessary config props here
}

const GeospatialMapChart: React.FC<GeospatialMapChartProps> = ({ data }) => {
  // Assuming the first dataset contains coordinate pairs [lat, lng]
  const coordinateDataset = data.datasets.find((dataset) =>
    Array.isArray(dataset.data[0]),
  );

  if (!coordinateDataset || coordinateDataset.data.length === 0) {
    return <div className="text-gray-500">No geospatial data available</div>;
  }

  // Assuming data.labels correspond to the points in coordinateDataset.data
  const points: Array<{ coords: [number, number]; label: string }> =
    coordinateDataset.data.map((coords, index) => ({
      coords: coords as [number, number], // Assert type
      label: data.labels[index],
      // You might want to include other data from other datasets here
    }));

  // Determine initial map center and zoom
  // This is a basic approach, you might want a more sophisticated method
  const initialPosition: [number, number] =
    points.length > 0 ? points[0].coords : [0, 0];
  const initialZoom = 2; // Adjust zoom level as needed

  return (
    <MapContainer
      center={initialPosition}
      zoom={initialZoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      {points.map((point, index) => (
        <Marker key={index} position={point.coords}>
          <Popup>
            {point.label}
            {/* Add more info from other datasets if available */}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default GeospatialMapChart;
