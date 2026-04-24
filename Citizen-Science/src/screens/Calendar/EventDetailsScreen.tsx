import React, { useState } from 'react';
import {
    View, Text, SafeAreaView, ScrollView, StyleSheet,
    TouchableOpacity, Modal, TextInput, TouchableWithoutFeedback
} from 'react-native';
import { format } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import TopNav from '../../components/TopNav';
import { deleteEvent, updateEvent } from '../../api/event';

const STRINGS = {
    title: 'Event Details',
    editTitle: 'Edit Event',
    date: 'DATE',
    time: 'TIME',
    description: 'DESCRIPTION',
    noDescription: 'No description provided.',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    eventName: 'Event Name',
    tagline: 'Tagline',
    descriptionLabel: 'Description',
    startDate: 'Start Date & Time',
    endTime: 'End Time',
    deleteTitle: 'Delete Event',
    deleteMessage: 'Are you sure you want to delete this event? This action cannot be undone.',
    deleteConfirm: 'Delete',
};

const EventDetailsScreen = ({ route, navigation }: { route: any; navigation: any }) => {
    const { event } = route.params;
    const insets = useSafeAreaInsets();

    const [menuVisible, setMenuVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [currentEvent, setCurrentEvent] = useState(event);

    const [editName, setEditName] = useState(event.name || '');
    const [editTagline, setEditTagline] = useState(event.tagline || '');
    const [editDescription, setEditDescription] = useState(event.text_description || '');
    const [editStartDate, setEditStartDate] = useState(new Date(event.time_begin));
    const [editEndDate, setEditEndDate] = useState(event.time_end ? new Date(event.time_end) : new Date(event.time_begin));
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const startDate = new Date(currentEvent.time_begin);
    const endDate = currentEvent.time_end ? new Date(currentEvent.time_end) : null;
    const startTimeText = format(startDate, 'h:mm a');
    const endTimeText = endDate ? format(endDate, 'h:mm a') : null;
    const formattedTime =
        endTimeText && startTimeText !== endTimeText
            ? `${startTimeText} - ${endTimeText}`
            : startTimeText;

    const description = currentEvent.text_description?.trim()
        ? currentEvent.text_description
        : STRINGS.noDescription;

    const handleDelete = async () => {
        try {
            await deleteEvent(currentEvent.event_id, currentEvent.name);
            setDeleteVisible(false);
            navigation.goBack();
        } catch (error) {
            console.log('Error deleting event:', error);
        }
    };

    const handleSave = async () => {
        try {
            await updateEvent(
                currentEvent.event_id,
                editTagline,
                editDescription,
                editStartDate,
                editEndDate,
            );
            setCurrentEvent({
                ...currentEvent,
                name: editName,
                tagline: editTagline,
                text_description: editDescription,
                time_begin: editStartDate.toISOString(),
                time_end: editEndDate.toISOString(),
            });
            setEditVisible(false);
        } catch (error) {
            console.log('Error updating event:', error);
        }
    };

    return (
        <>
            <TopNav title={STRINGS.title} showBack />
            <SafeAreaView style={styles.container}>
                <TouchableWithoutFeedback onPress={() => { if (menuVisible) setMenuVisible(false); }}>
                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Title card */}
                        <View style={styles.titleCard}>
                            <View style={styles.titleRow}>
                                <Text style={styles.eventName}>{currentEvent.name}</Text>
                                <TouchableOpacity
                                    onPress={() => setMenuVisible(!menuVisible)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    style={styles.menuTrigger}
                                >
                                    <MaterialIcons name="more-vert" size={20} color="#b0bec5" />
                                </TouchableOpacity>
                            </View>
                            {!!currentEvent.tagline && (
                                <Text style={styles.eventTagline}>{currentEvent.tagline}</Text>
                            )}

                            {menuVisible && (
                                <View style={styles.dropdownMenu}>
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => { setMenuVisible(false); setEditVisible(true); }}
                                    >
                                        <MaterialIcons name="edit" size={17} color="#0084D1" />
                                        <Text style={styles.menuItemText}>{STRINGS.edit}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.menuItem, styles.menuItemLast]}
                                        onPress={() => { setMenuVisible(false); setDeleteVisible(true); }}
                                    >
                                        <MaterialIcons name="delete" size={17} color="#e05c5c" />
                                        <Text style={[styles.menuItemText, styles.menuItemDestructive]}>{STRINGS.delete}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Date */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionLabel}>{STRINGS.date}</Text>
                            <Text style={styles.sectionValue}>
                                {format(startDate, 'EEEE, MMMM d, yyyy')}
                            </Text>
                        </View>

                        {/* Time */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionLabel}>{STRINGS.time}</Text>
                            <Text style={styles.sectionValue}>{formattedTime}</Text>
                        </View>

                        {/* Description */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionLabel}>{STRINGS.description}</Text>
                            <Text style={styles.descriptionText}>{description}</Text>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </SafeAreaView>

            {/* Delete Confirmation Modal */}
            <Modal
                transparent
                animationType="fade"
                visible={deleteVisible}
                onRequestClose={() => setDeleteVisible(false)}
            >
                <View style={styles.deleteOverlay}>
                    <View style={styles.deleteModal}>
                        <Text style={styles.deleteTitle}>{STRINGS.deleteTitle}</Text>
                        <Text style={styles.deleteMessage}>{STRINGS.deleteMessage}</Text>
                        <View style={styles.deleteButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setDeleteVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>{STRINGS.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.deleteConfirmButton]}
                                onPress={handleDelete}
                            >
                                <Text style={styles.deleteConfirmText}>{STRINGS.deleteConfirm}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal — fade, full screen */}
            <Modal
                  transparent={true}
                  animationType="fade"
                  visible={editVisible}
                  onRequestClose={() => setEditVisible(false)}
              >
                  <View style={styles.modalContainer}>
                    <LinearGradient
                        colors={['rgba(0,132,209,1)', 'rgba(0,146,184,1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.modalHeader, { paddingTop: insets.top, height: insets.top + 56 }]}
                    >
                        <View style={styles.modalHeaderInner}>
                            <View style={styles.modalHeaderLeft}>
                                <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.modalCloseBtn}>
                                    <MaterialIcons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                                <View style={styles.modalHeadingWrapper}>
                                    <Text style={styles.modalTitleText}>{STRINGS.editTitle}</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>

                    <SafeAreaView style={styles.modalContentSafeArea}>
                        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{STRINGS.eventName}</Text>
                                <TextInput
                                    style={styles.textbox}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Enter event name"
                                    maxLength={50}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{STRINGS.tagline}</Text>
                                <TextInput
                                    style={styles.textbox}
                                    value={editTagline}
                                    onChangeText={setEditTagline}
                                    placeholder="Enter a tagline"
                                    maxLength={50}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{STRINGS.descriptionLabel}</Text>
                                <TextInput
                                    style={[styles.textbox, { minHeight: 100 }]}
                                    value={editDescription}
                                    onChangeText={setEditDescription}
                                    placeholder="Enter event description"
                                    maxLength={500}
                                    multiline
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{STRINGS.startDate}</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowStartPicker(true)}
                                >
                                    <MaterialIcons name="calendar-today" size={20} color="#0084D1" />
                                    <Text style={styles.dateButtonText}>{editStartDate.toLocaleString()}</Text>
                                </TouchableOpacity>
                                {showStartPicker && (
                                    <DateTimePicker
                                        value={editStartDate}
                                        mode="datetime"
                                        onChange={(e, selectedDate) => {
                                            setShowStartPicker(false);
                                            if (selectedDate) setEditStartDate(selectedDate);
                                        }}
                                    />
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{STRINGS.endTime}</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowEndPicker(true)}
                                >
                                    <MaterialIcons name="access-time" size={20} color="#0084D1" />
                                    <Text style={styles.dateButtonText}>{editEndDate.toLocaleTimeString()}</Text>
                                </TouchableOpacity>
                                {showEndPicker && (
                                    <DateTimePicker
                                        value={editEndDate}
                                        mode="time"
                                        onChange={(e, selectedDate) => {
                                            setShowEndPicker(false);
                                            if (selectedDate) setEditEndDate(selectedDate);
                                        }}
                                    />
                                )}
                            </View>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={() => setEditVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>{STRINGS.cancel}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.saveButton]}
                                    onPress={handleSave}
                                >
                                    <Text style={styles.saveButtonText}>{STRINGS.save}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </Modal>
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
        paddingBottom: 36,
        gap: 12,
    },
    titleCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 18,
        shadowColor: '#8aa9bf',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
        zIndex: 20,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    eventName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
        marginRight: 10,
    },
    eventTagline: {
        fontSize: 14,
        color: '#6b7a8c',
    },
    menuTrigger: {
        padding: 2,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 44,
        right: 12,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e7f0f5',
        zIndex: 30,
        minWidth: 140,
        shadowColor: '#8aa9bf',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e7f0f5',
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuItemText: {
        fontSize: 14,
        color: '#0084D1',
        fontWeight: '500',
    },
    menuItemDestructive: {
        color: '#e05c5c',
    },
    sectionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        shadowColor: '#8aa9bf',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0088ca',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    sectionValue: {
        fontSize: 15,
        color: '#1a2530',
        lineHeight: 22,
    },
    descriptionText: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },

    // Delete confirmation modal
    deleteOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    deleteModal: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    deleteTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 10,
    },
    deleteMessage: {
        fontSize: 14,
        color: '#6b7a8c',
        lineHeight: 20,
        marginBottom: 20,
    },
    deleteButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    deleteConfirmButton: {
        backgroundColor: '#e05c5c',
    },
    deleteConfirmText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

    // Edit modal styles matching CreateEvent
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    modalContentSafeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    modalHeader: {
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        paddingBottom: 8,
    },
    modalHeaderInner: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 44,
        paddingHorizontal: 16,
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalCloseBtn: {
        marginRight: 8,
        padding: 6,
    },
    modalHeadingWrapper: {
        height: 44,
        justifyContent: 'center',
    },
    modalTitleText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '400',
        lineHeight: 28,
    },
    modalScroll: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    modalScrollContent: {
        padding: 16,
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    textbox: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0084D1',
        backgroundColor: 'white',
        fontSize: 14,
        color: '#333',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0084D1',
        backgroundColor: 'white',
    },
    dateButtonText: {
        color: '#333',
        fontSize: 14,
    },
    buttonContainer: {
        gap: 12,
        flexDirection: 'row',
        marginTop: 16,
        marginBottom: 32,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#e0e0e0',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#0084D1',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default EventDetailsScreen;