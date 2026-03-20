import React from 'react';
import { FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Definimos qué datos tiene una Tarjeta
type Tarjeta = {
  id: string;
  idioma: string;
  precio: string;
  imagen: string;
  linkPago: string;
};

const catalogoTarjetas: Tarjeta[] = [
  {
    id: '1',
    idioma: 'Tarjeta en Japonés',
    precio: '3,99€',
    imagen: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=500&q=80',
    linkPago: 'https://buy.stripe.com/test_ejemplo1' 
  },
  {
    id: '2',
    idioma: 'Tarjeta en Inglés',
    precio: '3,99€',
    imagen: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500&q=80',
    linkPago: 'https://buy.stripe.com/test_ejemplo2'
  },
];

export default function TarjetasScreen() {

  // Le decimos que "link" es un string
  const comprarTarjeta = (link: string) => {
    Linking.openURL('https://www.google.com'); 
  };

  // Le decimos que "item" es del tipo Tarjeta
  const renderItem = ({ item }: { item: Tarjeta }) => (
    <View style={styles.tarjeta}>
      <Image source={{ uri: item.imagen }} style={styles.imagenTarjeta} />
      <View style={styles.infoContenedor}>
        <Text style={styles.tituloTarjeta}>{item.idioma}</Text>
        <Text style={styles.precioTarjeta}>{item.precio}</Text>
        
        <TouchableOpacity 
          style={styles.botonComprar} 
          onPress={() => comprarTarjeta(item.linkPago)}
        >
          <Text style={styles.textoBoton}>Descargar PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.tituloHeader}>Kit del Viajero Seguro</Text>
      <Text style={styles.subtituloHeader}>Descarga tu tarjeta de alergias traducida por profesionales.</Text>
      
      <FlatList
        data={catalogoTarjetas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  tituloHeader: { fontSize: 26, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  subtituloHeader: { fontSize: 16, color: '#666', marginBottom: 20 },
  tarjeta: { backgroundColor: 'white', borderRadius: 15, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  imagenTarjeta: { width: '100%', height: 180 },
  infoContenedor: { padding: 20 },
  tituloTarjeta: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  precioTarjeta: { fontSize: 18, color: '#4CAF50', fontWeight: 'bold', marginBottom: 15 },
  botonComprar: { backgroundColor: '#FF9800', padding: 15, borderRadius: 10, alignItems: 'center' },
  textoBoton: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});