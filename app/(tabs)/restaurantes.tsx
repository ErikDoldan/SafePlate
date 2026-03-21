import { Ionicons } from '@expo/vector-icons'; // <-- Añadimos Iconos Premium
import * as Haptics from 'expo-haptics'; // <-- Añadimos Haptics
import React from 'react';
import { FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 1. Definimos qué datos tiene un Restaurante (para que TypeScript no se queje)
type Restaurante = {
  id: string;
  nombre: string;
  direccion: string;
  puntuacion: number; // Cambiamos a número para hacerlo más dinámico
  imagen: string;
  urlMapa: string;
};

// 2. Nuestra lista de restaurantes de prueba
const listaRestaurantes: Restaurante[] = [
  {
    id: '1',
    nombre: 'La Trattoria Sin Gluten',
    direccion: 'Calle Roma 123, Centro',
    puntuacion: 5,
    imagen: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
    urlMapa: 'https://maps.app.goo.gl/FkGzRzZqM4zJbJ1' // Link real de ejemplo
  },
  {
    id: '2',
    nombre: 'Burger SafePlate',
    direccion: 'Avenida Libertad 45',
    puntuacion: 4,
    imagen: 'https://images.unsplash.com/photo-1466978913421-bac2e58c6421?w=500&q=80',
    urlMapa: 'https://maps.app.goo.gl/FkGzRzZqM4zJbJ1' // Link real de ejemplo
  }
];

// Función auxiliar para pintar las estrellas naranjas de la puntuación
const Estrellas = ({ count }: { count: number }) => {
  return (
    <View style={styles.contenedorEstrellas}>
      {/* Pintamos estrellas naranjas hasta llegar al número */}
      {[...Array(5)].map((_, i) => (
        <Ionicons 
          key={i} 
          name={i < count ? "star" : "star-outline"} 
          size={16} 
          color={i < count ? "#F59E0B" : "#D1D5DB"} // Naranja brillante vs gris suave
          style={{marginRight: 2}}
        />
      ))}
      <Text style={styles.textoPuntuacion}> ({count}.0)</Text>
    </View>
  );
};

export default function RestaurantesScreen() {

  // 3. Función para abrir Google Maps en el móvil
  const abrirMapa = (url: string) => {
    // Magia: Vibración de "impacto" suave al pulsar el botón
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  // 4. Diseño PREMIUM de cada tarjeta de restaurante
  const renderItem = ({ item }: { item: Restaurante }) => (
    <View style={styles.tarjetaModerna}>
      <Image source={{ uri: item.imagen }} style={styles.imagenTarjeta} />
      
      <View style={styles.infoContenedor}>
        <Text style={styles.tituloRestaurante}>{item.nombre}</Text>
        
        <View style={styles.filaDireccion}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.direccionRestaurante}>{item.direccion}</Text>
        </View>

        <Estrellas count={item.puntuacion} />
        
        <TouchableOpacity 
          style={styles.botonPrimarioMapa} 
          onPress={() => abrirMapa(item.urlMapa)}
        >
          <Ionicons name="map-outline" size={18} color="white" style={{marginRight: 8}} />
          <Text style={styles.textoBotonMapa}>Ver cómo llegar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.fondoGris}>
      <FlatList
        data={listaRestaurantes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        // Mucho margen arriba y abajo para que respire la lista
        contentContainerStyle={{ paddingVertical: 20 }}
        // Cabecera minimalista dentro de la lista (para que haga scroll)
        ListHeaderComponent={() => (
          <View style={styles.headerContenedor}>
            <Text style={styles.subtituloHeader}>Locales verificados y aptos para celíacos.</Text>
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
    backgroundColor: '#F8F9FA' // Gris súper clarito unificado
  },
  headerContenedor: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  subtituloHeader: { 
    fontSize: 16, 
    color: '#6B7280', // Gris elegante
    lineHeight: 22 
  },
  tarjetaModerna: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, // Esquinas suaves
    marginHorizontal: 16, // Separado de los bordes del móvil
    marginBottom: 20, 
    overflow: 'hidden', // Para que la imagen respete las esquinas redondas
    // La sombra flotante suave premium (unificada con el escáner)
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 3 // Sombra Android
  },
  imagenTarjeta: { 
    width: '100%', 
    height: 160 
  },
  infoContenedor: { 
    padding: 20 // Mucho espacio por dentro
  },
  tituloRestaurante: { 
    fontSize: 20, 
    fontWeight: '800', // Texto muy grueso
    marginBottom: 8, 
    color: '#1F2937' // Texto casi negro elegante
  },
  filaDireccion: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  direccionRestaurante: { 
    fontSize: 14, 
    color: '#6B7280', // Gris suave
    marginLeft: 5 
  },
  contenedorEstrellas: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  textoPuntuacion: { 
    fontSize: 14, 
    color: '#6B7280', 
    fontWeight: '600' 
  },
  botonPrimarioMapa: { 
    flexDirection: 'row', // Icono + Texto
    backgroundColor: '#10B981', // Verde marca SafePlate unificado
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    // Sombra del botón
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  textoBotonMapa: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});