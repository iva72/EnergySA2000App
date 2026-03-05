import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, Alert, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

export default function App() {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [bass, setBass] = useState(50);

  useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      if (state === 'PoweredOn') scanDevices();
    }, true);
    return () => subscription.remove();
  }, []);

  const scanDevices = () => {
    setDevices([]);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) return;
      if (device.name && device.name.includes('Energy SA-2000')) {
        setDevices(prev => {
          if (!prev.find(d => d.id === device.id)) return [...prev, device];
          return prev;
        });
      }
    });
    setTimeout(() => manager.stopDeviceScan(), 5000);
  };

  const connectDevice = async (device) => {
    try {
      const connected = await manager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      Alert.alert('Подключено', `${device.name} подключена!`);
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось подключиться');
    }
  };

  const setBassLevel = (value) => {
    setBass(value);
    if (connectedDevice) {
      console.log('Уровень баса:', value);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Energy SA-2000</Text>

      <FlatList
        data={devices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Button title={item.name} onPress={() => connectDevice(item)} />
        )}
        ListEmptyComponent={<Text>Сканирование колонок...</Text>}
      />

      {connectedDevice && (
        <View style={{ marginTop: 30 }}>
          <Text>Регулировка басов: {Math.round(bass)}</Text>
          <Slider
            minimumValue={0}
            maximumValue={100}
            value={bass}
            onValueChange={setBassLevel}
          />
          <Button
            title="Включить приватный режим"
            onPress={() => Alert.alert('Приватный режим', 'Другие устройства не могут подключиться')}
          />
        </View>
      )}

      <Button title="Сканировать снова" onPress={scanDevices} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 }
});
