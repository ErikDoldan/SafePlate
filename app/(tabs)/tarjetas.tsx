import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// 1. Diccionario de traducciones (¡Tu app ahora es políglota!)
const TRADUCCIONES = {
  es: {
    id: 'es',
    idioma: 'Español',
    alerta: 'ALERTA MÉDICA',
    titulo: 'Soy Celíaco/a',
    mensaje: 'Tengo la enfermedad celíaca y sigo una dieta estricta sin gluten. \n\nPor favor, mi comida no puede contener trigo, centeno, cebada ni avena. \n\nIncluso una pequeña cantidad de contaminación cruzada (usar la misma sartén, aceite o cuchillo) me hará enfermar gravemente. \n\n¿Pueden prepararme algo seguro?',
    gracias: '¡Muchas gracias por su ayuda!'
  },
  en: {
    id: 'en',
    idioma: 'English',
    alerta: 'MEDICAL ALERT',
    titulo: 'I have Celiac Disease',
    mensaje: 'I have celiac disease and must follow a strict gluten-free diet. \n\nMy food cannot contain any wheat, rye, barley, or oats. \n\nEven a small amount of cross-contamination (using the same pan, oil, or knife) will make me very sick. \n\nCan you prepare a safe meal for me?',
    gracias: 'Thank you for your help!'
  },
  it: {
    id: 'it',
    idioma: 'Italiano',
    alerta: 'ALLARME MEDICO',
    titulo: 'Sono Celiaco/a',
    mensaje: 'Soffro di celiachia e devo seguire una rigorosa dieta senza glutine. \n\nIl mio cibo non deve contenere grano, segale, orzo o avena. \n\nAnche una minima contaminazione crociata (usando la stessa padella, olio o coltello) mi farà stare molto male. \n\nPotete prepararmi un pasto sicuro?',
    gracias: 'Grazie mille per l\'aiuto!'
  },
  al: {
    id: 'al',
    idioma: 'Shqip', // Albanés
    alerta: 'ALARM MJEKËSOR',
    titulo: 'Unë jam Celiak',
    mensaje: 'Unë kam sëmundjen e celiakisë dhe duhet të ndjek një dietë strikte pa gluten. \n\nUshqimi im nuk duhet të përmbajë grurë, thekër, elb ose tërshërë. \n\nEdhe një sasi e vogël e kontaminimit të kryqëzuar (përdorimi i të njëjtit tigan, vaj ose thikë) do të më bëjë shumë të sëmurë. \n\nA mund të përgatisni një vakt të sigurt për mua?',
    gracias: 'Faleminderit shumë për ndihmën tuaj!'
  }
};

const IDIOMAS = Object.values(TRADUCCIONES);

export default function TarjetasScreen() {
  // Estado para saber qué idioma está seleccionado (por defecto español)
  const [idiomaActivo, setIdiomaActivo] = useState<keyof typeof TRADUCCIONES>('es');

  const cambiarIdioma = (id: keyof typeof TRADUCCIONES) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIdiomaActivo(id);
  };

  const datos = TRADUCCIONES[idiomaActivo];

  return (
    <View style={styles.contenedor}>
      {/* CABECERA */}
      <View style={styles.cabecera}>
        <Text style={styles.tituloPantalla}>Mi Tarjeta</Text>
        <Text style={styles.subtituloPantalla}>Muéstrale esto al camarero</Text>
      </View>

      {/* SELECTOR DE IDIOMAS */}
      <View style={styles.contenedorFiltros}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={IDIOMAS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.chipIdioma, idiomaActivo === item.id && styles.chipActivo]}
              onPress={() => cambiarIdioma(item.id as keyof typeof TRADUCCIONES)}
            >
              <Text style={[styles.textoChip, idiomaActivo === item.id && styles.textoChipActivo]}>
                {item.idioma}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* LA TARJETA DEL RESTAURANTE */}
      <ScrollView contentContainerStyle={styles.scrollTarjeta} showsVerticalScrollIndicator={false}>
        <View style={styles.tarjetaFisica}>
          
          {/* Banda roja superior de emergencia */}
          <View style={styles.bandaAlerta}>
            <Ionicons name="warning" size={24} color="white" />
            <Text style={styles.textoAlerta}>{datos.alerta}</Text>
            <Ionicons name="warning" size={24} color="white" />
          </View>

          {/* Contenido de la tarjeta */}
          <View style={styles.cuerpoTarjeta}>
            <Text style={styles.tituloTarjeta}>{datos.titulo}</Text>
            
            <View style={styles.separador} />
            
            <Text style={styles.mensajeTarjeta}>{datos.mensaje}</Text>
            
            <View style={styles.cajaGracias}>
              <Ionicons name="heart" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.textoGracias}>{datos.gracias}</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

// ESTILOS DE LA PANTALLA
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F8F9FA' },
  
  // Cabecera sin barra de Expo
  cabecera: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: 'white' },
  tituloPantalla: { fontSize: 32, fontWeight: '900', color: '#111827' },
  subtituloPantalla: { fontSize: 16, color: '#6B7280', marginTop: 5 },
  
  // Selector de Idiomas
  contenedorFiltros: { backgroundColor: 'white', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  chipIdioma: {
    backgroundColor: '#F3F4F6', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 25, marginRight: 10, justifyContent: 'center', alignItems: 'center'
  },
  chipActivo: { backgroundColor: '#1F2937' },
  textoChip: { fontWeight: '700', color: '#6B7280', fontSize: 15 },
  textoChipActivo: { color: 'white' },

  // Tarjeta
  scrollTarjeta: { padding: 20, paddingBottom: 50 },
  tarjetaFisica: {
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  bandaAlerta: {
    backgroundColor: '#DC2626', // Rojo médico/alerta
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  textoAlerta: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 2, marginHorizontal: 10 },
  
  cuerpoTarjeta: { padding: 25 },
  tituloTarjeta: { fontSize: 28, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 15 },
  separador: { height: 2, backgroundColor: '#F3F4F6', width: '50%', alignSelf: 'center', marginBottom: 20 },
  
  mensajeTarjeta: { fontSize: 18, color: '#374151', lineHeight: 28, fontWeight: '500' },
  
  cajaGracias: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: 16,
    marginTop: 30
  },
  textoGracias: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' }
});