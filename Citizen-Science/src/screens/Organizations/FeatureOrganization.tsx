/*
    This screen will allow the user to create organization categories
    ?: convert into a modal component instead?
*/
import React, { useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView, Text, StyleSheet, View,
    TouchableOpacity, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Octicons, AntDesign } from '@expo/vector-icons';
import Popup from '../../components/Popup';
import { getFeaturedOrganizations, removeFeature } from '../../api/organizations';
import { Organization } from '../../api/types';
import FeatureModal from '../../components/FeatureModal';
import TopNav from '../../components/TopNav';

type NavigationParam = {
    Login: undefined;
    Signup: undefined;
    NavigationBar: undefined;
};

type NavigationProp = NativeStackNavigationProp<NavigationParam, 'Signup'>;

const STRINGS = {
    title: 'Feature Groups',
    currentlyFeatured: 'Currently Featured',
    removeError: 'Error unfeaturing group',
    emptyTitle: 'No groups featured yet',
    emptySubtitle: 'Add up to 5 groups to feature on the Resources screen.',
    addFeaturedGroup: 'Add Featured Group',
};

const TOTAL_FEATURED = 5;

export const FeatureOrganization = () => {
    const navigation = useNavigation<NavigationProp>();
    const [featured, setFeatured] = useState<Organization[]>([]);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);

    const showPopup = (messages: string[]) => {
        const formatted = messages.map(m => `\u2022 ${m}`).join('\n');
        setPopupMessage(formatted);
        setIsPopupVisible(true);
    };

    const fetchFeatured = useCallback(async () => {
        try {
            const response = await getFeaturedOrganizations();
            setFeatured(response || []);
        } catch (error) {
            console.log('Error retrieving featured groups', error);
        }
    }, []);

    useEffect(() => {
        fetchFeatured();
    }, [fetchFeatured, isModalVisible]);

    const remove = async (name: string) => {
        try {
            await removeFeature(name);
            setFeatured(prev => prev.filter(org => org.name !== name));
        } catch (error) {
            console.log('Error unfeaturing group', error);
            showPopup([STRINGS.removeError]);
        }
    };

    const isFull = featured.length >= TOTAL_FEATURED;

    const renderItem = ({ item }: { item: Organization }) => (
        <View style={styles.cardWrap}>
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

                <Text style={styles.orgName} numberOfLines={1}>{item.name}</Text>

                <TouchableOpacity
                    onPress={() => remove(item.name)}
                    style={styles.removeButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Octicons name="diff-removed" size={20} color="#e05c5c" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <>
            <TopNav title={STRINGS.title} />
            <SafeAreaView style={styles.container}>
                <FlatList
                    data={featured}
                    keyExtractor={item => String(item.org_id)}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionAccent} />
                                <Text style={styles.sectionTitle}>{STRINGS.currentlyFeatured}</Text>
                                <View style={styles.countBadge}>
                                    <Text style={styles.countText}>{featured.length}/{TOTAL_FEATURED}</Text>
                                </View>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>{STRINGS.emptyTitle}</Text>
                            <Text style={styles.emptySubtitle}>{STRINGS.emptySubtitle}</Text>
                        </View>
                    }
                    ListFooterComponent={
                        !isFull ? (
                            <TouchableOpacity
                                style={styles.addButtonWrap}
                                activeOpacity={0.8}
                                onPress={() => setIsModalVisible(true)}
                            >
                                <LinearGradient
                                    colors={['#0088ca', '#0092b8']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.addButton}
                                >
                                    <AntDesign name="plus" size={18} color="#fff" />
                                    <Text style={styles.addButtonText}>{STRINGS.addFeaturedGroup}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : null
                    }
                />

                <Popup
                    isVisible={isPopupVisible}
                    message={popupMessage}
                    onClose={() => setIsPopupVisible(false)}
                />
                <FeatureModal
                    isVisible={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
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
        paddingBottom: 36,
        flexGrow: 1,
    },
    listHeader: {
        paddingTop: 4,
        paddingBottom: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 12,
        gap: 8,
    },
    sectionAccent: {
        width: 4,
        height: 18,
        borderRadius: 2,
        backgroundColor: '#0088ca',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a2530',
        letterSpacing: 0.2,
        flex: 1,
    },
    countBadge: {
        backgroundColor: '#e8f4fb',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    countText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0088ca',
    },
    cardWrap: {
        marginHorizontal: 14,
        marginBottom: 10,
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
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    orgBadgeInitial: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
    },
    orgName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#16202a',
    },
    removeButton: {
        padding: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
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
    addButtonWrap: {
        marginHorizontal: 14,
        marginTop: 6,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#0088ca',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default FeatureOrganization;