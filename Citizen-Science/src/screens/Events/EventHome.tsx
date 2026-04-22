import React, {useState,useEffect, useContext} from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import EventCard from '../../components/EventCard';
import CreateEvent from '../../components/CreateEvent'
import TopNav from '../../components/TopNav';
import { MaterialIcons, Octicons } from '@expo/vector-icons';
import { getEvents } from '../../api/event';
import { Event } from '../../api/types';

interface EventHomeProps {
  route: RouteProp<{ params: { org_id: number } }, 'params'>;
}

export const EventHome = ({ route }: EventHomeProps) => {
    const navigation = useNavigation<any>();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [eventData, setEventData] = useState<Event[]>([]);
    const fetchEvents = async () => {
            try {
                const eventList = await getEvents(route.params.org_id);
                setEventData(eventList);
            } catch (error) {
                console.log(error);
            }
        }
    useEffect(() => {
        fetchEvents();
    },[])
    return(
        <>
        <TopNav title="Events" showBack onBack={() => navigation.goBack()} />
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent', marginTop: 0, paddingTop: 0 }]}>
            <View style={styles.header}>
                <Text style={styles.title}>All Events</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                    <Octicons style={styles.addIcon} name='diff-added' size={28} color="#0084D1"/>
                </TouchableOpacity>
            </View>
            <FlatList
            data={eventData}
            scrollEnabled={true}
            keyExtractor={(item) => item.event_id.toString()}
            renderItem={({ item }) => (
                <EventCard
                    event_id={item.event_id}
                    org_id={item.org_id}
                    name={item.name}
                    tagline={item.tagline}
                    text_description={item.text_description}
                    time_begin={item.time_begin}
                    time_end={item.time_end}
                    image_path={item.image_path || ''} 
                />
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No events yet</Text>}
            /> 
            <CreateEvent org_id={route.params.org_id} isVisible = {isModalVisible} onClose={() => 
                {
                setIsModalVisible(false)
                fetchEvents();
                }
            }/>
        </SafeAreaView>
        </>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 16,
        marginTop: 32,
    },
    addIcon: {
        marginLeft: 8,
    },
});
export default EventHome