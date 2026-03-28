import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Dimensions, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function EscanerScreen() {
  // --- 1. ESTADOS DE LA CÁMARA Y ESCÁNER ---
  const [permission, requestPermission] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState(false);
  const [cargando, setCargando] = useState(false);
  
  // --- 2. ESTADOS DEL PRODUCTO ---
  const [producto, setProducto] = useState<any>(null);
  const [esSeguro, setEsSeguro] = useState<boolean | null>(null);

  // --- 3. ESTADOS DEL HISTORIAL ---
  const [historial, setHistorial] = useState<any[]>([]);
  const [verHistorial, setVerHistorial] = useState(false);

  // Cargar historial al iniciar la app
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const historialGuardado = await AsyncStorage.getItem('@historial_escaneos');
        if (historialGuardado !== null) {
          setHistorial(JSON.parse(historialGuardado));
        }
      } catch (e) {
        console.error("Error leyendo historial", e);
      }
    };
    cargarHistorial();
  }, []);

  // Función para guardar en el móvil
  const guardarEnHistorial = async (nuevoProducto: any, seguro: boolean) => {
    try {
      // Preparamos el objeto a guardar
      const itemHistorial = {
        id: nuevoProducto.code,
        nombre: nuevoProducto.product?.product_name || 'Producto desconocido',
        marca: nuevoProducto.product?.brands || 'Sin marca',
        imagen_url: nuevoProducto.product?.image_front_url,
        esSeguro: seguro,
        fecha: new Date().toISOString()
      };

      // Quitamos duplicados (si vuelves a escanear lo mismo, se pone el primero)
      const historialSinDuplicado = historial.filter(item => item.id !== itemHistorial.id);
      
      // Añadimos el nuevo al principio y guardamos solo los últimos 20
      const nuevoHistorial = [itemHistorial, ...historialSinDuplicado].slice(0, 20);
      
      setHistorial(nuevoHistorial);
      await AsyncStorage.setItem('@historial_escaneos', JSON.stringify(nuevoHistorial));
    } catch (e) {
      console.error("Error guardando historial", e);
    }
  };

  // --- 4. LÓGICA DEL ESCÁNER ---
  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    // 1. ESCUDO ANTI-QR: Si el código tiene letras o símbolos raros, lo ignoramos.
    // Los códigos de barras de comida (EAN/UPC) solo tienen números.
    if (!/^\d+$/.test(data)) {
      console.log("Ignorando código no numérico (posible QR):", data);
      return; 
    }

    setEscaneado(true);
    setCargando(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SafePlateApp/1.0' 
        }
      });

      // Si el servidor nos bloquea por ir muy rápido (Error 429 Too Many Requests)
      if (!response.ok) {
        throw new Error("El servidor bloqueó la petición o falló la red.");
      }

      const json = await response.json();

      if (json.status === 1) {
        setProducto(json.product);
        
        const ingredientes = json.product.ingredients_text_es || json.product.ingredients_text || "";
        const alergenos = json.product.allergens || "";
        
        if (ingredientes.trim() === "" && alergenos.trim() === "") {
          setEsSeguro(null); 
          guardarEnHistorial(json, false); 
        } else {
          const tieneGluten = alergenos.toLowerCase().includes('gluten') || ingredientes.toLowerCase().includes('trigo');
          const resultadoSeguro = !tieneGluten;
          setEsSeguro(resultadoSeguro);
          guardarEnHistorial(json, resultadoSeguro);
        }
      } else {
        setProducto(null);
        setEsSeguro(null);
      }
    } catch (error) {
      // 2. ESCUDO ANTI-CRASH: Usamos console.log en lugar de console.error
      // Así vemos el fallo en la terminal pero NO salta la pantalla roja en el móvil
      console.log("Fallo de red (probablemente escaneaste muy rápido):", error);
      
      // Limpiamos los datos para que muestre el mensaje de "No encontrado" tranquilamente
      setProducto(null);
      setEsSeguro(null);
    } finally {
      setCargando(false);
    }
  };

  // Resetear para escanear otro
  const escanearDeNuevo = () => {
    setEscaneado(false);
    setProducto(null);
    setEsSeguro(null);
  };

  // --- 5. PERMISOS DE CÁMARA ---
  if (!permission) return <View style={styles.pantallaCentral}><ActivityIndicator size="large" color="#10B981"/></View>;
  if (!permission.granted) {
    return (
      <View style={styles.pantallaCentral}>
        <Ionicons name="camera-outline" size={60} color="#6B7280" />
        <Text style={styles.textoPermiso}>Necesitamos tu permiso para usar la cámara y escanear los productos.</Text>
        <Button title="Dar Permiso" onPress={requestPermission} color="#10B981" />
      </View>
    );
  }

  // --- 6. RENDERIZADO DE LA PANTALLA ---
  return (
    <View style={styles.contenedor}>
      {/* LA CÁMARA */}
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        facing="back"
        onBarcodeScanned={escaneado ? undefined : handleBarCodeScanned}
      />

      {/* DISEÑO DEL ESCÁNER (Cuadrado central y oscurecido alrededor) */}
      <View style={styles.capaOscuraSuperior}>
        <Text style={styles.textoInstruccion}>Escanea el código de barras</Text>
      </View>
      <View style={styles.filaCentralEscaner}>
        <View style={styles.capaOscuraLateral} />
        <View style={styles.cuadroEscaner}>
          {cargando && <ActivityIndicator size="large" color="#10B981" style={styles.cargadorCentral} />}
        </View>
        <View style={styles.capaOscuraLateral} />
      </View>
      <View style={styles.capaOscuraInferior} />

      {/* BOTÓN FLOTANTE DEL HISTORIAL */}
      <TouchableOpacity style={styles.botonHistorial} onPress={() => setVerHistorial(true)}>
        <Ionicons name="time" size={26} color="white" />
      </TouchableOpacity>

      {/* TARJETA DE RESULTADO FLOTANTE */}
      {escaneado && !cargando && (
        <View style={styles.tarjetaResultado}>
          {producto ? (
            <>
              <View style={styles.cabeceraResultado}>
                <Image source={{ uri: producto.image_front_url || 'https://via.placeholder.com/100' }} style={styles.imagenProducto} />
                <View style={styles.infoProducto}>
                  <Text style={styles.nombreProducto} numberOfLines={2}>{producto.product_name || 'Desconocido'}</Text>
                  <Text style={styles.marcaProducto}>{producto.brands || 'Marca no registrada'}</Text>
                </View>
              </View>
              
              <View style={[
                styles.cajaVeredicto, 
                esSeguro === true ? styles.fondoSeguro : 
                esSeguro === false ? styles.fondoPeligro : 
                styles.fondoAviso // El nuevo color de precaución
              ]}>
                <Ionicons 
                  name={esSeguro === true ? "checkmark-circle" : esSeguro === false ? "warning" : "help-circle"} 
                  size={28} 
                  color={esSeguro === true ? "#059669" : esSeguro === false ? "#DC2626" : "#D97706"} 
                />
                <Text style={[
                  styles.textoVeredicto, 
                  { color: esSeguro === true ? "#059669" : esSeguro === false ? "#DC2626" : "#D97706" }
                ]}>
                  {esSeguro === true ? 'APTO (Sin Gluten)' : 
                   esSeguro === false ? 'NO APTO (Contiene Gluten)' : 
                   'PRECAUCIÓN (Faltan datos)'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.textoNoEncontrado}>No hemos encontrado este producto en la base de datos.</Text>
          )}

          <TouchableOpacity style={styles.botonVolver} onPress={escanearDeNuevo}>
            <Text style={styles.textoVolver}>Escanear otro producto</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL DEL HISTORIAL (Superpuesto) */}
      <Modal visible={verHistorial} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContenedor}>
          <View style={styles.modalCabecera}>
            <Text style={styles.modalTitulo}>Historial</Text>
            <TouchableOpacity onPress={() => setVerHistorial(false)}>
              <Ionicons name="close-circle" size={32} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {historial.length === 0 ? (
            <View style={styles.modalVacio}>
              <Ionicons name="receipt-outline" size={60} color="#D1D5DB" />
              <Text style={styles.modalTextoVacio}>Aún no has escaneado nada.</Text>
            </View>
          ) : (
            <FlatList
              data={historial}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 30 }}
              renderItem={({ item }) => (
                <View style={styles.itemHistorial}>
                  <Image source={{ uri: item.imagen_url || 'https://via.placeholder.com/60' }} style={styles.itemImagen} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemNombre} numberOfLines={1}>{item.nombre}</Text>
                    <Text style={styles.itemMarca} numberOfLines={1}>{item.marca}</Text>
                  </View>
                  <View style={styles.itemIcono}>
                    <Ionicons 
                      name={item.esSeguro ? "checkmark-circle" : "close-circle"} 
                      size={28} 
                      color={item.esSeguro ? "#10B981" : "#EF4444"} 
                    />
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

// --- 7. ESTILOS SÚPER PREMIUM ---
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: 'black' },
  pantallaCentral: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  textoPermiso: { textAlign: 'center', fontSize: 16, color: '#4B5563', marginVertical: 20 },
  
  // Capas oscuras para hacer el efecto de "escaner" en medio
  capaOscuraSuperior: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20 },
  filaCentralEscaner: { flexDirection: 'row', height: width * 0.7 },
  capaOscuraLateral: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  cuadroEscaner: { width: width * 0.7, borderColor: '#10B981', borderWidth: 2, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  capaOscuraInferior: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  textoInstruccion: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cargadorCentral: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 15, borderRadius: 50 },

  // Botón Historial
  botonHistorial: { position: 'absolute', top: 60, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 30 },

  // Tarjeta de Resultado (Abajo)
  tarjetaResultado: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  cabeceraResultado: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  imagenProducto: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F3F4F6' },
  infoProducto: { flex: 1, marginLeft: 15 },
  nombreProducto: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  marcaProducto: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  cajaVeredicto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 16, marginBottom: 15 },
  fondoSeguro: { backgroundColor: '#D1FAE5' },
  fondoPeligro: { backgroundColor: '#FEE2E2' },
  fondoAviso: { backgroundColor: '#FEF3C7' },
  textoVeredicto: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  textoNoEncontrado: { textAlign: 'center', fontSize: 16, color: '#4B5563', marginBottom: 20 },
  botonVolver: { backgroundColor: '#1F2937', padding: 16, borderRadius: 16, alignItems: 'center' },
  textoVolver: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // Estilos del Modal Historial
  modalContenedor: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 20, paddingTop: 20 },
  modalCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitulo: { fontSize: 28, fontWeight: '900', color: '#111827' },
  modalVacio: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  modalTextoVacio: { fontSize: 18, color: '#6B7280', marginTop: 15 },
  itemHistorial: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  itemImagen: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#F3F4F6' },
  itemInfo: { flex: 1, marginLeft: 15, marginRight: 10 },
  itemNombre: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  itemMarca: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  itemIcono: { width: 30, alignItems: 'center' }
});