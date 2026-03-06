import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Import your central API config
import { SERVER_URL } from '../constants/ApiConfig';
import { fetchWithTimeout } from '../utils/fetchTimeout';

export default function MachineryList() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now()); // For live UI ticking
  const router = useRouter();

  // --- LOGIC: FETCH DATA FROM DATABASE ---
  const syncData = async () => {
    try {
      const response = await fetchWithTimeout(`${SERVER_URL}/machines`, {}, 5000);
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        const sortedData = [...data].sort((a, b) => {
          const idA = a.id || a.machine_id || 0;
          const idB = b.id || b.machine_id || 0;
          return idA - idB;
        });
        setMachines(sortedData);
      }
    } catch (error) {
      console.log("Server error - check connection to Node.js");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncData(); 
    const interval = setInterval(syncData, 2000); 
    const uiTicker = setInterval(() => setNow(Date.now()), 1000); // Smooth live update
    return () => {
      clearInterval(interval);
      clearInterval(uiTicker);
    };
  }, []);

  // --- UPDATED GLOBAL ACTIONS TO MATCH BACKEND ---
  const handlePauseAll = () => {
    console.log("[DEBUG] Pause All button clicked");
    
    const performPause = async () => {
      console.log("[DEBUG] Proceeding with Pause All API call");
      try {
        const res = await fetchWithTimeout(`${SERVER_URL}/machines/power-toggle`, { 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'pause' }) 
        }, 10000);
        
        console.log(`[DEBUG] Pause All response status: ${res.status}`);
        
        if (res.ok) {
          const data = await res.json();
          console.log("[DEBUG] Pause All success", data);
          Alert.alert("Success", `Paused ${data.updatedCount || 0} machines`);
          syncData();
        } else {
          const errBody = await res.json().catch(() => ({}));
          console.error("[DEBUG] Pause All server error", errBody);
          Alert.alert("Error", `Server failed: ${errBody.error || "Unknown error"}`);
        }
      } catch (e) { 
        console.error("[DEBUG] Pause All network error", e);
        Alert.alert("Error", "Could not reach server"); 
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Freeze production for all machines?")) {
        performPause();
      }
    } else {
      Alert.alert("Confirm Pause", "Freeze production for all machines?", [
        { text: "Cancel", style: "cancel" },
        { 
          text: "PAUSE ALL", 
          style: "destructive",
          onPress: performPause
        }
      ]);
    }
  };

  const handleResumeAll = async () => {
    console.log("[DEBUG] Resume All button clicked");
    try {
      const res = await fetchWithTimeout(`${SERVER_URL}/machines/power-toggle`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }) 
      }, 10000);
      
      console.log(`[DEBUG] Resume All response status: ${res.status}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log("[DEBUG] Resume All success", data);
        Alert.alert("Success", `Resumed ${data.updatedCount || 0} machines`);
        syncData();
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error("[DEBUG] Resume All server error", errBody);
        Alert.alert("Error", `Server failed: ${errBody.error || "Unknown error"}`);
      }
    } catch (e) { 
      console.error("[DEBUG] Resume All network error", e);
      Alert.alert("Error", "Could not reach server"); 
    }
  };

  // --- HELPER: CALCULATE FROZEN VS LIVE COUNT ---
  const getDisplayCount = (m) => {
    const base = m.accumulated_output || 0;
    const status = String(m.status).toLowerCase();

    // If machine is NOT running or no session started: Show frozen base
    // Use resume_time or start_time because it represents the last resume/start event
    if (status !== 'running' || (!m.resume_time && !m.start_time)) {
      return base;
    }

    // Calculate live session + base using the most recent start/resume time
    const sessionTime = new Date(m.resume_time || m.start_time).getTime();
    const elapsedSeconds = (now - sessionTime) / 1000;
    const cycleTime = m.cycle_timing || 5; 
    const cavity = m.cavity || 1;

    const livePieces = Math.floor(elapsedSeconds / cycleTime) * cavity;
    return base + livePieces;
  };

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
          <Text style={styles.logoutTxt}>LOGOUT</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FACTORY MONITOR</Text>
        <View style={{ width: 70 }} /> 
      </View>

      <View style={styles.masterControlBar}>
        <TouchableOpacity 
          style={[styles.masterBtn, styles.pauseBtn]} 
          onPress={handlePauseAll}
        >
          <Text style={styles.masterBtnText}>⏸ PAUSE ALL</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.masterBtn, styles.resumeBtn]} 
          onPress={handleResumeAll}
        >
          <Text style={styles.masterBtnText}>▶ RESUME ALL</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {machines.map((m, index) => {
          const mId = m?.id || m?.machine_id || (index + 1);
          const mName = m?.machine_name ?? `Machine ${mId}`;
          const mStatus = m?.status ?? "idle";
          
          const isRunning = String(mStatus).toLowerCase() === 'running';
          const isPaused = String(mStatus).toLowerCase() === 'paused' || String(mStatus).toLowerCase() === 'power_cut';

          return (
            <TouchableOpacity 
              key={mId.toString()} 
              style={[
                styles.card, 
                isRunning && styles.cardActive,
                isPaused && styles.cardPaused
              ]}
              onPress={() => router.push({ 
                pathname: "/machinedetail", 
                params: { id: mId } 
              })}
            >
              <View style={styles.infoArea}>
                <Text style={styles.unitTag}>UNIT {mId}</Text>
                <Text style={styles.machineName}>{mName}</Text>
                <Text style={styles.countTxt}>{getDisplayCount(m)} PCS</Text>
              </View>

              <View style={[
                styles.badge, 
                { backgroundColor: isRunning ? '#10B981' : isPaused ? '#F59E0B' : '#475569' }
              ]}>
                <Text style={styles.badgeText}>{String(mStatus).toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  header: { 
    backgroundColor: '#1E293B', 
    paddingTop: Platform.OS === 'ios' ? 60 : 45, 
    paddingBottom: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15
  },
  masterControlBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  masterBtn: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3
  },
  pauseBtn: { backgroundColor: '#F59E0B' },
  resumeBtn: { backgroundColor: '#10B981' },
  masterBtnText: { color: 'white', fontWeight: '900', fontSize: 13 },
  logoutBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#EF4444' },
  logoutTxt: { color: '#EF4444', fontWeight: 'bold' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  card: { 
    backgroundColor: '#1E293B', 
    padding: 25, 
    borderRadius: 15, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center'
  },
  cardActive: { borderLeftWidth: 8, borderLeftColor: '#10B981' },
  cardPaused: { borderLeftWidth: 8, borderLeftColor: '#F59E0B' },
  infoArea: { flex: 1 },
  unitTag: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold' },
  machineName: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  countTxt: { color: '#10B981', fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  badge: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, minWidth: 90, alignItems: 'center' },
  badgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 }
});