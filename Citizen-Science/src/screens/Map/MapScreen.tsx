import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPinNew, getAllPinsNew, deletePinNew, updatePinNew } from '../../api/pins';
import { getAllPurpleAirDevices } from '../../api/purpleair';
import { getAllTtnDevices } from "../../api/ttn";

import {
  View,
  Dimensions,
  Modal,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as MediaLibrary from 'expo-media-library';
import { AuthContext } from '../../util/AuthContext';
import { logActivity } from '../../api/activity';
import { jwtDecode } from 'jwt-decode';
import { AccessToken } from '../../util/token';

const windowWidth = Dimensions.get('window').width;

interface Location {
  latitude: number;
  longitude: number;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Pin {
  pin_id: number;
  name: string;
  date: string;
  description: string;
  tag: string;
  image: string | null;
  location: {
    latitude: number;
    longitude: number;
  };
}

export const MapScreen = () => {
  const { userToken, setUserToken } = useContext(AuthContext);
  const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;
  const userId = decodedToken ? decodedToken.user_id : NaN;

  const [loading, setLoading] = useState(true);
  const [pinLoading, setPinLoading] = useState(false);

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  const [pins, setPins] = useState<Pin[]>([]);
  const [filteredPins, setFilteredPins] = useState<Pin[]>([]);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [formLocation, setFormLocation] = useState<Location | null>(null);

  const [isMarkerPressed, setIsMarkerPressed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterTag, setFilterTag] = useState('All');

  const isMarkerPressedRef = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
    tag: 'General',
    image: null as string | null,
    location: null as Location | null,
  });

  const [tagItems, setTagItems] = useState([
    { label: 'General', value: 'General' },
    { label: 'Weather', value: 'Weather' },
    { label: 'Event', value: 'Event' },
    { label: 'Workshop', value: 'Workshop' },
    { label: 'Hazard', value: 'Hazard' },
    { label: 'Mutual Aid', value: 'Mutual Aid' },
    { label: 'Nasa', value: 'Nasa' },
    { label: 'TTN', value: 'TTN' },
  ]);

  const fetchPins = async () => {
    try {
      let allPins: any[] = [];
      try {
        allPins = await getAllPinsNew(setUserToken);
      } catch (err: any) {
        console.warn('Failed to fetch pins from backend:', err);
        allPins = [];
      }

      // ✅ Updated: fetch PurpleAir data from our backend instead of PurpleAir directly
      let data: any[] = [];
      try {
        data = await getAllPurpleAirDevices(setUserToken);
      } catch (err: any) {
        console.warn('Failed to fetch PurpleAir data:', err);
        data = [];
      }

      let ttnDevices: any[] = [];
      try {
        ttnDevices = await getAllTtnDevices(setUserToken);
      } catch (err: any) {
        console.warn('Failed to fetch TTN devices:', err);
        ttnDevices = [];
      }

      const transformedPins = allPins.map((pin: any) => ({
        pin_id: pin.pin_id,
        name: pin.name,
        date: new Date(pin.datebegin).toISOString().split('T')[0],
        description: pin.text_description,
        tag: pin.label,
        image: pin.imageurl
          ? `${process.env.EXPO_PUBLIC_API_URL}${pin.imageurl}`
          : null,
        location: {
          latitude: pin.latitude,
          longitude: pin.longitude,
        },
      }));

      // ✅ Updated: data is now flat from our backend, no nested sensor object
      const purpleAirPins = (data || []).map((sensor: any, index: number) => ({
        pin_id: -(index + 1),
        name: sensor?.name || `PurpleAir Sensor ${index + 1}`,
        date: sensor?.received_at
          ? new Date(sensor.received_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        description: `Air quality sensor, Temp: ${sensor?.temperature_c ?? '—'}°C, PM2.5: ${sensor?.pm2_5_atm ?? '—'} µg/m³`,
        tag: "Weather",
        image: null,
        location: {
          latitude: sensor?.latitude_deg,
          longitude: sensor?.longitude_deg,
        },
      }));

      // ✅ Updated: use source_id instead of device_id
      const ttnPins = (ttnDevices || [])
        .filter((d: any) => typeof d?.latitude === "number" && typeof d?.longitude === "number")
        .map((d: any, index: number) => ({
          pin_id: -(10000 + index + 1),
          name: d.source_id, // ✅ updated from d.device_id
          date: d.last_received_at
            ? new Date(d.last_received_at).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          description:
            `LoRaWAN device ${d.is_online ? "✅ Online" : "⚪ Offline"}\n` +
            `Temp: ${d.temperature_c ?? "—"}°C, Hum: ${d.humidity_pct ?? "—"}%, Gas: ${d.gas_ohms ?? "—"} Ω`,
          tag: "TTN",
          image: null,
          location: {
            latitude: d.latitude,
            longitude: d.longitude,
          },
        }));

      const finalPins = [...transformedPins, ...purpleAirPins, ...ttnPins];

      if ((transformedPins.length === 0) && (purpleAirPins.length === 0) && (ttnPins.length === 0)) {
        console.warn('No pins returned from backend, PurpleAir, or TTN (all empty).');
      }

      setPins([...finalPins]);
      setFilteredPins([...finalPins]);
    } catch (error) {
      console.error('Error fetching all pins:', error);
    } finally {
      setPinLoading(false);
    }
  };

  useEffect(() => {
    const loadEverything = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Location permission denied");
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setCurrentLocation(loc.coords);

        setInitialRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });

        await fetchPins();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadEverything();
  }, []);

  useEffect(() => {
    if (filterTag === 'All') {
      setFilteredPins(pins);
    } else {
      setFilteredPins(pins.filter((pin: Pin) => pin.tag === filterTag));
    }
  }, [pins, filterTag]);

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}>
        <ActivityIndicator size="large" color="#ff8c00" />
        <Text style={{ marginTop: 10 }}>Loading Map...</Text>
      </View>
    );
  }

  const handleMarkerPress = (pin: Pin) => {
    console.log('Marker pressed:', pin);
    logActivity(userId, `Marker pressed: ${pin}`)
    isMarkerPressedRef.current = true;
    setIsMarkerPressed(true);
    setSelectedPin(pin);
    setDetailsVisible(true);
  };

  const handleMapPress = (event: { nativeEvent: { coordinate: Location } }) => {
    if (isMarkerPressedRef.current || detailsVisible) {
      console.log('Ignoring map press due to marker press');
      isMarkerPressedRef.current = false;
      return;
    }

    const { coordinate } = event.nativeEvent;
    setFormLocation(coordinate);
    setIsEditMode(false);
    setModalVisible(true);
  };

  const closeDetailsModal = () => {
    setSelectedPin(null);
    setDetailsVisible(false);
    isMarkerPressedRef.current = false;
    setIsMarkerPressed(false);
  };

  const handleDeletePin = async (pinId: number): Promise<boolean> => {
    try {
      await deletePinNew(pinId, setUserToken);
      console.log('Pin deleted successfully!');
      return true;
    } catch (error) {
      console.error('Failed to delete pin:', error);
      alert("You don't have permission to delete this pin.");
      return false;
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.name || !formData.date || !formData.description || !formData.tag) {
      alert("Please fill out all fields before submitting.");
      return;
    }

    const pinLocation = formData.location || formLocation;

    if (!pinLocation) {
      alert("No location available for this pin");
      return;
    }

    if (!pinLocation.longitude || !pinLocation.latitude) {
      console.error("❌ Error: Longitude or Latitude is undefined!");
      alert("Error: Missing location data.");
      return;
    }

    try {
      const newPin = await createPinNew(
        formData.name,
        formData.description,
        new Date(formData.date),
        formData.tag,
        pinLocation.longitude,
        pinLocation.latitude,
        formData.image || null,
        setUserToken
      );

      console.log("✅ Pin Created Successfully:", newPin);
      logActivity(userId, `Created pin: ${newPin}`)
      await fetchPins();

      setFormData({
        name: "",
        date: "",
        description: "",
        tag: "General",
        image: null,
        location: null,
      });
      setFormLocation(null);
      setModalVisible(false);

      alert("Pin created successfully!");
    } catch (error) {
      console.error("❌ Error creating pin:", error);
      alert("Failed to create the pin. Please try again.");
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      exif: true,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      console.log('Image URI:', imageUri);

      const exifData = result.assets[0].exif;
      if (exifData && exifData.GPSLatitude && exifData.GPSLongitude) {
        let latitude = exifData.GPSLatitude;
        let longitude = exifData.GPSLongitude;

        if (exifData.GPSLatitudeRef === 'S') latitude = -latitude;
        if (exifData.GPSLongitudeRef === 'W') longitude = -longitude;

        setFormData((prev) => ({
          ...prev,
          image: imageUri,
          location: { latitude, longitude },
        }));
      } else {
        Alert.alert(
          'No Geolocation Found',
          'This image does not contain geolocation data. Would you still like to use it?',
          [
            { text: 'Cancel', onPress: () => console.log('User canceled'), style: 'cancel' },
            {
              text: 'Yes',
              onPress: () => {
                setFormData((prev) => ({
                  ...prev,
                  image: imageUri,
                  location: null,
                }));
              },
            },
          ]
        );
      }
    }
  };

  const resetModals = () => {
    setModalVisible(false);
    setDetailsVisible(false);
    setSelectedPin(null);
    setFormLocation(null);
  };

  const handleOpenCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required to take a picture.');
      return;
    }

    const locationPermission = await Location.requestForegroundPermissionsAsync();
    if (locationPermission.status !== 'granted') {
      alert('Location permission is required to capture geolocation.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      exif: true,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      Alert.alert(
        'Use Current Location',
        'The camera does not include geolocation in the image. Would you like to use your current location instead?',
        [
          {
            text: 'No',
            onPress: () => {
              setFormData((prev) => ({ ...prev, image: imageUri, location: null }));
            },
          },
          {
            text: 'Yes',
            onPress: () => {
              setFormData((prev) => ({ ...prev, image: imageUri, location: { latitude, longitude } }));
            },
          },
        ]
      );
    }
  };

  const handleEditPin = () => {
    if (!selectedPin) return;
    if (selectedPin?.pin_id < 0) {
      alert("This is an external sensor pin and can't be edited.");
      return;
    }

    if (selectedPin) {
      setSelectedPin(selectedPin);
      setDetailsVisible(false);
      setFormData({
        name: selectedPin.name,
        date: selectedPin.date,
        description: selectedPin.description,
        tag: selectedPin.tag,
        image: selectedPin.image,
        location: selectedPin.location,
      });
      setIsEditMode(true);
      setModalVisible(true);
    }
  };

  const handlePinUpdateFormSubmit = async () => {
    if (!formData.name || !formData.date || !formData.description || !formData.tag) {
      alert('Please fill out all fields before submitting.');
      return;
    }

    const pinLocation = formData.location || formLocation;

    if (!pinLocation) {
      alert('No location available for this pin');
      return;
    }

    try {
      if (!selectedPin) {
        alert('No pin selected for update.');
        return;
      }

      if (selectedPin.pin_id < 0) {
        alert("This is an external sensor pin and can't be updated.");
        return;
      }

      const updatedPin = await updatePinNew(
        selectedPin.pin_id,
        formData.name,
        formData.description,
        new Date(formData.date),
        formData.tag,
        pinLocation.longitude,
        pinLocation.latitude,
        setUserToken
      );

      if (updatedPin.datebegin) {
        updatedPin.date = new Date(updatedPin.datebegin).toISOString().split('T')[0];
      }

      setPins((prev) =>
        prev.map((pin: Pin) =>
          pin.pin_id === updatedPin.pin_id
            ? {
              ...pin,
              name: updatedPin.name,
              date: updatedPin.date,
              description: updatedPin.description,
              tag: updatedPin.tag,
              location: {
                latitude: updatedPin.latitude,
                longitude: updatedPin.longitude,
              },
            }
            : pin
        )
      );

      setFormData({ name: '', date: '', description: '', tag: 'General', image: null, location: null });
      setFormLocation(null);
      setModalVisible(false);
      closeDetailsModal();
      fetchPins();

      alert('Pin updated successfully!');
      logActivity(userId, `Updated pin`)
    } catch (error) {
      console.error('Error updating pin:', error);
      alert('Failed to update the pin. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setFilterModalVisible(true)}
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          backgroundColor: '#007AFF',
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 8,
          zIndex: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Filter</Text>
      </TouchableOpacity>

      {pinLoading && (
        <View style={{
          position: "absolute",
          top: 20,
          right: 20,
          padding: 10,
          backgroundColor: "rgba(255,255,255,0.8)",
          borderRadius: 10,
          zIndex: 100,
        }}>
          <ActivityIndicator size="small" color="#ff8c00" />
        </View>
      )}

      {initialRegion && (
        <MapView
          key={filteredPins.map((pin: Pin) => pin.name).join('-')}
          style={styles.map}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton
          showsCompass
        >
          {filteredPins.map((pin: Pin) => {
            return (
              <Marker
                key={`pin-${pin.pin_id}`}
                coordinate={pin.location}
                onPress={() => handleMarkerPress(pin)}
              >
                {pin.image && (
                  <Image
                    source={{ uri: pin.image }}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                  />
                )}
              </Marker>
            );
          })}

          {formData.location && (
            <Marker
              coordinate={{
                latitude: formData.location.latitude,
                longitude: formData.location.longitude,
              }}
            >
              {formData.image && (
                <Image
                  source={{ uri: formData.image }}
                  style={{ width: 50, height: 50, borderRadius: 25 }}
                />
              )}
            </Marker>
          )}
        </MapView>
      )}

      <Modal visible={detailsVisible} animationType="slide" transparent={true}>
        <View style={styles.detailsContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>

            <TouchableOpacity
              style={[styles.closeButton, { marginRight: 20 }]}
              onPress={async () => {
                if (!selectedPin) {
                  alert('No pin selected to delete.');
                  return;
                }

                if (selectedPin.pin_id < 0) {
                  alert("This is an external sensor pin and can't be deleted.");
                  return;
                }

                const success = await handleDeletePin(selectedPin.pin_id);

                if (success) {
                  closeDetailsModal();
                  setTimeout(() => { fetchPins(); }, 200);
                  alert('Pin deleted successfully!');
                }
              }}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeButton, { marginRight: 20 }]}
              onPress={() => {
                closeDetailsModal();
                setTimeout(() => { handleEditPin(); }, 200);
              }}
            >
              <Text style={styles.closeButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={closeDetailsModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          {selectedPin && (
            <>
              <Text style={styles.detailsTitle}>{selectedPin.name}</Text>
              <Text style={styles.detailsDate}>Date: {selectedPin.date}</Text>
              <Text style={styles.detailsDescription}>{selectedPin.description}</Text>
              <Text style={styles.detailsTag}>Tag: {selectedPin.tag}</Text>
              {selectedPin.image && (
                <Image source={{ uri: selectedPin.image }} style={styles.detailsImage} />
              )}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  cameraButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  filterWrapper: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 5,
  },
  filterButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  filterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    width: '80%',
    marginBottom: 10,
    alignSelf: 'center'
  },
  imagePicker: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  imagePickerText: {
    color: '#000',
    textAlign: 'center',
  },
  previewImage: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#d9534f',
    padding: 10,
    borderRadius: 5,
  },
  submitButton: {
    backgroundColor: '#5cb85c',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  detailsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  closeButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  detailsImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginTop: 10,
    resizeMode: 'cover',
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailsDate: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  detailsDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    lineHeight: 22,
  },
  detailsTag: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  datePicker: {
    width: '80%',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  datePickerText: {
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
  },
});