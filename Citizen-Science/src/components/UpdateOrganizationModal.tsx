/*
    Modal component to edit the organization info from the organization card
    Takes the organization name, whether its visible, and a function when it closes
*/
import React, {useState} from "react";
import { Modal, View, TextInput, Button, StyleSheet, SafeAreaView, Text, TouchableOpacity, ScrollView, Image} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { updateOrganization, updateOrgPhoto} from "../api/organizations";
import * as ImagePicker from "expo-image-picker";
import { submitForm } from "../api/upload";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
interface OrganizationInfo {
    tagline: string;
    description: string;
}
interface ImageInfo {
    name: string;
    uri: string;
}
interface ModalProps {
    org_id: number,
    name: string,
    isVisible: boolean,
    onClose: () => void,
}
const UpdateOrganizationModal: React.FC<ModalProps> = ({org_id, name, isVisible, onClose}) => {
    const [newInfo, setNewInfo] = useState<OrganizationInfo>({
        tagline: "",
        description: "",
    })
    const [imageInfo, setImageInfo] = useState<ImageInfo>({
        name: "",
        uri: "",
    })
    const handleInputChange = (field: keyof OrganizationInfo, value: string) => {
		setNewInfo(prevState => ({ ...prevState, [field]: value }));
	};
    // uploads photo if one is selected and places filename in database
    const uploadPhoto = async () => {
         // upload to server
            const formData = new FormData();
            formData.append("file", imageInfo as any, imageInfo.name);
            submitForm("file", formData, (msg: string) => console.log(msg));
            // upload filename to database
            try {
                const response = await updateOrgPhoto(name, imageInfo.name.toString());
            } catch (error) {
                console.log('Error', error);
            }
        
    }
    // updates organization info in database if new info is entered
    const updateInfo = async () => {
            try {
                // upload metadata to database
                const response = await updateOrganization(org_id, name, newInfo.tagline, newInfo.description)
            }catch(error) {
                console.log('Organization Info Update Failed', error);
            }
    }
    // handles when the save button is pressed
    const handleSave = async () => {
        if(imageInfo.name){
            await uploadPhoto();
            setImageInfo({ 
                name: "",
                uri: "",
            })
        }
        if(newInfo.description || newInfo.tagline){
            await updateInfo();
            setNewInfo({
                tagline: "",
                description: "",
            })
        }
    }
    
    const selectImage = async () => {
        try {
            // request permissions to image library on iphone
            await ImagePicker.requestMediaLibraryPermissionsAsync();
            // only allow images
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [18,6],
                quality: 1,
            })
            // if not cancelled
            if (!result.canceled) {
                console.log("test")
                const assets = result.assets;
                const file = assets[0];
                // set image info to append to form data once submit is pressed
                setImageInfo({
                    name: Date.now() + '--' + file.fileName,
                    uri: file.uri,
                })
            }else {
            console.log("Document selection cancelled.");
            }
        } catch (error) {
            console.log('Photo upload failed', error);
        }
    }
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
                    <Text style={styles.titleText}>Edit Organization</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
            <SafeAreaView style={styles.contentSafeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tagline</Text>
                    <TextInput 
                    onChangeText={(value) => handleInputChange("tagline", value)}
                    maxLength={50}
                    placeholder="Enter a new tagline"
                    style={styles.textbox}
                    ></TextInput>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput 
                    onChangeText={(value) => handleInputChange("description", value)}
                    maxLength={500}
                    placeholder="Enter a new description"
                    multiline={true}
                    style={[styles.textbox, {minHeight: 120}]}
                    ></TextInput>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Banner Image</Text>
                    {imageInfo.uri ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image 
                                source={{ uri: imageInfo.uri }} 
                                style={styles.imagePreview}
                            />
                            <TouchableOpacity 
                                style={styles.removeImageButton}
                                onPress={() => setImageInfo({ name: "", uri: "" })}
                            >
                                <MaterialIcons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.imageButton} onPress={() => selectImage()}>
                            <MaterialIcons name="add-photo-alternate" size={32} color={"#0084D1"}/>
                            <Text style={styles.imageButtonText}>Select Image</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                        <Text style={styles.cancelButtonText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress = {async() => {
                        await handleSave();
                        onClose();
                    }}>
                        <Text style={styles.saveButtonText}>Save</Text>
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
    imageButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#0084D1",
        backgroundColor: "#f0f8ff",
    },
    imagePreviewContainer: {
        position: "relative",
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#f0f0f0",
    },
    imagePreview: {
        width: "100%",
        height: 180,
        borderRadius: 8,
    },
    removeImageButton: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    imageButtonText: {
        color: "#0084D1",
        fontSize: 14,
        fontWeight: "500",
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
    saveButton: {
        backgroundColor: "#0084D1",
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
});
export default UpdateOrganizationModal;