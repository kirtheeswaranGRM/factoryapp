import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { fetchWithTimeout } from '../utils/fetchTimeout';
import HourlyReportModal from './hourly_report';

export default function MachineDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [dbMaterials, setDbMaterials] = useState<any[]>([]);
    const [dbColors, setDbColors] = useState<any[]>([]);
    const [dbMolds, setDbMolds] = useState<any[]>([]);
    const [dbProducts, setDbProducts] = useState<any[]>([]); // NEW: Product List State

    const [machineStatus, setMachineStatus] = useState('');
    const [loading, setLoading] = useState(true);

    const [shift, setShift] = useState('Day Shift');
    const [productName, setProductName] = useState(''); // NEW: Selected Product State

    const [materialType1, setMaterialType1] = useState('None');
    const [mQty1, setMQty1] = useState('');
    const [materialType2, setMaterialType2] = useState('None');
    const [mQty2, setMQty2] = useState('');
    const [materialType3, setMaterialType3] = useState('None');
    const [mQty3, setMQty3] = useState('');
    const [materialType4, setMaterialType4] = useState('None');
    const [mQty4, setMQty4] = useState('');

    const [materialColor, setMaterialColor] = useState('Natural');
    const [colorQty, setColorQty] = useState('');

    const [moldType, setMoldType] = useState('');
    const [cavity, setCavity] = useState('');
    const [cycleTiming, setCycleTiming] = useState('5');

    const [isRunning, setIsRunning] = useState(false);
    const [count, setCount] = useState(0);
    const [startTime, setStartTime] = useState<string | null>(null);
    const [machineSessionStart, setMachineSessionStart] = useState<string | null>(null);
    const [resumeTime, setResumeTime] = useState<string | null>(null);
    const [stopTime, setStopTime] = useState<string | null>(null);

    const [showStopModal, setShowStopModal] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [showHourlyModal, setShowHourlyModal] = useState(false);
    const [typedReason, setTypedReason] = useState('');

    const isDataLoaded = useRef(false);
    const lastReportTimestamp = useRef(Date.now());
    const baseCount = useRef(0);
    const lastReportCount = useRef(0);
    
    const isPausing = useRef(false);
    const isUpdatingManually = useRef(false);

    // FETCH INVENTORY (Including Products)
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const [matRes, colRes, moldRes, prodRes] = await Promise.all([
                    fetchWithTimeout(`${SERVER_URL}/inventory/materials`, {}, 5000),
                    fetchWithTimeout(`${SERVER_URL}/inventory/colors`, {}, 5000),
                    fetchWithTimeout(`${SERVER_URL}/inventory/molds`, {}, 5000),
                    fetchWithTimeout(`${SERVER_URL}/inventory/products`, {}, 5000) 
                ]);
                const materials = await matRes.json();
                const colors = await colRes.json();
                const molds = await moldRes.json();
                const products = await prodRes.json();

                setDbMaterials(materials);
                setDbColors(colors);
                setDbMolds(molds);
                setDbProducts(Array.isArray(products) ? products : []); // Safety check

                if (molds.length > 0 && !isDataLoaded.current) {
                    setMoldType(molds[0].mold_name);
                    const firstCavity = molds[0].cavity_options?.split(',')[0].trim() || "1";
                    setCavity(firstCavity);
                }
            } catch (e) {
                console.log("Inventory fetch failed", e);
            }
        };
        fetchInventory();
    }, []);

    const loadState = useCallback(async () => {
        if (isUpdatingManually.current) return;

        try {
            const res = await fetchWithTimeout(`${SERVER_URL}/machines`, {}, 5000);
            const allMachines = await res.json();
            const data = allMachines.find((m: any) => m.id.toString() === id?.toString());

            if (data) {
                const dbStatus = String(data.status).toLowerCase().trim();
                const timing = parseInt(data.cycle_timing) || 1;
                const cav = parseInt(data.cavity) || 1;

                setMachineStatus(dbStatus);
                lastReportCount.current = parseInt(data.hourly_units) || 0;
                setMachineSessionStart(data.session_start_time || null);

                const savedAccumulated = parseInt(data.accumulated_output) || 0;

                if (dbStatus === 'running') {
                    isPausing.current = false; 
                    const sTime = data.resume_time || data.start_time;
                    if (sTime) {
                        const start = new Date(sTime).getTime();
                        const now = new Date().getTime();
                        const diffSeconds = Math.floor((now - start) / 1000);
                        const sessionOutput = Math.floor(diffSeconds / timing) * cav;

                        baseCount.current = savedAccumulated;
                        setCount(savedAccumulated + sessionOutput);
                        setIsRunning(true);
                        setStartTime(sTime);
                        setResumeTime(data.resume_time || null);
                    }
                } else {
                    isPausing.current = true; 
                    setIsRunning(false);
                    setStartTime(null);
                    setResumeTime(null);
                    baseCount.current = savedAccumulated;
                    setCount(savedAccumulated); 
                }

                if (!isDataLoaded.current) {
                    if (data.mold_type) setMoldType(data.mold_type);
                    if (data.cavity) setCavity(data.cavity.toString());
                    if (data.cycle_timing) setCycleTiming(data.cycle_timing.toString());
                    if (data.product_name) setProductName(data.product_name); // Sync Product

                    if (dbStatus !== 'idle' && dbStatus !== '') {
                        if (data.shift) setShift(data.shift);
                        if (data.material_type_1) setMaterialType1(data.material_type_1);
                        if (data.material_qty_1) setMQty1(data.material_qty_1.toString());
                        if (data.material_type_2) setMaterialType2(data.material_type_2);
                        if (data.material_qty_2) setMQty2(data.material_qty_2.toString());
                        if (data.material_type_3) setMaterialType3(data.material_type_3);
                        if (data.material_qty_3) setMQty3(data.material_qty_3.toString());
                        if (data.material_type_4) setMaterialType4(data.material_type_4);
                        if (data.material_qty_4) setMQty4(data.material_qty_4.toString());
                        if (data.material_color) setMaterialColor(data.material_color);
                        if (data.color_qty) setColorQty(data.color_qty.toString());
                    }
                    isDataLoaded.current = true;
                }
            }
        } catch (e) { console.log("Load state failed", e); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { loadState(); }, [loadState]);

    useEffect(() => {
        const watcher = setInterval(() => { loadState(); }, 3000);
        return () => clearInterval(watcher);
    }, [loadState]);

    useEffect(() => {
        let intervalRef = setInterval(() => {
            if (isPausing.current) return;
            const now = new Date().getTime();

            if (machineStatus === 'running' || machineStatus === 'paused' || machineStatus === 'power_cut') {
                const msSinceLast = now - lastReportTimestamp.current;
                if (msSinceLast >= 120000) { setShowHourlyModal(true); }
            } else {
                lastReportTimestamp.current = now;
            }

            if (isRunning && machineStatus === 'running' && startTime) {
                const start = new Date(startTime).getTime();
                const elapsedMs = now - start;
                const diffSeconds = Math.floor(elapsedMs / 1000);
                const timing = parseInt(cycleTiming) || 1;
                const cav = parseInt(cavity) || 1;
                const sessionOutput = Math.floor(diffSeconds / timing) * cav;
                setCount(baseCount.current + sessionOutput);
            }
        }, 1000);
        return () => clearInterval(intervalRef);
    }, [isRunning, startTime, cycleTiming, cavity, machineStatus]);

    const updateDB = async (status: string, output: number, reason: string | null = null, sTime: string | null = null, forceSessionStart: string | null = null, forceResume: string | null = null) => {
        try {
            const res = await fetchWithTimeout(`${SERVER_URL}/machine_status/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: status.toLowerCase(),
                    accumulated_output: (status === 'idle' && output === 0) ? 0 : output,
                    total_output: output,
                    stop_reason: reason || "",
                    start_time: (status === 'running') ? (sTime || startTime) : null,
                    session_start_time: forceSessionStart || machineSessionStart,
                    resume_time: forceResume || resumeTime,
                    hourly_units: lastReportCount.current,
                    shift,
                    product_name: productName, // NEW: Added to updateDB
                    material_type_1: materialType1, material_qty_1: mQty1.toString() || "0",
                    material_type_2: materialType2, material_qty_2: mQty2.toString() || "0",
                    material_type_3: materialType3, material_qty_3: mQty3.toString() || "0",
                    material_type_4: materialType4, material_qty_4: mQty4.toString() || "0",
                    material_color: materialColor, color_qty: colorQty.toString() || "0",
                    mold_type: moldType, cavity: parseInt(cavity) || 1, cycle_timing: parseInt(cycleTiming) || 0
                }),
            }, 8000);
            return res.ok;
        } catch (e) { return false; }
    };

    const validateBeforeStart = () => {
        if (!productName || productName === "") { Alert.alert("Error", "Please select a Product."); return false; }
        const materials = [
            { type: materialType1, qty: mQty1, label: "Material 1" },
            { type: materialType2, qty: mQty2, label: "Material 2" },
            { type: materialType3, qty: mQty3, label: "Material 3" },
            { type: materialType4, qty: mQty4, label: "Material 4" }
        ];
        const activeMaterials = materials.filter(m => m.type !== 'None');
        if (activeMaterials.length === 0) { Alert.alert("Error", "Select at least one material."); return false; }
        for (let m of activeMaterials) {
            const val = parseFloat(m.qty);
            if (!m.qty || isNaN(val) || val <= 0) { Alert.alert("Required", `Please enter a quantity for ${m.label}.`); return false; }
        }
        if (materialColor !== 'Natural') {
            const cQty = parseFloat(colorQty);
            if (!colorQty || isNaN(cQty) || cQty <= 0) { Alert.alert("Required", "Please enter a quantity for the selected Color."); return false; }
        }
        return true;
    };

    const startMachine = async () => {
        isUpdatingManually.current = true;
        const isoNow = new Date().toISOString();
        lastReportTimestamp.current = Date.now();
        const isResume = machineStatus === 'paused' || machineStatus === 'power_cut';

        if (!isResume) {
            setCount(0); baseCount.current = 0; lastReportCount.current = 0;
            setMachineSessionStart(isoNow);
            setResumeTime(null);
            setStartTime(isoNow);
            setIsRunning(true);
            setMachineStatus('running');
            isPausing.current = false;
            await updateDB('running', 0, null, isoNow, isoNow, null);
        } else {
            const frozenCount = count;
            baseCount.current = frozenCount;
            setStartTime(isoNow);
            setResumeTime(isoNow);
            setIsRunning(true);
            setMachineStatus('running');
            isPausing.current = false;
            await updateDB('running', frozenCount, null, isoNow, machineSessionStart, isoNow);
        }
        setTimeout(() => { isUpdatingManually.current = false; }, 2000);
    };

    const handleToggle = async () => {
        if (!isRunning) {
            if (validateBeforeStart()) { await startMachine(); }
        } else {
            isPausing.current = true;
            baseCount.current = count; 
            setTypedReason(''); setShowStopModal(true);
        }
    };

    const confirmStop = async () => {
        if (!typedReason.trim()) { Alert.alert("Required", "Please type a reason."); return; }
        isUpdatingManually.current = true;
        const isoStop = new Date().toISOString();
        setStopTime(isoStop);
        const finalCount = count;
        
        const success = await updateDB('idle', finalCount, typedReason, null, machineSessionStart, resumeTime);
        if (success) {
            setIsRunning(false);
            setMachineStatus('idle');
            setStartTime(null);
            setShowStopModal(false);
            setShowReport(true);
        } else {
            Alert.alert("Error", "Could not update server.");
        }
        setTimeout(() => { isUpdatingManually.current = false; }, 2000);
    };

    const handleSendForApproval = async () => {
        const payload = {
            machine_id: id, shift,
            product_name: productName, // NEW: Included in logs
            material_type_1: materialType1, material_qty_1: mQty1.toString() || "0",
            material_type_2: materialType2, material_qty_2: mQty2.toString() || "0",
            material_type_3: materialType3, material_qty_3: mQty3.toString() || "0",
            material_type_4: materialType4, material_qty_4: mQty4.toString() || "0",
            material_color: materialColor, color_qty: colorQty.toString() || "0",
            mold_type: moldType, cavity, cycle_timing: parseInt(cycleTiming) || 0,
            total_output: count,
            stop_reason: typedReason, // mapped to stop_reason as per backend logic
            start_time: machineSessionStart,
            stop_time: stopTime
        };
        try {
            const response = await fetchWithTimeout(`${SERVER_URL}/production_logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }, 10000);
            if (response.ok) {
                Alert.alert("Success", "Final Report Submitted.");
                setMaterialType1('None'); setMQty1('');
                setMaterialType2('None'); setMQty2('');
                setMaterialType3('None'); setMQty3('');
                setMaterialType4('None'); setMQty4('');
                setMaterialColor('Natural'); setColorQty('');
                setProductName('');
                setCount(0); baseCount.current = 0; lastReportCount.current = 0;
                setMachineSessionStart(null); setResumeTime(null); setStartTime(null); setStopTime(null);
                setShowReport(false); isDataLoaded.current = false;
                await updateDB('idle', 0, null, null, null, null);
                router.back();
            }
        } catch (error) { Alert.alert("Error", "Check connection."); }
    };

    const formatTime = (isoString: string | null) => {
        if (!isoString) return "..|..";
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const isPowerPaused = machineStatus === 'power_cut' || machineStatus === 'paused';
    const showLiveView = isRunning || isPowerPaused;

    if (loading) {
        return (
            <View style={[styles.outerWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ color: '#94A3B8', marginTop: 10, fontWeight: 'bold' }}>CONNECTING UNIT {id}...</Text>
            </View>
        );
    }

    return (
        <View style={styles.outerWrapper}>
            <StatusBar barStyle="light-content" />
            <HourlyReportModal
                visible={showHourlyModal}
                onClose={() => setShowHourlyModal(false)}
                serverUrl={SERVER_URL}
                currentTotalCount={count - lastReportCount.current}
                lastReportCount={lastReportCount.current}
                onSuccess={() => {
                    lastReportCount.current = count;
                    lastReportTimestamp.current = Date.now();
                    updateDB(machineStatus, count);
                    setShowHourlyModal(false);
                }}
                machineData={{ id, name: `UNIT ${id}`, shift }}
            />

            <Modal animationType="fade" transparent={true} visible={showStopModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>STOP REASON</Text>
                        <TextInput style={styles.reasonInput} value={typedReason} onChangeText={setTypedReason} multiline />
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#334155' }]} onPress={() => { isPausing.current = false; setShowStopModal(false); }}><Text style={styles.modalBtnText}>BACK</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#EF4444' }]} onPress={confirmStop}><Text style={styles.modalBtnText}>CONFIRM</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal animationType="slide" transparent={true} visible={showReport}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { width: '90%', maxHeight: '85%' }]}>
                        <Text style={[styles.modalTitle, { color: '#10B981', fontSize: 22 }]}>PRODUCTION REPORT</Text>
                        <ScrollView style={{ marginVertical: 10 }}>
                            <ReportRow label="Date" value={new Date().toLocaleDateString('en-GB')} />
                            <ReportRow label="Machine" value={`UNIT ${id}`} />
                            <ReportRow label="Shift" value={shift} />
                            <ReportRow label="Product" value={productName} />
                            <ReportRow label="Machine Start Time" value={formatTime(machineSessionStart)} />
                            <ReportRow label="Machine Stop Time" value={formatTime(stopTime)} />
                            <View style={styles.divider} />
                            {materialType1 !== 'None' && <ReportRow label="Mat 1" value={`${materialType1} (${mQty1}kg)`} />}
                            {materialType2 !== 'None' && <ReportRow label="Mat 2" value={`${materialType2} (${mQty2}kg)`} />}
                            {materialType3 !== 'None' && <ReportRow label="Mat 3" value={`${materialType3} (${mQty3}kg)`} />}
                            {materialType4 !== 'None' && <ReportRow label="Mat 4" value={`${materialType4} (${mQty4}kg)`} />}
                            <ReportRow label="Color" value={`${materialColor} (${colorQty}kg)`} />
                            <View style={styles.divider} />
                            <ReportRow label="Mold" value={moldType} />
                            <ReportRow label="Cavity" value={cavity} />
                            <ReportRow label="Cycle" value={`${cycleTiming} SEC`} />
                            <View style={styles.divider} />
                            <ReportRow label="Total Output" value={`${count} PCS`} />
                            <ReportRow label="Stop Reason" value={typedReason} />
                        </ScrollView>
                        <TouchableOpacity style={styles.approveBtn} onPress={handleSendForApproval}>
                            <Text style={styles.approveBtnText}>CONFIRM SEND APPROVAL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.headerContainer}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backTouch}><Text style={styles.backText}>← EXIT</Text></TouchableOpacity>
                    <View style={styles.titleArea}>
                        <Text style={styles.machineTitle}>UNIT {id} SETUP</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isRunning ? '#10B981' : isPowerPaused ? '#F59E0B' : '#94A3B8' }]} />
                            <Text style={[styles.statusLabel, { color: isRunning ? '#10B981' : isPowerPaused ? '#F59E0B' : '#94A3B8' }]}>{isRunning ? 'RUNNING' : isPowerPaused ? 'PAUSED' : 'IDLE'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
                    <View style={styles.formCard}>
                        <Text style={styles.inputLabel}>SHIFT SELECTION</Text>
                        <View style={[styles.pickerBox, showLiveView && styles.locked]}><Picker selectedValue={shift} onValueChange={setShift} enabled={!showLiveView} style={styles.picker}><Picker.Item label="Day Shift" value="Day Shift" /><Picker.Item label="Night Shift" value="Night Shift" /></Picker></View>
                        
                        {/* PRODUCT SELECTION PICKER */}
                        <Text style={styles.inputLabel}>PRODUCT SELECTION</Text>
                        <View style={[styles.pickerBox, showLiveView && styles.locked]}>
                            <Picker 
                                selectedValue={productName} 
                                onValueChange={(val) => setProductName(val)} 
                                enabled={!showLiveView} 
                                style={styles.picker}
                            >
                                <Picker.Item label="-- Choose Product --" value="" />
                                {Array.isArray(dbProducts) && dbProducts.map((p, idx) => (
                                    <Picker.Item key={p.id ? p.id.toString() : idx.toString()} label={p.product_name} value={p.product_name} />
                                ))}
                            </Picker>
                        </View>

                        {[1, 2, 3, 4].map((num) => {
                            const mValue = [materialType1, materialType2, materialType3, materialType4][num - 1];
                            const setMValue = [setMaterialType1, setMaterialType2, setMaterialType3, setMaterialType4][num - 1];
                            const qtyValue = [mQty1, mQty2, mQty3, mQty4][num - 1];
                            const setQtyValue = [setMQty1, setMQty2, setMQty3, setMQty4][num - 1];
                            const isMNone = mValue === 'None';
                            return (
                                <View key={num}>
                                    <Text style={styles.inputLabel}>MATERIAL {num} & QTY (KGS)</Text>
                                    <View style={styles.row}>
                                        <View style={[styles.pickerBox, { flex: 2 }, showLiveView && styles.locked]}><Picker selectedValue={mValue} onValueChange={setMValue} enabled={!showLiveView} style={styles.picker}><Picker.Item label="None" value="None" />{dbMaterials.map((m) => <Picker.Item key={m.id} label={m.material_name} value={m.material_name} />)}</Picker></View>
                                        <TextInput style={[styles.input, { flex: 1, marginLeft: 10 }, (showLiveView || isMNone) && styles.locked]} value={isMNone ? '0' : qtyValue} onChangeText={setQtyValue} keyboardType="numeric" editable={!showLiveView && !isMNone} />
                                    </View>
                                </View>
                            );
                        })}
                        <Text style={styles.inputLabel}>MATERIAL COLOR & QTY (KGS)</Text>
                        <View style={styles.row}>
                            <View style={[styles.pickerBox, { flex: 2 }, showLiveView && styles.locked]}>
                                <Picker selectedValue={materialColor} onValueChange={setMaterialColor} enabled={!showLiveView} style={styles.picker}>
                                    <Picker.Item label="Natural" value="Natural" />
                                    {dbColors.map((c) => (<Picker.Item key={c.id} label={c.color_name} value={c.color_name} />))}
                                </Picker>
                            </View>
                            <TextInput style={[styles.input, { flex: 1, marginLeft: 10 }, (showLiveView || materialColor === 'Natural') && styles.locked]} value={materialColor === 'Natural' ? '0' : colorQty} onChangeText={setColorQty} placeholder="Qty" placeholderTextColor="#475569" keyboardType="numeric" editable={!showLiveView && materialColor !== 'Natural'} />
                        </View>
                        <Text style={styles.inputLabel}>MOLD SELECTION</Text>
                        <View style={[styles.pickerBox, showLiveView && styles.locked]}>
                            <Picker selectedValue={moldType} onValueChange={(val) => { setMoldType(val); const selected = dbMolds.find(m => m.mold_name === val); if (selected && selected.cavity_options) { setCavity(selected.cavity_options.split(',')[0].trim()); } }} enabled={!showLiveView} style={styles.picker} >
                                {dbMolds.map((m) => <Picker.Item key={m.id} label={m.mold_name} value={m.mold_name} />)}
                            </Picker>
                        </View>
                        <Text style={styles.inputLabel}>CAVITY SELECTION</Text>
                        <View style={[styles.pickerBox, showLiveView && styles.locked]}>
                            <Picker selectedValue={cavity} onValueChange={setCavity} enabled={!showLiveView} style={styles.picker} >
                                {dbMolds.find(m => m.mold_name === moldType)?.cavity_options?.split(',').map((c: string) => (<Picker.Item key={c.trim()} label={c.trim()} value={c.trim()} />)) || <Picker.Item label="1" value="1" />}
                            </Picker>
                        </View>
                        <Text style={styles.inputLabel}>TIMING (SECONDS PER CYCLE)</Text>
                        <TextInput style={[styles.input, showLiveView && styles.locked]} value={cycleTiming} onChangeText={setCycleTiming} keyboardType="numeric" editable={!showLiveView} />
                    </View>
                    <View style={styles.counterCard}>
                        <Text style={styles.counterLabel}>PRODUCTION OUTPUT</Text>
                        <Text style={styles.counterValue}>{count}</Text>
                        <Text style={styles.rateLabel}>{isPowerPaused ? "COUNT FROZEN" : `RATE: ${cavity || '1'} PCS / ${cycleTiming || '0'} SEC`}</Text>
                    </View>
                    {isPowerPaused ? (
                        <View style={[styles.actionBtn, { backgroundColor: '#334155', borderWidth: 1, borderColor: '#F59E0B' }]}>
                            <Text style={[styles.btnText, { color: '#F59E0B' }]}>⚠️ MACHINE FROZEN</Text>
                            <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: 'bold' }}>WAITING FOR RESUME FROM LIST</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isRunning ? '#EF4444' : '#10B981' }]} onPress={handleToggle}>
                            <Text style={styles.btnText}>{isRunning ? 'STOP MACHINE' : 'START MACHINE'}</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const ReportRow = ({ label, value }: any) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
        <Text style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: 11 }}>{label.toUpperCase()}</Text>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13, textAlign: 'right', flex: 1, marginLeft: 20 }}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    outerWrapper: { flex: 1, backgroundColor: '#0F172A' },
    headerContainer: { backgroundColor: '#1E293B', paddingTop: 50, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#334155' },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 40 },
    backTouch: { position: 'absolute', left: 15 },
    backText: { color: '#94A3B8', fontWeight: 'bold' },
    titleArea: { alignItems: 'center' },
    machineTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '900' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusLabel: { fontSize: 11, fontWeight: 'bold' },
    scrollBody: { padding: 20 },
    formCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, marginBottom: 20 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    inputLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '900', marginTop: 15, marginBottom: 5 },
    pickerBox: { backgroundColor: '#0F172A', borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
    picker: { color: 'white' },
    input: { backgroundColor: '#0F172A', borderRadius: 12, borderWidth: 1, borderColor: '#334155', color: 'white', padding: 12, fontWeight: 'bold' },
    locked: { opacity: 0.5, backgroundColor: '#334155' },
    counterCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: 2, borderColor: '#334155', marginBottom: 20 },
    counterLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '900' },
    counterValue: { color: 'white', fontSize: 64, fontWeight: '900', marginVertical: 10 },
    rateLabel: { color: '#3B82F6', fontSize: 11, fontWeight: 'bold' },
    actionBtn: { height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: 'white', fontSize: 18, fontWeight: '900' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { backgroundColor: '#1E293B', borderRadius: 30, padding: 25, width: '85%', borderWidth: 1, borderColor: '#334155' },
    modalTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 20, color: 'white' },
    reasonInput: { backgroundColor: '#0F172A', color: 'white', borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', marginTop: 10 },
    modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    modalBtn: { flex: 1, padding: 15, borderRadius: 15, alignItems: 'center', marginHorizontal: 5 },
    modalBtnText: { color: 'white', fontWeight: 'bold' },
    approveBtn: { padding: 20, borderRadius: 20, marginTop: 20, alignItems: 'center', backgroundColor: '#10B981' },
    approveBtnText: { color: 'white', fontWeight: '900' },
    divider: { height: 1, backgroundColor: '#334155', marginVertical: 10 }
});