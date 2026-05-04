/*
    Modal component to create resource
*/
import React from "react";
import {
    Modal, View, StyleSheet, Text, TouchableOpacity
} from "react-native";
import { deleteResource } from "../api/resources";
import { useNavigation } from "@react-navigation/native";

interface ModalProps {
    resource_id: number;
    org_id: number;
    isVisible: boolean;
    onClose: () => void;
}

const STRINGS = {
    deleteTitle: 'Delete Resource',
    deleteMessage: 'Are you sure you want to delete this resource? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
};

const DeleteResource: React.FC<ModalProps> = ({ resource_id, org_id, isVisible, onClose }) => {
    const navigation = useNavigation<any>();

    const handleDelete = async () => {
        try {
            await deleteResource(resource_id);
            onClose();
            navigation.navigate("OrganizationProfile", { org_id });
        } catch (error) {
            console.log('Delete Failed', error);
            onClose();
        }
    };

    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.deleteTitle}>{STRINGS.deleteTitle}</Text>
                    <Text style={styles.deleteMessage}>{STRINGS.deleteMessage}</Text>
                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>{STRINGS.cancel}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.deleteButton]}
                            onPress={handleDelete}
                        >
                            <Text style={styles.deleteButtonText}>{STRINGS.delete}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    modal: {
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
    buttons: {
        flexDirection: 'row',
        gap: 12,
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
    deleteButton: {
        backgroundColor: '#e05c5c',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default DeleteResource;