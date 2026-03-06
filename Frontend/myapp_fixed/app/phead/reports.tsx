import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    Modal,
    SafeAreaView, 
    ScrollView, 
    StatusBar, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View,
    ActivityIndicator
} from 'react-native';

// Import your central API config (Ensure this contains your PC's IP, not localhost)
import { SERVER_URL } from '../../constants/ApiConfig';

export default function ProductionManagement() {
    const router = useRouter();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // --- STATES ---
    const [showRangeModal, setShowRangeModal] = useState(false);
    const [reportType, setReportType] = useState(''); 
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- DATE HELPERS ---
    // Formats dates to YYYY-MM-DD for PostgreSQL compatibility
    const formatDate = (date: Date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    };

    const onFromChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowFromPicker(false);
        if (selectedDate) setFromDate(selectedDate);
    };

    const onToChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowToPicker(false);
        if (selectedDate) setToDate(selectedDate);
    };

    // --- HANDLERS ---
    const openRangeModal = (type: string) => {
        setReportType(type); // For Monthly Summary, this is 'monthly'
        setShowRangeModal(true);
    };

    /**
     * The Download Handler
     * Opens the PDF in the phone's browser based on the selected type and dates.
     */
    const handleDownload = async (type: string) => {
        let endpoint = "";
        
        // 1. Static Reports (No date range needed)
        if (type === 'operator_list') {
            endpoint = `/reports/operator_list_pdf`;
        } 
        // 2. Today's Hourly Report
        else if (type === 'prod_1hr') {
            endpoint = `/reports/production_hourly?date=${todayStr}`;
        }
        // 3. Date Range Reports (Monthly Summary)
        else if (type === 'range_fetch') {
            if (fromDate > toDate) {
                return Alert.alert("Error", "From Date cannot be after To Date.");
            }
            
            setLoading(true);
            const fromStr = formatDate(fromDate);
            const toStr = formatDate(toDate);
            
            // This maps 'monthly' selection to the 'monthly_summary' backend route
            const route = reportType === 'monthly' ? 'monthly_summary' : reportType;
            endpoint = `/reports/${route}?from=${fromStr}&to=${toStr}`;
        }

        try {
            const url = SERVER_URL + endpoint;
            
            // Check if URL can be opened
            const supported = await Linking.canOpenURL(url);
            
            if (supported) {
                // Open browser to trigger PDF download from Node.js
                await Linking.openURL(url);
                if (type === 'range_fetch') setShowRangeModal(false);
            } else {
                Alert.alert("Error", "Cannot reach the server URL: " + url);
            }
        } catch (e) { 
            Alert.alert("Error", "Download failed. Ensure your backend server is running."); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={{flex:1, marginLeft: 15}}>
                    <Text style={styles.title}>Production Reports</Text>
                    <Text style={styles.dateText}>Generated on: {todayStr}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{paddingBottom: 30}}>
                <Text style={styles.sectionTitle}>Main Reports</Text>
                
                <View style={styles.reportGrid}>
                    {/* MONTHLY SUMMARY - Opens Modal */}
                    <TouchableOpacity 
                        style={[styles.reportCard, {backgroundColor: '#8B5CF6', width: '100%'}]} 
                        onPress={() => openRangeModal('monthly')}
                    >
                        <Ionicons name="calendar" size={32} color="white" />
                        <Text style={styles.reportText}>Monthly Summary</Text>
                    </TouchableOpacity>

                    {/* OPERATOR LIST - Instant Download */}
                    <TouchableOpacity 
                        style={[styles.reportCard, {backgroundColor: '#6366F1'}]} 
                        onPress={() => handleDownload('operator_list')}
                    >
                        <Ionicons name="people" size={32} color="white" />
                        <Text style={styles.reportText}>Operator List</Text>
                    </TouchableOpacity>

                    {/* HOURLY PROD - Instant Download for Today */}
                    <TouchableOpacity 
                        style={[styles.reportCard, {backgroundColor: '#3B82F6'}]} 
                        onPress={() => handleDownload('prod_1hr')}
                    >
                        <Ionicons name="time" size={32} color="white" />
                        <Text style={styles.reportText}>Hourly Prod</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Date Range Selection Modal */}
            <Modal visible={showRangeModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>SELECT DATE RANGE</Text>
                        
                        <View style={styles.inputFlexRow}>
                            {/* From Date */}
                            <View style={styles.flexOne}>
                                <Text style={styles.label}>FROM</Text>
                                <TouchableOpacity style={styles.dateInputBox} onPress={() => setShowFromPicker(true)}>
                                    <Text style={{color: 'white', fontWeight: 'bold'}}>{formatDate(fromDate)}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{paddingHorizontal: 10, marginTop: 25}}>
                                <Ionicons name="arrow-forward" size={18} color="#475569" />
                            </View>

                            {/* To Date */}
                            <View style={styles.flexOne}>
                                <Text style={styles.label}>TO</Text>
                                <TouchableOpacity style={styles.dateInputBox} onPress={() => setShowToPicker(true)}>
                                    <Text style={{color: 'white', fontWeight: 'bold'}}>{formatDate(toDate)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity 
                            style={[styles.fetchButton, loading && {opacity: 0.7}]} 
                            onPress={() => handleDownload('range_fetch')}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons name="cloud-download-outline" size={22} color="white" />
                                    <Text style={styles.fetchButtonText}>FETCH DATA</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowRangeModal(false)} style={styles.cancelLink}>
                            <Text style={{color: '#94A3B8', fontWeight: 'bold'}}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Platform Native Date Pickers */}
            {showFromPicker && <DateTimePicker value={fromDate} mode="date" onChange={onFromChange} />}
            {showToPicker && <DateTimePicker value={toDate} mode="date" onChange={onToChange} />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A', padding: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, marginTop: 10 },
    iconBtn: { padding: 10, backgroundColor: '#1E293B', borderRadius: 12 },
    title: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    dateText: { color: '#64748B', fontSize: 13 },
    sectionTitle: { color: '#94A3B8', fontSize: 13, fontWeight: 'bold', marginBottom: 20, textTransform: 'uppercase' },
    reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    reportCard: { width: '47%', height: 120, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    reportText: { color: 'white', fontWeight: 'bold', marginTop: 10, fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#1E293B', width: '90%', padding: 25, borderRadius: 25, borderWidth: 1, borderColor: '#334155' },
    modalTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
    inputFlexRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    flexOne: { flex: 1 },
    label: { color: '#64748B', fontSize: 11, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    dateInputBox: { backgroundColor: '#0F172A', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    fetchButton: { backgroundColor: '#8B5CF6', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    fetchButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    cancelLink: { marginTop: 25, alignSelf: 'center' }
});