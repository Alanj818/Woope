import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    org_id: number;
    name: string;
    tagline?: string;
    text_description?: string;
    image_path?: string;
}

const deviceWidth = Dimensions.get('window').width;

const FeaturedOrganizationCard = ({ org_id, name, tagline, text_description }: Props) => {
    const navigation = useNavigation<any>();

    return (
        <TouchableOpacity
            activeOpacity={0.88}
            style={styles.cardWrap}
            onPress={() => navigation.navigate('OrganizationProfile', { org_id })}
        >
            {/* Blue accent top strip */}
            <LinearGradient
                colors={['#0088ca', '#0092b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.topStrip}
            />
            <View style={styles.card}>
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    {tagline ? (
                        <Text style={styles.tagline} numberOfLines={1}>{tagline}</Text>
                    ) : null}
                    {text_description ? (
                        <Text style={styles.description} numberOfLines={2}>{text_description}</Text>
                    ) : null}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardWrap: {
        width: deviceWidth - 32,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        shadowColor: '#0088ca',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    topStrip: {
        height: 4,
        width: '100%',
    },
    card: {
        backgroundColor: '#f8fbfd',
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#e7f0f5',
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#16202a',
        marginBottom: 4,
    },
    tagline: {
        fontSize: 13,
        fontWeight: '500',
        color: '#0088ca',
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#6a7a8b',
        lineHeight: 18,
    },
});

export default FeaturedOrganizationCard;