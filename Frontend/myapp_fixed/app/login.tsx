import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ImageBackground, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
// Import your central API config
import { SERVER_URL } from '../constants/ApiConfig';
import { fetchWithTimeout } from '../utils/fetchTimeout';

export default function SecureFactoryPortal() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState('OPERATOR');
  const [loading, setLoading] = useState(false);

  const departments = [
    { id: 'OPERATOR', label: 'Operator' },
    { id: 'PRODUCTION HEAD', label: 'Prod. Head' },
    { id: 'QUALITY', label: 'Quality' },
    { id: 'PACKING', label: 'Packing' },
    { id: 'ADMIN', label: 'Admin' },
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Required", "Please enter credentials.");
      return;
    }

    setLoading(true);
    try {
      // 1. PRIMARY LOGIN using central SERVER_URL
      const response = await fetchWithTimeout(`${SERVER_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          userRole: selectedDept, 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userRole = data.user.role; 

        // 2. SEPARATE DB LOGGING FOR HEADS
        const headRoles = ['QUALITY', 'PACKING', 'PRODUCTION HEAD'];
        
        if (headRoles.includes(userRole)) {
          try {
            await fetchWithTimeout(`${SERVER_URL}/head-attendance/log`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: email.trim(), 
                role: userRole,
              }),
            }, 5000);
            console.log(`✅ Attendance stored for: ${userRole}`);
          } catch (dbErr) {
            console.error("Attendance Log Error:", dbErr);
          }
        }

        // 3. ROUTING
        switch (userRole) {
          case 'PRODUCTION HEAD': router.replace('/phead'); break;
          case 'QUALITY': router.replace('/quality'); break;
          case 'PACKING': router.replace('/packing'); break;
          case 'ADMIN': router.replace('/admin'); break;
          case 'OPERATOR': router.replace('/machineries'); break;
          default: router.replace('/machineries'); break;
        }
      } else {
        Alert.alert("Access Denied", data.message || "Unauthorized.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Server is not responding. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000' }} 
      style={styles.background}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerArea}>
              <View style={styles.logoBar} />
              <Text style={styles.portalTitle}>FACTORY <Text style={{color: '#10B981'}}>PORTAL</Text></Text>
              <Text style={styles.portalSub}>SELECT DEPARTMENT TO LOGIN</Text>
            </View>

            <View style={styles.deptContainer}>
              {departments.map((dept) => (
                <TouchableOpacity 
                  key={dept.id} 
                  style={[styles.deptBtn, selectedDept === dept.id && styles.deptBtnActive]}
                  onPress={() => setSelectedDept(dept.id)}
                >
                  <Text style={[styles.deptBtnText, selectedDept === dept.id && styles.deptBtnTextActive]}>
                    {dept.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.glassCard}>
              <Text style={styles.loginStatusText}>{selectedDept} LOGIN</Text>
              <View style={styles.field}>
                <Text style={styles.label}>DEPARTMENT EMAIL ID</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="name@factory.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="••••••••" 
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              <TouchableOpacity 
                style={[styles.actionBtn, loading && {opacity: 0.7}]} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>LOGIN TO TERMINAL</Text>}
              </TouchableOpacity>
            </View>
            <Text style={styles.footerInfo}>SERVER: {SERVER_URL} | Secure V2.0.1</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#0F172A' },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', paddingHorizontal: 25 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  headerArea: { alignItems: 'center', marginBottom: 25 },
  logoBar: { width: 40, height: 4, backgroundColor: '#10B981', marginBottom: 8 },
  portalTitle: { fontSize: 32, fontWeight: '900', color: '#fff' },
  portalSub: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  deptContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 20 },
  deptBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  deptBtnActive: { backgroundColor: '#10B981', borderColor: '#34D399' },
  deptBtnText: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold' },
  deptBtnTextActive: { color: '#fff' },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 25, padding: 25, elevation: 20 },
  loginStatusText: { fontSize: 16, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  field: { marginBottom: 15 },
  label: { fontSize: 9, fontWeight: '900', color: '#64748B', marginBottom: 6 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, fontSize: 16, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtn: { backgroundColor: '#0F172A', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  footerInfo: { textAlign: 'center', color: '#94A3B8', fontSize: 10, marginTop: 25 }
});