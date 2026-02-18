import {
	View,
	StyleSheet,
	FlatList,
	TextInput,
	Text,
	Pressable,
	Image,
	TouchableOpacity,
} from "react-native";
import {
	responsiveFontSize,
	responsiveHeight,
	responsiveWidth,
} from "react-native-responsive-dimensions";
import { ScrollView } from 'react-native';
import React, { useState, useContext } from "react";
import Icon from "react-native-vector-icons/MaterialIcons";
import TopNav from '../components/TopNav';
import { usePalette } from '../theme/paletteController';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from "../util/AuthContext";
import { jwtDecode } from "jwt-decode";
import { getAllPosts } from "../api/posts";
import { AccessToken } from "../util/token";
import { searchProfile } from "../api/community";

interface ProfileSearchScreenProps {
	route: any;
	navigation: any;
}

const ProfileSearchScreen: React.FC<ProfileSearchScreenProps> = ({
	route,
	navigation,
}) => {
	const [searchName, setSearchName] = useState({
		textString: "",
	});

	const [searchResults, setSearchResults] = useState([]);
	const [searchUsers, setSearchUsers] = useState<any[]>([]);
	const [searchPosts, setSearchPosts] = useState<any[]>([]);
	const [renderSearch, setRenderSearch] = useState(false);
	const [selectedFilter, setSelectedFilter] = useState<string>('All');

	// auth context so we can fetch posts if needed
	const { userToken, setUserToken } = useContext(AuthContext);
	const decodedToken = userToken ? jwtDecode<AccessToken>(userToken) : null;
	const userId = decodedToken ? decodedToken.user_id : NaN;

	const { theme } = usePalette();

	// Clear search only when entering Search fresh from outside (not preserving from PostDetail)
	useFocusEffect(
		React.useCallback(() => {
			const params = route.params as any;
			const shouldPreserve = params?.preserveSearch;
			if (!shouldPreserve) {
				setSearchName({ textString: "" });
				setSearchUsers([]);
				setSearchPosts([]);
				setRenderSearch(false);
				setSelectedFilter('All');
			}
		}, [route.params])
	);

	{
		/* Navigates to the searched profile */
	}
	const navigateToProfile = (user_id: number) => {
		navigation.navigate("ProfileScreenSearchNav", {
			screen: "ProfileScreen",
			params: { userID: user_id },
		});
	};

	{
		/* Calls the searchProfile api and handles rendering of results */
	}
	const handleSearch = async (text: string) => {
		const q = (text || "").trim();
		if (q.length < 1) {
			setRenderSearch(false);
			setSearchUsers([]);
			setSearchPosts([]);
			return;
		}

		try {
			// search users via existing API
			const users = await searchProfile(q.replaceAll(" ", ""));
			setSearchUsers(users || []);

			// fetch posts and filter locally (fallback if no server-side search endpoint)
			try {
				const postsList = await getAllPosts(userId, setUserToken);
				const qLower = q.toLowerCase();
				const matchedPosts = (postsList || []).filter((p: any) => {
					const content = (p.content || "").toLowerCase();
					const title = (p.title || "").toLowerCase();
					return content.includes(qLower) || title.includes(qLower);
				});
				setSearchPosts(matchedPosts);
			} catch (err) {
				console.warn("Post search failed, skipping posts:", err);
				setSearchPosts([]);
			}

			setRenderSearch(true);
		} catch (error) {
			console.error(error);
		}
	};

	{
		/* Will attempt search on each keypress */
	}
	const handleTextChange = (text: string) => {
		setSearchName((prevState) => ({ ...prevState, textString: text }));
		handleSearch(text);
	};

	const fetchAllUsers = async () => {
		try {
			const users = await searchProfile('');
			setSearchUsers(users || []);
			setSearchPosts([]);
			setRenderSearch(true);
		} catch (err) {
			console.error('Failed to fetch users:', err);
		}
	};

	const onSelectFilter = (filter: string) => {
		setSelectedFilter(filter);
		const hasQuery = (searchName.textString || '').trim().length > 0;
		if (filter === 'Users') {
			if (hasQuery) {
				setRenderSearch(true);
			} else {
				fetchAllUsers();
			}
		} else if (filter === 'All') {
			if (hasQuery) {
				setRenderSearch(true);
			} else {
				setRenderSearch(false);
				setSearchUsers([]);
				setSearchPosts([]);
			}
		} else {
			if (hasQuery) {
				setRenderSearch(true);
			}
		}
	};

	return (
		<View style={styles.container}>
			{/* Top navigation with gradient */}
			<TopNav title="Search" showBack={true} onBack={() => navigation.goBack()} />

			{/* Search input + chips */}
			<View style={styles.searchWrapper}>
				<View style={styles.largeSearch}>
					<Icon name="search" size={22} color="#9CA3AF" />
					<TextInput
						style={styles.largeSearchInput}
						placeholder="Search users, posts, topics..."
						placeholderTextColor="#9CA3AF"
						onChangeText={(text) => handleTextChange(text)}
						value={searchName.textString}
					/>
				</View>

				{/* Chips */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.chipsRow}
					contentContainerStyle={styles.chipsRowContent}
				>
					{["All", "Users", "Posts", "Organizations", "Events"].map((c) => (
						<Pressable
							key={c}
							onPress={() => onSelectFilter(c)}
							style={[
								styles.chip,
								selectedFilter === c && { backgroundColor: theme.main, borderColor: theme.main },
							]}
						>
							<Text style={[styles.chipText, selectedFilter === c && styles.chipTextActive]}>{c}</Text>
						</Pressable>
					))}
				</ScrollView>
			</View>

			{/* Results (shown when searching) or Users list when Users filter selected */}
		{renderSearch && (
			<View style={styles.resultsSection}>
				{(selectedFilter === 'All' || selectedFilter === 'Users') && searchUsers.length > 0 && (
						<FlatList
							data={searchUsers}
							keyExtractor={(u: any) => String(u.user_id)}
							renderItem={({ item }) => (
							<Pressable
								style={styles.resultUser}
								onPress={() => navigateToProfile((item as any).user_id)}
							>
								<Image
									source={
										(item as any).image_url
											? { uri: `${process.env.EXPO_PUBLIC_API_URL}${(item as any).image_url}` }
											: { uri: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Twitter_default_profile_400x400.png' }
									}
									style={styles.resultAvatar}
									resizeMode="cover"
								/>
								<Text style={styles.resultUserName}>{(item as any).first_name} {(item as any).last_name}</Text>
							</Pressable>
							)}
						/>
					)}

					{(selectedFilter === 'All' || selectedFilter === 'Posts') && searchPosts.length > 0 && (
						<FlatList
							data={searchPosts}
							keyExtractor={(p: any) => String(p.post_id)}
							renderItem={({ item }) => (
							<Pressable
								style={styles.trendingCard}
								onPress={() => navigation.navigate('PostDetail', { post: item, source: 'Search' })}
							>
								<Text style={styles.trendingTitle}>{(item as any).content ? (item as any).content.substring(0, 80) + '...' : 'Post'}</Text>
								<Text style={styles.trendingCount}>{(item as any).likes_count || 0} likes • {(item as any).comments_count || 0} comments</Text>
							</Pressable>
							)}
						/>
					)}

					{searchUsers.length === 0 && searchPosts.length === 0 && (
						<Text style={{ padding: 20, color: '#666' }}>No results</Text>
					)}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "flex-start",
		backgroundColor: "#FFFFFF",
		flexDirection: "column",
	},
	header: {
		width: responsiveWidth(100),
		height: responsiveHeight(8),
		backgroundColor: "#4F46E5",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
		paddingTop: responsiveHeight(1.2),
	},
	backCircle: {
		position: "absolute",
		left: responsiveWidth(4),
		top: responsiveHeight(1.2),
		height: 44,
		width: 44,
		borderRadius: 22,
		backgroundColor: "rgba(255, 255, 255, 0.2)",
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		color: "white",
		fontSize: responsiveFontSize(2.2),
		fontWeight: "700",
		position: 'absolute',
		left: responsiveWidth(18),
		top: responsiveHeight(2.2),
	},
	searchWrapper: {
		width: responsiveWidth(92),
		alignSelf: "center",
		marginTop: responsiveHeight(3.5),
	},
	largeSearch: {
		width: "100%",
		height: responsiveHeight(6.5),
		backgroundColor: "white",
		borderRadius: 14,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 14,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 4,
	},
	largeSearchInput: {
		flex: 1,
		height: "100%",
		fontSize: responsiveFontSize(2),
		color: "#333",
		paddingHorizontal: 12,
	},
	chipsRow: {
		flexDirection: "row",
		marginTop: responsiveHeight(2.2),
		flexWrap: 'nowrap',
	},
	chipsRowContent: {
		justifyContent: "flex-start",
		alignItems: "center",
		paddingLeft: responsiveWidth(1.5),
		paddingRight: responsiveWidth(3),
	},
	chip: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		paddingVertical: responsiveHeight(1.1),
		paddingHorizontal: responsiveWidth(3),
		marginRight: responsiveWidth(2.5),
		borderWidth: 1,
		borderColor: 'rgba(0,0,0,0.04)',
	},
	chipActive: {
		backgroundColor: "#4F46E5",
		borderColor: '#4F46E5',
	},
	chipText: {
		color: "#374151",
		fontSize: responsiveFontSize(1.9),
		fontWeight: '600',
	},
	chipTextActive: {
		color: "white",
	},
	trendingSection: {
		width: responsiveWidth(92),
		alignSelf: "center",
		marginTop: responsiveHeight(2.2),
	},
	trendingHeaderText: {
		color: "#333",
		fontSize: responsiveFontSize(2.2),
		fontWeight: "bold",
		marginBottom: 10,
	},
	trendingCard: {
		backgroundColor: "white",
		borderRadius: 12,
		paddingVertical: responsiveHeight(2.2),
		paddingHorizontal: responsiveWidth(4),
		marginBottom: responsiveHeight(1.6),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 3,
		elevation: 2,
	},
	trendingTitle: {
		color: "#333",
		fontSize: responsiveFontSize(2),
		fontWeight: "bold",
	},
	trendingCount: {
		color: "#666",
		fontSize: responsiveFontSize(1.8),
		marginTop: 6,
	},
	resultsSection: {
		width: responsiveWidth(92),
		alignSelf: "center",
		marginTop: responsiveHeight(2.2),
	},
	resultUser: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: responsiveHeight(1.5),
		paddingHorizontal: responsiveWidth(3),
		backgroundColor: "white",
		borderRadius: 10,
		marginBottom: responsiveHeight(1),
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 3,
		elevation: 2,
	},
	resultAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 10,
	},
	resultUserName: {
		color: "#333",
		fontSize: responsiveFontSize(2),
		fontWeight: "500",
	},
});

export default ProfileSearchScreen;
