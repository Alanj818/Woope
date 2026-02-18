import React, {useState} from "react";
import { Modal, View, TextInput, Button, StyleSheet, SafeAreaView, Text, FlatList, TouchableOpacity, ScrollView} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { createEvents } from "../api/event";
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
interface EventInfo {
    name: string;
    tagline: string;
    description: string;
    time_begin: Date;
    time_end: Date;
}
interface ModalProps {
    org_id: number,
    isVisible: boolean,
    onClose: () => void,
}
const CreateEvent: React.FC<ModalProps> = ({org_id, isVisible, onClose}) => {
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [show, setShow] = useState(false);
    const [newInfo, setNewInfo] = useState<EventInfo>({
        name: "",
        tagline: "",
        description: "",
        time_begin: new Date(),
        time_end: new Date(),
        })

    const handleSave = async () => {
        try {
            const response = await createEvents(org_id, newInfo.name, newInfo.tagline, newInfo.description, startDate, endDate)
        } catch (error) {
            console.log('Update Failed', error);
        }
    }
    
    const showMode = () => {
    setShow(true);
    };

    const handleInputChange = (field: keyof EventInfo, value: string) => {
        setNewInfo(prevState => ({ ...prevState, [field]: value }));
    };
    const insets = useSafeAreaInsets();
    return(
        <Modal 
        transparent = {true}
        animationType="fade"
        visible = {isVisible} 
        onRequestClose={onClose}
        > 
        <View style={styles.modalContainer}>
            <LinearGradient
              colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.header, { paddingTop: insets.top, height: insets.top + 56 }]}
            >
              <View style={styles.headerInner}>
                <View style={styles.leftGroup}>
                  <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <MaterialIcons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.headingWrapper}>
                    <Text style={styles.titleText}>Create Event</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
            <SafeAreaView style={styles.contentSafeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Event Name</Text>
                    <TextInput 
                    onChangeText={(value) => handleInputChange("name", value)}
                    placeholder="Enter event name"
                    maxLength={50}
                    style={styles.textbox}
                    ></TextInput>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tagline</Text>
                    <TextInput 
                    onChangeText={(value) => handleInputChange("tagline", value)}
                    placeholder="Enter a tagline"
                    maxLength={50}
                    style={styles.textbox}
                    ></TextInput>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput 
                    onChangeText={(value) => handleInputChange("description", value)}
                    placeholder="Enter event description"
                    maxLength={500}
                    multiline={true}
                    style={[styles.textbox, {minHeight: 100}]}
                    ></TextInput>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Start Date & Time</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={showMode}>
                        <MaterialIcons name="calendar-today" size={20} color="#0084D1" />
                        <Text style={styles.dateButtonText}>{startDate.toLocaleString()}</Text>
                    </TouchableOpacity>
                    {show && (
                        <DateTimePicker
                            value={startDate}
                            mode={"datetime"}
                            onChange={(event, selectedDate) => {
                                const currentDate = selectedDate;
                                setShow(false);
                                setStartDate(currentDate!);
                            }}
                        />
                    )}
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>End Time</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={showMode}>
                        <MaterialIcons name="access-time" size={20} color="#0084D1" />
                        <Text style={styles.dateButtonText}>{endDate.toLocaleTimeString()}</Text>
                    </TouchableOpacity>
                    {show && (
                        <DateTimePicker
                            value={endDate}
                            mode={"time"}
                            onChange={(event, selectedDate) => {
                                const currentDate = selectedDate;
                                setShow(false);
                                setEndDate(currentDate!);
                            }}
                        />
                    )}
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                    style={[styles.button, styles.createButton]} 
                    onPress = {() => {
                        handleSave();
                        onClose();
                    }}>
                        <Text style={styles.createButtonText}>Create</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            </SafeAreaView>
        </View>
        </Modal>
    );
};
const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    contentSafeArea: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    safeview: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        paddingBottom: 8,
    },
    headerInner: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 44,
        paddingHorizontal: 16,
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 8,
        padding: 6,
    },
    headingWrapper: {
        height: 44,
        justifyContent: 'center',
    },
    titleText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '400',
        lineHeight: 28,
    },
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    contentContainer: {
        padding: 16,
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    textbox:{
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#0084D1",
        backgroundColor: "white",
        fontSize: 14,
        color: "#333",
    },
    dateButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#0084D1",
        backgroundColor: "white",
    },
    dateButtonText: {
        color: "#333",
        fontSize: 14,
    },
    buttonContainer: {
        gap: 12,
        flexDirection: "row",
        marginTop: 16,
        marginBottom: 32,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButton: {
        backgroundColor: "#e0e0e0",
    },
    cancelButtonText: {
        color: "#333",
        fontSize: 14,
        fontWeight: "600",
    },
    createButton: {
        backgroundColor: "#0084D1",
    },
    createButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
});
export default CreateEvent;