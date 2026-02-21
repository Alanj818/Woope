/*

    !! This screen is the main page for the resources tab
    It also features a carousel of featured organizations which when clicked lead directly to their profiles

*/
import React, {useState} from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, StatusBar, FlatList } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getFeaturedOrganizations } from '../../api/organizations';
import { Organization } from '../../api/types';
import FeaturedOrganizationCard from '../../components/FeaturedOrganizationCard';

export const ResourceHome = () => {
    const navigation = useNavigation<any>();
    // fetching featured organizations
    const [data,setData] = useState<Organization[]>([]);
    //"refreshes" once, only when in focus
        useFocusEffect(
            React.useCallback(() => {
                // grabs featured organizations, if any exist
                    fetchFeaturedOrganizations();
            },[])  
        );
    // gets all featured organizations
        const fetchFeaturedOrganizations = async () => {
            try {
                const organizationList = await getFeaturedOrganizations();
                setData(organizationList);
            } catch (error) {
                console.log('Failed to retrieve organizations', error);
            }
        };
        
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                    <Text style={styles.title}>Resources</Text>
                </View>
                {/* Followed Groups Button
                <Pressable onPress={() => navigation.navigate("ManageOrganizations")}> 
                    <View style = {styles.postBox}> 
                        <View style = {styles.postBoxInner}>
                            <Text style={styles.postBoxText}> Manage Groups </Text>
                        </View>
                    </View>
                </Pressable> */}
                {/* Followed Groups Button */}
                <Pressable onPress={() => navigation.navigate("OrganizationFollowed")} style={({pressed})=>[styles.listCard, pressed && styles.pressed]}> 
                    <View style={styles.listCardInner}>
                        <Text style={styles.listCardText}>Followed Groups</Text>
                        <Text style={styles.chevron}>›</Text>
                    </View>
                </Pressable>
                {/* Search Directory Button */}
                <Pressable onPress={() => navigation.navigate("OrganizationSearch")} style={({pressed})=>[styles.listCard, pressed && styles.pressed]}> 
                    <View style={styles.listCardInner}>
                        <Text style={styles.listCardText}>Search Directory</Text>
                        <Text style={styles.chevron}>›</Text>
                    </View>
                </Pressable>
                {/* Search By Category Button */}
                <Pressable onPress={() => navigation.navigate("OrganizationCategory")} style={({pressed})=>[styles.listCard, pressed && styles.pressed]}> 
                    <View style={styles.listCardInner}>
                        <Text style={styles.listCardText}>Search By Category</Text>
                        <Text style={styles.chevron}>›</Text>
                    </View>
                </Pressable>
            {/* only shows if featured organizations is not empty */}
                {/* Container for Featured Group title*/}
                { data[0] && <View style = {styles.featuredContainer}>
                    <Text style={styles.title}> Featured Groups </Text>
                </View>}
                {/* Container for Featured Group Carousel */}
                { data[0] && <FlatList
                data={data}
                numColumns={1}
                horizontal={true}
                keyExtractor={item => String(item.org_id)}
                renderItem={({item})=>(
                    <FeaturedOrganizationCard org_id= {item.org_id} name={item.name} tagline={item.tagline} text_description={item.text_description} image_path={item.image_path}/>
                )}
                />
                }   
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: StatusBar.currentHeight,
        backgroundColor: "white",
    },
    scrollView: {
        backgroundColor: "white",
    },
    title: {
        fontSize: 28,
        color: '#232f46',
    },
    directoryButton: {
        borderRadius: 10,
        padding: 8,
        margin: 12,
        backgroundColor: "lightblue",
        alignItems: "center",
        justifyContent: "center",
        shadowOffset: {
            width: 1,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 9,
    },
    featuredContainer: {
        alignSelf:'center',
        paddingTop: 20,
        paddingBottom: 10,
        marginBottom: 10,
        borderBottomWidth: 2,
        borderColor: 'lightgrey',
    },
    postBox: {
        backgroundColor: "#B4D7EE",
        borderRadius: 30,
        paddingVertical: 20,
        paddingHorizontal: 15,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "stretch",
        marginHorizontal: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E7F3FD",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
        marginTop: 6,
      },
      postBoxInner: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "transparent",
        alignSelf: "stretch",
        borderBottomWidth: 1,
        borderBottomColor: "#D1E3FA",
      },
      postBoxText: {
        fontSize: 16,
        color: "#333",
        padding: 10,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        overflow: "hidden",
        textAlign: "center",
      }
    ,

    listCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 18,
        marginHorizontal: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#DCEFFE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.09,
        shadowRadius: 6,
        elevation: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    /* left accent stripe */
    listAccent: {
        width: 6,
        backgroundColor: '#4A90E2',
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
        marginRight: 12,
        height: '100%'
    },
    listCardText: {
        fontSize: 18,
        color: '#0D2538',
        textAlign: 'left',
        flex: 1,
        paddingLeft: 4,
    },
    pressed: {
        opacity: 0.85,
        transform: [{ scale: 0.997 }],
    }
    ,
    /* header replaced with shared ScreenHeader component for consistent top bar (maybe we can change this later) */
    /* searchBar removed to match app design */
    listCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
    },
    chevron: {
        color: '#4A90E2',
        fontSize: 22,
        paddingLeft: 8,
    }
});
export default ResourceHome;