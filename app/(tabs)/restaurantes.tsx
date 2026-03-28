import { Ionicons } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList, Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { supabase } from '../../supabase';

const { width } = Dimensions.get('window');

type Restaurante = {
  id: string;
  nombre: string;
  direccion: string;
  puntuacion: number;
  imagen: string;
  lat: number;
  lng: number;
  etiquetas: string[]; 
};

// ¡NUEVO! Actualizamos el tipo Resena para incluir los datos del perfil
type Resena = {
  id: string;
  autor: string;
  user_id: string;
  puntuacion: number;
  comentario: string;
  created_at: string;
  perfiles?: {
    alias: string;
    avatar_url: string;
    etiqueta: string;
  };
};

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'gluten', label: 'Sin Gluten' },
  { id: 'lactosa', label: 'Sin Lactosa' },
  { id: 'vegano', label: 'Vegano' },
];

export default function MapaRestaurantesScreen() {
  const [ubicacion, setUbicacion] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [cargando, setCargando] = useState(true);

  const [regionActual, setRegionActual] = useState<Region | null>(null);
  const [mostrarBotonBuscar, setMostrarBotonBuscar] = useState(false);
  const mapaIniciado = useRef(false);

  const [session, setSession] = useState<Session | null>(null);
  const [mostrarSugerencia, setMostrarSugerencia] = useState(false);
  const [sugNombre, setSugNombre] = useState('');
  const [sugDireccion, setSugDireccion] = useState('');
  const [sugComentarios, setSugComentarios] = useState('');
  const [enviandoSug, setEnviandoSug] = useState(false);

  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState<Restaurante | null>(null);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [nuevaPuntuacion, setNuevaPuntuacion] = useState(5);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoResena, setEnviandoResena] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));

    const iniciarPantalla = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado.');
        setCargando(false);
      } else {
        let location = await Location.getCurrentPositionAsync({});
        setUbicacion(location);
        const regionInicial = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegionActual(regionInicial);
        buscarRestaurantesEnZona(regionInicial);
      }
    };
    iniciarPantalla();
  }, []);

  useEffect(() => {
    if (restauranteSeleccionado) {
      cargarResenas(restauranteSeleccionado.id);
    }
  }, [restauranteSeleccionado]);

  // ¡LA MAGIA DE LAS RELACIONES! Pedimos la reseña Y el perfil del autor
  const cargarResenas = async (id: string) => {
    const { data, error } = await supabase
      .from('resenas')
      .select('*, perfiles(alias, avatar_url, etiqueta)')
      .eq('restaurante_id', id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("🚨 ERROR LEYENDO RESEÑAS:", error.message);
    } else if (data) {
      setResenas(data);
    }
  };

  const buscarRestaurantesEnZona = async (region: Region) => {
    setCargando(true);
    setMostrarBotonBuscar(false);
    const minLat = region.latitude - (region.latitudeDelta / 2);
    const maxLat = region.latitude + (region.latitudeDelta / 2);
    const minLng = region.longitude - (region.longitudeDelta / 2);
    const maxLng = region.longitude + (region.longitudeDelta / 2);

    const { data } = await supabase.from('restaurantes').select('*')
      .gte('lat', minLat).lte('lat', maxLat).gte('lng', minLng).lte('lng', maxLng);
    
    if (data) setRestaurantes(data);
    setCargando(false);
  };

  const onRegionChangeComplete = (region: Region) => {
    setRegionActual(region);
    if (mapaIniciado.current) setMostrarBotonBuscar(true);
    mapaIniciado.current = true;
  };

  const cambiarFiltro = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFiltroActivo(id);
  };

  const restaurantesFiltrados = restaurantes.filter(r => {
    if (filtroActivo === 'todos') return true;
    return r.etiquetas && r.etiquetas.includes(filtroActivo);
  });

  const verificarYAbrirSugerencia = () => {
    if (session) {
      setMostrarSugerencia(true);
    } else {
      Alert.alert("¡Únete!", "Inicia sesión en la pestaña Perfil para sugerir restaurantes.");
    }
  };

  const enviarSugerencia = async () => {
    if (!sugNombre || !sugDireccion) return Alert.alert("Aviso", "Faltan datos.");
    setEnviandoSug(true);
    const { error } = await supabase.from('sugerencias')
      .insert([{ nombre_local: sugNombre, direccion: sugDireccion, comentarios: sugComentarios }]);
    setEnviandoSug(false);
    
    if (!error) {
      Alert.alert("¡Gracias!", "Sugerencia recibida.");
      setMostrarSugerencia(false);
      setSugNombre(''); setSugDireccion(''); setSugComentarios('');
    }
  };

  // ENVIAR RESEÑA CON CONTROL DE SPAM
  const enviarResena = async () => {
    if (!nuevoComentario.trim()) return Alert.alert("Aviso", "Escribe un comentario.");
    setEnviandoResena(true);
    
    // Añadimos el user_id para que el Candado Doble de Supabase sepa quién es
    const { error } = await supabase.from('resenas').insert([{
      restaurante_id: restauranteSeleccionado?.id,
      user_id: session?.user.id,
      autor: session?.user.email,
      puntuacion: nuevaPuntuacion,
      comentario: nuevoComentario
    }]);

    setEnviandoResena(false);
    
    if (error) {
      // Si el código de error es 23505 (Violación de restricción única / Candado Doble)
      if (error.code === '23505') {
        Alert.alert("Ya opinaste", "Solo puedes escribir una reseña por restaurante, ¡igual que en Google Maps!");
      } else {
        Alert.alert("Error", "No se pudo enviar la reseña. " + error.message);
      }
    } else {
      setNuevoComentario('');
      setNuevaPuntuacion(5);
      if (restauranteSeleccionado) cargarResenas(restauranteSeleccionado.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const pintarEstrellas = (nota: number) => {
    let estrellas = [];
    for (let i = 1; i <= 5; i++) {
      if (nota >= i) estrellas.push(<Ionicons key={i} name="star" size={14} color="#F59E0B" />);
      else if (nota >= i - 0.5) estrellas.push(<Ionicons key={i} name="star-half" size={14} color="#F59E0B" />);
      else estrellas.push(<Ionicons key={i} name="star-outline" size={14} color="#F59E0B" />);
    }
    return estrellas;
  };

  const renderTarjeta = ({ item }: { item: Restaurante }) => (
    <TouchableOpacity style={styles.tarjetaFlotante} activeOpacity={0.9} onPress={() => setRestauranteSeleccionado(item)}>
      <Image source={{ uri: item.imagen || 'https://via.placeholder.com/500' }} style={styles.imagenTarjeta} />
      <View style={styles.infoTarjeta}>
        <Text style={styles.tituloTarjeta} numberOfLines={1}>{item.nombre}</Text>
        <Text style={styles.direccionTarjeta} numberOfLines={1}>
          <Ionicons name="location" size={12} color="#6B7280"/> {item.direccion}
        </Text>
        <View style={styles.filaEstrellas}>
          {pintarEstrellas(item.puntuacion || 0)}
          <Text style={styles.textoPuntuacion}>({item.puntuacion || 'N/A'})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.contenedor}>
      <MapView 
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        onRegionChangeComplete={onRegionChangeComplete}
        initialRegion={{
          latitude: ubicacion ? ubicacion.coords.latitude : 41.3851,
          longitude: ubicacion ? ubicacion.coords.longitude : 2.1734,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {restaurantesFiltrados.map((restaurante) => (
          <Marker
            key={restaurante.id}
            coordinate={{ latitude: restaurante.lat, longitude: restaurante.lng }}
            title={restaurante.nombre}
            description={restaurante.direccion}
            onPress={() => setRestauranteSeleccionado(restaurante)}
          >
            <View style={styles.pinMapa}><Ionicons name="restaurant" size={16} color="white" /></View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.contenedorFiltros}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTROS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.chipFiltro, filtroActivo === item.id && styles.chipActivo]} onPress={() => cambiarFiltro(item.id)}>
              <Text style={[styles.textoChip, filtroActivo === item.id && styles.textoChipActivo]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {mostrarBotonBuscar && regionActual && (
        <TouchableOpacity style={styles.botonBuscarZona} onPress={() => buscarRestaurantesEnZona(regionActual)}>
          {cargando ? <ActivityIndicator size="small" color="white" /> : <><Ionicons name="refresh" size={18} color="white" style={{ marginRight: 6 }} /><Text style={styles.textoBuscarZona}>Buscar en esta zona</Text></>}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.botonSugerir} onPress={verificarYAbrirSugerencia}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {restaurantesFiltrados.length > 0 && (
        <View style={styles.contenedorTarjetasAbajo}>
          <FlatList horizontal showsHorizontalScrollIndicator={false} data={restaurantesFiltrados} keyExtractor={(item) => item.id} snapToInterval={width * 0.8 + 20} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 16 }} renderItem={renderTarjeta} />
        </View>
      )}

      {/* --- MODAL DEL PERFIL DEL RESTAURANTE CON RESEÑAS SOCIALES --- */}
      <Modal visible={restauranteSeleccionado !== null} animationType="slide" presentationStyle="pageSheet">
        {restauranteSeleccionado && (
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image source={{ uri: restauranteSeleccionado.imagen || 'https://via.placeholder.com/800' }} style={{ width: '100%', height: 250 }} />
              <TouchableOpacity style={{ position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 5 }} onPress={() => setRestauranteSeleccionado(null)}>
                <Ionicons name="close-circle" size={32} color="white" />
              </TouchableOpacity>

              <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827' }}>{restauranteSeleccionado.nombre}</Text>
                <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 5 }}><Ionicons name="location" size={14} /> {restauranteSeleccionado.direccion}</Text>

                <TouchableOpacity style={styles.botonMaps} onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${restauranteSeleccionado.lat},${restauranteSeleccionado.lng}`)}>
                  <Ionicons name="navigate-circle" size={24} color="white" style={{ marginRight: 10 }} />
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Cómo llegar</Text>
                </TouchableOpacity>

                <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 25 }} />

                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 15 }}>Reseñas de la comunidad</Text>

                {session ? (
                  <View style={styles.cajaEscribirResena}>
                    <Text style={{ fontWeight: 'bold', color: '#4B5563', marginBottom: 10 }}>Tu puntuación:</Text>
                    <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                      {[1, 2, 3, 4, 5].map((estrella) => (
                        <TouchableOpacity key={estrella} onPress={() => setNuevaPuntuacion(estrella)}>
                          <Ionicons name={nuevaPuntuacion >= estrella ? "star" : "star-outline"} size={32} color="#F59E0B" style={{ marginRight: 5 }}/>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput style={styles.inputResena} placeholder="¿Qué tal la experiencia sin gluten?" multiline value={nuevoComentario} onChangeText={setNuevoComentario} />
                    <TouchableOpacity style={styles.botonEnviarResena} onPress={enviarResena} disabled={enviandoResena}>
                      {enviandoResena ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Publicar reseña</Text>}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.cajaAvisoLogin}>
                    <Ionicons name="lock-closed-outline" size={30} color="#9CA3AF" />
                    <Text style={{ color: '#6B7280', marginTop: 10, textAlign: 'center' }}>Inicia sesión en la pestaña Perfil para escribir una reseña.</Text>
                  </View>
                )}

                {/* LISTA DE RESEÑAS CON ALIAS Y FOTO */}
                <View style={{ marginTop: 20, paddingBottom: 40 }}>
                  {resenas.length === 0 ? (
                    <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 20 }}>Aún no hay reseñas. ¡Sé el primero!</Text>
                  ) : (
                    resenas.map((resena) => (
                      <View key={resena.id} style={styles.tarjetaResena}>
                        
                        {/* Cabecera del usuario */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                          {resena.perfiles?.avatar_url ? (
                            <Image source={{ uri: resena.perfiles.avatar_url }} style={styles.avatarMini} />
                          ) : (
                            <Ionicons name="person-circle" size={40} color="#D1D5DB" />
                          )}
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={{ fontWeight: 'bold', color: '#1F2937', fontSize: 16 }}>
                              {resena.perfiles?.alias || 'Usuario Anónimo'}
                            </Text>
                            <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}>
                              {resena.perfiles?.etiqueta || 'Miembro'}
                            </Text>
                          </View>
                          <View style={styles.filaEstrellas}>{pintarEstrellas(resena.puntuacion)}</View>
                        </View>

                        <Text style={{ color: '#4B5563', lineHeight: 22 }}>{resena.comentario}</Text>
                      </View>
                    ))
                  )}
                </View>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Modal>

      <Modal visible={mostrarSugerencia} animationType="slide" transparent={true}>
        {/* ... (resto del modal de sugerencias igual) ... */}
      </Modal>
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff' },
  pantallaCarga: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  textoCarga: { marginTop: 15, color: '#6B7280', fontSize: 16, fontWeight: '500' },
  pinMapa: { backgroundColor: '#10B981', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  contenedorFiltros: { position: 'absolute', top: 50, width: '100%', height: 50 },
  chipFiltro: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, marginRight: 10, justifyContent: 'center', alignItems: 'center', height: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, borderWidth: 1, borderColor: '#E5E7EB' },
  chipActivo: { backgroundColor: '#10B981', borderColor: '#10B981' },
  textoChip: { fontWeight: '600', color: '#4B5563', textAlign: 'center' },
  textoChipActivo: { color: 'white' },
  botonBuscarZona: { position: 'absolute', top: 110, alignSelf: 'center', backgroundColor: '#1F2937', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 6 },
  textoBuscarZona: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  contenedorTarjetasAbajo: { position: 'absolute', bottom: 20, width: '100%' },
  tarjetaFlotante: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 20, padding: 10, marginRight: 15, width: width * 0.8, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  imagenTarjeta: { width: 80, height: 80, borderRadius: 15 },
  infoTarjeta: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  tituloTarjeta: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  direccionTarjeta: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  filaEstrellas: { flexDirection: 'row', alignItems: 'center' },
  textoPuntuacion: { fontSize: 13, fontWeight: '700', color: '#4B5563', marginLeft: 4 },
  botonSugerir: { position: 'absolute', top: 110, right: 20, backgroundColor: '#10B981', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCaja: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20 },
  modalCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitulo: { fontSize: 24, fontWeight: '900', color: '#111827' },
  modalSubtitulo: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 },
  inputTexto: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 15, color: '#1F2937' },
  botonEnviarSug: { backgroundColor: '#1F2937', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 5 },
  textoBotonEnviar: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  botonMaps: { backgroundColor: '#10B981', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20, flexDirection: 'row', justifyContent: 'center' },
  cajaEscribirResena: { backgroundColor: 'white', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  inputResena: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 15, height: 80, textAlignVertical: 'top', marginBottom: 15, borderWidth: 1, borderColor: '#F3F4F6' },
  botonEnviarResena: { backgroundColor: '#1F2937', padding: 15, borderRadius: 10, alignItems: 'center' },
  cajaAvisoLogin: { backgroundColor: '#F3F4F6', padding: 25, borderRadius: 16, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  
  // ¡ESTILOS NUEVOS PARA LA RESEÑA CON FOTO!
  tarjetaResena: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  avatarMini: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB' }
});