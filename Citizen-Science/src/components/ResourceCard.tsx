import React, { useState, useEffect } from "react";
import {
    View, StyleSheet, Text, Image, Dimensions,
    FlatList, TouchableOpacity
} from "react-native";
import { getResourceInfo } from "../api/resources";
import { Resource } from "../api/types";
import { AntDesign } from '@expo/vector-icons';
import UpdateResourceModal from "./UpdateResourceModal";
import DeleteResource from "./DeleteResources";

interface ResourceProps {
    org_id: number;
    resource_id: number;
    expanded?: boolean;
    hideMenu?: boolean;
}

const ResourcesCard: React.FC<ResourceProps> = ({ resource_id, org_id, expanded = false, hideMenu = false }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteVisible, setIsDeleteVisible] = useState(false);
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
                    <View style={styles.expandedContainer}>
                        <View style={styles.titleCard}>
                            <View style={styles.titleRow}>
                                <Text style={styles.expandedTitle}>{item.name}</Text>
                                <TouchableOpacity
                                    onPress={() => setIsModalVisible(true)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <AntDesign name="edit" color="#0084D1" size={18} />
                                </TouchableOpacity>
                            </View>
                            {item.tagline ? (
                                <Text style={styles.expandedTagline}>{item.tagline}</Text>
                            ) : null}
                        </View>

                        {item.image_path ? (
                            <View style={styles.detailCard}>
                                <Image
                                    style={styles.bannerImage}
                                    source={{ uri: process.env.EXPO_PUBLIC_API_URL + '/uploads/' + item.image_path }}
                                />
                            </View>
                        ) : null}

                        {item.text_description ? (
                            <View style={styles.detailCard}>
                                <Text style={styles.fieldLabel}>DESCRIPTION</Text>
                                <Text style={styles.fieldValue}>{item.text_description}</Text>
                            </View>
                        ) : null}

                        <UpdateResourceModal
                            isVisible={isModalVisible}
                            resource_id={resource_id}
                            onClose={() => { setIsModalVisible(false); fetchInfo(); }}
                        />
                        <DeleteResource
                            isVisible={isDeleteVisible}
                            resource_id={resource_id}
                            org_id={org_id}
                            onClose={() => setIsDeleteVisible(false)}
                        />
                    </View>
                ) : (
                    // Compact view — used in lists
                    <View style={styles.card}>
                        <View style={styles.info}>
                            <Text style={styles.title}>{item.name}</Text>
                            {item.tagline ? (
                                <Text style={styles.tagline}>{item.tagline}</Text>
                            ) : null}
                        </View>

                        {!hideMenu && (
                            <TouchableOpacity
                                onPress={() => setIsModalVisible(true)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <AntDesign name="edit" color="#0084D1" size={18} />
                            </TouchableOpacity>
                        )}

                        <UpdateResourceModal
                            isVisible={isModalVisible}
                            resource_id={resource_id}
                            onClose={() => { setIsModalVisible(false); fetchInfo(); }}
                        />
                        <DeleteResource
                            isVisible={isDeleteVisible}
                            resource_id={resource_id}
                            org_id={org_id}
                            onClose={() => setIsDeleteVisible(false)}
                        />
                    </View>
                )
            )}
        />
    );
};

const deviceWidth = Math.round(Dimensions.get('window').width);

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
        position: 'relative',
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
        fontSize: 12,
        fontWeight: '700',
        color: '#0088ca',
        letterSpacing: 1,
        marginBottom: 8,
    },
    fieldValue: {
        fontSize: 16,
        color: '#1a2530',
        lineHeight: 24,
    },
    bannerImage: {
        height: 180,
        width: '100%',
        borderRadius: 12,
    },
});

export default ResourcesCard;