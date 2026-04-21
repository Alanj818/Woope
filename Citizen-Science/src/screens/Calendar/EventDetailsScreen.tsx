import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { format } from 'date-fns';
import TopNav from '../../components/TopNav';

const EventDetailsScreen = ({ route }: { route: any }) => {
  const { event } = route.params;

  const startDate = new Date(event.time_begin);
  const endDate = event.time_end ? new Date(event.time_end) : null;

  const startTimeText = format(startDate, 'h:mm a');
  const endTimeText = endDate ? format(endDate, 'h:mm a') : null;

  const formattedTime =
    endTimeText && startTimeText !== endTimeText
      ? `${startTimeText} - ${endTimeText}`
      : startTimeText;

  const description = event.text_description?.trim()
    ? event.text_description
    : 'No description provided.';

  return (
    <>
      <TopNav title="Event Details" showBack />

      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroText}>
              <Text style={styles.eventName}>{event.name}</Text>

              {!!event.tagline && (
                <Text style={styles.eventTagline}>{event.tagline}</Text>
              )}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Date</Text>
            <Text style={styles.sectionValue}>
              {format(startDate, 'EEEE, MMMM d, yyyy')}
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Time</Text>
            <Text style={styles.sectionValue}>{formattedTime}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fa',
  },

  content: {
    padding: 16,
    paddingBottom: 28,
  },

  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#8aa9bf',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },

  heroText: {
    flex: 1,
  },

  eventName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },

  eventTagline: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 22,
  },

  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#8aa9bf',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A8ED0',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  sectionValue: {
    fontSize: 17,
    color: '#111827',
    lineHeight: 24,
  },

  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
});

export default EventDetailsScreen;