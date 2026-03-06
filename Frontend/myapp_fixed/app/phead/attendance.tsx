import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert, FlatList,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';

// Import your central API config
import { SERVER_URL } from '../../constants/ApiConfig';

export default function AttendanceEnroll() {
    const router = useRouter();
    
    // Main Screen States
    const [selectedShift, setSelectedShift] = useState('Morning');
    const [operators, setOperators] = useState<any[]>([]); 
    const [attendanceMap, setAttendanceMap] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);
    
    // Management Modal States
    const [showManageModal, setShowManageModal] = useState(false);
    const [manageShift, setManageShift] = useState('Morning');
    const [manageId, setManageId] = useState('');
    const [manageName, setManageName] = useState('');
    const [deleteId, setDeleteId] = useState('');

    // Report Modal States
    const [showMonthlyModal, setShowMonthlyModal] = useState(false);
    const [reportShift, setReportShift] = useState('Morning');
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState<'from' | 'to' | null>(null);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => { fetchOperators(); }, [selectedShift]);

    const fetchOperators = async () => {
        setLoading(true);
        try {
            const statusRes = await fetch(`${SERVER_URL}/attendance/check?date=${today}&shift=${selectedShift}`);
            const statusData = await statusRes.json();
            setIsAlreadyMarked(statusData.alreadyMarked);

            const opRes = await fetch(`${SERVER_URL}/operators/${selectedShift}`);
            const opData = await opRes.json();
            setOperators(Array.isArray(opData) ? opData : []);
            setAttendanceMap({}); 
        } catch (error) { setOperators([]); }
        finally { setLoading(false); }
    };

    // MANAGEMENT: ADD OPERATOR
    const handleAddOperator = async () => {
        const idRegex = /^OP0\d+$/; 
        const cleanId = manageId.toUpperCase().trim();
        if (!idRegex.test(cleanId)) {
            Alert.alert("Wrong Format", "ID Number is wrong. It must start with OP0");
            return;
        }

        if (!manageName.trim()) {
            Alert.alert("Error", "Please enter a name");
            return;
        }

        const exists = operators.some(op => op.operator_id.toUpperCase() === cleanId);
        if (exists) {
            Alert.alert("ID Exists", "ID already exists in this shift.");
            return;
        }

        try {
            const res = await fetch(`${SERVER_URL}/operators/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    operator_id: cleanId, 
                    name: manageName.trim(), 
                    assigned_shift: manageShift 
                })
            });
            if (res.ok) {
                Alert.alert("Success", "Operator added.");
                setManageId(''); setManageName('');
                fetchOperators();
            }
        } catch (e) { Alert.alert("Error", "Connection failed"); }
    };

    // MANAGEMENT: DELETE OPERATOR
    const handleRemoveOperator = async (id: string) => {
        const formattedId = id.toUpperCase().trim();
        
        if (!formattedId.startsWith("OP0")) {
            Alert.alert("Wrong Format", "ID Number is wrong. Must start with OP0");
            return;
        }

        try {
            const checkRes = await fetch(`${SERVER_URL}/operators/${manageShift}`);
            const shiftOperators = await checkRes.json();
            
            const target = shiftOperators.find((op: any) => op.operator_id.toUpperCase() === formattedId);

            if (!target) {
                Alert.alert("Not Found", `No operator with ID ${formattedId} found in the ${manageShift} shift.`);
                return;
            }

            Alert.alert(
                "Confirm Delete", 
                `Remove this staff member from ${manageShift} shift?\n\nName: ${target.name}\nID: ${target.operator_id}`, 
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Delete Now", 
                        style: 'destructive', 
                        onPress: async () => {
                            try {
                                const res = await fetch(`${SERVER_URL}/operators/remove/${formattedId}`, { method: 'DELETE' });
                                if (res.ok) {
                                    Alert.alert("Deleted", "Operator removed successfully.");
                                    setDeleteId('');
                                    fetchOperators();
                                }
                            } catch (e) { Alert.alert("Error", "Server Error"); }
                        }
                    }
                ]
            );
        } catch (e) {
            Alert.alert("Error", "Could not verify operator details.");
        }
    };

    const handleFetchReport = () => {
        const f = fromDate.toISOString().split('T')[0];
        const t = toDate.toISOString().split('T')[0];
        const url = `${SERVER_URL}/attendance/report?from=${f}&to=${t}&shift=${reportShift}`;
        Linking.openURL(url).catch(() => Alert.alert("Error", "Check Connection."));
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || (showPicker === 'from' ? fromDate : toDate);
        setShowPicker(null);
        if (showPicker === 'from') setFromDate(currentDate);
        if (showPicker === 'to') setToDate(currentDate);
    };

    const handleEnroll = async () => {
        if (operators.length === 0 || isAlreadyMarked) return;
        if (Object.keys(attendanceMap).length < operators.length) {
            Alert.alert("Pending", "Mark everyone first."); return;
        }
        setIsSubmitting(true);
        try {
            const payload = operators.map(op => ({
                staff_id: op.operator_id, staff_name: op.name, shift: selectedShift,
                status: attendanceMap[op.operator_id], attendance_date: today
            }));
            const res = await fetch(`${SERVER_URL}/attendance/enroll`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            if (res.ok) { Alert.alert("Success", "Saved."); setIsAlreadyMarked(true); }
        } catch (e) { Alert.alert("Error", "Save failed"); }
        finally { setIsSubmitting(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={{flex:1, marginLeft: 15}}>
                    <Text style={styles.title}>Enrollment</Text>
                    <Text style={styles.dateText}>{today}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowManageModal(true)} style={[styles.headerBtn, {backgroundColor: '#475569'}]}>
                    <Ionicons name="settings" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowMonthlyModal(true)} style={[styles.headerBtn, {backgroundColor: '#3B82F6', marginLeft: 10}]}>
                    <Ionicons name="calendar" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.shiftContainer}>
                {['Morning', 'Night'].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setSelectedShift(s)} style={[styles.tab, selectedShift === s && styles.activeTab]}>
                        <Text style={[styles.tabText, selectedShift === s && {color: 'white'}]}>{s}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{flex: 1}}>
                <FlatList
                    data={operators}
                    keyExtractor={(item) => item.operator_id}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={{flex: 1}}>
                                <Text style={styles.nameText}>{item.name}</Text>
                                <Text style={styles.idText}>ID: {item.operator_id}</Text>
                            </View>
                            <View style={styles.actionRow}>
                                <TouchableOpacity disabled={isAlreadyMarked} onPress={() => setAttendanceMap({...attendanceMap, [item.operator_id]: 'Absent'})} style={[styles.btn, attendanceMap[item.operator_id] === 'Absent' && styles.bgRed]}>
                                    <Text style={styles.btnLabel}>A</Text>
                                </TouchableOpacity>
                                <TouchableOpacity disabled={isAlreadyMarked} onPress={() => setAttendanceMap({...attendanceMap, [item.operator_id]: 'Present'})} style={[styles.btn, attendanceMap[item.operator_id] === 'Present' && styles.bgGreen]}>
                                    <Text style={styles.btnLabel}>P</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleEnroll} style={[styles.enrollBtn, (isSubmitting || isAlreadyMarked) && { backgroundColor: '#334155' }]} disabled={isSubmitting || isAlreadyMarked}>
                    <Text style={styles.enrollText}>{isAlreadyMarked ? "SUBMITTED" : "ENROLL"}</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showManageModal} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <Text style={styles.modalTitle}>Staff Management</Text>
                            
                            <View style={styles.modalShiftToggle}>
                                {['Morning', 'Night'].map((s) => (
                                    <TouchableOpacity key={s} onPress={() => setManageShift(s)} style={[styles.modalTab, manageShift === s && styles.modalActiveTab]}>
                                        <Text style={[styles.modalTabText, manageShift === s && {color: 'white'}]}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.manageCard}>
                                <Text style={styles.cardLabel}>ADD OPERATOR TO {manageShift.toUpperCase()}</Text>
                                <TextInput style={styles.input} placeholder="ID (OP0...)" placeholderTextColor="#64748B" value={manageId} onChangeText={setManageId} autoCapitalize="characters" />
                                <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#64748B" value={manageName} onChangeText={setManageName} />
                                <TouchableOpacity onPress={handleAddOperator} style={styles.addBtn}><Text style={styles.btnLabel}>SAVE</Text></TouchableOpacity>
                            </View>

                            <View style={[styles.manageCard, {marginTop: 20}]}>
                                <Text style={styles.cardLabel}>DELETE FROM {manageShift.toUpperCase()}</Text>
                                <TextInput style={styles.input} placeholder="Enter ID (OP0...)" placeholderTextColor="#64748B" value={deleteId} onChangeText={setDeleteId} autoCapitalize="characters" />
                                <TouchableOpacity onPress={() => handleRemoveOperator(deleteId)} style={styles.deleteBtn}><Text style={styles.btnLabel}>DELETE</Text></TouchableOpacity>
                            </View>

                            <TouchableOpacity onPress={() => setShowManageModal(false)} style={styles.closeBtn}><Text style={styles.btnLabel}>CLOSE</Text></TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showMonthlyModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Attendance Report</Text>
                        <View style={styles.modalShiftToggle}>
                            {['Morning', 'Night'].map((s) => (
                                <TouchableOpacity key={s} onPress={() => setReportShift(s)} style={[styles.modalTab, reportShift === s && styles.modalActiveTab]}>
                                    <Text style={[styles.modalTabText, reportShift === s && {color: 'white'}]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.label}>From</Text>
                        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker('from')}>
                            <Text style={styles.dateValue}>{fromDate.toISOString().split('T')[0]}</Text>
                        </TouchableOpacity>
                        <Text style={styles.label}>To</Text>
                        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker('to')}>
                            <Text style={styles.dateValue}>{toDate.toISOString().split('T')[0]}</Text>
                        </TouchableOpacity>
                        {showPicker && <DateTimePicker value={showPicker === 'from' ? fromDate : toDate} mode="date" display="default" onChange={onDateChange} />}
                        <TouchableOpacity onPress={handleFetchReport} style={styles.fetchBtn}><Text style={styles.btnLabel}>FETCH</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowMonthlyModal(false)} style={styles.closeBtn}><Text style={styles.btnLabel}>CANCEL</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A', padding: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    iconBtn: { padding: 8, backgroundColor: '#1E293B', borderRadius: 10 },
    headerBtn: { padding: 12, borderRadius: 12 },
    title: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    dateText: { color: '#64748B', fontSize: 12 },
    shiftContainer: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, padding: 5, marginBottom: 20 },
    tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: '#3B82F6' },
    tabText: { color: '#64748B', fontWeight: 'bold', fontSize: 13 },
    card: { backgroundColor: '#1E293B', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    nameText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    idText: { color: '#64748B', fontSize: 12 },
    actionRow: { flexDirection: 'row', gap: 10 },
    btn: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    btnLabel: { color: 'white', fontWeight: 'bold' },
    bgGreen: { backgroundColor: '#10B981', borderColor: '#10B981' },
    bgRed: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
    footer: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#0F172A', paddingTop: 10 },
    enrollBtn: { backgroundColor: '#10B981', padding: 20, borderRadius: 15, alignItems: 'center' },
    enrollText: { color: 'white', fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#1E293B', width: '90%', padding: 25, borderRadius: 25, maxHeight: '85%' },
    modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    manageCard: { backgroundColor: '#0F172A', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#334155' },
    cardLabel: { color: '#3B82F6', fontSize: 11, fontWeight: 'bold', marginBottom: 12 },
    modalShiftToggle: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 12, padding: 5, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
    modalTab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
    modalActiveTab: { backgroundColor: '#3B82F6' },
    modalTabText: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },
    input: { backgroundColor: '#1E293B', color: 'white', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
    addBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 12, alignItems: 'center' },
    deleteBtn: { backgroundColor: '#EF4444', padding: 15, borderRadius: 12, alignItems: 'center' },
    label: { color: '#64748B', fontSize: 11, marginBottom: 5 },
    datePickerBtn: { backgroundColor: '#0F172A', padding: 15, borderRadius: 12, marginBottom: 15 },
    dateValue: { color: 'white', fontWeight: 'bold' },
    fetchBtn: { backgroundColor: '#10B981', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
    closeBtn: { backgroundColor: '#475569', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 15 }
});