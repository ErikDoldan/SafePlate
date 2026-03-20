import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ResultadoProducto = {
  nombre: string;
  seguro: boolean | null;
  ingredientes?: string;
};

export default function ProductosScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [escaneando, setEscaneando] = useState(true);
  const [resultado, setResultado] = useState<ResultadoProducto | null>(null);
  const [cargando, setCargando] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.textoCentro}>Necesitamos permiso para la cámara.</Text>
        <Button onPress={requestPermission} title="Dar permiso" />
      </View>
    );
  }

const analizarIngredientes = (textoIngredientes: string) => {
    if (!textoIngredientes) return null;
    const textoBajo = textoIngredientes.toLowerCase();

    // 1. Si el fabricante pone "sin gluten" explícitamente, es SEGURO
    if (textoBajo.includes('sin gluten') || textoBajo.includes('gluten free') || textoBajo.includes('sno gluten')) {
      return true; 
    }

    // 2. Si no lo pone, buscamos las palabras prohibidas
    const palabrasProhibidas = ['trigo', 'wheat', 'cebada', 'barley', 'centeno', 'rye', 'avena', 'oats', 'gluten'];
    
    // Filtramos para evitar detectar "almidón de trigo SIN GLUTEN" como malo
    const contieneGluten = palabrasProhibidas.some(palabra => {
      const posicion = textoBajo.indexOf(palabra);
      if (posicion === -1) return false;
      
      // Miramos los 15 caracteres anteriores a la palabra (por si pone "sin" o "free")
      const fragmentoAnterior = textoBajo.substring(posicion - 15, posicion);
      if (fragmentoAnterior.includes('sin') || fragmentoAnterior.includes('free')) {
        return false; 
      }
      return true;
    });

    return !contieneGluten;
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setEscaneando(false);
    setCargando(true);
    
    try {
      // 1. Consultamos la base de datos mundial de Open Food Facts
      const respuesta = await fetch(`https://world.openfoodfacts.org/api/v2/product/${data}.json`);
      const json = await respuesta.json();

      if (json.status === 1) {
        const p = json.product;
        const nombre = p.product_name || "Producto sin nombre";
        const ingredientes = p.ingredients_text || "";
        
        // 2. Analizamos si es seguro basándonos en los ingredientes
        const esSeguro = analizarIngredientes(ingredientes);

        setResultado({
          nombre: nombre,
          seguro: esSeguro,
          ingredientes: ingredientes
        });
      } else {
        setResultado({ nombre: "No encontrado en la red mundial", seguro: null });
      }
    } catch (error) {
      setResultado({ nombre: "Error de conexión", seguro: null });
    }

    setCargando(false);
  };

  return (
    <View style={styles.container}>
      {escaneando ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8"] }}
        />
      ) : (
        <View style={styles.tarjetaResultado}>
          {cargando ? (
            <ActivityIndicator size="large" color="#2196F3" />
          ) : (
            <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
              <Text style={styles.tituloProducto}>{resultado?.nombre}</Text>
              
              {resultado?.seguro === true && (
                <Text style={[styles.estado, { backgroundColor: '#4CAF50' }]}>✅ PARECE SEGURO</Text>
              )}
              {resultado?.seguro === false && (
                <Text style={[styles.estado, { backgroundColor: '#F44336' }]}>❌ CONTIENE GLUTEN</Text>
              )}
              {resultado?.seguro === null && (
                <Text style={[styles.estado, { backgroundColor: '#9E9E9E' }]}>⚠️ DESCONOCIDO</Text>
              )}

              {resultado?.ingredientes && (
                <Text style={styles.textoIngredientes}>
                  <Text style={{fontWeight: 'bold'}}>Ingredientes detectados:</Text> {"\n"}
                  {resultado.ingredientes.substring(0, 200)}...
                </Text>
              )}

              <TouchableOpacity 
                style={styles.botonEscanear} 
                onPress={() => { setResultado(null); setEscaneando(true); }}
              >
                <Text style={styles.textoBoton}>Escanear otro</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  textoCentro: { color: 'white', textAlign: 'center', marginBottom: 20 },
  tarjetaResultado: { backgroundColor: 'white', padding: 25, borderRadius: 20, width: '85%', maxHeight: '80%', elevation: 10 },
  tituloProducto: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  estado: { color: 'white', padding: 12, borderRadius: 10, fontSize: 16, fontWeight: 'bold', textAlign: 'center', width: '100%', marginBottom: 15 },
  textoIngredientes: { fontSize: 13, color: '#666', marginBottom: 20, fontStyle: 'italic' },
  botonEscanear: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  textoBoton: { color: 'white', fontWeight: 'bold' }
});