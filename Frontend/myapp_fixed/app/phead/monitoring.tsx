import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import your central API config
import { SERVER_URL } from '../../constants/ApiConfig';

// --- TYPES ---
interface Machine {
    id: string; 
    status: string;
    total_output: number;
    start_time: string | null; 
    material_type: string;
    mold_type: string;
    cavity: string;
    shift: string;
}

// --- SUB-COMPONENT: HANDLES THE 5-SECOND LIVE MATH ---
const LiveOutputText = ({ item }: { item: Machine }) => {
    const [count, setCount] = useState(item.total_output || 0);

    useEffect(() => {
        let interval: any = null; 

        if (item.status?.toLowerCase() === 'running' && item.start_time) {
            const updateCount = () => {
                const start = new Date(item.start_time!).getTime();
                const now = new Date().getTime();
                
                // MATH: Calculate how many 5-second blocks have passed
                const diffSeconds = Math.floor((now - start) / 1000);
                const calculated = Math.floor(diffSeconds / 5); 
                
                setCount(calculated > 0 ? calculated : 0);
            };

            updateCount(); // Run immediately on load
            interval = setInterval(updateCount, 1000); // Update UI every second for smoothness
        } else {
            // If idle, just show the last saved total_output from PostgreSQL
            setCount(item.total_output || 0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [item.status, item.start_time, item.total_output]);

    return (
        <Text style={styles.statVal}>
            {count} <Text style={styles.unitText}>PCS</Text>
        </Text>
    );
};

// --- MAIN MONITORING SCREEN ---
export default function MonitoringScreen() {
    const router = useRouter();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch data from machine_status table
    const fetchStatus = async () => {
        try {
            const response = await fetch(`${SERVER_URL}/machines`);
            const data = await response.json();
            if (Array.isArray(data)) {
                // Keep machines in order 1, 2, 3...
                setMachines(data.sort((a, b) => Number(a.id) - Number(b.id)));
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Background sync every 10 seconds to get status changes (Running/Idle)
        const syncInterval = setInterval(fetchStatus, 10000); 
        return () => clearInterval(syncInterval);
    }, []);

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase();
        if (s === 'running') return '#10B981'; // Green
        if (s === 'idle') return '#F59E0B';    // Orange
        return '#EF4444';                      // Red
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Unit Monitoring</Text>
                    <Text style={styles.subtitle}>{machines.length} Machines reporting live</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : (
                <FlatList
                    data={machines}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={1}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={() => {setRefreshing(true); fetchStatus();}} 
                            tintColor="#10B981" 
                        />
                    }
                    renderItem={({ item }) => (
                        <View style={styles.wideCard}>
                            {/* TOP SECTION */}
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.unitNum}>UNIT {item.id}</Text>
                                    <View style={styles.statusRow}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                                        <Text style={[styles.statusLabel, { color: getStatusColor(item.status) }]}>
                                            {item.status?.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.shiftBadge}>
                                    <Text style={styles.shiftText}>{item.shift?.toUpperCase() || 'NO SHIFT'}</Text>
                                </View>
                            </View>

                            {/* OUTPUT SECTION */}
                            <View style={styles.mainStats}>
                                <View>
                                    <Text style={styles.statLabel}>ACTUAL OUTPUT (LIVE)</Text>
                                    <LiveOutputText item={item} />
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* DETAILS GRID */}
                            <View style={styles.detailGrid}>
                                <View style={styles.detailBox}>
                                    <Text style={styles.detailLabel}>MATERIAL</Text>
                                    <Text style={styles.detailVal} numberOfLines={1}>{item.material_type || 'N/A'}</Text>
                                </View>
                                <View style={styles.detailBox}>
                                    <Text style={styles.detailLabel}>MOLD TYPE</Text>
                                    <Text style={styles.detailVal} numberOfLines={1}>{item.mold_type || 'N/A'}</Text>
                                </View>
                                <View style={styles.detailBox}>
                                    <Text style={styles.detailLabel}>CAVITY</Text>
                                    <Text style={styles.detailVal}>{item.cavity || 'N/A'}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    backBtn: { marginRight: 15, padding: 8, backgroundColor: '#1E293B', borderRadius: 10 },
    title: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    subtitle: { color: '#64748B', fontSize: 13 },
    listContainer: { paddingHorizontal: 15, paddingBottom: 30 },
    wideCard: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    unitNum: { color: '#F59E0B', fontSize: 18, fontWeight: '900' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
    shiftBadge: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    shiftText: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold' },
    mainStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
    statLabel: { color: '#64748B', fontSize: 10, fontWeight: 'bold' },
    statVal: { color: 'white', fontSize: 32, fontWeight: '900' },
    unitText: { fontSize: 14, color: '#475569' },
    divider: { height: 1, backgroundColor: '#334155', marginVertical: 15, opacity: 0.5 },
    detailGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    detailBox: { flex: 1 },
    detailLabel: { color: '#475569', fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
    detailVal: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
});