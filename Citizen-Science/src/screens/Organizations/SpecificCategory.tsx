/*
    This screen displays all the organizations that have the category that is passed to it by 'route'
    Organizations can fall under multiple categories, this navigates to the specific profile of the organization that is selected
*/
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, SafeAreaView, FlatList, View, TouchableOpacity } from 'react-native';
import { getOrganizationsByCategoryId } from '../../api/organizations';
import { Organization } from '../../api/types';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import TopNav from '../../components/TopNav';

const STRINGS = {
    title: 'Organizations',
    empty: 'No organizations found',
};

export const SpecificCategory = ({ route }: { route: any }) => {
    const navigation = useNavigation<any>();
    const [data, setData] = useState<Organization[]>([]);

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            const organizationList = await getOrganizationsByCategoryId(route.params.category);
            setData(organizationList);
        } catch (error) {
            console.log('Failed to retrieve organizations', error);
        }
    };

    return (
        <>
            <TopNav title={STRINGS.title} showBack onBack={() => navigation.goBack()} />
            <SafeAreaView style={styles.container}>
                <FlatList
                    data={data}
                    keyExtractor={item => String(item.org_id)}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            activeOpacity={0.88}
                            style={styles.cardWrap}
                            onPress={() => navigation.navigate('OrganizationProfile', {
                                org_id: item.org_id,
                                name: item.name,
                                tagline: item.tagline,
                                text_description: item.text_description,
                            })}
                        >
                            <View style={styles.card}>
                                <LinearGradient
                                    colors={['rgba(0,132,209,1)', 'rgba(0,146,184,1)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.orgBadge}
                                >
                                    <Text style={styles.orgBadgeInitial}>
                                        {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                                    </Text>
                                </LinearGradient>
                                <View style={styles.info}>
                                    <Text style={styles.orgName} numberOfLines={1}>{item.name}</Text>
                                    {item.tagline ? (
                                        <Text style={styles.orgTagline} numberOfLines={1}>{item.tagline}</Text>
                                    ) : null}
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color="#b0bec5" />
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{STRINGS.empty}</Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7fa',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 36,
        gap: 10,
    },
    cardWrap: {
        borderRadius: 20,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        shadowColor: '#8aa9bf',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 3,
    },
    card: {
        backgroundColor: '#f8fbfd',
        borderWidth: 1,
        borderColor: '#e7f0f5',
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    orgBadge: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    orgBadgeInitial: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
    },
    info: {
        flex: 1,
    },
    orgName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#16202a',
        marginBottom: 2,
    },
    orgTagline: {
        fontSize: 13,
        color: '#6a7a8b',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
    },
});

export default SpecificCategory;