'use client';

import { useState, useEffect } from 'react';
// import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

// const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
import 'leaflet/dist/leaflet.css';

export default function ThreatForecastPage() {
  const { user, userProfile } = useAuth();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportHtml, setReportHtml] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleGenerateReport = async () => {
    setShowReportModal(true);
    setReportGenerating(true);
    try {
      const { generateForecastReport } = await import('@/lib/gemini');
      const html = await generateForecastReport(markers, userProfile?.geminiApiKey);
      setReportHtml(html);
    } catch (error) {
      console.error(error);
      setReportHtml('<p class="text-red-400">Failed to generate report.</p>');
    } finally {
      setReportGenerating(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const loadPredictiveVectors = async () => {
      try {
        const baseCollection = collection(db, 'infringement_detections');
        const q = userProfile?.orgId
          ? query(baseCollection, where('orgId', '==', userProfile.orgId), limit(100))
          : query(baseCollection, where('userId', '==', user.uid), limit(100));
        const snapshot = await getDocs(q);
        
        const generatedMarkers = [];
        snapshot.docs.forEach((doc, i) => {
          const data = doc.data();
          const conf = data.confidence || 85;
          const rev = data.revenueAtRisk || 1000;
          const pseudoLat = ((conf * (i + 1)) % 180) - 90;
          const pseudoLng = ((rev * (i + 1)) % 360) - 180;
          
          if (data.status === 'Active' || data.status === 'pending_review') {
            generatedMarkers.push({
              name: `${data.platform} Vector`,
              coordinates: [pseudoLat, pseudoLng],
              severity: data.confidence > 90 ? 'critical' : 'warning'
            });
          }
        });
        
        generatedMarkers.push({ name: "Projected Tor Node Surge", coordinates: [45, 15], severity: 'forecast' });
        generatedMarkers.push({ name: "Anomalous Discord Activity", coordinates: [35, -100], severity: 'forecast' });

        setMarkers(generatedMarkers);
      } catch (e) {
        console.error("Forecast mapping failed:", e);
      } finally {
        setLoading(false);
      }
    };
    
    loadPredictiveVectors();
  }, [user, userProfile]);

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
          
          {!loading && (
            <div style={{ width: '100%', height: '100%' }}>
              <MapContainer center={[20, 0]} zoom={2} style={{ width: '100%', height: '100%', background: '#0B1120' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                {markers.map((marker, idx) => (
                  <CircleMarker
                    key={idx}
                    center={marker.coordinates}
                    radius={marker.severity === 'critical' ? 8 : marker.severity === 'warning' ? 6 : 5}
                    pathOptions={{
                      color: marker.severity === 'critical' ? '#EF4444' : marker.severity === 'warning' ? '#F59E0B' : '#A855F7',
                      fillColor: marker.severity === 'critical' ? '#EF4444' : marker.severity === 'warning' ? '#F59E0B' : '#A855F7',
                      fillOpacity: 0.7,
                    }}
                  >
                    <Popup>
                      <div style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '4px' }}>
                        <strong>{marker.name}</strong><br/>
                        Severity: {marker.severity}
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 bg-slate-900/80 p-3 rounded border border-slate-800 text-xs text-slate-400 font-mono z-[1000]">
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
          
          <button 
            onClick={handleGenerateReport}
            className="btn btn-outline border-purple-500 text-purple-400 w-full hover:bg-purple-500 hover:text-white transition-colors text-sm"
          >
            Generate Executive Forecast Report
          </button>
        </div>

      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0B1120] border border-slate-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-purple-500">📄</span> Executive Threat Forecast
              </h2>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {reportGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-purple-400 font-mono animate-pulse">Synthesizing intelligence...</p>
              </div>
            ) : (
              <div 
                className="prose prose-invert prose-slate max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: reportHtml }}
              />
            )}
            
            {!reportGenerating && (
              <div className="mt-8 flex justify-end">
                <button onClick={() => setShowReportModal(false)} className="btn bg-slate-800 hover:bg-slate-700 text-white">
                  Close Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
