import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar'; // <-- Importamos el control de la hora/batería

export default function TabLayout() {
  return (
    <>
      {/* Esto fuerza a que la hora, batería y wifi se vean siempre en negro/gris oscuro */}
      <StatusBar style="dark" /> 

      <Tabs
        initialRouteName="restaurantes"
        screenOptions={{
          tabBarActiveTintColor: '#10B981',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: -5 },
            // --- AQUÍ ESTÁ LA MAGIA PARA EL IPHONE ---
            height: 85, // Más alto
            paddingBottom: 30, // Mucho más margen por abajo para librar la rayita del iPhone
            paddingTop: 10,
            // ----------------------------------------
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#333333',
            fontSize: 22,
          }
        }}
      >
        <Tabs.Screen 
          name="descubre" 
          options={{ 
            title: 'Descubre',
            headerShown: false,
            tabBarIcon: ({ color }) => <Ionicons name="compass-outline" size={28} color={color} />
          }} 
        />
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Escáner',
            tabBarIcon: ({ color }) => <Ionicons name="scan-circle-outline" size={32} color={color} />
          }} 
        />
        <Tabs.Screen 
          name="restaurantes" 
          options={{ 
            title: 'Restaurantes',
            tabBarIcon: ({ color }) => <Ionicons name="restaurant-outline" size={26} color={color} />
          }} 
        />
        <Tabs.Screen 
          name="tarjetas" 
          options={{ 
            title: 'Tarjetas',
            headerShown: false, // <--- Añade esto
            tabBarIcon: ({ color }) => <Ionicons name="card-outline" size={28} color={color} />
          }} 
        />
        <Tabs.Screen 
          name="perfil" 
          options={{ 
            title: 'Perfil',
            headerShown: false,
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={28} color={color} />
          }} 
        />
      </Tabs>
    </>
  );
}