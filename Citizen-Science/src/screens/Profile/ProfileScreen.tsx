import React, { useContext, useEffect, useState } from "react";
import { Text, Image, View, StyleSheet, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { responsiveFontSize, responsiveHeight, responsiveWidth } from "react-native-responsive-dimensions";
import { getProfile } from "../../api/community";
import { jwtDecode } from "jwt-decode";
import { AccessToken } from "../../util/token";
import { AuthContext } from "../../util/AuthContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import TopNav from "../../components/TopNav";
import { logoutUser } from "../../api/auth";
import { deleteToken } from "../../util/token";
import Popup from "../../components/Popup";
import Icon from "react-native-vector-icons/MaterialIcons";
import { getPostByUserId } from "../../api/posts";
import { getUserEvents } from "../../api/event";

const ProfileScreen = ({ navigation, route }: any) => {
    const { userToken, setUserToken } = useContext(AuthContext);
    const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;

    const routeUserId =
        route && route.params && route.params.userID !== undefined
            ? route.params.userID
            : null;

    const userID =
        typeof routeUserId === "number" && !isNaN(routeUserId)
            ? routeUserId
            : decodedToken
            ? decodedToken.user_id
            : NaN;

    const isOwnProfile = !routeUserId || routeUserId === decodedToken?.user_id;

    const [userPfp, setUserPfp] = useState<string | null>(null);
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [location, setLocation] = useState<string>("");
    const [followerCount, setFollowerCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);
    const [postsCount, setPostsCount] = useState<number>(0);
    const [eventsCount, setEventsCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const fetchProfile = async () => {
        if (!userID || isNaN(userID)) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const profilePromise = getProfile(userID);
            const postsPromise = getPostByUserId(userID, setUserToken);

            // very wide range so you get all user-created events
            const startDate = new Date("2000-01-01T00:00:00.000Z");
            const endDate = new Date("2100-12-31T23:59:59.999Z");
            const eventsPromise = getUserEvents(startDate, endDate, userID);

            const [profileData, postsData, eventsData] = await Promise.all([
                profilePromise,
                postsPromise,
                eventsPromise,
            ]);

            if (profileData?.user) {
                setFirstName(profileData.user.first_name || "");
                setLastName(profileData.user.last_name || "");
                setEmail(profileData.user.email || "");
                setLocation(profileData.user.location || profileData.user.city || "");

                if (profileData.user.image_url && process.env.EXPO_PUBLIC_API_URL) {
                    setUserPfp(`${process.env.EXPO_PUBLIC_API_URL}${profileData.user.image_url}`);
                } else {
                    setUserPfp(null);
                }
            }

            setFollowerCount(profileData?.followerCount?.follower_of_count || 0);
            setFollowingCount(profileData?.followingCount?.following_of_count || 0);

            if (Array.isArray(postsData)) {
                setPostsCount(postsData.length);
            } else if (postsData?.posts && Array.isArray(postsData.posts)) {
                setPostsCount(postsData.posts.length);
            } else {
                setPostsCount(0);
            }

            if (Array.isArray(eventsData)) {
                setEventsCount(eventsData.length);
            } else if (eventsData?.events && Array.isArray(eventsData.events)) {
                setEventsCount(eventsData.events.length);
            } else {
                setEventsCount(0);
            }
        } catch (err) {
            console.error("Failed to load profile", err);
            setPostsCount(0);
            setEventsCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [userID]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProfile();
        setRefreshing(false);
    };

    const doLogout = async () => {
        const userId = decodedToken ? decodedToken.user_id : null;
        if (!userId) return;

        try {
            await logoutUser(userId);
            await deleteToken("accessToken");
            setUserToken(null);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    // Show back button whenever we can go back — covers search navigation and any other entry point
    const canGoBack = navigation.canGoBack();

    return (
        <View style={styles.container}>
            <TopNav
                title="Profile"
                showBack={canGoBack}
                onBack={() => navigation.goBack()}
            />

            <FlatList
                data={[]}
                keyExtractor={() => "empty"}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 0 }}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListHeaderComponent={() => (
                    <>
                        <View style={{ height: responsiveHeight(2) }} />

                        <View style={[styles.profileCardWrapper, { marginTop: responsiveHeight(0) }]}>
                            <LinearGradient
                                colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
                                style={styles.profileCard}
                            >
                                <View style={styles.cardContent}>
                                    <View style={styles.avatarCircle}>
                                        <Image
                                            source={
                                                userPfp
                                                    ? { uri: userPfp }
                                                    : { uri: "https://upload.wikimedia.org/wikipedia/commons/0/03/Twitter_default_profile_400x400.png" }
                                            }
                                            style={{
                                                width: responsiveHeight(7.6),
                                                height: responsiveHeight(7.6),
                                                borderRadius: responsiveHeight(3.8),
                                            }}
                                        />
                                    </View>

                                    <View style={styles.cardText}>
                                        <Text style={styles.name}>{firstName + " " + lastName}</Text>
                                        {email ? <Text style={styles.email}>{email}</Text> : null}
                                        {location ? <Text style={styles.location}>{location}</Text> : null}
                                    </View>

                                    {isOwnProfile && (
                                        <TouchableOpacity
                                            style={styles.settingsBtn}
                                            onPress={() => navigation.navigate("ProfileEditScreen")}
                                        >
                                            <MaterialIcons name="settings" size={18} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={styles.statsRow}>
                                    <TouchableOpacity
                                        style={styles.statBox}
                                        disabled={!userID || isNaN(userID)}
                                        onPress={() => navigation.navigate("ProfilePostsScreen", { userID })}
                                    >
                                        <Text style={styles.statNum}>{postsCount}</Text>
                                        <Text style={styles.statLabel}>Posts</Text>
                                    </TouchableOpacity>

                                    <View style={styles.statBox}>
                                        <Text style={styles.statNum}>{eventsCount}</Text>
                                        <Text style={styles.statLabel}>Events</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.statBox}
                                        disabled={!isOwnProfile}
                                        onPress={() => navigation.navigate("ProfileFollowingScreen", { userID })}
                                    >
                                        <Text style={styles.statNum}>{followingCount}</Text>
                                        <Text style={styles.statLabel}>Followed</Text>
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </View>

                        {isOwnProfile && (
                            <>
                                <Text style={styles.sectionTitle}>Support</Text>

                                <TouchableOpacity
                                    style={styles.supportItem}
                                    onPress={() => navigation.navigate("ReportScreen")}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Icon name="description" size={20} color="#111827" style={{ marginRight: 12 }} />
                                        <Text style={styles.supportText}>Create a Report</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.supportItem}
                                    onPress={() => setConfirmVisible(true)}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                                        <Icon name="logout" size={20} color="#e11d48" style={{ marginRight: 10 }} />
                                        <Text style={[styles.supportText, { color: "#e11d48", fontWeight: "600" }]}>
                                            Log Out
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}
                    </>
                )}
                renderItem={() => null}
            />

            <Popup
                isVisible={confirmVisible}
                message={"Are you sure you want to log out?"}
                onClose={() => setConfirmVisible(false)}
                buttons={[
                    { label: "Cancel", onPress: () => setConfirmVisible(false), backgroundColor: "#777" },
                    { label: "Yes", onPress: doLogout, backgroundColor: "#d9534f" },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    modalView: {
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 35,
        paddingTop: 120,
        width: "100%",
        height: "100%",
    },
    closeButton: {
        position: "absolute",
        top: 60,
        right: 20,
        backgroundColor: "red",
        padding: 10,
        borderRadius: 10,
    },
    closeButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
    },
    commentButton: {
        marginTop: 2,
        paddingVertical: 2,
        paddingHorizontal: 4,
        borderRadius: 5,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "flex-end",
        width: "100%",
    },
    headerTextContainer: {
        marginLeft: 6,
        justifyContent: "center",
    },
    userName: {
        fontSize: 16,
        marginBottom: 4,
        fontWeight: "600",
    },
    timestamp: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    dropdownIcon: {
        padding: 10,
        fontSize: 20,
        color: "#007AFF",
        position: "absolute",
        top: 10,
        right: 20,
        zIndex: 1,
    },
    dropdownMenu: {
        position: "absolute",
        top: 40,
        right: 10,
        backgroundColor: "#E7F6FF",
        borderRadius: 5,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 2,
    },
    dropdownItem: {
        padding: 8,
        fontSize: 14,
        color: "#007AFF",
        fontWeight: "500",
    },
    dropdownItems: {
        padding: 8,
        fontSize: 14,
        color: "#ff0000",
        fontWeight: "500",
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginBottom: 0,
        marginRight: 6,
    },
    post: {
        backgroundColor: "#fff",
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignSelf: "stretch",
        width: "100%",
        marginBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    postText: {
        marginBottom: 4,
        color: "#1f2937",
        fontSize: 16,
        lineHeight: 24,
        marginLeft: 56,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    fullWidthImage: {
        width: Dimensions.get("window").width,
        height: 400,
        aspectRatio: 1,
        resizeMode: "contain",
        alignItems: "center",
        justifyContent: "center",
    },
    posts: {
        justifyContent: "space-evenly",
        height: responsiveWidth(33),
        width: responsiveWidth(33),
    },
    container: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "flex-start",
        backgroundColor: "white",
        flexDirection: "column",
    },
    profileUser: {
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "transparent",
        height: responsiveHeight(11),
        width: responsiveWidth(100),
        paddingLeft: responsiveWidth(2),
        flexDirection: "row",
    },
    headerBar: {
        height: responsiveHeight(6),
        width: responsiveWidth(100),
        backgroundColor: "transparent",
    },
    attributes: {
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "transparent",
        flexDirection: "row",
    },
    textUserInfo: {
        fontSize: responsiveFontSize(1.8),
        fontWeight: "bold",
        color: "black",
        backgroundColor: "transparent",
        paddingHorizontal: responsiveWidth(2.2),
    },
    textAttributes: {
        justifyContent: "center",
        alignItems: "center",
        width: responsiveWidth(27),
        height: responsiveHeight(8),
        paddingHorizontal: responsiveWidth(0.5),
        backgroundColor: "transparent",
        borderRadius: responsiveHeight(1),
    },
    iconStyle: {
        justifyContent: "center",
        alignItems: "center",
        width: responsiveWidth(47),
        height: responsiveHeight(4.5),
        paddingHorizontal: responsiveWidth(0.5),
        marginEnd: responsiveWidth(2),
        backgroundColor: "lightblue",
        borderRadius: responsiveHeight(1),
    },
    line: {
        height: responsiveHeight(0.2),
        width: responsiveWidth(90),
        backgroundColor: "black",
        marginBottom: responsiveHeight(1),
    },
    topHeader: {
        height: responsiveHeight(12),
        width: responsiveWidth(100),
        justifyContent: "center",
        paddingHorizontal: responsiveWidth(4),
        flexDirection: "row",
        alignItems: "center",
    },
    headerTitle: {
        flex: 1,
        color: "#fff",
        fontSize: responsiveFontSize(2.4),
        fontWeight: "700",
    },
    searchCircle: {
        width: responsiveHeight(5),
        height: responsiveHeight(5),
        borderRadius: responsiveHeight(2.5),
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
    },
    profileCardWrapper: {
        paddingHorizontal: responsiveWidth(4),
        marginTop: responsiveHeight(1),
    },
    profileCard: {
        backgroundColor: "#0ea5e9",
        borderRadius: responsiveHeight(3),
        paddingVertical: responsiveHeight(1.4),
        paddingHorizontal: responsiveWidth(4),
        width: responsiveWidth(92),
        alignSelf: "center",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingRight: responsiveWidth(1.2),
    },
    avatarCircle: {
        width: responsiveHeight(9.2),
        height: responsiveHeight(9.2),
        borderRadius: responsiveHeight(4.6),
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.38)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: responsiveWidth(3),
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    avatarInitials: {
        color: "#fff",
        fontWeight: "800",
        fontSize: responsiveFontSize(2.8),
    },
    cardText: {
        marginTop: -responsiveHeight(0.8),
        flex: 1,
    },
    name: {
        color: "#fff",
        fontSize: responsiveFontSize(2),
        fontWeight: "700",
    },
    email: {
        color: "rgba(255,255,255,0.95)",
        fontSize: responsiveFontSize(1.4),
        marginTop: responsiveHeight(0.2),
    },
    location: {
        color: "rgba(255,255,255,0.9)",
        fontSize: responsiveFontSize(1.2),
        marginTop: responsiveHeight(0.4),
    },
    settingsBtn: {
        width: responsiveHeight(5),
        height: responsiveHeight(5),
        borderRadius: responsiveHeight(2.5),
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        right: responsiveWidth(2.2),
        top: responsiveHeight(1.4),
    },
    statsRow: {
        flexDirection: "row",
        marginTop: responsiveHeight(1.6),
        paddingHorizontal: responsiveWidth(0.4),
    },
    statBox: {
        width: responsiveWidth(26),
        backgroundColor: "rgba(255,255,255,0.12)",
        marginRight: responsiveWidth(2),
        paddingVertical: responsiveHeight(1.6),
        borderRadius: responsiveHeight(1.6),
        alignItems: "center",
        justifyContent: "center",
    },
    statNum: {
        color: "#fff",
        fontSize: responsiveFontSize(2),
        fontWeight: "700",
    },
    statLabel: {
        color: "rgba(255,255,255,0.9)",
        fontSize: responsiveFontSize(1.2),
        marginTop: responsiveHeight(0.3),
    },
    sectionTitle: {
        marginTop: responsiveHeight(2),
        marginLeft: responsiveWidth(4),
        fontSize: responsiveFontSize(1.8),
        fontWeight: "600",
        color: "#111827",
    },
    supportItem: {
        marginHorizontal: responsiveWidth(4),
        marginTop: responsiveHeight(1.8),
        paddingVertical: responsiveHeight(2.4),
        paddingHorizontal: responsiveWidth(4),
        borderRadius: responsiveHeight(1.2),
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 3,
    },
    supportText: {
        fontSize: responsiveFontSize(1.6),
        color: "#111827",
    },
});

export default ProfileScreen;