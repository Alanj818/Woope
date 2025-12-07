import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';

//what info we want from the weather api
interface WeatherData {
    Day: string;
    Temp: number;
    TempUnit: string;
    Description: string;
}

//Weather icon displayed on each day's weather information
const getWeatherIcon = (description: string, day: string) => {
    const d = description.toLowerCase();
    const isNight = day.toLowerCase().includes('night');

    const isClear = d.includes('clear') || d.includes('sunny');

    switch (true) {
        case isClear && isNight:
            return '🌙';
        case isClear:
            return '☀️';
        case d.includes('cloud'):
            return '☁️';
        case d.includes('rain'):
            return '🌧️';
        case d.includes('snow'):
            return '❄️';
        case d.includes('thunder'):
            return '⛈️';
        default:
            return '🌈';
    }
};

//The weather data by default has holidays built in this function removes them
//weekday array is kept out of the function to not keep reintializing everytime function is called
const weekdayNames = [
    "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"
];
const getCorrectDay = (index: number) => {
    const today = new Date().getDay(); // 0=Sun ... 6=Sat

    const dayIndex = Math.floor(index / 2);
    const weekday = weekdayNames[(today + dayIndex) % 7];

    //if index is even then day, else its night
    return index % 2 === 1 ? `${weekday} Night` : weekday;
};

const Weather: React.FC = () => {
    const [weatherData, setWeatherData] = useState<WeatherData[]>([]); //stores api responce 
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [locationName, setLocationName] = useState<string>('Your Location');

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {

                //get GPS permission, if failed then give err
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setError('Location permission denied');
                    return;
                }

                //wait to get location
                const location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;
                
                //call and wait for weather API call, get the first 7 data information
                const response = await axios.get<WeatherData[]>(
                    `${process.env.EXPO_PUBLIC_API_URL}/weather/forecast?lat=${latitude}&lon=${longitude}`
                );

                //get the first 7 data information, ex: "Tuesday", "Tuesday Night", "Wednesday", "Wednesday night" and so on
                //so really it gets the next 3 day and night + 1 more day
                setWeatherData(response.data.slice(0, 7));

                //with the location with convert the lat & long to the city's name
                const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (geo.length > 0) {
                    const city = geo[0].city || geo[0].region || 'Your Location';
                    setLocationName(city);
                }

            } catch (err) {
                console.error(err);
                setError('Failed to fetch weather data');
            } finally {
                setLoading(false);
            }
        };

        fetchWeatherData();
    }, []);

    if (loading) return <ActivityIndicator size="large" color="#ff8c00" />; //loading bar
    if (error) return <Text style={styles.errorText}>Error: {error}</Text>;

    //UI
    return (
        <View style={styles.container}>
            <Text style={styles.cityText}>{locationName}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
                {weatherData.map((data, index) => (
                    <View key={index} style={styles.weatherItem}>
                        <Text style={styles.weatherIcon}>{getWeatherIcon(data.Description, data.Day)}</Text>
                        <View style={styles.weatherDetails}>
                            <Text style={styles.day}>{getCorrectDay(index)}</Text>
                            <Text style={styles.temperature}>{data.Temp}°{data.TempUnit}</Text>
                            <Text style={styles.description}>{data.Description}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        backgroundColor: '#B4D7EE',
        borderRadius: 30,
        paddingVertical: 20,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        marginHorizontal: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E7F3FD',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    scrollView: {
        flexDirection: 'row',
    },
    weatherItem: {
        backgroundColor: '#FFF',
        borderRadius: 5,
        padding: 10,
        marginRight: 20,
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    weatherDetails: {
        marginLeft: 10,
    },
    weatherIcon: {
        fontSize: 30,
    },
    day: {
        fontWeight: 'bold',
        color: '#ff8c00',
        fontSize: 16,
    },
    temperature: {
        fontSize: 16,
        color: '#555',
        fontWeight: 'bold',
    },
    description: {
        fontSize: 15,
        color: '#555',
    },
    errorText: {
        color: '#D8000C',
        textAlign: 'center',
    },
    cityText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },    
});
export default Weather;