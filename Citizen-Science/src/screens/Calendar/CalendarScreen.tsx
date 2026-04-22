import React, { useState, useCallback, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  getDates,
  getFollowedDates,
  getUserDates,
  getDayEvents,
  getFollowedEvents,
  getUserEvents,
} from '../../api/event';
import { addMonths, subMonths, addMonths as addMonthsToDate, format } from 'date-fns';
import { AuthContext } from '../../util/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { AccessToken } from '../../util/token';
import CreateEvent from '../Events/CreateEvent';
import Octicons from 'react-native-vector-icons/Octicons';
import TopNav from '../../components/TopNav';
import { LinearGradient } from 'expo-linear-gradient';

interface Marks {
  to_char: string;
  time_begin: string;
}

interface EventItem {
  event_id: number;
  name: string;
  tagline?: string;
  text_description?: string;
  time_begin: string;
  time_end?: string;
  source: 'public' | 'followed' | 'private';
}

const CalendarScreen = () => {
  const navigation = useNavigation<any>();
  const { userToken } = useContext(AuthContext);

  const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;
  const userId = decodedToken ? decodedToken.user_id : NaN;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);

  const [generalMarks, setGeneralMarks] = useState<Marks[]>([]);
  const [followedMarks, setFollowedMarks] = useState<Marks[]>([]);
  const [userMarks, setUserMarks] = useState<Marks[]>([]);
  const [marks, setMarks] = useState<any>({});

  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsLoading(true);
        setMarks({});

        await Promise.all([
          getGeneralMarks(),
          getFollowedMarks(),
          getPrivateMarks(),
          getUpcomingEvents(),
        ]);

        setIsLoading(false);
      };

      loadData();
    }, [selectedValue, modalVisible])
  );

  const createMarks = useCallback(() => {
    const newMarks: Record<string, { marked: boolean; dots: { color: string }[] }> = {};

    generalMarks.forEach(({ time_begin }) => {
      const day = new Date(time_begin).toLocaleDateString('sv-SE');
      if (!newMarks[day]) newMarks[day] = { marked: true, dots: [] };
      if (!newMarks[day].dots.some((dot) => dot.color === 'blue')) {
        newMarks[day].dots.push({ color: 'blue' });
      }
    });

    followedMarks.forEach(({ time_begin }) => {
      const day = new Date(time_begin).toLocaleDateString('sv-SE');
      if (!newMarks[day]) newMarks[day] = { marked: true, dots: [] };
      if (!newMarks[day].dots.some((dot) => dot.color === 'red')) {
        newMarks[day].dots.push({ color: 'red' });
      }
    });

    userMarks.forEach(({ time_begin }) => {
      const day = new Date(time_begin).toLocaleDateString('sv-SE');
      if (!newMarks[day]) newMarks[day] = { marked: true, dots: [] };
      if (!newMarks[day].dots.some((dot) => dot.color === 'lightgreen')) {
        newMarks[day].dots.push({ color: 'lightgreen' });
      }
    });

    setMarks(newMarks);
  }, [generalMarks, followedMarks, userMarks]);

  useEffect(() => {
    createMarks();
  }, [generalMarks, followedMarks, userMarks, createMarks]);

  const onDayPress = useCallback(
    (day: { dateString: string; day: number; month: number; year: number }) => {
      navigation.navigate('DateScreen', {
        id: userId,
        dateString: day.dateString,
        dayNum: day.day,
        month: day.month,
        year: day.year,
      });
    },
    [navigation, userId]
  );

  const getGeneralMarks = async () => {
    try {
      const data = await getDates(
        selectedValue.getMonth() + 1,
        selectedValue.getFullYear()
      );
      setGeneralMarks(data || []);
    } catch (error) {
      console.log('Error loading general marks:', error);
      setGeneralMarks([]);
    }
  };

  const getFollowedMarks = async () => {
    try {
      const data = await getFollowedDates(
        selectedValue.getMonth() + 1,
        selectedValue.getFullYear(),
        userId
      );
      setFollowedMarks(data || []);
    } catch (error) {
      console.log('Error loading followed marks:', error);
      setFollowedMarks([]);
    }
  };

  const getPrivateMarks = async () => {
    try {
      const data = await getUserDates(
        selectedValue.getMonth() + 1,
        selectedValue.getFullYear(),
        userId
      );
      setUserMarks(data || []);
    } catch (error) {
      console.log('Error loading user marks:', error);
      setUserMarks([]);
    }
  };

  const normalizeEvent = (
    event: any,
    source: 'public' | 'followed' | 'private'
  ): EventItem => {
    return {
      event_id: event.event_id ?? event.id,
      name: event.name ?? 'Untitled Event',
      tagline: event.tagline ?? '',
      text_description: event.text_description ?? '',
      time_begin: event.time_begin,
      time_end: event.time_end,
      source,
    };
  };

  const getUpcomingEvents = async () => {
    try {
      const bottom = new Date();
      bottom.setHours(0, 0, 0, 0);

      const top = addMonthsToDate(bottom, 3);

      const [publicEvents, followedEvents, privateEvents] = await Promise.all([
        getDayEvents(bottom, top),
        getFollowedEvents(bottom, top, userId),
        getUserEvents(bottom, top, userId),
      ]);

      const merged: EventItem[] = [
        ...(publicEvents || []).map((event: any) => normalizeEvent(event, 'public')),
        ...(followedEvents || []).map((event: any) => normalizeEvent(event, 'followed')),
        ...(privateEvents || []).map((event: any) => normalizeEvent(event, 'private')),
      ]
        .filter((event) => {
          if (!event.time_begin) return false;
          const eventDate = new Date(event.time_begin);
          return !isNaN(eventDate.getTime()) && eventDate >= bottom;
        })
        .sort(
          (a, b) =>
            new Date(a.time_begin).getTime() - new Date(b.time_begin).getTime()
        );

      const deduped = merged.filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.event_id === event.event_id)
      );

      setUpcomingEvents(deduped.slice(0, 5));
    } catch (error) {
      console.log('Error loading upcoming events:', error);
      setUpcomingEvents([]);
    }
  };

  const getEventGradient = (source: EventItem['source']) => {
    switch (source) {
      case 'private':
        return ['#0A8FC2', '#10A6D8'];
      case 'followed':
        return ['#0B95C8', '#12A9DB'];
      case 'public':
      default:
        return ['#0A88BC', '#11A5D6'];
    }
  };

  const getEventPillStyle = (source: EventItem['source']) => {
    switch (source) {
      case 'private':
        return styles.privatePill;
      case 'followed':
        return styles.followedPill;
      case 'public':
      default:
        return styles.publicPill;
    }
  };

  const getEventTimeRange = (start: string, end?: string) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    const startTimeText = format(startDate, 'h:mm a');
    const endTimeText = endDate ? format(endDate, 'h:mm a') : null;

    return endTimeText && startTimeText !== endTimeText
      ? `${startTimeText} - ${endTimeText}`
      : startTimeText;
  };

  const renderEventCard = ({ item }: { item: EventItem }) => {
    const subtitle =
      item.source === 'private'
        ? 'Private Event'
        : item.source === 'followed'
        ? 'Followed Event'
        : 'Public Event';

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.eventCardWrap}
        onPress={() =>
          navigation.navigate('DateScreen', {
            id: userId,
            dateString: new Date(item.time_begin).toISOString().split('T')[0],
            dayNum: new Date(item.time_begin).getDate(),
            month: new Date(item.time_begin).getMonth() + 1,
            year: new Date(item.time_begin).getFullYear(),
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
            <Text style={styles.dateBadgeText}>
              {format(new Date(item.time_begin), 'd')}
            </Text>
            <Text style={styles.dateBadgeMonth}>
              {format(new Date(item.time_begin), 'MMM')}
            </Text>
          </LinearGradient>

          <View style={styles.eventInfo}>
            <Text style={styles.eventName} numberOfLines={1}>
              {item.name}
            </Text>

            <Text style={styles.eventDate}>
              {format(new Date(item.time_begin), 'MMM d, yyyy')} •{' '}
              {getEventTimeRange(item.time_begin, item.time_end)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TopNav title="Calendar" />

      <SafeAreaView style={styles.flexContainer}>
        <FlatList
          data={upcomingEvents}
          keyExtractor={(item, index) =>
            item.event_id ? item.event_id.toString() : index.toString()
          }
          renderItem={renderEventCard}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Add Event</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                  <Octicons name="diff-added" size={28} color="#0084D1" />
                </TouchableOpacity>
              </View>

              <View style={styles.calendarContainer}>
                <Calendar
                  enableSwipeMonths
                  displayLoadingIndicator={isLoading}
                  current={selectedValue.toDateString()}
                  style={styles.calendar}
                  onDayPress={onDayPress}
                  onPressArrowLeft={(subtractMonth) => {
                    setSelectedValue(subMonths(selectedValue, 1));
                    subtractMonth();
                  }}
                  onPressArrowRight={(addMonth) => {
                    setSelectedValue(addMonths(selectedValue, 1));
                    addMonth();
                  }}
                  markingType="multi-dot"
                  markedDates={marks}
                  theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#b7c0cb',
                    selectedDayBackgroundColor: '#0D9ACE',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#0D9ACE',
                    dayTextColor: '#3b4a5a',
                    textDisabledColor: '#d7dee5',
                    arrowColor: '#14A7D8',
                    monthTextColor: '#46586b',
                    textMonthFontWeight: '500',
                    textDayFontWeight: '400',
                    textDayHeaderFontWeight: '500',
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14,
                  }}
                />
              </View>

              <View style={styles.upcomingContainer}>
                <Text style={styles.eventHeader}>Upcoming Events</Text>
                <Text style={styles.eventSubheader}>
                  A view of what’s next
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No upcoming events found.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <CreateEvent
          org_id={userId}
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      </SafeAreaView>
    </>
  );
};

export default CalendarScreen;

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#f4f7fa',
  },

  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
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
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2f3a45',
  },

  calendarContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },

  calendar: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
  },

  upcomingContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#f4f7fa',
  },

  eventHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },

  eventSubheader: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7a8c',
  },

  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  emptyText: {
    fontSize: 15,
    color: '#6b7280',
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

  eventAccent: {
    height: 4,
    width: '100%',
  },

  eventCard: {
    backgroundColor: '#f8fbfd',
    borderWidth: 1,
    borderColor: '#e7f0f5',
    borderTopWidth: 0,
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

  dateBadgeText: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 22,
  },

  dateBadgeMonth: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 12,
    marginTop: 2,
  },

  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  eventName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#16202a',
  },

  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  publicPill: {
    backgroundColor: '#e0f4fb',
  },

  followedPill: {
    backgroundColor: '#e2f5fb',
  },

  privatePill: {
    backgroundColor: '#dbf3fa',
  },

  typePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0c7daa',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  eventDate: {
    fontSize: 13,
    color: '#6a7a8b',
  },
});