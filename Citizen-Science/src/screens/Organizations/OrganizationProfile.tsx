/*
    This screen shows the profile of the organization selected
*/
import React, { useState, useContext } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import OrganizationCard from '../../components/OrganizationCard';
import TopNav from '../../components/TopNav';
import CreateResource from '../../components/CreateResource';
import { Resource } from '../../api/types';
import { MaterialIcons } from '@expo/vector-icons';
import { Octicons } from '@expo/vector-icons';
import { getResourceById } from '../../api/resources';
import { AuthContext } from '../../util/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { AccessToken } from '../../util/token';
import { LinearGradient } from 'expo-linear-gradient';

const STRINGS = {
    title: 'Organization',
    resources: 'Resources',
    noResources: 'No resources added yet',
};

export const OrganizationProfile = ({ route }: { route: any }) => {
    const { userToken } = useContext(AuthContext);
    const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;
    const userId = decodedToken ? decodedToken.user_id : NaN;
    const navigation = useNavigation<any>();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [resourceData, setResourceData] = useState<Resource[]>([]);

    useFocusEffect(
        React.useCallback(() => {
            fetchResources();
        }, [isModalVisible])
    );

    const fetchResources = async () => {
        try {
            const resourceList = await getResourceById(route.params.org_id);
            setResourceData(resourceList);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>
            <TopNav title={STRINGS.title} showBack onBack={() => navigation.goBack()} />
            <SafeAreaView style={styles.container}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <OrganizationCard org_id={route.params.org_id} user_id={userId} />

                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={styles.sectionAccent} />
                            <Text style={styles.sectionTitle}>{STRINGS.resources}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setIsModalVisible(true)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Octicons name="diff-added" size={24} color="#0084D1" />
                        </TouchableOpacity>
                    </View>

                    {resourceData.length > 0 ? (
                        <View style={styles.resourcesList}>
                            {resourceData.map((item) => (
                                <TouchableOpacity
                                    key={String(item.resource_id)}
                                    activeOpacity={0.88}
                                    style={styles.cardWrap}
                                    onPress={() => navigation.navigate('ResourceProfile', {
                                        resource_id: item.resource_id,
                                        org_id: item.org_id,
                                    })}
                                >
                                    <View style={styles.cardAccent} />
                                    <View style={styles.cardContent}>
                                        <View style={styles.cardInner}>
                                            <View style={styles.cardText}>
                                                <Text style={styles.resourceName} numberOfLines={1}>{item.name}</Text>
                                                {item.tagline ? (
                                                    <Text style={styles.resourceTagline} numberOfLines={1}>{item.tagline}</Text>
                                                ) : null}
                                            </View>
                                            <MaterialIcons name="chevron-right" size={20} color="#b0bec5" />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{STRINGS.noResources}</Text>
                        </View>
                    )}

                    <CreateResource
                        org_id={route.params.org_id}
                        isVisible={isModalVisible}
                        onClose={() => setIsModalVisible(false)}
                    />
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
    scrollContent: {
        paddingBottom: 36,
        gap: 12,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginTop: 4,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionAccent: {
        width: 3,
        height: 22,
        borderRadius: 2,
        backgroundColor: '#0088ca',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a2530',
        letterSpacing: 0.2,
    },
    resourcesList: {
        marginHorizontal: 16,
        gap: 10,
    },
    cardWrap: {
        borderRadius: 16,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        flexDirection: 'row',
        shadowColor: '#8aa9bf',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 3,
    },
    cardAccent: {
        width: 4,
        backgroundColor: '#0088ca',
    },
    cardContent: {
        flex: 1,
        backgroundColor: '#f8fbfd',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderColor: '#e7f0f5',
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    cardText: {
        flex: 1,
    },
    resourceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#16202a',
        marginBottom: 3,
    },
    resourceTagline: {
        fontSize: 13,
        color: '#6b7a8c',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
    },
});

export default OrganizationProfile;