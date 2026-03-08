import React, {useState,  useCallback, useEffect, useContext} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Button, Dimensions, Image} from 'react-native';
import {Calendar} from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { getDates, getFollowedDates, getUserDates } from '../../api/event';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addMonths, getDay, getMonth, subMonths, fromUnixTime, addDays} from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../util/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { AccessToken } from '../../util/token';
import CreateUserEvent from './CreateUserEvent'
import { useSafeAreaInsets } from 'react-native-safe-area-context';;

import ScreenHeader from '../../components/ScreenHeader';
import TopNav from '../../components/TopNav';


interface Arguments {
  marked: boolean;
  dots: {
    color: string;
    selectedDotColor: string;
  };
}
interface Marks {
  to_char: string;
  time_begin: string;
}

const CalendarScreen = () => {
  const navigation = useNavigation<any>();
  const { userToken, setUserToken } = useContext(AuthContext);
  const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;
  const userId = decodedToken ? decodedToken.user_id : NaN;
  const [isLoading, setIsLoading] =useState(false);
  const [selectedValue, setSelectedValue] = useState(new Date());
  let [generalMarks, setGeneralMarks] = useState<Marks[]>([]);
  let [followedMarks, setFollowedMarks] = useState<Marks[]>([]);
  let [userMarks, setUserMarks] = useState<Marks[]>([]);
  let [followedItems, setFollowedItems] = useState<string[]>([]);
  let [marks, setMarks] = useState<any>({});
  const generalColor = {color:'blue'};  
  const followedColor = {color: 'red'};
  const userColor = {color: 'lightgreen'};
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
   
  // gets all dates with marks/types of marks and once all promises are successful
  // creates the marks and applies them to the calendar
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setMarks({}); // clear old dots
        await Promise.all([
          getGeneralMarks(),
          getFollowedMarks(),
          getUserMarks(),
        ]);
      };
      loadData();
    }, [selectedValue, modalVisible])
  );

  //if event is added or a different month is viewed update the marks
  useEffect(() => {
    if (generalMarks.length || followedMarks.length || userMarks.length) { //are any of these arrays populated
      createMarks();
    }
  }, [generalMarks, followedMarks, userMarks]);

// creates the marks object to send to the calendar
 const createMarks = useCallback(() => {
  //newMarks is a map. Key<string>: Date, Value<bool, string>: isDotForEvent, color
  const newMarks: Record<string, { marked: boolean; dots: { color: string }[] }> = {};

  //go through all public events, mark as blue
  generalMarks.forEach(({ time_begin }) => {
    const day = new Date(time_begin).toLocaleDateString('sv-SE');
    newMarks[day] = { marked: true, dots: [{ color: 'blue' }] };
  });

  //go through all followed events, mark as red
  followedMarks.forEach(({ time_begin }) => {
    const day = new Date(time_begin).toLocaleDateString('sv-SE');
    if (!newMarks[day]) newMarks[day] = { marked: true, dots: [] };
    if (!newMarks[day].dots.some(({ color }) => color === 'red')) {
      newMarks[day].dots.push({ color: 'red' });
    }
  });

  //go through all private user events, mark as light green
  userMarks.forEach(({ time_begin }) => {
    const day = new Date(time_begin).toLocaleDateString('sv-SE');
    if (!newMarks[day]) newMarks[day] = { marked: true, dots: [] };
    if (!newMarks[day].dots.some(({ color }) => color === 'lightgreen')) {
      newMarks[day].dots.push({ color: 'lightgreen' });
    }
  });

  setMarks(newMarks);
}, [generalMarks, followedMarks, userMarks]);


  // Navigates to day selected to display all events
  const onDayPress = useCallback((day: { dateString: string; day: number; month: number; year: number }) => {
    navigation.navigate("DateScreen", {
        id: userId,
        dateString: day.dateString,
        dayNum: day.day,
        month: day.month,
        year: day.year
    })
  }, [navigation, userId]);

  // gets all days that have events
  const getGeneralMarks = async() => {
    try {
      setGeneralMarks(await getDates(selectedValue.getMonth() + 1, selectedValue.getFullYear()));
    } catch (error) {
        console.log(error);
    }
  }

  // gets all days with events that are FOLLOWED by USER
  const getFollowedMarks = async() => {
    try {
      followedMarks = await getFollowedDates(selectedValue.getMonth() + 1, selectedValue.getFullYear(), userId);
      setFollowedMarks(followedMarks);
    } catch (error) {
      console.log(error);
    }
  }
  // gets all events that are private/user created
  const getUserMarks = async() => {
    try {
      userMarks = await getUserDates(selectedValue.getMonth() + 1, selectedValue.getFullYear(), userId);
      setUserMarks(userMarks);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <View>
      <TopNav title="Calendar" />
      <TouchableOpacity style={styles.createEventButton}>
         <Image style={[styles.addButton, {top: insets.top + 8}]} source={require("../../../assets/addButton.png")}/>
      </TouchableOpacity>

      
     
     

      {/* calendar */}
      <View style={styles.container}> 
        <View style={styles.calendarContainer}>
            <Calendar
                enableSwipeMonths
                displayLoadingIndicator = {isLoading}
                current={selectedValue.toDateString()}
                style={styles.calendar}
                onDayPress={onDayPress}
                onPressArrowLeft={subtractMonth => {
                  setSelectedValue(subMonths(selectedValue, 1));
                  subtractMonth();
                }}
                onPressArrowRight={addMonth => {
                  setSelectedValue(addMonths(selectedValue, 1));
                  addMonth();
                }}
                markingType={'multi-dot'}
                markedDates={marks}
              />
          </View>

        {/* Events */}
        <View>
          <Text style ={styles.eventHeader}>Upcoming Events</Text>
        </View>

      
      </View>
      <CreateUserEvent user_id={userId} isVisible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

export default CalendarScreen;
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const styles = StyleSheet.create({
  text:{
    fontFamily: "Inter-Regular",
  },
  container: {
    height: screenHeight,
    width: screenWidth,
    flexDirection: 'column',
    backgroundColor: 'white',
  },
  headerContainer: {
    paddingBottom:20,
  },
  calendarContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: 'white'
  },
  calendar: {
  },
  buttonContainer: {
    padding: 10,
    borderRadius: 20,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  directoryButton: {
    borderRadius: 10,
    padding: 14,
    marginVertical: 7,
    marginHorizontal: 15,
    backgroundColor: "lightblue",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: {
        width: 1,
        height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 9,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginHorizontal: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DCEFFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  listCardText: {
    fontSize: 18,
    color: '#0D2538',
    textAlign: 'left',
    flex: 1,
    paddingLeft: 4,
  },
  postBox: {
    backgroundColor: "#B4D7EE",
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E7F3FD",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 6,
},
postBoxInner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
    alignSelf: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: "#D1E3FA",
},
postBoxText: {
    fontSize: 16,
    color: "#333",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    textAlign: "center",
},
 header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },

  headerTitle: {
    textAlign: 'center',
    fontSize: 25,
    fontFamily: "Inter-Regular",
    marginLeft: -270, 
    marginTop: 10, 
  },

  headerButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },

  headerButtonText: {
    fontSize: 22,
    fontWeight: '600',
  },

  eventHeader:{
    textAlign: 'center',
    fontSize: 20,
    fontFamily: "Inter-Regular",
    marginLeft: -210, 
    marginTop: 10, 
  },
  addButton:{
    width: 70,
    height: 70,
  },
   createEventButton: {
    position: 'absolute',
    right: 16,
    zIndex: 40,
  },

});
