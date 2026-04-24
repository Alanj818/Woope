/*

    !! This screen is the main page for the resources tab
    It also features a carousel of featured organizations which when clicked lead directly to their profiles

*/
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getResources } from '../../api/resources';
import { getFeaturedOrganizations } from '../../api/organizations';
import { Resource, Organization } from '../../api/types';
import FeaturedOrganizationCard from '../../components/FeaturedOrganizationCard';
import TopNav from '../../components/TopNav';
import { MaterialIcons } from '@expo/vector-icons';

const STRINGS = {
    viewAllOrganizations: 'View All Organizations',
    featuredGroups: 'Featured Groups',
    featuredSubheader: 'Highlighted groups in your community',
    resources: 'Resources',
    upcomingSubheader: 'Available in your community',
    emptyTitle: 'Nothing here yet',
    emptySubtitle: 'Resources will appear here once they are added.',
};

export const ResourceHome = () => {
    const navigation = useNavigation<any>();
    const [resources, setResources] = useState<Resource[]>([]);
    const [featuredOrgs, setFeaturedOrgs] = useState<Organization[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            fetchAll();
        }, [])
    );

    const fetchAll = async () => {
        await Promise.all([fetchResources(), fetchFeaturedOrganizations()]);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
    };

    const fetchResources = async () => {
        try {
            const resourceList = await getResources();
            setResources(resourceList);
        } catch (error) {
            console.log('Failed to retrieve resources', error);
        }
    };

    const fetchFeaturedOrganizations = async () => {
        try {
            const orgList = await getFeaturedOrganizations();
            setFeaturedOrgs(orgList);
        } catch (error) {
            console.log('Failed to retrieve featured organizations', error);
        }
    };

    return (
        <>
            <TopNav title={STRINGS.resources} />
            <SafeAreaView style={styles.container}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#0088ca"
                            colors={['#0088ca']}
                        />
                    }
                >
                    {/* White header card */}
                    <View style={styles.headerCard}>
                        <LinearGradient
                            colors={['#0088ca', '#0092b8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.viewAllButton}
                        >
                            <TouchableOpacity
                                onPress={() => navigation.navigate('OrganizationSearch')}
                                activeOpacity={0.7}
                                style={styles.viewAllButtonTouchable}
                            >
                                <Text style={styles.viewAllButtonText}>{STRINGS.viewAllOrganizations}</Text>
                            </TouchableOpacity>
                        </LinearGradient>

                        {featuredOrgs.length > 0 && (
                            <View style={styles.carouselSection}>
                                <View style={styles.sectionLabelRow}>
                                    <View style={styles.sectionAccent} />
                                    <View>
                                        <Text style={styles.sectionTitle}>{STRINGS.featuredGroups}</Text>
                                        <Text style={styles.sectionSubheader}>{STRINGS.featuredSubheader}</Text>
                                    </View>
                                </View>
                                <FlatList
                                    data={featuredOrgs}
                                    horizontal
                                    scrollEnabled
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={item => String(item.org_id)}
                                    contentContainerStyle={styles.carouselContent}
                                    renderItem={({ item }) => (
                                        <FeaturedOrganizationCard
                                            org_id={item.org_id}
                                            name={item.name}
                                            tagline={item.tagline}
                                            text_description={item.text_description}
                                            image_path={item.image_path}
                                        />
                                    )}
                                />
                            </View>
                        )}
                    </View>

                    {/* Resources section */}
                    <View style={styles.upcomingContainer}>
                        <View style={styles.sectionLabelRow}>
                            <View style={styles.sectionAccent} />
                            <View>
                                <Text style={styles.sectionTitle}>{STRINGS.resources}</Text>
                                <Text style={styles.sectionSubheader}>{STRINGS.upcomingSubheader}</Text>
                            </View>
                        </View>
                    </View>

                    {resources.length > 0 ? (
                        <View style={styles.resourcesList}>
                            {resources.map((resource) => (
                                <TouchableOpacity
                                    key={resource.resource_id}
                                    activeOpacity={0.88}
                                    style={styles.cardWrap}
                                    onPress={() => navigation.navigate('ResourceProfile', {
                                        resource_id: resource.resource_id,
                                        org_id: resource.org_id,
                                    })}
                                >
                                    <View style={styles.cardAccent} />
                                    <View style={styles.cardContent}>
                                        <View style={styles.cardInner}>
                                            <View style={styles.cardText}>
                                                <Text style={styles.resourceName}>{resource.name}</Text>
                                                {resource.tagline ? (
                                                    <Text style={styles.resourceTagline}>{resource.tagline}</Text>
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
                            <Text style={styles.emptyTitle}>{STRINGS.emptyTitle}</Text>
                            <Text style={styles.emptySubtitle}>{STRINGS.emptySubtitle}</Text>
                        </View>
                    )}
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
        flexGrow: 1,
    },
    headerCard: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e7edf3',
        paddingBottom: 16,
    },
    viewAllButton: {
        borderRadius: 14,
        marginHorizontal: 14,
        marginBottom: 6,
        marginTop: 8,
        shadowColor: '#0088ca',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
    },
    viewAllButtonTouchable: {
        paddingVertical: 16,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewAllButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    carouselSection: {
        paddingBottom: 4,
    },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 10,
        gap: 10,
    },
    sectionAccent: {
        width: 3,
        height: 36,
        borderRadius: 2,
        backgroundColor: '#0088ca',
        marginTop: 2,
        flexShrink: 0,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 2,
    },
    sectionSubheader: {
        fontSize: 13,
        color: '#6b7a8c',
    },
    carouselContent: {
        paddingHorizontal: 16,
        paddingBottom: 4,
        gap: 12,
    },
    upcomingContainer: {
        paddingTop: 14,
        paddingBottom: 10,
        backgroundColor: '#f4f7fa',
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
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#444',
        marginBottom: 6,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default ResourceHome;