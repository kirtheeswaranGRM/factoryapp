import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface HourlyReportProps {
    visible: boolean;
    onClose: () => void;
    machineData: any;
    currentTotalCount: number;  
    lastReportCount: number;    
    serverUrl: string;
    onSuccess: (newCount: number) => void; 
}

export default function HourlyReportModal({
    visible, onClose, machineData, currentTotalCount, lastReportCount, serverUrl, onSuccess 
}: HourlyReportProps) {

    const [intervalProduction, setIntervalProduction] = useState(0);
    const [frozenTotal, setFrozenTotal] = useState(0);
    
    const [chillerOk, setChillerOk] = useState(false);
    const [compressorOk, setCompressorOk] = useState(false);
    const [mouldOk, setMouldOk] = useState(false);
    const [machineOk, setMachineOk] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            const current = Number(currentTotalCount) || 0;
            const startOfWindow = Number(lastReportCount) || 0;
            
            // Calculate exactly what was made since the last 2-minute trigger
            const delta = current - startOfWindow;

            setIntervalProduction(delta >= 0 ? delta : 0);
            setFrozenTotal(current);
        } else {
            // Reset fields for the next interval
            setChillerOk(false);
            setCompressorOk(false);
            setMouldOk(false);
            setMachineOk(false);
            setRemarks('');
        }
    }, [visible, currentTotalCount, lastReportCount]); 

    const handleUpdate = async () => {
        setIsSubmitting(true);
        
        const payload = {
            machine_id: Array.isArray(machineData.id) ? machineData.id[0] : machineData.id,
            machine_name: machineData.name,
            total_output: frozenTotal, 
            hourly_output: intervalProduction, 
            chiller_check: chillerOk,
            compressor_check: compressorOk,
            mould_check: mouldOk,
            machine_check: machineOk,
            remarks: remarks,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch(`${serverUrl}/hourly_logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                Alert.alert("Success", "Report stored in Hourly Logs.");
                // Passing frozenTotal back to MachineDetail to reset the 'lastReportCount'
                onSuccess(frozenTotal); 
                onClose();
            } else {
                Alert.alert("Error", "PostgreSQL rejection.");
            }
        } catch (error) {
            Alert.alert("Error", "Server connection failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.headerText}>INTERVAL PRODUCTION REPORT</Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        
                        <View style={styles.reportBox}>
                            <Text style={styles.label}>PRODUCTION IN THIS INTERVAL</Text>
                            <Text style={styles.bigValue}>{intervalProduction} Units</Text>
                            <Text style={styles.subLabel}>Current Total: {frozenTotal}</Text>
                        </View>

                        <Text style={styles.sectionLabel}>MACHINE STATUS</Text>
                        <View style={styles.checkGrid}>
                            <CheckItem label="Chiller" val={chillerOk} set={setChillerOk} />
                            <CheckItem label="Compressor" val={compressorOk} set={setCompressorOk} />
                            <CheckItem label="Mould" val={mouldOk} set={setMouldOk} />
                            <CheckItem label="Machine" val={machineOk} set={setMachineOk} />
                        </View>

                        <Text style={styles.sectionLabel}>REMARKS</Text>
                        <TextInput 
                            style={styles.input} 
                            multiline 
                            value={remarks} 
                            onChangeText={setRemarks} 
                            placeholder="Add observations..." 
                            placeholderTextColor="#475569" 
                        />
                    </ScrollView>

                    <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.btnText}>DISCARD</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.submitBtn} 
                            onPress={handleUpdate}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.btnText}>SUBMIT REPORT</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const CheckItem = ({ label, val, set }: any) => (
    <TouchableOpacity style={styles.checkItem} onPress={() => set(!val)}>
        <Text style={styles.checkText}>{label}</Text>
        <Switch 
            value={val} 
            onValueChange={set} 
            trackColor={{ false: "#334155", true: "#10B981" }} 
            thumbColor="#fff"
        />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    container: { backgroundColor: '#1E293B', width: '90%', borderRadius: 20, padding: 20, maxHeight: '80%' },
    headerText: { color: '#3B82F6', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    reportBox: { backgroundColor: '#0F172A', padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 2, borderColor: '#10B981', marginBottom: 20 },
    label: { color: '#10B981', fontSize: 12, fontWeight: 'bold' },
    bigValue: { color: 'white', fontSize: 42, fontWeight: 'bold', marginVertical: 5 },
    subLabel: { color: '#64748B', fontSize: 10 },
    sectionLabel: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    input: { backgroundColor: '#0F172A', color: 'white', padding: 12, borderRadius: 10, height: 60, textAlignVertical: 'top' },
    checkGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    checkItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', padding: 10, borderRadius: 10, width: '48%', marginBottom: 10 },
    checkText: { color: '#94A3B8', fontSize: 12, flex: 1 },
    btnRow: { flexDirection: 'row', marginTop: 20 },
    cancelBtn: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#334155', borderRadius: 10, marginRight: 5 },
    submitBtn: { flex: 2, padding: 15, alignItems: 'center', backgroundColor: '#3B82F6', borderRadius: 10, marginLeft: 5 },
    btnText: { color: 'white', fontWeight: 'bold' }
});