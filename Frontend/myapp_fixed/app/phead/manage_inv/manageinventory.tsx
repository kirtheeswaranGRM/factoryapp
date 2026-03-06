import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, 
    ScrollView, Alert, ActivityIndicator, SafeAreaView, Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SERVER_URL } from '../../../constants/ApiConfig';

// --- EXAMPLE STATIC DATA ---
const EXAMPLE_VENDORS = [
    { id: 1, vendor_name: "Global Steel Corp", location: "New York" },
    { id: 2, vendor_name: "Apex Chemical Ltd", location: "London" },
    { id: 3, vendor_name: "Prime Packing Solutions", location: "Mumbai" },
    { id: 4, vendor_name: "Local Supplies Inc", location: "Local" },
    { id: 5, vendor_name: "Industrial Metals Co", location: "Chicago" },
    { id: 6, vendor_name: "Quick Logistics", location: "Berlin" },
];

export default function ManageInventory() {
    const router = useRouter();
    const { table, category } = useLocalSearchParams(); 
    
    const [loading, setLoading] = useState(false);
    const [dbItems, setDbItems] = useState<any[]>([]); 

    // Selection States
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedVendor, setSelectedVendor] = useState<any>(null);

    // Dropdown Visibility
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [showVendorDropdown, setShowVendorDropdown] = useState(false);

    const [form, setForm] = useState({
        quantity: '',
        invoice_no: '',
        unit: category === 'Products' ? 'PCS' : 'KG'
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${SERVER_URL}/head/inventory?table=${table}`);
            const data = await response.json();
            setDbItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedItem || !selectedVendor || !form.quantity || !form.invoice_no) {
            Alert.alert("Required", "Please select an Item, Vendor, and enter Quantity & Invoice.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${SERVER_URL}/head/add-stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: table,
                    item_id: selectedItem.id,
                    vendor_name: selectedVendor.vendor_name,
                    qty: form.quantity,
                    invoice: form.invoice_no,
                }),
            });

            if (response.ok) {
                Alert.alert("Success", "Stock updated in PostgreSQL");
                router.back();
            }
        } catch (error) {
            Alert.alert("Error", "Check server connection.");
        } finally {
            setLoading(false);
        }
    };

    // Determine if the main page should scroll
    const isAnyDropdownOpen = showItemDropdown || showVendorDropdown;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add {category} Stock</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.formContainer} 
                keyboardShouldPersistTaps="handled"
                scrollEnabled={!isAnyDropdownOpen} // FIX: Disable parent scroll when picker is open
            >
                
                {/* 1. ITEM SELECTION */}
                <Text style={styles.label}>Material / Item</Text>
                <View style={{ zIndex: 2000 }}> 
                    <TouchableOpacity 
                        style={styles.dropdownTrigger} 
                        onPress={() => {
                            setShowItemDropdown(!showItemDropdown);
                            setShowVendorDropdown(false);
                        }}
                    >
                        <Text style={{ color: selectedItem ? 'white' : '#475569' }}>
                            {selectedItem ? selectedItem.display_name : "-- Select Item --"}
                        </Text>
                        <Ionicons name={showItemDropdown ? "chevron-up" : "chevron-down"} size={20} color="#0ea5e9" />
                    </TouchableOpacity>

                    {showItemDropdown && (
                        <View style={styles.dropdownList}>
                            <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                                {dbItems.map((item) => (
                                    <TouchableOpacity 
                                        key={item.id} 
                                        style={styles.dropdownItem}
                                        onPress={() => { setSelectedItem(item); setShowItemDropdown(false); }}
                                    >
                                        <Text style={styles.dropdownItemText}>{item.display_name}</Text>
                                        <Text style={styles.dropdownItemSub}>Qty: {item.stock_qty}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* 2. VENDOR SELECTION */}
                <Text style={styles.label}>Select Vendor</Text>
                <View style={{ zIndex: 1000 }}>
                    <TouchableOpacity 
                        style={[styles.dropdownTrigger, { borderColor: '#1e293b' }]} 
                        onPress={() => {
                            setShowVendorDropdown(!showVendorDropdown);
                            setShowItemDropdown(false);
                        }}
                    >
                        <Text style={{ color: selectedVendor ? 'white' : '#475569' }}>
                            {selectedVendor ? selectedVendor.vendor_name : "-- Select Vendor --"}
                        </Text>
                        <Ionicons name={showVendorDropdown ? "chevron-up" : "chevron-down"} size={20} color="#10b981" />
                    </TouchableOpacity>

                    {showVendorDropdown && (
                        <View style={[styles.dropdownList, { borderColor: '#10b981' }]}>
                            <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                                {EXAMPLE_VENDORS.map((v) => (
                                    <TouchableOpacity 
                                        key={v.id} 
                                        style={styles.dropdownItem}
                                        onPress={() => { setSelectedVendor(v); setShowVendorDropdown(false); }}
                                    >
                                        <View>
                                            <Text style={styles.dropdownItemText}>{v.vendor_name}</Text>
                                            <Text style={styles.dropdownItemSub}>{v.location}</Text>
                                        </View>
                                        {selectedVendor?.id === v.id && <Ionicons name="checkmark-circle" size={18} color="#10b981" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* 3. QUANTITY & INVOICE */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Quantity to Add</Text>
                    <View style={styles.row}>
                        <TextInput 
                            style={[styles.input, { flex: 1 }]} 
                            placeholder="0.00" 
                            placeholderTextColor="#475569"
                            keyboardType="numeric"
                            value={form.quantity}
                            onChangeText={(t) => setForm({...form, quantity: t})}
                        />
                        <View style={styles.unitBadge}>
                            <Text style={styles.unitText}>{selectedItem?.unit || form.unit}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Invoice Number</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Invoice ID" 
                        placeholderTextColor="#475569"
                        value={form.invoice_no}
                        onChangeText={(t) => setForm({...form, invoice_no: t})}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#020617" /> : <Text style={styles.saveBtnText}>Save Entry</Text>}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    backBtn: { padding: 8, backgroundColor: '#0f172a', borderRadius: 10 },
    formContainer: { padding: 20 },
    label: { color: '#94a3b8', fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 15 },
    dropdownTrigger: { backgroundColor: '#0f172a', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownList: { backgroundColor: '#0f172a', marginTop: 5, borderRadius: 12, borderWidth: 1, borderColor: '#0ea5e9', overflow: 'hidden' },
    dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownItemText: { color: 'white', fontSize: 15 },
    dropdownItemSub: { color: '#64748b', fontSize: 12 },
    inputGroup: { marginTop: 15 },
    input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 18, color: 'white', borderWidth: 1, borderColor: '#1e293b' },
    row: { flexDirection: 'row', gap: 10 },
    unitBadge: { backgroundColor: '#1e293b', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12 },
    unitText: { color: '#0ea5e9', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#0ea5e9', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 30 },
    saveBtnText: { color: '#020617', fontWeight: '900', fontSize: 16 }
});