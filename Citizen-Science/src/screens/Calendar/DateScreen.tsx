import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { addDays, format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import TopNav from '../../components/TopNav';
import { Event } from '../../api/types';
import { getDayEvents, getFollowedEvents, getUserEvents } from '../../api/event';

type FilterType = 'public' | 'followed' | 'private';

const DateScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const userId = route.params.id;
  const dateString = route.params.dateString;

  const selectedDate = useMemo(
    () =>
      new Date(
        new Date(dateString).getTime() +
          new Date(dateString).getTimezoneOffset() * 60000
      ),
    [dateString]
  );

  const nextDay = useMemo(() => addDays(selectedDate, 1), [selectedDate]);

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('public');
  const [generalEventList, setGeneralEventList] = useState<Event[]>([]);
  const [followedEventList, setFollowedEventList] = useState<Event[]>([]);
  const [userEventList, setUserEventList] = useState<Event[]>([]);
  const [eventData, setEventData] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);

      try {
        const [generalList, followedList, privateList] = await Promise.all([
          getDayEvents(selectedDate, nextDay),
          getFollowedEvents(selectedDate, nextDay, userId),
          getUserEvents(selectedDate, nextDay, userId),
        ]);

        const safeGeneral = generalList || [];
        const safeFollowed = followedList || [];
        const safePrivate = privateList || [];

        setGeneralEventList(safeGeneral);
        setFollowedEventList(safeFollowed);
        setUserEventList(safePrivate);

        setSelectedFilter('public');
        setEventData(safeGeneral);
      } catch (error) {
        console.log('Error loading day events:', error);
        setGeneralEventList([]);
        setFollowedEventList([]);
        setUserEventList([]);
        setEventData([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [selectedDate, nextDay, userId]);

  const handleFilterChange = (filter: FilterType) => {
    setSelectedFilter(filter);

    if (filter === 'public') setEventData(generalEventList);
    if (filter === 'followed') setEventData(followedEventList);
    if (filter === 'private') setEventData(userEventList);
  };

  const getCurrentCount = () => {
    if (selectedFilter === 'public') return generalEventList.length;
    if (selectedFilter === 'followed') return followedEventList.length;
    return userEventList.length;
  };

  const getEmptyTitle = () => {
    if (loading) return 'Loading events';
    if (selectedFilter === 'followed') return 'No Followed Events';
    if (selectedFilter === 'private') return 'No Private Events';
    if (selectedFilter === 'public') return 'No Public Events';
    return 'No Events';
  };

  const getEmptyMessage = () => {
    if (loading) return 'Fetching events for this date.';
    return 'There are no events scheduled for this date.';
  };

  const getSourceLabel = () => {
    if (selectedFilter === 'followed') return 'Followed Event';
    if (selectedFilter === 'private') return 'Private Event';
    return 'Public Event';
  };

  const getEventTimeRange = (start: string | Date, end?: string | Date) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    const startTimeText = format(startDate, 'h:mm a');
    const endTimeText = endDate ? format(endDate, 'h:mm a') : null;

    return endTimeText && startTimeText !== endTimeText
      ? `${startTimeText} - ${endTimeText}`
      : startTimeText;
  };

  const renderFilterButton = (label: string, value: FilterType) => {
    const isActive = selectedFilter === value;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.filterButtonWrapper,
          pressed && styles.filterButtonPressed,
        ]}
        onPress={() => handleFilterChange(value)}
      >
        {isActive ? (
          <LinearGradient
            colors={['rgba(0,132,209,1)', 'rgba(0,146,184,1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.filterButton}
          >
            <Text style={[styles.filterText, styles.filterTextActive]}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.filterButton, styles.filterButtonInactive]}>
            <Text style={styles.filterText}>{label}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons
          name={loading ? 'hourglass-empty' : 'access-time'}
          size={30}
          color="#98A2B3"
        />
      </View>

      <Text style={styles.emptyTitle}>{getEmptyTitle()}</Text>
      <Text style={styles.emptySubtitle}>{getEmptyMessage()}</Text>
    </View>
  );

  const renderEventCard = ({ item }: { item: Event }) => {
    const eventDate = new Date(item.time_begin);

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.eventCardWrap}
        onPress={() =>
          navigation.navigate('EventDetailsScreen', {
            event: item,
            sourceLabel: getSourceLabel(),
          })
        }
      >
        <View style={styles.eventCard}>
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
            <Text style={styles.eventName} numberOfLines={1}>
              {item.name}
            </Text>

            <Text style={styles.eventMeta} numberOfLines={1}>
              {format(eventDate, 'MMM d, yyyy')} • {getEventTimeRange(item.time_begin, item.time_end)}
            </Text>

            {!!item.tagline && (
              <Text style={styles.eventTagline} numberOfLines={1}>
                {item.tagline}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TopNav title={format(selectedDate, 'MMMM d, yyyy')} showBack />

      <SafeAreaView style={styles.container}>
        <View style={styles.headerBlock}>
          <Text style={styles.countText}>
            {getCurrentCount()} {getCurrentCount() === 1 ? 'event' : 'events'}
          </Text>
        </View>

        <View style={styles.filterRow}>
          {renderFilterButton('Public', 'public')}
          {renderFilterButton('Followed', 'followed')}
          {renderFilterButton('Private', 'private')}
        </View>

        <FlatList
          data={eventData}
          keyExtractor={(item) => String(item.event_id)}
          renderItem={renderEventCard}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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

  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: '#f4f7fa',
  },

  countText: {
    fontSize: 16,
    color: '#6b7a8c',
    fontWeight: '500',
  },

  filterRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 14,
    backgroundColor: '#f4f7fa',
  },

  filterButtonWrapper: {
    flex: 1,
    marginHorizontal: 3,
  },

  filterButton: {
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterButtonInactive: {
    backgroundColor: '#e5e7eb',
  },

  filterButtonPressed: {
    opacity: 0.82,
  },

  filterText: {
    fontWeight: '600',
    color: '#334155',
  },

  filterTextActive: {
    color: '#ffffff',
  },

  listContent: {
    flexGrow: 1,
    paddingTop: 0,
    paddingBottom: 24,
  },

  eventCardWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#8aa9bf',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },

  eventCard: {
    backgroundColor: '#f8fbfd',
    borderWidth: 1,
    borderColor: '#e7f0f5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    marginTop: -2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  eventName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#16202a',
    marginBottom: 4,
  },

  eventMeta: {
    fontSize: 13,
    color: '#6a7a8b',
  },

  eventTagline: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 80,
    marginHorizontal: 16,
  },

  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e9ebef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 2,
  },
});

export default DateScreen;