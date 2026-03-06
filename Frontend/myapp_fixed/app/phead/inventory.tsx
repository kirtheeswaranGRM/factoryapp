import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList, SafeAreaView, StatusBar, StyleSheet, Text, 
    TouchableOpacity, View, ActivityIndicator, RefreshControl, 
    ScrollView, Alert, Pressable, Platform, Modal
} from 'react-native';
import { SERVER_URL } from '../../constants/ApiConfig';
import { fetchWithTimeout } from '../../utils/fetchTimeout';

// Export Libraries
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface InventoryItem {
    id: number;
    display_name: string;
    stock_qty: number;
    unit?: string;
    opening_stock?: number;
    used_stock?: number;
    minimum_stock_level?: number;
    [key: string]: any;
}

type Category = 'Materials' | 'Colors' | 'Packing' | 'Products' | 'Molds';

export default function InventoryScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Category>('Materials');
    const [data, setData] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [manageModalVisible, setManageModalVisible] = useState(false);
    const [exporting, setExporting] = useState(false); 

    const tableMap: Record<Category, string> = {
        Materials: 'inventory_materials', 
        Colors: 'inventory_colors',
        Packing: 'inventory_packing', 
        Products: 'inventory_product', 
        Molds: 'inventory_molds'
    };

    const fetchInventory = async (category: Category) => {
        setLoading(true);
        try {
            const response = await fetchWithTimeout(`${SERVER_URL}/head/inventory?table=${tableMap[category]}`, {}, 8000);
            const json = await response.json();
            setData(Array.isArray(json) ? json : []);
        } catch (error) {
            Alert.alert("Error", "Check server connection.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchInventory(activeTab); }, [activeTab]);

    const handleAction = (mode: 'add') => {
        setManageModalVisible(false);
        router.push({
            pathname: "/phead/manage_inv/manageinventory",
            params: { 
                table: tableMap[activeTab], 
                category: activeTab,
                mode: mode 
            }
        });
    };

    // CSV Export
    const exportToCSV = async () => {
        if (data.length === 0) return Alert.alert("No Data", "Nothing to export.");
        setManageModalVisible(false);
        setExporting(true);
        try {
            let csvString = 'ID,Item Name,Stock Qty,Unit\n';
            data.forEach(item => {
                csvString += `${item.id},${item.display_name},${item.stock_qty},${item.unit || 'KG'}\n`;
            });
            const fileUri = FileSystem.documentDirectory + `${activeTab}_Inventory.csv`;
            await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
            await Sharing.shareAsync(fileUri);
        } catch (error) {
            Alert.alert("Error", "Failed to export CSV");
        } finally {
            setExporting(false);
        }
    };

    // PDF Export
    const exportToPDF = async () => {
        if (data.length === 0) return Alert.alert("No Data", "Nothing to export.");
        setManageModalVisible(false);
        setExporting(true);
        try {
            const rows = data.map(item => `
                <tr>
                    <td style="border:1px solid #ddd; padding:8px;">${item.id}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${item.display_name}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${item.stock_qty}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${item.unit || 'KG'}</td>
                </tr>
            `).join('');

            const html = `<html><body style="font-family:sans-serif; padding:20px;">
                <h2 style="color:#0ea5e9;">${activeTab} Inventory Report</h2>
                <table style="width:100%; border-collapse:collapse;">
                    <tr style="background-color:#f2f2f2;">
                        <th style="border:1px solid #ddd; padding:8px;">ID</th>
                        <th style="border:1px solid #ddd; padding:8px;">Name</th>
                        <th style="border:1px solid #ddd; padding:8px;">Stock</th>
                        <th style="border:1px solid #ddd; padding:8px;">Unit</th>
                    </tr>
                    ${rows}
                </table>
            </body></html>`;
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert("Error", "Failed to export PDF");
        } finally {
            setExporting(false);
        }
    };

    const renderItem = ({ item }: { item: InventoryItem }) => {
        const isLow = item.minimum_stock_level !== undefined && 
                     (Number(item.stock_qty) <= Number(item.minimum_stock_level));
        const displayUnit = item.unit || 'KG';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.display_name}</Text>
                        <Text style={styles.itemId}>REF: #{item.id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isLow ? '#450a0a' : '#064e3b' }]}>
                        <View style={[styles.dot, { backgroundColor: isLow ? '#ef4444' : '#10b981' }]} />
                        <Text style={[styles.statusText, { color: isLow ? '#f87171' : '#34d399' }]}>
                            {isLow ? 'LOW STOCK' : 'OPTIMAL'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>OPENING</Text>
                            <Text style={styles.infoValue}>{item.opening_stock ?? '0'}</Text>
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>USED</Text>
                            <Text style={styles.infoValue}>{item.used_stock ?? '0'}</Text>
                        </View>
                    </View>
                    <View style={[styles.balancePlate, isLow && styles.lowStockPlate]}>
                        <Text style={styles.balanceLabel}>STOCK</Text>
                        <View style={styles.balanceRow}>
                            <Text style={[styles.balanceNumber, isLow && { color: '#ef4444' }]}>
                                {item.stock_qty ?? 0}
                            </Text>
                            <Text style={styles.balanceUnit}>{displayUnit}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#020617" />
            <View style={styles.headerArea}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color="#0ea5e9" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Inventory Hub</Text>
                        <Text style={styles.subtitle}>{activeTab} Live Data</Text>
                    </View>
                    <TouchableOpacity onPress={() => setManageModalVisible(true)} style={styles.manageBtn}>
                        <Ionicons name="options-outline" size={24} color="#0ea5e9" />
                        <Text style={styles.manageBtnText}>MANAGE</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.navContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
                        {['Materials', 'Colors', 'Packing', 'Products', 'Molds'].map((cat) => (
                            <TouchableOpacity 
                                key={cat} 
                                style={[styles.navItem, activeTab === cat && styles.navItemActive]}
                                onPress={() => setActiveTab(cat as Category)}
                            >
                                <Text style={[styles.navText, activeTab === cat && styles.navTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInventory(activeTab); }} tintColor="#0ea5e9" />
                    }
                />
            )}

            {/* UPDATED MODAL: DELETE BUTTON REMOVED */}
            <Modal animationType="slide" transparent visible={manageModalVisible} onRequestClose={() => setManageModalVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setManageModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderIndicator} />
                        <Text style={styles.modalTitle}>Manage {activeTab}</Text>
                        
                        <View style={styles.modalGrid}>
                            {/* Row 1: Add New (Full Width) */}
                            <View style={styles.modalActionRow}>
                                <TouchableOpacity style={[styles.actionButton, {borderColor: '#0ea5e9', flex: 1}]} onPress={() => handleAction('add')}>
                                    <Ionicons name="add-circle-outline" size={32} color="#0ea5e9" />
                                    <Text style={[styles.actionText, {fontSize: 14}]}>Add New Item</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Row 2: CSV & PDF */}
                            <View style={styles.modalActionRow}>
                                <TouchableOpacity style={[styles.actionButton, {borderColor: '#10b981'}]} onPress={exportToCSV}>
                                    <Ionicons name="grid-outline" size={28} color="#10b981" />
                                    <Text style={styles.actionText}>Export CSV</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionButton, {borderColor: '#f59e0b'}]} onPress={exportToPDF}>
                                    <Ionicons name="document-text-outline" size={28} color="#f59e0b" />
                                    <Text style={styles.actionText}>Export PDF</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setManageModalVisible(false)}>
                            <Text style={styles.closeModalBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* EXPORTING OVERLAY */}
            {exporting && (
                <View style={styles.exportOverlay}>
                    <ActivityIndicator size="large" color="#0ea5e9" />
                    <Text style={{color: 'white', marginTop: 10}}>Generating File...</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerArea: { backgroundColor: '#020617', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingTop: 10 },
    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    title: { color: 'white', fontSize: 24, fontWeight: '800' },
    subtitle: { color: '#64748b', fontSize: 13 },
    manageBtn: { alignItems: 'center', justifyContent: 'center' },
    manageBtnText: { color: '#0ea5e9', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
    navContainer: { marginBottom: 15 },
    navScroll: { paddingHorizontal: 20, gap: 10 },
    navItem: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#0f172a' },
    navItemActive: { backgroundColor: '#0ea5e9' },
    navText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
    navTextActive: { color: '#020617' },
    listContainer: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 10 },
    card: { backgroundColor: '#0f172a', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    itemName: { color: 'white', fontSize: 17, fontWeight: '700', flex: 1, marginRight: 10 },
    itemId: { color: '#0ea5e9', fontSize: 11, fontWeight: '800' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 9, fontWeight: '900' },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    infoGrid: { flexDirection: 'row', gap: 12, flex: 1 },
    infoBox: { borderLeftWidth: 2, borderLeftColor: '#1e293b', paddingLeft: 10 },
    infoLabel: { color: '#475569', fontSize: 8, fontWeight: '800' },
    infoValue: { color: '#cbd5e1', fontSize: 14, fontWeight: '700' },
    balancePlate: { backgroundColor: '#020617', padding: 12, borderRadius: 15, alignItems: 'center', minWidth: 90, borderWidth: 1, borderColor: '#1e293b' },
    lowStockPlate: { borderColor: '#ef444433', backgroundColor: '#450a0a22' },
    balanceLabel: { color: '#64748b', fontSize: 8, fontWeight: '800', marginBottom: 4 },
    balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    balanceNumber: { color: '#0ea5e9', fontSize: 22, fontWeight: '900' },
    balanceUnit: { color: '#475569', fontSize: 10, fontWeight: '800' },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, borderWidth: 1, borderColor: '#1e293b' },
    modalHeaderIndicator: { width: 40, height: 4, backgroundColor: '#334155', alignSelf: 'center', borderRadius: 2, marginBottom: 20 },
    modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
    modalGrid: { gap: 15 },
    modalActionRow: { flexDirection: 'row', gap: 15 },
    actionButton: { flex: 1, paddingVertical: 20, borderWidth: 1, borderRadius: 20, alignItems: 'center', backgroundColor: '#020617' },
    actionText: { color: 'white', marginTop: 10, fontWeight: 'bold', fontSize: 12 },
    closeModalBtn: { marginTop: 25, padding: 15, alignItems: 'center' },
    closeModalBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 15 },
    exportOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
});