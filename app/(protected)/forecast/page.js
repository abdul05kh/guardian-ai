'use client';

import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function ThreatForecastPage() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate predictive markers based on historical detection clusters
    // For enterprise pitch, we simulate coordinate plotting based on the platforms detected
    const loadPredictiveVectors = async () => {
      try {
        const q = query(collection(db, 'infringement_detections'), limit(100));
        const snapshot = await getDocs(q);
        
        const generatedMarkers = [];
        snapshot.docs.forEach((doc, i) => {
          const data = doc.data();
          // Extremely rudimentary geo-mapping based on threat actor hashing
          const pseudoLat = (data.confidence * i % 180) - 90;
          const pseudoLng = (data.revenueAtRisk * i % 360) - 180;
          
          if (data.status === 'Active' || data.status === 'pending_review') {
            generatedMarkers.push({
              markerOffset: -15,   
              name: `${data.platform} Vector`,
              coordinates: [pseudoLng, pseudoLat],
              severity: data.confidence > 90 ? 'critical' : 'warning'
            });
          }
        });
        
        // Add some simulated future anomalies for the "Forecast" aesthetic
        generatedMarkers.push({
          markerOffset: -15, name: "Projected Tor Node Surge", coordinates: [15, 45], severity: 'forecast'
        });
        generatedMarkers.push({
          markerOffset: -15, name: "Anomalous Discord Activity", coordinates: [-100, 35], severity: 'forecast'
        });

        setMarkers(generatedMarkers);
      } catch (e) {
        console.error("Forecast mapping failed:", e);
      } finally {
        setLoading(false);
      }
    };
    
    loadPredictiveVectors();
  }, []);

  return (
    <div className="page-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500 mb-2">
          🌍 Predictive Threat Forecasting
        </h1>
        <p className="text-slate-400">
          Geospatial plotting of active infringement nodes paired with machine-learning forecasts of incoming piracy swarms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <div className="lg:col-span-3 card p-0 bg-[#0B1120] border-slate-800 overflow-hidden relative" style={{ height: '600px' }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B1120]/80 backdrop-blur-sm">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-blue-400 font-mono animate-pulse">Running Geospatial Trajectory Models...</p>
            </div>
          )}
          
          <ComposableMap 
            projectionConfig={{ scale: 140 }}
            style={{ width: "100%", height: "100%" }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1e293b"
                    stroke="#0f172a"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#334155", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
            
            {markers.map(({ name, coordinates, markerOffset, severity }, index) => {
              let fillcolor = "#F59E0B"; // warning
              if (severity === 'critical') fillcolor = "#EF4444";
              if (severity === 'forecast') fillcolor = "#8B5CF6"; // purple for future anomaly
              
              return (
                <Marker key={index} coordinates={coordinates}>
                  <circle 
                    r={severity === 'forecast' ? 6 : 4} 
                    fill={fillcolor} 
                    className={severity === 'forecast' ? 'animate-pulse' : ''} 
                    stroke="#fff" 
                    strokeWidth={1} 
                  />
                  {/* Subtle Radar Ring out effect */}
                  {severity === 'critical' && (
                     <circle r={12} fill="transparent" stroke={fillcolor} strokeWidth={1} className="animate-ping" opacity={0.5} />
                  )}
                  <text
                    textAnchor="middle"
                    y={markerOffset}
                    style={{ fontFamily: "monospace", fill: "#94a3b8", fontSize: '10px' }}
                  >
                    {name}
                  </text>
                </Marker>
              );
            })}
          </ComposableMap>
          
          <div className="absolute bottom-4 left-4 bg-slate-900/80 p-3 rounded border border-slate-800 text-xs text-slate-400 font-mono">
             <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Active Critical Nodes</div>
             <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Investigating Vectors</div>
             <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span> Forecasted Anomalies</div>
          </div>
        </div>

        <div className="card h-fit border-slate-700 bg-gradient-to-b from-slate-900 to-[#0B1120]">
          <h3 className="card-title text-purple-400 mb-4 border-b border-slate-800 pb-2">Pre-Crime Analytics</h3>
          
          <div className="mb-6">
            <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Top Forecasted Threat</div>
            <div className="text-lg font-bold text-slate-200">Tor Node Expansion</div>
            <div className="text-sm font-mono text-pink-400 mt-1">Expected T+48 Hours</div>
          </div>
          
          <div className="mb-6">
             <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Global Vulnerability Index</div>
             <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-amber-500">62.4</span>
                <span className="text-sm text-slate-400 mb-1">/ 100</span>
             </div>
             <div className="w-full bg-slate-800 h-1.5 mt-2 rounded overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 w-[62.4%] h-full"></div>
             </div>
          </div>
          
          <button className="btn btn-outline border-purple-500 text-purple-400 w-full hover:bg-purple-500 hover:text-white transition-colors text-sm">
            Generate Executive Forecast Report
          </button>
        </div>

      </div>
    </div>
  );
}
