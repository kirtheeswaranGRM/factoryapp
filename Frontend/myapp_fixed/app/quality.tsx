import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { SERVER_URL } from '../constants/ApiConfig';

export default function QAScreen() {
    const router = useRouter();
    const [machines, setMachines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMachine, setSelectedMachine] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());

    // --- QC INPUT STATES ---
    const [lastHourProd, setLastHourProd] = useState('');
    const [avgWeight, setAvgWeight] = useState('');
    const [rejectionPcs, setRejectionPcs] = useState('');
    const [qcRemarks, setQcRemarks] = useState('');

    const fetchMachines = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/machines`);
            const data = await res.json();
            if (Array.isArray(data)) setMachines(data);
            
            if (selectedMachine) {
                const updated = data.find((m: any) => (m.id || m.machine_id) === (selectedMachine.id || selectedMachine.machine_id));
                if (updated) setSelectedMachine(updated);
            }
        } catch (e) { 
            console.log("Network Error"); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMachines();
        const interval = setInterval(fetchMachines, 3000); 
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    }, [selectedMachine]);

    const handleLogout = () => {
        Alert.alert("Logout", "Confirm exit?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", onPress: () => router.replace('/') }
        ]);
    };

    const handleSaveQC = async () => {
        if (!lastHourProd || !avgWeight) {
            Alert.alert("Required", "Please enter Production and Weight details.");
            return;
        }

        const qcData = {
            machine_id: selectedMachine?.id || selectedMachine?.machine_id,
            last_hour_production: lastHourProd,
            average_weight: avgWeight,
            rejection_pcs: rejectionPcs || '0',
            remarks: qcRemarks,
            timestamp: new Date().toISOString()
        };

        try {
            const res = await fetch(`${SERVER_URL}/qc_logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(qcData),
            });

            if (res.ok) {
                Alert.alert("Success", "QC Inspection Saved");
                setModalVisible(false);
                setLastHourProd(''); setAvgWeight(''); setRejectionPcs(''); setQcRemarks('');
            }
        } catch (e) { 
            Alert.alert("Error", "Server Connection Failed"); 
        }
    };

    if (loading && machines.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>QA MONITORING</Text>
                    <Text style={styles.subtitle}>Factory Floor List</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>LOGOUT</Text>
                </TouchableOpacity>
            </View>
            
            <FlatList
                data={machines}
                keyExtractor={(item, index) => (item?.id || item?.machine_id || index).toString()}
                renderItem={({ item }: any) => (
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        style={styles.machineCard}
                        onPress={() => { setSelectedMachine(item); setModalVisible(true); }}
                    >
                        <View style={styles.cardContent}>
                            <View>
                                <Text style={styles.unitIdText}>UNIT {item.id || item.machine_id}</Text>
                                <Text style={styles.moldText}>{item.mold_type || 'NO MOLD'}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: item.status === 'running' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                                <Text style={[styles.statusBadgeText, { color: item.status === 'running' ? '#10B981' : '#EF4444' }]}>
                                    {item.status ? item.status.toUpperCase() : 'OFFLINE'}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIndicator} />
                        
                        <Text style={styles.modalHeader}>UNIT {selectedMachine?.id || selectedMachine?.machine_id} INSPECTION</Text>
                        <View style={styles.timeTag}>
                            <Text style={styles.timeTagText}>{currentTime}</Text>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.infoSection}>
                                <View style={styles.row}>
                                    <DetailItem label="Status" value={selectedMachine?.status} color={selectedMachine?.status === 'running' ? '#10B981' : '#EF4444'} />
                                    <DetailItem label="Material" value={selectedMachine?.material_type} />
                                </View>
                                <View style={styles.row}>
                                    <DetailItem label="Mold" value={selectedMachine?.mold_type} />
                                    <DetailItem label="Cavity" value={selectedMachine?.cavity} />
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.label}>LAST 1 HR PRODUCTION (PCS)</Text>
                                <TextInput style={styles.input} keyboardType="numeric" value={lastHourProd} onChangeText={setLastHourProd} placeholder="0" placeholderTextColor="#475569" />

                                <Text style={styles.label}>AVERAGE WEIGHT (GMS)</Text>
                                <TextInput style={styles.input} keyboardType="numeric" value={avgWeight} onChangeText={setAvgWeight} placeholder="0.00" placeholderTextColor="#475569" />

                                <Text style={styles.label}>REJECTION PIECES</Text>
                                <TextInput style={styles.input} keyboardType="numeric" value={rejectionPcs} onChangeText={setRejectionPcs} placeholder="0" placeholderTextColor="#475569" />

                                <Text style={styles.label}>QC REMARKS</Text>
                                <TextInput style={[styles.input, {height: 70}]} multiline value={qcRemarks} onChangeText={setQcRemarks} placeholder="Notes..." placeholderTextColor="#475569" />
                            </View>

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveQC}>
                                <Text style={styles.saveBtnText}>SUBMIT INSPECTION</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeBtnText}>CANCEL</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const DetailItem = ({ label, value, color }: any) => (
    <View style={{ flex: 1, marginBottom: 8 }}>
        <Text style={{ color: '#64748B', fontSize: 10, fontWeight: 'bold' }}>{label.toUpperCase()}</Text>
        <Text style={{ color: color || 'white', fontSize: 14, fontWeight: '700' }}>{value || 'N/A'}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617', paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60, marginBottom: 20 },
    title: { color: 'white', fontSize: 22, fontWeight: '900' },
    subtitle: { color: '#64748B', fontSize: 12 },
    logoutBtn: { backgroundColor: '#1E293B', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 11 },
    
    // Minimalist Card
    machineCard: {
        backgroundColor: '#1E293B',
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardContent: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: 18 
    },
    unitIdText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    moldText: { color: '#64748B', fontSize: 12, marginTop: 2 },
    statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
    statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
    
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.9)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '90%' },
    modalIndicator: { width: 30, height: 4, backgroundColor: '#334155', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
    modalHeader: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    timeTag: { alignSelf: 'center', backgroundColor: '#0F172A', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 15, marginTop: 8, marginBottom: 15 },
    timeTagText: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
    infoSection: { backgroundColor: '#0F172A', padding: 15, borderRadius: 12, marginBottom: 20 },
    row: { flexDirection: 'row' },
    formSection: { gap: 10 },
    label: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
    input: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12, color: 'white', borderWidth: 1, borderColor: '#334155' },
    saveBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    closeBtn: { padding: 15, alignItems: 'center' },
    closeBtnText: { color: '#64748B', fontWeight: 'bold' }
});