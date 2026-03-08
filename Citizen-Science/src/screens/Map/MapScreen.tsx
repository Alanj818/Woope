import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPinNew, getAllPinsNew, deletePinNew, updatePinNew } from '../../api/pins';
import { fetchPurpleAirData } from '../../api/purpleair';
import { getAllTtnDevices } from "../../api/ttn"; // ✅ NEW: Pull TTN device markers from your backend (/ttn/devices)

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
//import * as Camera from 'expo-camera';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as MediaLibrary from 'expo-media-library';
import test from 'node:test';
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
  pin_id: number; // Added pin_id for delete and update
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

  const [loading, setLoading] = useState(true);     // Entire screen loading
  const [pinLoading, setPinLoading] = useState(false); // Refreshing pins only

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  const [pins, setPins] = useState<Pin[]>([]);
  const [filteredPins, setFilteredPins] = useState<Pin[]>([]);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false); // For the sliding info modal

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null); // Pin selected for details
  const [formLocation, setFormLocation] = useState<Location | null>(null);

  const [isMarkerPressed, setIsMarkerPressed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterTag, setFilterTag] = useState('All'); // For filtering pins

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

    // ✅ NEW: Optional tag so you can filter TTN pins separately
    // Why: TTN pins are "external telemetry pins" (like PurpleAir) not user-created pins.
    { label: 'TTN', value: 'TTN' },
  ]);

  // Fetching Pins
  const fetchPins = async () => {
    try {
      let allPins: any[] = [];
      try {
        allPins = await getAllPinsNew(setUserToken);
      } catch (err: any) {
        console.warn('Failed to fetch pins from backend:', err);
        // If backend returns 402 (Payment Required) or other error,
        // fall back to empty list so the map can still render PurpleAir pins.
        allPins = [];
      }

      let data: any[] = [];
      try {
        data = await fetchPurpleAirData();
      } catch (err: any) {
        console.warn('Failed to fetch PurpleAir data:', err);
        // If PurpleAir responds with 402 (Payment Required) or any other error,
        // fall back to an empty array rather than aborting the whole fetch.
        data = [];
      }

      // ✅ NEW: Fetch TTN device-state markers from your backend
      // Why: TTN devices are already in your DB; your backend endpoint /ttn/devices returns
      // one "latest state" row per device for fast map rendering.
      let ttnDevices: any[] = [];
      try {
        ttnDevices = await getAllTtnDevices(setUserToken);
      } catch (err: any) {
        console.warn('Failed to fetch TTN devices:', err);
        // Keep the map working even if TTN is down
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

      let finalPins = [];

      const purpleAirPins = (data || []).map((sensorData, index) => {
        console.log('Sensor data:', sensorData);

        // PurpleAir API structure: { sensor: { ... } }
        const sensor = sensorData.sensor;

        return {
          pin_id: -(index + 1), // Negative IDs to distinguish from database pins
          name: sensor?.name || `PurpleAir Sensor ${index + 1}`,
          date: new Date().toISOString().split('T')[0],
          description: `Air quality sensor, Air Temp: ${sensor.temperature}°F, PM2.5: ${sensor['pm2.5_atm']} µg/m³`,
          tag: "Weather",
          image: null,
          location: {
            latitude: sensor?.latitude,
            longitude: sensor?.longitude,
          },
        };
      });

      // ✅ NEW: Convert TTN devices into your existing Pin shape so the map can render them
      // Why: Your map renders one unified "Pin[]" list, so we just transform TTN device rows into Pins.
      const ttnPins = (ttnDevices || [])
        // extra safety: filter out missing coordinates (should already be filtered on the backend)
        .filter((d: any) => typeof d?.latitude === "number" && typeof d?.longitude === "number")
        .map((d: any, index: number) => ({
          pin_id: -(10000 + index + 1), // Negative IDs far from PurpleAir negatives (-1,-2,...)
          name: d.device_id,
          date: d.last_received_at
            ? new Date(d.last_received_at).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          description:
            `LoRaWAN device ${d.is_online ? "✅ Online" : "⚪ Offline"}\n` +
            `Temp: ${d.temperature_c ?? "—"}°C, Hum: ${d.humidity_pct ?? "—"}%, Gas: ${d.gas_ohms ?? "—"} Ω`,
          tag: "TTN",      // ✅ NEW: lets you filter TTN pins via your UI
          image: null,     // TTN pins have no image (you can add custom marker icons later)
          location: {
            latitude: d.latitude,
            longitude: d.longitude,
          },
        }));

      // ✅ UPDATED: include TTN pins in the same list
      finalPins = [...transformedPins, ...purpleAirPins, ...ttnPins];

      if ((transformedPins.length === 0) && (purpleAirPins.length === 0) && (ttnPins.length === 0)) {
        console.warn('No pins returned from backend, PurpleAir, or TTN (all empty).');
      }

      setPins([...finalPins]); // Spread operator ensures a new array
      setFilteredPins([...finalPins]);
    } catch (error) {
      console.error('Error fetching all pins:', error);
    } finally {
      setPinLoading(false);
    }
  };

  //Intitial Load (location + Pins)
  useEffect(() => {
    const loadEverything = async () => {
      try {
        // 1. Location permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Location permission denied");
          setLoading(false);
          return;
        }

        // 2. Get current location
        const loc = await Location.getCurrentPositionAsync({});
        setCurrentLocation(loc.coords);

        setInitialRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });

        // 3. Load pins
        await fetchPins();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadEverything();
  }, []);

  //filtering
  useEffect(() => {
    // Filter pins based on the selected tag
    if (filterTag === 'All') {
      setFilteredPins(pins);
    } else {
      setFilteredPins(pins.filter((pin: Pin) => pin.tag === filterTag));
    }
  }, [pins, filterTag]);

  //Loading
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
    isMarkerPressedRef.current = true; // Update ref value immediately
    setIsMarkerPressed(true); // Update state for UI
    setSelectedPin(pin); // Set the selected pin for details
    setDetailsVisible(true);
  };

  const handleMapPress = (event: { nativeEvent: { coordinate: Location } }) => {
    if (isMarkerPressedRef.current || detailsVisible) {
      console.log('Ignoring map press due to marker press');
      isMarkerPressedRef.current = false; // Reset the flag
      return;
    }

    const { coordinate } = event.nativeEvent;
    setFormLocation(coordinate); // Save the location of the tap
    setIsEditMode(false);
    setModalVisible(true); // Show the form modal
  };

  const closeDetailsModal = () => {
    setSelectedPin(null); // Clear the selected pin
    setDetailsVisible(false); // Close the details modal
    isMarkerPressedRef.current = false; // Reset the flag
    setIsMarkerPressed(false); // Reset marker pressed state
  };

  const handleDeletePin = async (pinId: number): Promise<boolean> => {
    try {
      await deletePinNew(pinId, setUserToken); // The API call
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

    console.log("📤 Sending Pin Data to Backend...");
    console.log("📝 Form Data:", {
      name: formData.name,
      description: formData.description,
      datebegin: formData.date, // ✅ Ensure this exists
      tag: formData.tag,
      longitude: pinLocation?.longitude, // ✅ Check these are defined
      latitude: pinLocation?.latitude,
      image: formData.image || null
    });

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
      await fetchPins(); // Refresh from backend to ensure image URLs are included

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
      exif: true, // Ensure EXIF data is included
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      console.log('Image URI:', imageUri);

      // Check for EXIF data
      const exifData = result.assets[0].exif;
      if (exifData && exifData.GPSLatitude && exifData.GPSLongitude) {
        let latitude = exifData.GPSLatitude;
        let longitude = exifData.GPSLongitude;

        // Adjust based on hemisphere reference
        if (exifData.GPSLatitudeRef === 'S') {
          latitude = -latitude; // Southern hemisphere
        }
        if (exifData.GPSLongitudeRef === 'W') {
          longitude = -longitude; // Western hemisphere
        }

        console.log(`Geolocation found: Latitude: ${latitude}, Longitude: ${longitude}`);

        // Save location and image in state
        setFormData((prev) => ({
          ...prev,
          image: imageUri,
          location: { latitude, longitude }, // Save location to form data
        }));
      } else {
        // Handle the case where no geolocation is found
        Alert.alert(
          'No Geolocation Found',
          'This image does not contain geolocation data. Would you still like to use it?',
          [
            {
              text: 'Cancel',
              onPress: () => console.log('User canceled'),
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: () => {
                // Save only the image without geolocation
                setFormData((prev) => ({
                  ...prev,
                  image: imageUri,
                  location: null, // No location data available
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

  //handle camera button's action
  const handleOpenCamera = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required to take a picture.');
      return;
    }

    // Request location permission
    const locationPermission = await Location.requestForegroundPermissionsAsync();
    if (locationPermission.status !== 'granted') {
      alert('Location permission is required to capture geolocation.');
      return;
    }

    // Launch the camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      exif: true, // EXIF data might not include geolocation
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      console.log('Captured Image URI:', imageUri);

      // Fetch current location
      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      console.log(`Manual Geolocation: Latitude: ${latitude}, Longitude: ${longitude}`);

      // Prompt user to use the captured location
      Alert.alert(
        'Use Current Location',
        'The camera does not include geolocation in the image. Would you like to use your current location instead?',
        [
          {
            text: 'No',
            onPress: () => {
              // Save the image without geolocation
              setFormData((prev) => ({
                ...prev,
                image: imageUri,
                location: null, // No location
              }));
              console.log('User chose not to use current location');
            },
          },
          {
            text: 'Yes',
            onPress: () => {
              // Save image with the current location
              setFormData((prev) => ({
                ...prev,
                image: imageUri,
                location: { latitude, longitude }, // Use current location
              }));
              console.log('User chose to use current location');
            },
          },
        ]
      );
    }
  };

  const handleEditPin = () => {
    // ✅ NEW: Prevent editing external pins (PurpleAir / TTN)
    // Why: external pins do not exist in your DB, so updatePinNew would fail / be confusing.
    if(!selectedPin) return;
	if (selectedPin?.pin_id < 0) {
      alert("This is an external sensor pin and can't be edited.");
      return;
    }

    if (selectedPin) {
      setSelectedPin(selectedPin); // keep pin
      setDetailsVisible(false);
      setFormData({
        name: selectedPin.name,
        date: selectedPin.date,
        description: selectedPin.description,
        tag: selectedPin.tag,
        image: selectedPin.image,
        location: selectedPin.location,
      });
      setIsEditMode(true); // Switch to update mode
      setModalVisible(true); // Open the modal with pre-filled data
    }
  };

  const handlePinUpdateFormSubmit = async () => {
    // Validate form before submission
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
      // Call the API to update the pin in the database (assume updatePinNew exists)
      if (!selectedPin) {
        alert('No pin selected for update.');
        return;
      }

      // ✅ NEW: Prevent updating external pins (PurpleAir / TTN)
      if (selectedPin.pin_id < 0) {
        alert("This is an external sensor pin and can't be updated.");
        return;
      }

      const updatedPin = await updatePinNew(
        selectedPin.pin_id, // Use the pin ID of the selected pin
        formData.name,
        formData.description,
        new Date(formData.date),
        formData.tag,
        pinLocation.longitude, // changed to match backend
        pinLocation.latitude,  // changed to match backend
        setUserToken
      );

      // Ensure date parsing is valid
      if (updatedPin.datebegin) {
        updatedPin.date = new Date(updatedPin.datebegin).toISOString().split('T')[0]; // Format date correctly
      }

      console.log('Response from updatePinNew:', updatedPin);

      // Update the pin in the frontend state
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

      // Reset the form and hide the modal
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

  // HTML
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

      {/* Loading Screen */}
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

      {/* Map */}
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

          {/* Render a pin for the photo's geolocation if available */}
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

      {/* Modal for Viewing Pin Details */}
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

                // ✅ NEW: Prevent deleting external pins (PurpleAir / TTN)
                // Why: they aren't stored in your DB, so deletePinNew doesn't apply.
                if (selectedPin.pin_id < 0) {
                  alert("This is an external sensor pin and can't be deleted.");
                  return;
                }

                console.log('Selected Pin for deletion:', selectedPin.pin_id);

                const success = await handleDeletePin(selectedPin.pin_id);

                if (success) {
                  closeDetailsModal();
                  setTimeout(() => {
                    fetchPins();
                  }, 200);
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
                setTimeout(() => {
                  handleEditPin();
                }, 200);
              }}
            >
              <Text style={styles.closeButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeDetailsModal}
            >
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
                <Image
                  source={{ uri: selectedPin.image }}
                  style={styles.detailsImage}
                />
              )}
            </>
          )}
        </View>
      </Modal>

    </View>
  );
};

// CSS (unchanged)
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