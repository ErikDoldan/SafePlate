import React from 'react';
import { FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 1. Definimos qué datos tiene un Restaurante (para que TypeScript no se queje)
type Restaurante = {
  id: string;
  nombre: string;
  direccion: string;
  puntuacion: string;
  imagen: string;
  urlMapa: string;
};

// 2. Nuestra lista de restaurantes de prueba
const listaRestaurantes: Restaurante[] = [
  {
    id: '1',
    nombre: 'La Trattoria Sin Gluten',
    direccion: 'Calle Roma 123, Centro',
    puntuacion: '⭐⭐⭐⭐⭐ (100% Seguro)',
    imagen: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
    urlMapa: 'https://maps.google.com/?q=Restaurante+Italiano' // Link de prueba
  },
  {
    id: '2',
    nombre: 'Burger SafePlate',
    direccion: 'Avenida Libertad 45',
    puntuacion: '⭐⭐⭐⭐ (Con opciones SG)',
    imagen: 'https://images.unsplash.com/photo-1466978913421-bac2e58c6421?w=500&q=80',
    urlMapa: 'https://maps.google.com/?q=Hamburgueseria' // Link de prueba
  }
];

export default function RestaurantesScreen() {

  // 3. Función para abrir Google Maps en el móvil
  const abrirMapa = (url: string) => {
    Linking.openURL(url);
  };

  // 4. Diseño de cada tarjeta de restaurante
  const renderItem = ({ item }: { item: Restaurante }) => (
    <View style={styles.tarjeta}>
      <Image source={{ uri: item.imagen }} style={styles.imagenTarjeta} />
      <View style={styles.infoContenedor}>
        <Text style={styles.tituloRestaurante}>{item.nombre}</Text>
        <Text style={styles.direccionRestaurante}>📍 {item.direccion}</Text>
        <Text style={styles.puntuacion}>{item.puntuacion}</Text>
        
        <TouchableOpacity 
          style={styles.botonMapa} 
          onPress={() => abrirMapa(item.urlMapa)}
        >
          <Text style={styles.textoBoton}>Cómo llegar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.tituloHeader}>Restaurantes Seguros</Text>
      <Text style={styles.subtituloHeader}>Encuentra lugares recomendados y verificados.</Text>
      
      <FlatList
        data={listaRestaurantes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// 5. Estilos profesionales
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  tituloHeader: { fontSize: 26, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  subtituloHeader: { fontSize: 16, color: '#666', marginBottom: 20 },
  tarjeta: { backgroundColor: 'white', borderRadius: 15, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  imagenTarjeta: { width: '100%', height: 160 },
  infoContenedor: { padding: 20 },
  tituloRestaurante: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  direccionRestaurante: { fontSize: 16, color: '#666', marginBottom: 10 },
  puntuacion: { fontSize: 16, color: '#E65100', fontWeight: 'bold', marginBottom: 15 },
  botonMapa: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, alignItems: 'center' },
  textoBoton: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});