/*
    This component shows the organization name, category, banner image, tagline, and full description in a contained card
    when given those parameters
    There is also funcitonality to follow the organization and navigate to see all their posts and events
    
*/
//TODO: FIX follow button jitter when toggled
import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { Organization } from "../api/types";
import { getOrganizationById, followOrganization, unfollowOrganization, following } from "../api/organizations";
import UpdateOrganizationModal from "../components/UpdateOrganizationModal";
import { useNavigation } from "@react-navigation/native";
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface OrganizationProps {
    org_id: number;
    user_id: number;
}

interface FollowStatus {
    case: number;
}

const OrganizationCard: React.FC<OrganizationProps> = ({ org_id, user_id }) => {
    const navigation = useNavigation<any>();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [data, setData] = useState<Organization[]>(
        [{ org_id: 0, name: "", text_description: "", tagline: "", image_path: "" }]
    );
    const [isFollowed, setIsFollowed] = useState<number>();

    useEffect(() => {
        fetchInfo().then(() => checkFollowed());
    }, [isModalVisible, isFollowed]);

    // getting the information of the organization
    const fetchInfo = async () => {
        try {
            const organizationList = await getOrganizationById(org_id);
            setData(organizationList);
        } catch (error) {
            console.log(error);
        }
    };

    const checkFollowed = async () => {
        try {
            const response = await following(user_id, org_id);
            setIsFollowed(response.case);
        } catch (error) {
            console.log("Error Checking follow status" + error);
        }
    };

    const pressFollow = () => {
        follow();
        setIsFollowed(1);
    };

    const pressUnfollow = () => {
        unfollow();
        setIsFollowed(0);
    };

    const follow = async () => {
        try {
            await followOrganization(user_id, org_id);
        } catch (error) {
            console.log("Error following organization: " + error);
        }
    };

    const unfollow = async () => {
        try {
            await unfollowOrganization(user_id, org_id);
        } catch (error) {
            console.log("Error unfollowing organization: " + error);
        }
    };

    const org = data[0];

    return (
        <View style={styles.container}>

            {/* Title card */}
            <View style={styles.titleCard}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{org.name}</Text>
                    <TouchableOpacity
                        onPress={() => setIsModalVisible(true)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <AntDesign name="edit" color="#0084D1" size={18} />
                    </TouchableOpacity>
                </View>
                {org.tagline ? (
                    <Text style={styles.tagline}>{org.tagline}</Text>
                ) : null}

                {/* Follow/Unfollow inline under tagline */}
                {isFollowed === 0 && (
                    <TouchableOpacity style={styles.followButton} onPress={pressFollow}>
                        <Text style={styles.followButtonText}>Follow</Text>
                    </TouchableOpacity>
                )}
                {isFollowed === 1 && (
                    <TouchableOpacity style={styles.unfollowButton} onPress={pressUnfollow}>
                        <Text style={styles.unfollowButtonText}>Unfollow</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Banner image */}
            {org.image_path ? (
                <View style={styles.detailCard}>
                    <Image
                        style={styles.bannerImage}
                        source={{ uri: process.env.EXPO_PUBLIC_API_URL + '/uploads/' + org.image_path }}
                    />
                </View>
            ) : null}

            {/* Description field */}
            {org.text_description ? (
                <View style={styles.detailCard}>
                    <Text style={styles.fieldLabel}>DESCRIPTION</Text>
                    <Text style={styles.fieldValue}>{org.text_description}</Text>
                </View>
            ) : null}

            {/* Action buttons */}
            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={styles.actionButtonWrap}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate("OrganizationProfile", { org_id, user_id })}
                >
                    <LinearGradient
                        colors={['#0088ca', '#0092b8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionButton}
                    >
                        <MaterialIcons name="article" size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>View Posts</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButtonWrapSecondary}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate("EventHome", { org_id })}
                >
                    <View style={styles.actionButtonSecondary}>
                        <MaterialIcons name="event" size={18} color="#0084D1" />
                        <Text style={styles.actionButtonSecondaryText}>View Events</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <UpdateOrganizationModal
                isVisible={isModalVisible}
                onClose={() => { setIsModalVisible(false); fetchInfo(); }}
                name={org.name}
                org_id={org_id}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 12,
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
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
        marginRight: 10,
    },
    tagline: {
        fontSize: 14,
        color: '#6b7a8c',
        marginBottom: 10,
    },
    followButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#0088ca',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
        marginTop: 4,
    },
    followButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    unfollowButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#e7edf3',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
        marginTop: 4,
    },
    unfollowButtonText: {
        color: '#555',
        fontSize: 12,
        fontWeight: '600',
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
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButtonWrap: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#0088ca',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        gap: 6,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    actionButtonWrapSecondary: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#8aa9bf',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    actionButtonSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        gap: 6,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e7f0f5',
    },
    actionButtonSecondaryText: {
        color: '#0084D1',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default OrganizationCard;