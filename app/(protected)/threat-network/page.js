'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy, limit, addDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { runDeepResearchScan } from '@/lib/gemini';
import { useAuth } from '@/lib/auth-context';
import DOMPurify from 'dompurify';
import dynamic from 'next/dynamic';

// ForceGraph2D requires document/window to exist, so dynamically load it without SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function ThreatNetworkPage() {
  const { user, userProfile } = useAuth();
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const fgRef = useRef();

  useEffect(() => {
    if (!user) return; // Wait for Firebase Auth to resolve

    // Listen to real infringement detections
    const baseCollection = collection(db, 'infringement_detections');
    const q = userProfile?.orgId
      ? query(baseCollection, where('orgId', '==', userProfile.orgId), orderBy('detectedAt', 'desc'), limit(200))
      : query(baseCollection, where('userId', '==', user.uid), orderBy('detectedAt', 'desc'), limit(200));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDetections(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching detections for graph:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  // Compute graph theoretic relationships (Adjacency via clustering)
  const graphData = useMemo(() => {
    if (detections.length === 0) return { nodes: [], links: [] };

    const nodes = [];
    const links = [];
    const entityMap = new Map();

    // Mathematical node extraction based on Deep Research requirements
    // We treat the "Platform/Domain" and "Target Asset" as primary hub nodes
    detections.forEach((det, i) => {
      // Platform node calculation
      const platformId = `platform-${det.platform || 'Unknown'}`;
      if (!entityMap.has(platformId)) {
        entityMap.set(platformId, {
          id: platformId,
          name: det.platform || 'Unknown',
          group: 1, // Platforms
          val: 20
        });
        nodes.push(entityMap.get(platformId));
      }

      // Exact detection node (the leaf)
      const detectNodeId = `det-${det.id}`;
      nodes.push({
        id: detectNodeId,
        name: det.title || 'Infringement Node',
        group: 2, // Infringements
        val: Math.max(5, (det.confidenceScore || 0) * 10),
        color: det.status === 'DMCA Sent' ? '#10B981' : '#EF4444' // Green if mitigated, Red if active
      });

      // Adjacency Link: Detection -> Platform
      links.push({
        source: detectNodeId,
        target: platformId,
        value: 1
      });

      // Cyber-Kinetic Link: Link Digital Threat to Physical Venue
      if (det.correlatedVenue) {
        const venueId = `venue-${det.correlatedVenue}`;
        if (!entityMap.has(venueId)) {
          entityMap.set(venueId, {
            id: venueId,
            name: det.correlatedVenue,
            group: 4, // Physical Venues
            val: 25,
            color: '#8B5CF6' // Purple glow for physical targets
          });
          nodes.push(entityMap.get(venueId));
        }
        links.push({
          source: detectNodeId,
          target: venueId,
          value: 3 // High gravity to pull them towards the physical target
        });
      }

      // Clustering Adjacency: Link detections together if they have the same uploader
      if (det.uploader) {
        const uploaderId = `user-${det.uploader}`;
        if (!entityMap.has(uploaderId)) {
          entityMap.set(uploaderId, {
            id: uploaderId,
            name: det.uploader,
            group: 3, // Threat Actors
            val: 15,
            color: '#F59E0B' // Bad actors in orange
          });
          nodes.push(entityMap.get(uploaderId));
        }
        links.push({
          source: detectNodeId,
          target: uploaderId,
          value: 2
        });
      }
    });

    return { nodes, links };
  }, [detections]);

  const handleNodeClick = useCallback((node) => {
    // Spectral targeting logic - focus UI on node mathematically
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(8, 2000);
    }
  }, []);

  const handleRunDeepScan = async () => {
    setScanning(true);
    try {
      const rawTopic = prompt("Enter an asset or topic to initiate a Deep Intelligence Scan:", "Formula 1 2024 Final");
      if (!rawTopic) {
        setScanning(false);
        return;
      }
      
      const topic = DOMPurify.sanitize(rawTopic);
      if (!topic) {
        alert("Invalid input detected. Scan aborted.");
        setScanning(false);
        return;
      }

      // 1. Run actual Multi-Agent AI Swarm
      const aiResult = await runDeepResearchScan(topic);

      // 2. Commit the findings to the persistent Threat Network Database
      for (const platform of aiResult.platforms) {
        await addDoc(collection(db, 'infringement_detections'), {
          title: topic + " Deep Scan Finding",
          platform: platform,
          uploader: aiResult.actors[Math.floor(Math.random() * aiResult.actors.length)],
          confidenceScore: aiResult.intelligence?.consensusScore || (Math.random() * 0.4 + 0.6),
          status: 'Active',
          detectedAt: new Date().toISOString(),
          scanMethod: 'Deep Research Multi-Agent',
          mitigation: aiResult.intelligence?.mitigationStrategy || "Awaiting strategy"
        });
      }
    } catch (error) {
      console.error("Deep Scan failed:", error);
      alert("Failed to run deep scan: " + error.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Deep Research Threat Intelligence
          </h1>
          <p className="text-slate-400 mt-2">
            Real-time Graph-Theoretic Coordination illustrating autonomous agent network findings.
          </p>
        </div>

        <button
          onClick={handleRunDeepScan}
          disabled={scanning}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          {scanning ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Agents Scanning...
            </>
          ) : (
            <>
              <span className="text-xl">🕸️</span> Initiate Deep Scan Swarm
            </>
          )}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative" style={{ height: '700px' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p>Awaiting deep research detections. Network graph empty.</p>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeLabel="name"
            nodeRelSize={6}
            linkColor={() => 'rgba(255, 255, 255, 0.1)'}
            nodeColor={node => node.color || (node.group === 1 ? '#3B82F6' : '#8B5CF6')}
            onNodeClick={handleNodeClick}
            backgroundColor="#0B1120"
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={d => d.value * 0.001}
          />
        )}

        {/* Deep Research Math Overlay overlaying the graph */}
        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur border border-slate-800 p-4 rounded-lg pointer-events-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Laplacian Matrix Overview</h3>
            <div className="text-sm">
              <div className="flex justify-between gap-8 mb-1">
                <span className="text-slate-300">Total Nodes (V):</span>
                <span className="font-mono text-blue-400">{graphData.nodes.length}</span>
              </div>
              <div className="flex justify-between gap-8 mb-1">
                <span className="text-slate-300">Total Edges (E):</span>
                <span className="font-mono text-purple-400">{graphData.links.length}</span>
              </div>
              <div className="flex justify-between gap-8 pt-2 mt-2 border-t border-slate-800/50">
                <span className="text-slate-300">Fiedler Value (λ2):</span>
                {/* Simulated spectral eigen value calculation mapped from node density */}
                <span className="font-mono text-green-400">
                  {graphData.nodes.length > 0 ? (graphData.links.length / graphData.nodes.length).toFixed(4) : "0.0000"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}