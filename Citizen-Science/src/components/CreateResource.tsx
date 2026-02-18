import React, {useState} from "react";
import { Modal, View, TextInput, Button, StyleSheet, SafeAreaView, Text, FlatList, TouchableOpacity, ScrollView} from "react-native";
import { createResource } from "../api/resources";
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
interface ResourceInfo {
    name: string;
    tagline: string;
    description: string;
}
interface ModalProps {
    org_id: number,
    isVisible: boolean,
    onClose: () => void,
}
const CreateResource: React.FC<ModalProps> = ({org_id, isVisible, onClose}) => {
    const handleSave = async () => {
        try {
            const response = await createResource(org_id, newInfo.name, newInfo.tagline, newInfo.description)
        } catch (error) {
            console.log('Update Failed', error);
        }
    }
    const [newInfo, setNewInfo] = useState<ResourceInfo>({
            name: "",
            tagline: "",
            description: "",
        })
    const handleInputChange = (field: keyof ResourceInfo, value: string) => {
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
                    <Text style={styles.titleText}>Create Resource</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
            <SafeAreaView style={styles.contentSafeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Resource Name</Text>
                    <TextInput 
                    onChangeText={(value) => handleInputChange("name", value)}
                    maxLength={50}
                    placeholder="Enter resource name"
                    style={styles.textbox}
                    ></TextInput>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tagline</Text>
                    <TextInput 
                    onChangeText={(value) => handleInputChange("tagline", value)}
                    maxLength={50}
                    placeholder="Enter a tagline"
                    style={styles.textbox}
                    ></TextInput>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput 
                    onChangeText={(value) => handleInputChange("description", value)}
                    maxLength={500}
                    placeholder="Enter resource description"
                    multiline={true}
                    style={[styles.textbox, {minHeight: 100}]}
                    ></TextInput>
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
})
export default CreateResource;