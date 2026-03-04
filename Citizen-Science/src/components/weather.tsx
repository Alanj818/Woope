import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

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
    //console.log('Is Night:', isNight && isClear);
    //console.log('Description:', description, 'Day:', day);
    switch (true) {
        case isNight:
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
                    const g = geo[0];
                    const city = g.city || g.region || '';
                    // Prefer short region code (e.g., CA). If not available, try map from full name.
                    const regionCode = (g as any).regionCode || '';

                    const stateMap: Record<string, string> = {
                        'Alabama': 'AL','Alaska': 'AK','Arizona': 'AZ','Arkansas': 'AR','California': 'CA','Colorado': 'CO','Connecticut': 'CT','Delaware': 'DE','Florida': 'FL','Georgia': 'GA','Hawaii': 'HI','Idaho': 'ID','Illinois': 'IL','Indiana': 'IN','Iowa': 'IA','Kansas': 'KS','Kentucky': 'KY','Louisiana': 'LA','Maine': 'ME','Maryland': 'MD','Massachusetts': 'MA','Michigan': 'MI','Minnesota': 'MN','Mississippi': 'MS','Missouri': 'MO','Montana': 'MT','Nebraska': 'NE','Nevada': 'NV','New Hampshire': 'NH','New Jersey': 'NJ','New Mexico': 'NM','New York': 'NY','North Carolina': 'NC','North Dakota': 'ND','Ohio': 'OH','Oklahoma': 'OK','Oregon': 'OR','Pennsylvania': 'PA','Rhode Island': 'RI','South Carolina': 'SC','South Dakota': 'SD','Tennessee': 'TN','Texas': 'TX','Utah': 'UT','Vermont': 'VT','Virginia': 'VA','Washington': 'WA','West Virginia': 'WV','Wisconsin': 'WI','Wyoming': 'WY'
                    };

                    let statePart = '';
                    if (regionCode && regionCode.length <= 3) statePart = regionCode;
                    else if (g.region && stateMap[g.region]) statePart = stateMap[g.region];
                    else if (g.region) statePart = g.region; // fallback to whatever region string we have

                    const label = city ? (statePart ? `${city}, ${statePart}` : city) : (statePart || 'Your Location');
                    setLocationName(label);
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

    // UI: location row + two rounded cards (Weather + Air Quality)
    const first = weatherData && weatherData.length > 0 ? weatherData[0] : null;
    // air quality currently not fetched; display '00' and '--' when unknown
    const aqValue: string | number | null = null; // set real value if you wire AQ API
    const aqText: string = '';
    const aqDisplay = aqValue != null ? String(aqValue) : '00';
    const aqTextDisplay = aqText && aqText.length > 0 ? aqText : '--';
    const weatherDescription = first ? (first.Description && first.Description.length > 0 ? first.Description : '--') : '--';

    return (
        <View style={styles.outer}>
            <Text style={styles.locationLabel}>{locationName}</Text>

            <View style={styles.cardsRow}>
                <LinearGradient
                    colors={["rgba(0,166,244,1)", "rgba(0,184,219,1)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.card, styles.weatherCard]}
                >
                    <Text style={styles.cardTitle}>Weather</Text>
                    <Text style={styles.cardTemp}>{first ? `${first.Temp}°${first.TempUnit}` : '--'}</Text>
                    <Text style={styles.cardSubtitle}>{weatherDescription}</Text>
                </LinearGradient>

                <LinearGradient
                    colors={["rgba(0,201,80,1)", "rgba(0,188,125,1)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.card, styles.aqCard]}
                >
                    <Text style={styles.cardTitle}>Air Quality</Text>
                    <Text style={styles.cardTemp}>{aqDisplay}</Text>
                    <Text style={styles.cardSubtitle}>{aqTextDisplay}</Text>
                </LinearGradient>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    outer: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    locationText: {
        fontSize: 12,
        color: '#ffffff',
        marginBottom: 8,
        paddingLeft: 6,
        opacity: 0.9,
    },
    locationLabel: {
        color: '#495565',
        fontSize: 14,
        fontWeight: '400',
        letterSpacing: -0.15,
        lineHeight: 20,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    cardsRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'space-between',
    },
    card: {
        flex: 1,
        borderRadius: 14,
        padding: 14,
        minHeight: 90,
        justifyContent: 'center',
        marginRight: 10,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 3,
    },
    weatherCard: {
        backgroundColor: '#00A6F4', // approximate gradient start
    },
    aqCard: {
        backgroundColor: '#00C950', // approximate gradient start
        marginRight: 0,
    },
    cardTitle: {
        color: '#ffffff',
        fontSize: 12,
        marginBottom: 4,
    },
    cardTemp: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '400',
        lineHeight: 32,
    },
    cardSubtitle: {
        color: '#ffffff',
        fontSize: 12,
        opacity: 0.75,
        marginTop: 6,
    },
    errorText: {
        color: '#D8000C',
        textAlign: 'center',
    },
});
export default Weather;