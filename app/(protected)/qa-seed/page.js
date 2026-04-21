'use client';

import { useState } from 'react';
import { collection, addDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

export default function SeedPage() {
  const { user, userProfile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [seeding, setSeeding] = useState(false);

  const log = (msg) => setLogs(p => [...p, msg]);

  const handleSeed = async () => {
    if (!user) return log('Not authenticated');
    setSeeding(true);
    log('Starting Golden Dataset Seed...');

    try {
      const orgId = userProfile?.orgId || null;
      const userId = user.uid;
      const ownerQuery = orgId ? { orgId } : { userId };

      // 1. Venues
      const venues = [
        { name: "Blue Bottle Cafe", type: "retail", capacity: 20, zones: ['Main Floor', 'Kitchen'] },
        { name: "Grand Hyatt Regency", type: "hotel", capacity: 1200, zones: ['Lobby', 'Pool', 'Restaurant', 'Ballroom', 'Parking'] },
        { name: "Guardian Stadium", type: "stadium", capacity: 85000, zones: Array.from({length: 20}, (_, i) => `Section ${i+1}`) }
      ];

      for (let v of venues) {
        await addDoc(collection(db, 'venues'), { ...v, ...ownerQuery });
        log(`Seeded Venue: ${v.name}`);
      }

      // 2. Policies
      for(let i=1; i<=5; i++) {
         await addDoc(collection(db, 'enforcement_policies'), {
           ...ownerQuery,
           targetPlatform: ['Telegram', 'Discord', 'YouTube', 'IPFS', 'WhatsApp'][i%5],
           confidenceThreshold: 80 + i,
           revenueThreshold: i * 5000,
           action: 'AUTO_DMCA_DISPATCH',
           status: 'ACTIVE',
           createdAt: new Date().toISOString()
         });
      }
      log('Seeded 5 Policies');

      // 3. Detections
      const platforms = ['Telegram', 'Discord', 'YouTube', 'X', 'IPFS', 'DarkWeb'];
      const statuses = ['Active', 'Active', 'Mitigating', 'DMCA Sent', 'Resolved'];
      for(let i=0; i<30; i++) {
        await addDoc(collection(db, 'infringement_detections'), {
          ...ownerQuery,
          title: `Golden Dataset Finding #${i+1} [EXTREMELY LONG STRING TEST TO VERIFY TRUNCATION IN THE UI AND PREVENT CSS BLEEDING OUT OF CARDS]`,
          platform: platforms[i % platforms.length],
          uploader: `ThreatActor_x${i%4}`,
          confidenceScore: 0.5 + (Math.random() * 0.49),
          status: statuses[i % statuses.length],
          detectedAt: new Date(Date.now() - Math.random() * 10000000).toISOString(),
          scanMethod: 'Deep Research QA',
          mitigation: "Awaiting strategy"
        });
      }
      log('Seeded 30 Detections');

      // 4. Audit Logs
      for(let i=0; i<20; i++) {
        await addDoc(collection(db, 'audit_log'), {
           ...ownerQuery,
           action: i % 2 === 0 ? 'DMCA Takedown Issued' : 'SOS Triggered',
           module: i % 2 === 0 ? 'ThreatNetwork' : 'CrisisCommand',
           user: userProfile?.email || 'admin@test.com',
           timestamp: new Date().toISOString(),
           details: `Simulated QA action #${i}`,
           cryptoSignature: `0x${Array(64).fill(0).map(()=>Math.random().toString(16)[2]).join('')}`,
           previousHash: `0x000000000000000000000000000000000000000`
        });
      }
      log('Seeded 20 Audit Logs');

      log('✅ Golden Dataset Seeding Complete!');
    } catch (e) {
      log(`Error: ${e.message}`);
    }
    setSeeding(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">QA Data Seeder</h1>
      <button 
        onClick={handleSeed} 
        disabled={seeding}
        className="bg-blue-600 px-4 py-2 rounded text-white font-bold"
      >
        {seeding ? 'Seeding...' : 'DO NOT PRESS EXCEPT FOR QA - INJECT GOLDEN DATA'}
      </button>

      <div className="mt-8 bg-slate-900 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
