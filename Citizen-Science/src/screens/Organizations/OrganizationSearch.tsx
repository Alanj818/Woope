/*
    This screen will display ALL organizations in a directory 
*/
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { getAllOrganizations } from '../../api/organizations';
import { Organization } from '../../api/types';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import TopNav from '../../components/TopNav';

const STRINGS = {
    title: 'All Organizations',
    subheader: 'Browse and connect with your community',
    empty: 'No organizations exist',
};

const OrganizationSearch = () => {
    const navigation = useNavigation<any>();
    const [data, setData] = useState<Organization[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            const organizationList = await getAllOrganizations();
            setData(organizationList);
        } catch (error) {
            console.log('Failed to retrieve organizations', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrganizations();
        setRefreshing(false);
    }, []);

    return (
        <View style={styles.container}>
            <TopNav title={STRINGS.title} showBack={true} onBack={() => navigation.goBack()} />
            <FlatList
                data={data}
                keyExtractor={item => String(item.org_id)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#0088ca"
                        colors={['#0088ca']}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <View style={styles.sectionLabelRow}>
                            <View style={styles.sectionAccent} />
                            <View>
                                <Text style={styles.sectionTitle}>{STRINGS.title}</Text>
                                <Text style={styles.sectionSubheader}>{STRINGS.subheader}</Text>
                            </View>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.88}
                        style={styles.cardWrap}
                        onPress={() => navigation.navigate('OrganizationProfile', {
                            org_id: item.org_id,
                            name: item.name,
                        })}
                    >
                        <View style={styles.cardAccent} />
                        <View style={styles.cardContent}>
                            <View style={styles.cardInner}>
                                <View style={styles.cardText}>
                                    <Text style={styles.orgName}>{item.name}</Text>
                                    {item.tagline ? (
                                        <Text style={styles.orgTagline}>{item.tagline}</Text>
                                    ) : null}
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color="#b0bec5" />
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>{STRINGS.empty}</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7fa',
    },
    listContent: {
        paddingHorizontal: 10,
        paddingBottom: 36,
        gap: 10,
    },
    listHeader: {
        paddingTop: 16,
        paddingBottom: 12,
        paddingHorizontal: 6,
    },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
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
    orgName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#16202a',
        marginBottom: 3,
    },
    orgTagline: {
        fontSize: 13,
        color: '#6b7a8c',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 15,
        color: '#999',
    },
});

export default OrganizationSearch;