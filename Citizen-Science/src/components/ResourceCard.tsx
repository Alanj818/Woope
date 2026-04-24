import React, { useState, useEffect } from "react";
import {
    View, StyleSheet, Text, Dimensions,
    FlatList, TouchableOpacity, TouchableWithoutFeedback
} from "react-native";
import { getResourceInfo } from "../api/resources";
import { Resource } from "../api/types";
import { MaterialIcons } from '@expo/vector-icons';
import UpdateResourceModal from "./UpdateResourceModal";
import DeleteResource from "./DeleteResources";

interface ResourceProps {
    org_id: number;
    resource_id: number;
    expanded?: boolean;
    hideMenu?: boolean;
}

const ResourcesCard: React.FC<ResourceProps> = ({ resource_id, org_id, expanded = false, hideMenu = false }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [data, setData] = useState<Resource[]>([]);

    const fetchInfo = async () => {
        try {
            const resource = await getResourceInfo(resource_id);
            setData(resource);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchInfo();
    }, []);

    return (
        <FlatList
            data={data}
            keyExtractor={(item) => String(item.resource_id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
                expanded ? (
                    // Detail view — used in ResourceProfile
                    <TouchableWithoutFeedback onPress={() => { if (menuVisible) setMenuVisible(false); }}>
                        <View style={styles.expandedContainer}>
                            <View style={styles.titleCard}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.expandedTitle}>{item.name}</Text>
                                    {!hideMenu && (
                                        <TouchableOpacity
                                            onPress={() => setMenuVisible(!menuVisible)}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <MaterialIcons name="more-vert" size={20} color="#b0bec5" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                {item.tagline ? (
                                    <Text style={styles.expandedTagline}>{item.tagline}</Text>
                                ) : null}

                                {menuVisible && (
                                    <View style={styles.dropdownMenu}>
                                        <TouchableOpacity
                                            style={styles.menuItem}
                                            onPress={() => { setMenuVisible(false); setEditVisible(true); }}
                                        >
                                            <MaterialIcons name="edit" size={17} color="#0084D1" />
                                            <Text style={styles.menuItemText}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.menuItem, styles.menuItemLast]}
                                            onPress={() => { setMenuVisible(false); setDeleteVisible(true); }}
                                        >
                                            <MaterialIcons name="delete" size={17} color="#e05c5c" />
                                            <Text style={[styles.menuItemText, styles.menuItemDestructive]}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {item.text_description ? (
                                <View style={styles.detailCard}>
                                    <Text style={styles.fieldLabel}>DESCRIPTION</Text>
                                    <Text style={styles.fieldValue}>{item.text_description}</Text>
                                </View>
                            ) : null}

                            {/* Pass current values so fields are pre-filled */}
                            <UpdateResourceModal
                                isVisible={editVisible}
                                resource_id={resource_id}
                                currentName={item.name}
                                currentTagline={item.tagline}
                                currentDescription={item.text_description}
                                onClose={() => { setEditVisible(false); fetchInfo(); }}
                            />
                            <DeleteResource
                                isVisible={deleteVisible}
                                resource_id={resource_id}
                                org_id={org_id}
                                onClose={() => setDeleteVisible(false)}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                ) : (
                    // Compact view — used in lists
                    <View style={styles.card}>
                        <View style={styles.info}>
                            <Text style={styles.title}>{item.name}</Text>
                            {item.tagline ? (
                                <Text style={styles.tagline}>{item.tagline}</Text>
                            ) : null}
                        </View>
                    </View>
                )
            )}
        />
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#f8fbfd',
        paddingHorizontal: 18,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#16202a',
        marginBottom: 3,
    },
    tagline: {
        fontSize: 13,
        color: '#6b7a8c',
    },
    expandedContainer: {
        gap: 12,
    },
    titleCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 18,
        shadowColor: '#8aa9bf',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 3,
        zIndex: 20,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    expandedTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
        marginRight: 10,
    },
    expandedTagline: {
        fontSize: 14,
        color: '#6b7a8c',
    },
    detailCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 18,
        shadowColor: '#8aa9bf',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 3,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0088ca',
        letterSpacing: 0.8,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    fieldValue: {
        fontSize: 15,
        color: '#1a2530',
        lineHeight: 22,
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
});

export default ResourcesCard;