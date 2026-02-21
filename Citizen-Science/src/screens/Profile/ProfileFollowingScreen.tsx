import React, { useCallback, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	Pressable,
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
import { getFollowing } from "../../api/community";
import { getOrganizationsFollowed } from "../../api/organizations";
import { Organization } from "../../api/types";
import TopNav from "../../components/TopNav";
import { LinearGradient } from "expo-linear-gradient";

interface ProfileFollowingScreenProps {
	route: any;
	navigation: any;
}

const ProfileFollowingScreen: React.FC<ProfileFollowingScreenProps> = ({
	route,
	navigation,
}) => {
	const { userID } = route.params;

	const [isLoadingUsers, setIsLoadingUsers] = useState(true);
	const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
	const [userResults, setUserResults] = useState([]);
	const [orgResults, setOrgResults] = useState<Organization[]>([]);
	const [activeTab, setActiveTab] = useState<"organizations" | "users">(
		"organizations"
	);

	const getInitials = (value?: string) => {
		if (!value) return "";
		const parts = value.trim().split(/\s+/);
		if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
		return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
	};

	const navigateToProfile = (user_id: number) => {
		navigation.push("ProfileScreen", { userID: user_id });
	};

	const fetchFollowing = useCallback(() => {
		setIsLoadingUsers(true);
		getFollowing(userID)
			.then((data) => {
				setUserResults(data || []);
			})
			.catch((error) => {
				setUserResults([]);
				console.error("Error: ", error);
			})
			.finally(() => setIsLoadingUsers(false));
	}, [userID]);

	const fetchOrganizations = useCallback(() => {
		setIsLoadingOrgs(true);
		getOrganizationsFollowed(userID)
			.then((data) => {
				setOrgResults(data || []);
			})
			.catch((error) => {
				setOrgResults([]);
				console.error("Error: ", error);
			})
			.finally(() => setIsLoadingOrgs(false));
	}, [userID]);

	useFocusEffect(fetchFollowing);
	useFocusEffect(fetchOrganizations);

	return (
		<View style={styles.container}>
			<TopNav title="Following" showBack onBack={() => navigation.goBack()} />
			<View style={styles.tabRow}>
				<Pressable
					style={({ pressed }) => [
						styles.tabButtonWrapper,
						pressed && styles.tabButtonPressed,
					]}
					onPress={() => setActiveTab("organizations")}
				>
					{activeTab === "organizations" ? (
						<LinearGradient
							colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.tabButton}
						>
							<Text style={[styles.tabText, styles.tabTextActive]}>
								Organizations
							</Text>
						</LinearGradient>
					) : (
						<View style={[styles.tabButton, styles.tabButtonInactive]}>
							<Text style={styles.tabText}>Organizations</Text>
						</View>
					)}
				</Pressable>
				<Pressable
					style={({ pressed }) => [
						styles.tabButtonWrapper,
						pressed && styles.tabButtonPressed,
					]}
					onPress={() => setActiveTab("users")}
				>
					{activeTab === "users" ? (
						<LinearGradient
							colors={["rgba(0,132,209,1)", "rgba(0,146,184,1)"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							style={styles.tabButton}
						>
							<Text style={[styles.tabText, styles.tabTextActive]}>
								Users
							</Text>
						</LinearGradient>
					) : (
						<View style={[styles.tabButton, styles.tabButtonInactive]}>
							<Text style={styles.tabText}>Users</Text>
						</View>
					)}
				</Pressable>
			</View>
			<View style={styles.listWrap}>
				{activeTab === "organizations" && (
					<FlatList
						contentContainerStyle={styles.listContent}
						data={orgResults}
						showsVerticalScrollIndicator={false}
						refreshControl={
							<RefreshControl
								refreshing={isLoadingOrgs}
								onRefresh={fetchOrganizations}
							/>
						}
						ListEmptyComponent={
							isLoadingOrgs ? (
								<View style={styles.loadingWrap}>
									<ActivityIndicator size="large" color="lightblue" />
								</View>
							) : (
								<Text style={styles.emptyText}>No organizations followed</Text>
							)
						}
						renderItem={({ item }) => (
							<Pressable
									onPressOut={() =>
									navigation.navigate("Resources", {
										screen: "OrganizationProfile",
										params: {
											org_id: item.org_id,
										},
									})
								}
								style={({ pressed }) => [
									styles.card,
									pressed && styles.cardPressed,
								]}
							>
								<View style={styles.cardHeaderRow}>
									<View style={styles.avatarCircle}>
										{item.image_path ? (
											<Image
												source={{
													uri: `${process.env.EXPO_PUBLIC_API_URL}${item.image_path}`,
												}}
												style={styles.avatarImage}
											/>
										) : (
											<Text style={styles.avatarInitials}>
												{getInitials(item.name)}
											</Text>
										)}
									</View>
									<View style={styles.cardTitleBlock}>
										<Text style={styles.cardTitle} numberOfLines={1}>
											{item.name}
										</Text>
										{item.tagline ? (
											<Text style={styles.cardSubtitle} numberOfLines={1}>
												{item.tagline}
											</Text>
										) : null}
									</View>
								</View>
								{item.text_description ? (
									<Text style={styles.cardBody} numberOfLines={2}>
										{item.text_description}
									</Text>
								) : null}
							</Pressable>
						)}
					/>
				)}
				{activeTab === "users" && (
					<FlatList
						contentContainerStyle={styles.listContent}
						data={userResults}
						showsVerticalScrollIndicator={false}
						refreshControl={
							<RefreshControl
								refreshing={isLoadingUsers}
								onRefresh={fetchFollowing}
							/>
						}
						ListEmptyComponent={
							isLoadingUsers ? (
								<View style={styles.loadingWrap}>
									<ActivityIndicator size="large" color="lightblue" />
								</View>
							) : (
								<Text style={styles.emptyText}>No users followed</Text>
							)
						}
						renderItem={({ item }) => (
							<Pressable
								onPressOut={() =>
									navigateToProfile((item as { user_id: number }).user_id)
								}
								style={({ pressed }) => [
									styles.card,
									pressed && styles.cardPressed,
								]}
							>
								<View style={styles.cardHeaderRow}>
									<View style={styles.avatarCircle}>
										<Image
											source={
												(item as { image_url?: string }).image_url
													? {
															uri: `${process.env.EXPO_PUBLIC_API_URL}${(item as { image_url: string }).image_url}`,
													  }
													: {
															uri: "https://upload.wikimedia.org/wikipedia/commons/0/03/Twitter_default_profile_400x400.png",
													  }
											}
											style={styles.avatarImage}
										/>
									</View>
									<View style={styles.cardTitleBlock}>
										<Text style={styles.cardTitle} numberOfLines={1}>
											{(item as { first_name: string; last_name: string }).first_name}{" "}
											{(item as { first_name: string; last_name: string }).last_name}
										</Text>
										{(item as { org_name?: string; email?: string }).org_name ? (
											<Text style={styles.cardSubtitle} numberOfLines={1}>
												{(item as { org_name: string }).org_name}
											</Text>
										) : (item as { email?: string }).email ? (
											<Text style={styles.cardSubtitle} numberOfLines={1}>
												{(item as { email: string }).email}
											</Text>
										) : null}
									</View>
								</View>
							</Pressable>
						)}
					/>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8fafc",
	},
	tabRow: {
		flexDirection: "row",
		width: responsiveWidth(100),
		paddingHorizontal: responsiveWidth(3),
		paddingTop: responsiveHeight(1),
		paddingBottom: responsiveHeight(0.5),
		backgroundColor: "#f8fafc",
	},
	tabButtonWrapper: {
		flex: 1,
		marginHorizontal: responsiveWidth(1),
	},
	tabButton: {
		paddingVertical: responsiveHeight(1),
		borderRadius: 12,
		alignItems: "center",
	},
	tabButtonInactive: {
		backgroundColor: "#e5e7eb",
	},
	tabButtonPressed: {
		opacity: 0.8,
	},
	tabText: {
		fontWeight: "600",
		color: "#334155",
	},
	tabTextActive: {
		color: "#ffffff",
	},
	listWrap: {
		flex: 1,
		width: responsiveWidth(100),
	},
	listContent: {
		paddingHorizontal: responsiveWidth(3),
		paddingVertical: responsiveHeight(1),
		gap: responsiveHeight(1),
	},
	card: {
		backgroundColor: "#ffffff",
		borderRadius: 16,
		padding: responsiveHeight(1.6),
		borderWidth: 1,
		borderColor: "#e5e7eb",
		shadowColor: "#0f172a",
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
		elevation: 4,
	},
	cardPressed: {
		transform: [{ scale: 0.995 }],
	},
	cardHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: responsiveWidth(3),
	},
	avatarCircle: {
		width: responsiveHeight(5.2),
		height: responsiveHeight(5.2),
		borderRadius: responsiveHeight(2.6),
		backgroundColor: "#0ea5e9",
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	avatarImage: {
		width: "100%",
		height: "100%",
		resizeMode: "cover",
	},
	avatarInitials: {
		color: "#ffffff",
		fontWeight: "700",
		fontSize: responsiveFontSize(2),
	},
	cardTitleBlock: {
		flex: 1,
	},
	cardTitle: {
		fontSize: responsiveFontSize(2.1),
		fontWeight: "700",
		color: "#0f172a",
	},
	cardSubtitle: {
		fontSize: responsiveFontSize(1.6),
		color: "#64748b",
		marginTop: 2,
	},
	cardBody: {
		marginTop: responsiveHeight(1),
		fontSize: responsiveFontSize(1.6),
		color: "#475569",
	},
	emptyText: {
		textAlign: "center",
		paddingVertical: responsiveHeight(4),
		color: "#6B7280",
	},
	loadingWrap: {
		paddingTop: responsiveHeight(8),
		alignItems: "center",
		justifyContent: "center",
	},
});

export default ProfileFollowingScreen;
