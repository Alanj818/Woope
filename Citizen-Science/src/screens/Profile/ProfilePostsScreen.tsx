import React, { useCallback, useContext, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	TouchableOpacity,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from "react-native";
import {
	responsiveFontSize,
	responsiveHeight,
	responsiveWidth,
} from "react-native-responsive-dimensions";
import { useFocusEffect } from "@react-navigation/native";
import { jwtDecode } from "jwt-decode";

import TopNav from "../../components/TopNav";
import { getPostByUserId } from "../../api/posts";
import { AuthContext } from "../../util/AuthContext";
import { AccessToken } from "../../util/token";
import { formatTimeAgo } from "../../util/formatTime";
import LikeButton from "../../components/LikeButton";
import Icon from "react-native-vector-icons/MaterialIcons";
import { getProfile } from "../../api/community";

interface ProfilePostsScreenProps {
	route: any;
	navigation: any;
}

type PostItem = {
	post_id: number;
	content?: string;
	text?: string;
	created_at?: string;
	timestamp?: string;
	userName?: string;
	username?: string;
	likes_count?: number;
	comments?: unknown[];
};

const ProfilePostsScreen: React.FC<ProfilePostsScreenProps> = ({ route, navigation }) => {
	const { userToken, setUserToken } = useContext(AuthContext);
	const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;
	const fallbackUserId = decodedToken ? decodedToken.user_id : NaN;
	const currentUserId = decodedToken ? decodedToken.user_id : NaN;
	const routeUserId = route?.params?.userID;
	const userId = typeof routeUserId === "number" && !isNaN(routeUserId)
		? routeUserId
		: fallbackUserId;

	const [posts, setPosts] = useState<PostItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [profileName, setProfileName] = useState("");

	const fetchPosts = useCallback(async () => {
		if (!userId || isNaN(userId)) {
			setPosts([]);
			setIsLoading(false);
			return;
		}
		setIsLoading(true);
		try {
			const data = await getPostByUserId(userId, setUserToken);
			setPosts(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error("Failed to load user posts", error);
			setPosts([]);
		} finally {
			setIsLoading(false);
		}
	}, [setUserToken, userId]);

	const onRefresh = useCallback(async () => {
		setIsRefreshing(true);
		await fetchPosts();
		setIsRefreshing(false);
	}, [fetchPosts]);

	const fetchProfileName = useCallback(async () => {
		if (!userId || isNaN(userId)) return;
		try {
			const data = await getProfile(userId);
			if (data && data.user) {
				const first = data.user.first_name || "";
				const last = data.user.last_name || "";
				setProfileName(`${first} ${last}`.trim());
			}
		} catch (error) {
			console.error("Failed to load profile name", error);
		}
	}, [userId]);

	useFocusEffect(
		useCallback(() => {
			fetchPosts();
			fetchProfileName();
		}, [fetchPosts, fetchProfileName])
	);

	const renderItem = ({ item }: { item: PostItem }) => {
		const content = item.content || item.text || "";
		const createdAt = item.created_at || item.timestamp || "";
		const name = item.userName || item.username || profileName || "User";
		const likes = typeof item.likes_count === "number" ? item.likes_count : null;
		const commentsCount = Array.isArray(item.comments) ? item.comments.length : null;
		const avatarUrl = (item as { user_avatar_url?: string }).user_avatar_url;

		return (
			<TouchableOpacity
				onPress={() =>
					navigation.navigate("Home", {
						screen: "PostDetail",
						params: { post: item, source: "Profile" },
					})
				}
				activeOpacity={0.7}
			>
				<View style={styles.post}>
					<View style={styles.headerRow}>
						<View style={styles.headerLeft}>
							<Image
								source={{
									uri:
										avatarUrl ||
										"https://upload.wikimedia.org/wikipedia/commons/0/03/Twitter_default_profile_400x400.png",
								}}
								style={styles.avatar}
							/>
							<View style={styles.headerTextContainer}>
								{name ? <Text style={styles.userName}>{name}</Text> : null}
								{createdAt ? (
									<Text style={styles.timestamp}>{formatTimeAgo(createdAt)}</Text>
								) : null}
							</View>
						</View>
					</View>
					{content ? <Text style={styles.postText}>{content}</Text> : null}
					<View style={styles.commentButton}>
						<View style={styles.commentMeta}>
							<Icon name="comment" size={18} color="#007AFF" />
							<Text style={styles.commentCount}>
								{commentsCount ?? 0}
							</Text>
						</View>
						<LikeButton
							postId={item.post_id}
							user_id={currentUserId}
							initialLikesCount={likes ?? 0}
						likedPost={((item as { user_liked?: boolean; likedPost?: boolean }).user_liked ?? (item as { likedPost?: boolean }).likedPost) ?? false}
						/>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<View style={styles.container}>
			<TopNav title="Posts" showBack onBack={() => navigation.goBack()} />
			<FlatList
				data={posts}
				keyExtractor={(item) => item.post_id.toString()}
				renderItem={renderItem}
				contentContainerStyle={styles.listContent}
				refreshControl={
					<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
				}
				ListEmptyComponent={
					isLoading ? (
						<View style={styles.loadingWrap}>
							<ActivityIndicator size="large" color="#0ea5e9" />
						</View>
					) : (
						<Text style={styles.emptyText}>No posts yet</Text>
					)
				}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	listContent: {
		paddingTop: 0,
		paddingBottom: responsiveHeight(1),
		paddingHorizontal: 22,
	},
	post: {
		backgroundColor: "#ffffff",
		paddingVertical: 16,
		paddingHorizontal: 12,
		alignSelf: "stretch",
		width: "100%",
		marginBottom: 0,
		borderBottomWidth: 1,
		borderBottomColor: "#e5e7eb",
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 6,
		justifyContent: "space-between",
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		marginBottom: 0,
		marginRight: 6,
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
	postText: {
		marginBottom: 4,
		color: "#1f2937",
		fontSize: 16,
		lineHeight: 24,
		marginLeft: 56,
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
	commentMeta: {
		flexDirection: "row",
		alignItems: "center",
	},
	commentCount: {
		color: "#6b7280",
		marginLeft: 6,
		marginRight: 8,
		fontSize: 15,
	},
	emptyText: {
		textAlign: "center",
		paddingVertical: responsiveHeight(5),
		color: "#6B7280",
	},
	loadingWrap: {
		paddingTop: responsiveHeight(8),
		alignItems: "center",
		justifyContent: "center",
	},
});

export default ProfilePostsScreen;