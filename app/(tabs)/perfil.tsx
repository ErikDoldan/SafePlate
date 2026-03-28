import { Ionicons } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

const ETIQUETAS = ['Celíaco/a', 'Intolerante a la Lactosa', 'Familiar/Acompañante', 'Vegano/a'];

export default function PerfilScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados del Perfil Social
  const [alias, setAlias] = useState('');
  const [etiquetaActiva, setEtiquetaActiva] = useState('Celíaco/a');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) cargarPerfil(session.user.id);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) cargarPerfil(session.user.id);
    });
  }, []);

  // --- FUNCIONES DE BASE DE DATOS (PERFIL SOCIAL) ---
  const cargarPerfil = async (userId: string) => {
    const { data, error } = await supabase.from('perfiles').select('*').eq('id', userId).single();
    if (data) {
      setAlias(data.alias || '');
      setEtiquetaActiva(data.etiqueta || 'Celíaco/a');
      setAvatarUrl(data.avatar_url || '');
    }
  };

  const guardarPerfil = async () => {
    if (!session) return;
    if (!alias.trim()) return Alert.alert('Aviso', 'Elige un alias para la comunidad.');
    
    setGuardandoPerfil(true);
    
    // Generamos un avatar automático con la primera letra del alias
    const avatarGenerado = `https://ui-avatars.com/api/?name=${alias}&background=10B981&color=fff&size=200&font-size=0.5&bold=true`;
    
    const { error } = await supabase.from('perfiles').upsert({
      id: session.user.id, // El ID debe ser el mismo que el del usuario logueado
      alias: alias,
      etiqueta: etiquetaActiva,
      avatar_url: avatarGenerado
    });

    setGuardandoPerfil(false);

    if (error) {
      Alert.alert('Error', 'No pudimos guardar tu perfil.');
      console.error(error);
    } else {
      setAvatarUrl(avatarGenerado);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Perfil Guardado!', 'Tus datos se han actualizado correctamente.');
    }
  };

  // --- FUNCIONES DE AUTENTICACIÓN ---
  const iniciarSesion = async () => {
    if (!email || !password) return Alert.alert('Aviso', 'Rellena todos los campos');
    setCargandoAuth(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error al iniciar', error.message);
    setCargandoAuth(false);
  };

  const registrarse = async () => {
    if (!email || !password) return Alert.alert('Aviso', 'Rellena todos los campos');
    setCargandoAuth(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('¡Bienvenido!', 'Cuenta creada correctamente.');
    setCargandoAuth(false);
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  // --- VISTA 1: USUARIO LOGUEADO (CONFIGURAR PERFIL) ---
  if (session && session.user) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.contenedor}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
          <View style={styles.cabecera}>
            <Text style={styles.tituloPantalla}>Ajustes de Cuenta</Text>
          </View>
          
          <View style={styles.perfilCaja}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImagen} />
            ) : (
              <Ionicons name="person-circle" size={100} color="#10B981" />
            )}
            <Text style={styles.textoEmailOculto}>{session.user.email}</Text>
          </View>

          <View style={styles.seccionFormulario}>
            <Text style={styles.label}>Tu Alias (Público)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: FoodieSinGluten"
              value={alias}
              onChangeText={setAlias}
              maxLength={20}
            />

            <Text style={styles.label}>Mi condición principal</Text>
            <View style={styles.contenedorEtiquetas}>
              {ETIQUETAS.map((tag) => (
                <TouchableOpacity 
                  key={tag} 
                  style={[styles.chipEtiqueta, etiquetaActiva === tag && styles.chipActivo]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setEtiquetaActiva(tag);
                  }}
                >
                  <Text style={[styles.textoChip, etiquetaActiva === tag && styles.textoChipActivo]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.botonGuardar} onPress={guardarPerfil} disabled={guardandoPerfil}>
              {guardandoPerfil ? <ActivityIndicator color="white" /> : <Text style={styles.textoBotonGuardar}>Guardar Perfil</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.menuOpciones}>
            <TouchableOpacity style={styles.botonCerrarSesion} onPress={cerrarSesion}>
              <Ionicons name="log-out-outline" size={24} color="#DC2626" />
              <Text style={styles.textoCerrarSesion}>Cerrar sesión de forma segura</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // --- VISTA 2: FORMULARIO DE LOGIN (SIN LOGUEAR) ---
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Text style={styles.tituloPantalla}>Únete a la Comunidad</Text>
        <Text style={styles.subtituloPantalla}>Guarda restaurantes, escribe reseñas y ayuda a otros celíacos.</Text>
      </View>

      <View style={styles.seccionFormulario}>
        <Text style={styles.label}>Correo Electrónico</Text>
        <TextInput style={styles.input} placeholder="tu@email.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput style={styles.input} placeholder="Mínimo 6 caracteres" value={password} onChangeText={setPassword} secureTextEntry />

        {cargandoAuth ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 20 }} />
        ) : (
          <View style={{ marginTop: 10 }}>
            <TouchableOpacity style={styles.botonLogin} onPress={iniciarSesion}>
              <Text style={styles.textoBotonGuardar}>Iniciar Sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botonRegistro} onPress={registrarse}>
              <Text style={styles.textoBotonRegistro}>Crear Cuenta</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F8F9FA' },
  cabecera: { paddingTop: 80, paddingBottom: 20, paddingHorizontal: 25, backgroundColor: 'white' },
  tituloPantalla: { fontSize: 32, fontWeight: '900', color: '#111827' },
  subtituloPantalla: { fontSize: 16, color: '#6B7280', marginTop: 10, lineHeight: 22 },
  
  perfilCaja: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
  avatarImagen: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#10B981' },
  textoEmailOculto: { fontSize: 14, color: '#9CA3AF', marginTop: 10 },
  
  seccionFormulario: { padding: 25 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginBottom: 10, marginLeft: 5 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 25 },
  
  contenedorEtiquetas: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 30 },
  chipEtiqueta: { backgroundColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  chipActivo: { backgroundColor: '#10B981' },
  textoChip: { color: '#4B5563', fontWeight: '600', fontSize: 14 },
  textoChipActivo: { color: 'white' },

  botonGuardar: { backgroundColor: '#1F2937', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  textoBotonGuardar: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  botonLogin: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  botonRegistro: { backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#10B981' },
  textoBotonRegistro: { color: '#10B981', fontSize: 16, fontWeight: 'bold' },

  menuOpciones: { paddingHorizontal: 25, marginTop: 10 },
  botonCerrarSesion: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: 15, borderRadius: 12, justifyContent: 'center' },
  textoCerrarSesion: { color: '#DC2626', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});