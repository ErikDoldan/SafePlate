import { Ionicons } from '@expo/vector-icons'; // <-- Los iconos
import * as Haptics from 'expo-haptics'; // <-- La vibración premium
import React from 'react';
import { FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 1. Definimos qué datos tiene una Tarjeta
type Tarjeta = {
  id: string;
  idioma: string;
  descripcion: string;
  precio: string;
  imagen: string;
  linkPago: string;
};

// 2. Nuestro catálogo (he añadido una breve descripción para que quede más pro)
const catalogoTarjetas: Tarjeta[] = [
  {
    id: '1',
    idioma: 'Tarjeta en Japonés',
    descripcion: 'Traducción nativa garantizada. Ideal para sushi, ramen y comida callejera.',
    precio: '3,99€',
    imagen: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=500&q=80',
    linkPago: 'https://www.google.com' // Tu link de Stripe irá aquí
  },
  {
    id: '2',
    idioma: 'Tarjeta en Inglés',
    descripcion: 'Válida para EEUU, Reino Unido, Australia y más. Universal y segura.',
    precio: '3,99€',
    imagen: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500&q=80',
    linkPago: 'https://www.google.com'
  },
];

export default function TarjetasScreen() {

  // 3. Función de compra con vibración
  const comprarTarjeta = (link: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Vibración al "comprar"
    Linking.openURL(link);
  };

  // 4. Diseño de la Tarjeta Flotante
  const renderItem = ({ item }: { item: Tarjeta }) => (
    <View style={styles.tarjetaModerna}>
      <Image source={{ uri: item.imagen }} style={styles.imagenTarjeta} />
      
      <View style={styles.infoContenedor}>
        <View style={styles.filaTitulo}>
          <Text style={styles.tituloTarjeta}>{item.idioma}</Text>
          <View style={styles.badgePrecio}>
            <Text style={styles.textoPrecio}>{item.precio}</Text>
          </View>
        </View>

        <Text style={styles.descripcionTarjeta}>{item.descripcion}</Text>
        
        <TouchableOpacity 
          style={styles.botonPrimario} 
          onPress={() => comprarTarjeta(item.linkPago)}
        >
          <Ionicons name="cloud-download-outline" size={20} color="white" style={{marginRight: 8}} />
          <Text style={styles.textoBoton}>Descargar PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.fondoGris}>
      <FlatList
        data={catalogoTarjetas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 20 }}
        ListHeaderComponent={() => (
          <View style={styles.headerContenedor}>
            <Text style={styles.subtituloHeader}>Viaja seguro. Enseña tu tarjeta al camarero en su idioma y evita la contaminación cruzada.</Text>
          </View>
        )}
      />
    </View>
  );
}

// 5. ESTILOS PREMIUM UNIFICADOS
const styles = StyleSheet.create({
  fondoGris: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' // Gris unificado con el resto de la app
  },
  headerContenedor: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  subtituloHeader: { 
    fontSize: 16, 
    color: '#6B7280', 
    lineHeight: 22 
  },
  tarjetaModerna: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    marginHorizontal: 16, 
    marginBottom: 24, 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 3 
  },
  imagenTarjeta: { 
    width: '100%', 
    height: 180 
  },
  infoContenedor: { 
    padding: 20 
  },
  filaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Separa el título del precio a los extremos
    alignItems: 'center',
    marginBottom: 8,
  },
  tituloTarjeta: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#1F2937',
    flex: 1, // Para que si el texto es muy largo no pise el precio
  },
  badgePrecio: {
    backgroundColor: '#ECFDF5', // Fondo verde muy clarito
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  textoPrecio: { 
    fontSize: 16, 
    color: '#10B981', // Verde de la marca SafePlate
    fontWeight: '900', 
  },
  descripcionTarjeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  botonPrimario: { 
    flexDirection: 'row',
    backgroundColor: '#10B981', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  textoBoton: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});