/*
    This screen displays the information and files of the selected resource 
*/
import React, {useEffect, useState}from "react";
import { Text,View, SafeAreaView, ScrollView,StyleSheet, Image ,StatusBar, TouchableOpacity, Button, FlatList, TextInput, Modal} from "react-native";
import ResourceCard from "../../components/ResourceCard";
import TopNav from '../../components/TopNav';
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from "expo-sharing";
import { ResourceMedia } from "../../api/types";
import { getResourceMedia, insertResourceMedia, deleteResourceMedia} from "../../api/resources";
import { AntDesign } from '@expo/vector-icons';
import { submitForm } from "../../api/upload"
import { WebView } from "react-native-webview"
import { serverDelete } from "../../api/upload";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

interface ResourceInfo{
    name: string;
    uri: string;
}
interface FileName{
    name: string;
}


export const ResourceProfile = ({ route, navigation }: { route: any; navigation: any }) => {
    const insets = useSafeAreaInsets();
    const [selectedDocuments, setSelectedDocuments] = useState<ResourceInfo>({
        name: "",
        uri: "", 
    });
    const [fileName, setFileName] = useState<FileName>({
        name: "",
    });
    const [deleteCheck, setDeleteCheck] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [resourceMedia, setResourceMedia] = useState<ResourceMedia[]>();
    const [isModalVisible, setIsModalVisible] =useState<boolean>(false);
    const [isWebModalVisible, setIsWebModalVisible] =useState<boolean>(false);
    const [downloadInfo, setDownloadInfo] = useState<string>("");
    const [previewLink, setPreviewLink] = useState<string>("");
    const [previewName, setPreviewName] = useState<string>("");
    
    useEffect(() => {
        getResources();
    },[isModalVisible, deleteCheck])

    const handleInputChange = (field: keyof FileName, value: string) => {
		setFileName(prevState => ({ ...prevState, [field]: value }));
	};

// retrieves resources given parent resource_id
    const getResources = async() => {
        try {
            const response = await getResourceMedia(route.params.resource_id);
            setResourceMedia(response);
        } catch (error) {
            console.log("Failed ot retrieve resources: " + error)
        }
        
    }

// uploading selected file to server
    const uploadFile = async () => {
        const formData = new FormData();
        formData.append("file", selectedDocuments as any, selectedDocuments.name.toString());
        console.log(formData);
    submitForm("file", formData, (msg: any) => console.log(msg)); 
        try {
            let result = await insertResourceMedia(route.params.resource_id, fileName.name, selectedDocuments.name.toString())
        } catch (error) {
            console.log("File upload failed: " + error);
        }
    }
// uploading selected file path and info to database
    const uploadPath = async () => {
        try {
            let result = await insertResourceMedia(route.params.resource_id, fileName.name , selectedDocuments.name)
        } catch (error) {
            console.log("Error uploading filepath to database: " + error)
        }
    }
// prompts os document picker and grabs selected metadata
    const pickDocuments = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync();
                if (!result.canceled) {
                    const file = result.assets[0];
                    selectedDocuments.name = Date.now() + '--' + file.name;
                    selectedDocuments.uri = file.uri;
                }else {
                console.log("Document selection cancelled.");
                }
        } catch (error) {
            console.log("Error picking documents: " + error);
        }
    }; 
// deletes specified resource media
    const deleteMedia = async(media_id: number) => {
        try {
            let result = await deleteResourceMedia(media_id); 
        } catch (error) {
            console.log("Error deleting media: " + error);
        }
    }
// deletes from server
    const trueDelete = async(path: string) => {
        try {
            serverDelete(path);
        } catch (error) {
            console.log("Error deleting from server from frontend: " + error)
        }
    }
    const uploadPress = () => {
        pickDocuments().then((value) => {
            setIsModalVisible(true);
        });
    }
    const save = () => {
        uploadFile().then((value) => {
            setIsModalVisible(false);
        })
    }
    const pressDelete = (media_id: number, file_path: string) => {
        deleteMedia(media_id);
        console.log("ppop")
        trueDelete(file_path);
        console.log("pee")
        setDeleteCheck(!deleteCheck);
    }
    const pressDownload = (file_path: string) => {
        downloadFromUrl(file_path).then((value) => {
        })
    }
    const pressPreview = (file_path: string, name: string) => {
        setPreviewLink(file_path);
        setPreviewName(name);
        setIsWebModalVisible(true);
    }

    const downloadFromUrl = async (file_path: string) => {
        try {
            const url = API_BASE + "/uploads/" + file_path;
            const cacheDir = (FileSystem as any).cacheDirectory || '';
            const result = await FileSystem.downloadAsync(
            url,
            cacheDir + file_path
            )
            saveFile(result.uri)
        } catch (error) {
            console.log("Error downloading file: " + error);
        }
    }

    const saveFile = (url: string) => {
        Sharing.shareAsync(url)
    }
    return(
        <View style = {styles.container}>
            <TopNav title="Resource" showBack={true} onBack={() => navigation.goBack()} />
            <ScrollView style={styles.scrollView}>
                {/* Resource Card */}
                <ResourceCard resource_id={route.params.resource_id} org_id={route.params.org_id}/>
                {/* Upload Button */}
                <TouchableOpacity style={styles.uploadButton} onPress={() => { uploadPress() }}>
                    <MaterialIcons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.uploadButtonText}>Upload Files</Text>
                </TouchableOpacity>
                {/* Files List */}
                <View style={styles.filesSection}>
                    <Text style={styles.filesTitle}>Uploaded Files</Text>
                    {resourceMedia && resourceMedia.length > 0 ? (
                        <View>
                            {resourceMedia.map((item) => (
                                <View key={String(item.media_id)} style={styles.fileItem}>
                                    <View style={styles.fileNameContainer}>
                                        <MaterialIcons name="insert-drive-file" size={20} color="#0084D1" />
                                        <Text style={styles.fileName}>{item.name}</Text>
                                    </View>
                                    <View style={styles.fileActions}>
                                        <TouchableOpacity 
                                            onPress={() => pressDownload(item.file_path)}
                                            style={styles.actionButton}
                                        >
                                            <MaterialIcons name="download" size={22} color="#0084D1" />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => pressPreview(item.file_path, item.name)}
                                            style={styles.actionButton}
                                        >
                                            <MaterialIcons name="visibility" size={22} color="#0084D1" />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => pressDelete(item.media_id, item.file_path)}
                                            style={styles.actionButton}
                                        >
                                            <MaterialIcons name="delete" size={22} color="#e74c3c" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>No files uploaded yet</Text>
                    )}
                </View>
            </ScrollView>

            {/* Webview Modal */}
            <Modal visible={isWebModalVisible} animationType='slide' transparent={true}>
                <View style={styles.webContainer}>
                    <LinearGradient
                      colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.webBar, { paddingTop: insets.top, height: insets.top + 56 }]}
                    >
                        <View style={styles.webBarInner}>
                            <TouchableOpacity onPress={()=> setIsWebModalVisible(false)} style={styles.webCloseBtn}>
                                <MaterialIcons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.webPreviewTitle}>{previewName}</Text>
                        </View>
                    </LinearGradient>
                    <View style = {styles.webContent}>
                        <WebView source={{ uri: API_BASE + "/uploads/" + previewLink }} ></WebView>
                    </View>
                </View>
            </Modal>
                
            {/* Enter name of file modal */}
            <Modal visible={isModalVisible} animationType="fade" transparent={true}>
                <View style={styles.fileModalContainer}>
                    <View style={styles.fileModal}>
                        <LinearGradient
                          colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.fileModalHeader}
                        >
                            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.fileModalCloseBtn}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.fileModalTitle}>Name this File</Text>
                        </LinearGradient>
                        <ScrollView style={styles.fileModalContent}>
                            <View style={styles.fileInputGroup}>
                                <Text style={styles.fileInputLabel}>File Name</Text>
                                <TextInput 
                                    onChangeText={(value) => handleInputChange("name", value)}
                                    maxLength={50}
                                    placeholder="Enter file name"
                                    multiline={false}
                                    scrollEnabled={false}
                                    style={styles.fileInputBox}
                                />
                            </View>
                        </ScrollView>
                        <View style={styles.fileModalButtons}>
                            <TouchableOpacity style={[styles.fileButton, styles.fileCancelButton]} onPress={() => setIsModalVisible(false)}>
                                <Text style={styles.fileCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.fileButton, styles.fileUploadButton]} onPress={() => save()}>
                                <Text style={styles.fileUploadButtonText}>Upload</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    scrollView: {
        flex: 1,
    },
    uploadButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#0084D1",
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginVertical: 16,
        borderRadius: 8,
    },
    uploadButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    filesSection: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    filesTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 12,
    },
    fileItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "white",
        padding: 12,
        marginBottom: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    fileNameContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        color: "#333",
        flex: 1,
    },
    fileActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    actionButton: {
        padding: 6,
    },
    emptyText: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
        paddingVertical: 32,
    },
    webContainer: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    webBar: {
        alignItems: "flex-start",
        justifyContent: "flex-end",
        paddingBottom: 8,
    },
    webBarInner: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        height: 44,
        paddingHorizontal: 16,
    },
    webCloseBtn: {
        marginRight: 8,
        padding: 6,
    },
    webPreviewTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "600",
    },
    webContent: {
        flex: 1,
        backgroundColor: "white",
    },
    fileModalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    fileModal: {
        backgroundColor: "#f5f5f5",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        maxHeight: "80%",
    },
    fileModalHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 8,
        height: 56,
    },
    fileModalCloseBtn: {
        marginRight: 12,
        padding: 6,
    },
    fileModalTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "600",
    },
    fileModalContent: {
        backgroundColor: "#f5f5f5",
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    fileInputGroup: {
        gap: 8,
        marginBottom: 16,
    },
    fileInputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    fileInputBox: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#0084D1",
        backgroundColor: "white",
        fontSize: 14,
        color: "#333",
    },
    fileModalButtons: {
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 32,
    },
    fileButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    fileCancelButton: {
        backgroundColor: "#e0e0e0",
    },
    fileCancelButtonText: {
        color: "#333",
        fontSize: 14,
        fontWeight: "600",
    },
    fileUploadButton: {
        backgroundColor: "#0084D1",
    },
    fileUploadButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
});
export default ResourceProfile;
