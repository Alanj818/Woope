import {
    View,
    StyleSheet,
    FlatList,
    TextInput,
    Text,
    Pressable,
    Image,
} from "react-native";
import {
    responsiveFontSize,
    responsiveHeight,
    responsiveWidth,
} from "react-native-responsive-dimensions";
import React, { useState } from "react";
import Icon from "react-native-vector-icons/MaterialIcons";
import { searchProfile } from "../../api/community";
import TopNav from "../../components/TopNav";

interface ProfileSearchScreenProps {
    route: any;
    navigation: any;
}

const ProfileSearchScreen: React.FC<ProfileSearchScreenProps> = ({
    route,
    navigation,
}) => {
    const [searchName, setSearchName] = useState({ textString: "" });
    const [searchResults, setSearchResults] = useState([]);
    const [renderSearch, setRenderSearch] = useState(false);

    const navigateToProfile = (user_id: number) => {
        // Navigate directly so the back button works correctly
        navigation.navigate("ProfileScreen", { userID: user_id });
    };

    const handleSearch = async (text: string) => {
        if (text.length < 1) {
            setRenderSearch(false);
            return;
        }

        try {
            const users = await searchProfile(text.replaceAll(" ", ""));
            if (!users) {
                setRenderSearch(false);
            } else {
                setSearchResults(users);
                setRenderSearch(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleTextChange = (text: string) => {
        setSearchName(prev => ({ ...prev, textString: text }));
        handleSearch(text);
    };

    return (
        <View style={styles.container}>
            <TopNav title="Search" showBack onBack={() => navigation.goBack()} />

            <View style={styles.searchBar}>
                <View style={styles.searchInputWrap}>
                    <Icon name="search" size={responsiveWidth(5)} color="grey" />
                    <TextInput
                        style={styles.searchInput}
                        onChangeText={handleTextChange}
                        placeholder="Search for other users"
                        placeholderTextColor="grey"
                        value={searchName.textString}
                    />
                </View>
            </View>

            {renderSearch && (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item: any) => String(item.user_id)}
                    style={{ width: '100%' }}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => navigateToProfile((item as { user_id: number }).user_id)}
                            style={({ pressed }) => [
                                styles.resultItem,
                                pressed && styles.resultItemPressed,
                            ]}
                        >
                            <Image
                                source={
                                    (item as any).image_url
                                        ? { uri: `${process.env.EXPO_PUBLIC_API_URL}${(item as any).image_url}` }
                                        : { uri: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Twitter_default_profile_400x400.png' }
                                }
                                style={styles.avatar}
                                resizeMode="cover"
                            />
                            <Text style={styles.resultName} numberOfLines={1}>
                                {(item as { first_name: string; last_name: string }).first_name}{' '}
                                {(item as { first_name: string; last_name: string }).last_name}
                            </Text>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        flexDirection: 'column',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: responsiveWidth(5),
        paddingTop: responsiveHeight(2),
        paddingBottom: responsiveHeight(1),
    },
    searchInputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'lightgrey',
        borderRadius: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'lightgrey',
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: responsiveWidth(1.5),
        paddingVertical: responsiveHeight(0.5),
        fontSize: responsiveFontSize(2),
        color: '#111',
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: responsiveHeight(1),
        paddingHorizontal: responsiveWidth(5),
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    resultItemPressed: {
        backgroundColor: '#f3f4f6',
    },
    avatar: {
        height: responsiveHeight(5),
        width: responsiveHeight(5),
        borderRadius: responsiveHeight(2.5),
        marginRight: responsiveWidth(3),
    },
    resultName: {
        fontSize: responsiveFontSize(1.8),
        color: '#111827',
        flex: 1,
    },
});

export default ProfileSearchScreen;