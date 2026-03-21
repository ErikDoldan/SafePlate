import { Ionicons } from '@expo/vector-icons'; // <-- Iconos Premium
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics'; // <-- Haptics para vibración premium
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabase';

type ResultadoProducto = {
  nombre: string;
  seguro: boolean | null;
  ingredientes?: string;
  fuente?: string;
};

export default function ProductosScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [escaneando, setEscaneando] = useState(true);
  const [resultado, setResultado] = useState<ResultadoProducto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [codigoActual, setCodigoActual] = useState<string | null>(null);

  // --- SOLUCIÓN: PANTALLA DE PERMISOS PERFECTAMENTE CENTRADA ---
  if (!permission || !permission.granted) {
    return (
      <View style={styles.fondoGrisCentro}>
        <View style={styles.tarjetaModernaPermiso}>
          <View style={styles.contenedorIconoGrande}>
            {/* Logo de la cámara grande, minimalista y perfectamente centrado */}
            <Ionicons name="scan-circle-outline" size={100} color="#10B981" />
          </View>
          
          <Text style={styles.tituloPermiso}>¡Vamos a escanear!</Text>
          <Text style={styles.textoCentroPermiso}>
            Necesitamos acceso a tu cámara para leer los códigos de barras de los productos y verificar si son seguros.
          </Text>
          
          <TouchableOpacity style={styles.botonPrimario} onPress={requestPermission}>
            <Text style={styles.textoBoton}>Dar permiso</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  // -----------------------------------------------------------

  // --- TU LÓGICA ORIGINAL (INTACTA) ---
  const analizarIngredientes = (texto: string) => {
    if (!texto) return null;
    const t = texto.toLowerCase();
    const seguroKeywords = ['sin gluten', 'gluten free', 'pa gluten', 'sno gluten'];
    if (seguroKeywords.some(key => t.includes(key))) return true;

    const prohibidas = ['trigo', 'wheat', 'grurë', 'cebada', 'barley', 'elb', 'centeno', 'rye', 'thekër', 'avena', 'oats', 'tërhërë', 'gluten'];
    
    const contieneGluten = prohibidas.some(p => {
      const pos = t.indexOf(p);
      if (pos === -1) return false;
      const trozoAntes = t.substring(Math.max(0, pos - 15), pos);
      if (trozoAntes.includes('pa ') || trozoAntes.includes('sin') || trozoAntes.includes('free')) return false;
      return true;
    });
    return !contieneGluten;
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Vibración al detectar
    setEscaneando(false);
    setCargando(true);
    setCodigoActual(data); 
    
    try {
      const { data: local, error: supabaseError } = await supabase
        .from('productos')
        .select('*')
        .eq('codigo', data)
        .maybeSingle();

      if (local) {
        setResultado({ nombre: local.nombre, seguro: local.seguro, fuente: 'Tu Base de Datos' });
        lanzaVibracion(local.seguro);
      } else {
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${data}.json`);
        const json = await res.json();

        if (json.status === 1) {
          const p = json.product;
          const labels = p.labels_tags || [];
          const allergens = p.allergens_tags || [];
          const ingredientsText = p.ingredients_text || "";

          let esSeguro = null;
          const esOficialmenteSinGluten = labels.some((tag: string) => tag.includes('gluten-free') || tag.includes('sin-gluten'));
          const esOficialmenteConGluten = allergens.some((tag: string) => tag.includes('gluten'));

          if (esOficialmenteSinGluten) {
            esSeguro = true; 
          } else if (esOficialmenteConGluten) {
            esSeguro = false; 
          } else {
            esSeguro = analizarIngredientes(ingredientsText);
          }

          setResultado({
            nombre: p.product_name || "Producto desconocido",
            seguro: esSeguro,
            ingredientes: ingredientsText,
            fuente: 'Red Mundial'
          });
          lanzaVibracion(esSeguro);
        } else {
          setResultado({ nombre: "No encontrado en la red", seguro: null });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    } catch (e) {
      setResultado({ nombre: "Error de red", seguro: null });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setCargando(false);
  };

  const lanzaVibracion = (esSeguro: boolean | null) => {
    if (esSeguro === true) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (esSeguro === false) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  // --- TU LÓGICA DE CORRECCIÓN (INTACTA) ---
  const guardarCorreccion = async (esSeguro: boolean) => {
    if (!codigoActual) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCargando(true);
    
    const { error } = await supabase
      .from('productos')
      .upsert({ 
        codigo: codigoActual, 
        nombre: resultado?.nombre || 'Producto Corregido', 
        seguro: esSeguro 
      });

    if (!error) {
      setResultado(prev => prev ? { ...prev, seguro: esSeguro, fuente: 'Tu Base de Datos (Corregido)' } : null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      console.log("Error guardando:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setCargando(false);
  };

  return (
    <View style={styles.fondoGris}>
      {escaneando ? (
        <View style={styles.contenedorCamara}>
          <CameraView style={StyleSheet.absoluteFillObject} onBarcodeScanned={handleBarcodeScanned} barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "qr"] }} />
          {/* Overlay decorativo de escáner */}
          <View style={styles.marcoEscaner}>
            <Ionicons name="scan-outline" size={250} color="rgba(255,255,255,0.6)" />
          </View>
        </View>
      ) : (
        <View style={styles.tarjetaModerna}>
          {cargando ? <ActivityIndicator size="large" color="#10B981" style={{marginVertical: 40}} /> : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{alignItems: 'center'}}>
              
              <View style={styles.fuenteBadge}>
                <Ionicons name="cloud-done-outline" size={12} color="#6B7280" style={{marginRight: 4}}/>
                <Text style={styles.fuenteTexto}>{resultado?.fuente}</Text>
              </View>

              <Text style={styles.titulo}>{resultado?.nombre}</Text>
              
              {/* BADGES PREMIUM */}
              {resultado?.seguro === true && (
                <View style={[styles.estadoBadge, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={[styles.badgeText, { color: '#10B981' }]}>SEGURO</Text>
                </View>
              )}
              {resultado?.seguro === false && (
                <View style={[styles.estadoBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="warning" size={24} color="#EF4444" />
                  <Text style={[styles.badgeText, { color: '#EF4444' }]}>CONTIENE GLUTEN</Text>
                </View>
              )}
              {resultado?.seguro === null && (
                <View style={[styles.estadoBadge, { backgroundColor: '#F3F4F6' }]}>
                  <Ionicons name="help-circle" size={24} color="#6B7280" />
                  <Text style={[styles.badgeText, { color: '#6B7280' }]}>DESCONOCIDO</Text>
                </View>
              )}

              {/* ZONA DE CORRECCIÓN MEJORADA */}
              {resultado?.fuente !== 'Tu Base de Datos' && resultado?.fuente !== 'Tu Base de Datos (Corregido)' && (
                <View style={styles.zonaCorreccion}>
                  <Text style={styles.textoCorreccion}>¿Información incorrecta? Ayuda a la comunidad:</Text>
                  <View style={styles.botonesFila}>
                    <TouchableOpacity style={[styles.botonCorregir, { backgroundColor: '#D1FAE5' }]} onPress={() => guardarCorreccion(true)}>
                      <Ionicons name="checkmark" size={16} color="#10B981" />
                      <Text style={[styles.textoBotonChico, {color: '#10B981'}]}>Es Seguro</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.botonCorregir, { backgroundColor: '#FEE2E2' }]} onPress={() => guardarCorreccion(false)}>
                      <Ionicons name="close" size={16} color="#EF4444" />
                      <Text style={[styles.textoBotonChico, {color: '#EF4444'}]}>Peligro</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.botonPrimario} onPress={() => { 
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setResultado(null); 
                setEscaneando(true); 
              }}>
                <Ionicons name="barcode-outline" size={20} color="white" style={{marginRight: 8}} />
                <Text style={styles.textoBoton}>Escanear otro</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

// ESTILOS PREMIUM UNIFICADOS
const styles = StyleSheet.create({
  fondoGris: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center' },
  fondoGrisCentro: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', padding: 20 },
  contenedorCamara: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  marcoEscaner: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  tarjetaModernaPermiso: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  contenedorIconoGrande: { marginBottom: 30, marginTop: 10 },
  tituloPermiso: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 15, textAlign: 'center' },
  textoCentroPermiso: { textAlign: 'center', marginBottom: 30, fontSize: 16, color: '#6B7280', lineHeight: 24 },
  tarjetaModerna: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    width: '85%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  fuenteBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  fuenteTexto: { fontSize: 10, color: '#6B7280', textTransform: 'uppercase', fontWeight: 'bold' },
  titulo: { fontSize: 22, fontWeight: '800', marginVertical: 10, textAlign: 'center', color: '#1F2937' },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 100, marginBottom: 20 },
  badgeText: { fontWeight: '800', fontSize: 16, marginLeft: 8 },
  botonPrimario: { 
    flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 16, paddingHorizontal: 32, 
    borderRadius: 16, alignItems: 'center', width: '100%', justifyContent: 'center',
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
  },
  textoBoton: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  zonaCorreccion: { width: '100%', marginTop: 10, padding: 16, backgroundColor: '#F8F9FA', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  textoCorreccion: { textAlign: 'center', color: '#6B7280', marginBottom: 12, fontSize: 13, fontWeight: '600' },
  botonesFila: { flexDirection: 'row', justifyContent: 'space-between' },
  botonCorregir: { flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  textoBotonChico: { fontWeight: 'bold', fontSize: 13, marginLeft: 4 }
});