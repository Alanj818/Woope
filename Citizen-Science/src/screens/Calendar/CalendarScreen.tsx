import React, { useState, useCallback, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getDates, getFollowedDates, getUserDates } from '../../api/event';
import { addMonths, subMonths } from 'date-fns';
import { AuthContext } from '../../util/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { AccessToken } from '../../util/token';
import CreateEvent from '../Events/CreateEvent';
import Octicons from 'react-native-vector-icons/Octicons';
import TopNav from '../../components/TopNav';

interface Marks {
  to_char: string;
  time_begin: string;
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

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setMarks({});
        await Promise.all([
          getGeneralMarks(),
          getFollowedMarks(),
          getUserMarks(),
        ]);
      };

      loadData();
    }, [selectedValue, modalVisible])
  );

  useEffect(() => {
    if (generalMarks.length || followedMarks.length || userMarks.length) {
      createMarks();
    }
  }, [generalMarks, followedMarks, userMarks]);

  const createMarks = useCallback(() => {
    const newMarks: Record<string, { marked: boolean; dots: { color: string }[] }> = {};

    generalMarks.forEach(({ time_begin }) => {
      const day = new Date(time_begin).toLocaleDateString('sv-SE');
      newMarks[day] = { marked: true, dots: [{ color: 'blue' }] };
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
      setGeneralMarks(data);
    } catch (error) {
      console.log(error);
    }
  };

  const getFollowedMarks = async () => {
    try {
      const data = await getFollowedDates(
        selectedValue.getMonth() + 1,
        selectedValue.getFullYear(),
        userId
      );
      setFollowedMarks(data);
    } catch (error) {
      console.log(error);
    }
  };

  const getUserMarks = async () => {
    try {
      const data = await getUserDates(
        selectedValue.getMonth() + 1,
        selectedValue.getFullYear(),
        userId
      );
      setUserMarks(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <TopNav title="Calendar" />

      <SafeAreaView style={styles.flexContainer}>
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
          />
        </View>

        <View style={styles.upcomingContainer}>
          <Text style={styles.eventHeader}>Upcoming Events</Text>
        </View>

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
    backgroundColor: 'transparent',
    marginTop: 0,
    paddingTop: 0,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  calendarContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },

  calendar: {
    backgroundColor: '#fff',
  },

  upcomingContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#fff',
    flex: 1,
  },

  eventHeader: {
    fontSize: 20,
    color: '#000',
  },
});