import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

// 1. Estructura de los datos
type Novedad = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  imagen: string;
  enlace: string;
};

export default function DescubreScreen() {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [cargando, setCargando] = useState(true);

  // 2. Descargar los artículos de Supabase al abrir la pestaña
  useEffect(() => {
    const cargarNovedades = async () => {
      // Pedimos todo a la tabla 'novedades'
      const { data, error } = await supabase.from('novedades').select('*');
      
      if (error) {
        console.error("Error cargando novedades:", error.message);
      } else if (data) {
        // Le damos la vuelta para que los más nuevos salgan arriba
        setNovedades(data.reverse()); 
      }
      setCargando(false);
    };

    cargarNovedades();
  }, []);

  // 3. Diseño de cada artículo (Estilo Tarjeta de Revista)
  // Función para abrir el navegador de forma segura
  const abrirEnlace = async (url: string) => {
    if (!url) {
      Alert.alert("Aviso", "Este artículo no tiene un enlace completo aún.");
      return;
    }
    
    try {
      // Comprobamos si el móvil sabe abrir este tipo de enlace
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "No podemos abrir este enlace en tu dispositivo.");
      }
    } catch (error) {
      console.error("Error al abrir la web:", error);
    }
  };

  const renderArticulo = ({ item }: { item: Novedad }) => (
    // AQUÍ ESTÁ LA MAGIA: Le añadimos el onPress a la tarjeta
    <TouchableOpacity 
      style={styles.tarjetaArticulo} 
      activeOpacity={0.9}
      onPress={() => abrirEnlace(item.enlace)} 
    >
      <View style={styles.contenedorImagen}>
        <Image 
          source={{ uri: item.imagen || 'https://images.unsplash.com/photo-1490818387583-1b5f22221221?w=800&q=80' }} 
          style={styles.imagenArticulo} 
        />
        <View style={styles.etiquetaCategoria}>
          <Text style={styles.textoCategoria}>{item.categoria ? item.categoria.toUpperCase() : 'NOTICIA'}</Text>
        </View>
      </View>
      
      <View style={styles.infoArticulo}>
        <Text style={styles.tituloArticulo}>{item.titulo}</Text>
        <Text style={styles.descripcionArticulo} numberOfLines={2}>
          {item.descripcion}
        </Text>
        <View style={styles.filaLeerMas}>
          <Text style={styles.textoLeerMas}>Leer artículo</Text>
          <Ionicons name="arrow-forward" size={16} color="#10B981" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.contenedor}>
      {/* CABECERA */}
      <View style={styles.cabecera}>
        <Text style={styles.tituloPantalla}>Descubre</Text>
        <Text style={styles.subtituloPantalla}>Novedades, recetas y consejos seguros</Text>
      </View>

      {/* LISTA DE ARTÍCULOS O PANTALLA DE CARGA */}
      {cargando ? (
        <View style={styles.pantallaCentral}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.textoCarga}>Cargando las últimas novedades...</Text>
        </View>
      ) : novedades.length === 0 ? (
        <View style={styles.pantallaCentral}>
          <Ionicons name="newspaper-outline" size={60} color="#D1D5DB" />
          <Text style={styles.textoVacio}>Aún no hay artículos publicados.</Text>
        </View>
      ) : (
        <FlatList
          data={novedades}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listaContenedor}
          showsVerticalScrollIndicator={false}
          renderItem={renderArticulo}
        />
      )}
    </View>
  );
}

// 4. ESTILOS SÚPER PREMIUM
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F8F9FA' },
  pantallaCentral: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  textoCarga: { marginTop: 15, color: '#6B7280', fontSize: 16 },
  textoVacio: { marginTop: 15, color: '#6B7280', fontSize: 16, textAlign: 'center', paddingHorizontal: 40 },
  
  cabecera: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tituloPantalla: { fontSize: 32, fontWeight: '900', color: '#111827' },
  subtituloPantalla: { fontSize: 16, color: '#6B7280', marginTop: 5 },
  
  listaContenedor: { padding: 20, paddingBottom: 100 },
  
  tarjetaArticulo: { backgroundColor: 'white', borderRadius: 24, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 8, overflow: 'hidden' },
  contenedorImagen: { position: 'relative' },
  imagenArticulo: { width: '100%', height: 200, backgroundColor: '#E5E7EB' },
  etiquetaCategoria: { position: 'absolute', top: 15, left: 15, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  textoCategoria: { color: 'white', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  
  infoArticulo: { padding: 20 },
  tituloArticulo: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginBottom: 8, lineHeight: 26 },
  descripcionArticulo: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 15 },
  
  filaLeerMas: { flexDirection: 'row', alignItems: 'center' },
  textoLeerMas: { color: '#10B981', fontWeight: '700', fontSize: 15, marginRight: 5 }
});