import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  
  // NUEVO: Memoria para saber qué código estamos viendo y poder corregirlo
  const [codigoActual, setCodigoActual] = useState<string | null>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.textoCentro}>Necesitamos permiso para la cámara.</Text>
        <Button onPress={requestPermission} title="Dar permiso" />
      </View>
    );
  }

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
    setEscaneando(false);
    setCargando(true);
    setCodigoActual(data); // Guardamos el código escaneado
    
    try {
      // 1. Miramos en TU base de datos primero
      const { data: local, error: supabaseError } = await supabase
        .from('productos')
        .select('*')
        .eq('codigo', data)
        .maybeSingle();

      if (local) {
        setResultado({ nombre: local.nombre, seguro: local.seguro, fuente: 'Tu Base de Datos' });
      } else {
        // 2. Si no está, vamos a la red mundial
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
        } else {
          setResultado({ nombre: "No encontrado en la red", seguro: null });
        }
      }
    } catch (e) {
      setResultado({ nombre: "Error de red", seguro: null });
    }
    setCargando(false);
  };

  // NUEVO: Función para corregir la base de datos desde el móvil
  const guardarCorreccion = async (esSeguro: boolean) => {
    if (!codigoActual) return;
    setCargando(true);
    
    // Upsert significa: "Si no existe, créalo. Si existe, actualízalo"
    const { error } = await supabase
      .from('productos')
      .upsert({ 
        codigo: codigoActual, 
        nombre: resultado?.nombre || 'Producto Corregido', 
        seguro: esSeguro 
      });

    if (!error) {
      // Actualizamos la pantalla inmediatamente
      setResultado(prev => prev ? { ...prev, seguro: esSeguro, fuente: 'Tu Base de Datos (Corregido)' } : null);
    } else {
      console.log("Error guardando:", error);
    }
    setCargando(false);
  };

  return (
    <View style={styles.container}>
      {escaneando ? (
        <CameraView style={StyleSheet.absoluteFillObject} onBarcodeScanned={handleBarcodeScanned} />
      ) : (
        <View style={styles.tarjeta}>
          {cargando ? <ActivityIndicator size="large" color="#2196F3" /> : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fuente}>{resultado?.fuente}</Text>
              <Text style={styles.titulo}>{resultado?.nombre}</Text>
              
              <View style={[styles.badge, { backgroundColor: resultado?.seguro ? '#4CAF50' : (resultado?.seguro === false ? '#F44336' : '#9E9E9E') }]}>
                <Text style={styles.badgeText}>
                  {resultado?.seguro ? '✅ SEGURO' : (resultado?.seguro === false ? '❌ CON GLUTEN' : '⚠️ DESCONOCIDO')}
                </Text>
              </View>

              {/* BOTONES DE MODO DIOS (SOLO APARECEN SI EL PRODUCTO NO VIENE DE TU BASE DE DATOS) */}
              {resultado?.fuente !== 'Tu Base de Datos' && resultado?.fuente !== 'Tu Base de Datos (Corregido)' && (
                <View style={styles.zonaCorreccion}>
                  <Text style={styles.textoCorreccion}>¿La información es incorrecta?</Text>
                  <View style={styles.botonesFila}>
                    <TouchableOpacity style={[styles.botonCorregir, { backgroundColor: '#4CAF50' }]} onPress={() => guardarCorreccion(true)}>
                      <Text style={styles.textoBotonChico}>✅ Marcar Seguro</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.botonCorregir, { backgroundColor: '#F44336' }]} onPress={() => guardarCorreccion(false)}>
                      <Text style={styles.textoBotonChico}>❌ Marcar Peligro</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.boton} onPress={() => { setResultado(null); setEscaneando(true); }}>
                <Text style={styles.btnText}>ESCANEAR OTRO</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  tarjeta: { backgroundColor: 'white', padding: 25, borderRadius: 20, width: '85%', maxHeight: '85%' },
  fuente: { fontSize: 10, color: '#aaa', textAlign: 'center', textTransform: 'uppercase' },
  titulo: { fontSize: 20, fontWeight: 'bold', marginVertical: 15, textAlign: 'center' },
  badge: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  badgeText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  boton: { marginTop: 20, backgroundColor: '#2196F3', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  textoCentro: { color: 'white' },
  zonaCorreccion: { marginTop: 15, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10 },
  textoCorreccion: { textAlign: 'center', color: '#666', marginBottom: 10, fontSize: 12 },
  botonesFila: { flexDirection: 'row', justifyContent: 'space-between' },
  botonCorregir: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  textoBotonChico: { color: 'white', fontWeight: 'bold', fontSize: 12 }
});