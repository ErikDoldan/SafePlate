import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Tipos de datos para Descubre
type Novedad = { id: string; tipo: 'NUEVO' | 'OFERTA' | 'RECETA'; titulo: string; descripcion: string; imagen: string; data?: string };

// Datos de prueba minimalistas y "muy top"
const datosDescubre: Novedad[] = [
  {
    id: '1',
    tipo: 'NUEVO',
    titulo: 'Cereales ChocoSafe SG - Mercadona',
    descripcion: '¡Recién llegados! Crujientes y 100% seguros.',
    imagen: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&q=80',
  },
  {
    id: '2',
    tipo: 'OFERTA',
    titulo: 'Gullón - 20% Dto. Online',
    descripcion: 'Usa el código online: GLUTENFREE20',
    imagen: 'https://images.unsplash.com/photo-1628102422312-747d77051939?w=500&q=80',
    data: 'GLUTENFREE20'
  },
  {
    id: '3',
    tipo: 'RECETA',
    titulo: 'Receta Semanal: Pizza SG',
    descripcion: 'Base casera crujiente y deliciosa.',
    imagen: 'https://images.unsplash.com/photo-1593560704563-f176a2eb61db?w=500&q=80',
  },
];

export default function DescubreScreen() {

  const handlePressCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderItem = ({ item }: { item: Novedad }) => (
    <TouchableOpacity style={styles.tarjetaModerna} onPress={handlePressCard}>
      <Image source={{ uri: item.imagen }} style={styles.imagenTarjeta} />
      
      <View style={styles.infoContenedor}>
        <View style={styles.filaBadges}>
          {item.tipo === 'NUEVO' && <View style={[styles.badge, styles.badgeNuevo]}><Text style={styles.textoBadge}>NUEVO</Text></View>}
          {item.tipo === 'OFERTA' && <View style={[styles.badge, styles.badgeOferta]}><Text style={styles.textoBadge}>OFERTA</Text></View>}
          {item.tipo === 'RECETA' && <View style={[styles.badge, styles.badgeReceta]}><Text style={styles.textoBadge}>RECETA</Text></View>}
        </View>

        <Text style={styles.tituloTarjeta}>{item.titulo}</Text>
        <Text style={styles.descripcionTarjeta}>{item.descripcion}</Text>
        
        {item.data && (
          <View style={styles.contenedorCodigo}>
            <Ionicons name="copy-outline" size={14} color="#10B981" />
            <Text style={styles.textoCodigo}>{item.data}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.fondoGris}>
      <FlatList
        data={datosDescubre}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 20 }}
        ListHeaderComponent={() => (
          <View style={styles.headerContenedor}>
            <Text style={styles.subtituloHeader}>Safe Brands & Novedades</Text>
          </View>
        )}
      />
    </View>
  );
}

// ESTILOS PREMIUM UNIFICADOS
const styles = StyleSheet.create({
  fondoGris: { flex: 1, backgroundColor: '#F8F9FA' },
  headerContenedor: { paddingHorizontal: 20, marginBottom: 20 },
  subtituloHeader: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  tarjetaModerna: { 
    backgroundColor: '#FFFFFF', borderRadius: 20, marginHorizontal: 16, marginBottom: 20, 
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 
  },
  imagenTarjeta: { width: '100%', height: 160 },
  infoContenedor: { padding: 20 },
  filaBadges: { flexDirection: 'row', marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeNuevo: { backgroundColor: '#D1FAE5' },
  badgeOferta: { backgroundColor: '#FEF3C7' },
  badgeReceta: { backgroundColor: '#E0F2FE' },
  textoBadge: { fontSize: 10, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase' },
  tituloTarjeta: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 5 },
  descripcionTarjeta: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 10 },
  contenedorCodigo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  textoCodigo: { fontSize: 12, color: '#10B981', fontWeight: 'bold', marginLeft: 4, textTransform: 'uppercase' }
});