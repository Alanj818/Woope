/*
    Modal component to edit the resource info from the resource card
    Takes the resource name, whether its visible, and a function when it closes
*/
import React, { useState, useEffect } from "react";
import {
    Modal, View, TextInput, StyleSheet, SafeAreaView,
    Text, TouchableOpacity, ScrollView
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateResource } from "../api/resources";

interface ModalProps {
    resource_id: number;
    isVisible: boolean;
    onClose: () => void;
    currentName?: string;
    currentTagline?: string;
    currentDescription?: string;
}

const STRINGS = {
    title: 'Edit Resource',
    name: 'Resource Name',
    tagline: 'Tagline',
    description: 'Description',
    cancel: 'Cancel',
    save: 'Save',
};

const UpdateResourceModal: React.FC<ModalProps> = ({
    resource_id,
    isVisible,
    onClose,
    currentName = '',
    currentTagline = '',
    currentDescription = '',
}) => {
    const insets = useSafeAreaInsets();
    const [editName, setEditName] = useState(currentName);
    const [editTagline, setEditTagline] = useState(currentTagline);
    const [editDescription, setEditDescription] = useState(currentDescription);

    // Keep fields in sync if parent passes updated values
    useEffect(() => {
        setEditName(currentName);
        setEditTagline(currentTagline);
        setEditDescription(currentDescription);
    }, [currentName, currentTagline, currentDescription, isVisible]);

    // updates resource info in database
    const handleSave = async () => {
        try {
            await updateResource(resource_id, editName, editTagline, editDescription);
            onClose();
        } catch (error) {
            console.log('Resource Info Update Failed', error);
        }
    };

    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <LinearGradient
                    colors={['rgba(0,132,209,1)', 'rgba(0,146,184,1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.header, { paddingTop: insets.top, height: insets.top + 56 }]}
                >
                    <View style={styles.headerInner}>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.headingWrapper}>
                                <Text style={styles.titleText}>{STRINGS.title}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <SafeAreaView style={styles.contentSafeArea}>
                    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{STRINGS.name}</Text>
                            <TextInput
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Resource name"
                                maxLength={100}
                                style={styles.textbox}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{STRINGS.tagline}</Text>
                            <TextInput
                                value={editTagline}
                                onChangeText={setEditTagline}
                                placeholder="Enter a tagline"
                                maxLength={50}
                                style={styles.textbox}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{STRINGS.description}</Text>
                            <TextInput
                                value={editDescription}
                                onChangeText={setEditDescription}
                                placeholder="Enter a description"
                                maxLength={500}
                                multiline
                                style={[styles.textbox, { minHeight: 100 }]}
                            />
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
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
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentSafeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        paddingBottom: 8,
    },
    headerInner: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        paddingHorizontal: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeBtn: {
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
    scroll: {
        flex: 1,
    },
    scrollContent: {
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
    buttonContainer: {
        gap: 12,
        flexDirection: 'row',
        marginTop: 8,
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

export default UpdateResourceModal;