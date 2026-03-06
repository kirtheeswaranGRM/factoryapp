import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';

// Import your central API config
import { SERVER_URL } from '../constants/ApiConfig';

export default function PHeadDashboard() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  const fetchCount = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/head/pending_reports`);
      if (response.ok) {
        const data = await response.json();
        setPendingCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.log(`Sync Error: Is server running at ${SERVER_URL}?`);
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PROD-HEAD</Text>
          <Text style={styles.subtitle}>Management Console</Text>
        </View>
        <TouchableOpacity style={styles.logout} onPress={() => router.replace('/')}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {/* 1. ATTENDANCE */}
        <TouchableOpacity 
          style={[styles.card, { borderColor: '#3B82F6' }]} 
          onPress={() => router.push('/phead/attendance')}
        >
          <Ionicons name="people" size={40} color="#3B82F6" />
          <Text style={styles.cardLabel}>ATTENDANCE</Text>
        </TouchableOpacity>

        {/* 2. REPORTS */}
        <TouchableOpacity 
          style={[styles.card, { borderColor: '#8B5CF6' }]} 
          onPress={() => router.push('/phead/reports')}
        >
          <Ionicons name="document-text" size={40} color="#8B5CF6" />
          <Text style={styles.cardLabel}>REPORTS</Text>
        </TouchableOpacity>

        {/* 3. MONITORING */}
        <TouchableOpacity 
          style={[styles.card, { borderColor: '#10B981' }]} 
          onPress={() => router.push('/phead/monitoring')}
        >
          <Ionicons name="speedometer" size={40} color="#10B981" />
          <Text style={styles.cardLabel}>MONITORING</Text>
        </TouchableOpacity>

        {/* 4. APPROVALS with Badge */}
        <TouchableOpacity 
          style={[styles.card, { borderColor: '#F59E0B' }]} 
          onPress={() => router.push('/phead/approvals')}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
          <Ionicons name="checkmark-done-circle" size={40} color="#F59E0B" />
          <Text style={styles.cardLabel}>APPROVALS</Text>
        </TouchableOpacity>

        {/* 5. INVENTORY */}
        <TouchableOpacity 
          style={[styles.card, { borderColor: '#0EA5E9' }]} 
          onPress={() => router.push('/phead/inventory')}
        >
          <Ionicons name="cube" size={40} color="#0EA5E9" />
          <Text style={styles.cardLabel}>INVENTORY</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Connected to: {SERVER_URL}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 40 },
  title: { color: 'white', fontSize: 32, fontWeight: '900' },
  subtitle: { color: '#64748B', fontSize: 14, fontWeight: 'bold' },
  logout: { backgroundColor: '#1E293B', padding: 12, borderRadius: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#1E293B', width: '47%', height: 150, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, position: 'relative' },
  cardLabel: { color: 'white', fontSize: 12, fontWeight: 'bold', marginTop: 15 },
  badge: { position: 'absolute', top: 15, right: 15, backgroundColor: '#EF4444', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, zIndex: 10 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '900' },
  footer: { marginTop: 'auto', alignItems: 'center' },
  footerText: { color: '#334155', fontSize: 10, fontWeight: 'bold' }
});