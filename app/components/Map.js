'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 1;

const activeNodes = [
  { id: 1, pos: [40.7128, -74.0060], name: 'New York (AWS-US-East)', status: 'active' },
  { id: 2, pos: [51.5074, -0.1278], name: 'London (AWS-EU-West)', status: 'active' },
  { id: 3, pos: [35.6762, 139.6503], name: 'Tokyo (AWS-AP-East)', status: 'active' },
  { id: 4, pos: [-33.8688, 151.2093], name: 'Sydney (AWS-AP-South)', status: 'pending' },
];

export default function DashboardMap() {
  return (
    <div style={{ height: '100%', width: '100%', borderRadius: 'inherit', overflow: 'hidden' }}>
      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={DEFAULT_ZOOM} 
        style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {activeNodes.map(node => (
          <CircleMarker
            key={node.id}
            center={node.pos}
            radius={node.status === 'active' ? 6 : 4}
            fillColor={node.status === 'active' ? '#ef4444' : '#f59e0b'}
            color={node.status === 'active' ? '#ef4444' : '#f59e0b'}
            weight={1}
            opacity={0.8}
            fillOpacity={0.6}
          >
            <Popup>
              <strong>{node.name}</strong><br />
              Status: {node.status === 'active' ? 'Active Scanning' : 'Pending Review'}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
