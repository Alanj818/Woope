import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { Octicons } from '@expo/vector-icons';
import TopNav from '../../components/TopNav';
import CreateEvent from '../../components/CreateEvent';
import { getEvents } from '../../api/event';
import { Event } from '../../api/types';

interface EventHomeProps {
    route: RouteProp<{ params: { org_id: number } }, 'params'>;
}

const STRINGS = {
    title: 'Events',
    addEvent: 'Add Event',
    subheader: 'A view of what\'s next',
    noEvents: 'No events yet',
    noEventsSubtitle: 'Events added by this organization will appear here.',
};

export const EventHome = ({ route }: EventHomeProps) => {
    const navigation = useNavigation<any>();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [eventData, setEventData] = useState<Event[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchEvents = async () => {
        try {
            const eventList = await getEvents(route.params.org_id);
            setEventData(eventList);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchEvents();
        setRefreshing(false);
    };

    const getEventTimeRange = (start: string | Date, end?: string | Date) => {
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : null;
        const startText = format(startDate, 'h:mm a');
        const endText = endDate ? format(endDate, 'h:mm a') : null;
        return endText && startText !== endText ? `${startText} - ${endText}` : startText;
    };

    const renderItem = ({ item }: { item: Event }) => {
        const eventDate = new Date(item.time_begin);

        return (
            <TouchableOpacity
                activeOpacity={0.88}
                style={styles.cardWrap}
                onPress={() => navigation.navigate('EventDetailsScreen', { event: item })}
            >
                <View style={styles.card}>
                    <LinearGradient
                        colors={['rgba(0,132,209,1)', 'rgba(0,146,184,1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.dateBadge}
                    >
                        <Text style={styles.dateBadgeDay}>{format(eventDate, 'd')}</Text>
                        <Text style={styles.dateBadgeMonth}>{format(eventDate, 'MMM')}</Text>
                    </LinearGradient>

                    <View style={styles.eventInfo}>
                        <Text style={styles.eventName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.eventMeta}>
                            {format(eventDate, 'MMM d, yyyy')} • {getEventTimeRange(item.time_begin, item.time_end)}
                        </Text>
                        {item.tagline ? (
                            <Text style={styles.eventTagline} numberOfLines={1}>{item.tagline}</Text>
                        ) : null}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <TopNav title={STRINGS.title} showBack onBack={() => navigation.goBack()} />
            <SafeAreaView style={styles.container}>
                <FlatList
                    data={eventData}
                    keyExtractor={(item) => item.event_id.toString()}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#0088ca"
                            colors={['#0088ca']}
                        />
                    }
                    ListHeaderComponent={
                        /* Matches the calendar screen's "Add Event" header exactly */
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>{STRINGS.addEvent}</Text>
                            <TouchableOpacity
                                onPress={() => setIsModalVisible(true)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Octicons name="diff-added" size={26} color="#0084D1" />
                            </TouchableOpacity>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>{STRINGS.noEvents}</Text>
                            <Text style={styles.emptySubtitle}>{STRINGS.noEventsSubtitle}</Text>
                        </View>
                    }
                />

                <CreateEvent
                    org_id={route.params.org_id}
                    isVisible={isModalVisible}
                    onClose={() => {
                        setIsModalVisible(false);
                        fetchEvents();
                    }}
                />
            </SafeAreaView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7fa',
    },
    listContent: {
        paddingBottom: 36,
        gap: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e7edf3',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2f3a45',
    },
    cardWrap: {
        marginHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        shadowColor: '#8aa9bf',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 3,
    },
    card: {
        backgroundColor: '#f8fbfd',
        borderWidth: 1,
        borderColor: '#e7f0f5',
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateBadge: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    dateBadgeDay: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 20,
    },
    dateBadgeMonth: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 1,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    eventInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    eventName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#16202a',
        marginBottom: 3,
    },
    eventMeta: {
        fontSize: 13,
        color: '#6a7a8b',
        marginBottom: 2,
    },
    eventTagline: {
        fontSize: 13,
        color: '#0088ca',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#444',
        marginBottom: 6,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default EventHome;